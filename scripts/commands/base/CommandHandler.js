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
    _prefix: "/",
    _slashCommands: new Map(),
    _commandStats: new Map(),

    /* 
     * SERVICE_BOOTSTRAP
     */
    init() {
        if (!LifecycleController.boot("commandHandler")) return
        this._initialized = true

        /* 
         * CHAT_INTERCEPTION_HOOK
         * Subscribes to the world.beforeEvents.chatSend event to catch 
         * potential commands before they are broadcast to other players.
         */
        // @ts-ignore
        const chatEvent = Kernel.world.beforeEvents.chatSend || Kernel.world.beforeEvents.chat
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

        this._registerSlashCommands()

        console.log(`[CommandHandler] INTERFACE_ONLINE | Prefix: ${this._prefix}`);
    },

    /*
     * NATIVE_REGISTRY_HANDSHAKE
     * Attempts to register slash-commands into the native Minecraft 
     * registry for tab-completion support.
     */
    _registerSlashCommands() {
        const CommandRegistry = Kernel.get("commandRegistry")
        const commands = CommandRegistry.getAll()

        // @ts-ignore
        const chatEvent = Kernel.world.beforeEvents.chatSend || Kernel.world.beforeEvents.chat
        if (chatEvent) {
            chatEvent.subscribe((event) => {
                const message = event.message.trim()

                if (message.startsWith("/")) {
                    const [commandName] = message.slice(1).split(/\s+/)
                    if (commands.includes(commandName)) {
                        return // ALLOW_NATIVE_PROCESSING
                    }
                }
            })
        }
    },

    /*
     * CHAT_INPUT_PARSER
     * ----------------------------------------------------------------------------
     * 1. Validate prefix.
     * 2. Cancel the event to prevent chat leakage.
     * 3. Tokenize the input string.
     * 4. Dispatch to execution engine.
     */
    _handleChatCommand(event) {
        const message = event.message.trim()

        if (!message.startsWith(this._prefix)) return

        event.cancel = true // TERMINATE_CHAT_BROADCAST

        const [commandName, ...args] = message.slice(this._prefix.length).trim().split(/\s+/).filter(Boolean)
        if (!commandName) return

        Kernel.system.run(async () => {
            await this._executeCommand(event.sender, commandName, args, "chat")
        })
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
                player.sendMessage(`\xA7c[Error] Unknown identifier: \xA7e${commandName}`)
                this._recordCommandStats(commandName, false, Date.now() - startTime)
                return
            }

            if (command.permission && !this._hasPermission(player, command.permission)) {
                player.sendMessage(`\xA7c[Security] Access denied for command: \xA7e${commandName}`)
                this._recordCommandStats(commandName, false, Date.now() - startTime, "no_permission")
                return
            }

            await command.execute(null, player, args)

            this._recordCommandStats(commandName, true, Date.now() - startTime)

        } catch (error) {
            console.error(`[CommandHandler] EXECUTION_CRASH [${commandName}]: ${error}`)
            player.sendMessage(`\xA7c[Fatal] Execution pipeline failure: \xA7e${error.message}`)
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
        const prefix = this._prefix

        if (trimmed.startsWith(prefix)) {
            const [cmdName, ...args] = trimmed.slice(prefix.length).trim().split(/\s+/).filter(Boolean)
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
