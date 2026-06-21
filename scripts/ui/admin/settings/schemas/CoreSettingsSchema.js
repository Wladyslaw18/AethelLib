import { Lang } from "../../../Lang.js";

export const CoreSettingsSchema = {
    title: Lang.GRID_M + "\u00A7e\u00A7lCore Configuration",
    fields: [
        { type: "textField", label: "Starter Money (credits assigned on first spawn):", placeholder: "1000", prop: "starterMoney", default: "1000" },
        { type: "textField", label: "Max Money Cap (safe liquidity ceiling):", placeholder: "1e+32", prop: "maxMoney", default: "1e+32" },
        { type: "textField", label: "Command Prefix (triggers chat commands):", placeholder: "-", prop: "commandPrefix", default: "-" },
        { type: "textField", label: "Currency Symbol/Prefix (displayed on screens):", placeholder: "$", prop: "currencyPrefix", default: "$" },
        { type: "textField", label: "Server Info Details (used in help descriptions):", placeholder: "Made by Wladyslaw", prop: "serverInfo", default: "" },
        { type: "textField", label: "Welcome/Join Message (sent when players join):", placeholder: "Welcome!", prop: "joinMessage", default: "" }
    ]
};
