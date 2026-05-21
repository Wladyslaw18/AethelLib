# ⚜︎ AethelLib Stability & Security Hotfix
Update 1.0.5 - May 21, 2026

---

### ✧ Fixed (Bugs & Crashes)

* **- Concurrency Bleed in JournaledDatabase**
  Transactions were flushing the entire journal before locking, which caused other players' buffered data to get written mid-transaction. Fixed with `flushKeys()` — transactions now only flush keys belonging to the transacting player.

* **- Admin Economy Panel Crash**
  Give Money, Take Money, and Set Balance were passing `target.id` (a string) instead of the Player object. Also called `setMoney` which doesn't exist. Fixed to pass the Player object and call `setBalance`.

* **- ChestShop Security Bypass**
  The permission check was calling `Kernel.get("claimService")` which doesn't exist in the registry. Anyone could link a chest shop anywhere. Fixed to use `SpatialCache.canBuild` via dynamic import.

* **- Report Panel Ban Crash**
  Banning from the Admin Report UI was looking up `"admin"` in the kernel and calling `.banPlayer()`, both wrong. Fixed to resolve `"banManager"` and call `.addBan()` with a full ban data object. Also kicks the player from the session immediately after the ban is committed.

* **- PlayerSelector Stringification (5 Commands)**
  When using slash autocomplete, Bedrock passes a C++ Player object as `args[0]` instead of a string. Calling `.join()` on it stringified it to `"[object Object]"` and the lookup failed every time. Fixed all five affected commands (`/ae:tpa`, `/ae:tpahere`, `/ae:block`, `/ae:unblock`, `/ae:inspect`) to detect object args and use them directly, falling back to string lookup otherwise.

* **- BatchStore Write Latency & Shutdown Lag**
  `#executePlayerBatch` and `#executeWorldBatch` were routing writes through `PlayerStore` and `WorldStore` proxy layers, creating circular latency and unreliable shutdown flushing. Fixed to write directly to the raw `Database` service, bypassing all intermediate proxies.
