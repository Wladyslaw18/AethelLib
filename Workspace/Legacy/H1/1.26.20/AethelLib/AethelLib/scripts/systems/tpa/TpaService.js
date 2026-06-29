import { Kernel } from "../../core/Kernel.js"


/*
 * TPA Service
 * ----------------------------------------------------------------------------
 * Handles peer-to-peer teleport requests and handshakes.
 */

export const TpaService = {
    /* 
     * Send TPA Request
     */

    async sendRequest(sender, target, type) {
        const TPAStore = Kernel.get("tpaStore")
        const TpaHandshake = Kernel.get("tpaHandshake")

        if (!TPAStore.isEnabled(target.id)) {
            sender.sendMessage("§c§l» §7That player has TPA disabled.");
            return false
        }


        const requestId = TpaHandshake.createRequest(
            sender.id,
            sender.name,
            target.id,
            target.name,
            type
        )

        if (requestId) {
            sender.sendMessage(`§a§l» §fTPA request sent to §e${target.name}§f.`);
            target.sendMessage(`§6§l» §e${sender.name} §7wants to teleport to you!`);
            target.sendMessage(`§7Type §f/ael:tpaccept §7to accept or §f/ael:tpadeny §7to deny.`);


            if (TPAStore.getUIToggle(target.id)) {
                Kernel.system.run(async () => {
                    try {
                        const { MessageFormData } = await import("@minecraft/server-ui")
                        const form = new MessageFormData()
                            .title("§6§lTeleport Request")
                            .body(`§e${sender.name} §7wants to teleport to you.`)

                            .button1("§aAccept")
                            .button2("§cDeny")


                        const res = await form.show(target)
                        if (!res.canceled && res.selection === 0) {
                            this.acceptRequest(target)
                        } else if (!res.canceled && res.selection === 1) {
                            this.denyRequest(target)
                        }
                    } catch (error) {
                        console.error(`[TpaService] UI_THREAD_COLLAPSE: ${error}`)
                    }
                })
            }
        }
        return !!requestId
    },

    /* 
     * Accept TPA Request
     */

    acceptRequest(player) {
        const TpaHandshake = Kernel.get("tpaHandshake")
        const request = TpaHandshake.getLatestRequestFor(player.id)

        if (!request) {
            player.sendMessage("§c§l» §7You have no pending TPA requests.");
            return false
        }


        const sender = [...Kernel.world.getAllPlayers()].find(p => p.id === request.senderId)
        if (!sender) {
            player.sendMessage("§c§l» §7The player is now offline.");
            TpaHandshake.removeRequest(request.id)
            return false
        }


        player.sendMessage(`§a§l» §fTeleporting §e${request.senderName} §fin 5 seconds...`);
        sender.sendMessage(`§a§l» §e${player.name} §faccepted! Teleporting in 5 seconds...`);


        const teleportService = Kernel.get("teleportService")
        const waitTime = 5 // Standard stabilization window

        if (request.type === "tpa") {
            teleportService.teleportWithWait(sender, player.location, player.dimension?.id || "minecraft:overworld", waitTime)
        } else {
            teleportService.teleportWithWait(player, sender.location, sender.dimension?.id || "minecraft:overworld", waitTime)
        }

        TpaHandshake.removeRequest(request.id)
        return true
    },

    /* 
     * Deny TPA Request
     */

    denyRequest(player) {
        const TpaHandshake = Kernel.get("tpaHandshake")
        const request = TpaHandshake.getLatestRequestFor(player.id)

        if (!request) {
            player.sendMessage("§c§l» §7You have no pending requests.");
            return false
        }


        const sender = [...Kernel.world.getAllPlayers()].find(p => p.id === request.senderId)
        if (sender) sender.sendMessage(`§c§l» §e${player.name} §7denied your TPA request.`);

        player.sendMessage("§a§l» §fRequest denied.");

        TpaHandshake.removeRequest(request.id)
        return true
    },

    /* 
     * Initialize TPA Service
     */

    init() {
        Kernel.system.runInterval(() => {
            const TpaHandshake = Kernel.get("tpaHandshake")
            if (TpaHandshake) TpaHandshake.cleanup()
        }, 600)
        
        console.log("[TpaService] TPA Service online.");

    }
}
