// ----------------------------------------------------------------------------
// | object: BountyData                                                       |
// | Structure of Arrays (SoA) flat memory tables.                            |
// | Prevents object-alloc pollution and keeps serialization flat and fast.   |
// ----------------------------------------------------------------------------
export const BountyData = {
    // Parallel arrays
    targets: [],      // String: Unique player ID (UUID)
    names: [],        // String: Display name of target
    amounts: [],      // Number: Bounty reward amount
    creators: [],     // String: ID of placer or "SYSTEM"
    timestamps: [],   // Number: Placement epoch timestamp

    // ----------------------------------------------------------------------------
    // | method: clear                                                            |
    // | flushes all tables.                                                      |
    // ----------------------------------------------------------------------------
    clear() {
        this.targets.length = 0;
        this.names.length = 0;
        this.amounts.length = 0;
        this.creators.length = 0;
        this.timestamps.length = 0;
    },

    // ----------------------------------------------------------------------------
    // | method: load                                                             |
    // | deserializes database structures into parallel arrays.                   |
    // ----------------------------------------------------------------------------
    load(context) {
        try {
            const data = context.db.get("soa_table");
            if (!data) return;

            this.targets = Array.isArray(data.targets) ? data.targets : [];
            this.names = Array.isArray(data.names) ? data.names : [];
            this.amounts = Array.isArray(data.amounts) ? data.amounts : [];
            this.creators = Array.isArray(data.creators) ? data.creators : [];
            this.timestamps = Array.isArray(data.timestamps) ? data.timestamps : [];
        } catch (error) {
            context.error(`BountyData load failure: ${error}`);
            this.clear();
        }
    },

    // ----------------------------------------------------------------------------
    // | method: save                                                             |
    // | flushes parallel arrays into single serialized chunk.                   |
    // ----------------------------------------------------------------------------
    save(context) {
        try {
            const serialized = {
                targets: this.targets,
                names: this.names,
                amounts: this.amounts,
                creators: this.creators,
                timestamps: this.timestamps
            };
            context.db.set("soa_table", serialized);
        } catch (error) {
            context.error(`BountyData save failure: ${error}`);
        }
    }
};
