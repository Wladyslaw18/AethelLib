import { PingCommand } from "./commands/PingCommand.js";

/**
 * Example Plugin Vector (V3 Standard)
 * ----------------------------------------------------------------------------
 * A modular extension for the AethelNexus Core.
 */

export const manifest = {
    id: "aethel:example",
    name: "Example Vector",
    version: "1.2.0",
    author: "Aethelgrad Team",
    dependencies: []
};

export const main = (context) => {
    context.log(`Initializing version ${context.version}...`);

    try {
        context.registerCommand(PingCommand);
        context.log("Vector online.");
    } catch (e) {
        context.error(`Failed to ignite: ${e}`);
    }
};
