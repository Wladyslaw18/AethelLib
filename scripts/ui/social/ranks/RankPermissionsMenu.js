import { RankSystem } from "../../../systems/social/ranks/RankSystem.js";
import { FormBuilder } from "../../FormBuilder.js";

export class RankPermissionsMenu {
    static _buildPermissions(player, tag, rank, nodes, title, successMessage, backCallback) {
        const p = rank.permissions || {};
        const options = ["No action (Default)", "Allow", "Deny"];

        const builder = new FormBuilder(title);
        const results = [];
        
        nodes.forEach((node, i) => {
            let val = 0;
            if (p[node.key] === true) val = 1;
            else if (p[node.key] === false) val = 2;
            builder.addDropdownAction(node.label, options, val, (v) => results[i] = v);
        });

        builder.showAndApply(player, {}, backCallback, () => {
            if (!rank.permissions) rank.permissions = {};
            nodes.forEach((node, i) => {
                const selection = results[i];
                if (selection === 1) rank.permissions[node.key] = true;
                else if (selection === 2) rank.permissions[node.key] = false;
                else delete rank.permissions[node.key];
            });

            RankSystem.updateRank(tag, rank);
            player.sendMessage(successMessage);
        });
    }
}
