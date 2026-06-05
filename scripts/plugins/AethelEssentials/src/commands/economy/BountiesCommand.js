import { BountyStore } from "../../systems/stores/BountyStore.js";

export const BountiesCommand = {
    name: "bounties",
    description: "List all active player bounties",
    usage: "/ae:bounties",
    permission: "essentials.bounty.list",
    category: "ECONOMY",
    execute(data, player, args) {
        try {
            if (BountyStore.targets.length === 0) {
                player.sendMessage("§6§l[Bounty] §7There are currently no active bounties.");
                return;
            }

            player.sendMessage("§6§l=== ACTIVE BOUNTIES ===");
            for (let i = 0; i < BountyStore.targets.length; i++) {
                const name = BountyStore.names[i];
                const amount = BountyStore.amounts[i];
                const ageMin = Math.floor((Date.now() - BountyStore.timestamps[i]) / 60000);
                player.sendMessage(`§e» §f${name} §8- §a$${amount.toLocaleString()} §8(${ageMin}m ago)`);
            }
        } catch (err) {
            player.sendMessage(`§c§l» §7Failed to retrieve bounties: ${err.message}`);
        }
    }
};
