import { ActionFormData } from "@minecraft/server-ui"
import { Kernel } from "../../../core/Kernel.js"
import { showInventoryUI } from "../InvSeeUI.js"
import { showSetMoneyUI } from "./PlayerEconomyUI.js"
import { showKickUI, showBanUI, showMuteUI } from "./PlayerModerationUI.js"
import { showHomeListUI, handleTpaToggle } from "./PlayerSpatialUI.js"

export async function showIndividualPlayerPanel(player, target, backCallback) {
    const PM = Kernel.get("permissions")
    const economy = Kernel.get("economy")
    const homesStore = Kernel.get("homeStore")
    const PlayerStore = Kernel.get("playerStore")
    
    const money = economy ? economy.getBalance(target) : 0
    const homes = homesStore ? homesStore.getHomes(target).length : 0
    const isAdmin = PM.hasPermission(target, "essentials.admin")
    
    const pos = target.location
    const dim = target.dimension.id.split(":").pop().replace(/^\w/, c => c.toUpperCase())

    const form = new ActionFormData()
        .title(`\xA7e\xA7l${target.name} Panel`)
        .body(`\xA7aId : \xA7f${target.id}\n\xA7aAdmin : \xA7f${isAdmin ? "Yes" : "No"}\n\xA7aGamemode : \xA7f${target.getGameMode()}\n\xA7aMoney : \xA7f$${money.toLocaleString()}\n\xA7aOwned Homes : \xA7f${homes}\n\xA7aPosition : \xA7f${Math.floor(pos.x)}, ${Math.floor(pos.y)}, ${Math.floor(pos.z)}\n\xA7aDimension : \xA7f${dim}`)
        .button("\xA7aSet Money")
        .button("\xA7aTeleport")
        .button("\xA7cDisable TPA")
        .button("\xA7cMute")
        .button("\xA70List Homes")
        .button("\xA7eKick")
        .button("\xA7cBan")
        .button("\xA76Check Inventory")
        .button("\xA7c<= BACK")

    const res = await form.show(player)
    if (res.canceled) return

    const refresh = () => showIndividualPlayerPanel(player, target, backCallback)

    switch (res.selection) {
        case 0: await showSetMoneyUI(player, target, refresh); break
        case 1: 
            player.teleport(target.location, { dimension: target.dimension })
            player.sendMessage(`\xA7a\xA7l» \xA7fTeleported to \xA7e${target.name}\xA7f.`)
            await refresh(); break
        case 2: handleTpaToggle(player, target, PlayerStore); await refresh(); break
        case 3: await showMuteUI(player, target, refresh); break
        case 4: await showHomeListUI(player, target, refresh); break
        case 5: await showKickUI(player, target, refresh); break
        case 6: await showBanUI(player, target, refresh); break
        case 7: await showInventoryUI(player, target); break
        case 8: await backCallback(); break
    }
}
