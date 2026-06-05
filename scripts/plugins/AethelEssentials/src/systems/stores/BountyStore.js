import { Kernel } from "../../../../../core/Kernel.js";

export const BountyStore = {
    _context: null,
    targets: [],
    names: [],
    amounts: [],
    creators: [],
    timestamps: [],

    init(context) {
        this._context = context;
        this.load();
        context.log("[BountyStore] Initialized.");
    },

    clear() {
        this.targets.length = 0;
        this.names.length = 0;
        this.amounts.length = 0;
        this.creators.length = 0;
        this.timestamps.length = 0;
    },

    load() {
        if (!this._context) return;
        try {
            const data = this._context.db.get("bounty_soa_table") || this._context.db.get("soa_table");
            if (!data) return;

            this.targets = Array.isArray(data.targets) ? data.targets : [];
            this.names = Array.isArray(data.names) ? data.names : [];
            this.amounts = Array.isArray(data.amounts) ? data.amounts : [];
            this.creators = Array.isArray(data.creators) ? data.creators : [];
            this.timestamps = Array.isArray(data.timestamps) ? data.timestamps : [];
        } catch (error) {
            this._context.error(`[BountyStore] load failure: ${error}`);
            this.clear();
        }
    },

    save() {
        if (!this._context) return;
        try {
            const serialized = {
                targets: this.targets,
                names: this.names,
                amounts: this.amounts,
                creators: this.creators,
                timestamps: this.timestamps
            };
            this._context.db.set("bounty_soa_table", serialized);
            this._context.db.set("soa_table", serialized);
        } catch (error) {
            this._context.error(`[BountyStore] save failure: ${error}`);
        }
    },

    async addBounty(targetPlayer, creatorPlayerOrSystem, amount) {
        if (!this._context) return false;
        try {
            const amountNum = Math.floor(Number(amount));
            if (isNaN(amountNum) || amountNum <= 0) return false;

            const isSystem = creatorPlayerOrSystem === "SYSTEM";
            const creatorId = isSystem ? "SYSTEM" : creatorPlayerOrSystem.id;

            // Resolve economy store directly from Kernel
            const Economy = Kernel.get("economy");
            if (!Economy) {
                this._context.error("[BountyStore] Economy service not found in Kernel.");
                return false;
            }

            // 1. Charge creator if not system
            if (!isSystem) {
                const balance = Economy.getBalance(creatorPlayerOrSystem);
                if (balance < amountNum) {
                    creatorPlayerOrSystem.sendMessage("§c§l» §7Insufficient credits to place this bounty.");
                    return false;
                }
                const charged = await Economy.removeMoney(creatorPlayerOrSystem, amountNum);
                if (!charged) {
                    creatorPlayerOrSystem.sendMessage("§c§l» §7Transaction failure. Deduction aborted.");
                    return false;
                }
            }

            // 2. Insert/Update SoA arrays
            const index = this.targets.indexOf(targetPlayer.id);
            if (index !== -1) {
                this.amounts[index] += amountNum;
            } else {
                this.targets.push(targetPlayer.id);
                this.names.push(targetPlayer.name);
                this.amounts.push(amountNum);
                this.creators.push(creatorId);
                this.timestamps.push(Date.now());
            }

            // 3. Save & broadcast
            this.save();
            
            const total = this.getBountyAmount(targetPlayer.id);
            const msg = isSystem 
                ? `§6§l[Bounty] §cSYSTEM §7placed an auto-bounty on §e${targetPlayer.name} §7for §a$${amountNum.toLocaleString()}§7! Total: §a$${total.toLocaleString()}`
                : `§6§l[Bounty] §e${creatorPlayerOrSystem.name} §7placed a bounty on §e${targetPlayer.name} §7for §a$${amountNum.toLocaleString()}§7! Total: §a$${total.toLocaleString()}`;
            
            Kernel.world.getAllPlayers().forEach(p => p.sendMessage(msg));
            return true;
        } catch (error) {
            this._context.error(`[BountyStore] Failed to add bounty: ${error}`);
            return false;
        }
    },

    async claimBounty(victimId, killerPlayer) {
        if (!this._context) return;
        try {
            const index = this.targets.indexOf(victimId);
            if (index === -1) return;

            const amount = this.amounts[index];
            const victimName = this.names[index];

            // Resolve economy store directly from Kernel
            const Economy = Kernel.get("economy");
            if (!Economy) {
                this._context.error("[BountyStore] Economy service not found in Kernel.");
                return;
            }

            // 1. Award payout
            const paid = await Economy.addMoney(killerPlayer, amount);
            if (!paid) {
                this._context.error(`[BountyStore] Payout failed for ${killerPlayer.name}. Retaining bounty in memory.`);
                return;
            }

            // 2. Slice parallel arrays
            this.targets.splice(index, 1);
            this.names.splice(index, 1);
            this.amounts.splice(index, 1);
            this.creators.splice(index, 1);
            this.timestamps.splice(index, 1);

            // 3. Save & Broadcast
            this.save();

            const msg = `§6§l[Bounty] §e${killerPlayer.name} §7has claimed the bounty on §e${victimName} §7and pocketed §a$${amount.toLocaleString()}§7!`;
            Kernel.world.getAllPlayers().forEach(p => p.sendMessage(msg));
        } catch (error) {
            this._context.error(`[BountyStore] Failed to claim bounty: ${error}`);
        }
    },

    getBountyAmount(targetId) {
        const index = this.targets.indexOf(targetId);
        return index !== -1 ? this.amounts[index] : 0;
    }
};
