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
import { AuditCommand } from "./admin/AuditCommand.js"
import { WhoisCommand } from "./general/WhoisCommand.js"
import { HealCommand } from "./admin/HealCommand.js"
import { FeedCommand } from "./admin/FeedCommand.js"
import { FlyCommand } from "./admin/FlyCommand.js"
import { GodCommand } from "./admin/GodCommand.js"
import { ClearInventoryCommand } from "./admin/ClearInventoryCommand.js"
import { RankAdminCommand } from "./admin/RankAdminCommand.js"

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
        
        // --- GAMEMODE_SHORTCUT_VECTORS ---
        // these overloads improve industrial velocity for staff.
        // we override the parameter definition to allow 0 or 1 argument.
        const gmShortcutParams = [{ name: "player", type: "player", optional: true }];
        
        Registry.register("gmc", { 
            ...GamemodeCommand, 
            name: "gmc",
            description: "Switch to creative mode",
            params: gmShortcutParams, 
            execute: (d, p, a) => GamemodeCommand.execute(d, p, [a[0] || p, "creative"]) 
        })
        Registry.register("gms", { 
            ...GamemodeCommand, 
            name: "gms",
            description: "Switch to survival mode",
            params: gmShortcutParams, 
            execute: (d, p, a) => GamemodeCommand.execute(d, p, [a[0] || p, "survival"]) 
        })
        Registry.register("gmsp", { 
            ...GamemodeCommand, 
            name: "gmsp",
            description: "Switch to spectator mode",
            params: gmShortcutParams, 
            execute: (d, p, a) => GamemodeCommand.execute(d, p, [a[0] || p, "spectator"]) 
        })
        Registry.register("gma", { 
            ...GamemodeCommand, 
            name: "gma",
            description: "Switch to adventure mode",
            params: gmShortcutParams, 
            execute: (d, p, a) => GamemodeCommand.execute(d, p, [a[0] || p, "adventure"]) 
        })
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
        // inspect another player's details, dimensions, and coordinates.
        Registry.register("inspect", WhoisCommand)
        Registry.register("whois", WhoisCommand)
        // view and manage player reports.
        Registry.register("reports", AdminReportCommand)
        // industrial communication archive reader.
        Registry.register("audit", AuditCommand)
        // legacy audit log viewer.
        Registry.register("log", { 
            description: "View the administrative audit log",
            permission: "essentials.admin.reports",
            execute: (_d, p, _a) => showReports(p) 
        })
        // emergency broadcast system reset.
        Registry.register("bc66", BroadcastResetCommand)

        // recovery vectors (essentials).
        Registry.register("aheal", HealCommand)
        Registry.register("afeed", FeedCommand)
        Registry.register("afly", FlyCommand)
        Registry.register("agod", GodCommand)
        Registry.register("aclear", ClearInventoryCommand)
        Registry.register("rankadmin", RankAdminCommand)

        // ----------------------------------------------------------------------------
        // | Rank Administration                                                      |
        // | loop through specialized rank commands and register them.                |
        // ----------------------------------------------------------------------------
        // Note: 'editrank' has been sliced into rankperm, rankorder, rankcolor, etc.
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
