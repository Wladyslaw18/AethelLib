import { SeenStore } from "../stores/SeenStore.js";

export const SeenListener = {
    _context: null,

    init(context) {
        this._context = context;
        
        this._context.world.afterEvents.playerSpawn.subscribe(event => {
            const player = event.player;
            // Only log session start on initial join (when they have no sessionStart)
            // or we could just log it and update the name
            SeenStore.logSessionStart(player.id, player.name);
        });

        this._context.world.afterEvents.playerLeave.subscribe(event => {
            const playerId = event.playerId;
            SeenStore.logSessionEnd(playerId);
        });

        context.log("[SeenListener] Subscribed to world events.");
    }
};
