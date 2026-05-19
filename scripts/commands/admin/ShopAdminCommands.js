import { Kernel } from "../../core/Kernel.js";
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
                player.sendMessage("\xA7c\xA7l» \xA77Usage: /ae:shopadd <category> <price> [priority]");
                return;
            }

            const category = args[0].toUpperCase();
            const price = parseInt(args[1]);
            const priority = parseInt(args[2]) || 99;

            if (isNaN(price) || price < 0) {
                player.sendMessage("\xA7c\xA7l» \xA77Invalid price calibration.");
                return;
            }

            // GET HELD ITEM
            const equippable = player.getComponent(Kernel.EntityComponentTypes.Equippable);
            const item = equippable?.getEquipment("Mainhand");

            if (!item) {
                player.sendMessage("\xA7c\xA7l» \xA77No asset detected in hand buffer.");
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

            player.sendMessage(`\xA7a\xA7l» \xA7fSuccessfully registered \xA7e${itemId} \xA7fto \xA7b${category} \xA7ffor \xA7a$${price.toLocaleString()} \xA7f(Priority: ${priority}).`);
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
                player.sendMessage("\xA7c\xA7l» \xA77Usage: /ae:shopcatmk <id> [icon] [priority]");
                return;
            }

            const id = args[0].toUpperCase();
            const icon = args[1] || "textures/items/bucket";
            const priority = parseInt(args[2]) || 99;

            ShopRegistry.addCategory(id, icon, priority);

            player.sendMessage(`\xA7a\xA7l» \xA7fSuccessfully created category \xA7b${id} \xA7fwith icon \xA7e${icon} \xA7f(Priority: ${priority}).`);
        }
    }
];
