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

// ----------------------------------------------------------------------------
// | object: AdminRegistry                                                    |
// | handles registration for all administrative and authority-based commands. |
// | these commands generally require high clearance levels.                   |
// ----------------------------------------------------------------------------
export const AdminRegistry = {
    // ----------------------------------------------------------------------------
    // | method: register                                                         |
    // | pushes command definitions into the core registry.                       |
    // ----------------------------------------------------------------------------
    register(Registry) {
        // ----------------------------------------------------------------------------
        // | Authority Vectors                                                        |
        // ----------------------------------------------------------------------------
        
        // main administrative control panel UI.
        Registry.register("adminpanel", AdminPanelCommand)
        // send a server-wide message.
        Registry.register("broadcast", BroadcastCommand)
        // disconnect a player from the server.
        Registry.register("akick", KickCommand)
        // permanently block a player from the server.
        Registry.register("ban", BanCommand)
        // change a player's gamemode (generic version).
        Registry.register("agm", GamemodeCommand)
        // shortcut commands for specific gamemodes.
        Registry.register("gmc", { ...GamemodeCommand, execute: (d, p, a) => GamemodeCommand.execute(d, p, [a[0] || p.name, "creative"]) })
        Registry.register("gms", { ...GamemodeCommand, execute: (d, p, a) => GamemodeCommand.execute(d, p, [a[0] || p.name, "survival"]) })
        Registry.register("gmsp", { ...GamemodeCommand, execute: (d, p, a) => GamemodeCommand.execute(d, p, [a[0] || p.name, "spectator"]) })
        Registry.register("gma", { ...GamemodeCommand, execute: (d, p, a) => GamemodeCommand.execute(d, p, [a[0] || p.name, "adventure"]) })
        // administrative economy tools (set/add/remove money).
        Registry.register("economy", EconomyCommand)
        // block a player from typing in chat.
        Registry.register("mute", MuteCommand)
        // restore a player's chat privileges.
        Registry.register("unmute", UnmuteCommand)
        // remove a permanent ban.
        Registry.register("unban", UnbanCommand)
        // block a player for a specific amount of time.
        Registry.register("tempban", TempbanCommand)
        // inspect another player's inventory.
        Registry.register("invsee", InvSeeCommand)
        // wipe a player's persistent data.
        Registry.register("resetdata", ResetDataCommand)
        // create and manage floating text entities.
        Registry.register("ft", FloatingTextCommand)
        // view and manage player reports.
        Registry.register("reports", AdminReportCommand)
        // legacy audit log viewer.
        Registry.register("log", { 
            description: "View the administrative audit log",
            permission: "essentials.admin.reports",
            execute: (_d, p, _a) => showReports(p) 
        })
        // emergency broadcast system reset.
        Registry.register("bc66", BroadcastResetCommand)

        // ----------------------------------------------------------------------------
        // | Rank Administration                                                      |
        // | loop through specialized rank commands and register them.                |
        // ----------------------------------------------------------------------------
        RankAdminCommands.forEach(cmd => {
            Registry.register(cmd.name, cmd)
        })

        // ----------------------------------------------------------------------------
        // | Shop Administration                                                      |
        // | loop through specialized shop management commands and register them.     |
        // ----------------------------------------------------------------------------
        ShopAdminCommands.forEach(cmd => {
            Registry.register(cmd.name, cmd)
        })
    }
}
