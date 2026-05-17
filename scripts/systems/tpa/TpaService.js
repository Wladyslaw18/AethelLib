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
            sender.sendMessage("\xA7c\xA7l» \xA77That player has TPA disabled.");
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
            sender.sendMessage(`\xA7a\xA7l» \xA7fTPA request sent to \xA7e${target.name}\xA7f.`);
            target.sendMessage(`\xA76\xA7l» \xA7e${sender.name} \xA77wants to teleport to you!`);
            target.sendMessage(`\xA77Type \xA7f/ael:tpaccept \xA77to accept or \xA7f/ael:tpadeny \xA77to deny.`);


            if (TPAStore.getUIToggle(target.id)) {
                Kernel.system.run(async () => {
                    try {
                        const { MessageFormData } = await import("@minecraft/server-ui")
                        const form = new MessageFormData()
                            .title("\xA76\xA7lTeleport Request")
                            .body(`\xA7e${sender.name} \xA77wants to teleport to you.`)

                            .button1("\xA7aAccept")
                            .button2("\xA7cDeny")


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
            player.sendMessage("\xA7c\xA7l» \xA77You have no pending TPA requests.");
            return false
        }


        const sender = [...Kernel.world.getAllPlayers()].find(p => p.id === request.senderId)
        if (!sender) {
            player.sendMessage("\xA7c\xA7l» \xA77The player is now offline.");
            TpaHandshake.removeRequest(request.id)
            return false
        }


        player.sendMessage(`\xA7a\xA7l» \xA7fTeleporting \xA7e${request.senderName} \xA7fin 5 seconds...`);
        sender.sendMessage(`\xA7a\xA7l» \xA7e${player.name} \xA7faccepted! Teleporting in 5 seconds...`);


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
            player.sendMessage("\xA7c\xA7l» \xA77You have no pending requests.");
            return false
        }


        const sender = [...Kernel.world.getAllPlayers()].find(p => p.id === request.senderId)
        if (sender) sender.sendMessage(`\xA7c\xA7l» \xA7e${player.name} \xA77denied your TPA request.`);

        player.sendMessage("\xA7a\xA7l» \xA7fRequest denied.");

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
