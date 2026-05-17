import { ModalFormData } from "@minecraft/server-ui"
import { Kernel } from "../../../core/Kernel.js"

export async function showKickUI(player, target, backCallback) {
    const form = new ModalFormData()
        .title("\xA7e\xA7lKick Player")
        // @ts-ignore
        .textField("Reason:", "No reason provided")

    const res = await form.show(player)
    if (res.canceled) return backCallback()

    const reason = String(res.formValues[0] || "No reason provided")
    Kernel.system.run(() => {
        try {
            target.runCommand(`kick "${target.name}" ${reason}`)
            player.sendMessage(`\xA7a\xA7l» \xA7fKicked \xA7e${target.name} \xA7ffor: \xA7e${reason}\xA7f.`)
        } catch (error) {
            player.sendMessage("\xA7cFailed to kick player.")
        }
    })
    backCallback()
}

export async function showBanUI(player, target, backCallback) {
    const BanManager = Kernel.get("banManager")
    const form = new ModalFormData()
        .title("\xA7e\xA7lBan Player")
        // @ts-ignore
        .textField("Reason:", "No reason provided")

    const res = await form.show(player)
    if (res.canceled) return backCallback()

    const reason = String(res.formValues[0] || "No reason provided")
    if (BanManager) {
        BanManager.ban(target, reason, player.name)
        player.sendMessage(`\xA7a\xA7l» \xA7fBanned \xA7e${target.name} \xA7ffor: \xA7e${reason}\xA7f.`)
    }
    backCallback()
}

export async function showMuteUI(player, target, backCallback) {
    const MuteStore = Kernel.get("muteStore")
    const form = new ModalFormData()
        .title("\xA7e\xA7lMute Player")
        // @ts-ignore
        .textField("Duration:", "e.g. 10m, 1h, or permanent", "permanent")

    const res = await form.show(player)
    if (res.canceled) return backCallback()

    const duration = String(res.formValues[0] || "permanent")
    if (MuteStore) {
        await MuteStore.mute(target, duration)
        player.sendMessage(`\xA7a\xA7l» \xA7fMuted \xA7e${target.name} \xA7ffor \xA7e${duration}\xA7f.`)
    }
    backCallback()
}
