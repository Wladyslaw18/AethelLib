# <span style="color:#D4AF37">⚜&#xFE0E; AethelLib Architecture ⚜&#xFE0E;</span>

<br>

## <span style="color:#5D9CEC">✦ Root & Deployment Scripts ✦</span>

> 🖈 _Located at `scripts/`_
>
> _The root entry points, global types, and deployment utilities that orchestrate the repository._

```text
scripts/
├── ⚙ main.js                          # Main entry point that initializes the kernel and modules
├── ⚙ Configuration.js                 # Global configuration settings and constants for the add-on
└── ▤ types.js                         # Shared type definitions for intellisense and codebase strictness
```

---

## <span style="color:#ED5565">✦ Core Kernel & Framework ✦</span>
> 🖈 *Located at `scripts/core/` and `scripts/bootstrap/`*
>
> *The heart of AethelLib. Handles lifecycle events, dependency injection, and core data abstractions.*

```text
core/
├── ⬢ Kernel.js                        # The central nervous system, manages lifecycle, services, and events
├── ⬢ LifecycleController.js           # Controls and sequences the server startup/shutdown phases
│
├── abstractions/                      # 🖿 Interfaces and base classes
│   ├── ▤ ICommand.js                  # Interface for all command implementations
│   ├── ▤ IStore.js                    # Interface for database/storage models
│   └── ▤ ISystem.js                   # Interface for modular backend systems
│
├── cache/                             # 🖿 Memory caching logic
│   └── ⚙ CacheManager.js              # Manages transient memory and optimizes read/writes
│
├── commands/                          # 🖿 Core command logic
│   └── ⚙ CommandManager.js            # Registers and resolves command execution
│
├── datastore/                         # 🖿 Persistent data logic
│   └── ⚙ DatabaseManager.js           # Handles robust dynamic properties read/writes
│
├── permissions/                       # 🖿 RBAC (Role-Based Access Control)
│   ├── ▤ PermissionData.js            # Node data models for permissions
│   └── ⚙ PermissionManager.js         # Evaluates user roles and resolves access
│
├── plugins/                           # 🖿 Extensibility framework
│   └── ⚙ PluginManager.js             # Safely loads, isolates, and unloads external modules
│
├── scheduler/                         # 🖿 Timing and execution
│   └── ⚙ TickScheduler.js             # Handles delayed execution and repeating tick tasks
│
├── services/                          # 🖿 Background workers
│   └── ⚙ CleanupService.js            # Garbage collection and memory stabilization
│
├── signalbus/                         # 🖿 Decoupled communication
│   └── ⚙ SignalBus.js                 # Event emitter pattern to prevent tight coupling
│
└── store/                             # 🖿 Data persistence models
    ├── ▤ BatchStore.js                # Handles batched saving for performance
    ├── ▤ PlayerStore.js               # Persistence model for player-specific data
    ├── ▤ SettingsStore.js             # Persistence model for global settings
    ├── ▤ StoreKeys.js                 # Constants defining key indices
    └── ▤ WorldStore.js                # Persistence model for world-specific data

bootstrap/
├── ⚙ commands.js                      # Bootstraps the command registry and routing into Kernel
├── ⚙ core.js                          # Bootstraps the core systems (DB, Scheduler)
├── ⚙ early.js                         # Early startup logic (runs before primary initialization)
├── ⚙ services.js                      # Bootstraps background services
└── ⚙ systems.js                       # Bootstraps modular gameplay systems
```

---

## <span style="color:#A0D468">✦ Game Systems & Services ✦</span>

> 🖈 _Located at `scripts/systems/`_
>
> _The high-level logic covering player moderation, economy, teleportation, and game rules._

```text
systems/
├── admin/                             # 🖿 Administration Services
│   └── ⚙ BanManager.js                # Manages ban lists and prevents unauthorized access
│
├── auction/                           # 🖿 Auction House
│   ├── ⚙ AuctionService.js            # Handles bidding, timers, and sales logic
│   └── ▤ AuctionStore.js              # Persists active and expired auctions
│
├── banknote/                          # 🖿 Physical Currency
│   ├── ⚙ BanknoteHandler.js           # Handles item interactions for claiming physical money
│   └── ▤ BanknoteStore.js             # Data definitions for banknote items
│
├── broadcasts/                        # 🖿 Auto-Broadcaster
│   ├── ▤ BroadcastData.js             # Data structure for broadcast messages
│   ├── ⚙ BroadcastService.js          # Rotates and displays broadcasts on a timer
│   └── ▤ BroadcastStore.js            # Persistence for configured broadcasts
│
├── combat/                            # 🖿 Combat & PvP
│   ├── ⚙ CombatIntegrity.js           # Combat logging and anti-cheat validation
│   └── ⚙ Killstreaks.js               # Tracks kills and distributes streak rewards
│
├── economy/                           # 🖿 Primary Economy Tracker
│   ├── ▤ EconomyStore.js              # Persists player balances
│   ├── ⚙ ScoreboardMirror.js          # Mirrors balances to the Minecraft sidebar scoreboard
│   ├── ⚙ ShopService.js               # High-level API for processing shop purchases
│   └── ▤ ShopStore.js                 # Persists global shop listings
│
├── floatingtext/                      # 🖿 Holograms
│   ├── ⚙ FloatingTextService.js       # Handles the spawning and updating of floating text entities
│   └── ▤ FloatingTextStore.js         # Persists text locations and content
│
├── general/                           # 🖿 Utility Stores
│   └── ▤ ReportStore.js               # Persists player reports for admin review
│
├── placeholders/                      # 🖿 String Interpolation
│   ├── ⚙ PlaceholderProvider.js       # Maps placeholders like {player} or {money} to data
│   └── ⚙ PlaceholderScheduler.js      # Periodically updates dynamic placeholders
│
├── protection/                        # 🖿 Land Claiming
│   ├── ⚙ ClaimService.js              # Validates interaction rights within claimed chunks
│   └── ▤ ClaimStore.js                # Persists claim boundaries and owners
│
├── sell/                              # 🖿 Quick Selling
│   └── ▤ SellStore.js                 # Persists item prices for hand-selling
│
├── shop/                              # 🖿 Chest Shops & Server Shops
│   ├── ▤ ChestShopStore.js            # Persists physical block coordinates for player shops
│   ├── ⚙ ShopRegistry.js              # Registers item availability
│   └── ▤ ShopStore.js                 # Data models for shop transactions
│
├── social/                            # 🖿 Chat, Muting, & Ranks
│   ├── ▤ MuteStore.js                 # Persists muted players
│   ├── chat/                          # Chat formatting and overrides
│   │   ├── ⚙ ChatSystem.js            # Overrides default chat to inject ranks and colors
│   │   └── ⚙ ColorSystem.js           # Parses standard color codes (e.g., &a, §b)
│   └── ranks/                         # Rank hierarchy
│       ├── ⚙ RankFormatter.js         # Formats chat prefixes/suffixes
│       ├── ▤ RankStore.js             # Persists player ranks
│       └── ⚙ RankSystem.js            # Handles rank promotion/demotion logic
│
├── teleport/                          # 🖿 Warps & Homes
│   ├── ▤ HomeStore.js                 # Persists player home coordinates
│   ├── ⚙ TeleportService.js           # Handles safe teleportation (loading chunks, checking bounds)
│   └── ▤ WarpStore.js                 # Persists global server warps
│
└── tpa/                               # 🖿 TPA Requests
    ├── ⚙ TpaHandshake.js              # Handles the timeout and acceptance logic for TPA requests
    ├── ⚙ TpaService.js                # Validates TPA constraints (cooldowns, combat tags)
    └── ▤ TpaStore.js                  # Temporary storage for active requests
```

---

## <span style="color:#AC92EC">✦ UI Form Generators ✦</span>

> 🖈 _Located at `scripts/ui/`_
>
> _Client-side form generation bridging @minecraft/server-ui with AethelLib systems._

```text
ui/
├── ⚙ Lang.js                          # Language and string registry for UI form localization
├── ⚙ MainGUI.js                       # The primary hub menu for players
├── ⚙ UIUtils.js                       # Helper functions for drawing robust menus
│
├── admin/                             # 🖿 Admin Moderation Forms
│   └── ⚙ AdminReportUI.js             # UI for reviewing submitted reports
│
├── auction/                           # 🖿 Auction Forms
│   ├── ⚙ AuctionActionUI.js           # Bidding and buyout forms
│   ├── ⚙ AuctionBrowseUI.js           # Browsing active auctions
│   └── ⚙ AuctionUI.js                 # Main auction hub
│
├── economy/                           # 🖿 Shop Forms
│   ├── ⚙ ShopCategoryUI.js            # Browsing items by category
│   ├── ⚙ ShopInventoryUI.js           # Specific item purchasing
│   ├── ⚙ ShopSearchUI.js              # Searching for items in the shop
│   ├── ⚙ ShopTransaction.js           # Confirmation forms for purchases
│   └── ⚙ ShopUI.js                    # Main shop hub
│
├── protection/                        # 🖿 Claim Forms
│   └── ⚙ ClaimUI.js                   # Claim management and member trusting
│
├── settings/                          # 🖿 Player Settings
│   └── ⚙ SettingsUI.js                # Managing personal toggles
│
├── shop/                              # 🖿 Secondary Shop Implementations
│   └── ⚙ Shop*.js                     # Extended UI logic for varied shop mechanics
│
├── social/                            # 🖿 Social & Ranks Forms
│   ├── ⚙ PlayerActionUI.js            # Actions upon clicking a player (Trade, TPA, Report)
│   ├── ⚙ PlayerListUI.js              # Dynamic online player list
│   └── ranks/                         # Form logic for editing rank permissions
│       ├── ⚙ RankUI.js                # Main rank editor
│       └── modules/                   # Sub-forms for specific permission sets (Admin, Basic, ChestShop, Land)
│
└── teleport/                          # 🖿 Teleport Forms
    ├── ⚙ HomeActionUI.js              # Editing or deleting a home
    ├── ⚙ HomeSubmenuUI.js             # Intermediate home categories
    ├── ⚙ HomeUI.js                    # Main homes list
    └── ⚙ WarpUI.js                    # Server warps list
```

---

## <span style="color:#4FC1E9">✦ Commands Suite ✦</span>

> 🖈 _Located at `scripts/commands/`_
>
> _User-facing chat commands bound via the CommandManager._

```text
commands/
├── ⚙ AdminRegistry.js                 # Bootstraps admin-tier commands
├── ⚙ EconomyRegistry.js               # Bootstraps economic-tier commands
├── ⚙ GeneralRegistry.js               # Bootstraps public-tier commands
├── ⚙ SpatialRegistry.js               # Bootstraps teleportation-tier commands
├── ⚙ index.js                         # Re-exports registries
│
├── admin/                             # 🖿 Overpowered Operations
│   ├── ⚙ AdminPanel*.js               # Triggers Admin UI variations
│   ├── ⚙ BanCommand.js                # /ban
│   ├── ⚙ BroadcastCommand.js          # /broadcast
│   ├── ⚙ GamemodeCommand.js           # /gmc, /gms
│   ├── ⚙ InvSeeCommand.js             # /invsee
│   ├── ⚙ KickCommand.js               # /kick
│   ├── ⚙ MuteCommand.js               # /mute
│   └── ⚙ ResetDataCommand.js          # /resetdata
│
├── auction/                           # 🖿 /ah suite
├── banknote/                          # 🖿 /withdraw suite
├── economy/                           # 🖿 /money, /pay, /topmoney
├── general/                           # 🖿 /help, /tps, /message, /reply
├── sell/                              # 🖿 /sell hand, /sell all
├── social/                            # 🖿 /color, /rank
├── teleport/                          # 🖿 /sethome, /home, /warp, /spawn
└── tpa/                               # 🖿 /tpa, /tpaccept, /tpadeny
```

---

## <span style="color:#FFCE54">✦ Utilities & Data ✦</span>

> 🖈 _Located at `scripts/utils/`, `scripts/data/`, and `scripts/events/`_
>
> _Static configurations, game event listeners, and math/formatting helpers._

```text
data/
├── ▤ KillstreakConfig.js              # Defines kills required for rewards
├── ▤ minecraft-items.js               # Master metadata index of all vanilla items
└── ▤ RankConfig.js                    # Definitions for roles and permission weights

events/
├── ⚙ ChestShopHandler.js              # Event listener: Parses signs placed on chests to build shops
├── ⚙ CompassHandler.js                # Event listener: Opens MainGUI when using a compass
└── ⚙ ProtectionHandler.js             # Event listener: Cancels destruction events inside claims

utils/
├── ▤ Constants.js                     # Global constants (color codes, limits, prefixes)
├── ⚙ EntityHelper.js                  # Math and checks for entities
├── ⚙ FormatHelper.js                  # Number rounding and text formatting
├── ⚙ PlayerUtils.js                   # Retrieval and validation of online players
├── ⚙ TimeHelper.js                    # Converters for ticks/seconds/milliseconds
└── ⚙ ValidationHelper.js              # Type guards and bounds checking
```

---

## <span style="color:#8CC152">✦ Plugins (Extension API) ✦</span>

> 🖈 _Located at `scripts/plugins/`_
>
> _Isolated environments capable of interacting with the Kernel without modifying Core._

```text
plugins/
├── ⚙ PluginLoader.js                  # Evaluates and securely mounts plugins on startup
│
├── BountyHunter/                      # 🖿 Plugin: Player bounties tracking
├── Clans/                             # 🖿 Plugin: Group management
├── CoreEconomy/                       # 🖿 Plugin: Example economy extension
└── ExamplePlugin/                     # 🖿 Plugin: Template for developers
    ├── ⚙ ExampleLoader.js             # Loads example systems
    └── commands/
        └── ⚙ PingCommand.js           # /ping demonstration
```

---

## ✦ HEADLESS COMMAND TESTING

The testing framework allows console-driven command verification.

### 1. Headless Commands
Commands are dispatched using `/scriptevent ae:test_cmd`.

*   **List Warps**: `scriptevent ae:test_cmd listwarp`
*   **Set Warp**: `scriptevent ae:test_cmd setwarp <name>`
*   **Teleport to Warp**: `scriptevent ae:test_cmd warp <name>`
*   **Delete Warp**: `scriptevent ae:test_cmd delwarp <name>`
*   **Calculator**: `scriptevent ae:test_cmd calc <expression>`

### 2. Design Principles
*   **Input Pipe**: Stdin input is forwarded to the bedrock server using standard streams.
*   **Impostor Entity**: The server executes the logic against a virtual client object with full permissions.
*   **Trace Extraction**: Script errors print stack lines to console output.

