import { Kernel } from "../Kernel.js";
import { PlayerUtils } from "../../utils/PlayerUtils.js";

// ----------------------------------------------------------------------------
// | object: CommandManager                                                   |
// | handles the bridge between our custom commands and bedrock's native api. |
// | uses the custom command registry so we don't have to listen to chat.     |
// | chat listeners are slow and gross. this is better.                       |
// ----------------------------------------------------------------------------
export const CommandManager = {
    // track if we've already done the setup.
    _initialized: false,
    // the default prefix for commands.
    _primaryNS: "ae",
    // the prefix for aliases.
    _aliasNS: "ae", 

    // ----------------------------------------------------------------------------
    // | method: init                                                             |
    // | sets up the startup hook. only runs once.                                |
    // ----------------------------------------------------------------------------
    init() {
        // don't do this twice. please.
        if (this._initialized) return;
        this._initialized = true;

        // we have to wait for the startup event to get the custom command registry.
        // the registry isn't available until the world is actually starting.
        Kernel.system.beforeEvents.startup.subscribe((ev) => this._injectNativeRegistry(ev));

        // just a log so we know it's working.
        console.log(`[CommandManager] Registry online. Primary Namespace: /${this._primaryNS}:`);
    },

    // ----------------------------------------------------------------------------
    // | method: _injectNativeRegistry                                            |
    // | the heavy lifting. loops through our registry and tells bedrock about it.|
    // | handles namespaces, aliases, and parameter mapping.                      |
    // ----------------------------------------------------------------------------
    _injectNativeRegistry(event) {
        // get our internal command registry service.
        const Registry = Kernel.get("commandRegistry");
        // get the actual bedrock registry object from the event.
        const nativeReg = event.customCommandRegistry;
        
        // if either of these is missing, we're in trouble.
        if (!Registry || !nativeReg) return;

        // get every command name we have registered.
        Registry.getAll().forEach(name => {
            // get the command definition (description, params, etc).
            const def = Registry.get(name);
            
            // figure out the final name. 
            // if it doesn't have a colon, we slap 'ae:' on the front.
            let finalName = name;
            if (!name.includes(":")) {
                finalName = `${this._primaryNS}:${name}`;
            }

            // this is what bedrock expects. 
            // permission level is set to 'Any' because we handle perms ourselves.
            const config = {
                name: finalName,
                description: def.description || "Aethelgrad Command Vector",
                permissionLevel: this._mapPerms(),
                mandatoryParameters: this._deriveParams(def.parameters, false),
                optionalParameters: this._deriveParams(def.parameters, true)
            };

            // bedrock doesn't like commands with zero parameters sometimes.
            // if they didn't define any, we add a generic 'args' string just in case.
            if (config.mandatoryParameters.length === 0 && config.optionalParameters.length === 0) {
                config.optionalParameters = [
                    { name: "args", type: Kernel.CustomCommandParamType.String }
                ];
            }

            // register the actual command logic.
            this._registerSingle(nativeReg, config, def);
            
            // if the command has aliases, register those too.
            if (def.aliases && Array.isArray(def.aliases)) {
                def.aliases.forEach(alias => {
                    // check if the alias already has a namespace.
                    const aliasName = alias.includes(":") ? alias : `${this._aliasNS}:${alias}`;
                    // don't register the main name as an alias.
                    if (aliasName === finalName) return;
                    
                    // bedrock shows aliases in autocomplete which can get messy.
                    // we're just doing it anyway for now.
                    this._registerSingle(nativeReg, { ...config, name: aliasName }, def);
                });
            }
        });

        // let the console know the sync is done.
        console.log(`[CommandManager] Registry sync complete`);
    },

    // ----------------------------------------------------------------------------
    // | method: _deriveParams                                                    |
    // | filter parameters by whether they are optional or mandatory.             |
    // | maps our internal types to bedrock's enum types.                         |
    // ----------------------------------------------------------------------------
    _deriveParams(params, isOptional) {
        // if there's nothing to do, return an empty array.
        if (!params || !Array.isArray(params)) return [];
        // filter by the optional flag.
        return params
            .filter(p => !!p.optional === isOptional)
            .map(p => ({
                name: p.name,
                // map the string type (e.g. 'int') to the bedrock enum.
                type: this._mapParamType(p.type)
            }));
    },

    // ----------------------------------------------------------------------------
    // | method: _mapParamType                                                    |
    // | translates human-readable strings to bedrock's internal parameter types. |
    // ----------------------------------------------------------------------------
    _mapParamType(type) {
        // switch on the lowercase type name.
        switch(type?.toLowerCase()) {
            case "player": return Kernel.CustomCommandParamType.PlayerSelector; 
            case "int": return Kernel.CustomCommandParamType.Integer;
            case "string": return Kernel.CustomCommandParamType.String;
            case "bool": return Kernel.CustomCommandParamType.Boolean;
            // default to string if we don't know what it is.
            default: return Kernel.CustomCommandParamType.String;
        }
    },

    // ----------------------------------------------------------------------------
    // | method: _registerSingle                                                  |
    // | calls the native registry function and sets up the execution callback.   |
    // ----------------------------------------------------------------------------
    _registerSingle(registry, config, def) {
        try {
            // bedrock calls this function when a player runs the command.
            registry.registerCommand(config, (origin, ...args) => {
                // pass it off to our internal dispatcher.
                this._dispatch(origin.sourceEntity, def, args, "NATIVE");
                // tell bedrock it worked.
                return { status: Kernel.CustomCommandStatus.Success };
            });
        } catch (e) {
            // if registration fails, log it and move on. probably a duplicate name.
            console.error(`[CommandManager] FAILED_INJECTION [${config.name}]: ${e}`);
        }
    },

    // ----------------------------------------------------------------------------
    // | method: _dispatch                                                        |
    // | the brain of the command system. handles authorization, cooldowns,       |
    // | argument cleaning, and final execution.                                  |
    // ----------------------------------------------------------------------------
    _dispatch(player, cmd, args, vector) {
        // if there's no player (e.g. command block or console), we might need to handle it.
        // for now we just bail because most commands expect a player.
        if (!player) return;

        try {
            // get the permission service.
            const PM = Kernel.get("permissions");
            
            // check if the player actually has permission to run this.
            if (!this._checkAuth(player, cmd.permission)) {
                player.sendMessage(`\xA7c\xA7l» \xA77You lack the clearance level for this vector.`);
                return;
            }

            // cooldown logic. prevents players from spamming heavy commands.
            const cooldownSec = PM ? (PM.hasPermission(player, "command.cooldown") ?? 0) : 0;
            if (cooldownSec > 0) {
                const now = Kernel.system.currentTick;
                const last = player.getDynamicProperty("ae:last_cmd_tick") ?? 0;
                const diff = now - Number(last);
                
                // convert seconds to ticks (20 ticks per second).
                if (diff < cooldownSec * 20) {
                    const remaining = Math.ceil((cooldownSec * 20 - diff) / 20);
                    player.sendMessage(`\xA7c\xA7l» \xA77Slow down! Wait \xA7e${remaining}s \xA77before using another command.`);
                    return;
                }
                // update the last run timestamp.
                player.setDynamicProperty("ae:last_cmd_tick", now);
            }

            // argument cleaning. bedrock's internal types can be weird.
            // we try to resolve players from names and filter out undefined values.
            const cleanArgs = args.filter(a => a !== undefined).map((arg, index) => {
                // get the parameter definition for this index.
                const paramDef = cmd.parameters ? cmd.parameters[index] : null;
                
                // if bedrock already parsed an object (like a selector), return its name or the object itself.
                if (typeof arg === "object" && arg !== null) {
                    if (arg.name) return arg.name;
                    return arg;
                }

                // preserve numbers and booleans as they are.
                if (typeof arg === "number" || typeof arg === "boolean") {
                    return arg;
                }

                // otherwise, turn it into a string.
                const strArg = String(arg);
                // if this parameter is supposed to be a player, try to find them.
                if (paramDef?.type?.toLowerCase() === "player") {
                    return this._resolvePlayer(strArg) || strArg;
                }
                return strArg;
            });

            // run the actual command logic inside a system.run loop.
            // this ensures we're on the right thread and won't crash the event handler.
            Kernel.system.run(() => {
                try {
                    // check if the command uses the 'execute' or 'callback' style.
                    if (typeof cmd.execute === "function") {
                        cmd.execute(null, player, cleanArgs);
                    } else if (typeof cmd.callback === "function") {
                        cmd.callback({ sourceEntity: player, sourceType: "Entity", vector }, cleanArgs);
                    }
                } catch (execError) {
                    // catch any errors that happen during the actual command code.
                    console.error(`[CommandManager] EXECUTION_CRASH [${cmd.name}]:`, execError);
                    player.sendMessage(`\xA7c\xA7l» \xA77Command execution failed due to an internal error.`);
                }
            });
        } catch (dispatchError) {
            // catch any errors that happen during the dispatch logic itself.
            console.error(`[CommandManager] DISPATCH_CRASH [${cmd.name}]:`, dispatchError);
        }
    },

    // ----------------------------------------------------------------------------
    // | method: _resolvePlayer                                                   |
    // | helper to find a player object from a name or partial name.              |
    // ----------------------------------------------------------------------------
    _resolvePlayer(query) {
        return PlayerUtils.findPlayer(query);
    },

    // ----------------------------------------------------------------------------
    // | method: _checkAuth                                                       |
    // | helper to check if a player has a specific permission.                   |
    // | if no permission system is found, it defaults to checking the 'admin' tag.|
    // ----------------------------------------------------------------------------
    _checkAuth(player, perm) {
        // if the command has no permission requirement, everyone can run it.
        if (!perm) return true;
        const PM = Kernel.get("permissions");
        // fallback to tag check if the permissions service is missing.
        if (!PM) return player.hasTag("admin");
        // ask the permission service.
        return PM.hasPermission(player, perm);
    },

    // ----------------------------------------------------------------------------
    // | method: _mapPerms                                                        |
    // | tells bedrock who can see the command. we set it to 'Any' because        |
    // | we handle the actual restriction inside our own code.                    |
    // ----------------------------------------------------------------------------
    _mapPerms() {
        return Kernel.CommandPermissionLevel.Any;
    },

    // ----------------------------------------------------------------------------
    // | method: refreshAliases                                                   |
    // | unused for now. alias registration happens during startup.               |
    // ----------------------------------------------------------------------------
    refreshAliases() {
        // logic moved to _injectNativeRegistry.
    }
};

