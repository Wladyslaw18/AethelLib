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


export const AdminRegistry = {

    register(Registry) {
        // Authority Vectors
        Registry.register("adminpanel", AdminPanelCommand)
        Registry.register("broadcast", BroadcastCommand)
        Registry.register("akick", KickCommand)
        Registry.register("ban", BanCommand)
        Registry.register("agm", GamemodeCommand)
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
    }

}
