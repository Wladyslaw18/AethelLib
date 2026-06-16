import { Kernel } from "../core/Kernel.js";

export class UIUtils {
    /**
     * Shows a form to a player, handling busy states and retries.
     * @param {import("@minecraft/server").Player} player 
     * @param {any} form 
     * @param {number} retries 
     * @returns {Promise<any>}
     */
    static async showForm(player, form, retries = 5) {
        // Yield to ensure any command/chat/previous UI has fully closed on the client.
        await new Promise(resolve => Kernel.system.runTimeout(resolve, 5));

        for (let i = 0; i < retries; i++) {
            if (!player || !player.isValid) return { canceled: true };
            try {
                const response = await form.show(player);
                if (response.canceled && response.cancelationReason === "UserBusy") {
                    throw new Error("UserBusy");
                }
                return response;
            } catch (error) {
                if (i === retries - 1) {
                    console.error(`[UIUtils] Form show failed after ${retries} attempts: ${error}`);
                    return { canceled: true };
                }
                // Wait 10 ticks (500ms) before retrying
                await new Promise(resolve => Kernel.system.runTimeout(resolve, 10));
            }
        }
        return { canceled: true };
    }

    /**
     * Standardized back button handling
     */
    static async showPrevious(player, uiFunc) {
        Kernel.system.run(() => uiFunc(player));
    }
}


