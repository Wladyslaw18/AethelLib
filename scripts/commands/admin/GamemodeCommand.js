import { system, world } from "@minecraft/server"

/*
 * REALITY_STATE_ORCHESTRATOR
 * ----------------------------------------------------------------------------
 * Handles the administrative mutation of an entity's gamemode. Performs 
 * validation against the industrial gamemode manifest before invoking 
 * the setGameMode protocol.
 *
 * PHILOSOPHY: Survival is for the weak. Creative is for the architects. 
 * Use this vector to calibrate the reality-state of the empire's components.
 */
export const GamemodeCommand = {
    name: "gamemode",
    description: "Mutates the reality-state (gamemode) of a specific entity.",
    usage: "!gamemode <player_identifier> <mode_token>",
    permission: "essentials.gamemode",
    category: "Admin",

    /* 
     * VECTOR_EXECUTION_PIPELINE
     */
    execute(data, player, args) {
        if (args.length < 2) {
            player.sendMessage("[Manual] Syntax Error: Player and mode token required.");
            player.sendMessage("[Manual] Modes: survival, creative, adventure, spectator");
            return
        }

        const targetName = args[0]
        const mode = args[1].toLowerCase()

        if (!isValidGamemode(mode)) {
            player.sendMessage(`[Error] Malformed mode token: '${mode}'`);
            return
        }

        /* 
         * ENTITY_RESOLUTION
         */
        const target = world.getAllPlayers().find(p => p.name.toLowerCase() === targetName.toLowerCase())
        if (!target) {
            player.sendMessage(`[Error] Entity '${targetName}' not found in active buffer.`);
            return
        }

        /* 
         * REALITY_MUTATION_HOOK
         */
        system.run(() => {
            try {
                target.setGameMode(mode)
                
                const logMessage = `[RealityChange] ${player.name} recalibrated ${target.name} to ${mode}`;
                console.log(logMessage);
                
                target.sendMessage(`[System] Reality recalibrated to ${mode} by '${player.name}'.`);
                player.sendMessage(`[Success] Entity '${target.name}' reality-state set to ${mode}.`);
                
            } catch (error) {
                console.error(`[GamemodeCommand] MUTATION_CRASH: ${error}`)
                player.sendMessage(`[Fatal] Mutation failure for entity '${target.name}'.`);
            }
        })
    }
}

/* 
 * MODE_MANIFEST_VALIDATOR
 */
function isValidGamemode(mode) {
    const validModes = ["survival", "creative", "adventure", "spectator"]
    return validModes.includes(mode)
}
