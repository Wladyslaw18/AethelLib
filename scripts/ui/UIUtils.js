import { Kernel } from "../core/Kernel.js";

export class UIUtils {
    /**
     * Safely show a form with a small delay to prevent ghosting.
     * @param {any} player 
     * @param {any} form 
     * @param {number} delayTicks 
     * @returns {Promise<any>}
     */
    static async showForm(player, form, delayTicks = 2) {
        return new Promise((resolve) => {
            Kernel.system.runTimeout(async () => {
                try {
                    const response = await form.show(player);
                    
                    // Handle "UserBusy" by retrying once after a longer delay
                    if (response.cancelationReason === "UserBusy") {
                        Kernel.system.runTimeout(async () => {
                            const retryResponse = await form.show(player);
                            resolve(retryResponse);
                        }, 5); 
                        return;
                    }
                    
                    resolve(response);
                } catch (error) {
                    console.error("[UIUtils] FORM_ERROR: ", error);
                    resolve({ canceled: true });
                }
            }, delayTicks);
        });
    }

    /**
     * Standardized back button handling
     */
    static async showPrevious(player, uiFunc) {
        Kernel.system.run(() => uiFunc(player));
    }
}

