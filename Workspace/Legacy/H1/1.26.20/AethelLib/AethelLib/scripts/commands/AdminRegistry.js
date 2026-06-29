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
import { RankAdminCommands } from "./social/ranks/RankAdminCommands.js"
import { FloatingTextCommand } from "./admin/FloatingTextCommand.js"
import { AdminReportCommand } from "./admin/AdminReportCommand.js"
import { BroadcastResetCommand } from "./admin/BroadcastResetCommand.js"
import { showReports } from "./admin/AdminPanelReports.js"
import { ShopAdminCommands } from "./admin/ShopAdminCommands.js"


export const AdminRegistry = {

    register(Registry) {
        // Authority Vectors
        Registry.register("adminpanel", AdminPanelCommand)
        Registry.register("broadcast", BroadcastCommand)
        Registry.register("akick", KickCommand)
        Registry.register("ban", BanCommand)
        Registry.register("agm", GamemodeCommand)
        Registry.register("gmc", { ...GamemodeCommand, execute: (d, p, a) => GamemodeCommand.execute(d, p, [a[0] || p.name, "creative"]) })
        Registry.register("gms", { ...GamemodeCommand, execute: (d, p, a) => GamemodeCommand.execute(d, p, [a[0] || p.name, "survival"]) })
        Registry.register("gmsp", { ...GamemodeCommand, execute: (d, p, a) => GamemodeCommand.execute(d, p, [a[0] || p.name, "spectator"]) })
        Registry.register("gma", { ...GamemodeCommand, execute: (d, p, a) => GamemodeCommand.execute(d, p, [a[0] || p.name, "adventure"]) })
        Registry.register("economy", EconomyCommand)
        Registry.register("mute", MuteCommand)
        Registry.register("unmute", UnmuteCommand)
        Registry.register("unban", UnbanCommand)
        Registry.register("tempban", TempbanCommand)
        Registry.register("invsee", InvSeeCommand)
        Registry.register("resetdata", ResetDataCommand)
        Registry.register("ft", FloatingTextCommand)
        Registry.register("reports", AdminReportCommand)
        Registry.register("log", { execute: (_d, p, _a) => showReports(p) })
        Registry.register("bc66", BroadcastResetCommand)

        // Industrial Rank Nexus
        RankAdminCommands.forEach(cmd => {
            Registry.register(cmd.name, cmd)
        })

        // Industrial Shop Nexus
        ShopAdminCommands.forEach(cmd => {
            Registry.register(cmd.name, cmd)
        })
    }

}

