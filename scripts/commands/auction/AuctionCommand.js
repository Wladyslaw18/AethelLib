import { showAuctionUI } from "../../ui/auction/AuctionUI.js"

// ----------------------------------------------------------------------------
// | object: AuctionCommand                                                   |
// | command definition for the centralized P2P marketplace (Auction House).   |
// | acts as a bridge to the AuctionUI dashboard.                             |
// ----------------------------------------------------------------------------
export const AuctionCommand = {
    // internal name.
    name: "auction",
    // human-readable description.
    description: "Open the auction house menu",
    // syntax guide.
    usage: "/ae:auction",
    // required permission level.
    permission: "essentials.auction",
    // command category.
    category: "Economy",

    // ----------------------------------------------------------------------------
    // | method: execute                                                          |
    // | the marketplace entry vector. spawns the visual auction GUI.             |
    // ----------------------------------------------------------------------------
    execute(_data, player, _args) {
        // invoke the visual dashboard. 
        // the UI logic handles item listing, bidding, and expiration cycles.
        showAuctionUI(player);
    }
}
