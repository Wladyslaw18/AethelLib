import { Kernel } from "../Kernel.js";
import { Configuration } from "../../Configuration.js";
import { SpatialCache } from "../../systems/protection/SpatialCache.js";

const PERMISSIONS = { BUILD: 1, CONTAINERS: 2, DOORS: 4, REDSTONE: 8, MOB_INTERACT: 16, CRAFTING: 32 };
const CONTAINER_BLOCKS = new Set(["chest", "barrel", "trapped_chest", "shulker", "hopper", "dropper", "dispenser", "furnace", "blast_furnace", "smoker", "brewing_stand"]);
const DOOR_BLOCKS = new Set(["door", "gate", "trapdoor"]);
const REDSTONE_BLOCKS = new Set(["lever", "button", "pressure_plate", "daylight_detector", "tripwire_hook", "repeater", "comparator"]);
const CRAFTING_BLOCKS = new Set(["crafting_table", "smithing_table", "cartography_table", "loom", "stonecutter", "grindstone", "anvil", "enchanting_table"]);

function classifyBlock(typeId) {
    for (const keyword of CONTAINER_BLOCKS) if (typeId.includes(keyword)) return PERMISSIONS.CONTAINERS;
    for (const keyword of DOOR_BLOCKS) if (typeId.includes(keyword)) return PERMISSIONS.DOORS;
    for (const keyword of REDSTONE_BLOCKS) if (typeId.includes(keyword)) return PERMISSIONS.REDSTONE;
    for (const keyword of CRAFTING_BLOCKS) if (typeId.includes(keyword)) return PERMISSIONS.CRAFTING;
    return 0;
}

function isGod(player) {
    const tags = player.getTags();
    return Configuration.SUPER_ADMIN_TAGS.some(tag => tags.includes(tag));
}

export const MasterDispatcher = {
    _initialized: false,

    init() {
        if (this._initialized) return;
        this._initialized = true;

        // Unified Interact Gate
        Kernel.world.beforeEvents.playerInteractWithBlock.subscribe((ev) => {
            const { player, block, itemStack } = ev;
            if (isGod(player)) return;

            // 1. Placement Check (Hold block-like items)
            if (itemStack && (itemStack.typeId.includes("_block") || itemStack.typeId.includes("stone") || itemStack.typeId.includes("planks") || itemStack.typeId.includes("dirt") || itemStack.typeId.includes("log"))) {
                if (!SpatialCache.canBuild(player, block.location)) {
                    ev.cancel = true;
                    player.onScreenDisplay.setActionBar("\u00A7c\u00A7l» \u00A77You cannot build here!");
                    return;
                }
            }

            // 2. Classified Block Check
            const required = classifyBlock(block.typeId);
            if (required !== 0 && !SpatialCache.hasPermission(player, block.location, required)) {
                ev.cancel = true;
                player.onScreenDisplay.setActionBar("\u00A7c\u00A7l» \u00A77You cannot interact with this!");
                return;
            }

            // 3. Infrastructure Routing
            const shopStore = Kernel.get("chestShopStore");
            if (shopStore && shopStore.isShop(block.location)) {
                Kernel.get("signalBus").emit("internal:shopInteract", ev);
                return;
            }

            Kernel.get("signalBus").emit("external:blockInteract", ev);
        });

        // Unified Break Gate
        Kernel.world.beforeEvents.playerBreakBlock.subscribe((ev) => {
            const { player, block } = ev;
            if (isGod(player)) return;

            if (!SpatialCache.canBuild(player, block.location)) {
                ev.cancel = true;
                player.onScreenDisplay.setActionBar("\u00A7c\u00A7l» \u00A77You cannot build here!");
            }
        });

        // Unified Entity Interact Gate
        Kernel.world.beforeEvents.playerInteractWithEntity.subscribe((ev) => {
            const { player, target } = ev;
            if (isGod(player) || !target?.location) return;

            if (!SpatialCache.hasPermission(player, target.location, PERMISSIONS.MOB_INTERACT)) {
                ev.cancel = true;
                player.onScreenDisplay.setActionBar("\u00A7c\u00A7l» \u00A77You cannot interact with mobs here!");
            }
        });
    }
};
