import { Kernel } from "../../core/Kernel.js";
import { MINECRAFT_ITEMS } from "../../data/minecraft-items.js";

/**
 * Registers dropdown suggestions for native command autocomplete.
 * Called during early bootstrap to synchronize with C++ registries.
 */
export function registerShopEnums() {
    const CommandRegistry = Kernel.get("commandRegistry");
    if (!CommandRegistry) {
        console.error("[Shop] Failed to register enums: CommandRegistry not found");
        return;
    }

    const allItemIds = Object.keys(MINECRAFT_ITEMS);
    CommandRegistry.registerEnum("shop_items", allItemIds);

    CommandRegistry.registerEnum("shop_categories", [
        "all",
        "weapons",
        "armor",
        "tools",
        "blocks",
        "materials",
        "food",
        "potions",
        "misc"
    ]);

    CommandRegistry.registerEnum("cart_actions", [
        "add",
        "remove",
        "clear",
        "list",
        "checkout"
    ]);

    CommandRegistry.registerEnum("shop_actions", [
        "list",
        "search",
        "buy",
        "info",
        "cart",
        "checkout"
    ]);

    console.log("[Shop] Registered autocomplete enums successfully.");
}
