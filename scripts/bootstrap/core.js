/**
 * Core Bootstrap - Initialize core systems
 * ONE job: permissions, store, signalbus
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
import { CommandHandler } from "../commands/base/CommandHandler.js"

let initialized = false

export function init() {
    if (initialized) return
    initialized = true

    // --- TITANIUM KERNEL REGISTRATION ---
    Kernel.register("database",    Database)
    Kernel.register("playerStore", PlayerStore)
    Kernel.register("worldStore",  WorldStore)
    Kernel.register("rankStore",   RankStore)
    Kernel.register("economy",     EconomyStore)
    Kernel.register("ranks",       RankSystem)
    Kernel.register("chat",        ChatSystem)
    Kernel.register("admin",       BanManager)
    Kernel.register("keys",        StoreKeys)
    Kernel.register("permissions", PermissionManagerInstance)
    Kernel.register("formatter",   RankFormatter)
    Kernel.register("muteStore",   MuteStore)
    Kernel.register("commandRegistry", CommandRegistry)
    Kernel.register("commandHandler",  CommandHandler)

    // Legacy init calls (if systems still require internal setup)
    RankSystem.init()
    ChatSystem.init()
    BanManager.init()

    console.log("§2[AethelLib] Core systems docked and initialized")
}

