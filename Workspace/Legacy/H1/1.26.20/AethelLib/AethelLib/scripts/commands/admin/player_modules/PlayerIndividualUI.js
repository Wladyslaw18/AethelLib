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
        .title(`§e§l${target.name} Panel`)
        .body(`§aId : §f${target.id}\n§aAdmin : §f${isAdmin ? "Yes" : "No"}\n§aGamemode : §f${target.getGameMode()}\n§aMoney : §f$${money.toLocaleString()}\n§aOwned Homes : §f${homes}\n§aPosition : §f${Math.floor(pos.x)}, ${Math.floor(pos.y)}, ${Math.floor(pos.z)}\n§aDimension : §f${dim}`)
        .button("§aSet Money")
        .button("§aTeleport")
        .button("§cDisable TPA")
        .button("§cMute")
        .button("§0List Homes")
        .button("§eKick")
        .button("§cBan")
        .button("§6Check Inventory")
        .button("§7Check Lands")
        .button("§c<= BACK")

    const res = await form.show(player)
    if (res.canceled) return

    const refresh = () => showIndividualPlayerPanel(player, target, backCallback)

    switch (res.selection) {
        case 0: await showSetMoneyUI(player, target, refresh); break
        case 1: 
            player.teleport(target.location, { dimension: target.dimension })
            player.sendMessage(`§a§l» §fTeleported to §e${target.name}§f.`)
            await refresh(); break
        case 2: handleTpaToggle(player, target, PlayerStore); await refresh(); break
        case 3: await showMuteUI(player, target, refresh); break
        case 4: await showHomeListUI(player, target, refresh); break
        case 5: await showKickUI(player, target, refresh); break
        case 6: await showBanUI(player, target, refresh); break
        case 7: await showInventoryUI(player, target); break
        case 8: player.sendMessage("§7Lands check coming soon..."); await refresh(); break
        case 9: await backCallback(); break
    }
}
