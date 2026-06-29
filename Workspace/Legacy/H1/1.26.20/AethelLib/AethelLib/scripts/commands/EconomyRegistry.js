import { MoneyCommand } from "./economy/MoneyCommand.js"
import { PayCommand } from "./economy/PayCommand.js"
import { TopMoneyCommand } from "./economy/TopMoneyCommand.js"
import { ShopCommand } from "./shop/ShopCommand.js"
import { SellCommand } from "./sell/SellCommand.js"
import { AuctionCommand } from "./auction/AuctionCommand.js"

export const EconomyRegistry = {
    register(Registry) {
        Registry.register("money", MoneyCommand)
        Registry.register("pay", PayCommand)
        Registry.register("topmoney", TopMoneyCommand)
        Registry.register("shop", ShopCommand)
        Registry.register("sell", SellCommand)
        Registry.register("auction", AuctionCommand)
    }
}
