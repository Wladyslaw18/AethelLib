import { Kernel } from "../core/Kernel.js"
import { RankCommand } from "../commands/social/ranks/RankCommand.js"

/*
 * COMMAND_STAGING_MANIFEST
 * ----------------------------------------------------------------------------
 * This module handles the mass-registration of every command vector in the 
 * AethelLib ecosystem. We use a static import strategy to ensure that all 
 * command logic is loaded into the memory buffer before the first tick.
 */

/* SPATIAL_TELEPORTATION_VECTORS */
import { SetHomeCommand } from "../commands/teleport/SetHomeCommand.js"
import { GoHomeCommand } from "../commands/teleport/GoHomeCommand.js"
import { DelHomeCommand } from "../commands/teleport/DelHomeCommand.js"
import { ListHomeCommand } from "../commands/teleport/ListHomeCommand.js"

/* GLOBAL_WARP_SYSTEM_ENTRIES */
import { SetWarpCommand } from "../commands/teleport/SetWarpCommand.js"
import { WarpCommand } from "../commands/teleport/WarpCommand.js"
import { DelWarpCommand } from "../commands/teleport/DelWarpCommand.js"
import { ListWarpCommand } from "../commands/teleport/ListWarpCommand.js"
import { SpawnCommand } from "../commands/teleport/SpawnCommand.js"

/* ECONOMIC_COMMERCE_LOGIC */
import { MoneyCommand } from "../commands/economy/MoneyCommand.js"
import { PayCommand } from "../commands/economy/PayCommand.js"
import { TopMoneyCommand } from "../commands/economy/TopMoneyCommand.js"

/* TRANSACTIONAL_SHOP_HANDLERS */
import { ShopCommand } from "../commands/shop/ShopCommand.js"

/* INVENTORY_LIQUIDATION_PROTOCOL */
import { SellCommand } from "../commands/sell/SellCommand.js"

/* BIDDING_ORCHESTRATOR */
import { AuctionCommand } from "../commands/auction/AuctionCommand.js"

/* ADMINISTRATIVE_AUTH_LEVEL_COMMANDS */
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
import { AdminReportCommand } from "../commands/admin/AdminReportCommand.js"

/* SPATIAL_HANDSHAKE_VECTORS (TPA) */
import { TPACommand } from "../commands/tpa/TPACommand.js"
import { TPAHereCommand } from "../commands/tpa/TPAHereCommand.js"
import { TPAcceptCommand } from "../commands/tpa/TPAcceptCommand.js"
import { TPACancelCommand } from "../commands/tpa/TPACancelCommand.js"
import { TPASettingCommand } from "../commands/tpa/TPASettingCommand.js"

/* GENERAL_UTILITY_LOGIC */
import { CalculateCommand } from "../commands/general/CalculateCommand.js"
import { HelpCommand } from "../commands/general/HelpCommand.js"
import { TPSCommand } from "../commands/general/TPSCommand.js"
import { PlayerListCommand } from "../commands/general/PlayerListCommand.js"
import { MessageCommand, ReplyCommand } from "../commands/general/MessageCommand.js"
import { InfoCommand } from "../commands/general/InfoCommand.js"
import { ReportCommand } from "../commands/general/ReportCommand.js"
import { CreditCommand } from "../commands/general/CreditCommand.js"
import { BackCommand } from "../commands/general/BackCommand.js"
import { RTPCommand } from "../commands/general/RTPCommand.js"
import { MenuCommand } from "../commands/general/MenuCommand.js"
import { WhoisCommand } from "../commands/general/WhoisCommand.js"

/* MISCELLANEOUS_SOCIAL_MODULES */
import { BlockCommand } from "../commands/tpa/BlockCommand.js"
import { ColorCommand } from "../commands/social/ColorCommand.js"

let initialized = false

/*
 * BOOTSTRAP_COMMAND_INIT
 * ----------------------------------------------------------------------------
 * Handshakes with the CommandRegistry and docks every imported command 
 * into the O(1) master map. 
 *
 * This process is strictly synchronous during the first tick to ensure 
 * that no commands are 'ghosted' during the initial player handshake.
 */
export function init() {
    if (initialized) return
    initialized = true

    const CommandRegistry = Kernel.get("commandRegistry")

    /* REGISTRATION_PIPELINE: START */
    CommandRegistry.register("rank", RankCommand)

    // Spatial Anchors
    CommandRegistry.register("sethome", SetHomeCommand)
    CommandRegistry.register("home", GoHomeCommand)
    CommandRegistry.register("delhome", DelHomeCommand)
    CommandRegistry.register("listhome", ListHomeCommand)

    // Global Warps
    CommandRegistry.register("setwarp", SetWarpCommand)
    CommandRegistry.register("warp", WarpCommand)
    CommandRegistry.register("delwarp", DelWarpCommand)
    CommandRegistry.register("listwarp", ListWarpCommand)
    CommandRegistry.register("spawn", SpawnCommand)

    // Commerce & Liquidity
    CommandRegistry.register("money", MoneyCommand)
    CommandRegistry.register("pay", PayCommand)
    CommandRegistry.register("topmoney", TopMoneyCommand)
    CommandRegistry.register("shop", ShopCommand)
    CommandRegistry.register("sell", SellCommand)
    CommandRegistry.register("auction", AuctionCommand)

    // Authorization & Control
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
    CommandRegistry.register("reports", AdminReportCommand)

    // Spatial Handshaking
    CommandRegistry.register("tpa", TPACommand)
    CommandRegistry.register("tpahere", TPAHereCommand)
    CommandRegistry.register("tpaccept", TPAcceptCommand)
    CommandRegistry.register("tpacancel", TPACancelCommand)
    CommandRegistry.register("tpasetting", TPASettingCommand)

    // General Logic Modules
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
    CommandRegistry.register("credit", CreditCommand)
    CommandRegistry.register("back", BackCommand)
    CommandRegistry.register("rtp", RTPCommand)
    CommandRegistry.register("whois", WhoisCommand)
    CommandRegistry.register("inspect", WhoisCommand)
    CommandRegistry.register("id", WhoisCommand)
    CommandRegistry.register("menu", MenuCommand)
    CommandRegistry.register("m", MenuCommand)
    CommandRegistry.register("gui", MenuCommand)

    // Social & Filtering
    CommandRegistry.register("block", BlockCommand)
    CommandRegistry.register("color", ColorCommand)

    /*
     * GHOST_INTERPRETER_SYNCHRONIZATION
     * After mass-registration, we trigger an alias refresh to rebuild 
     * the O(1) lookup table. This ensures !h maps to !heal instantly.
     */
    const CommandManager = Kernel.get("commandManager")
    if (CommandManager) {
        CommandManager.refreshAliases()
    }
    
    /* 
     * KERNEL_FINALIZATION
     * Triggers the final service-locator bootstrap.
     */
    Kernel.init()

    console.log("[AethelLib] COMMAND_BOOTSTRAP_COMPLETE | Vectors Loaded: " + CommandRegistry.getAll().length);
}
