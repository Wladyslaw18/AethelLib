import { Kernel } from "../Kernel.js";
import { PlayerUtils } from "../../utils/PlayerUtils.js";


/**
 * Manages custom command registration and dispatch.
 * Uses the native custom command registry to avoid chat listener lag.
 */
export const CommandManager = {
    _initialized: false,
    _primaryNS: "ae",
    _aliasNS: "ae", 

    init() {
        if (this._initialized) return;
        this._initialized = true;

        // Hook into the startup event to register commands
        Kernel.system.beforeEvents.startup.subscribe((ev) => this._injectNativeRegistry(ev));

        console.log(`[CommandManager] Registry online. Namespace: /${this._primaryNS}:`);
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
            const cmdName = name.startsWith("ae:") ? name.split(":")[1] : name;
            
            //  CATCH-ALL_PARAMETER_PROTOCOL
            const mandatory = this._deriveParams(def.parameters, false);
            let optional = this._deriveParams(def.parameters, true);

            if (!def.parameters || def.parameters.length === 0) {
                optional = [
                    { name: "arg1", type: Kernel.CustomCommandParamType.String },
                    { name: "arg2", type: Kernel.CustomCommandParamType.String },
                    { name: "arg3", type: Kernel.CustomCommandParamType.String },
                    { name: "arg4", type: Kernel.CustomCommandParamType.String },
                    { name: "arg5", type: Kernel.CustomCommandParamType.String }
                ];
            }

            // Build Primary Config (e.g., /ae:teleport_ask)
            const config = {
                name: `${this._primaryNS}:${cmdName}`,
                description: def.description || "Aethelgrad Essential Command",

                permissionLevel: this._mapPerms(def.permission),
                mandatoryParameters: mandatory,
                optionalParameters: optional
            };

            this._registerSingle(nativeReg, config, def);
            
            // 🚀 FAST_TYPING_ALIASES
            if (def.aliases && Array.isArray(def.aliases)) {
                def.aliases.forEach(alias => {
                    // Only register alias if it's different from the primary name
                    if (alias === cmdName) return;
                    
                    const aliasConfig = { 
                        ...config, 
                        name: `${this._aliasNS}:${alias}` 
                    };
                    this._registerSingle(nativeReg, aliasConfig, def);
                });
            }
        });

        console.log(`[CommandManager] NATIVE_REGISTRY_INJECTED`);
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
            case "player": return Kernel.CustomCommandParamType.String; 
            case "int": return Kernel.CustomCommandParamType.Integer;
            case "string": return Kernel.CustomCommandParamType.String;
            case "bool": return Kernel.CustomCommandParamType.Boolean;
            default: return Kernel.CustomCommandParamType.String;
        }
    },

    _registerSingle(registry, config, def) {
        try {
            registry.registerCommand(config, (origin, ...args) => {
                this._dispatch(origin.sourceEntity, def, args, "NATIVE");
                return { status: Kernel.CustomCommandStatus.Success };
            });
        } catch (e) {
            console.error(`[CommandManager] REGISTRATION_FAILURE [${config.name}]: ${e}`);
        }
    },

    /**
     * UNIFIED_DISPATCH_BRIDGE
     */
    _dispatch(player, cmd, args, vector) {
        try {
            // 🚀 UNIVERSAL_COOLDOWN_CHECK
            const PM = Kernel.get("permissions");
            const cooldownSec = PM ? (PM.hasPermission(player, "command.cooldown") ?? 0) : 0;
            
            if (cooldownSec > 0) {
                const now = Kernel.system.currentTick;
                const last = player.getDynamicProperty("ae:last_cmd_tick") ?? 0;
                const diff = now - Number(last);
                
                if (diff < cooldownSec * 20) {
                    const remaining = Math.ceil((cooldownSec * 20 - diff) / 20);
                    player.sendMessage(`§c§l» §7Slow down! Wait §e${remaining}s §7before using another command.`);
                    return;
                }

                player.setDynamicProperty("ae:last_cmd_tick", now);
            }

            // SMART_PARAMETER_RESOLUTION
            const cleanArgs = args.filter(a => a !== undefined).map((arg, index) => {
                const paramDef = cmd.parameters ? cmd.parameters[index] : null;
                
                // If it's already an object (from native selector), use it
                if (typeof arg === "object") {
                    if (arg.name && paramDef?.type === "string") return arg.name;
                    return arg;
                }

                const strArg = String(arg);

                // Auto-resolve players if expected
                if (paramDef?.type?.toLowerCase() === "player") {
                    return this._resolvePlayer(strArg) || strArg;
                }

                return strArg;
            });

            Kernel.system.run(() => {
                if (typeof cmd.execute === "function") {
                    cmd.execute(null, player, cleanArgs);
                } else if (typeof cmd.callback === "function") {
                    const origin = { sourceEntity: player, sourceType: "Entity", vector };
                    cmd.callback(origin, cleanArgs);
                }
            });
        } catch (e) {
            console.error(`[CommandManager] Dispatch error [${cmd.name}]: ${e}`);
            player.sendMessage(`§cAn error occurred while executing the command.`);
        }
    },

    /**
     * Resolves a string to a player object using fuzzy matching
     */
    _resolvePlayer(query) {
        return PlayerUtils.findPlayer(query);
    },



    /**
     * CLEARANCE_LEVEL_VALIDATION
     */
    _checkAuth(player, perm) {
        if (!perm) return true; // Public Vector
        const PM = Kernel.get("permissions");
        if (!PM) return player.hasTag("admin");
        return PM.hasPermission(player, perm);
    },

    /**
     * NATIVE_PERMISSION_MAPPER
     * Maps industrial permission nodes to primitive 0-4 levels.
     */
    _mapPerms(perm) {
        if (!perm) return Kernel.CommandPermissionLevel.Any;
        if (perm.includes("admin")) return Kernel.CommandPermissionLevel.Admin;
        if (perm.includes("owner") || perm.includes("manage")) return Kernel.CommandPermissionLevel.Owner;
        return Kernel.CommandPermissionLevel.Any;
    },

    // Legacy support for bootstrap
    refreshAliases() {}
};

