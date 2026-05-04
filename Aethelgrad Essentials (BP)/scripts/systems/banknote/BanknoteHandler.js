/**
 * Banknote Handler - Handles banknote redemption events
 */

import { system, world } from "@minecraft/server"
import { BanknoteStore } from "./BanknoteStore.js"
import { EconomyStore } from "../economy/EconomyStore.js"

export class BanknoteHandler {
    static init() {
        // Handle item use (right-click)
        world.beforeEvents.itemUse.subscribe((event) => {
            const { source: player, item } = event
            
            // Check if it's a banknote
            if (!BanknoteStore.isBanknoteItem(item)) return
            
            // Prevent default behavior
            event.cancel = true
            
            // Handle redemption
            this.handleRedemption(player, item)
        })

        // Handle item drop (left-click in air)
        world.beforeEvents.itemCompleteUse.subscribe((event) => {
            const { source: player, item } = event
            
            // Check if it's a banknote
            if (!BanknoteStore.isBanknoteItem(item)) return
            
            // Prevent default behavior
            event.cancel = true
            
            // Handle redemption
            this.handleRedemption(player, item)
        })
    }

    static handleRedemption(player, item) {
        system.run(() => {
            try {
                // Extract banknote data from item
                const banknoteData = this.extractBanknoteFromItem(item)
                
                if (!banknoteData) {
                    player.sendMessage("§cInvalid banknote item")
                    return
                }

                // Check if already redeemed
                if (banknoteData.redeemed) {
                    player.sendMessage("§cThis banknote has already been redeemed")
                    return
                }

                // Get banknote data from storage
                const storedBanknote = BanknoteStore.getBanknoteData(banknoteData.id)
                
                if (!storedBanknote) {
                    player.sendMessage("§cBanknote data not found")
                    return
                }

                if (storedBanknote.redeemed) {
                    player.sendMessage("§cThis banknote has already been redeemed")
                    return
                }

                // Confirm redemption
                this.showRedemptionDialog(player, storedBanknote, item)
            } catch (error) {
                console.error(`Banknote redemption error: ${error}`)
                player.sendMessage("§cFailed to redeem banknote")
            }
        })
    }

    static extractBanknoteFromItem(item) {
        try {
            const lore = item.getLore()
            if (!lore || lore.length === 0) return null

            // Parse lore to extract banknote data
            let amount = 0
            let timestamp = 0
            let creator = ""
            let noteId = ""

            for (const line of lore) {
                if (line.startsWith("§6Value: §e$")) {
                    amount = parseInt(line.replace("§6Value: §e$", "").replace(/,/g, ""))
                } else if (line.startsWith("§7Created: ")) {
                    const dateStr = line.replace("§7Created: ", "")
                    timestamp = new Date(dateStr).getTime()
                } else if (line.startsWith("§7By: §f")) {
                    creator = line.replace("§7By: §f", "")
                } else if (line.startsWith("§8ID: ")) {
                    noteId = line.replace("§8ID: ", "")
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
            title: "§6Banknote Redemption",
            content: `§7You are about to redeem:\n\n§6Amount: §e${amount}\n§7Created: ${date}\n§7By: §f${creator}\n\n§aThis will add the money to your account.`,
            button1: "§aRedeem",
            button2: "§cCancel"
        }

        system.run(() => {
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
                player.sendMessage("§cFailed to mark banknote as redeemed")
                return
            }

            // Add money to player's account
            if (!EconomyStore.addMoney(player.id, banknote.amount)) {
                player.sendMessage("§cFailed to add money to your account")
                // Unmark as redeemed
                BanknoteStore.markRedeemed(banknote.id) // This should toggle back
                return
            }

            // Remove the item from inventory
            const container = player.getComponent("inventory").container
            const slot = container.getSlot(item)
            if (slot) {
                slot.setItem(undefined)
            }

            player.sendMessage(`§aSuccessfully redeemed ${BanknoteStore.formatMoney(banknote.amount)}`)
            
            // Log the redemption
            console.log(`Banknote redeemed: ${banknote.id} by ${player.name} for $${banknote.amount}`)
        } catch (error) {
            console.error(`Banknote redemption processing error: ${error}`)
            player.sendMessage("§cFailed to complete redemption")
        }
    }
}
