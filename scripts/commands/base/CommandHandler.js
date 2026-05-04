import { Kernel } from "../../core/Kernel.js"

export const CommandHandler = {
    _initialized: false,
    _prefix: "!",
    _slashCommands: new Map(),
    _commandStats: new Map(),

    init() {
        if (this._initialized) return
        this._initialized = true

        // Handle ! commands from chat
        const chatEvent = Kernel.world.beforeEvents.chatSend || Kernel.world.beforeEvents.chat
        if (chatEvent) {
            chatEvent.subscribe(this._handleChatCommand.bind(this))
        } else {
            console.warn("CommandHandler: Could not find chat event in beforeEvents")
        }

        // Handle / commands via script events (workaround for beta limitations)
        Kernel.system.afterEvents.scriptEventReceive.subscribe(this._handleSlashCommand.bind(this))

        // Register slash commands for tab completion
        this._registerSlashCommands()

        console.log("CommandHandler initialized with prefix: " + this._prefix)
    },

    /**
     * Register slash commands for tab completion support
     */
    _registerSlashCommands() {
        const CommandRegistry = Kernel.get("commandRegistry")
        const commands = CommandRegistry.getAll()

        // Subscribe to chat events to handle slash commands for tab completion
        const chatEvent = Kernel.world.beforeEvents.chatSend || Kernel.world.beforeEvents.chat
        if (chatEvent) {
            chatEvent.subscribe((event) => {
                const message = event.message.trim()

                // Allow tab completion for slash commands without cancelling
                if (message.startsWith("/")) {
                    const [commandName] = message.slice(1).split(/\s+/)

                    // Check if this is a registered command
                    if (commands.includes(commandName)) {
                        // Don't cancel - allow Minecraft's tab completion to work
                        // The script event handler will process the actual command
                        return
                    }
                }
            })
        }
    },

    _handleChatCommand(event) {
        const message = event.message.trim()

        // Check if message starts with command prefix
        if (!message.startsWith(this._prefix)) return

        // Cancel the chat message to prevent it from showing
        event.cancel = true

        // Parse command
        const [commandName, ...args] = message.slice(this._prefix.length).trim().split(/\s+/)

        if (!commandName) return

        // Execute command asynchronously to avoid blocking
        Kernel.system.run(async () => {
            await this._executeCommand(event.sender, commandName, args, "chat")
        })
    },

    _handleSlashCommand(event) {
        // Only handle our custom script events
        if (event.id !== "cmd:execute") return
        if (!event.sourceEntity || !event.sourceEntity.isValid()) return

        try {
            const data = JSON.parse(event.message || "{}")
            const { command, args } = data

            if (!command) return

            // Execute command
            Kernel.system.run(async () => {
                await this._executeCommand(event.sourceEntity, command, args || [], "slash")
            })
        } catch (error) {
            console.error(`Slash command parsing error: ${error}`)
        }
    },

    async _executeCommand(player, commandName, args, source) {
        const startTime = Date.now()
        const CommandRegistry = Kernel.get("commandRegistry")

        try {
            // Get command from registry
            const command = CommandRegistry.get(commandName)

            if (!command) {
                player.sendMessage(`§cUnknown command: §e${commandName}`)
                this._recordCommandStats(commandName, false, Date.now() - startTime)
                return
            }

            // Check permissions
            if (command.permission && !this._hasPermission(player, command.permission)) {
                player.sendMessage(`§cYou don't have permission to use: §e${commandName}`)
                this._recordCommandStats(commandName, false, Date.now() - startTime, "no_permission")
                return
            }

            // Execute command
            await command.execute(null, player, args)

            // Record success
            this._recordCommandStats(commandName, true, Date.now() - startTime)

        } catch (error) {
            console.error(`Command execution error [${commandName}]: ${error}`)
            player.sendMessage(`§cError executing command: §e${error.message}`)
            this._recordCommandStats(commandName, false, Date.now() - startTime, "error")
        }
    },

    _hasPermission(player, permission) {
        const PermissionManager = Kernel.get("permissions")
        if (!PermissionManager) return player.hasTag("admin") // Fallback

        return PermissionManager.hasPermission(player, permission)
    },

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

    /**
     * Register a slash command callback
     * @param {string} name - Command name
     * @param {Function} callback - Command function
     */
    registerSlashCommand(name, callback) {
        this._slashCommands.set(name, callback)
    },

    /**
     * Set command prefix (default: "!")
     * @param {string} prefix - New prefix
     */
    setPrefix(prefix) {
        if (typeof prefix === "string" && prefix.length > 0) {
            this._prefix = prefix
            console.log(`Command prefix changed to: ${prefix}`)
        }
    },

    /**
     * Get current command prefix
     * @returns {string} Current prefix
     */
    getPrefix() {
        return this._prefix
    },

    /**
     * Get command statistics
     * @param {string} commandName - Optional command name
     * @returns {Object} Statistics
     */
    getStats(commandName = null) {
        if (commandName) {
            return this._commandStats.get(commandName) || null
        }

        // Return all stats
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

    /**
     * Execute command programmatically (for admin panel, etc.)
     * @param {Player} player - Command executor
     * @param {string} command - Full command string
     * @returns {Promise<boolean>} Success status
     */
    async executeCommand(player, command) {
        const trimmed = command.trim()
        const prefix = this._prefix

        if (trimmed.startsWith(prefix)) {
            const [cmdName, ...args] = trimmed.slice(prefix.length).split(/\s+/)
            await this._executeCommand(player, cmdName, args, "programmatic")
            return true
        }

        return false
    },

    /**
     * Get all available commands for player
     * @param {Player} player - Player to check permissions for
     * @returns {Array} Available commands
     */
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

