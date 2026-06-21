import { Lang } from "../../../Lang.js";

const parseNum = (v) => {
    if (String(v).trim() === "") return undefined;
    const parsed = parseFloat(v);
    return isNaN(parsed) ? 0 : parsed;
};

export const RankCostsSchema = {
    title: Lang.GRID_M + "\u00A76\u00A7lCOMMAND COSTS",
    fields: [
        { type: "textField", label: "Back Cost:", placeholder: "Leave blank to use default", prop: "cost.back", default: "", transform: parseNum },
        { type: "textField", label: "TPA Cost:", placeholder: "Leave blank to use default", prop: "cost.tpa", default: "", transform: parseNum },
        { type: "textField", label: "Home Cost:", placeholder: "Leave blank to use default", prop: "cost.home", default: "", transform: parseNum },
        { type: "textField", label: "Warp Cost:", placeholder: "Leave blank to use default", prop: "cost.warp", default: "", transform: parseNum },
        { type: "textField", label: "RTP Cost:", placeholder: "Leave blank to use default", prop: "cost.rtp", default: "", transform: parseNum }
    ]
};
