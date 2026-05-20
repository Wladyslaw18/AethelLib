import { BountyData } from "../storage/BountyData.js";
import { EconomyBridge } from "../economy/EconomyBridge.js";

// ----------------------------------------------------------------------------
// | object: BountySystem                                                     |
// | Pure transform logic that mutates BountyData tables.                     |
// ----------------------------------------------------------------------------
export const BountySystem = {
    // ----------------------------------------------------------------------------
    // | method: addBounty                                                        |
    // | Charges creator (if player) and pushes bounty details to SoA tables.     |
    // ----------------------------------------------------------------------------
    async addBounty(context, targetPlayer, creatorPlayerOrSystem, amount) {
        try {
            const amountNum = Math.floor(Number(amount));
            if (isNaN(amountNum) || amountNum <= 0) return false;

            const isSystem = creatorPlayerOrSystem === "SYSTEM";
            const creatorId = isSystem ? "SYSTEM" : creatorPlayerOrSystem.id;

            // 1. Charge creator if not system
            if (!isSystem) {
                const balance = EconomyBridge.getBalance(creatorPlayerOrSystem);
                if (balance < amountNum) {
                    creatorPlayerOrSystem.sendMessage("\u00A7c\u00A7l» \u00A77Insufficient credits to place this bounty.");
                    return false;
                }
                const charged = await EconomyBridge.taxPlayer(creatorPlayerOrSystem, amountNum);
                if (!charged) {
                    creatorPlayerOrSystem.sendMessage("\u00A7c\u00A7l» \u00A77Transaction failure. Deduction aborted.");
                    return false;
                }
            }

            // 2. Insert/Update SoA arrays
            const index = BountyData.targets.indexOf(targetPlayer.id);
            if (index !== -1) {
                BountyData.amounts[index] += amountNum;
            } else {
                BountyData.targets.push(targetPlayer.id);
                BountyData.names.push(targetPlayer.name);
                BountyData.amounts.push(amountNum);
                BountyData.creators.push(creatorId);
                BountyData.timestamps.push(Date.now());
            }

            // 3. Save & broadcast
            BountyData.save(context);
            
            const total = this.getBountyAmount(targetPlayer.id);
            const msg = isSystem 
                ? `\u00A76\u00A7l[Bounty] \u00A7cSYSTEM \u00A77placed an auto-bounty on \u00A7e${targetPlayer.name} \u00A77for \u00A7a$${amountNum.toLocaleString()}\u00A77! Total: \u00A7a$${total.toLocaleString()}`
                : `\u00A76\u00A7l[Bounty] \u00A7e${creatorPlayerOrSystem.name} \u00A77placed a bounty on \u00A7e${targetPlayer.name} \u00A77for \u00A7a$${amountNum.toLocaleString()}\u00A77! Total: \u00A7a$${total.toLocaleString()}`;
            
            const world = context.getService("world");
            if (world) {
                world.getAllPlayers().forEach(p => p.sendMessage(msg));
            }
            return true;
        } catch (error) {
            context.error(`Failed to add bounty: ${error}`);
            return false;
        }
    },

    // ----------------------------------------------------------------------------
    // | method: claimBounty                                                      |
    // | Processes claim rewards and slices the target out of parallel arrays.    |
    // ----------------------------------------------------------------------------
    async claimBounty(context, victimId, killerPlayer) {
        try {
            const index = BountyData.targets.indexOf(victimId);
            if (index === -1) return;

            const amount = BountyData.amounts[index];
            const victimName = BountyData.names[index];

            // 1. Award payout
            const paid = await EconomyBridge.rewardPlayer(killerPlayer, amount);
            if (!paid) {
                context.error(`Bounty payout failed for ${killerPlayer.name}. Retaining bounty in memory.`);
                return;
            }

            // 2. Slice parallel arrays
            BountyData.targets.splice(index, 1);
            BountyData.names.splice(index, 1);
            BountyData.amounts.splice(index, 1);
            BountyData.creators.splice(index, 1);
            BountyData.timestamps.splice(index, 1);

            // 3. Save & Broadcast
            BountyData.save(context);

            const msg = `\u00A76\u00A7l[Bounty] \u00A7e${killerPlayer.name} \u00A77has claimed the bounty on \u00A7e${victimName} \u00A77and pocketed \u00A7a$${amount.toLocaleString()}\u00A77!`;
            const world = context.getService("world");
            if (world) {
                world.getAllPlayers().forEach(p => p.sendMessage(msg));
            }
        } catch (error) {
            context.error(`Failed to claim bounty: ${error}`);
        }
    },

    // Helper queries
    getBountyAmount(targetId) {
        const index = BountyData.targets.indexOf(targetId);
        return index !== -1 ? BountyData.amounts[index] : 0;
    }
};
