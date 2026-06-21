import { Lang } from "../../../Lang.js";

export const SystemModulesSchema = {
    title: Lang.GRID_M + "\u00A7a\u00A7lSystem Modules",
    fields: [
        { type: "toggle", label: "Enable Economy System", prop: "moneySystem" },
        { type: "toggle", label: "Enable Home System", prop: "homeSystem" },
        { type: "toggle", label: "Enable TPA System", prop: "tpaSystem" },
        { type: "toggle", label: "Enable Warp System", prop: "warpSystem" },
        { type: "toggle", label: "Enable Back Navigation Command", prop: "backSystem" },
        { type: "toggle", label: "Enable Random Teleport (RTP)", prop: "rtpSystem" },
        { type: "toggle", label: "Enable Chest Shop System", prop: "shopSystem" },
        { type: "toggle", label: "Enable Quick Sell Mechanic", prop: "sellSystem" },
        { type: "toggle", label: "Enable Auction House System", prop: "auctionSystem" },
        { type: "toggle", label: "Enable Banknote Withdrawal System", prop: "withdrawSystem" },
        { type: "toggle", label: "Enable Private Message/Reply System", prop: "messageSystem" },
        { type: "toggle", label: "Enable Land Claims Subsystem", prop: "landSystem" }
    ]
};
