import { Kernel } from "../../core/Kernel.js"
import { Configuration } from "../../Configuration.js"

/*
 * INDUSTRIAL_PEER_MIGRATION_ORCHESTRATOR
 * ----------------------------------------------------------------------------
 * A high-performance orchestration layer for peer-to-peer spatial 
 * handshakes. Manages the transition of migration-requests from 
 * 'PENDING' to 'STABILIZING' to 'EXECUTED'. Enforces rigorous 
 * stability-checks and combat-integrity gating.
 *
 * PHILOSOPHY: Migration is a high-precision operation. Any spatial 
 * or tactical instability during the stabilization-vector will result 
 * in immediate bridge-collapse.
 */
export const TpaService = {
    /* 
     * MIGRATION_REQUEST_INJECTION
     * Validates the target's accessibility-status and injects a 
     * handshake-node into the TpaHandshake registry.
     */
    sendRequest(sender, target, type) {
        const TPAStore = Kernel.get("tpaStore")
        const TpaHandshake = Kernel.get("tpaHandshake")

        if (!TPAStore.isEnabled(target.id)) {
            sender.sendMessage("§cACCESS_DENIED: Target entity has disabled spatial handshakes.");
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
            sender.sendMessage(`§aHANDSHAKE_INITIATED: Target: ${target.name}.`);
            target.sendMessage(`§6[MIGRATION_REQUEST] §e${sender.name} §7is requesting a spatial bridge (${type.toUpperCase()}).`);
            target.sendMessage(`§7Commands: §f!tpaccept §7| §f!tpadeny §7(TTL: ${Configuration.TPA_EXPIRATION}s)`);

            if (TPAStore.getUIToggle(target.id)) {
                Kernel.system.run(async () => {
                    try {
                        const { MessageFormData } = await import("@minecraft/server-ui")
                        const form = new MessageFormData()
                            .title("§6SPATIAL_BRIDGE_TRIGGER")
                            .body(`§e${sender.name} §7is requesting a peer-to-peer teleportation bridge (${type.toUpperCase()}).`)
                            .button2("§a[ESTABLISH_BRIDGE]")
                            .button1("§c[DENY_BRIDGE]")

                        const res = await form.show(target)
                        if (!res.canceled && res.selection === 1) {
                            this.acceptRequest(target)
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
     * HANDSHAKE_RESOLUTION_VECTOR (ACCEPT)
     * Resolves the latest request-node and initiates the industrial 
     * stabilization sequence.
     */
    acceptRequest(player) {
        const TpaHandshake = Kernel.get("tpaHandshake")
        const request = TpaHandshake.getLatestRequestFor(player.id)

        if (!request) {
            player.sendMessage("§cERROR: NO_PENDING_HANDSHAKES_FOUND");
            return false
        }

        const sender = [...Kernel.world.getAllPlayers()].find(p => p.id === request.senderId)
        if (!sender) {
            player.sendMessage("§cERROR: REMOTE_ENTITY_OFFLINE");
            TpaHandshake.removeRequest(request.id)
            return false
        }

        player.sendMessage(`§aBRIDGE_STABILIZING: Handshake with ${request.senderName} established.`);
        sender.sendMessage(`§aBRIDGE_STABILIZING: ${player.name} accepted. Initiating spatial-sync...`);

        if (request.type === "tpa") {
            this.executeTeleport(sender, player.location, "tpa")
        } else {
            this.executeTeleport(player, sender.location, "tpahere")
        }

        TpaHandshake.removeRequest(request.id)
        return true
    },

    /* 
     * HANDSHAKE_RESOLUTION_VECTOR (DENY)
     */
    denyRequest(player) {
        const TpaHandshake = Kernel.get("tpaHandshake")
        const request = TpaHandshake.getLatestRequestFor(player.id)

        if (!request) {
            player.sendMessage("§cERROR: NO_PENDING_HANDSHAKES_FOUND");
            return false
        }

        const sender = [...Kernel.world.getAllPlayers()].find(p => p.id === request.senderId)
        if (sender) sender.sendMessage(`§cNOTICE: ${player.name} terminated the handshake.`);

        player.sendMessage("§aHANDSHAKE_TERMINATED.");
        TpaHandshake.removeRequest(request.id)
        return true
    },

    /* 
     * STABILIZATION_EXECUTION_LOOP
     * Performs a 100-tick (5s) stabilization check. Monitors spatial-drift 
     * and combat-signatures. Any non-compliance results in immediate 
     * bridge-collapse.
     */
    async executeTeleport(player, destination, _type) {
        const startPos = { x: player.location.x, y: player.location.y, z: player.location.z }
        let countdown = 5

        for (let i = countdown; i > 0; i--) {
            player.onScreenDisplay.setActionBar(`§6[STABILIZING_BRIDGE] T-MINUS: §e${i}s`);
            await new Promise(resolve => Kernel.system.runTimeout(() => resolve(), 20))

            if (!player.isValid) return false
            
            if (this._hasMoved(player, startPos)) {
                player.sendMessage("§cBRIDGE_COLLAPSE: SPATIAL_INSTABILITY_DETECTED (MOVEMENT)");
                return false
            }

            if (this._isInCombat(player)) {
                player.sendMessage("§cBRIDGE_COLLAPSE: ACTIVE_COMBAT_SIGNATURE_DETECTED");
                return false
            }
        }

        Kernel.system.run(() => {
            try {
                if (!player.isValid) return
                player.teleport(destination, {
                    dimension: player.dimension,
                    keepVelocity: false
                })
                player.sendMessage("§aMIGRATION_COMPLETE.");
            } catch (error) {
                player.sendMessage("§cMIGRATION_FAILURE: SPATIAL_STABILIZATION_COLLAPSE");
            }
        })
        return true
    },

    /* 
     * SPATIAL_DRIFT_PROBE
     */
    _hasMoved(player, startPos) {
        const dx = Math.abs(player.location.x - startPos.x)
        const dy = Math.abs(player.location.y - startPos.y)
        const dz = Math.abs(player.location.z - startPos.z)
        return dx > 0.5 || dy > 0.5 || dz > 0.5
    },

    /* 
     * COMBAT_SIGNATURE_PROBE
     */
    _isInCombat(player) {
        const CombatIntegrity = Kernel.get("combatIntegrity")
        return CombatIntegrity?.isInCombat(player.id) || false
    },

    /* 
     * SERVICE_LIFECYCLE_BOOTSTRAP
     */
    init() {
        Kernel.system.runInterval(() => {
            const TpaHandshake = Kernel.get("tpaHandshake")
            if (TpaHandshake) TpaHandshake.cleanup()
        }, 600)
        
        console.log("[TpaService] SPATIAL_MIGRATION_BUS_OPERATIONAL");
    }
}
