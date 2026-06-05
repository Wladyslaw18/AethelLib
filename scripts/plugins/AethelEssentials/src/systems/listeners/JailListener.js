import { JailStore } from "../stores/JailStore.js";

export const JailListener = {
    _context: null,

    init(context) {
        this._context = context;
        
        // Block breaking prevention
        this._context.world.beforeEvents.playerBreakBlock.subscribe(event => {
            if (JailStore.isJailed(event.player.id)) {
                event.cancel = true;
                this.notifyActionDenied(event.player);
            }
        });

        // Block placing prevention
        this._context.world.beforeEvents.playerPlaceBlock.subscribe(event => {
            if (JailStore.isJailed(event.player.id)) {
                event.cancel = true;
                this.notifyActionDenied(event.player);
            }
        });

        // Block interacting prevention
        this._context.world.beforeEvents.playerInteractWithBlock.subscribe(event => {
            if (JailStore.isJailed(event.player.id)) {
                event.cancel = true;
                this.notifyActionDenied(event.player);
            }
        });

        // Enforcement loop polling
        this._context.system.runInterval(() => {
            JailStore.enforceAll();
        }, 10);
        
        context.log("[JailListener] Subscribed to world events.");
    },

    notifyActionDenied(player) {
        // Send a throttled message to avoid spamming the jailed player
        this._context.system.run(() => {
            player.sendMessage("§c§l» §7You cannot do this while jailed.");
        });
    }
};
