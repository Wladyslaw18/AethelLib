import { BountyData } from "../storage/BountyData.js";
import { EconomyBridge } from "../economy/EconomyBridge.js";
import { BountySystem } from "../systems/BountySystem.js";
import { getKillstreak } from "../../../../systems/combat/Killstreaks.js";
import { PlayerUtils } from "../../../../utils/PlayerUtils.js";

let pluginContext = null;

// ----------------------------------------------------------------------------
// | module: bootloader                                                       |
// | Handles step-by-step setup of data tables, listener hooks, and commands. |
// ----------------------------------------------------------------------------
export function boot(context) {
    pluginContext = context;
    context.log("Booting sequenced modules...");

    // 1. Load serializations
    BountyData.load(context);

    // 2. Wire core economy API
    try {
        const economyApi = context.requireAPI("aethel:core_economy");
        EconomyBridge.bind(economyApi);
        context.log("Economy API bound successfully.");
    } catch (e) {
        context.error(`Economy API not found: ${e.message}`);
    }

    // 3. Register Death Event Listeners with strict try-catch boundary
    context.world.afterEvents.entityDie.subscribe((event) => {
        try {
            const victim = event.deadEntity;
            const killer = event.damageSource?.damagingEntity;

            if (victim?.typeId === "minecraft:player") {
                const victimId = victim.id;

                context.system.run(async () => {
                    try {
                        if (killer?.typeId === "minecraft:player" && killer.id !== victimId) {
                            const bountyAmount = BountySystem.getBountyAmount(victimId);
                            if (bountyAmount > 0) {
                                await BountySystem.claimBounty(context, victimId, killer);
                            }
                        }

                        if (killer?.typeId === "minecraft:player") {
                            const streak = getKillstreak(killer.id);
                            const { KILLSTREAK_CONFIG } = await import("../../../../data/KillstreakConfig.js");
                            let autoAmount = 0;
                            for (const tier of KILLSTREAK_CONFIG.tiers) {
                                if (streak >= tier.min_streak) {
                                    autoAmount = tier.min_streak * 50;
                                    break;
                                }
                            }
                            if (autoAmount > 0) {
                                await BountySystem.addBounty(context, killer, "SYSTEM", autoAmount);
                            }
                        }
                    } catch (err) {
                        context.error(`Deferred event loop error: ${err}`);
                    }
                });
            }
        } catch (error) {
            context.error(`Death event subscription error: ${error}`);
        }
    });
}

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
                player.sendMessage("\u00A7c\u00A7l» \u00A77Usage: /ae:placebounty <playerName> <amount>");
                return;
            }

            let target = args[0];
            if (target !== undefined && target !== null) {
                target = PlayerUtils.findPlayer(target);
            }

            if (!target || !target.isValid) {
                const targetName = String(args[0] || "");
                player.sendMessage(`\u00A7c\u00A7l» \u00A77Player '${targetName}' not found or offline.`);
                return;
            }

            const amount = Number(args[1]);
            if (isNaN(amount) || !Number.isInteger(amount) || !Number.isFinite(amount) || amount <= 0) {
                player.sendMessage("\u00A7c\u00A7l» \u00A77Amount must be a positive integer.");
                return;
            }

            if (target.id === player.id) {
                player.sendMessage("\u00A7c\u00A7l» \u00A77You cannot place a bounty on yourself.");
                return;
            }

            const rawTarget = target.__rawEntity__ || target;
            const rawPlayer = player.__rawEntity__ || player;

            if (pluginContext && pluginContext.system) {
                pluginContext.system.run(async () => {
                    try {
                        await BountySystem.addBounty(pluginContext, rawTarget, rawPlayer, amount);
                    } catch (err) {
                        console.error(`[BountyHunter] Async placebounty error: ${err}`);
                    }
                });
            } else {
                player.sendMessage("\u00A7c\u00A7l» \u00A77Plugin context unavailable.");
            }
        } catch (err) {
            player.sendMessage(`\u00A7c\u00A7l» \u00A77Command execution failed: ${err.message}`);
        }
    }
};

export const BountiesCommand = {
    name: "bounties",
    description: "List all active player bounties",
    usage: "/ae:bounties",
    permission: "essentials.bounty.list",
    category: "ECONOMY",
    execute(data, player, args) {
        try {
            if (!BountyData.targets || BountyData.targets.length === 0) {
                player.sendMessage("\u00A76\u00A7l[Bounty] \u00A77There are currently no active bounties.");
                return;
            }

            player.sendMessage("\u00A76\u00A7l=== ACTIVE BOUNTIES ===");
            for (let i = 0; i < BountyData.targets.length; i++) {
                const name = BountyData.names[i] || "Unknown";
                const amount = Number(BountyData.amounts[i]) || 0;
                const timestamp = Number(BountyData.timestamps[i]) || Date.now();
                const ageMin = Math.max(0, Math.floor((Date.now() - timestamp) / 60000));
                player.sendMessage(`\u00A7e» \u00A7f${name} \u00A78- \u00A7a$${amount.toLocaleString()} \u00A78(${ageMin}m ago)`);
            }
        } catch (err) {
            player.sendMessage(`\u00A7c\u00A7l» \u00A77Failed to retrieve bounties: ${err.message}`);
        }
    }
};
