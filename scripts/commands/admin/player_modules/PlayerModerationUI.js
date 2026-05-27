import { Kernel } from "../../../core/Kernel.js"
import { UIUtils } from "../../../ui/UIUtils.js"
import { ValidationHelper } from "../../../utils/ValidationHelper.js"

export async function showKickUI(player, target, backCallback) {
    const form = new Kernel.ModalFormData()
        .title("\u00A7e\u00A7lKick Player")
        // @ts-ignore
        .textField("Reason:", "No reason provided")

    const res = await UIUtils.showForm(player, form)
    if (res.canceled) return backCallback()

    const reason = String(res.formValues[0] || "No reason provided")
    Kernel.system.run(() => {
        try {
            const safeName = ValidationHelper.escapeCommandString(target.name)
            const safeReason = ValidationHelper.escapeCommandString(reason)
            /* try */ Kernel.world.getDimension("overworld").runCommand(`kick "${safeName}" ${safeReason}`)
            player.sendMessage(`\u00A7a\u00A7l» \u00A7fKicked \u00A7e${target.name} \u00A7ffor: \u00A7e${reason}\u00A7f.`)
        } catch (error) {
            player.sendMessage("\u00A7cFailed to kick player.")
        }
    })
    backCallback()
}

export async function showBanUI(player, target, backCallback) {
    const BanManager = Kernel.get("banManager")
    const form = new Kernel.ModalFormData()
        .title("\u00A7e\u00A7lBan Player")
        // @ts-ignore
        .textField("Reason:", "No reason provided")

    const res = await UIUtils.showForm(player, form)
    if (res.canceled) return backCallback()

    const reason = String(res.formValues[0] || "No reason provided")
    if (BanManager) {
        BanManager.ban(target, reason, player.name)
        player.sendMessage(`\u00A7a\u00A7l» \u00A7fBanned \u00A7e${target.name} \u00A7ffor: \u00A7e${reason}\u00A7f.`)
    }
    backCallback()
}

export async function showMuteUI(player, target, backCallback) {
    const MuteStore = Kernel.get("muteStore")
    const form = new Kernel.ModalFormData()
        .title("\u00A7e\u00A7lMute Player")
        .textField("Duration:", "e.g. 10m, 1h, or permanent", "permanent")

    const res = await UIUtils.showForm(player, form)
    if (res.canceled) return backCallback()

    const duration = String(res.formValues[0] || "permanent")
    if (MuteStore) {
        await MuteStore.mute(target, duration)
        player.sendMessage(`\u00A7a\u00A7l» \u00A7fMuted \u00A7e${target.name} \u00A7ffor \u00A7e${duration}\u00A7f.`)
    }
    backCallback()
}

