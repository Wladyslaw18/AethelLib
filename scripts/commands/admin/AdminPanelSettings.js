/**
 * Admin Panel Settings - Global system configuration
 */

import { ModalFormData } from "@minecraft/server-ui"
import { Kernel } from "../../core/Kernel.js"
import { showAdminPanel } from "./AdminPanelMain.js"
import { SettingsStore } from "../../core/store/SettingsStore.js"
import { UIUtils } from "../../ui/UIUtils.js"

export async function showServerSettings(player) {
    const PermissionManager = Kernel.get("permissions")
    if (!PermissionManager.hasPermission(player, "essentials.admin")) {
        player.sendMessage("§cNo permission.")
        return
    }

    const settings = SettingsStore.getAll()

    const form = new ModalFormData()
        .title("§e§lSettings Panel")
        .textField("starterMoney\nSet Player Starter Money", "100", { defaultValue: String(settings.starterMoney || "100") })
        .textField("maxMoney\nSet Max Money", "1e+32", { defaultValue: String(settings.maxMoney || "1e+32") })
        .textField("commandPrefix\nPrefix for Command", "-", { defaultValue: String(settings.commandPrefix || "-") })
        .toggle("moneySystem\nIf set to false, anyone can't use money system/command", { defaultValue: settings.moneySystem })
        .toggle("homeSystem\nIf set to false, anyone can't use home system/command", { defaultValue: settings.homeSystem })
        .toggle("tpaSystem\nIf set to false, anyone can't use tpa system/command", { defaultValue: settings.tpaSystem })
        .toggle("warpSystem\nIf set to false, anyone can't use warp system/command", { defaultValue: settings.warpSystem })
        .toggle("backSystem\nIf set to false, anyone can't use back command", { defaultValue: settings.backSystem })
        .toggle("rtpSystem\nIf set to false, anyone can't use rtp command", { defaultValue: settings.rtpSystem })
        .toggle("shopSystem\nIf set to false, anyone can't use shop system/command", { defaultValue: settings.shopSystem })
        .toggle("sellSystem\nIf set to false, anyone can't use sell system/command", { defaultValue: settings.sellSystem })
        .toggle("auctionSystem\nIf set to false, anyone can't use auction system/command", { defaultValue: settings.auctionSystem })
        .toggle("withdrawSystem\nIf set to false, anyone can't use withdraw system/command", { defaultValue: settings.withdrawSystem })
        .toggle("messageSystem\nIf set to false, anyone can't use message/reply command", { defaultValue: settings.messageSystem })
        .toggle("combatSystem\nIf set to true, player not able to teleport while in pvp/combat. If they leave it will count as a death", { defaultValue: settings.combatSystem })
        .toggle("landSystem\nIf set to false, anyone can't use land command", { defaultValue: settings.landSystem })
        .textField("currencyPrefix\nCurrency Prefix", "$", { defaultValue: String(settings.currencyPrefix || "$") })
        .toggle("earnMoneyfromMobs\nIf set to false, anyone can't earn money from killing mobs", { defaultValue: settings.earnMoneyfromMobs })
        .textField("RTPRange\nRandom Teleport Range", "1000", { defaultValue: String(settings.RTPRange || "1000") })
        .toggle("tpaSystemWithUI\nUI for accept or decline tpa requests, set it false will using tpaccept command to accept request", { defaultValue: settings.tpaSystemWithUI })
        .textField("serverInfo\nText that will be show in info command. <NEWLINE> = New Line", "Made by Wladyslaw", { defaultValue: String(settings.serverInfo || "") })
        .textField("joinMessage\nText that will when player join", "Input text here", { defaultValue: String(settings.joinMessage || "") })
        .toggle("showRankOnMessage\nIf true, ranks will show in message", { defaultValue: settings.showRankOnMessage })
        .toggle("showRankOnNameTag\nIf true, ranks will show in name tag", { defaultValue: settings.showRankOnNameTag })
        .toggle("notifyEarnMoneyInChat\nIf true, the notification of the money you get from mobs will appear in the chat", { defaultValue: settings.notifyEarnMoneyInChat })

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
    player.sendMessage("§a§l» §fSettings updated successfully.")
    await showAdminPanel(player)
}
