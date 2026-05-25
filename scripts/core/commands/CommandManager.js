import { Kernel } from "../Kernel.js";
import { PlayerUtils } from "../../utils/PlayerUtils.js";
import { Database } from "../datastore/DatabaseManager.js";
import { DEFAULT_RANKS } from "../../data/RankConfig.js";

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
        const Registry = Kernel.get("commandRegistry");
        const nativeReg = event.customCommandRegistry;
        if (!Registry || !nativeReg) return;

        // --- ENUM_REGISTRATION_PIPELINE ---
        // Populate 'rank' enum from database store or static defaults (Safe for Startup phase)
        try {
            const RankStore = Kernel.get("rankStore");
            let ranksList = DEFAULT_RANKS.map(r => r.id);
            if (RankStore) {
                const dbRanks = RankStore.getAllRanks() || {};
                const dbRankIds = Object.keys(dbRanks);
                if (dbRankIds.length > 0) {
                    ranksList = dbRankIds;
                }
            }
            Registry.registerEnum("rank", ranksList);
        } catch (e) {
            try {
                const staticRanks = DEFAULT_RANKS.map(r => r.id);
                Registry.registerEnum("rank", staticRanks);
            } catch (e2) { }
        }

        // Populate 'systemName' enum
        try {
            const staticSystems = [
                "database", "playerStore", "worldStore", "rankStore", "keys", "settings",
                "economy", "shopStore", "chestShopStore", "ranks", "chat", "banManager",
                "permissions", "formatter", "muteStore", "messageStore", "homeStore",
                "warpStore", "tpaStore", "tpaHandshake", "tpaService", "teleportService",
                "signalBus", "placeholders", "claimStore", "floatingTextStore"
            ];
            const kernelSystems = Array.from(Kernel.systems.keys()).filter(k => k !== "commandRegistry" && k !== "commandManager");
            const allSystems = Array.from(new Set([...staticSystems, ...kernelSystems]));
            Registry.registerEnum("systemName", allSystems);
        } catch (e) {
            console.error(`[CommandManager] Failed to register systemName enum: ${e}`);
        }

        // Populate 'permission' enum
        Registry.registerEnum("permission", [
            "admin", "admin.system", "essentials.home", "essentials.sethome", "essentials.delhome", 
            "essentials.tpa", "essentials.tpaccept", "essentials.tpadeny", "essentials.tpacancel",
            "essentials.pay", "essentials.money", "essentials.withdraw", "essentials.shop",
            "essentials.sell", "essentials.rtp", "essentials.back", "essentials.menu",
            "essentials.auction", "essentials.calculate", "essentials.report", "essentials.tps",
            "essentials.chat.color", "essentials.admin.inspect", "essentials.admin.invsee", 
            "essentials.admin.ft", "essentials.admin.reports", "essentials.admin.economy", 
            "essentials.admin.ranks", "home.limit", "home.cooldown", "teleport.wait",
            // Sharded / Extended permission nodes:
            "admin.panel", "admin.ban", "admin.broadcast", "admin.economy", "admin.floatingtext",
            "admin.invsee", "admin.kick", "admin.landsetting", "admin.log", "admin.mute",
            "admin.ranks", "admin.resetdata", "admin.sellsetting", "admin.setting", "admin.shopsetting",
            "admin.warp", "admin.tp", "admin.gm.c", "admin.gm.s", "admin.gm.sp", "admin.gm.a",
            "land.claim", "land.unclaim", "land.invite", "land.kick", "land.transfer", "land.setting",
            "limit.land", "limit.home",
            "chestshop.create.sell", "chestshop.create.buy", "chestshop.sell", "chestshop.buy",
            "cooldown.chat", "cooldown.back", "cooldown.tpa", "cooldown.home", "cooldown.warp",
            "cooldown.rtp", "cooldown.command",
            "cost.back", "cost.tpa", "cost.home", "cost.warp", "cost.rtp",
            "essentials.help", "essentials.info", "essentials.credit", "essentials.default"
        ]);

        // Sync all enums to the native C++ engine
        Registry.getAllEnums().forEach(enumName => {
            try {
                const values = Registry.getEnum(enumName);
                // CRITICAL: Namespacing is MANDATORY for custom enums in this engine version.
                const namespacedName = enumName.includes(":") ? enumName : `${this._primaryNS}:${enumName}`;
                nativeReg.registerEnum(namespacedName, values);
                console.log(`[CommandManager] ENUM_SYNC: ${namespacedName} (${values.length} values)`);
            } catch (e) {
                console.error(`[CommandManager] ENUM_SYNC_FAILURE [${enumName}]: ${e}`);
            }
        });

        const registeredNames = new Set();
// --- COMMAND_REGISTRATION_PIPELINE ---
Registry.getAll().forEach(name => {
    const def = Registry.get(name);
    if (!def) return;

    if (def.chatRaw === true) {
        console.log(`[CommandManager] Skipping native registration for chatRaw command: ${name}`);
        return;
    }

    // Resolve parameters
    let paramsList = def.params || def.parameters || [];

    // --- CHATRAW_SKIP_GUARD ---
    // chatRaw commands are registered natively via the chaotic-buffer strategy
    // so they show up in autocomplete/suggestions, but their execution is handled
    // by joining split args.

    // --- SELECTIVE_NATIVE_AUTOCOMPLETE_STRATEGY ---
    // For commands that are truly chaotic (symbols/infinite args), 
    // we use Buffer Registration (8 optional strings).
    // This tricks the native engine into letting the symbols pass to our interceptor.
    const chaoticCommands = ["calculate", "calc"];
    if (chaoticCommands.includes(name.toLowerCase())) {
        paramsList = [
            { name: "t1", type: "string", optional: true },
            { name: "t2", type: "string", optional: true },
            { name: "t3", type: "string", optional: true },
            { name: "t4", type: "string", optional: true },
            { name: "t5", type: "string", optional: true },
            { name: "t6", type: "string", optional: true },
            { name: "t7", type: "string", optional: true },
            { name: "t8", type: "string", optional: true }
        ];
    } else if (def.native === false && paramsList.length > 5) {

        paramsList = [];
    }
            const namespacedName = name.includes(":") ? name : `${this._primaryNS}:${name}`;
            const lowerNS = namespacedName.toLowerCase();
            
            if (!registeredNames.has(lowerNS)) {
                registeredNames.add(lowerNS);
                const configs = this._generateConfigs(namespacedName, def, paramsList);
                configs.forEach(config => this._registerSingle(nativeReg, config, def));
            }
            
            // Register aliases
            if (def.aliases && Array.isArray(def.aliases)) {
                def.aliases.forEach(alias => {
                    const aliasNS = alias.includes(":") ? alias : `${this._aliasNS}:${alias}`;
                    if (registeredNames.has(aliasNS.toLowerCase())) return;
                    registeredNames.add(aliasNS.toLowerCase());
                    const aliasConfigs = this._generateConfigs(aliasNS, def, paramsList);
                    aliasConfigs.forEach(config => this._registerSingle(nativeReg, config, def));
                });
            }
        });

        console.log(`[CommandManager] Native C++ Command Registry sync complete`);
    },

    _deriveParams(params, isOptional) {
        if (!params || !Array.isArray(params)) return [];
        const Registry = Kernel.get("commandRegistry");
        return params
            .filter(p => !!p.optional === isOptional)
            .map(p => {
                let pType = p.type;
                let enumName = null;

                if (typeof pType === "string") {
                    const standardType = this._mapParamType(pType);
                    if (standardType) {
                        pType = standardType;
                    } else if (Registry && Registry.hasEnum && Registry.hasEnum(pType)) {
                        // THE "HOLY GRAIL" ENUM CONFIGURATION:
                        enumName = pType.includes(":") ? pType : `${this._primaryNS}:${pType}`;
                        pType = Kernel.CustomCommandParamType.Enum;
                    } else {
                        pType = Kernel.CustomCommandParamType.String;
                    }
                }

                const derived = {
                    name: p.name,
                    type: pType
                };

                if (enumName) {
                    // Provide both properties to satisfy different engine beta versions.
                    derived.enumName = enumName;
                    derived.enum = enumName;
                }

                return derived;
            });
    },

    _mapParamType(type) {
        switch(type?.toLowerCase()) {
            case "player":
            case "playerselector":
                return Kernel.CustomCommandParamType.PlayerSelector; 
            case "entity":
            case "entityselector":
                return Kernel.CustomCommandParamType.EntitySelector;
            case "block":
            case "blocktype":
                return Kernel.CustomCommandParamType.BlockType;
            case "entitytype":
                return Kernel.CustomCommandParamType.EntityType;
            case "item":
            case "itemtype":
                return Kernel.CustomCommandParamType.ItemType;
            case "location":
                return Kernel.CustomCommandParamType.Location;
            case "float":
            case "double":
                return Kernel.CustomCommandParamType.Float;
            case "int":
            case "integer":
                return Kernel.CustomCommandParamType.Integer;
            case "bool":
            case "boolean":
                return Kernel.CustomCommandParamType.Boolean;
            case "string":
                return Kernel.CustomCommandParamType.String;
            case "enum":
                return Kernel.CustomCommandParamType.Enum;
            default:
                return null;
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
                player.sendMessage(`\u00A7c\u00A7l» \u00A77You lack the clearance level for this vector.`);
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
                    player.sendMessage(`\u00A7c\u00A7l» \u00A77Slow down! Wait \u00A7e${remaining}s \u00A77before using another command.`);
                    return;
                }
                player.setDynamicProperty("ae:last_cmd_tick", now);
            }

            const paramsList = cmd.params || cmd.parameters;
            const isLegacy = !cmd.params && !!cmd.parameters;

            let rawArgs = args;
            if (vector === "NATIVE" && args.length === 1 && typeof args[0] === "object" && args[0] !== null && !args[0].isValid && !args[0].id && !args[0].typeId) {
                const argsObj = args[0];
                rawArgs = paramsList ? paramsList.map(param => argsObj[param.name]) : [];
            }

            const cleanArgs = rawArgs.map((arg, index) => {
                if (arg === undefined) return undefined;

                const paramDef = paramsList ? paramsList[index] : null;
                if (!paramDef) return arg;

                const pType = paramDef.type;

                // Cast number parameters back to string if the original command parameter expects a string
                const isOriginalString = pType === "string" || pType === Kernel.CustomCommandParamType.String;
                if (isOriginalString && typeof arg === "number") {
                    arg = String(arg);
                }
                const isPlayerSelector = pType === Kernel.CustomCommandParamType.PlayerSelector || 
                    (typeof pType === "string" && pType.toLowerCase() === "player");
                const isEntitySelector = pType === Kernel.CustomCommandParamType.EntitySelector || 
                    (typeof pType === "string" && pType.toLowerCase() === "entity");
                const isLocation = pType === Kernel.CustomCommandParamType.Location || 
                    (typeof pType === "string" && pType.toLowerCase() === "location");
                const isBlockType = pType === Kernel.CustomCommandParamType.BlockType || 
                    (typeof pType === "string" && pType.toLowerCase() === "block");
                const isEntityType = pType === Kernel.CustomCommandParamType.EntityType || 
                    (typeof pType === "string" && pType.toLowerCase() === "entitytype");
                const isItemType = pType === Kernel.CustomCommandParamType.ItemType || 
                    (typeof pType === "string" && pType.toLowerCase() === "item");

                // Target Selectors (unpack the array)
                if (isPlayerSelector || isEntitySelector) {
                    const resolved = Array.isArray(arg) ? arg[0] : arg;
                    if (isLegacy) {
                        if (isPlayerSelector) {
                            return resolved?.name || String(arg);
                        } else {
                            return resolved?.nameTag || resolved?.typeId || String(arg);
                        }
                    }
                    return resolved;
                }

                // Locations (for legacy coords, stringify to "x y z")
                if (isLocation) {
                    if (isLegacy) {
                        if (arg && typeof arg === "object" && "x" in arg) {
                            return `${Math.floor(arg.x)} ${Math.floor(arg.y)} ${Math.floor(arg.z)}`;
                        }
                        return String(arg);
                    }
                    return arg;
                }

                // Type Objects (for legacy, return the string id)
                if (isBlockType || isEntityType || isItemType) {
                    if (isLegacy) {
                        return arg?.id || String(arg);
                    }
                    return arg;
                }

                // Numbers and booleans
                if (typeof arg === "number" || typeof arg === "boolean") {
                    return arg;
                }

                // Generic objects fallback
                if (typeof arg === "object" && arg !== null) {
                    if (arg.name) return isLegacy ? arg.name : arg;
                    return arg;
                }

                return String(arg);
            });

            // Automatic mandatory arguments validation.
            // If the original parameter was NOT marked optional, but the user didn't pass it (or it's undefined),
            // show the usage syntax and stop execution.
            if (paramsList) {
                const allArgsEmpty = cleanArgs.length === 0 || cleanArgs.every(arg => arg === undefined || arg === null || arg === "");
                if (!allArgsEmpty) {
                    for (let i = 0; i < paramsList.length; i++) {
                        const paramDef = paramsList[i];
                        if (paramDef && paramDef.optional === false && cleanArgs[i] === undefined) {
                            player.sendMessage(`\u00A7c\u00A7l» \u00A77Usage: ${cmd.usage || ("/" + this._primaryNS + ":" + cmd.name)}`);
                            return;
                        }
                    }
                }
            }

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
                    player.sendMessage(`\u00A7c\u00A7l» \u00A77Command execution failed due to an internal error.`);
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

    _generateConfigs(finalName, def, paramsList) {
        if (!paramsList || paramsList.length === 0) {
            return [{
                name: finalName,
                description: def.description || "Aethelgrad Command Vector",
                permissionLevel: Kernel.CommandPermissionLevel.Any,
                mandatoryParameters: [],
                optionalParameters: [
                    { name: "args", type: Kernel.CustomCommandParamType.String }
                ]
            }];
        }

        return [this._buildConfig(finalName, def, paramsList)];
    },

    _buildConfig(finalName, def, paramsList) {
        const mandatory = this._deriveParams(paramsList, false);
        const optional = this._deriveParams(paramsList, true);

        return {
            name: finalName,
            description: def.description || "Aethelgrad Command Vector",
            permissionLevel: Kernel.CommandPermissionLevel.Any,
            mandatoryParameters: mandatory,
            optionalParameters: optional
        };
    },

    refreshAliases() {}
};
