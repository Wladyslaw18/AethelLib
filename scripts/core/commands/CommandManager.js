import { Kernel } from "../Kernel.js";
import { PlayerUtils } from "../../utils/PlayerUtils.js";

// ----------------------------------------------------------------------------
// | object: CommandManager                                                   |
// | bridges custom commands with bedrock's native C++ command engine.       |
// | chat events are slow and full of string regex sadness. this is way better. |
// ----------------------------------------------------------------------------
export const CommandManager = {
    // track if we've already done the handshakes.
    _initialized: false,
    // the default command prefix/namespace.
    _primaryNS: "ae",
    // the alias namespace prefix.
    _aliasNS: "ae", 

    init() {
        // don't do this twice. please. my brain is already leaking out of my ears.
        if (this._initialized) return;
        this._initialized = true;

        // we have to wait for the startup event to grab the custom command registry.
        // the engine is super picky and will refuse to let us register things once ticking.
        Kernel.system.beforeEvents.startup.subscribe((ev) => this._injectNativeRegistry(ev));

        console.log(`[CommandManager] Registry online. Namespace: /${this._primaryNS}:`);
    },

    _injectNativeRegistry(event) {
        // get our internal command registry service.
        const Registry = Kernel.get("commandRegistry");
        // extract the actual C++ registry off the startup event.
        const nativeReg = event.customCommandRegistry;
        
        // if either of these is null, we are in deep, deep trouble.
        if (!Registry || !nativeReg) return;

        // loop over everything we've registered and feed it to bedrock.
        Registry.getAll().forEach(name => {
            const def = Registry.get(name);
            // resolve params: we check new schema first, fallback to legacy parameters.
            const paramsList = def.params || def.parameters;
            
            // force the namespace prefix (e.g. 'ae:pay').
            let finalName = name;
            if (!name.includes(":")) {
                finalName = `${this._primaryNS}:${name}`;
            }

            // permission is set to 'Any' because we do dynamic JS RBAC inside our callback.
            const config = {
                name: finalName,
                description: def.description || "Aethelgrad Command Vector",
                permissionLevel: Kernel.CommandPermissionLevel.Any,
                mandatoryParameters: this._deriveParams(paramsList, false),
                optionalParameters: this._deriveParams(paramsList, true)
            };

            // bedrock absolutely hates commands with zero parameters.
            // if we have none, we slap an optional 'args' string fallback on it so it compiles.
            if (config.mandatoryParameters.length === 0 && config.optionalParameters.length === 0) {
                config.optionalParameters = [
                    { name: "args", type: Kernel.CustomCommandParamType.String }
                ];
            }

            // hand off registration to C++ engine.
            this._registerSingle(nativeReg, config, def);
            
            // do the same for any registered aliases.
            if (def.aliases && Array.isArray(def.aliases)) {
                def.aliases.forEach(alias => {
                    const aliasName = alias.includes(":") ? alias : `${this._aliasNS}:${alias}`;
                    if (aliasName === finalName) return;
                    this._registerSingle(nativeReg, { ...config, name: aliasName }, def);
                });
            }
        });

        console.log(`[CommandManager] Native C++ Command Registry sync complete`);
    },

    _deriveParams(params, isOptional) {
        if (!params || !Array.isArray(params)) return [];
        return params
            .filter(p => !!p.optional === isOptional)
            .map(p => ({
                name: p.name,
                // if it's already a native CustomCommandParamType enum, use it. otherwise map legacy string.
                type: typeof p.type === "string" ? this._mapParamType(p.type) : p.type
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
            // bedrock calls this function when a player runs the command.
            registry.registerCommand(config, (origin, ...args) => {
                // dispatch directly to our execution loop.
                this._dispatch(origin.sourceEntity, def, args, "NATIVE");
                // C++ demands we return a success status, so here you go.
                return { status: Kernel.CustomCommandStatus.Success };
            });
        } catch (e) {
            console.error(`[CommandManager] FAILED_INJECTION [${config.name}]: ${e}`);
        }
    },

    _dispatch(player, cmd, args, vector) {
        // command block or server console running this? ignore for now. players only.
        if (!player) return;

        try {
            const PM = Kernel.get("permissions");
            
            // RBAC gate: verify clearance level before letting them do anything.
            if (!this._checkAuth(player, cmd.permission)) {
                player.sendMessage(`\xA7c\xA7l» \xA77You lack the clearance level for this vector.`);
                return;
            }

            // Cooldown logic: stop players from spamming heavy SQL/DB database queries.
            const cooldownSec = PM ? (PM.hasPermission(player, "command.cooldown") ?? 0) : 0;
            if (cooldownSec > 0) {
                const now = Kernel.system.currentTick;
                const last = player.getDynamicProperty("ae:last_cmd_tick") ?? 0;
                const diff = now - Number(last);
                
                // 20 ticks per second. basic math.
                if (diff < cooldownSec * 20) {
                    const remaining = Math.ceil((cooldownSec * 20 - diff) / 20);
                    player.sendMessage(`\xA7c\xA7l» \xA77Slow down! Wait \xA7e${remaining}s \xA77before using another command.`);
                    return;
                }
                player.setDynamicProperty("ae:last_cmd_tick", now);
            }

            const paramsList = cmd.params || cmd.parameters;
            const isLegacy = !cmd.params && !!cmd.parameters; // are we dealing with legacy string-guess code?

            const cleanArgs = args.filter(a => a !== undefined).map((arg, index) => {
                const paramDef = paramsList ? paramsList[index] : null;
                
                // let's figure out if we're parsing a player selector.
                const isPlayerType = paramDef && (
                    (typeof paramDef.type === "string" && paramDef.type.toLowerCase() === "player") ||
                    (paramDef.type === Kernel.CustomCommandParamType.PlayerSelector)
                );

                if (isPlayerType) {
                    // C++ target selectors return arrays (like Player[]). unpack the first player.
                    const resolvedPlayer = Array.isArray(arg) ? arg[0] : arg;
                    // if it's a legacy command, it expects a string name, not a rich object. map it back.
                    if (isLegacy) {
                        return resolvedPlayer?.name || String(arg);
                    }
                    return resolvedPlayer;
                }

                // numbers and booleans are passed as-is. no string guess hacks.
                if (typeof arg === "number" || typeof arg === "boolean") {
                    return arg;
                }

                // generic objects: resolve to names for legacy, keep rich for modern.
                if (typeof arg === "object" && arg !== null) {
                    if (arg.name) return isLegacy ? arg.name : arg;
                    return arg;
                }

                return String(arg);
            });

            // system.run ensures we are safely locked inside the ticking thread loop.
            Kernel.system.run(() => {
                try {
                    if (typeof cmd.execute === "function") {
                        cmd.execute(null, player, cleanArgs);
                    } else if (typeof cmd.callback === "function") {
                        cmd.callback({ sourceEntity: player, sourceType: "Entity", vector }, cleanArgs);
                    }
                } catch (execError) {
                    console.error(`[CommandManager] EXECUTION_CRASH [${cmd.name}]:`, execError);
                    player.sendMessage(`\xA7c\xA7l» \xA77Command execution failed due to an internal error.`);
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

    refreshAliases() {}
};
