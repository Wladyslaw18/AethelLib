import { Kernel } from "../../../core/Kernel.js";
import { RankSystem } from "../../../systems/social/ranks/RankSystem.js";
import { Lang } from "../../Lang.js";
import { FormBuilder } from "../../FormBuilder.js";

export class RankCreateForm {
    static async showCreateRank(player, backCallback) {
        const ranks = RankSystem.getAllRanks();
        const otherRankKeys = Object.keys(ranks);
        const options = ["None (Default)", ...otherRankKeys];

        let tag = "";
        let name = "";
        let order = 0;
        let hideRanks = false;
        let parentIndex = 0;

        new FormBuilder(Lang.GRID_M + "§6§lCREATE RANK")
            .addTextAction("Rank Tag (Unique ID, alphanumeric only):", "e.g. vip", "", (v) => tag = v?.trim())
            .addTextAction("Display Name:", "e.g. [VIP]", "", (v) => name = v?.trim())
            .addTextAction("Order:", "e.g. 10", "0", (v) => order = parseInt(v) || 0)
            .addTextAction("Hide Rank", "true/false", "false", (v) => hideRanks = v === "true")
            .addDropdownAction("Inherit Permissions From Parent Rank:", options, 0, (v) => parentIndex = v)
            .showAndApply(player, {}, backCallback, async () => {
                if (!tag) return player.sendMessage("§cInvalid Rank Tag.");
                if (!/^[a-zA-Z0-9_]+$/.test(tag)) return player.sendMessage("§cInvalid Rank Tag: Only alphanumeric characters and underscores are allowed.");
                if (RankSystem.getRank(tag)) return player.sendMessage("§cFailed to create rank: Tag already exists.");

                const parentRank = parentIndex === 0 ? null : otherRankKeys[parentIndex - 1];

                const newRank = {
                    name: name || tag,
                    order: order,
                    hideRanks: hideRanks,
                    permissions: {},
                    inherits: parentRank
                };

                if (RankSystem.createRank(tag, newRank)) {
                    player.sendMessage(`§aSuccessfully created rank: ${tag}`);
                    const { RankActionMenu } = await import("./RankActionMenu.js");
                    Kernel.system.runTimeout(() => RankActionMenu.showRankActions(player, tag), 5);
                } else {
                    player.sendMessage("§cFailed to create rank.");
                }
            });
    }
}
