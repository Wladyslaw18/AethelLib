import { world, system, CustomCommandStatus, CustomCommandParamType } from "@minecraft/server";
import { Kernel } from "../Kernel.js";

/**
 * COMMAND_MANAGER_V3_GHOST_NEXUS
 * Hardened for Bedrock 2.7.0-beta + Legacy "!" compatibility.
 * 
 * PHILOSOPHY: Decouple input vectors from execution logic. Establish 
 * O(1) alias-resolution and provide a high-performance execution 
 * bridge for both native and legacy command-streams.
 */
export const CommandManager = {
    _initialized: false,
    _prefix: "!",
    _primaryNS: "ae",
    _aliasNS: "ael",
    _aliasMap: new Map(), // O(1) ALIAS_RESOLUTION_MAP

    init() {
        if (this._initialized) return;
        this._initialized = true;

        // 🛑 LEGACY_CHAT_VECTOR: The "!" Prefix Hack
        // @ts-ignore - Property exists in 1.26.20 runtime but is missing in 1.26.30 preview types.
        world.beforeEvents.chatSend.subscribe((ev) => this._interceptLegacyChat(ev));

        // 🚀 NATIVE_BETA_VECTOR: Custom Registry Handshake
        system.beforeEvents.startup.subscribe((ev) => this._injectNativeRegistry(ev));

        console.log(`[CommandManager] NEXUS_ONLINE | Prefix: ${this._prefix} | NS: ${this._primaryNS}`);
    },

    /**
     * REBUILD_ALIAS_INDEX
     * Flattens all command aliases into a high-speed lookup map.
     */
    refreshAliases() {
        const Registry = Kernel.get("commandRegistry");
        if (!Registry) return;

        this._aliasMap.clear();
        const allNames = Registry.getAll();
        
        for (const name of allNames) {
            const cmd = Registry.get(name);
            if (cmd.aliases && Array.isArray(cmd.aliases)) {
                for (const alias of cmd.aliases) {
                    this._aliasMap.set(alias.toLowerCase(), name.toLowerCase());
                }
            }
        }
    },

    /**
     * NATIVE_REGISTRY_INJECTION
     * Injects logic into the /ae: and /ael: namespaces.
     */
    _injectNativeRegistry(event) {
        const Registry = Kernel.get("commandRegistry");
        const nativeReg = event.customCommandRegistry;
        if (!Registry || !nativeReg) return;

        Registry.getAll().forEach(name => {
            const def = Registry.get(name);
            
            // Build Industrial Config with Typed Parameters
            const config = {
                name: `${this._primaryNS}:${def.name}`,
                description: def.description || "AethelLib Vector",
                permissionLevel: this._mapPerms(def.permission),
                mandatoryParameters: this._deriveParams(def.parameters, false),
                optionalParameters: this._deriveParams(def.parameters, true)
            };

            // Register Primary (e.g., /ae:heal)
            this._registerSingle(nativeReg, config, def);
            
            // Register Alias Namespace (e.g., /ael:h)
            if (def.aliases) {
                def.aliases.forEach(alias => {
                    const aliasConfig = { ...config, name: `${this._aliasNS}:${alias}` };
                    this._registerSingle(nativeReg, aliasConfig, def);
                });
            }
        });

        console.log(`[CommandManager] NATIVE_REGISTRY_INJECTED | Namespaces: /${this._primaryNS}:, /${this._aliasNS}:`);
    },

    /**
     * PARAMETER_DERIVATION_ENGINE
     * Translates industrial metadata into native parameter types.
     */
    _deriveParams(params, isOptional) {
        if (!params || !Array.isArray(params)) return [];
        return params
            .filter(p => !!p.optional === isOptional)
            .map(p => ({
                name: p.name,
                type: this._mapParamType(p.type)
            }));
    },

    _mapParamType(type) {
        switch(type?.toLowerCase()) {
            case "player": return CustomCommandParamType.PlayerSelector;
            case "int": return CustomCommandParamType.Integer;
            case "string": return CustomCommandParamType.String;
            case "bool": return CustomCommandParamType.Boolean;
            default: return CustomCommandParamType.String;
        }
    },

    _registerSingle(registry, config, def) {
        try {
            registry.registerCommand(config, (origin, ...args) => {
                this._dispatch(origin.sourceEntity, def, args, "NATIVE");
                return { status: CustomCommandStatus.Success };
            });
        } catch (e) {
            // Collision handled by engine or logged if critical
        }
    },

    /**
     * LEGACY_CHAT_INTERCEPTOR
     * The classic "!" prefix logic. Hard-cancelled to prevent chat leakage.
     */
    _interceptLegacyChat(event) {
        const msg = event.message.trim();
        if (!msg.startsWith(this._prefix)) return;

        // 🛑 ABSOLUTE_CANCELLATION: Prevent any industrial leakage to public chat.
        event.cancel = true; 

        const args = msg.slice(this._prefix.length).split(/\s+/);
        const rawTrigger = args.shift()?.toLowerCase();
        if (!rawTrigger) return;

        // Resolve Alias -> Primary Command Name
        const targetName = this._aliasMap.get(rawTrigger) ?? rawTrigger;
        const cmd = Kernel.get("commandRegistry").get(targetName);

        if (!cmd) {
            event.sender.sendMessage(`§cERROR: UNKNOWN_AETHEL_VECTOR: '${rawTrigger}'`);
            return;
        }

        // AUTH_VALIDATION_GATE
        if (!this._checkAuth(event.sender, cmd.permission)) {
            event.sender.sendMessage(`§cSECURITY_FAILURE: CLEARANCE_LEVEL_INADEQUATE`);
            return;
        }

        // TEMPORAL_ESCAPE_ORCHESTRATION
        // system.run() used to bypass read-only before-event context.
        system.run(() => {
            this._dispatch(event.sender, cmd, args, "LEGACY");
        });
    },

    /**
     * UNIFIED_DISPATCH_BRIDGE
     * Polymorphic execution bridge for both .execute() and callback patterns.
     */
    _dispatch(player, cmd, args, vector) {
        try {
            if (typeof cmd.execute === "function") {
                // Pipe to standard execute method with 3-arg signature
                cmd.execute(null, player, args);
            } else if (typeof cmd.callback === "function") {
                // Pipe to modern callback method with Origin object
                const origin = { sourceEntity: player, sourceType: "Entity", vector };
                cmd.callback(origin, args);
            }
        } catch (e) {
            console.error(`[CommandManager] DISPATCH_CRASH [${cmd.name}]: ${e}`);
            player.sendMessage(`§cFATAL_ERROR: VECTOR_COLLAPSE_DETECTED`);
        }
    },

    /**
     * CLEARANCE_LEVEL_VALIDATION
     */
    _checkAuth(player, perm) {
        const PM = Kernel.get("permissions");
        if (!PM) return player.hasTag("admin");
        return PM.hasPermission(player, perm);
    },

    /**
     * NATIVE_PERMISSION_MAPPER
     * Maps industrial permission nodes to primitive 0-4 levels.
     */
    _mapPerms(perm) {
        if (!perm) return 0;
        if (perm.includes("admin")) return 2;
        if (perm.includes("owner") || perm.includes("manage")) return 4;
        return 0;
    }
};
