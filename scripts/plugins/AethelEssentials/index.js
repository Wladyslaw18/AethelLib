import { SystemsLoader } from "./src/loaders/SystemsLoader.js";
import { CommandsLoader } from "./src/loaders/CommandsLoader.js";

export const manifest = {
    id: "aethel:essentials",
    name: "AethelEssentials",
    version: "1.0.0",
    dependencies: ["aethel:core_economy"]
};

import { ModerationRegistry } from "./src/commands/ModerationRegistry.js";
import { PlayerRegistry } from "./src/commands/PlayerRegistry.js";
import { WorldRegistry } from "./src/commands/WorldRegistry.js";
import { UtilityRegistry } from "./src/commands/UtilityRegistry.js";
import { EconomyRegistry } from "./src/commands/EconomyRegistry.js";

export function getCommands() {
    return [
        ...ModerationRegistry.getCommands(),
        ...PlayerRegistry.getCommands(),
        ...WorldRegistry.getCommands(),
        ...UtilityRegistry.getCommands(),
        ...EconomyRegistry.getCommands()
    ];
}

export const main = {
    onEnable(context) {
        context.log("Booting AethelEssentials...");
        SystemsLoader.init(context);
        context.log("AethelEssentials online.");
    }
};
