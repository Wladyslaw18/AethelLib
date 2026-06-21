import { Kernel } from "../../../core/Kernel.js";
import { UIUtils } from "../../UIUtils.js";
import { RankSystem } from "../../../systems/social/ranks/RankSystem.js";
import { Lang } from "../../Lang.js";

export class RankManagerMenu {
    static async showRankList(player, backCallback = null) {
        const ranks = RankSystem.getAllRanks();
        const form = new Kernel.ActionFormData()
            .title(Lang.GRID_L + "§6§lRANK MANAGER")
            .body("§7Select a rank to edit or create a new one.");
        
        const rankKeys = Object.keys(ranks).filter(tag => ranks[tag] !== undefined);
        for (const tag of rankKeys) {
            const data = ranks[tag];
            form.button(`${data.name || tag} §8(${tag})\n§7Order: ${data.order || 0}`, "textures/ui/op");
        }
        form.button("§a§l+ CREATE NEW RANK", "textures/ui/plus");
        form.button("§cBACK", "textures/ui/refresh");

        const res = await UIUtils.showForm(player, form);
        if (res.canceled) return;

        if (res.selection === rankKeys.length) {
            const { RankCreateForm } = await import("./RankCreateForm.js");
            Kernel.system.runTimeout(() => {
                RankCreateForm.showCreateRank(player, () => this.showRankList(player, backCallback));
            }, 5);
        } else if (res.selection === rankKeys.length + 1) {
            if (backCallback) {
                Kernel.system.runTimeout(backCallback, 5);
            } else {
                const { showMainMenu } = await import("../../MainGUI.js");
                Kernel.system.runTimeout(() => showMainMenu(player), 5);
            }
        } else {
            const tag = rankKeys[res.selection];
            const { RankActionMenu } = await import("./RankActionMenu.js");
            Kernel.system.runTimeout(() => {
                RankActionMenu.showRankActions(player, tag, backCallback);
            }, 5);
        }
    }
}
