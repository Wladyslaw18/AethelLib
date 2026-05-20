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
        context.exportAPI({
            taxPlayer: async (player, amount) => {
                try {
                    const economy = context.getService("economy");
                    if (!economy) return false;
                    const val = Number(amount);
                    if (isNaN(val) || val <= 0) return false;
                    return await economy.removeMoney(player, val);
                } catch (error) {
                    context.error(`taxPlayer failure: ${error}`);
                    return false;
                }
            },
            rewardPlayer: async (player, amount) => {
                try {
                    const economy = context.getService("economy");
                    if (!economy) return false;
                    const val = Number(amount);
                    if (isNaN(val) || val <= 0) return false;
                    return await economy.addMoney(player, val);
                } catch (error) {
                    context.error(`rewardPlayer failure: ${error}`);
                    return false;
                }
            },
            getBalance: (player) => {
                try {
                    const economy = context.getService("economy");
                    if (!economy) return 0;
                    return economy.getBalance(player);
                } catch (error) {
                    context.error(`getBalance failure: ${error}`);
                    return 0;
                }
            },
            getInflationRate: () => context.db.get("inflation_rate") || 1.05
        });
    },

    async onDisable(context) {
        context.log("Flushing economy buffers...");
    }
};
