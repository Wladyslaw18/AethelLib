/*
 * LANG_CONTROLLER
 * ----------------------------------------------------------------------------
 * Formatting and string manifest for Golden-White protocol.
 */

export const Lang = {
    // VISUAL_TOKENS
    PREFIX: "\xA76\xA7lAethel\xA7fLib \xA7r\xA78| ",
    GOLD: "\xA76\xA7l",
    WHITE: "\xA7f\xA7l",
    GRAY: "\xA77",
    DARK: "\xA78",
    ERROR: "\xA7c\xA7l",
    SUCCESS: "\xA7a\xA7l",
    GRID_L: "\xA7a\xA7e\xA7l",
    GRID_M: "\xA7a\xA7e\xA7m",

    // STRINGS_MANIFEST
    UI: {
        MENU_TITLE: "\xA7a\xA7e\xA7m\xA70\xA7lAethelNexus",
        MENU_BODY: "\xA77System Hub\n\xA78Select functional vector.",
        
        HOMES_TITLE: "\xA7a\xA7e\xA7l\xA76\xA7lHOME NODES",
        HOMES_BODY: "\xA77Manage spatial anchors.",
        HOMES_CREATE: "\xA7a\xA7lSET HOME\n\xA78Save current coords",
        HOMES_LIST: "\xA7e\xA7lHOME LIST\n\xA78Return to anchor",
        HOMES_DELETE: "\xA7c\xA7lDELETE\n\xA78Purge node",

        PLAYERS_TITLE: "\xA7a\xA7e\xA7l\xA76\xA7lPLAYER LIST",
        PLAYERS_BODY: "\xA77Online: \xA7e{count}\n\xA78Select player.",
        
        PLAYER_DETAIL_TITLE: "\xA76\xA7lPLAYER: {name}",
        PLAYER_DETAIL_BODY: "\xA77Select protocol.",
        PLAYER_PAY: "\xA7a\xA7lPAY\n\xA78Transfer credits",
        PLAYER_MSG: "\xA7b\xA7lMESSAGE\n\xA78Send private data",
        PLAYER_TP: "\xA7d\xA7lTPA\n\xA78Request teleport",

        SHOP_TITLE: "\xA7a\xA7e\xA7l\xA76\xA7lSHOP",
        SHOP_QUICK_SELL: "\xA7e\xA7lQUICK SELL\n\xA78Liquidate held asset",
        
        AUCTION_TITLE: "\xA7a\xA7e\xA7l\xA76\xA7lAUCTION HOUSE"
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
