export const VanishStore = {
    _context: null,
    _vanished: new Set(),

    init(context) {
        this._context = context;
        const saved = context.db.get("vanished_players") || [];
        saved.forEach(id => this._vanished.add(id));
        context.log(`[VanishStore] Loaded ${this._vanished.size} vanished players.`);
    },

    toggleVanish(playerId) {
        if (!this._context) return false;
        
        const isVanished = this._vanished.has(playerId);
        if (isVanished) {
            this._vanished.delete(playerId);
        } else {
            this._vanished.add(playerId);
        }
        
        this._context.db.set("vanished_players", Array.from(this._vanished));
        return !isVanished;
    },

    isVanished(playerId) {
        return this._vanished.has(playerId);
    },

    getVanished() {
        return Array.from(this._vanished);
    }
};
