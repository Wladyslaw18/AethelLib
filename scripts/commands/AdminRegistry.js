import { AdminPanelCommand } from "./admin/AdminPanelMain.js"
import { BroadcastCommand } from "./admin/BroadcastCommand.js"
import { KickCommand } from "./admin/KickCommand.js"
import { BanCommand } from "./admin/BanCommand.js"
import { GamemodeCommand } from "./admin/GamemodeCommand.js"
import { EconomyCommand } from "./admin/EconomyCommand.js"
import { MuteCommand } from "./admin/MuteCommand.js"
import { UnmuteCommand } from "./admin/UnmuteCommand.js"
import { UnbanCommand } from "./admin/UnbanCommand.js"
import { TempbanCommand } from "./admin/TempbanCommand.js"
import { InvSeeCommand } from "./admin/InvSeeCommand.js"
import { ResetDataCommand } from "./admin/ResetDataCommand.js"
import { RankAdminCommand } from "./admin/RankAdminCommand.js"
import { FloatingTextCommand } from "./admin/FloatingTextCommand.js"
import { AdminReportCommand } from "./admin/AdminReportCommand.js"
import { BroadcastResetCommand } from "./admin/BroadcastResetCommand.js"

/* UTILITY_VECTORS */
import { CalculateCommand } from "./general/CalculateCommand.js"
import { HelpCommand } from "./general/HelpCommand.js"
import { TPSCommand } from "./general/TPSCommand.js"
import { PlayerListCommand } from "./general/PlayerListCommand.js"
import { MessageCommand, ReplyCommand } from "./general/MessageCommand.js"
import { InfoCommand } from "./general/InfoCommand.js"
import { ReportCommand } from "./general/ReportCommand.js"
import { CreditCommand } from "./general/CreditCommand.js"
import { WhoisCommand } from "./general/WhoisCommand.js"
import { MenuCommand } from "./general/MenuCommand.js"
import { BlockCommand } from "./tpa/BlockCommand.js"
import { ColorCommand } from "./social/ColorCommand.js"
import { RankCommand } from "./social/ranks/RankCommand.js"

export const AdminRegistry = {
    register(Registry) {
        // Authority Vectors
        Registry.register("adminpanel", AdminPanelCommand)
        Registry.register("broadcast", BroadcastCommand)
        Registry.register("kick", KickCommand)
        Registry.register("ban", BanCommand)
        Registry.register("gamemode", GamemodeCommand)
        Registry.register("economy", EconomyCommand)
        Registry.register("mute", MuteCommand)
        Registry.register("unmute", UnmuteCommand)
        Registry.register("unban", UnbanCommand)
        Registry.register("tempban", TempbanCommand)
        Registry.register("invsee", InvSeeCommand)
        Registry.register("resetdata", ResetDataCommand)
        Registry.register("rankadmin", RankAdminCommand)
        Registry.register("ft", FloatingTextCommand)
        Registry.register("reports", AdminReportCommand)
        Registry.register("bc66", BroadcastResetCommand)

        // Utility Vectors
        Registry.register("calculate", CalculateCommand)
        Registry.register("help", HelpCommand)
        Registry.register("tps", TPSCommand)
        Registry.register("playerlist", PlayerListCommand)
        Registry.register("message", MessageCommand)
        Registry.register("msg", MessageCommand)
        Registry.register("reply", ReplyCommand)
        Registry.register("r", ReplyCommand)
        Registry.register("info", InfoCommand)
        Registry.register("report", ReportCommand)
        Registry.register("credit", CreditCommand)
        Registry.register("whois", WhoisCommand)
        Registry.register("inspect", WhoisCommand)
        Registry.register("id", WhoisCommand)
        Registry.register("menu", MenuCommand)
        Registry.register("m", MenuCommand)
        Registry.register("gui", MenuCommand)
        Registry.register("block", BlockCommand)
        Registry.register("color", ColorCommand)
        Registry.register("rank", RankCommand)
    }
}
