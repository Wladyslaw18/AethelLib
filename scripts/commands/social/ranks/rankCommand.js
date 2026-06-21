import { RankFormatter } from "../../../systems/social/ranks/RankFormatter.js"
import { RankSystem } from "../../../systems/social/ranks/RankSystem.js"
import { WorldStore } from "../../../core/store/WorldStore.js"
import { StoreKeys } from "../../../core/store/StoreKeys.js"

/** @typedef {import("@minecraft/server").Player} Player */

// ----------------------------------------------------------------------------
// | object: RankCommand                                                      |
// | command definition for inspecting the player's own authorization nodes.    |
// | displays active ranks, formatted prefix, and specific permission flags.   |
// ----------------------------------------------------------------------------
export const RankCommand = {
    // internal identifier.
    name: "rank",
    // human-readable description.
    description: "View your current rank and permissions",

    // ----------------------------------------------------------------------------
    // | method: execute                                                          |
    // | the rank resolution pipeline. scans player tags and maps them to defined |
    // | rank structures in the global store.                                     |
    // ----------------------------------------------------------------------------
    async execute(_data, player, _args) {
        // step 1: identify all valid rank tags assigned to the player.
        const ranks = getPlayerRanks(player)

        // if no ranks are found, trigger a fallback protocol.
        if (!ranks.length) {
            player.sendMessage("\u00A7c\u00A7l» \u00A77You don't have any ranks. Defaulting to Member.")
            // automatically inject the base tag.
            player.addTag("member")
            // show info for the newly assigned rank.
            showRankInfo(player, ["member"])
            return
        }

        // step 2: display the resolved rank manifest.
        showRankInfo(player, ranks)
    }
}

// ----------------------------------------------------------------------------
// | function: showRankInfo                                                   |
// | formats and broadcasts the detailed rank/permission manifest to the chat. |
// ----------------------------------------------------------------------------
function showRankInfo(player, ranks) {
    // fetch the visual prefix and chat color strings from the formatter.
    const rankPrefix = RankFormatter.formatPlayerRanks(player)
    const chatColor = RankFormatter.getPlayerChatColor(player)

    let message = `${rankPrefix}${chatColor}Your Ranks:\n`

    // iterate through each rank to expose granular permission nodes.
    for (const rankTag of ranks) {
        // retrieve the static definition from the system registry.
        const rankData = RankSystem.getRank(rankTag)
        if (!rankData) continue

        message += `\n\u00A7e${rankData.name} \u00A77(${rankTag})`

        // if the rank has a permission bitmask/map, iterate and display it.
        if (rankData.permissions) {
            message += "\n\u00A77Permissions:"
            for (const [key, value] of Object.entries(rankData.permissions)) {
                // handle boolean toggles vs numerical limits (e.g. max homes).
                if (typeof value === 'boolean' && value) {
                    message += `\n  \u00A7a✓ ${key}`
                } else if (typeof value === 'number') {
                    message += `\n  \u00A7f${key}: \u00A7b${value}`
                }
            }
        }
    }

    // output the compiled manifest.
    player.sendMessage(" ")
    player.sendMessage("\u00A76\u00A7lYour Ranks")
    player.sendMessage(message)
    player.sendMessage(" ")
}

// ----------------------------------------------------------------------------
// | function: getPlayerRanks                                                 |
// | scans player entity tags and validates them against the world registry.    |
// | sorts by rank order (priority) to ensure correct hierarchy display.       |
// ----------------------------------------------------------------------------
function getPlayerRanks(player) {
    return player.getTags()
        .filter(tag => {
            // only include tags that have a corresponding rank definition in the store.
            const rankData = WorldStore.get(StoreKeys.rankDef(tag))
            return rankData !== null
        })
        .sort((a, b) => {
            // resolve definitions to check priority order.
            const rankA = WorldStore.get(StoreKeys.rankDef(a))
            const rankB = WorldStore.get(StoreKeys.rankDef(b))
            // numerical ascending sort (lower order = higher priority usually).
            return (rankA?.order || 0) - (rankB?.order || 0)
        })
}
