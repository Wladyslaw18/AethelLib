import { showAuctionUI } from "../../ui/auction/AuctionUI.js"

/*
 * Auction Command
 * ----------------------------------------------------------------------------
 * Allows players to open the auction house menu.
 */

export const AuctionCommand = {
    name: "auction",
    description: "Open the auction house menu",

    usage: "/ae:auction",
    permission: "essentials.auction",
    category: "Economy",

    /* 
     * VECTOR_EXECUTION_PIPELINE
     */
    execute(_data, player, _args) {
        showAuctionUI(player);
    }
}

