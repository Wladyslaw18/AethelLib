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

        console.log(`[CommandManager] Registry online. Primary Namespace: /${this._primaryNS}:`);
    },

    /**
     * NATIVE_REGISTRY_INJECTION
     * Maps the modular registry into the native Bedrock command engine.
     */
    _injectNativeRegistry(event) {
        const Registry = Kernel.get("commandRegistry");
        const nativeReg = event.customCommandRegistry;
        if (!Registry || !nativeReg) return;

        Registry.getAll().forEach(name => {
            const def = Registry.get(name);
            
            // SMART_NAMESPACE_PARSING
            // If the command already has a namespace (e.g., "plugin:cmd"), we preserve it.
            // Otherwise, we default to the primary system namespace.
            let finalName = name;
            if (!name.includes(":")) {
                finalName = `${this._primaryNS}:${name}`;
            }

            const config = {
                name: finalName,
                description: def.description || "Aethelgrad Command Vector",
                permissionLevel: this._mapPerms(),
                mandatoryParameters: this._deriveParams(def.parameters, false),
                optionalParameters: this._deriveParams(def.parameters, true)
            };

            // Fallback for commands with no parameters defined
            if (config.mandatoryParameters.length === 0 && config.optionalParameters.length === 0) {
                config.optionalParameters = [
                    { name: "args", type: Kernel.CustomCommandParamType.String }
                ];
            }

            this._registerSingle(nativeReg, config, def);
            
            // 🚀 FAST_TYPING_ALIASES
            if (def.aliases && Array.isArray(def.aliases)) {
                def.aliases.forEach(alias => {
                    const aliasName = alias.includes(":") ? alias : `${this._aliasNS}:${alias}`;
                    if (aliasName === finalName) return;
                    
                    this._registerSingle(nativeReg, { ...config, name: aliasName }, def);
                });
            }
        });

        console.log(`[CommandManager] GHOST_REGISTRY_SYNC_COMPLETE`);
    },

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
            case "player": return Kernel.CustomCommandParamType.PlayerSelector; 
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
            console.error(`[CommandManager] FAILED_INJECTION [${config.name}]: ${e}`);
        }
    },

    /**
     * UNIFIED_DISPATCH_BRIDGE
     */
    _dispatch(player, cmd, args, vector) {
        if (!player) return;

        try {
            // 🛡️ SECURITY_&_COOLDOWN_LAYER
            const PM = Kernel.get("permissions");
            
            // Permission check
            if (!this._checkAuth(player, cmd.permission)) {
                player.sendMessage(`§c§l» §7You lack the clearance level for this vector.`);
                return;
            }

            // Cooldown logic
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

            // 🧠 INTELLIGENT_ARGUMENT_RESOLVER
            const cleanArgs = args.filter(a => a !== undefined).map((arg, index) => {
                const paramDef = cmd.parameters ? cmd.parameters[index] : null;
                
                // If Bedrock parsed an entity or object
                if (typeof arg === "object" && arg !== null) {
                    if (arg.name) return arg.name;
                    return arg;
                }

                // If it's a native type like number or boolean, preserve it
                if (typeof arg === "number" || typeof arg === "boolean") {
                    return arg;
                }

                const strArg = String(arg);
                if (paramDef?.type?.toLowerCase() === "player") {
                    return this._resolvePlayer(strArg) || strArg;
                }
                return strArg;
            });

            // ASYNC_EXECUTION_WRAPPER
            Kernel.system.run(() => {
                try {
                    if (typeof cmd.execute === "function") {
                        cmd.execute(null, player, cleanArgs);
                    } else if (typeof cmd.callback === "function") {
                        cmd.callback({ sourceEntity: player, sourceType: "Entity", vector }, cleanArgs);
                    }
                } catch (execError) {
                    console.error(`[CommandManager] EXECUTION_CRASH [${cmd.name}]:`, execError);
                    player.sendMessage(`§c§l» §7Command execution failed due to an internal error.`);
                }
            });
        } catch (dispatchError) {
            console.error(`[CommandManager] DISPATCH_CRASH [${cmd.name}]:`, dispatchError);
        }
    },

    _resolvePlayer(query) {
        return PlayerUtils.findPlayer(query);
    },

    _checkAuth(player, perm) {
        if (!perm) return true;
        const PM = Kernel.get("permissions");
        if (!PM) return player.hasTag("admin");
        return PM.hasPermission(player, perm);
    },

    _mapPerms() {
        return Kernel.CommandPermissionLevel.Any;
    },

    refreshAliases() {
        // Handled by init() on startup event
    }
};

