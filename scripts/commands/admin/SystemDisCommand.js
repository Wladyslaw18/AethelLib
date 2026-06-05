import { Kernel } from "../../core/Kernel.js";

// ----------------------------------------------------------------------------
// | object: SystemDisCommand                                                  |
// | dynamically disables a registered core system.                            |
// ----------------------------------------------------------------------------
export const SystemDisCommand = {
    name: "systemdis",
    aliases: ["systemd"],
    description: "Disable a core system",
    usage: "/ae:systemdis <system>",
    permission: "admin.system",
    category: "Admin",
    native: true,
    params: [
        { name: "system", type: "systemName", optional: false }
    ],
    execute(data, player, args) {
        const systemId = args[0];
        if (!systemId) {
            player.sendMessage("§c§l» §7Usage: /ae:systemdis <system>");
            return;
        }

        // Check if the system is registered in Kernel.systems (or dynamic systems)
        if (!Kernel.systems.has(systemId)) {
            player.sendMessage(`§c§l» §7System '§e${systemId}§7' is not a registered core system.`);
            return;
        }

        if (Kernel.disabledSystems.has(systemId)) {
            player.sendMessage(`§e§l» §7System '§f${systemId}§e' is already disabled.`);
            return;
        }

        // Security Gate: Prevent disabling the command engine infrastructure
        if (systemId === "commandRegistry" || systemId === "commandManager") {
            player.sendMessage(`§c§l» §7Security Gate: Disabling '§e${systemId}§7' is forbidden.`);
            return;
        }

        const success = Kernel.disableSystem(systemId);
        if (success) {
            player.sendMessage(`§a§l» §7Successfully disabled core system '§e${systemId}§7'.`);
            console.log(`[Kernel] System '${systemId}' manually disabled via command by player: ${player.name}`);
        } else {
            player.sendMessage(`§c§l» §7Failed to disable system '§e${systemId}§7'.`);
        }
    }
};
