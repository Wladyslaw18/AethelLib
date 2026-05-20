/*
 * LANG_CONTROLLER
 * ----------------------------------------------------------------------------
 * Formatting and string manifest for Golden-White protocol.
 */

export const Lang = {
    // VISUAL_TOKENS
    PREFIX: "\u00A76\u00A7lAethel\u00A7fLib \u00A7r\u00A78| ",
    GOLD: "\u00A76\u00A7l",
    WHITE: "\u00A7f\u00A7l",
    GRAY: "\u00A77",
    DARK: "\u00A78",
    ERROR: "\u00A7c\u00A7l",
    SUCCESS: "\u00A7a\u00A7l",
    GRID_L: "\u00A7a\u00A7e\u00A7l",
    GRID_M: "\u00A7a\u00A7e\u00A7m",

    // STRINGS_MANIFEST
    UI: {
        MENU_TITLE: "\u00A7a\u00A7e\u00A7m\u00A70\u00A7lAethelNexus",
        MENU_BODY: "\u00A77System Hub\n\u00A78Select functional vector.",
        
        HOMES_TITLE: "\u00A7a\u00A7e\u00A7l\u00A76\u00A7lHOME NODES",
        HOMES_BODY: "\u00A77Manage spatial anchors.",
        HOMES_CREATE: "\u00A7a\u00A7lSET HOME\n\u00A78Save current coords",
        HOMES_LIST: "\u00A7e\u00A7lHOME LIST\n\u00A78Return to anchor",
        HOMES_DELETE: "\u00A7c\u00A7lDELETE\n\u00A78Purge node",

        PLAYERS_TITLE: "\u00A7a\u00A7e\u00A7l\u00A76\u00A7lPLAYER LIST",
        PLAYERS_BODY: "\u00A77Online: \u00A7e{count}\n\u00A78Select player.",
        
        PLAYER_DETAIL_TITLE: "\u00A76\u00A7lPLAYER: {name}",
        PLAYER_DETAIL_BODY: "\u00A77Select protocol.",
        PLAYER_PAY: "\u00A7a\u00A7lPAY\n\u00A78Transfer credits",
        PLAYER_MSG: "\u00A7b\u00A7lMESSAGE\n\u00A78Send private data",
        PLAYER_TP: "\u00A7d\u00A7lTPA\n\u00A78Request teleport",

        SHOP_TITLE: "\u00A7a\u00A7e\u00A7l\u00A76\u00A7lSHOP",
        SHOP_QUICK_SELL: "\u00A7e\u00A7lQUICK SELL\n\u00A78Liquidate held asset",
        
        AUCTION_TITLE: "\u00A7a\u00A7e\u00A7l\u00A76\u00A7lAUCTION HOUSE"
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
