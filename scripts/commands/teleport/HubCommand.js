import { WarpStore } from "../../systems/teleport/WarpStore.js";
import { Kernel } from "../../core/Kernel.js";

// In-memory cache for hub cooldown tracking per player
const hubCooldowns = new Map();

/**
 * HubCommand
 * ----------------------------------------------------------------------------
 * Dynamic hub teleportation vector. Resolves the designated warp anchor 
 * from WarpStore, applies block-centering (+0.5), and enforces configurable
 * warmup delays (with combat/movement checks) and command cooldowns.
 */
export const HubCommand = {
    name: "hub",
    aliases: ["lobby"],
    description: "Teleport to the server hub",
    usage: "/ae:hub",
    permission: "essentials.hub",
    category: "teleport",
    parameters: [],

    async execute(_data, player, _args) {
        const rawPlayer = player.__rawEntity__ || player;
        const hubInfo = await WarpStore.getHubWarp();
        const teleportService = Kernel.get("teleportService");

        if (!teleportService) {
            rawPlayer.sendMessage("\u00A7c\u00A7l» \u00A77Teleport service is unavailable.");
            return;
        }

        if (!hubInfo || !hubInfo.warp) {
            const isAdmin = rawPlayer.hasTag?.("admin") || rawPlayer.hasTag?.("AE") || rawPlayer.hasTag?.("op");
            if (isAdmin) {
                rawPlayer.sendMessage("\u00A7c\u00A7l» \u00A77There is no Hub set yet. Use \u00A7e/ae:sethub \u00A77to configure it.");
            } else {
                rawPlayer.sendMessage("\u00A7c\u00A7l» \u00A77There is no Hub set yet. Please talk to an admin to set it up!");
            }
            return;
        }

        const PermissionManager = Kernel.get("permissions");
        const isAdmin = rawPlayer.hasTag?.("admin") || rawPlayer.hasTag?.("AE") || rawPlayer.hasTag?.("op") ||
            (PermissionManager ? PermissionManager.hasPermission(rawPlayer, "admin") : false);

        // 1. Cooldown Check (skipped for administrators)
        if (!isAdmin) {
            let cdSeconds = null;
            if (PermissionManager) {
                const rankCd = PermissionManager.getPermission(rawPlayer, "cooldown.hub") ?? 
                               PermissionManager.getPermission(rawPlayer, "hub.cooldown");
                if (rankCd !== null && rankCd !== undefined) {
                    cdSeconds = Number(rankCd);
                }
            }

            if (cdSeconds === null) {
                cdSeconds = await WarpStore.getHubCooldown();
            }

            if (cdSeconds > 0) {
                const cdTicks = cdSeconds * 20;
                const lastTick = hubCooldowns.get(rawPlayer.id) ?? 0;
                const diff = Kernel.system.currentTick - lastTick;

                if (diff < cdTicks) {
                    const remaining = Math.ceil((cdTicks - diff) / 20);
                    rawPlayer.sendMessage(`\u00A7c\u00A7l» \u00A77Please wait \u00A7e${remaining}s \u00A77before using \u00A7e/hub \u00A77again.`);
                    return;
                }
            }
        }

        // 2. Warmup Delay Resolution
        let waitTime = 0;
        if (!isAdmin) {
            const globalDelay = await WarpStore.getHubDelay();
            if (globalDelay !== null && globalDelay !== undefined) {
                waitTime = Number(globalDelay);
            } else if (PermissionManager) {
                const rankWait = PermissionManager.getPermission(rawPlayer, "teleport.wait");
                if (rankWait !== null && rankWait !== undefined) {
                    waitTime = Number(rankWait);
                }
            }
        }

        const warp = hubInfo.warp;
        const targetLoc = { x: warp.x + 0.5, y: warp.y, z: warp.z + 0.5 };

        if (waitTime > 0) {
            const success = await teleportService.teleportWithWait(rawPlayer, targetLoc, warp.dimension, waitTime);
            if (success) {
                rawPlayer.sendMessage(`\u00A7a\u00A7l» \u00A7fTeleported to Hub (\u00A7e${hubInfo.name}\u00A7f).`);
                hubCooldowns.set(rawPlayer.id, Kernel.system.currentTick);
            }
        } else {
            const success = teleportService.teleport(rawPlayer, targetLoc, warp.dimension);
            if (success) {
                rawPlayer.sendMessage(`\u00A7a\u00A7l» \u00A7fTeleported to Hub (\u00A7e${hubInfo.name}\u00A7f).`);
                hubCooldowns.set(rawPlayer.id, Kernel.system.currentTick);
            }
        }
    }
};
