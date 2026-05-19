/**
 * Banknote Handler - Handles banknote redemption events
 */
import { Kernel } from "../../core/Kernel.js";


import { BanknoteStore } from "./BanknoteStore.js"
import { EconomyStore } from "../economy/EconomyStore.js"

export class BanknoteHandler {
    static init() {
        // Handle item use (right-click)
        Kernel.world.beforeEvents.itemUse.subscribe((event) => {
            const { source: player, itemStack: item } = event
            
            // Check if it's a banknote
            if (!BanknoteStore.isBanknoteItem(item)) return
            
            // Prevent default behavior
            event.cancel = true
            
            // Handle redemption
            this.handleRedemption(player, item)
        })

    }

    static handleRedemption(player, item) {
        Kernel.system.run(() => {
            try {
                // Extract banknote data from item
                const banknoteData = this.extractBanknoteFromItem(item)
                
                if (!banknoteData) {
                    player.sendMessage("\xA7cInvalid banknote item")
                    return
                }

                // Check if already redeemed
                if (banknoteData.redeemed) {
                    player.sendMessage("\xA7cThis banknote has already been redeemed")
                    return
                }

                // Get banknote data from storage
                const storedBanknote = BanknoteStore.getBanknoteData(banknoteData.id)
                
                if (!storedBanknote) {
                    player.sendMessage("\xA7cBanknote data not found")
                    return
                }

                if (storedBanknote.redeemed) {
                    player.sendMessage("\xA7cThis banknote has already been redeemed")
                    return
                }

                // Confirm redemption
                this.showRedemptionDialog(player, storedBanknote, item)
            } catch (error) {
                console.error(`Banknote redemption error: ${error}`)
                player.sendMessage("\xA7cFailed to redeem banknote")
            }
        })
    }

    static extractBanknoteFromItem(item) {
        try {
            let noteId = item.getDynamicProperty("ae:banknote_id")

            const lore = item.getLore()
            if (!lore || lore.length === 0) return null

            let amount = 0
            let timestamp = 0
            let creator = ""

            for (const line of lore) {
                if (line.startsWith("\xA76Value: \xA7e$")) {
                    amount = parseInt(line.replace("\xA76Value: \xA7e$", "").replace(/,/g, ""))
                } else if (line.startsWith("\xA77Created: ")) {
                    const dateStr = line.replace("\xA77Created: ", "")
                    timestamp = new Date(dateStr).getTime()
                } else if (line.startsWith("\xA77By: \xA7f")) {
                    creator = line.replace("\xA77By: \xA7f", "")
                } else if (!noteId && line.startsWith("\xA78ID: ")) {
                    noteId = line.replace("\xA78ID: ", "")
                }
            }

            if (!noteId || amount <= 0) return null

            return {
                id: noteId,
                amount: amount,
                creator: creator,
                timestamp: timestamp,
                redeemed: false
            }
        } catch (error) {
            console.error(`Failed to extract banknote data: ${error}`)
            return null
        }
    }

    static showRedemptionDialog(player, banknote, item) {
        const amount = BanknoteStore.formatMoney(banknote.amount)
        const creator = banknote.creator
        const date = new Date(banknote.timestamp).toLocaleDateString()

        // Create confirmation dialog
        const form = {
            type: "modal",
            title: "\xA76Banknote Redemption",
            content: `\xA77You are about to redeem:\n\n\xA76Amount: \xA7e${amount}\n\xA77Created: ${date}\n\xA77By: \xA7f${creator}\n\n\xA7aThis will add the money to your account.`,
            button1: "\xA7aRedeem",
            button2: "\xA7cCancel"
        }

        Kernel.system.run(() => {
            player.onFormResponse(form, (response) => {
                if (response === 0) { // Redeem button
                    this.processRedemption(player, banknote, item)
                }
            })
        })
    }

    static processRedemption(player, banknote, item) {
        try {
            // Mark as redeemed
            if (!BanknoteStore.markRedeemed(banknote.id)) {
                player.sendMessage("\xA7cFailed to mark banknote as redeemed")
                return
            }

            // Add money to player's account
            if (!EconomyStore.addMoney(player.id, banknote.amount)) {
                player.sendMessage("\xA7cFailed to add money to your account")
                // Unmark as redeemed
                BanknoteStore.markRedeemed(banknote.id) // This should toggle back
                return
            }

            // Remove the item from inventory
            const container = player.getComponent(EntityComponentTypes.Inventory).container
            const slot = container.getSlot(item)
            if (slot) {
                slot.setItem(undefined)
            }

            player.sendMessage(`\xA7aSuccessfully redeemed ${BanknoteStore.formatMoney(banknote.amount)}`)
            
            // Log the redemption
            console.log(`Banknote redeemed: ${banknote.id} by ${player.name} for $${banknote.amount}`)
        } catch (error) {
            console.error(`Banknote redemption processing error: ${error}`)
            player.sendMessage("\xA7cFailed to complete redemption")
        }
    }
}



