export const FreezeTracker = {
    _frozen: new Set(),
    
    init() {
        // Pure in-memory state. No context/db needed.
        // It resets on server restart, which is safe for frozen players
        // to avoid getting permanently stuck.
    },

    freezePlayer(playerId) {
        this._frozen.add(playerId);
    },

    unfreezePlayer(playerId) {
        this._frozen.delete(playerId);
    },

    isFrozen(playerId) {
        return this._frozen.has(playerId);
    }
};
