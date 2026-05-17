import { ActionFormData } from "@minecraft/server-ui"
import { Kernel } from "../../../core/Kernel.js"

export async function showHomeListUI(player, target, backCallback) {
    const HomeStore = Kernel.get("homeStore")
    const homes = HomeStore ? HomeStore.getHomes(target) : []

    if (homes.length === 0) {
        player.sendMessage(`\xA7c\xA7l» \xA7e${target.name} \xA77has no homes.`)
        return backCallback()
    }

    const form = new ActionFormData()
        .title(`\xA7e\xA7lHomes: ${target.name}`)
        .body(`Total Assets: ${homes.length}`)

    homes.forEach(h => {
        form.button(`\xA7e${h.name}\n\xA77${Math.floor(h.x)}, ${Math.floor(h.y)}, ${Math.floor(h.z)}`)
    })
    form.button("\xA7c<= BACK")

    const res = await form.show(player)
    if (res.canceled || res.selection === homes.length) return backCallback()

    const selectedHome = homes[res.selection]
    player.teleport(selectedHome, { dimension: target.dimension })
    player.sendMessage(`\xA7a\xA7l» \xA7fTeleported to \xA7e${target.name}'s \xA7fhome: \xA7e${selectedHome.name}\xA7f.`)
}

export function handleTpaToggle(player, target, PlayerStore) {
    const currentTpa = PlayerStore.get(target, "settings:tpa") !== false
    PlayerStore.set(target, "settings:tpa", !currentTpa)
    player.sendMessage(`\xA7a\xA7l» \xA7fTPA for \xA7e${target.name}\xA7f is now ${!currentTpa ? "\xA7aEnabled" : "\xA7cDisabled"}\xA7f.`)
}
