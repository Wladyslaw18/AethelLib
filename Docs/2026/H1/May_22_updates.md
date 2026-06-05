# ⚜︎ AethelLib Core Systems & CLI Shop Feature Update — 5/22/26

---

### ✦ Added

* **- Dynamic System Lifecycle Management**
  Administrative control commands (`/ae:systemon` and `/ae:systemdis`) to enable, disable, initialize, and shut down core library systems at runtime. Includes safety locks to protect essential command engines and native autocomplete options.

* **- Tab-Autocomplete CLI Shop Suite**
  A set of six terminal-friendly commands (`/ae:shoplist`, `/ae:shopsearch`, `/ae:shopbuy`, `/ae:shopinfo`, `/ae:shopcart`, `/ae:shopcheckout`) designed to integrate directly with Bedrock's tab-completion enums, bypassing layout latency.

* **- Anti-Inflation Market Saturation & Decay**
  A dynamic market pricing model that tracks sales volume on item trades. As items are sold, their sell price decreases down to a minimum cap of 10% of their base value. Trades decay by 10% every 5 minutes in a background sweep to gradually restore baseline prices.

* **- Simulated Inventory Capacity Verification**
  A mathematically robust greedy checking algorithm (`hasInventorySpace`) that clones container states to verify whether complex multi-item purchases and cart checkouts can fit in the player's inventory before any funds are debited or transactions executed.

* **- Space-Separated Command Arguments**
  Quantity arguments in `/ae:shopbuy` and `/ae:shopcart` can be supplied as space-separated integers (e.g. `/ae:shopbuy diamond 128`), with fallbacks to parsing compressed quantities from item strings.

* **- First True Plugin: AethelEssentials Rollout**
  Introduced `AethelEssentials` (`aethel:essentials`), the first complete, official plugin built on the AethelLib framework. It encapsulates essential server utilities, moderation workflows, player tracking, and world commands:
  * **Moderation Suite**: Commands to warn (`/ae:warn`, `/ae:warnings`, `/ae:clearwarnings`), freeze (`/ae:freeze`), jail/unjail (`/ae:jail`, `/ae:unjail`, `/ae:setjail`), vanish (`/ae:vanish`), and monitor conversations (`/ae:socialspy`).
  * **Player Management Suite**: Nickname setting (`/ae:nick`), real name lookup (`/ae:realname`), offline/online player inspection (`/ae:seen`), and player playtime counters (`/ae:playtime`).
  * **Utility Tools**: Server cleanup commands (`/ae:butcher`, `/ae:killall`, `/ae:kickall`), backup synchronization (`/ae:saveall`), performance diagnostic tools (`/ae:lag`, `/ae:memory`, `/ae:plugins`), and movement speed tuning (`/ae:speed`).
  * **World Control Suite**: Inventory manipulation (`/ae:give`, `/ae:more`), item restoration (`/ae:repair`), custom enchants (`/ae:enchant`), experience point adjustments (`/ae:xp`), and environmental control (`/ae:time`, `/ae:weather`).
