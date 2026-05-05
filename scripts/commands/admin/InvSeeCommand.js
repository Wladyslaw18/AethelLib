import { world } from "@minecraft/server"
import { showInventoryUI } from "./InvSeeUI.js"

/*
 * INVENTORY_ESPIONAGE_ORCHESTRATOR
 * ----------------------------------------------------------------------------
 * A high-clearance utility for direct auditing of an entity's inventory 
 * components. Performs a name-to-object resolution before invoking the 
 * visual inspection GUI (InvSeeUI).
 *
 * PHILOSOPHY: Assets are temporary. Administrative oversight is eternal. 
 * Use this vector to identify contraband or structural inventory anomalies.
 */
export const InvSeeCommand = {
    name: "invsee",
    description: "Invokes the visual inventory-audit interface for a specific entity.",
    usage: "!invsee <player_identifier>",
    permission: "essentials.admin.invsee",
    category: "Admin",

    /* 
     * VECTOR_EXECUTION_PIPELINE
     */
    async execute(player, args) {
        if (args.length < 1) {
            player.sendMessage("[Manual] Syntax Error: Player identifier required.");
            return
        }

        const playerName = args[0]
        const target = world.getAllPlayers().find(p => p.name === playerName)
        
        if (!target) {
            player.sendMessage(`[Error] Entity '${playerName}' not found in active buffer.`);
            return
        }

        /* 
         * GUI_INJECTION_HOOK
         */
        await showInventoryUI(player, target)
    }
}
