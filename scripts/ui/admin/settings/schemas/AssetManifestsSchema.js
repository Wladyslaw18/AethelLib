import { Lang } from "../../../Lang.js";

const parseArray = (str) => String(str).split(",").map(s => s.trim()).filter(s => s.length > 0);

export const AssetManifestsSchema = {
    title: Lang.GRID_M + "\u00A7d\u00A7lAsset Manifests",
    fields: [
        { type: "textField", label: "Banned Items (comma-separated):", placeholder: "minecraft:tnt, etc.", prop: "bannedItems", default: "", transform: parseArray },
        { type: "textField", label: "Hostile Mobs (comma-separated):", placeholder: "minecraft:zombie, etc.", prop: "hostileMobs", default: "", transform: parseArray }
    ]
};
