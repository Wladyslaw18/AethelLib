import { Lang } from "../../../Lang.js";

const parseArray = (str) => String(str).split(",").map(s => s.trim()).filter(s => s.length > 0);

export const AuthorityLimitsSchema = {
    title: Lang.GRID_M + "\u00A7d\u00A7lAuthority \u0026 Limits",
    fields: [
        { type: "textField", label: "Menu Item ID (hardware GUI trigger):", placeholder: "minecraft:compass", prop: "menuItemId", default: "minecraft:compass" },
        { type: "textField", label: "Super Admin Tags (comma-separated):", placeholder: "Admin, op", prop: "superAdminTags", default: "", transform: parseArray },
        { type: "textField", label: "Default Rank (assigned to new players):", placeholder: "member", prop: "defaultRank", default: "member" },
        { type: "textField", label: "Max Homes (default limit if not set by rank):", placeholder: "5", prop: "maxHomes", default: "5", transform: Number },
        { type: "textField", label: "TPA Expiration TTL (seconds):", placeholder: "60", prop: "tpaExpiration", default: "60", transform: Number },
        { type: "textField", label: "Default Claim Radius (chunks):", placeholder: "1", prop: "defaultClaimRadius", default: "1", transform: Number }
    ]
};
