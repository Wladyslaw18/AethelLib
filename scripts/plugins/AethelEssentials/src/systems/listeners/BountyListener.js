import { BountyStore } from "../stores/BountyStore.js";
import { getKillstreak } from "../../../../../systems/combat/Killstreaks.js";

export const BountyListener = {
    _context: null,

    init(context) {
        this._context = context;

        // Register Death Event Listeners with strict try-catch boundary
        this._context.world.afterEvents.entityDie.subscribe((event) => {
            try {
                const victim = event.deadEntity;
                const killer = event.damageSource?.damagingEntity;

                if (victim?.typeId === "minecraft:player") {
                    const victimId = victim.id;

                    // Defer execution to next tick to let Killstreaks logic complete first
                    this._context.system.run(async () => {
                        try {
                            // A. Claim Bounty
                            if (killer?.typeId === "minecraft:player" && killer.id !== victimId) {
                                const bountyAmount = BountyStore.getBountyAmount(victimId);
                                if (bountyAmount > 0) {
                                    await BountyStore.claimBounty(victimId, killer);
                                }
                            }

                            // B. Auto-Bounty on Killstreak
                            if (killer?.typeId === "minecraft:player") {
                                const streak = getKillstreak(killer.id);
                                let autoAmount = 0;
                                if (streak === 5) autoAmount = 250;
                                else if (streak === 10) autoAmount = 500;
                                else if (streak === 15) autoAmount = 1000;
                                else if (streak === 20) autoAmount = 2500;

                                if (autoAmount > 0) {
                                    const targetPlayer = killer;
                                    await BountyStore.addBounty(targetPlayer, "SYSTEM", autoAmount);
                                }
                            }
                        } catch (err) {
                            this._context.error(`Deferred bounty event loop error: ${err}`);
                        }
                    });
                }
            } catch (error) {
                this._context.error(`Bounty death event subscription error: ${error}`);
            }
        });

        context.log("[BountyListener] Subscribed to world events.");
    }
};
