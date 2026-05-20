/**
 * Admin Panel Settings - Global system configuration
 */

import { Kernel } from "../../core/Kernel.js"
import { showAdminPanel } from "./AdminPanelMain.js"
import { SettingsStore } from "../../core/store/SettingsStore.js"
import { UIUtils } from "../../ui/UIUtils.js"

export async function showServerSettings(player) {
    const PermissionManager = Kernel.get("permissions")
    if (!PermissionManager.hasPermission(player, "essentials.admin")) {
        player.sendMessage("\u00A7cNo permission.")
        return
    }

    const settings = SettingsStore.getAll()

    const form = new Kernel.ModalFormData()
        .title("\u00A7e\u00A7lSettings Panel")
        .textField("starterMoney\nSet Player Starter Money", "100", String(settings.starterMoney || "100"))
        .textField("maxMoney\nSet Max Money", "1e+32", String(settings.maxMoney || "1e+32"))
        .textField("commandPrefix\nPrefix for Command", "-", String(settings.commandPrefix || "-"))
        .toggle("moneySystem\nIf set to false, anyone can't use money system/command", !!settings.moneySystem)
        .toggle("homeSystem\nIf set to false, anyone can't use home system/command", !!settings.homeSystem)
        .toggle("tpaSystem\nIf set to false, anyone can't use tpa system/command", !!settings.tpaSystem)
        .toggle("warpSystem\nIf set to false, anyone can't use warp system/command", !!settings.warpSystem)
        .toggle("backSystem\nIf set to false, anyone can't use back command", !!settings.backSystem)
        .toggle("rtpSystem\nIf set to false, anyone can't use rtp command", !!settings.rtpSystem)
        .toggle("shopSystem\nIf set to false, anyone can't use shop system/command", !!settings.shopSystem)
        .toggle("sellSystem\nIf set to false, anyone can't use sell system/command", !!settings.sellSystem)
        .toggle("auctionSystem\nIf set to false, anyone can't use auction system/command", !!settings.auctionSystem)
        .toggle("withdrawSystem\nIf set to false, anyone can't use withdraw system/command", !!settings.withdrawSystem)
        .toggle("messageSystem\nIf set to false, anyone can't use message/reply command", !!settings.messageSystem)
        .toggle("combatSystem\nIf set to true, player not able to teleport while in pvp/combat. If they leave it will count as a death", !!settings.combatSystem)
        .toggle("landSystem\nIf set to false, anyone can't use land command", !!settings.landSystem)
        .textField("currencyPrefix\nCurrency Prefix", "$", String(settings.currencyPrefix || "$"))
        .toggle("earnMoneyfromMobs\nIf set to false, anyone can't earn money from killing mobs", !!settings.earnMoneyfromMobs)
        .textField("RTPRange\nRandom Teleport Range", "1000", String(settings.RTPRange || "1000"))
        .toggle("tpaSystemWithUI\nUI for accept or decline tpa requests, set it false will using tpaccept command to accept request", !!settings.tpaSystemWithUI)
        .textField("serverInfo\nText that will be show in info command. <NEWLINE> = New Line", "Made by Wladyslaw", String(settings.serverInfo || ""))
        .textField("joinMessage\nText that will when player join", "Input text here", String(settings.joinMessage || ""))
        .toggle("showRankOnMessage\nIf true, ranks will show in message", !!settings.showRankOnMessage)
        .toggle("showRankOnNameTag\nIf true, ranks will show in name tag", !!settings.showRankOnNameTag)
        .toggle("notifyEarnMoneyInChat\nIf true, the notification of the money you get from mobs will appear in the chat", !!settings.notifyEarnMoneyInChat)

    const res = await UIUtils.showForm(player, form)
    if (res.canceled) {
        await showAdminPanel(player)
        return
    }

    const newSettings = {
        starterMoney: res.formValues[0],
        maxMoney: res.formValues[1],
        commandPrefix: res.formValues[2],
        moneySystem: res.formValues[3],
        homeSystem: res.formValues[4],
        tpaSystem: res.formValues[5],
        warpSystem: res.formValues[6],
        backSystem: res.formValues[7],
        rtpSystem: res.formValues[8],
        shopSystem: res.formValues[9],
        sellSystem: res.formValues[10],
        auctionSystem: res.formValues[11],
        withdrawSystem: res.formValues[12],
        messageSystem: res.formValues[13],
        combatSystem: res.formValues[14],
        landSystem: res.formValues[15],
        currencyPrefix: res.formValues[16],
        earnMoneyfromMobs: res.formValues[17],
        RTPRange: res.formValues[18],
        tpaSystemWithUI: res.formValues[19],
        serverInfo: res.formValues[20],
        joinMessage: res.formValues[21],
        showRankOnMessage: res.formValues[22],
        showRankOnNameTag: res.formValues[23],
        notifyEarnMoneyInChat: res.formValues[24]
    }

    SettingsStore.updateAll(newSettings)
    player.sendMessage("\u00A7a\u00A7l» \u00A7fSettings updated successfully.")
    await showAdminPanel(player)
}
