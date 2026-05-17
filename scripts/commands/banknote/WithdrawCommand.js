import { system, ItemStack } from "@minecraft/server"
import { BanknoteStore } from "../../systems/banknote/BanknoteStore.js"
import { EconomyStore } from "../../systems/economy/EconomyStore.js"
import { ValidationHelper } from "../../utils/ValidationHelper.js"

// ----------------------------------------------------------------------------
// | object: WithdrawCommand                                                  |
// | command definition for converting digital liquidity into physical assets.  |
// | handles denomination splitting, inventory validation, and atomic refunds. |
// ----------------------------------------------------------------------------
export const WithdrawCommand = {
    // internal name.
    name: "withdraw",
    // human-readable description.
    description: "Convert money to physical banknotes",
    // syntax guide.
    usage: "/ae:withdraw <amount>",
    // required permission node.
    permission: "essentials.withdraw",
    // command category.
    category: "economy",
    // native parameter definitions.
    parameters: [
        { name: "amount", type: "int", optional: false }
    ],

    // ----------------------------------------------------------------------------
    // | method: execute                                                          |
    // | the withdrawal pipeline. validates balance and space before initiating    |
    // | the physical asset generation sequence.                                  |
    // ----------------------------------------------------------------------------
    execute(_data, player, args) {
        // syntax validation.
        if (args.length === 0) {
            player.sendMessage("\xA7c\xA7l» \xA77Usage: /ae:withdraw <amount>")
            player.sendMessage("\xA77Example: /ae:withdraw 1000")
            return
        }

        // resolve the integer amount.
        const amount = Math.floor(parseFloat(args[0]))
        
        // step 1: industrial bound validation.
        // prevents floating point errors or integer overflow in the economy engine.
        if (!ValidationHelper.isValidMoney(amount)) {
            player.sendMessage("\xA7c\xA7l» \xA77Invalid liquidity amount. Exceeds safe industrial bounds.");
            return
        }

        // minimum/maximum operational constraints.
        if (amount < 100) {
            player.sendMessage("\xA7c\xA7l» \xA77Minimum withdrawal amount is \xA7e$100");
            return
        }

        if (amount > 1000000) {
            player.sendMessage("\xA7c\xA7l» \xA77Maximum withdrawal amount is \xA7e$1,000,000");
            return
        }

        // step 2: balance check.
        // query the persistent economy store for the player's account state.
        const balance = EconomyStore.getBalance(player.id)
        if (balance < amount) {
            player.sendMessage(`\xA7c\xA7l» \xA77Insufficient funds. You have ${BanknoteStore.formatMoney(balance)}`);
            return
        }

        // step 3: inventory capacity check.
        // calculate how many physical slots we need based on the denomination spread.
        const requiredSlots = Math.ceil(amount / 64000) 
        const availableSlots = getAvailableInventorySlots(player)
        
        if (availableSlots < requiredSlots) {
            player.sendMessage(`\xA7c\xA7l» \xA77Not enough inventory space. Need ${requiredSlots} slots, have ${availableSlots}`);
            return
        }

        // step 4: transaction execution.
        // we use system.run to ensure the operation is atomic and doesn't block the tick.
        system.run(() => {
            try {
                // remove digital currency first.
                if (!EconomyStore.removeMoney(player.id, amount)) {
                    player.sendMessage("\xA7c\xA7l» \xA77Failed to withdraw money.");
                    return
                }

                // convert the digital debit into physical items.
                const created = createBanknotes(player, amount)
                
                if (created > 0) {
                    player.sendMessage(`\xA7a\xA7l» \xA7fSuccessfully withdrew ${BanknoteStore.formatMoney(amount)} into ${created} banknote(s)`);
                    player.sendMessage("\xA77Right-click banknotes to redeem them");
                } else {
                    // if item creation failed (e.g. inventory filled mid-operation), refund the debit.
                    EconomyStore.addMoney(player.id, amount)
                    player.sendMessage("\xA7c\xA7l» \xA77Failed to create banknotes. Money refunded.");
                }
            } catch (error) {
                // catch-all for engine crashes. ensure atomicity by refunding.
                console.error(`Withdraw error: ${error}`)
                player.sendMessage("\xA7c\xA7l» \xA77An error occurred during withdrawal.");
                EconomyStore.addMoney(player.id, amount)
            }
        })
    }
}

// ----------------------------------------------------------------------------
// | function: createBanknotes                                               |
// | iterates through denominations and injects items into the player container.|
// ----------------------------------------------------------------------------
function createBanknotes(player, totalAmount) {
    // standard industrial denominations.
    const denominations = [1000000, 500000, 100000, 50000, 10000, 5000, 1000, 500, 100]
    let remaining = totalAmount
    let created = 0

    // nested loop for greedy denomination splitting.
    for (const denom of denominations) {
        while (remaining >= denom) {
            // create the logical banknote record.
            const banknote = BanknoteStore.createBanknote(denom, player.id, player.name)
            
            // commit the record to world dynamic properties (security verification).
            if (!BanknoteStore.storeBanknoteData(banknote)) {
                console.error(`Failed to store banknote data for ${banknote.id}`)
                continue
            }

            // construct the physical ItemStack.
            const item = new ItemStack(BanknoteStore.getBanknoteId(), 1)
            item.nameTag = BanknoteStore.getBanknoteName(denom)
            item.setLore(BanknoteStore.getBanknoteLore(banknote))
            // bind the logical ID to the item's dynamic property for redemption validation.
            try { item.setDynamicProperty("ae:banknote_id", banknote.id) } catch (e) {}
            
            // deliver the item.
            const container = player.getComponent("inventory").container
            const leftover = container.addItem(item)
            
            if (leftover === undefined) {
                // item successfully added.
                remaining -= denom
                created++
            } else {
                // inventory overflow encountered. stop processing this denomination.
                break
            }
        }
        
        // exit if we can't fulfill any more minimum denominations.
        if (remaining < 100) break 
    }

    // refund any amount that couldn't be converted due to inventory constraints.
    if (remaining > 0) {
        EconomyStore.addMoney(player.id, remaining)
        player.sendMessage(`\xA77Could not convert ${BanknoteStore.formatMoney(remaining)} - refunded to account`);
    }

    return created
}

// ----------------------------------------------------------------------------
// | function: getAvailableInventorySlots                                    |
// | scans the player's container to count unoccupied slots or stackable zones.|
// ----------------------------------------------------------------------------
function getAvailableInventorySlots(player) {
    try {
        const container = player.getComponent("inventory").container
        let available = 0
        
        for (let i = 0; i < container.size; i++) {
            const item = container.getItem(i)
            // check for null (empty) or compatible banknote stacks.
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
