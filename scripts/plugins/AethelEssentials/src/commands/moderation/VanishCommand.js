import { VanishStore } from "../../systems/stores/VanishStore.js";

export const VanishCommand = {
    name: "vanish",
    description: "Toggle invisibility",
    usage: "/ae:vanish",
    permission: "essentials.vanish",
    category: "MODERATION",
    native: true,
    params: [],
    execute(data, player, args) {
        const isVanished = VanishStore.toggleVanish(player.id);
        
        if (isVanished) {
            try { player.runCommand("effect @s invisibility 99999 1 true"); } catch (e) {}
            player.sendMessage("§a§l» §7You are now §aVANISHED§7.");
        } else {
            try { player.runCommand("effect @s clear"); } catch (e) {}
            player.sendMessage("§c§l» §7You are no longer vanished.");
        }
    }
};
