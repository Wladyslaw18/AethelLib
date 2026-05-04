/**
 * Shop Command - Browse and buy from admin shop with new UI
 */

import { showShopUI } from "../../ui/shop/ShopUI.js"

export const ShopCommand = {
    name: "shop",
    description: "Browse and buy from the admin shop",
    usage: "!shop",
    permission: "essentials.shop",
    category: "economy",

    async execute(data, player, args) {
        try {
            await showShopUI(player)
        } catch (error) {
            console.error(`Shop command error: ${error}`)
            player.sendMessage("§cFailed to open shop. Please try again.")
        }
    }
}

