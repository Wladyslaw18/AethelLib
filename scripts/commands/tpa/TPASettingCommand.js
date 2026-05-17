import { TPAStore } from "../../systems/tpa/TpaStore.js"

// ----------------------------------------------------------------------------
// | object: TPASettingCommand                                                |
// | command definition for personalizing TPA reception preferences.           |
// | allows players to toggle incoming requests and UI pop-up notifications.   |
// ----------------------------------------------------------------------------
export const TPASettingCommand = {
    // internal name.
    name: "tpasetting",
    // human-readable description.
    description: "Configure your TPA settings",
    // syntax guide.
    usage: "/ae:tpasetting <on/off/ui>",
    // required permission node.
    permission: "essentials.tpa",
    // command category.
    category: "teleport",
    // native parameter definitions.
    parameters: [
        { name: "option", type: "string", optional: true }
    ],

    // ----------------------------------------------------------------------------
    // | method: execute                                                          |
    // | configuration pipeline. handles toggling state and cleaning up active     |
    // | handshakes if the system is being disabled.                              |
    // ----------------------------------------------------------------------------
    async execute(_data, player, args) {
        // resolve the specific option token.
        const option = args[0]?.toLowerCase()

        // if no valid option provided, show the current status dashboard.
        if (!option || (option !== "on" && option !== "off" && option !== "ui")) {
            const enabled = TPAStore.isEnabled(player.id)
            const uiEnabled = TPAStore.getUIToggle(player.id)

            player.sendMessage(" ")
            player.sendMessage("\xA76\xA7lTPA Settings")
            player.sendMessage(`\xA77Requests: ${enabled ? "\xA7aEnabled" : "\xA7cDisabled"}`)
            player.sendMessage(`\xA77UI Pop-ups: ${uiEnabled ? "\xA7aEnabled" : "\xA7cDisabled"}`)
            player.sendMessage(" ")
            player.sendMessage("\xA7eUsage: /ae:tpasetting <on/off/ui>")
            player.sendMessage(" ")
            return
        }

        // special case: toggle the visual UI pop-up notification.
        if (option === "ui") {
            const current = TPAStore.getUIToggle(player.id)
            TPAStore.setUIToggle(player.id, !current)
            player.sendMessage(`\xA7a\xA7l» \xA7fUI Pop-ups ${!current ? "\xA7aEnabled" : "\xA7cDisabled"}\xA7f.`);
            return
        }

        // handle the global TPA reception toggle.
        const enabled = option === "on"
        // commit the preference to the persistent store.
        const success = await TPAStore.setSettings(player.id, { enabled })

        if (success) {
            player.sendMessage(`\xA7a\xA7l» \xA7fTPA requests ${enabled ? "\xA7aEnabled" : "\xA7cDisabled"}\xA7f.`);

            // logic gate: if TPA was just disabled, we must flush the request queue.
            if (!enabled) {
                // purge all pending requests targeting this player to prevent phantom pings.
                await TPAStore.cancelAllRequestsForPlayer(player.id)
                player.sendMessage("\xA7e\xA7l» \xA77All existing TPA requests cancelled.");
            }
        } else {
            // handle rare database I/O failures.
            player.sendMessage("\xA7c\xA7l» \xA77Failed to update TPA settings.");
        }
    }
}
