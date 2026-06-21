import { Kernel } from "../../../core/Kernel.js";
import { UIUtils } from "../../UIUtils.js";
import { RankSystem } from "../../../systems/social/ranks/RankSystem.js";
import { Lang } from "../../Lang.js";
import { FormBuilder } from "../../FormBuilder.js";

export class RankAssignUI {
    static async showAssignRank(executor, targetPlayer, backCallback = null) {
        const ranks = RankSystem.getAllRanks();
        const rankKeys = Object.keys(ranks);
        if (rankKeys.length === 0) {
            executor.sendMessage("§cNo ranks registered in the system.");
            return;
        }

        let selectedIndex = 0;

        new FormBuilder(Lang.GRID_M + "§6§lASSIGN RANK")
            .addDropdownAction(`Select Rank for ${targetPlayer.name}:`, rankKeys, 0, (v) => selectedIndex = v)
            .showAndApply(executor, {}, backCallback, () => {
                const rankTag = rankKeys[selectedIndex];
                const targetRank = ranks[rankTag];

                if (targetPlayer.hasTag(rankTag)) {
                    executor.sendMessage(`\u00A7c\u00A7l» \u00A7e${targetPlayer.name} \u00A77already has the rank '\u00A7b${rankTag}\u00A77'.`);
                    return;
                }

                const PermissionManager = Kernel.get("permissions");
                const executorRank = PermissionManager.getHighestRank(executor);

                if (!executor.hasTag("op") && targetRank.order >= (executorRank?.order || 0)) {
                    executor.sendMessage(`\u00A7c\u00A7l» \u00A77Security Fault: Cannot assign a rank equal to or higher than your own clearance.`);
                    return;
                }

                targetPlayer.addTag(rankTag);
                executor.sendMessage(`\u00A7a\u00A7l» \u00A7fSuccessfully assigned rank '${rankTag}' to ${targetPlayer.name}.`);
                targetPlayer.sendMessage(`\u00A7a\u00A7l» \u00A7fYou have been assigned the rank: \u00A7e${rankTag}`);

                PermissionManager.invalidatePlayerCache(targetPlayer.id);
            });
    }
}
