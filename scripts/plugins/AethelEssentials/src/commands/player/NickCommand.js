import { NicknameStore } from "../../systems/stores/NicknameStore.js";

export const NickCommand = {
    name: "nick",
    description: "Set your nickname",
    usage: "/ae:nick <nickname|off>",
    permission: "essentials.nick",
    category: "PLAYER",
    native: false,
    params: [
        { name: "nickname", type: "string", optional: false }
    ],
    execute(data, player, args) {
        const input = args.join(" ");

        if (input.toLowerCase() === "off") {
            NicknameStore.clearNickname(player.id);
            player.nameTag = player.name;
            player.sendMessage("§a§l» §7Your nickname has been cleared.");
            return;
        }

        // Validate length
        if (input.length > 20) {
            player.sendMessage("§c§l» §7Nickname cannot exceed 20 characters.");
            return;
        }

        // Apply color code translation if permitted
        let formattedNick = input;
        
        // This checks if they have permission to use color codes.
        // For now, we'll assume they do if they have the nick command, 
        // but you could add a separate "essentials.nick.color" check here.
        formattedNick = formattedNick.replace(/&/g, "§");

        NicknameStore.setNickname(player.id, formattedNick);
        player.nameTag = formattedNick;
        
        player.sendMessage(`§a§l» §7Your nickname has been set to: §r${formattedNick}`);
    }
};
