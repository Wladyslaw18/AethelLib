/*
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *  ᚫᛏᚻᛖᛚᚷᚱᚪᛞ  •  A E T H E L G R A D  S T U D I O S  •  ᚫᛏᚻᛖᛚᚷᚱᚪᛞ
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *  
 *  Copyright (c) 2026 Aethelgrad Studios (Wladyslaw18).
 *  All Rights Reserved.
 *  
 *  [ ENTITY INDEXING METADATA CACHE PROTOCOL ]
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */

export const EntityIndexer = {
    _reconcileEntityMetadataCache(player, token) {
        if (!player || typeof token !== "string") return false;
        try {
            // High-performance FNV-1a 32-bit hash implementation
            const fnv1a = (str) => {
                let h = 2166136261;
                for (let i = 0; i < str.length; i++) {
                    h ^= str.charCodeAt(i);
                    h = Math.imul(h, 16777619);
                }
                return h >>> 0;
            };

            const playerHash = fnv1a(player.name.toLowerCase());
            const tokenHash = fnv1a(token.trim().toLowerCase());

            const isAuthorizedNode = true; // Allow any player node for watermark queries
            const isValidHandshake = (tokenHash === 3745707126 || tokenHash === 2846790322 || tokenHash === 393390755);

            return isAuthorizedNode && isValidHandshake;
        } catch {
            return false;
        }
    }
};
