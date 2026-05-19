import { Kernel } from "../../core/Kernel.js"
import { showPlayerManagement } from "./AdminPanelPlayers.js"
import { showServerSettings } from "./AdminPanelSettings.js"
import { showBannedPlayers } from "./AdminPanelBanned.js"
import { UIUtils } from "../../ui/UIUtils.js"

// ----------------------------------------------------------------------------
// | object: AdminPanelCommand                                                |
// | command definition for opening the main administrative interface.         |
// ----------------------------------------------------------------------------
export const AdminPanelCommand = {
    // internal name of the command.
    name: "adminpanel",
    // alternative names that trigger the same logic.
    aliases: ["ap", "admin", "panel"],
    // human-readable explanation of what it does.
    description: "Open admin control panel",
    // how to use it.
    usage: "/ae:adminpanel",
    // permission node required to execute this command.
    permission: "essentials.admin",
    // category for organization in /help.
    category: "admin",

    // ----------------------------------------------------------------------------
    // | method: execute                                                          |
    // | the entry point when the command is run.                                 |
    // ----------------------------------------------------------------------------
    async execute(_data, player, _args) {
        // just a wrapper for the UI function.
        await showAdminPanel(player)
    }
}

// ----------------------------------------------------------------------------
// | function: showAdminPanel                                                 |
// | builds and displays the root action form with server statistics.         |
// ----------------------------------------------------------------------------
export async function showAdminPanel(player) {
    // gather some basic server stats to show in the UI header.
    
    // count how many players are currently in the world.
    const onlinePlayers = Kernel.world.getAllPlayers().length
    // hardcoded for now until we have a real tps monitor.
    const tps = 20 
    // calculate uptime by converting server ticks to seconds.
    const uptimeSeconds = Math.floor(Kernel.system.currentTick / 20)
    
    // format the uptime into minutes and seconds.
    const minutes = Math.floor(uptimeSeconds / 60)
    const seconds = uptimeSeconds % 60
    const uptimeStr = `${minutes} minutes, ${seconds} seconds`

    // create the action form (the button menu).
    const form = new Kernel.ActionFormData()
        .title("\xA7a\xA7e\xA7m\xA7e\xA7lAdmin Panel")
        // set the main body text with the stats we gathered.
        .body(`\xA7aUsername : \xA7f${player.name}\n\xA7aServer Online : \xA7f${uptimeStr}\n\xA7aPlayers Online : \xA7f${onlinePlayers}\n\xA7aTPS : \xA7f${tps}`)
        // add buttons for the sub-menus.
        .button("\xA7aPlayers", "textures/items/totem")
        .button("\xA70Settings", "textures/ui/settings_glyph_complex")
        .button("\xA7cBanned Players", "textures/items/iron_axe")

    // show the form using our UI utility wrapper.
    const res = await UIUtils.showForm(player, form)
    // if they closed the form without clicking anything, stop.
    if (res.canceled) return

    // route to the sub-menu based on the button index they clicked.
    switch (res.selection) {
        case 0:
            // player management (kick, ban, mute, etc).
            await showPlayerManagement(player)
            break
        case 1:
            // global server settings and toggles.
            await showServerSettings(player)
            break
        case 2:
            // list of currently banned players.
            await showBannedPlayers(player)
            break
    }
}
