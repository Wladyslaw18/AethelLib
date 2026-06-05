export const NicknameStore = {
    _context: null,
    
    init(context) {
        this._context = context;
        context.log("[NicknameStore] Initialized.");
    },

    setNickname(playerId, nickname) {
        if (!this._context) return false;
        this._context.db.set(`nick:${playerId}`, nickname);
        return true;
    },

    getNickname(playerId) {
        if (!this._context) return null;
        return this._context.db.get(`nick:${playerId}`);
    },

    clearNickname(playerId) {
        if (!this._context) return false;
        this._context.db.delete(`nick:${playerId}`);
        return true;
    }
};
