import { world, Player } from "@minecraft/server"
import { BaseCommand } from "../base/BaseCommand.js"
import { MathParser } from "../../utils/MathParser.js"

/**
 * Safe math calculator command - NO eval() backdoor
 * @author Aethelgrad
 * @version 1.0.0
 */
class CalculateCommand extends BaseCommand {
    /**
     * Create calculate command
     */
    constructor() {
        super({
            name: "calculate",
            description: "Safe math calculator",
            usage: "calculate <math expression>",
            category: "General"
        })
    }

    /**
     * Execute calculate command
     * @param {import("../../../types.js").CommandData} data - Command data
     * @param {Player} player - Player executing command
     * @param {string[]} args - Command arguments
     * @returns {Promise<void>}
     */
    async execute(data, player, args) {
        if (!args || args.length === 0) {
            return this.sendUsage(player)
        }

        const expression = args.join(" ")
        
        // Validate input
        if (!expression || expression.trim().length === 0) {
            return this.sendError(player, "Please provide a math expression")
        }

        // Parse and calculate
        const result = MathParser.parse(expression)

        if (result === null) {
            return this.sendError(player, "Invalid math expression")
        }

        // Format result nicely
        let formattedResult
        if (Number.isInteger(result)) {
            formattedResult = result.toLocaleString()
        } else {
            formattedResult = result.toFixed(4).replace(/\.?0+$/, "")
        }

        this.sendSuccess(player, `Result: ${formattedResult}`)
        
        // Log for debugging (in development only)
        if (world.getDynamicProperty("debug_mode")) {
            console.log(`[Calculate] ${player.name}: ${expression} = ${result}`)
        }
    }
}

/**
 * Export command factory function
 * @returns {CalculateCommand} New calculate command instance
 */
export default () => new CalculateCommand()
