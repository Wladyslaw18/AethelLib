import { Kernel } from "../../core/Kernel.js";
import { BanknoteStore } from "../../systems/banknote/BanknoteStore.js"
import { EconomyStore } from "../../systems/economy/EconomyStore.js"
import { ValidationHelper } from "../../utils/ValidationHelper.js"

// ----------------------------------------------------------------------------
// | object: WithdrawCommand                                                  |
// | converts digital liquidity into physical banknotes.                     |
// | highly complex, inventory space counts, atomic debits. sleep is for the weak.|
// ----------------------------------------------------------------------------
export const WithdrawCommand = {
    name: "withdraw",
    description: "Convert money to physical banknotes",
    usage: "/ae:withdraw <amount>",
    permission: "essentials.withdraw",
    category: "economy",
    
    // NATIVE SCHEMA DEFINITION: C++ validated!
    params: [
        { name: "amount", type: Kernel.CustomCommandParamType.Integer, optional: false }
    ],

    execute(_data, player, args) {
        const [amount] = args;

        if (amount === undefined) {
            player.sendMessage("\xA7c\xA7l» \xA77Usage: /ae:withdraw <amount>")
            return
        }
        
        // step 1: industrial bound validation. no float overflow exploits today.
        if (!ValidationHelper.isValidMoney(amount)) {
            player.sendMessage("\xA7c\xA7l» \xA77Invalid liquidity amount. Exceeds safe bounds.");
            return
        }

        // minimum operational boundary: withdrawals under 100 are too cheap to print.
        if (amount < 100) {
            player.sendMessage("\xA7c\xA7l» \xA77Minimum withdrawal amount is \xA7e$100");
            return
        }

        // maximum operational boundary: printing over a mil at once breaks the economy.
        if (amount > 1000000) {
            player.sendMessage("\xA7c\xA7l» \xA77Maximum withdrawal amount is \xA7e$1,000,000");
            return
        }

        // step 2: balance check. query persistent store to make sure they aren't broke.
        const balance = EconomyStore.getBalance(player.id)
        if (balance < amount) {
            player.sendMessage(`\xA7c\xA7l» \xA77Insufficient funds. You have ${BanknoteStore.formatMoney(balance)}`);
            return
        }

        // step 3: inventory capacity check. counting slot sizes so we don't drop items on the floor.
        const requiredSlots = Math.ceil(amount / 64000) 
        const availableSlots = getAvailableInventorySlots(player)
        
        if (availableSlots < requiredSlots) {
            player.sendMessage(`\xA7c\xA7l» \xA77Not enough inventory space. Need ${requiredSlots} slots, have ${availableSlots}`);
            return
        }

        // step 4: transaction execution. system.run keeps this atomic inside the tick.
        Kernel.system.run(() => {
            try {
                // remove digital balance first.
                if (!EconomyStore.removeMoney(player.id, amount)) {
                    player.sendMessage("\xA7c\xA7l» \xA77Failed to withdraw money.");
                    return
                }

                // create banknotes greedily.
                const created = createBanknotes(player, amount)
                
                if (created > 0) {
                    player.sendMessage(`\xA7a\xA7l» \xA7fSuccessfully withdrew ${BanknoteStore.formatMoney(amount)} into ${created} banknote(s)`);
                    player.sendMessage("\xA77Right-click banknotes to redeem them");
                } else {
                    // if physical banknote injection fails, refund the digital currency. transactional safety!
                    EconomyStore.addMoney(player.id, amount)
                    player.sendMessage("\xA7c\xA7l» \xA77Failed to create banknotes. Money refunded.");
                }
            } catch (error) {
                // absolute fallback refund to prevent money disappearing. we don't want support tickets.
                console.error(`Withdraw error: ${error}`)
                player.sendMessage("\xA7c\xA7l» \xA77An error occurred during withdrawal.");
                EconomyStore.addMoney(player.id, amount)
            }
        })
    }
}

function createBanknotes(player, totalAmount) {
    // Standard industrial denominations
    const denominations = [1000000, 500000, 100000, 50000, 10000, 5000, 1000, 500, 100]
    let remaining = totalAmount
    let created = 0

    // greedy denomination splitting algorithm. my CS professor would be proud.
    for (const denom of denominations) {
        while (remaining >= denom) {
            const banknote = BanknoteStore.createBanknote(denom, player.id, player.name)
            
            if (!BanknoteStore.storeBanknoteData(banknote)) {
                console.error(`Failed to store banknote data for ${banknote.id}`)
                continue
            }

            const item = new Kernel.ItemStack(BanknoteStore.getBanknoteId(), 1)
            item.nameTag = BanknoteStore.getBanknoteName(denom)
            item.setLore(BanknoteStore.getBanknoteLore(banknote))
            try { item.setDynamicProperty("ae:banknote_id", banknote.id) } catch (e) {}
            
            // inventory injection. using official Kernel.EntityComponentTypes logic now.
            const container = player.getComponent(Kernel.EntityComponentTypes.Inventory).container
            const leftover = container.addItem(item)
            
            if (leftover === undefined) {
                remaining -= denom
                created++
            } else {
                // inventory overflowed. break loop immediately.
                break
            }
        }
        
        if (remaining < 100) break 
    }

    // refund what couldn't be printed due to space constraints.
    if (remaining > 0) {
        EconomyStore.addMoney(player.id, remaining)
        player.sendMessage(`\xA77Could not convert ${BanknoteStore.formatMoney(remaining)} - refunded to account`);
    }

    return created
}

function getAvailableInventorySlots(player) {
    try {
        const container = player.getComponent(Kernel.EntityComponentTypes.Inventory).container
        let available = 0
        
        for (let i = 0; i < container.size; i++) {
            const item = container.getItem(i)
            if (!item) {
                available++
            } else if (item.typeId === BanknoteStore.getBanknoteId() && item.amount < 64) {
                available++
            }
        }
        
        return available
    } catch (error) {
        console.error(`Failed to check inventory space: ${error}`)
        return 0
    }
}
