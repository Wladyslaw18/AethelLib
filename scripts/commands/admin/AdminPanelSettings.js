/**
 * Admin Panel Settings - Server settings sub-panel
 */

import { ActionFormData, ModalFormData } from "@minecraft/server-ui"
import { Kernel } from "../../core/Kernel.js"
import { showAdminPanel } from "./AdminPanelMain.js"

/** @typedef {import("@minecraft/server").Player} Player */

export async function showServerSettings(player) {
    const PermissionManager = Kernel.get("permissions")
    if (!PermissionManager.hasPermission(player, "essentials.admin")) {
        player.sendMessage("§cNo permission.")
        return
    }
    const form = new ActionFormData()
        .title("§6§lServer Settings")
        .body("Select a settings category")
        .button("§aGame Settings")
        .button("§bWorld Settings")
        .button("§cChat Settings")
        .button("§eSecurity Settings")
        .button("§fBackup Settings")
        .button("§cBack")

    const res = await form.show(player)
    if (res.canceled) return

    switch (res.selection) {
        case 0:
            player.sendMessage("§7Game settings interface coming soon...")
            await showServerSettings(player)
            break
        case 1:
            player.sendMessage("§7World settings interface coming soon...")
            await showServerSettings(player)
            break
        case 2:
            await showChatSettings(player)
            break
        case 3:
            player.sendMessage("§7Security settings interface coming soon...")
            await showServerSettings(player)
            break
        case 4:
            player.sendMessage("§7Backup settings interface coming soon...")
            await showServerSettings(player)
            break
        case 5:
            await showAdminPanel(player)
            break
    }
}

async function showChatSettings(player) {
    const form = new ActionFormData()
        .title("§6§lChat Settings")
        .body("Configure chat behavior")
        .button("§aChat Filter")
        .button("§bChat Cooldown")
        .button("§cChat History")
        .button("§dMute Management")
        .button("§eChat Logging")
        .button("§cBack")

    const res = await form.show(player)
    if (res.canceled) return

    switch (res.selection) {
        case 0:
            player.sendMessage("§7Chat filter interface coming soon...")
            await showChatSettings(player)
            break
        case 1:
            await showChatCooldown(player)
            break
        case 2:
            player.sendMessage("§7Chat history interface coming soon...")
            await showChatSettings(player)
            break
        case 3:
            player.sendMessage("§7Mute management interface coming soon...")
            await showChatSettings(player)
            break
        case 4:
            player.sendMessage("§7Chat logging interface coming soon...")
            await showChatSettings(player)
            break
        case 5:
            await showServerSettings(player)
            break
    }
}

async function showChatCooldown(player) {
    const form = new ModalFormData()
        .title("§6§lChat Cooldown")
        .textField("Cooldown (seconds):", "2")
        .toggle("Enable chat cooldown", { defaultValue: true })
        .toggle("Save settings", { defaultValue: false })

    const res = await form.show(player)
    if (res.canceled) {
        await showChatSettings(player)
        return
    }

    if (!res.formValues[2]) {
        await showChatSettings(player)
        return
    }

    const cooldown = Math.floor(Number(res.formValues[0]))
    if (isNaN(cooldown) || cooldown < 0) {
        player.sendMessage("§cInvalid cooldown. Must be a non-negative number.")
        await showChatSettings(player)
        return
    }

    const enabled = res.formValues[1]
    player.sendMessage(`§7Chat cooldown settings: ${enabled ? 'enabled' : 'disabled'}, ${cooldown}s`)
    await showChatSettings(player)
}

