import { Kernel } from "../../core/Kernel.js";

// ----------------------------------------------------------------------------
// | object: SystemOnCommand                                                   |
// | dynamically enables a registered core system.                             |
// ----------------------------------------------------------------------------
export const SystemOnCommand = {
    name: "systemon",
    description: "Enable a core system",
    usage: "/ae:systemon <system>",
    permission: "admin.system",
    category: "Admin",
    native: true,
    params: [
        { name: "system", type: "systemName", optional: false }
    ],
    execute(data, player, args) {
        const systemId = args[0];
        if (!systemId) {
            player.sendMessage("§c§l» §7Usage: /ae:systemon <system>");
            return;
        }

        // Check if the system is registered in Kernel.systems (or dynamic systems)
        if (!Kernel.systems.has(systemId)) {
            player.sendMessage(`§c§l» §7System '§e${systemId}§7' is not a registered core system.`);
            return;
        }

        if (!Kernel.disabledSystems.has(systemId)) {
            player.sendMessage(`§e§l» §7System '§f${systemId}§e' is already active/enabled.`);
            return;
        }

        const success = Kernel.enableSystem(systemId);
        if (success) {
            player.sendMessage(`§a§l» §7Successfully enabled core system '§e${systemId}§7'.`);
            console.log(`[Kernel] System '${systemId}' manually enabled via command by player: ${player.name}`);
        } else {
            player.sendMessage(`§c§l» §7Failed to enable system '§e${systemId}§7'.`);
        }
    }
};
