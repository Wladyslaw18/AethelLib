import { Kernel } from "../../../core/Kernel.js"
import { UIUtils } from "../../../ui/UIUtils.js"

export async function showHomeListUI(player, target, backCallback) {
    const HomeStore = Kernel.get("homeStore")
    const homesObj = HomeStore ? await HomeStore.getHomes(target) : {}
    const homes = Object.entries(homesObj).map(([name, data]) => ({ name, ...data }))

    if (homes.length === 0) {
        player.sendMessage(`\u00A7c\u00A7l» \u00A7e${target.name} \u00A77has no homes.`)
        return backCallback()
    }

    const form = new Kernel.ActionFormData()
        .title(`\u00A7e\u00A7lHomes: ${target.name}`)
        .body(`Total Waypoints: ${homes.length}`)

    homes.forEach(h => {
        form.button(`\u00A7e${h.name}\n\u00A77${Math.floor(h.x)}, ${Math.floor(h.y)}, ${Math.floor(h.z)}`)
    })
    form.button("\u00A7c<= BACK")

    const res = await UIUtils.showForm(player, form)
    if (res.canceled || res.selection === homes.length) return backCallback()

    const selectedHome = homes[res.selection]
    if (target.isValid) {
        player.teleport(selectedHome, { dimension: target.dimension })
        player.sendMessage(`\u00A7a\u00A7l» \u00A7fTeleported to \u00A7e${target.name}'s \u00A7fhome: \u00A7e${selectedHome.name}\u00A7f.`)
    } else {
        player.sendMessage("\u00A7cTarget player is no longer online.")
    }
}

export function handleTpaToggle(player, target, PlayerStore) {
    const currentTpa = PlayerStore.get(target, "settings:tpa") !== false
    PlayerStore.set(target, "settings:tpa", !currentTpa)
    player.sendMessage(`\u00A7a\u00A7l» \u00A7fTPA for \u00A7e${target.name}\u00A7f is now ${!currentTpa ? "\u00A7aEnabled" : "\u00A7cDisabled"}\u00A7f.`)
}

