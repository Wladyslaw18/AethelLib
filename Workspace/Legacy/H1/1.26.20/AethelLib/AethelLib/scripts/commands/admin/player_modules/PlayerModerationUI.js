import { ModalFormData } from "@minecraft/server-ui"
import { Kernel } from "../../../core/Kernel.js"

export async function showKickUI(player, target, backCallback) {
    const form = new ModalFormData()
        .title("§e§lKick Player")
        // @ts-ignore
        .textField("Reason:", "No reason provided")

    const res = await form.show(player)
    if (res.canceled) return backCallback()

    const reason = String(res.formValues[0] || "No reason provided")
    Kernel.system.run(() => {
        try {
            target.runCommand(`kick "${target.name}" ${reason}`)
            player.sendMessage(`§a§l» §fKicked §e${target.name} §ffor: §e${reason}§f.`)
        } catch (error) {
            player.sendMessage("§cFailed to kick player.")
        }
    })
    backCallback()
}

export async function showBanUI(player, target, backCallback) {
    const BanManager = Kernel.get("banManager")
    const form = new ModalFormData()
        .title("§e§lBan Player")
        // @ts-ignore
        .textField("Reason:", "No reason provided")

    const res = await form.show(player)
    if (res.canceled) return backCallback()

    const reason = String(res.formValues[0] || "No reason provided")
    if (BanManager) {
        BanManager.ban(target, reason, player.name)
        player.sendMessage(`§a§l» §fBanned §e${target.name} §ffor: §e${reason}§f.`)
    }
    backCallback()
}

export async function showMuteUI(player, target, backCallback) {
    const MuteStore = Kernel.get("muteStore")
    const form = new ModalFormData()
        .title("§e§lMute Player")
        // @ts-ignore
        .textField("Duration:", "e.g. 10m, 1h, or permanent", "permanent")

    const res = await form.show(player)
    if (res.canceled) return backCallback()

    const duration = String(res.formValues[0] || "permanent")
    if (MuteStore) {
        await MuteStore.mute(target, duration)
        player.sendMessage(`§a§l» §fMuted §e${target.name} §ffor §e${duration}§f.`)
    }
    backCallback()
}
