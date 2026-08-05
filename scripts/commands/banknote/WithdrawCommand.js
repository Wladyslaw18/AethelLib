import { Kernel } from "../../core/Kernel.js";
import { BanknoteStore } from "../../systems/banknote/BanknoteStore.js";
import { EconomyStore } from "../../systems/economy/EconomyStore.js";
import { ValidationHelper } from "../../utils/ValidationHelper.js";

// ----------------------------------------------------------------------------
// | object: WithdrawCommand                                                  |
// | converts digital liquidity into physical banknotes.                      |
// | atomic debits, strict space checks, async money transactions.           |
// ----------------------------------------------------------------------------
export const WithdrawCommand = {
    name: "withdraw",
    description: "Convert money to physical banknotes",
    usage: "/ae:withdraw <amount>",
    permission: "essentials.withdraw",
    category: "economy",
    
    params: [
        { name: "amount", type: Kernel.CustomCommandParamType.Integer, optional: false }
    ],

    async execute(_data, player, args) {
        const [amount] = args;
        const rawPlayer = player.__rawEntity__ || player;

        if (amount === undefined || typeof amount !== "number" || isNaN(amount) || !Number.isInteger(amount)) {
            player.sendMessage("\u00A7c\u00A7l» \u00A77Usage: /ae:withdraw <amount> (must be a valid positive integer)");
            return;
        }
        
        if (!ValidationHelper.isValidMoney(amount)) {
            player.sendMessage("\u00A7c\u00A7l» \u00A77Invalid liquidity amount. Exceeds safe bounds.");
            return;
        }

        if (amount < 100) {
            player.sendMessage("\u00A7c\u00A7l» \u00A77Minimum withdrawal amount is \u00A7e$100");
            return;
        }

        if (amount > 1000000) {
            player.sendMessage("\u00A7c\u00A7l» \u00A77Maximum withdrawal amount is \u00A7e$1,000,000");
            return;
        }

        const balance = EconomyStore.getBalance(rawPlayer);
        if (balance < amount) {
            player.sendMessage(`\u00A7c\u00A7l» \u00A77Insufficient funds. You have ${BanknoteStore.formatMoney(balance)}`);
            return;
        }

        const requiredSlots = Math.ceil(amount / 64000);
        const availableSlots = getAvailableInventorySlots(rawPlayer);
        
        if (availableSlots < requiredSlots) {
            player.sendMessage(`\u00A7c\u00A7l» \u00A77Not enough empty inventory space. Need ${requiredSlots} empty slot(s), have ${availableSlots}`);
            return;
        }

        // Deduct digital money first with await
        const debited = await EconomyStore.removeMoney(rawPlayer, amount);
        if (!debited) {
            player.sendMessage("\u00A7c\u00A7l» \u00A77Failed to withdraw money. Account sync error.");
            return;
        }

        try {
            const created = await createBanknotes(rawPlayer, amount);
            
            if (created > 0) {
                player.sendMessage(`\u00A7a\u00A7l» \u00A7fSuccessfully withdrew ${BanknoteStore.formatMoney(amount)} into ${created} banknote(s)`);
                player.sendMessage("\u00A77Right-click banknotes to redeem them");
            } else {
                await EconomyStore.addMoney(rawPlayer, amount);
                player.sendMessage("\u00A7c\u00A7l» \u00A77Failed to create banknotes. Money refunded.");
            }
        } catch (error) {
            console.error(`[WithdrawCommand] Execution error: ${error}`);
            await EconomyStore.addMoney(rawPlayer, amount);
            player.sendMessage("\u00A7c\u00A7l» \u00A77An error occurred during withdrawal. Full refund issued.");
        }
    }
};

async function createBanknotes(player, totalAmount) {
    const rawPlayer = player.__rawEntity__ || player;
    const denominations = [1000000, 500000, 100000, 50000, 10000, 5000, 1000, 500, 100];
    let remaining = totalAmount;
    let created = 0;

    const invComp = rawPlayer.getComponent(Kernel.EntityComponentTypes.Inventory);
    const container = invComp?.container;
    if (!container) return 0;

    for (const denom of denominations) {
        while (remaining >= denom) {
            const banknote = BanknoteStore.createBanknote(denom, rawPlayer.id, rawPlayer.name);
            
            if (!BanknoteStore.storeBanknoteData(banknote)) {
                console.error(`[WithdrawCommand] Failed to store banknote data for ${banknote.id}`);
                continue;
            }

            const item = new Kernel.ItemStack(BanknoteStore.getBanknoteId(), 1);
            item.nameTag = BanknoteStore.getBanknoteName(denom);
            item.setLore(BanknoteStore.getBanknoteLore(banknote));
            try { item.setDynamicProperty("ae:banknote_id", banknote.id); } catch (e) {}
            
            const leftover = container.addItem(item);
            
            if (leftover === undefined) {
                remaining -= denom;
                created++;
            } else {
                break;
            }
        }
        
        if (remaining < 100) break;
    }

    if (remaining > 0) {
        await EconomyStore.addMoney(rawPlayer, remaining);
        rawPlayer.sendMessage(`\u00A77Could not convert ${BanknoteStore.formatMoney(remaining)} - refunded to account`);
    }

    return created;
}

function getAvailableInventorySlots(player) {
    try {
        const rawPlayer = player.__rawEntity__ || player;
        const container = rawPlayer.getComponent(Kernel.EntityComponentTypes.Inventory)?.container;
        if (!container) return 0;

        let available = 0;
        for (let i = 0; i < container.size; i++) {
            const item = container.getItem(i);
            if (!item) {
                available++;
            }
        }
        
        return available;
    } catch (error) {
        console.error(`[WithdrawCommand] Failed to check inventory space: ${error}`);
        return 0;
    }
}
