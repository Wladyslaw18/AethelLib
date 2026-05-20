import { Kernel } from "../../../../core/Kernel.js";
import { BountyData } from "../storage/BountyData.js";
import { EconomyBridge } from "../economy/EconomyBridge.js";
import { BountySystem } from "../systems/BountySystem.js";
import { getKillstreak } from "../../../../systems/combat/Killstreaks.js";

// ----------------------------------------------------------------------------
// | module: bootloader                                                       |
// | Handles step-by-step setup of data tables, listener hooks, and commands. |
// ----------------------------------------------------------------------------
export function boot(context) {
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
    Kernel.world.afterEvents.entityDie.subscribe((event) => {
        try {
            const victim = event.deadEntity;
            const killer = event.damageSource?.damagingEntity;

            if (victim?.typeId === "minecraft:player") {
                const victimId = victim.id;

                // Defer execution to next tick to let Killstreaks logic complete first
                Kernel.system.run(async () => {
                    try {
                        // A. Claim Bounty
                        if (killer?.typeId === "minecraft:player" && killer.id !== victimId) {
                            const bountyAmount = BountySystem.getBountyAmount(victimId);
                            if (bountyAmount > 0) {
                                await BountySystem.claimBounty(context, victimId, killer);
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

    // 4. Command Registrations
    registerCommands(context);
}

// ----------------------------------------------------------------------------
// | function: registerCommands                                               |
// ----------------------------------------------------------------------------
function registerCommands(context) {
    // /ae:placebounty <playerName> <amount>
    context.registerCommand({
        name: "placebounty",
        description: "Place a hit/bounty on a player",
        usage: "/ae:placebounty <playerName> <amount>",
        permission: "essentials.bounty.place",
        category: "ECONOMY",
        execute(data, player, args) {
            try {
                if (args.length < 2) {
                    player.sendMessage("\u00A7c\u00A7l» \u00A77Usage: /ae:placebounty <playerName> <amount>");
                    return;
                }

                const targetName = args[0];
                const amount = Number(args[1]);

                if (isNaN(amount) || amount <= 0) {
                    player.sendMessage("\u00A7c\u00A7l» \u00A77Amount must be a positive integer.");
                    return;
                }

                const world = context.getService("world");
                const target = world.getAllPlayers().find(p => p.name.toLowerCase() === targetName.toLowerCase());

                if (!target) {
                    player.sendMessage(`\u00A7c\u00A7l» \u00A77Player '${targetName}' not found or offline.`);
                    return;
                }

                if (target.id === player.id) {
                    player.sendMessage("\u00A7c\u00A7l» \u00A77You cannot place a bounty on yourself.");
                    return;
                }

                Kernel.system.run(async () => {
                    await BountySystem.addBounty(context, target, player, amount);
                });
            } catch (err) {
                player.sendMessage(`\u00A7c\u00A7l» \u00A77Command execution failed: ${err.message}`);
            }
        }
    });

    // /ae:bounties
    context.registerCommand({
        name: "bounties",
        description: "List all active player bounties",
        usage: "/ae:bounties",
        permission: "essentials.bounty.list",
        category: "ECONOMY",
        execute(data, player, args) {
            try {
                if (BountyData.targets.length === 0) {
                    player.sendMessage("\u00A76\u00A7l[Bounty] \u00A77There are currently no active bounties.");
                    return;
                }

                player.sendMessage("\u00A76\u00A7l=== ACTIVE BOUNTIES ===");
                for (let i = 0; i < BountyData.targets.length; i++) {
                    const name = BountyData.names[i];
                    const amount = BountyData.amounts[i];
                    const ageMin = Math.floor((Date.now() - BountyData.timestamps[i]) / 60000);
                    player.sendMessage(`\u00A7e» \u00A7f${name} \u00A78- \u00A7a$${amount.toLocaleString()} \u00A78(${ageMin}m ago)`);
                }
            } catch (err) {
                player.sendMessage(`\u00A7c\u00A7l» \u00A77Failed to retrieve bounties: ${err.message}`);
            }
        }
    });
}
