import { Kernel } from "../../../../../core/Kernel.js";

export const LagCommand = {
    name: "tps",
    aliases: ["lag", "gc"],
    description: "Check server performance and TPS",
    usage: "/ae:tps",
    permission: "essentials.tps",
    category: "UTILITY",
    native: true,
    execute(data, player, args) {
        try {
            let tickCount = 0;
            const start = Date.now();
            
            const id = Kernel.system.runInterval(() => {
                tickCount++;
            }, 1);

            Kernel.system.runTimeout(() => {
                Kernel.system.clearRun(id);
                
                if (!player || !player.isValid) return;

                const elapsed = Date.now() - start;
                const tps = (tickCount / (elapsed / 1000)).toFixed(1);
                
                let color = "§a";
                if (tps < 15) color = "§e";
                if (tps < 10) color = "§c";

                player.sendMessage(`§6§l=== SERVER PERFORMANCE ===`);
                player.sendMessage(`§eCurrent TPS: ${color}${tps} §8/ §a20.0`);
                player.sendMessage(`§eUptime: §f${Math.floor(Kernel.system.currentTick / 20 / 60)} minutes`);
                try {
                    player.sendMessage(`§eEntities: §f${Kernel.world.getDimension("overworld").getEntities().length}`);
                } catch {
                    player.sendMessage(`§eEntities: §fUnknown`);
                }
                player.sendMessage(`§ePlayers: §f${Kernel.world.getAllPlayers().length}`);
            }, 20);
        } catch (err) {
            player.sendMessage(`§c§l» §7TPS check error: ${err.message}`);
        }
    }
};
