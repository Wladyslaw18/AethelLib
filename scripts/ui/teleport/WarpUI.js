import { ActionFormData } from "@minecraft/server-ui"
import { Kernel } from "../../core/Kernel.js"

/*
 * INDUSTRIAL_WAYPOINT_ORCHESTRATOR
 * ----------------------------------------------------------------------------
 * Handles the visual manifestation of global spatial waypoints (Warps). 
 * Orchestrates the mapping of the server-wide waypoint registry into the 
 * ActionFormData buffer for public navigation.
 *
 * PHILOSOPHY: Waypoints are the industrial nodes of the world. Use this 
 * interface to execute high-speed migration to public sectors.
 */
export async function showWarpUI(player) {
    const WarpStore = Kernel.get("warpStore")
    const warps = await WarpStore.getWarps()
    const warpNames = Object.keys(warps)

    const form = new ActionFormData()
        .title("§0§l» §6§lWAYPOINT_REGISTRY§0 «")
        .body(warpNames.length > 0
            ? `§7Public_Nodes: §e${warpNames.length}\n§7Status: §aBROADCASTING`
            : "§cERROR: NO_WAYPOINTS_FOUND\n§7System waypoints are currently offline.")

    form.button("§c[RETURN_TO_ROOT]")

    for (const name of warpNames) {
        const warp = warps[name]
        const dimName = (warp.dimension || "overworld").replace("minecraft:", "").toUpperCase()
        form.button(`§l${name.toUpperCase()}\n§8SECTOR: ${dimName}`)
    }

    const response = await form.show(player)
    if (response.canceled) return

    if (response.selection === 0) {
        const { showMainGUI } = await import("../MainGUI.js")
        await showMainGUI(player)
        return
    }

    const selectedIndex = response.selection - 1
    const selectedName = warpNames[selectedIndex]
    if (!selectedName) return

    const warp = warps[selectedName]

    Kernel.system.run(() => {
        try {
            const targetDim = Kernel.world.getDimension(warp.dimension)
            player.teleport(
                { x: warp.x + 0.5, y: warp.y, z: warp.z + 0.5 },
                { dimension: targetDim }
            )
            player.sendMessage(`§aMIGRATION_SUCCESSFUL: Waypoint ${selectedName} reached.`);
        } catch (error) {
            player.sendMessage("§cMIGRATION_FAILURE: SPATIAL_STABILIZATION_COLLAPSE");
        }
    })
}
