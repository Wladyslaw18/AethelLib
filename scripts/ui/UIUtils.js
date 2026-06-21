import { Kernel } from "../core/Kernel.js";

export class UIUtils {
    // Thread-safety set to lock players from opening duplicate forms
    static activePlayers = new Set();

    /**
     * Shows a form to a player, handling busy states, retries, and double-open prevention.
     * @param {import("@minecraft/server").Player} player 
     * @param {any} form 

     * @returns {Promise<any>}
     */
    static async showForm(player, formOrBuilder) {
        if (!player || !player.isValid) return { canceled: true };
        
        // locks prevent double-open execution loops
        if (this.activePlayers.has(player.id)) {
            return { canceled: true, cancelationReason: "UserBusy" };
        }
        this.activePlayers.add(player.id);

        try {
            // let previous windows close
            await new Promise(resolve => Kernel.system.runTimeout(resolve, 10));

            // loop until chat is fully closed
            while (true) {
                // native forms mutate on failure — rebuild if possible
                const form = typeof formOrBuilder === "function" ? formOrBuilder() : formOrBuilder;
                const response = await form.show(player);
                
                if (response.cancelationReason !== "UserBusy") {
                    return response;
                }
                
                // can't retry static forms — bail out
                if (typeof formOrBuilder !== "function") {
                    return response;
                }
                
                // wait before retry
                await new Promise(resolve => Kernel.system.runTimeout(resolve, 5));
            }
        } catch (error) {
            console.error(`[UIUtils] Form show failed: ${error}`);
            return { canceled: true };
        } finally {
            // always release lock
            this.activePlayers.delete(player.id);
        }
    }

    /**
     * Standardized back button handling
     */
    static async showPrevious(player, uiFunc) {
        Kernel.system.run(() => uiFunc(player));
    }
}

// Clean up locks when players leave the server to prevent permanent lockouts
Kernel.world.afterEvents.playerLeave.subscribe((event) => {
    UIUtils.activePlayers.delete(event.playerId);
});


