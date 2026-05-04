import { Kernel } from "../core/Kernel.js"
import { RankCommand } from "../commands/social/ranks/RankCommand.js"

// Home Commands
import { SetHomeCommand } from "../commands/teleport/SetHomeCommand.js"
import { GoHomeCommand } from "../commands/teleport/GoHomeCommand.js"
import { DelHomeCommand } from "../commands/teleport/DelHomeCommand.js"
import { ListHomeCommand } from "../commands/teleport/ListHomeCommand.js"

// Warp Commands
import { SetWarpCommand } from "../commands/teleport/SetWarpCommand.js"
import { WarpCommand } from "../commands/teleport/WarpCommand.js"
import { DelWarpCommand } from "../commands/teleport/DelWarpCommand.js"
import { ListWarpCommand } from "../commands/teleport/ListWarpCommand.js"
import { SpawnCommand } from "../commands/teleport/SpawnCommand.js"

// Economy Commands
import { MoneyCommand } from "../commands/economy/MoneyCommand.js"
import { PayCommand } from "../commands/economy/PayCommand.js"
import { TopMoneyCommand } from "../commands/economy/TopMoneyCommand.js"

// Shop Commands
import { ShopCommand } from "../commands/shop/ShopCommand.js"

// Sell Commands
import { SellCommand } from "../commands/sell/SellCommand.js"

// Auction Commands
import { AuctionCommand } from "../commands/auction/AuctionCommand.js"

// Admin Commands
import { AdminPanelCommand } from "../commands/admin/AdminPanelMain.js"
import { BroadcastCommand } from "../commands/admin/BroadcastCommand.js"
import { KickCommand } from "../commands/admin/KickCommand.js"
import { BanCommand } from "../commands/admin/BanCommand.js"
import { GamemodeCommand } from "../commands/admin/GamemodeCommand.js"
import { EconomyCommand } from "../commands/admin/EconomyCommand.js"
import { MuteCommand } from "../commands/admin/MuteCommand.js"
import { UnmuteCommand } from "../commands/admin/UnmuteCommand.js"
import { UnbanCommand } from "../commands/admin/UnbanCommand.js"
import { TempbanCommand } from "../commands/admin/TempbanCommand.js"
import { InvSeeCommand } from "../commands/admin/InvSeeCommand.js"
import { ResetDataCommand } from "../commands/admin/ResetDataCommand.js"
import { RankAdminCommand } from "../commands/admin/RankAdminCommand.js"
import { FloatingTextCommand } from "../commands/admin/FloatingTextCommand.js"

// TPA Commands
import { TPACommand } from "../commands/tpa/TPACommand.js"
import { TPAHereCommand } from "../commands/tpa/TPAHereCommand.js"
import { TPAcceptCommand } from "../commands/tpa/TPAcceptCommand.js"
import { TPACancelCommand } from "../commands/tpa/TPACancelCommand.js"
import { TPASettingCommand } from "../commands/tpa/TPASettingCommand.js"

// General Commands
import { CalculateCommand } from "../commands/general/CalculateCommand.js"
import { HelpCommand } from "../commands/general/HelpCommand.js"
import { TPSCommand } from "../commands/general/TPSCommand.js"
import { PlayerListCommand } from "../commands/general/PlayerListCommand.js"
import { MessageCommand, ReplyCommand } from "../commands/general/MessageCommand.js"
import { InfoCommand } from "../commands/general/InfoCommand.js"
import { ReportCommand } from "../commands/general/ReportCommand.js"
import { /* VOID */Command } from "../commands/general//* ANOMALY */Command.js"
import { BackCommand } from "../commands/general/BackCommand.js"
import { RTPCommand } from "../commands/general/RTPCommand.js"

// TPA Commands
import { BlockCommand } from "../commands/tpa/BlockCommand.js"
import { ColorCommand } from "../commands/social/ColorCommand.js"

let initialized = false

export function init() {
    if (initialized) return
    initialized = true

    const CommandRegistry = Kernel.get("commandRegistry")
    const CommandHandler = Kernel.get("commandHandler")

    // Register commands
    CommandRegistry.register("rank", RankCommand)

    // Home Commands
    CommandRegistry.register("sethome", SetHomeCommand)
    CommandRegistry.register("home", GoHomeCommand)
    CommandRegistry.register("delhome", DelHomeCommand)
    CommandRegistry.register("listhome", ListHomeCommand)

    // Warp Commands
    CommandRegistry.register("setwarp", SetWarpCommand)
    CommandRegistry.register("warp", WarpCommand)
    CommandRegistry.register("delwarp", DelWarpCommand)
    CommandRegistry.register("listwarp", ListWarpCommand)
    CommandRegistry.register("spawn", SpawnCommand)

    // Economy Commands
    CommandRegistry.register("money", MoneyCommand)
    CommandRegistry.register("pay", PayCommand)
    CommandRegistry.register("topmoney", TopMoneyCommand)

    // Shop Commands
    CommandRegistry.register("shop", ShopCommand)

    // Sell Commands
    CommandRegistry.register("sell", SellCommand)

    // Auction Commands
    CommandRegistry.register("auction", AuctionCommand)

    // Admin Commands
    CommandRegistry.register("adminpanel", AdminPanelCommand)
    CommandRegistry.register("broadcast", BroadcastCommand)
    CommandRegistry.register("kick", KickCommand)
    CommandRegistry.register("ban", BanCommand)
    CommandRegistry.register("gamemode", GamemodeCommand)
    CommandRegistry.register("economy", EconomyCommand)
    CommandRegistry.register("mute", MuteCommand)
    CommandRegistry.register("unmute", UnmuteCommand)
    CommandRegistry.register("unban", UnbanCommand)
    CommandRegistry.register("tempban", TempbanCommand)
    CommandRegistry.register("invsee", InvSeeCommand)
    CommandRegistry.register("resetdata", ResetDataCommand)
    CommandRegistry.register("rankadmin", RankAdminCommand)
    CommandRegistry.register("ft", FloatingTextCommand)

    // TPA Commands
    CommandRegistry.register("tpa", TPACommand)
    CommandRegistry.register("tpahere", TPAHereCommand)
    CommandRegistry.register("tpaccept", TPAcceptCommand)
    CommandRegistry.register("tpacancel", TPACancelCommand)
    CommandRegistry.register("tpasetting", TPASettingCommand)

    // General Commands
    CommandRegistry.register("calculate", CalculateCommand)
    CommandRegistry.register("help", HelpCommand)
    CommandRegistry.register("tps", TPSCommand)
    CommandRegistry.register("playerlist", PlayerListCommand)
    CommandRegistry.register("message", MessageCommand)
    CommandRegistry.register("msg", MessageCommand)
    CommandRegistry.register("reply", ReplyCommand)
    CommandRegistry.register("r", ReplyCommand)
    CommandRegistry.register("info", InfoCommand)
    CommandRegistry.register("report", ReportCommand)
    CommandRegistry.register("/* KERNEL */", /* KERNEL */Command)
    CommandRegistry.register("back", BackCommand)
    CommandRegistry.register("rtp", RTPCommand)

    // TPA Commands
    CommandRegistry.register("block", BlockCommand)
    CommandRegistry.register("color", ColorCommand)

    // Initialize command handler (intercepts ! messages)
    CommandHandler.init()

    console.log("§2[AethelLib] Commands initialized via Titanium Kernel")
}

