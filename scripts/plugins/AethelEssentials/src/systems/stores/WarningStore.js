export const WarningStore = {
    _context: null,

    init(context) {
        this._context = context;
        context.log("[WarningStore] Initialized.");
    },

    addWarning(playerId, reason, moderator) {
        if (!this._context) return null;
        
        const key = `warnings:${playerId}`;
        const warnings = this._context.db.get(key) || [];
        
        const warning = {
            id: `warn_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
            reason: reason || "No reason provided",
            moderator: moderator,
            timestamp: Date.now()
        };
        
        warnings.push(warning);
        this._context.db.set(key, warnings);
        return warning.id;
    },

    getWarnings(playerId) {
        if (!this._context) return [];
        return this._context.db.get(`warnings:${playerId}`) || [];
    },

    getWarningCount(playerId) {
        return this.getWarnings(playerId).length;
    },

    clearWarnings(playerId) {
        if (!this._context) return false;
        this._context.db.set(`warnings:${playerId}`, []);
        return true;
    },

    removeWarning(playerId, warningId) {
        if (!this._context) return false;
        
        const key = `warnings:${playerId}`;
        let warnings = this._context.db.get(key) || [];
        const initialLength = warnings.length;
        
        warnings = warnings.filter(w => w.id !== warningId);
        
        if (warnings.length !== initialLength) {
            this._context.db.set(key, warnings);
            return true;
        }
        return false;
    }
};
