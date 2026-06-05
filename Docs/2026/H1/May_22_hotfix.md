# ⚜ AethelLib Stability & Security Hotfix
Update 1.0.6 - May 22, 2026

---

### ✧ Fixed (Bugs & Crashes)

* **- Shop Confirmation Exploit & Double Transactions**
  Implemented a synchronous transaction lock (`busy: true`) in `ShopConfirmation.js` before executing callbacks within `system.run`. This prevents rapid player inputs (like double-pressing 'Y' in chat) from double-triggering transactions. Handled environment compatibility for clearing timeout tasks by supporting both `system.clearRun` and `system.clearRunJob`.

* **- PermissionManager Static Reference Errors**
  Refactored incorrect imports and static invocations of the `PermissionManager` class to use the exported singleton `PermissionManagerInstance`. This resolves crashes and logic bugs in commands (like `WarnCommand` and `KickAllCommand`) that previously defaulted to false and denied access to admins.

* **- Invalid Database World Lookups**
  Replaced non-existent database register references (`this.context.getService("worldStore")`) with native engine world references (`this.context.world`) in `WarnCommand.js` and BountyHunter's `bootloader.js`.

* **- Shop Cart / Buy Safety & Pricing Integrity**
  Added robust input validation at the start of `getBasePrice` in `ShopPrices.js` to safeguard against invalid or non-string inputs (returning a fallback price of `100`). Optimized inventory capacity checks in `hasInventorySpace` (`ShopCore.js`) to utilize the native `item.maxAmount` stack definitions instead of hardcoded limits, preventing item loss during bulk purchases. Added audit warning logs for transactions.

* **- Jail Command Duration & Reason Slicing**
  Refactored `JailCommand.js` to correctly slice durations and reasons using the precise `consumedArgs` count returned by `PlayerUtils.resolveFromArgs`. This prevents parsing failures when player names contain spaces or quotes.

* **- Vanish SocialSpy Interception Coverage**
  Expanded `VanishListener.js` messaging hook to intercept custom prefixes and namespaces (such as `/ae:msg` or `/ae:reply`) when routing private conversation logs to administrators.
