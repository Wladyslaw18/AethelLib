# ⚜︎ AethelLib Stability & Security Hotfix
Update 1.0.7 - May 23, 2026

---

### ✧ Fixed (Bugs & Crashes)

* **- Offline Chest Shop Owner Payouts**
  Fixed a bug in `ChestShopHandler.js` where the owner of a `[buy]` shop would not receive credits if they were offline. Refactored the transaction sequence to credit the owner's database record directly using their `playerId` string, which the underlying `EconomyStore` and `PlayerStore` layers resolve automatically for offline players.

* **- Infinite Credit Printing & Double-Entry Ledger Enforcements**
  Patched a critical economy-breaking exploit in `ChestShopHandler.js` where selling items to a `[sell]` chest shop generated credits for the seller from thin air without charging the shop owner's account. Refactored the interact loop to:
  - Verify the shop owner's balance synchronously and cap the maximum transaction quantity to what the owner can afford.
  - Check physical chest slot capacity before executing the transaction to prevent item loss from full containers.
  - Enforce atomic ledger double-entry transfers using `EconomyStore.transferMoney(ownerId, seller, finalCost)`.
  - Automatically roll back and recover items from the chest if the money transfer transaction fails.
