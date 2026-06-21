# ⚜︎ AethelLib Version 1.0.9 Major Update. 26.30 - 6/16/26

---

### ✦ Improved

* **- Overall Core System Stability**
  Enhanced internal state tracking, streamlined memory management, and resolved a comprehensive suite of up to 50 codebase bugs, logic flaws across the Lib to ensure a rock-solid dedicated server runtime.

### ✦ Summry: Fixed

* **- PlayerSelector Array Command Parsing**
  Fixed a critical C++ parameter parsing flaw in `CommandManager.js` where single-parameter PlayerSelector inputs (such as `/ae:tpa <player>`) were incorrectly treated as named argument dictionary objects instead of arrays. Now natively unpacked to target players correctly.

* **- Stale Cache Target Resolution**
  Patched `PlayerUtils.js` to correctly unpack PlayerSelector arrays inside `resolveFromArgs`, ensuring that any multi-target array inputs can resolve the first player object seamlessly instead of triggering offline player state errors.

* **- Recycled Entity ID Permission Leak**
  Resolved a major security hijack vulnerability in `PermissionManager.js` where the Bedrock Dedicated Server recycled entity IDs. When an administrator disconnected and a new player inherited their ID, they would gain the administrator's cached permission states. Added active `playerLeave` subscription hooks to clear the permission cache instantly on disconnect.

* **- TPA Command Duplicate Notifications**
  Fixed redundant notification output where both the TPA commands and the `TpaService.js` sent success alerts to the player. Command execution loops now await the asynchronous service promise execution to prevent race conditions and double-talk.

* **- Dynamic Teleportation Lifecycle Messaging**
  Refactored `TpaService.js` to dynamically generate chat notifications and pop-up UI forms based on the TPA request type (`tpa` vs `tpahere`), correcting the target message to read `wants you to teleport to them` instead of the hardcoded `wants to teleport to you` when executing here-teleports.
