import { PlayerUtils } from "../../../../../utils/PlayerUtils.js";
import { BountyStore } from "../../systems/stores/BountyStore.js";

export const PlaceBountyCommand = {
    name: "placebounty",
    description: "Place a hit/bounty on a player",
    usage: "/ae:placebounty <playerName> <amount>",
    permission: "essentials.bounty.place",
    category: "ECONOMY",
    parameters: [
        { name: "player", type: "player", optional: false },
        { name: "amount", type: "int", optional: false }
    ],
    execute(data, player, args) {
        try {
            if (args.length < 2) {
                player.sendMessage("§c§l» §7Usage: /ae:placebounty <playerName> <amount>");
                return;
            }

            const { player: target, consumedArgs } = PlayerUtils.resolveFromArgs(args);

            if (!target) {
                const targetName = String(args[0]);
                player.sendMessage(`§c§l» §7Player '${targetName}' not found or offline.`);
                return;
            }

            if (target.id === player.id) {
                player.sendMessage("§c§l» §7You cannot place a bounty on yourself.");
                return;
            }

            const amountArg = args[consumedArgs];
            const amount = Number(amountArg);

            if (isNaN(amount) || amount <= 0) {
                player.sendMessage("§c§l» §7Amount must be a positive integer.");
                return;
            }

            BountyStore.addBounty(target, player, amount);
        } catch (err) {
            player.sendMessage(`§c§l» §7Command execution failed: ${err.message}`);
        }
    }
};
