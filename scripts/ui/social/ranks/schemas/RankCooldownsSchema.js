import { Lang } from "../../../Lang.js";

const parseNum = (v) => {
    if (String(v).trim() === "") return undefined;
    const parsed = parseFloat(v);
    return isNaN(parsed) ? 0 : parsed;
};

export const RankCooldownsSchema = {
    title: Lang.GRID_M + "\u00A76\u00A7lCOOLDOWNS & LIMITS",
    fields: [
        { type: "textField", label: "Chat Cooldown (seconds):", placeholder: "e.g. 0.5", prop: "cooldown.chat", default: "", transform: parseNum },
        { type: "textField", label: "Command Cooldown (seconds):", placeholder: "e.g. 1.0", prop: "cooldown.command", default: "", transform: parseNum },
        { type: "textField", label: "Back Cooldown (seconds):", placeholder: "e.g. 60", prop: "cooldown.back", default: "", transform: parseNum },
        { type: "textField", label: "TPA Cooldown (seconds):", placeholder: "e.g. 60", prop: "cooldown.tpa", default: "", transform: parseNum },
        { type: "textField", label: "Home Cooldown (seconds):", placeholder: "e.g. 60", prop: "cooldown.home", default: "", transform: parseNum },
        { type: "textField", label: "Warp Cooldown (seconds):", placeholder: "e.g. 60", prop: "cooldown.warp", default: "", transform: parseNum },
        { type: "textField", label: "RTP Cooldown (seconds):", placeholder: "e.g. 60", prop: "cooldown.rtp", default: "", transform: parseNum },
        { type: "textField", label: "Home Limit:", placeholder: "e.g. 3", prop: "limit.home", default: "", transform: parseNum },
        { type: "textField", label: "Land Claim Limit:", placeholder: "e.g. 1", prop: "limit.land", default: "", transform: parseNum }
    ]
};
