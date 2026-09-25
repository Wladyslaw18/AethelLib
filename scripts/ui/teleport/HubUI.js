import { Kernel } from "../../core/Kernel.js";
import { WarpStore } from "../../systems/teleport/WarpStore.js";
import { Lang } from "../Lang.js";
import { UIUtils } from "../UIUtils.js";

/**
 * HUB_SETUP_UI_CONTROLLER
 * ----------------------------------------------------------------------------
 * Visual interface for administrators to link the /hub command to any
 * waypoint in the WarpStore registry and configure teleport timers/cooldowns.
 */
export async function showSetHubUI(player, onBack) {
    const warps = await WarpStore.getWarps();
    const currentHub = await WarpStore.getHubWarpName();
    const delay = await WarpStore.getHubDelay();
    const cooldown = await WarpStore.getHubCooldown();
    const warpNames = Object.keys(warps).sort((a, b) => a.localeCompare(b));

    const statusText = currentHub 
        ? `\u00A77Current Hub Target: \u00A7a\u00A7l${currentHub.toUpperCase()}`
        : "\u00A77Current Hub Target: \u00A7cNot Configured";

    const form = new Kernel.ActionFormData()
        .title("\u00A76\u00A7lHUB SETUP & WARP LINKER")
        .body(
            `\u00A77Link the server \u00A7e/hub \u00A77command to any public waypoint.\n` +
            `\u00A77Players executing \u00A7e/hub \u00A77will be centered at this destination.\n\n` +
            `${statusText}\n` +
            `\u00A77Warmup Delay: \u00A7e${delay}s \u00A78|\u00A77 Cooldown: \u00A7e${cooldown}s\n` +
            `\u00A77Available Waypoints: \u00A7e${warpNames.length}`
        );

    // Navigation and quick actions
    form.button("\u00A7c\u00A7l[BACK]", "textures/ui/refresh");
    form.button("\u00A76\u00A7l[⚙] CONFIGURE TIMERS & COOLDOWNS\n\u00A78Set warmup delay and cooldown", "textures/ui/settings_glyph_color_2x");
    form.button("\u00A7a\u00A7l[+] SET CURRENT POSITION AS HUB\n\u00A78Save location as 'hub'", "textures/ui/color_plus");

    // List all existing warps from WarpStore
    for (const name of warpNames) {
        const isCurrent = (currentHub && currentHub.toLowerCase() === name.toLowerCase());
        const label = isCurrent 
            ? `\u00A7a\u00A7l${name.toUpperCase()} \u00A72[ACTIVE]\n\u00A78Currently linked Hub`
            : `\u00A7f\u00A7l${name.toUpperCase()}\n\u00A78Click to link as /hub`;
        form.button(label, "textures/items/ender_eye");
    }

    const res = await UIUtils.showForm(player, form);
    if (res.canceled) return;

    // Back button
    if (res.selection === 0) {
        if (onBack) {
            Kernel.system.run(() => onBack(player));
        }
        return;
    }

    // Configure timers & cooldowns
    if (res.selection === 1) {
        Kernel.system.run(() => showHubTimersUI(player, () => showSetHubUI(player, onBack)));
        return;
    }

    // Set current position as 'hub'
    if (res.selection === 2) {
        const location = player.location;
        const dimension = player.dimension.id;
        const success = await WarpStore.setWarp("hub", location, dimension, player.name);
        if (success) {
            await WarpStore.setHubWarpName("hub");
            player.sendMessage("\u00A7a\u00A7l» \u00A7fWarp '\u00A7ehub\u00A7f' created at your position and linked to \u00A7e/hub\u00A7f!");
        } else {
            player.sendMessage("\u00A7c\u00A7l» \u00A77Failed to create 'hub' warp.");
        }
        return;
    }

    // Select existing warp
    const selectedWarp = warpNames[res.selection - 3];
    if (!selectedWarp) return;

    await WarpStore.setHubWarpName(selectedWarp);
    player.sendMessage(`\u00A7a\u00A7l» \u00A7fServer Hub successfully linked to warp '\u00A7e${selectedWarp}\u00A7f'!`);
}

/**
 * Visual modal dialog for configuring hub cooldown and warmup delay timers.
 */
export async function showHubTimersUI(player, backCallback) {
    const currentDelay = await WarpStore.getHubDelay();
    const currentCd = await WarpStore.getHubCooldown();

    const form = new Kernel.ModalFormData()
        .title("\u00A76\u00A7lHUB TIMERS & COOLDOWNS")
        .textField("Teleport Warmup Delay (seconds, 0 for instant):", "e.g. 3", String(currentDelay))
        .textField("Command Cooldown (seconds, 0 for none):", "e.g. 15", String(currentCd));

    const res = await UIUtils.showForm(player, form);
    if (res.canceled) {
        if (backCallback) Kernel.system.run(() => backCallback(player));
        return;
    }

    const rawDelay = String(res.formValues[0]).trim();
    const rawCd = String(res.formValues[1]).trim();

    const parsedDelay = Math.max(0, parseInt(rawDelay) || 0);
    const parsedCd = Math.max(0, parseInt(rawCd) || 0);

    await WarpStore.setHubDelay(parsedDelay);
    await WarpStore.setHubCooldown(parsedCd);

    player.sendMessage(`\u00A7a\u00A7l» \u00A7fHub timers updated: Warmup \u00A7e${parsedDelay}s\u00A7f, Cooldown \u00A7e${parsedCd}s\u00A7f.`);

    if (backCallback) {
        Kernel.system.run(() => backCallback(player));
    }
}
