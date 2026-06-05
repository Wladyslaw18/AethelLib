export const SeenStore = {
    _context: null,
    
    init(context) {
        this._context = context;
        context.log("[SeenStore] Initialized.");
    },

    getPlayerData(playerId) {
        if (!this._context) return null;
        return this._context.db.get(`seen:${playerId}`) || {
            name: "Unknown",
            firstJoin: 0,
            lastSeen: 0,
            totalPlaytime: 0,
            sessionStart: 0
        };
    },

    savePlayerData(playerId, data) {
        if (!this._context) return false;
        this._context.db.set(`seen:${playerId}`, data);
        return true;
    },

    logSessionStart(playerId, name) {
        const data = this.getPlayerData(playerId);
        data.name = name;
        
        if (data.firstJoin === 0) {
            data.firstJoin = Date.now();
        }
        
        data.sessionStart = Date.now();
        this.savePlayerData(playerId, data);
    },

    logSessionEnd(playerId) {
        const data = this.getPlayerData(playerId);
        
        if (data.sessionStart > 0) {
            const sessionDuration = Date.now() - data.sessionStart;
            data.totalPlaytime += sessionDuration;
        }
        
        data.sessionStart = 0;
        data.lastSeen = Date.now();
        this.savePlayerData(playerId, data);
    }
};
