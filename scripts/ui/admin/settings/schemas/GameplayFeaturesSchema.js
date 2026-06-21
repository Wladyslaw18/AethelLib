import { Lang } from "../../../Lang.js";

export const GameplayFeaturesSchema = {
    title: Lang.GRID_M + "\u00A7b\u00A7lGameplay & Features",
    fields: [
        { type: "toggle", label: "Combat Teleport Block (pvp tag prevention)", prop: "combatSystem" },
        { type: "toggle", label: "Earn Money from Killing Mobs", prop: "earnMoneyfromMobs" },
        { type: "toggle", label: "Notify Mob Bounty in Chat", prop: "notifyEarnMoneyInChat" },
        { type: "textField", label: "Random Teleport (RTP) Radius Range:", placeholder: "1000", prop: "RTPRange", default: "1000", transform: Number },
        { type: "toggle", label: "Use Popup UI for Teleport Requests", prop: "tpaSystemWithUI" },
        { type: "toggle", label: "Show Player Ranks in Chat Messages", prop: "showRankOnMessage" },
        { type: "toggle", label: "Show Player Ranks on Entity Nametags", prop: "showRankOnNameTag" }
    ]
};
