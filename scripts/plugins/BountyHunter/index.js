import { boot } from "./src/boot/bootloader.js";

export const manifest = {
    id: "aethel:bounty_hunter",
    name: "Bounty Hunter System",
    version: "1.0.0",
    // strictly telling the DAG sorter we need economy loaded first.
    dependencies: ["aethel:core_economy"] 
};

export const main = {
    async onEnable(context) {
        boot(context);
    }
};
