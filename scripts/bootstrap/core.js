/*
 * CORE_FOUNDATION_BOOTSTRAP
 * ----------------------------------------------------------------------------
 * This module is the staging ground for the primary industrial services. 
 * We dock the database controllers, permission managers, and persistent 
 * store proxies into the Titanium Kernel. 
 *
 * PHILOSOPHY: If this file fails to execute, the server is a paperweight. 
 * Zero tolerance for circular dependencies or uninitialized service pointers.
 */

import { Kernel } from "../core/Kernel.js"
import { RankSystem } from "../systems/social/ranks/RankSystem.js"
import { ChatSystem } from "../systems/social/chat/ChatSystem.js"
import { BanManager } from "../systems/admin/BanManager.js"
import { Database } from "../core/datastore/DatabaseManager.js"
import { EconomyStore } from "../systems/economy/EconomyStore.js"
import { PlayerStore } from "../core/store/PlayerStore.js"
import { WorldStore } from "../core/store/WorldStore.js"
import { RankStore } from "../systems/social/ranks/RankStore.js"
import { StoreKeys } from "../core/store/StoreKeys.js"
import { PermissionManagerInstance } from "../core/permissions/PermissionManager.js"
import { RankFormatter } from "../systems/social/ranks/RankFormatter.js"
import { MuteStore } from "../systems/social/MuteStore.js"
import { CommandRegistry } from "../commands/base/CommandRegistry.js"
import { SignalBus } from "../core/signalbus/SignalBus.js"
import { HomeStore } from "../systems/teleport/HomeStore.js"
import { WarpStore } from "../systems/teleport/WarpStore.js"
import { ChestShopStore } from "../systems/shop/ChestShopStore.js"
import { PlaceholderProvider } from "../systems/placeholders/PlaceholderProvider.js"
import { ClaimStore } from "../systems/protection/ClaimStore.js"
import { FloatingTextStore } from "../systems/floatingtext/FloatingTextStore.js"
import { TPAStore } from "../systems/tpa/TpaStore.js"
import { TpaHandshake } from "../systems/tpa/TpaHandshake.js"
import { TpaService } from "../systems/tpa/TpaService.js"
import { TeleportService } from "../systems/teleport/TeleportService.js"
import { CommandManager } from "../core/commands/CommandManager.js"

let initialized = false

/*
 * SERVICE_DOCKING_SEQUENCE
 * ----------------------------------------------------------------------------
 * Handshakes with the Kernel and registers the master service identifiers. 
 * These IDs are used by the Kernel.get() locator throughout the engine.
 */
export function init() {
    if (initialized) return
    initialized = true

    /* DATA_PERSISTENCE_LAYER */
    Kernel.register("database",    Database)
    Kernel.register("playerStore", PlayerStore)
    Kernel.register("worldStore",  WorldStore)
    Kernel.register("rankStore",   RankStore)
    Kernel.register("keys",        StoreKeys)

    /* ECONOMIC_AND_COMMERCE_LOGIC */
    Kernel.register("economy",     EconomyStore)
    Kernel.register("chestShopStore", ChestShopStore)

    /* SOCIAL_AND_PERMISSIONS_ENGINE */
    Kernel.register("ranks",       RankSystem)
    Kernel.register("chat",        ChatSystem)
    Kernel.register("admin",       BanManager)
    Kernel.register("permissions", PermissionManagerInstance)
    Kernel.register("formatter",   RankFormatter)
    Kernel.register("muteStore",   MuteStore)

    /* COMMAND_ARCHITECTURE_COMPONENTS */
    Kernel.register("commandRegistry", CommandRegistry)
    Kernel.register("commandManager",  CommandManager)

    /* SPATIAL_AND_TELEPORTATION_SERVICES */
    Kernel.register("homeStore",   HomeStore)
    Kernel.register("warpStore",   WarpStore)
    Kernel.register("tpaStore",    TPAStore)
    Kernel.register("tpaHandshake", TpaHandshake)
    Kernel.register("tpaService",  TpaService)
    Kernel.register("teleportService", TeleportService)

    /* PROTECTION_AND_UTILITY_SERVICES */
    Kernel.register("signalBus",   SignalBus)
    Kernel.register("placeholders", PlaceholderProvider)
    Kernel.register("claimStore",  ClaimStore)
    Kernel.register("floatingTextStore", FloatingTextStore)

    /*
     * ASYNC_SERVICE_ORCHESTRATION
     * Some services require a secondary initialization phase to bind 
     * interval-based tasks (Cleanups, Schedulers).
     */
    TpaService.init()
    TeleportService.init()

    /* 
     * LEGACY_COMPATIBILITY_HANDSHAKES
     * Triggering internal init loops for systems that haven't been 
     * fully decoupled from the monolithic model yet.
     */
    RankSystem.init()
    ChatSystem.init()
    BanManager.init()

    console.log("[AethelLib] CORE_FOUNDATION_DOCKED | Total Services: " + Object.keys(Kernel).length);
}
