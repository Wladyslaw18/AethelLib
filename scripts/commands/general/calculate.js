import { world, Player } from "@minecraft/server"
import { BaseCommand } from "../base/BaseCommand.js"
import { MathParser } from "../../utils/MathParser.js"

/*
 * INDUSTRIAL_ARITHMETIC_VECTOR
 * ----------------------------------------------------------------------------
 * A high-performance, contract-compliant mathematical parser. Extends the 
 * BaseCommand abstraction to provide a standardized interface for 
 * arithmetic evaluation. 
 *
 * PHILOSOPHY: Safe math is mandatory. We leverage the MathParser utility 
 * to resolve expressions without risking the integrity of the Titanium Kernel.
 */
class CalculateCommand extends BaseCommand {
    /* 
     * COMMAND_CONSTRUCTOR
     */
    constructor() {
        super({
            name: "calculate",
            description: "Safe mathematical evaluation engine.",
            usage: "calculate <expression>",
            category: "General"
        })
    }

    /* 
     * EXECUTION_PIPELINE
     */
    async execute(data, player, args) {
        if (!args || args.length === 0) {
            return this.sendUsage(player)
        }

        const expression = args.join(" ")
        
        if (!expression || expression.trim().length === 0) {
            return this.sendError(player, "Syntax Error: Expression required.");
        }

        /* 
         * CALCULATION_HANDSHAKE
         */
        const result = MathParser.parse(expression)

        if (result === null) {
            return this.sendError(player, "Parsing Failure: Malformed expression.");
        }

        /* 
         * RESULT_FORMATTING_LOGIC
         * Handles decimal precision and locale-specific formatting.
         */
        let formattedResult
        if (Number.isInteger(result)) {
            formattedResult = result.toLocaleString()
        } else {
            formattedResult = result.toFixed(4).replace(/\.?0+$/, "")
        }

        this.sendSuccess(player, `Evaluation Result: ${formattedResult}`)
        
        /* 
         * DIAGNOSTIC_LOGGING
         */
        if (world.getDynamicProperty("debug_mode")) {
            console.log(`[Calculate] ${player.name}: ${expression} = ${result}`)
        }
    }
}

/* 
 * MODULE_FACTORY_EXPORT
 */
export default () => new CalculateCommand()
