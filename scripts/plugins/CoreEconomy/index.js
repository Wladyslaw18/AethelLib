export const manifest = {
    id: "aethel:core_economy",
    name: "Advanced Economy Expansion",
    version: "2.0.0",
    dependencies: []
};

export const main = {
    async onEnable(context) {
        context.log("Injecting economy structures...");
        
        // this saves to 'plugin:aethel:core_economy:inflation_rate' internally.
        context.db.set("inflation_rate", 1.05); 

        // push functions to the service mesh.
        // other plugins will consume this instead of rewriting economy logic.
        context.exportAPI({
            taxPlayer: (player, amount) => {
                context.log(`Processing tax deduction for ${player.name}: $${amount}`);
                // insert actual economy removal here
                return true;
            },
            getInflationRate: () => context.db.get("inflation_rate")
        });
    },

    async onDisable(context) {
        context.log("Flushing economy buffers...");
    }
};
