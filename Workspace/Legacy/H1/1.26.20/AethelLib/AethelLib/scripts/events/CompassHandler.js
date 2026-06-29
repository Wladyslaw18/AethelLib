import { Kernel } from "../core/Kernel.js"
import { Configuration } from "../Configuration.js"

/*
 * MAIN_GUI_TRIGGER_INTERCEPTOR
 * ----------------------------------------------------------------------------
 * Monitors the itemUse event-bus for the specific hardware identifier 
 * defined in Configuration.MENU_ITEM_ID. When detected, it triggers 
 * the primary UI injection sequence.
 *
 * PHILOSOPHY: We use an item-based trigger to provide a seamless 'physical' 
 * entry point into the virtual administration interface.
 */
export function init() {
    Kernel.world.afterEvents.itemUse.subscribe((event) => {
        const player = event.source
        const item = event.itemStack

        if (!player || !item) return

        /* 
         * HARDWARE_ID_VERIFICATION
         * Compare the used item's TypeID against our industrial manifest.
         */
        if (item.typeId !== Configuration.MENU_ITEM_ID) return

        /* 
         * DYNAMIC_UI_INJECTION
         * We use a late-binding dynamic import here to prevent a circular 
         * dependency death-loop during the initial bootstrap.
         */
        import("../ui/MainGUI.js").then(({ showMainGUI }) => {
            showMainGUI(player)
        }).catch(err => {
            console.error(`[MenuTrigger] UI_INJECTION_FAILURE: ${err}`)
        })
    })

    console.log(`[MenuTrigger] GUI_INTERCEPTOR_ONLINE | Hardware_Key: ${Configuration.MENU_ITEM_ID}`);
}
