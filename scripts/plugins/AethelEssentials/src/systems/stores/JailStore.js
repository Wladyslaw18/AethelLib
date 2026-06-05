export const JailStore = {
    _context: null,
    
    init(context) {
        this._context = context;
        context.log("[JailStore] Initialized.");
    },

    setJailLocation(location, dimensionId) {
        if (!this._context) return false;
        
        const data = {
            x: location.x,
            y: location.y,
            z: location.z,
            dimension: dimensionId
        };
        
        this._context.db.set("jail_location", data);
        return true;
    },

    getJailLocation() {
        if (!this._context) return null;
        return this._context.db.get("jail_location");
    },

    jailPlayer(playerId, durationMs, reason, moderator) {
        if (!this._context) return false;
        
        const loc = this.getJailLocation();
        if (!loc) throw new Error("Jail location is not set.");
        
        const data = {
            jailedAt: Date.now(),
            duration: durationMs,
            reason: reason || "No reason provided",
            moderator: moderator,
            jailLoc: loc
        };
        
        this._context.db.set(`jailed:${playerId}`, data);
        return true;
    },

    unjailPlayer(playerId) {
        if (!this._context) return false;
        this._context.db.delete(`jailed:${playerId}`);
        return true;
    },

    isJailed(playerId) {
        if (!this._context) return false;
        return !!this._context.db.get(`jailed:${playerId}`);
    },

    getJailedData(playerId) {
        if (!this._context) return null;
        return this._context.db.get(`jailed:${playerId}`);
    },

    enforceAll() {
        if (!this._context) return;

        for (const player of this._context.world.getAllPlayers()) {
            if (!this.isJailed(player.id)) continue;
            
            const jailData = this.getJailedData(player.id);
            if (!jailData) continue;
            
            // auto-expire
            if (jailData.duration > 0 && Date.now() > jailData.jailedAt + jailData.duration) {
                this.unjailPlayer(player.id);
                player.sendMessage("§a§l» §fYou have been released from jail.");
                continue;
            }
            
            // dimension enforcement
            const dimId = player.dimension.id;
            const originDimId = jailData.jailLoc.dimension;
            
            if (dimId !== originDimId) {
                const dim = this._context.world.getDimension(originDimId);
                if (dim) {
                     player.teleport(jailData.jailLoc, { dimension: dim });
                }
                continue;
            }

            // movement enforcement
            const pos = player.location;
            const origin = jailData.jailLoc;
            const dx = pos.x - origin.x;
            const dy = pos.y - origin.y;
            const dz = pos.z - origin.z;
            const distSq = dx * dx + dy * dy + dz * dz;
            
            if (distSq > 9) { // 3 squared is 9
                player.teleport(origin);
            }
        }
    }
};
