import { Kernel } from "../../../../../core/Kernel.js";

export const RealNameCommand = {
    name: "realname",
    description: "Look up a player's real name from their nickname",
    usage: "/ae:realname <nickname>",
    permission: "essentials.realname",
    category: "PLAYER",
    native: true,
    params: [
        { name: "nickname", type: "string", optional: false }
    ],
    execute(data, player, args) {
        try {
            const query = args.join(" ").trim().toLowerCase();
            if (!query) {
                player.sendMessage("§c§l» §7Usage: /ae:realname <nickname>");
                return;
            }

            const players = Kernel.world.getAllPlayers();
            for (const p of players) {
                if (!p || !p.isValid) continue;
                const rawNameTag = (p.nameTag || "").replace(/§[0-9a-fk-or]/g, "").toLowerCase();
                if (rawNameTag.includes(query) && p.name !== p.nameTag) {
                    player.sendMessage(`§a§l» §7The real name of §r${p.nameTag}§7 is: §f${p.name}`);
                    return;
                }
            }

            player.sendMessage(`§c§l» §7Could not find an online player with a nickname matching '${query}'.`);
        } catch (err) {
            player.sendMessage(`§c§l» §7Realname command error: ${err.message}`);
        }
    }
};
