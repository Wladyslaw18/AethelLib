import { world } from "@minecraft/server"
import { MuteStore } from "../../systems/social/MuteStore.js"

/*
 * COMMUNICATION_SUPPRESSION_ORCHESTRATOR
 * ----------------------------------------------------------------------------
 * Handles the administrative silencing of an entity's communication vector. 
 * Injects a suppression-node into the MuteStore to intercept and terminate 
 * chat-broadcast attempts from the target entity.
 *
 * PHILOSOPHY: If the output is toxic, terminate the broadcast. 
 * Silence is the industrial solution for behavioral noise.
 */
export const MuteCommand = {
    name: "mute",
    description: "Injects a communication-suppression node into a specific entity's profile.",
    usage: "!mute <player_identifier>",
    permission: "essentials.admin.mute",
    category: "Admin",

    /* 
     * VECTOR_EXECUTION_PIPELINE
     */
    async execute(data, player, args) {
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

        try {
            /* 
             * SUPPRESSION_NODE_INJECTION
             */
            const success = await MuteStore.mute(target.id)
            if (success) {
                player.sendMessage(`[Success] Entity '${target.name}' communication vector suppressed.`);
                target.sendMessage("[System] Administrative communication suppression active.");
            } else {
                player.sendMessage("[Fatal] Injection failure.");
            }
        } catch (error) {
            player.sendMessage(`[Critical] Suppression Crash: ${error.message}`);
        }
    }
}
