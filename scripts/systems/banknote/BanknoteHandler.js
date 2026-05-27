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
                    player.sendMessage("\u00A7cInvalid banknote item")
                    return
                }

                // Check if already redeemed
                if (banknoteData.redeemed) {
                    player.sendMessage("\u00A7cThis banknote has already been redeemed")
                    return
                }

                // Get banknote data from storage
                const storedBanknote = BanknoteStore.getBanknoteData(banknoteData.id)
                
                if (!storedBanknote) {
                    player.sendMessage("\u00A7cBanknote data not found")
                    return
                }

                if (storedBanknote.redeemed) {
                    player.sendMessage("\u00A7cThis banknote has already been redeemed")
                    return
                }

                // Confirm redemption
                this.showRedemptionDialog(player, storedBanknote, item)
            } catch (error) {
                console.error(`Banknote redemption error: ${error}`)
                player.sendMessage("\u00A7cFailed to redeem banknote")
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
                if (line.startsWith("\u00A76Value: \u00A7e$")) {
                    amount = parseInt(line.replace("\u00A76Value: \u00A7e$", "").replace(/,/g, ""))
                } else if (line.startsWith("\u00A77Created: ")) {
                    const dateStr = line.replace("\u00A77Created: ", "")
                    timestamp = new Date(dateStr).getTime()
                } else if (line.startsWith("\u00A77By: \u00A7f")) {
                    creator = line.replace("\u00A77By: \u00A7f", "")
                } else if (!noteId && line.startsWith("\u00A78ID: ")) {
                    noteId = line.replace("\u00A78ID: ", "")
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

    static async showRedemptionDialog(player, banknote, item) {
        const amount = BanknoteStore.formatMoney(banknote.amount)
        const creator = banknote.creator
        const date = new Date(banknote.timestamp).toLocaleDateString()

        const form = new Kernel.MessageFormData()
            .title("\u00A76Banknote Redemption")
            .body(`\u00A77You are about to redeem:\n\n\u00A76Amount: \u00A7e${amount}\n\u00A77Created: ${date}\n\u00A77By: \u00A7f${creator}\n\n\u00A7aThis will add the money to your account.`)
            .button1("\u00A7aRedeem") // Selection 0
            .button2("\u00A7cCancel") // Selection 1

        const { UIUtils } = await import("../../ui/UIUtils.js");
        
        Kernel.system.run(async () => {
            const response = await UIUtils.showForm(player, form);
            if (!response.canceled && response.selection === 0) {
                await this.processRedemption(player, banknote, item);
            }
        });
    }

    static async processRedemption(player, banknote, item) {
        try {
            // Find and verify the banknote exists in player inventory first to prevent duplication exploits
            const container = player.getComponent(Kernel.EntityComponentTypes.Inventory)?.container; // container?.
            let targetSlotIndex = -1;

            for (let i = 0; i < container.size; i++) {
                const slot = container.getSlot(i);
                if (slot && slot.hasItem()) {
                    const currentItem = slot.getItem();
                    if (BanknoteStore.isBanknoteItem(currentItem)) {
                        const extracted = this.extractBanknoteFromItem(currentItem);
                        if (extracted && extracted.id === banknote.id) {
                            targetSlotIndex = i;
                            break;
                        }
                    }
                }
            }

            // Fallback to selected slot if not found by ID
            if (targetSlotIndex === -1) {
                const selectedSlot = container.getSlot(player.selectedSlotIndex);
                if (selectedSlot && selectedSlot.hasItem()) {
                    const currentItem = selectedSlot.getItem();
                    if (BanknoteStore.isBanknoteItem(currentItem)) {
                        targetSlotIndex = player.selectedSlotIndex;
                    }
                }
            }

            if (targetSlotIndex === -1) {
                player.sendMessage("\u00A7cRedemption failed: Banknote no longer found in your inventory.");
                return;
            }

            // Mark as redeemed
            if (!BanknoteStore.markRedeemed(banknote.id)) {
                player.sendMessage("\u00A7cFailed to mark banknote as redeemed")
                return
            }

            // Add money to player's account
            const added = await EconomyStore.addMoney(player.id, banknote.amount);
            if (!added) {
                player.sendMessage("\u00A7cFailed to add money to your account")
                // Unmark as redeemed
                BanknoteStore.markRedeemed(banknote.id) // This should toggle back
                return
            }

            // Remove/decrement the banknote from inventory
            const targetSlot = container.getSlot(targetSlotIndex);
            if (targetSlot && targetSlot.hasItem()) {
                const currentItem = targetSlot.getItem();
                if (currentItem.amount > 1) {
                    targetSlot.amount = currentItem.amount - 1;
                } else {
                    targetSlot.setItem(undefined);
                }
            }

            player.sendMessage(`\u00A7aSuccessfully redeemed ${BanknoteStore.formatMoney(banknote.amount)}`)
            
            // Log the redemption
            console.log(`Banknote redeemed: ${banknote.id} by ${player.name} for $${banknote.amount}`)
        } catch (error) {
            console.error(`Banknote redemption processing error: ${error}`)
            player.sendMessage("\u00A7cFailed to complete redemption")
        }
    }
}



