import { Kernel } from "../../core/Kernel.js";

/**
 * CelebrateCommand - 1K CurseForge Downloads Special Feature Command
 * Triggers a multi-sensory client fanfare: a swirling particle vortex, pitch-bent level chimes, and a screen announcement.
 */
export const CelebrateCommand = {
    name: "celebrate",
    aliases: ["1k", "party"],
    description: "Celebrate 1,000 CurseForge downloads!",
    usage: "/ae:celebrate",
    permission: "essentials.celebrate",
    category: "GENERAL",
    execute(_data, player, _args) {
        if (!player || !player.isValid) return;

        // 1. Trigger Screen Title Announcement
        player.onScreenDisplay.setTitle("§e§l1,000 DOWNLOADS!", {
            subtitle: "§bThank you for supporting AethelLib!",
            fadeInDuration: 10,
            stayDuration: 60,
            fadeOutDuration: 10
        });

        // Chat notification
        player.sendMessage("§6§l» §e§lAETHELLIB CELEBRATION §r§f- Thank you for §a1,000+ §fCurseForge downloads! ★");

        // 2. Play Pitch-Bent Level Up Fanfare & Thunder
        try {
            player.playSound("ambient.weather.thunder", { pitch: 1.0, volume: 1.0 });
            player.playSound("random.levelup", { pitch: 0.8, volume: 1.0 });
            Kernel.system.runTimeout(() => {
                if (player?.isValid) player.playSound("random.levelup", { pitch: 1.0, volume: 1.0 });
            }, 3);
            Kernel.system.runTimeout(() => {
                if (player?.isValid) player.playSound("random.levelup", { pitch: 1.2, volume: 1.0 });
            }, 6);
            Kernel.system.runTimeout(() => {
                if (player?.isValid) player.playSound("random.levelup", { pitch: 1.5, volume: 1.0 });
            }, 9);
        } catch (soundError) {
            console.error(`[CelebrateCommand] Fanfare sound error: ${soundError}`);
        }

        // 3. Swirling Particle Vortex Loop
        try {
            let ticks = 0;
            const intervalId = Kernel.system.runInterval(() => {
                if (!player || !player.isValid || ticks >= 60) {
                    Kernel.system.clearRun(intervalId);
                    return;
                }

                const dim = player.dimension;
                const center = player.location;
                const radius = 2.0;
                const angleStep = Math.PI / 8; // 16 points along the circle boundary

                // Swirling height offset climbs from 0 to 2 blocks high
                const heightOffset = (ticks % 20) / 10;

                // Color-coded particle cycling
                const particle = (ticks % 3 === 0)
                    ? "minecraft:villager_happy"
                    : (ticks % 3 === 1 ? "minecraft:basic_portal_particle" : "minecraft:basic_flame_particle");

                for (let angle = 0; angle < Math.PI * 2; angle += angleStep) {
                    const x = center.x + radius * Math.cos(angle + (ticks * 0.1));
                    const z = center.z + radius * Math.sin(angle + (ticks * 0.1));
                    dim.spawnParticle(particle, { x, y: center.y + heightOffset, z });
                }

                ticks++;
            }, 1); // Executes on every game tick (50ms interval)
        } catch (particleError) {
            console.error(`[CelebrateCommand] Swirl particle error: ${particleError}`);
        }
    }
};
