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

export function getCommands() {
    return [PingCommand];
}

export const main = {
    onEnable(context) {
        context.log(`Initializing version ${context.version}...`);
        context.log("Vector online.");
    },
    onDisable() {
        // no-op
    }
};
