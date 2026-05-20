import { Kernel } from "../../core/Kernel.js"
import { LifecycleController } from "../../core/LifecycleController.js"

/*
 * LEGACY_COMMAND_INTERCEPTOR
 * ----------------------------------------------------------------------------
 * Handles the interception of chat-based commands (legacy '!' prefix). 
 * This module acts as the bridge between the chat event-bus and the 
 * internal CommandRegistry. 
 *
 * PHILOSOPHY: Chat-based commands are a fallback for the native registry. 
 * We process them asynchronously to ensure that the chat event-loop 
 * is not blocked by heavy command logic.
 */
export const CommandHandler = {
    _initialized: false,
    _prefix: "-",
    _slashCommands: new Map(),
    _commandStats: new Map(),

    /* 
     * SERVICE_BOOTSTRAP
     */
    init() {
        if (!LifecycleController.boot("commandHandler")) return
        this._initialized = true

        // Load prefix dynamically from settings
        const SettingsStore = Kernel.get("settings")
        if (SettingsStore) {
            this._prefix = SettingsStore.get("commandPrefix") || "-"
        }

        /* 
         * CHAT_INTERCEPTION_HOOK
         * Subscribes to the world.beforeEvents.chatSend event to catch 
         * potential commands before they are broadcast to other players.
         */
        const chatEvent = Kernel.world.beforeEvents.chatSend
        if (chatEvent) {
            chatEvent.subscribe(this._handleChatCommand.bind(this))
        } else {
            console.warn("[CommandHandler] FATAL: Chat event-bus unreachable.");
        }

        /* 
         * SCRIPT_EVENT_ORCHESTRATOR
         * Handles '/scriptevent cmd:execute' calls for cross-plugin 
         * communication and tab-completion hacks.
         */
        Kernel.system.afterEvents.scriptEventReceive.subscribe(this._handleSlashCommand.bind(this))

        console.log(`[CommandHandler] INTERFACE_ONLINE | Prefix: ${this._prefix}`);
    },

    /*
     * CHAT_INPUT_PARSER
     * ----------------------------------------------------------------------------
     * 1. Validate prefix.
     * 2. Check if the command was invoked with a namespace (e.g. "/ae:home").
     *    If namespaced and command is native: true, allow C++ engine processing.
     * 3. Otherwise, cancel the native chat bubble, parse the name, and execute script-side.
     */
    _handleChatCommand(event) {
        const message = event.message.trim()

        // Check for our custom prefix or the native slash
        if (!message.startsWith(this._prefix) && !message.startsWith("/")) return

        const prefix = message.startsWith("/") ? "/" : this._prefix;
        const fullContent = message.slice(prefix.length).trim();
        const tokens = fullContent.split(/\s+/).filter(Boolean);
        if (tokens.length === 0) return;

        const rawName = tokens[0];
        const args = tokens.slice(1);

        const CommandRegistry = Kernel.get("commandRegistry")
        const command = CommandRegistry.get(rawName)

        if (command) {
            const isNamespaced = rawName.includes(":");
            
            // LOGIC GATE: If command is not native OR is not namespaced, we handle it script-side.
            // This allows /ae:calc (non-native) and -calc to work, while /ae:home (native) 
            // passes through to the C++ engine for high-performance parsing.
            if (prefix === "/" && (command.native === false || !isNamespaced)) {
                // Cancel the native bubble/parsing
                event.cancel = true;

                Kernel.system.run(async () => {
                    const name = isNamespaced ? rawName.split(":")[1] : rawName;
                    // For non-native commands, we pass the ENTIRE message content after the name
                    // as the first argument to ensure no symbols/spaces are lost.
                    const finalArgs = command.native === false ? [fullContent.slice(rawName.length).trim()] : args;
                    await this._executeCommand(event.sender, name, finalArgs, "chat");
                });
                return;
            }
            
            // For custom prefix commands, always handle script-side
            if (prefix !== "/") {
                Kernel.system.run(async () => {
                    const name = isNamespaced ? rawName.split(":")[1] : rawName;
                    await this._executeCommand(event.sender, name, args, "prefix");
                });
            }
        }
    },

    /*
     * SCRIPT_EVENT_PARSER
     */
    _handleSlashCommand(event) {
        if (event.id !== "cmd:execute") return
        if (!event.sourceEntity || !event.sourceEntity.isValid) return

        try {
            const data = JSON.parse(event.message || "{}")
            const { command, args } = data

            if (!command) return

            Kernel.system.run(async () => {
                await this._executeCommand(event.sourceEntity, command, args || [], "slash")
            })
        } catch (error) {
            console.error(`[CommandHandler] SCRIPT_EVENT_PARSE_FAILURE: ${error}`)
        }
    },

    /*
     * EXECUTION_ENGINE
     * ----------------------------------------------------------------------------
     * The heart of the command system. Performs the following sequence:
     * 1. Resolve command from the registry.
     * 2. Perform RBAC permission check.
     * 3. Invoke the command.execute() method.
     * 4. Log performance metrics.
     */
    async _executeCommand(player, commandName, args, _source) {
        const startTime = Date.now()
        const CommandRegistry = Kernel.get("commandRegistry")

        try {
            const command = CommandRegistry.get(commandName)

            if (!command) {
                player.sendMessage(`\u00A7c[Error] Unknown identifier: \u00A7e${commandName}`)
                this._recordCommandStats(commandName, false, Date.now() - startTime)
                return
            }

            if (command.permission && !this._hasPermission(player, command.permission)) {
                player.sendMessage(`\u00A7c[Security] Access denied for command: \u00A7e${commandName}`)
                this._recordCommandStats(commandName, false, Date.now() - startTime, "no_permission")
                return
            }

            // Enterprise Safeguard: Validate that all required parameters are provided.
            const paramsList = command.params || command.parameters;
            if (paramsList) {
                for (let i = 0; i < paramsList.length; i++) {
                    const paramDef = paramsList[i];
                    if (paramDef && paramDef.optional === false && (args[i] === undefined || args[i] === null || args[i] === "")) {
                        player.sendMessage(`\u00A7c\u00A7l» \u00A77Usage: ${command.usage || ("/" + commandName)}`);
                        this._recordCommandStats(commandName, false, Date.now() - startTime, "missing_args")
                        return;
                    }
                }
            }

            await command.execute(null, player, args)

            this._recordCommandStats(commandName, true, Date.now() - startTime)

        } catch (error) {
            console.error(`[CommandHandler] EXECUTION_CRASH [${commandName}]: ${error}`)
            player.sendMessage(`\u00A7c[Fatal] Execution pipeline failure: \u00A7e${error.message}`)
            this._recordCommandStats(commandName, false, Date.now() - startTime, "error")
        }
    },

    /*
     * AUTH_RESOLUTION_FALLBACK
     */
    _hasPermission(player, permission) {
        const PermissionManager = Kernel.get("permissions")
        if (!PermissionManager) return player.hasTag("admin") 

        return PermissionManager.hasPermission(player, permission)
    },

    /*
     * ANALYTICS_LOGGER
     */
    _recordCommandStats(commandName, success, executionTime, error = null) {
        if (!this._commandStats.has(commandName)) {
            this._commandStats.set(commandName, {
                total: 0,
                success: 0,
                failed: 0,
                totalTime: 0,
                errors: new Map()
            })
        }

        const stats = this._commandStats.get(commandName)
        stats.total++
        stats.totalTime += executionTime

        if (success) {
            stats.success++
        } else {
            stats.failed++
            if (error) {
                const count = stats.errors.get(error) || 0
                stats.errors.set(error, count + 1)
            }
        }
    },

    registerSlashCommand(name, callback) {
        this._slashCommands.set(name, callback)
    },

    setPrefix(prefix) {
        if (typeof prefix === "string" && prefix.length > 0) {
            this._prefix = prefix
            console.log(`[CommandHandler] PREFIX_UPDATED: ${prefix}`);
        }
    },

    getPrefix() {
        return this._prefix
    },

    getStats(commandName = null) {
        if (commandName) {
            return this._commandStats.get(commandName) || null
        }

        const allStats = {}
        for (const [name, stats] of this._commandStats) {
            allStats[name] = {
                ...stats,
                avgTime: stats.total > 0 ? Math.round(stats.totalTime / stats.total) : 0,
                successRate: stats.total > 0 ? Math.round((stats.success / stats.total) * 100) : 0
            }
        }
        return allStats
    },

    async executeCommand(player, command) {
        const trimmed = command.trim()
        let cmdText = trimmed
        let matched = false

        if (trimmed.startsWith(this._prefix)) {
            cmdText = trimmed.slice(this._prefix.length)
            matched = true
        } else if (trimmed.startsWith("/")) {
            cmdText = trimmed.slice(1)
            matched = true
        }

        if (matched) {
            const [cmdName, ...args] = cmdText.trim().split(/\s+/).filter(Boolean)
            await this._executeCommand(player, cmdName, args, "programmatic")
            return true
        }

        return false
    },

    getAvailableCommands(player) {
        const CommandRegistry = Kernel.get("commandRegistry")
        const commands = CommandRegistry.getAll()
        const available = []

        for (const name of commands) {
            const command = CommandRegistry.get(name)
            if (!command.permission || this._hasPermission(player, command.permission)) {
                available.push({
                    name,
                    description: command.description,
                    usage: command.usage,
                    category: command.category
                })
            }
        }

        return available.sort((a, b) => a.name.localeCompare(b.name))
    }
}
