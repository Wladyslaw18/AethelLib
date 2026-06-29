import { ActionFormData } from "@minecraft/server-ui"
import { Kernel } from "../../../core/Kernel.js"

export async function showHomeListUI(player, target, backCallback) {
    const HomeStore = Kernel.get("homeStore")
    const homes = HomeStore ? HomeStore.getHomes(target) : []

    if (homes.length === 0) {
        player.sendMessage(`§c§l» §e${target.name} §7has no homes.`)
        return backCallback()
    }

    const form = new ActionFormData()
        .title(`§e§lHomes: ${target.name}`)
        .body(`Total Assets: ${homes.length}`)

    homes.forEach(h => {
        form.button(`§e${h.name}\n§7${Math.floor(h.x)}, ${Math.floor(h.y)}, ${Math.floor(h.z)}`)
    })
    form.button("§c<= BACK")

    const res = await form.show(player)
    if (res.canceled || res.selection === homes.length) return backCallback()

    const selectedHome = homes[res.selection]
    player.teleport(selectedHome, { dimension: target.dimension })
    player.sendMessage(`§a§l» §fTeleported to §e${target.name}'s §fhome: §e${selectedHome.name}§f.`)
}

export function handleTpaToggle(player, target, PlayerStore) {
    const currentTpa = PlayerStore.get(target, "settings:tpa") !== false
    PlayerStore.set(target, "settings:tpa", !currentTpa)
    player.sendMessage(`§a§l» §fTPA for §e${target.name}§f is now ${!currentTpa ? "§aEnabled" : "§cDisabled"}§f.`)
}
