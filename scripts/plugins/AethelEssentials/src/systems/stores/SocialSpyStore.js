export const SocialSpyStore = {
    _context: null,
    _spies: new Set(),

    init(context) {
        this._context = context;
        const saved = context.db.get("social_spy_active") || [];
        saved.forEach(id => this._spies.add(id));
        context.log(`[SocialSpyStore] Loaded ${this._spies.size} active spies.`);
    },

    toggleSpy(playerId) {
        if (!this._context) return false;
        
        const isSpy = this._spies.has(playerId);
        if (isSpy) {
            this._spies.delete(playerId);
        } else {
            this._spies.add(playerId);
        }
        
        this._context.db.set("social_spy_active", Array.from(this._spies));
        return !isSpy;
    },

    isSpying(playerId) {
        return this._spies.has(playerId);
    },

    getSpies() {
        return Array.from(this._spies);
    }
};
