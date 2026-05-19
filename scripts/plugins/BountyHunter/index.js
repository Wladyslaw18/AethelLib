export const manifest = {
    id: "aethel:bounty_hunter",
    name: "Bounty Hunter System",
    version: "1.0.0",
    // strictly telling the DAG sorter we need economy loaded first.
    dependencies: ["aethel:core_economy"] 
};

export const main = {
    async onEnable(context) {
        context.log("Spinning up bounty system...");
        
        // grab the exported object from the economy plugin.
        // if core_economy isn't loaded, this throws a fatal error immediately.
        const EconomyAPI = context.requireAPI("aethel:core_economy");
        
        const rate = EconomyAPI.getInflationRate();
        context.log(`Current server inflation is ${rate}. Recalculating hitman fees.`);

        context.registerCommand({
            name: "placebounty",
            description: "Put a hit on someone",
            usage: "/ae:placebounty <player> <amount>",
            execute(_data, player, args) {
                // invoke the cross-plugin function.
                const success = EconomyAPI.taxPlayer(player, args[1]);
                if (success) {
                    player.sendMessage("Bounty contract accepted.");
                }
            }
        });
    }
};
