import { EntityComponentTypes, ItemStack } from "@minecraft/server";
import { ShopRegistry } from "../../systems/shop/ShopRegistry.js";
import { ValidationHelper } from "../../utils/ValidationHelper.js";

/**
 * SHOP_ADMIN_VECTORS
 * ----------------------------------------------------------------------------
 * Administrative tools for live shop orchestration.
 */
export const ShopAdminCommands = [
    {
        name: "shopadd",
        description: "Registers the held item to the industrial shop manifest.",
        usage: "/ae:shopadd <category> <price> [priority]",
        permission: "admin.shop",
        category: "ADMIN",
        execute(_data, player, args) {
            if (args.length < 2) {
                player.sendMessage("§c§l» §7Usage: /ae:shopadd <category> <price> [priority]");
                return;
            }

            const category = args[0].toUpperCase();
            const price = parseInt(args[1]);
            const priority = parseInt(args[2]) || 99;

            if (isNaN(price) || price < 0) {
                player.sendMessage("§c§l» §7Invalid price calibration.");
                return;
            }

            // GET HELD ITEM
            const equippable = player.getComponent(EntityComponentTypes.Equippable);
            const item = equippable?.getEquipment("Mainhand");

            if (!item) {
                player.sendMessage("§c§l» §7No asset detected in hand buffer.");
                return;
            }

            const itemId = item.typeId;
            
            // REGISTER
            ShopRegistry.registerAsset(category, itemId, {
                price: price,
                priority: priority,
                name: item.nameTag || itemId.split(":")[1].replace(/_/g, " ").toUpperCase(),
                timestamp: Date.now()
            });

            player.sendMessage(`§a§l» §fSuccessfully registered §e${itemId} §fto §b${category} §ffor §a$${price.toLocaleString()} §f(Priority: ${priority}).`);
        }
    },
    {
        name: "shopcatmk",
        description: "Creates a new shop category with a custom icon and priority.",
        usage: "/ae:shopcatmk <id> [icon_texture] [priority]",
        permission: "admin.shop",
        category: "ADMIN",
        execute(_data, player, args) {
            if (args.length < 1) {
                player.sendMessage("§c§l» §7Usage: /ae:shopcatmk <id> [icon] [priority]");
                return;
            }

            const id = args[0].toUpperCase();
            const icon = args[1] || "textures/items/bucket";
            const priority = parseInt(args[2]) || 99;

            ShopRegistry.addCategory(id, icon, priority);

            player.sendMessage(`§a§l» §fSuccessfully created category §b${id} §fwith icon §e${icon} §f(Priority: ${priority}).`);
        }
    }
];
