import { SocialSpyStore } from "../../systems/stores/SocialSpyStore.js";

export const SocialSpyCommand = {
    name: "socialspy",
    description: "Toggle visibility of private messages",
    usage: "/ae:socialspy",
    permission: "essentials.socialspy",
    category: "MODERATION",
    native: true,
    params: [],
    execute(data, player, args) {
        const isActive = SocialSpyStore.toggleSpy(player.id);
        
        if (isActive) {
            player.sendMessage("§a§l» §7Social Spy has been §aENABLED§7. You will now see private messages.");
        } else {
            player.sendMessage("§c§l» §7Social Spy has been §cDISABLED§7.");
        }
    }
};
