/*
 * LANG_CONTROLLER
 * ----------------------------------------------------------------------------
 * Formatting and string manifest for Golden-White protocol.
 */

export const Lang = {
    // VISUAL_TOKENS
    PREFIX: "§6§lAethel§fLib §r§8| ",
    GOLD: "§6§l",
    WHITE: "§f§l",
    GRAY: "§7",
    DARK: "§8",
    ERROR: "§c§l",
    SUCCESS: "§a§l",
    GRID_L: "§a§e§l",
    GRID_M: "§a§e§m",

    // STRINGS_MANIFEST
    UI: {
        MENU_TITLE: "§a§e§m§0§lAethelNexus",
        MENU_BODY: "§7System Hub\n§8Select functional vector.",
        
        HOMES_TITLE: "§a§e§l§6§lHOME NODES",
        HOMES_BODY: "§7Manage spatial anchors.",
        HOMES_CREATE: "§a§lSET HOME\n§8Save current coords",
        HOMES_LIST: "§e§lHOME LIST\n§8Return to anchor",
        HOMES_DELETE: "§c§lDELETE\n§8Purge node",

        PLAYERS_TITLE: "§a§e§l§6§lPLAYER LIST",
        PLAYERS_BODY: "§7Online: §e{count}\n§8Select player.",
        
        PLAYER_DETAIL_TITLE: "§6§lPLAYER: {name}",
        PLAYER_DETAIL_BODY: "§7Select protocol.",
        PLAYER_PAY: "§a§lPAY\n§8Transfer credits",
        PLAYER_MSG: "§b§lMESSAGE\n§8Send private data",
        PLAYER_TP: "§d§lTPA\n§8Request teleport",

        SHOP_TITLE: "§a§e§l§6§lSHOP",
        SHOP_QUICK_SELL: "§e§lQUICK SELL\n§8Liquidate held asset",
        
        AUCTION_TITLE: "§a§e§l§6§lAUCTION HOUSE"
    },

    /**
     * FORMAT_PROTO
     */
    format(template, vars = {}) {
        let str = template;
        for (const [key, val] of Object.entries(vars)) {
            str = str.replace(`{${key}}`, val);
        }
        return str;
    },

    /**
     * ASSET_RESOLVER
     */
    getTexture(id) {
        const cleanId = id.replace("minecraft:", "");
        const mappings = {
            "money": "textures/items/gold_nugget",
            "credits": "textures/items/gold_ingot",
            "cancel": "textures/ui/cancel"
        };

        if (mappings[cleanId]) return mappings[cleanId];
        
        const blocks = ["stone", "dirt", "grass", "planks", "log", "brick", "glass", "chest", "table", "block", "ore"];
        const isBlock = blocks.some(b => cleanId.includes(b));
        
        return `textures/${isBlock ? "blocks" : "items"}/${cleanId}`;
    }
};
