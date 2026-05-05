import { ActionFormData } from "@minecraft/server-ui"
import { Kernel } from "../../core/Kernel.js"

/*
 * INDUSTRIAL_SPATIAL_REGISTRY_ORCHESTRATOR
 * ----------------------------------------------------------------------------
 * Handles the visual manifestation of entity-specific spatial coordinates 
 * (Homes). Orchestrates the mapping of raw coordinate data into the 
 * ActionFormData buffer for industrial-grade navigation.
 *
 * PHILOSOPHY: Spatial anchors are the waypoints of the empire. Use 
 * this interface to calibrate and execute relocation vectors.
 */

/*
 * MASTER_ANCHOR_MANIFEST_UI
 * Queries the HomeStore for all active pointers associated with the 
 * entity identifier and generates an interactive navigation manifest.
 */
export async function showHomeUI(player) {
    const HomeStore = Kernel.get("homeStore")
    const homes = await HomeStore.getHomes(player)
    const homeNames = Object.keys(homes)

    const form = new ActionFormData()
        .title("§0§l» §6§lSPATIAL_REGISTRY§0 «")
        .body(homeNames.length > 0
            ? `§7Active_Nodes: §e${homeNames.length}\n§7Status: §aLINKED`
            : "§cERROR: NO_SPATIAL_ENTRIES_FOUND\n§7Execute !sethome to calibrate a node.")

    form.button("§c[RETURN_TO_ROOT]")

    for (const name of homeNames) {
        const home = homes[name]
        form.button(`§l${name.toUpperCase()}\n§8COORD: ${Math.floor(home.x)}, ${Math.floor(home.y)}, ${Math.floor(home.z)}`)
    }

    const response = await form.show(player)
    if (response.canceled) return

    if (response.selection === 0) {
        const { showMainGUI } = await import("../MainGUI.js")
        await showMainGUI(player)
        return
    }

    const selectedIndex = response.selection - 1
    const selectedName = homeNames[selectedIndex]
    if (!selectedName) return

    await showHomeActions(player, selectedName, homes[selectedName])
}

/*
 * ANCHOR_ACTION_MANIFEST
 * Orchestrates the specific execution vectors for a selected spatial node: 
 * Migration, Decommission, or Return.
 */
async function showHomeActions(player, name, home) {
    const form = new ActionFormData()
        .title(`§6NODE_CALIBRATION: ${name.toUpperCase()}`)
        .body(`§7Spatial_Target: §e${Math.floor(home.x)}, ${Math.floor(home.y)}, ${Math.floor(home.z)}\n§7Dimension_ID: §e${home.dimension}`)
        .button("§l[EXECUTE_MIGRATION]")
        .button("§c[PURGE_DATA_ENTRY]")
        .button("§7[RETURN_TO_MANIFEST]")

    const response = await form.show(player)
    if (response.canceled) return

    switch (response.selection) {
        case 0: {
            Kernel.system.run(() => {
                try {
                    const targetDim = Kernel.world.getDimension(home.dimension)
                    player.teleport(
                        { x: home.x + 0.5, y: home.y, z: home.z + 0.5 },
                        { dimension: targetDim }
                    )
                    player.sendMessage(`§aMIGRATION_SUCCESSFUL: Relocated to node ${name}.`);
                } catch (error) {
                    player.sendMessage("§cMIGRATION_FAILURE: SPATIAL_STABILIZATION_COLLAPSE");
                }
            })
            break
        }
        case 1: {
            const HomeStore = Kernel.get("homeStore")
            const success = await HomeStore.deleteHome(player, name)
            player.sendMessage(success
                ? `§aPURGE_SUCCESSFUL: Spatial node ${name} decommissioned.`
                : "§cPURGE_FAILURE: DATABASE_REJECTION");
            break
        }
        case 2: {
            await showHomeUI(player)
            break
        }
    }
}
