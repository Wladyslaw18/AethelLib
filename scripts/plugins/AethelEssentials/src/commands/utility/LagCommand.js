export const LagCommand = {
    name: "lag",
    description: "Check server TPS (Ticks Per Second)",
    usage: "/ae:lag",
    permission: "essentials.lag",
    category: "UTILITY",
    native: true,
    params: [],
    execute(data, player, args) {
        let tickCount = 0;
        const start = Date.now();
        
        // Measure ticks over 1 second to calculate TPS
        const id = this.context.system.runInterval(() => {
            tickCount++;
        }, 1);

        this.context.system.runTimeout(() => {
            this.context.system.clearRun(id);
            const elapsed = Date.now() - start;
            const tps = (tickCount / (elapsed / 1000)).toFixed(1);
            
            let color = "§a";
            if (tps < 15) color = "§e";
            if (tps < 10) color = "§c";
            
            player.sendMessage(`§6§l=== SERVER PERFORMANCE ===`);
            player.sendMessage(`§eCurrent TPS: ${color}${tps} §8/ §a20.0`);
            player.sendMessage(`§eUptime: §f${Math.floor(this.context.system.currentTick / 20 / 60)} minutes`);
            player.sendMessage(`§eEntities: §f${this.context.world.getDimension("overworld").getEntities().length}`);
            player.sendMessage(`§ePlayers: §f${this.context.world.getAllPlayers().length}`);
            
        }, 20); // wait 20 ticks (1 second ideal)
    }
};
