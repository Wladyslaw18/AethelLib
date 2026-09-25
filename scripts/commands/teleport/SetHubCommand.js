import { WarpStore } from "../../systems/teleport/WarpStore.js";
import { Kernel } from "../../core/Kernel.js";
import { showSetHubUI } from "../../ui/teleport/HubUI.js";

/**
 * SetHubCommand
 * ----------------------------------------------------------------------------
 * Administrative command to configure the server hub. When called without
 * arguments (or with 'setup'/'menu'), opens the visual Warp Setup Menu.
 * Also supports setting cooldowns, warmup delays, and direct warp links.
 */
export const SetHubCommand = {
    name: "sethub",
    aliases: ["setlobby"],
    description: "Configure or link the server hub to a warp, or adjust cooldowns",
    usage: "/ae:sethub [warpName|cooldown|delay] [value]",
    permission: "essentials.hub.set",
    category: "teleport",
    parameters: [
        { name: "actionOrWarp", type: "string", optional: true },
        { name: "value", type: "string", optional: true }
    ],

    async execute(_data, player, args) {
        let firstArg = args ? args[0] : null;
        let secondArg = args ? args[1] : null;

        if (firstArg !== undefined && firstArg !== null) {
            firstArg = String(firstArg).trim();
        }
        if (secondArg !== undefined && secondArg !== null) {
            secondArg = String(secondArg).trim();
        }

        // When no argument or setup keyword is passed, launch the Warp Setup Menu
        if (!firstArg || firstArg.toLowerCase() === "menu" || firstArg.toLowerCase() === "setup") {
            Kernel.system.run(() => showSetHubUI(player));
            return;
        }

        // Sub-action: /ae:sethub cooldown <seconds>
        if (firstArg.toLowerCase() === "cooldown" || firstArg.toLowerCase() === "cd") {
            if (!secondArg) {
                const currentCd = await WarpStore.getHubCooldown();
                player.sendMessage(`\u00A7a\u00A7l» \u00A7fCurrent Hub cooldown: \u00A7e${currentCd}s\u00A7f. Usage: \u00A77/ae:sethub cooldown <seconds>`);
                return;
            }
            const sec = Math.max(0, parseInt(secondArg) || 0);
            await WarpStore.setHubCooldown(sec);
            player.sendMessage(`\u00A7a\u00A7l» \u00A7fServer Hub cooldown set to \u00A7e${sec}s\u00A7f.`);
            return;
        }

        // Sub-action: /ae:sethub delay <seconds> or /ae:sethub warmup <seconds>
        if (firstArg.toLowerCase() === "delay" || firstArg.toLowerCase() === "warmup" || firstArg.toLowerCase() === "wait") {
            if (!secondArg) {
                const currentDelay = await WarpStore.getHubDelay();
                player.sendMessage(`\u00A7a\u00A7l» \u00A7fCurrent Hub warmup delay: \u00A7e${currentDelay}s\u00A7f. Usage: \u00A77/ae:sethub delay <seconds>`);
                return;
            }
            const sec = Math.max(0, parseInt(secondArg) || 0);
            await WarpStore.setHubDelay(sec);
            player.sendMessage(`\u00A7a\u00A7l» \u00A7fServer Hub warmup delay set to \u00A7e${sec}s\u00A7f.`);
            return;
        }

        const warpName = firstArg;
        if (!/^[a-zA-Z0-9_-]+$/.test(warpName)) {
            player.sendMessage("\u00A7c\u00A7l» \u00A77Warp name can only contain alphanumeric characters, underscores, and dashes.");
            return;
        }

        if (warpName.length < 1 || warpName.length > 16) {
            player.sendMessage("\u00A7c\u00A7l» \u00A77Warp name must be between 1 and 16 characters.");
            return;
        }

        // If a numeric second argument was given, update cooldown too
        if (secondArg && /^\d+$/.test(secondArg)) {
            const sec = parseInt(secondArg, 10);
            await WarpStore.setHubCooldown(sec);
        }

        const existingWarp = await WarpStore.getWarp(warpName);
        if (existingWarp) {
            await WarpStore.setHubWarpName(warpName);
            player.sendMessage(`\u00A7a\u00A7l» \u00A7fServer Hub successfully linked to existing warp '\u00A7e${warpName}\u00A7f'.`);
            return;
        }

        // Warp does not exist yet: create it at current position and link as hub
        const location = player.location;
        const dimension = player.dimension.id;
        const success = await WarpStore.setWarp(warpName, location, dimension, player.name);

        if (success) {
            await WarpStore.setHubWarpName(warpName);
            player.sendMessage(`\u00A7a\u00A7l» \u00A7fCreated warp '\u00A7e${warpName}\u00A7f' and designated it as the server Hub.`);
        } else {
            player.sendMessage("\u00A7c\u00A7l» \u00A77Failed to create warp for Hub.");
        }
    }
};
