import { JailStore } from "../../systems/stores/JailStore.js";

export const SetJailCommand = {
    name: "setjail",
    description: "Set the jail location",
    usage: "/ae:setjail",
    permission: "essentials.setjail",
    category: "MODERATION",
    native: true,
    params: [],
    execute(data, player, args) {
        const success = JailStore.setJailLocation(player.location, player.dimension.id);
        
        if (success) {
            player.sendMessage(`§a§l» §7Jail location set to your current position in ${player.dimension.id}.`);
        } else {
            player.sendMessage("§c§l» §7Failed to set jail location.");
        }
    }
};
