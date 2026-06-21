import { Kernel } from "../../../core/Kernel.js"
import { showAdminPanel } from "../AdminPanelMain.js"
import { SettingsStore } from "../../../core/store/SettingsStore.js"
import { UIUtils } from "../../UIUtils.js"
import { Lang } from "../../Lang.js"
import { SchemaRenderer } from "../../core/SchemaRenderer.js"

import { CoreSettingsSchema } from "./schemas/CoreSettingsSchema.js"
import { SystemModulesSchema } from "./schemas/SystemModulesSchema.js"
import { GameplayFeaturesSchema } from "./schemas/GameplayFeaturesSchema.js"
import { AssetManifestsSchema } from "./schemas/AssetManifestsSchema.js"
import { AuthorityLimitsSchema } from "./schemas/AuthorityLimitsSchema.js"

export async function showServerSettings(player) {
    const PermissionManager = Kernel.get("permissions")
    if (!PermissionManager || !PermissionManager.hasPermission(player, "essentials.admin")) {
        player.sendMessage("\u00A7cNo permission.")
        return
    }

    const form = new Kernel.ActionFormData()
        .title(Lang.GRID_M + "\u00A76\u00A7lSYSTEM SETTINGS")
        .body("\u00A77Select a configuration category to modify global server variables.")
        .button("\u00A7eCore Configuration\n\u00A78Money bounds, prefixes, text info", "textures/items/book_writable")
        .button("\u00A7aSystem Modules\n\u00A78Toggle core mechanics and subsystems", "textures/items/comparator")
        .button("\u00A7bGameplay & Features\n\u00A78PVP, cooldowns, display options", "textures/items/diamond_sword")
        .button("\u00A7dAsset Manifests\n\u00A78Banned items and hostile mobs", "textures/items/paper")
        .button("\u00A7dAuthority \u0026 Limits\n\u00A78Admin tags, default ranks, bounds", "textures/items/iron_chestplate")
        .button("\u00A7cRank Permissions\n\u00A78In-game rank permission editor", "textures/ui/op")
        .button("\u00A7cBACK", "textures/ui/refresh");

    const res = await UIUtils.showForm(player, form)
    if (res.canceled) return

    const settings = SettingsStore.getAll()
    const back = () => Kernel.system.runTimeout(() => showServerSettings(player), 5)
    
    // Arrays require joining before rendering into text fields
    const joinArray = (arr) => (arr || []).join(", ");
    const stateObj = {
        ...settings,
        bannedItems: joinArray(settings.bannedItems),
        hostileMobs: joinArray(settings.hostileMobs),
        superAdminTags: joinArray(settings.superAdminTags)
    };

    const onSave = (updatedSettings) => {
        // Any specific post-processing or direct merge
        Object.assign(settings, updatedSettings);
        SettingsStore.updateAll(settings);
        player.sendMessage("\u00A7a\u00A7l» \u00A7fSettings saved successfully.");
    };

    switch (res.selection) {
        case 0: return SchemaRenderer.render(player, CoreSettingsSchema, stateObj, back, onSave);
        case 1: return SchemaRenderer.render(player, SystemModulesSchema, stateObj, back, onSave);
        case 2: return SchemaRenderer.render(player, GameplayFeaturesSchema, stateObj, back, onSave);
        case 3: return SchemaRenderer.render(player, AssetManifestsSchema, stateObj, back, onSave);
        case 4: return SchemaRenderer.render(player, AuthorityLimitsSchema, stateObj, back, onSave);
        case 5: {
            const { RankManagerMenu } = await import("../../social/ranks/RankManagerMenu.js");
            return RankManagerMenu.showRankList(player, back);
        }
        case 6: return showAdminPanel(player);
    }
}
