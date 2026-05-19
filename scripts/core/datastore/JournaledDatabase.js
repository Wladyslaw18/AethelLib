import { Kernel } from "../Kernel.js";
import { Database } from "./DatabaseManager.js";

/**
 * Buffer-aside persistence layer.
 * Buffers updates in memory Map to minimize disk writes, flushing in batches.
 */
class JournaledDatabase {
    constructor() {
        this.journal = new Map();
        this.isDirty = false;
        this._startFlushCycle();
    }

    get(key) {
        if (this.journal.has(key)) {
            return this.journal.get(key);
        }
        return Database.get(key);
    }

    set(key, value) {
        this.journal.set(key, value);
        this.isDirty = true;
        return true;
    }

    delete(key) {
        this.journal.set(key, undefined);
        this.isDirty = true;
        return true;
    }

    flush() {
        if (!this.isDirty) return;

        for (const [key, value] of this.journal.entries()) {
            if (value === undefined) {
                Database.delete(key);
            } else {
                Database.set(key, value);
            }
        }

        this.journal.clear();
        this.isDirty = false;
        console.log("[Datastore] JOURNAL_FLUSH_COMPLETE");
    }

    _startFlushCycle() {
        Kernel.system.runInterval(() => {
            this.flush();
        }, 200); // Flush every 10 seconds (200 ticks)
    }

    async transaction(playerId, operation) {
        // Flush pending changes before transaction to ensure sync
        this.flush();
        const result = await Database.transaction(playerId, operation);
        // Flush transaction modifications immediately
        this.flush();
        return result;
    }

    getSharded(collection, id) { return Database.getSharded(collection, id); }
    setSharded(collection, id, value) { return Database.setSharded(collection, id, value); }
    deleteSharded(collection, id) { return Database.deleteSharded(collection, id); }
}

export const JournaledDb = new JournaledDatabase();
