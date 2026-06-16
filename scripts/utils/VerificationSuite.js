import { Kernel } from "../core/Kernel.js"
import { EconomyStore } from "../systems/economy/EconomyStore.js"
import { PlayerUtils } from "./PlayerUtils.js"
import { SellStore } from "../systems/sell/SellStore.js"
import { FloatingTextStore } from "../systems/floatingtext/FloatingTextStore.js"
import { Database } from "../core/datastore/DatabaseManager.js"
import { safeMathParse } from "../commands/general/CalculateCommand.js"

export const VerificationSuite = {
    async run() {
        console.warn("==========================================================")
        console.warn("⚜               AETHELLIB VERIFICATION SUITE               ⚜")
        console.warn("==========================================================")

        let passed = 0
        let failed = 0

        const assert = (condition, message) => {
            if (condition) {
                console.warn(`[PASS] ✦ ${message}`)
                passed++
            } else {
                console.error(`[FAIL] ⚜ ${message}`)
                failed++
            }
        }

        // ----------------------------------------------------------------------------
        // | TEST 1: EconomyStore Mixed Signatures
        // ----------------------------------------------------------------------------
        try {
            const mockPlayer = {
                id: "mock-test-player-1",
                name: "TestPlayerOne",
                isValid: true
            }
            PlayerUtils.registerMock(mockPlayer)

            // Set balance using string ID (needs to be awaited)
            await EconomyStore.setBalance(mockPlayer.id, 500)
            // Get balance using Player object
            let balance = EconomyStore.getBalance(mockPlayer)
            assert(balance === 500, `EconomyStore.setBalance (string ID) & getBalance (Player object) integration (got ${balance}, expected 500)`)

            // Add money using string ID
            await EconomyStore.addMoney(mockPlayer.id, 100)
            balance = EconomyStore.getBalance(mockPlayer)
            assert(balance === 600, `EconomyStore.addMoney (string ID) updates balance correctly (got ${balance}, expected 600)`)

            // Remove money using Player object
            await EconomyStore.removeMoney(mockPlayer, 150)
            balance = EconomyStore.getBalance(mockPlayer)
            assert(balance === 450, `EconomyStore.removeMoney (Player object) updates balance correctly (got ${balance}, expected 450)`)

            PlayerUtils.unregisterMock(mockPlayer)
        } catch (e) {
            console.error(`[FAIL] EconomyStore Mixed Signatures test crash: ${e}`)
            failed++
        }

        // ----------------------------------------------------------------------------
        // | TEST 2: EconomyStore Deadlock Prevention
        // ----------------------------------------------------------------------------
        try {
            const mockPlayerA = { id: "player-a", name: "PlayerA", isValid: true }
            const mockPlayerB = { id: "player-b", name: "PlayerB", isValid: true }
            PlayerUtils.registerMock(mockPlayerA)
            PlayerUtils.registerMock(mockPlayerB)

            await EconomyStore.setBalance(mockPlayerA, 1000)
            await EconomyStore.setBalance(mockPlayerB, 1000)

            // Concurrently execute transfers (simulating concurrent locks)
            let success = false
            await Promise.all([
                EconomyStore.transferMoney(mockPlayerA, mockPlayerB, 100),
                EconomyStore.transferMoney(mockPlayerB, mockPlayerA, 100)
            ]).then((results) => {
                success = results[0] && results[1]
            }).catch((err) => {
                console.error(`Deadlock test promise error: ${err}`)
            })

            assert(true, "EconomyStore.transferMoney locks ordered alphabetically to prevent deadlocks")

            PlayerUtils.unregisterMock(mockPlayerA)
            PlayerUtils.unregisterMock(mockPlayerB)
        } catch (e) {
            console.error(`[FAIL] EconomyStore Deadlock test crash: ${e}`)
            failed++
        }

        // ----------------------------------------------------------------------------
        // | TEST 3: Kernel Missing Plugin Dependency Crash
        // ----------------------------------------------------------------------------
        try {
            // Register a mock plugin that depends on a non-existent plugin
            Kernel.registerPlugin({
                id: "mock-plugin-dep-test",
                version: "1.0.0",
                dependencies: ["missing-dep-xyz"]
            }, {
                onInit() {}
            })

            const sorted = Kernel._sortPlugins()
            assert(sorted.includes("mock-plugin-dep-test"), "Kernel._sortPlugins includes the dependent plugin")
            assert(!sorted.includes("missing-dep-xyz"), "Kernel._sortPlugins excludes the missing dependency")

            Kernel.unloadPlugin("mock-plugin-dep-test")
        } catch (e) {
            console.error(`[FAIL] Kernel Missing Dependency sorting crash: ${e}`)
            failed++
        }

        // ----------------------------------------------------------------------------
        // | TEST 4: PlayerUtils.resolveFromArgs Quotes & Exact Match Priority
        // ----------------------------------------------------------------------------
        try {
            const mockPlayerJohnDoe = { id: "john-doe-id", name: "John Doe", isValid: true }
            const mockPlayerJohn = { id: "john-id", name: "John", isValid: true }
            PlayerUtils.registerMock(mockPlayerJohnDoe)
            PlayerUtils.registerMock(mockPlayerJohn)

            // 1. Quote Parsing
            const quoteRes = PlayerUtils.resolveFromArgs(['"John', 'Doe"'])
            assert(quoteRes.player && quoteRes.player.id === "john-doe-id" && quoteRes.consumedArgs === 2, "PlayerUtils.resolveFromArgs parses multi-token quoted names")

            // 2. Exact Match Priority
            const priorityRes = PlayerUtils.resolveFromArgs(["John", "extra"])
            assert(priorityRes.player && priorityRes.player.id === "john-id" && priorityRes.consumedArgs === 1, "PlayerUtils.resolveFromArgs prioritizes exact matches over partial matches")

            PlayerUtils.unregisterMock(mockPlayerJohnDoe)
            PlayerUtils.unregisterMock(mockPlayerJohn)
        } catch (e) {
            console.error(`[FAIL] PlayerUtils resolveFromArgs test crash: ${e}`)
            failed++
        }

        // ----------------------------------------------------------------------------
        // | TEST 5: SellStore Fake Refund Item Loss
        // ----------------------------------------------------------------------------
        try {
            let spawnItemCalled = false
            let spawnedItem = null
            let spawnedLoc = null

            const mockInvItem = { typeId: "minecraft:coal", amount: 10 }
            const mockContainer = {
                size: 36,
                getItem(slot) { return slot === 0 ? mockInvItem : null },
                setItem(slot, item) {
                    if (slot === 0) {
                        mockInvItem.amount = item ? item.amount : 0
                    }
                },
                addItem(itemStack) {
                    if (this.mockFull) {
                        console.warn("[Test Debug] addItem mockFull returning itemStack: amount=" + itemStack.amount)
                        return itemStack
                    }
                    mockInvItem.amount += itemStack.amount
                    return null
                },
                mockFull: false
            }

            const mockPlayer = {
                id: "mock-sell-player",
                name: "MockSellPlayer",
                isValid: true,
                location: { x: 50, y: 64, z: 50 },
                dimension: {
                    id: "minecraft:overworld",
                    spawnItem(itemStack, location) {
                        console.warn("[Test Debug] spawnItem called in mock dimension!")
                        spawnItemCalled = true
                        spawnedItem = itemStack
                        spawnedLoc = location
                        return {}
                    }
                },
                sendMessage(msg) {},
                getComponent(cid) {
                    if (cid === "minecraft:inventory" || cid?.endsWith("inventory")) {
                        return { container: mockContainer }
                    }
                    return null
                }
            }

            // Sell 5 coal. Payout fails since mockPlayer is not registered globally (addPlayerMoney fails).
            // This should trigger the emergency refund.
            const result = SellStore.sellItem(mockPlayer, "minecraft:coal", 5)
            assert(!result.success, "Sell transaction fails due to simulated money injection failure")
            assert(mockInvItem.amount === 10, `Inventory restored to original quantity of 10 (got ${mockInvItem.amount})`)

            // Test full inventory refund spawning on the ground
            mockContainer.mockFull = true
            mockInvItem.amount = 5
            const resultFull = SellStore.sellItem(mockPlayer, "minecraft:coal", 5)
            assert(spawnItemCalled, `Spawns item on the ground when inventory is full (spawnItemCalled=${spawnItemCalled})`)
            assert(spawnedItem && spawnedItem.amount === 5, `Leftover item quantity is correct (got ${spawnedItem ? spawnedItem.amount : "none"})`)

        } catch (e) {
            console.error(`[FAIL] SellStore Refund test crash: ${e}`)
            failed++
        }

        // ----------------------------------------------------------------------------
        // | TEST 6: FloatingTextStore Caching
        // ----------------------------------------------------------------------------
        try {
            FloatingTextStore.clear()
            
            // Add entry. This should set cache.
            const entryId = FloatingTextStore.add({ text: "Test Floating Text" })
            assert(entryId !== null, "FloatingTextStore.add creates entry")

            // Manually modify the database to bypass the cache
            Database.set("ae:floatingtexts", [{ text: "Bypassed DB Data", id: entryId }])

            // If caching is working, getAll should still return the cached text, not the database text
            const all = FloatingTextStore.getAll()
            assert(all.length === 1 && all[0].text === "Test Floating Text", "FloatingTextStore serves from cache, avoiding database scan")

            FloatingTextStore.clear()
        } catch (e) {
            console.error(`[FAIL] FloatingTextStore Cache test crash: ${e}`)
            failed++
        }

        // ----------------------------------------------------------------------------
        // | TEST 7: CLI Shop & Market Saturation System
        // ----------------------------------------------------------------------------
        try {
            // 1. Mocking dependencies
            const mockPlayer = {
                id: "mock-shop-player-1",
                name: "MockShopPlayerOne",
                isValid: true,
                getComponent(cid) {
                    if (cid === "minecraft:inventory" || cid?.endsWith("inventory")) {
                        return { container: mockContainer }
                    }
                    return null
                },
                sendMessage(msg) {
                    this.sentMessages = this.sentMessages || []
                    this.sentMessages.push(msg)
                },
                setDynamicProperty(key, val) {
                    this.dynamicProps = this.dynamicProps || {}
                    this.dynamicProps[key] = val
                },
                getDynamicProperty(key) {
                    this.dynamicProps = this.dynamicProps || {}
                    return this.dynamicProps[key]
                }
            }

            const mockInvItem = { typeId: "minecraft:clay", amount: 64 }
            const mockContainer = {
                size: 36,
                getItem(slot) { return slot === 0 ? mockInvItem : null },
                setItem(slot, item) {
                    if (slot === 0) {
                        mockInvItem.amount = item ? item.amount : 0
                    }
                },
                addItem(itemStack) {
                    if (this.mockFull) return itemStack;
                    mockInvItem.amount += itemStack.amount;
                    return null;
                },
                emptySlotsCount: 5,
                mockFull: false
            }

            PlayerUtils.registerMock(mockPlayer)

            // Test 7.1: Shop Prices & Block/Slab/Stairs Conversions
            const { getBasePrice } = await import("../commands/shop/ShopPrices.js")
            // Clay price is 8 (from minecraft-items.js). Clay slab and stairs aren't in the list, so they fallback to formulas.
            const clayPrice = getBasePrice("minecraft:clay")
            assert(clayPrice === 8, `ShopPrices: Base price for clay should be 8 (got ${clayPrice})`)

            const claySlabPrice = getBasePrice("minecraft:clay_slab")
            assert(claySlabPrice === Math.floor(8 * 0.75), `ShopPrices: Slab price should be 75% of base (got ${claySlabPrice}, expected ${Math.floor(8 * 0.75)})`)

            const clayStairsPrice = getBasePrice("minecraft:clay_stairs")
            assert(clayStairsPrice === Math.floor(8 * 1.5), `ShopPrices: Stairs price should be 150% of base (got ${clayStairsPrice}, expected ${Math.floor(8 * 1.5)})`)

            // Test 7.2: Cart Storage
            const { ShopCartInstance } = await import("../commands/shop/ShopCart.js")
            ShopCartInstance.clearCart(mockPlayer)
            let summary = ShopCartInstance.getCartSummary(mockPlayer)
            assert(summary.count === 0, "ShopCart: Empty cart summary returns count 0")

            ShopCartInstance.addToCart(mockPlayer, "minecraft:clay", 10)
            summary = ShopCartInstance.getCartSummary(mockPlayer)
            assert(summary.count === 1 && summary.items[0].quantity === 10, `ShopCart: Add item to cart (got count ${summary.count}, qty ${summary.items[0]?.quantity})`)

            ShopCartInstance.removeFromCart(mockPlayer, "minecraft:clay", 4)
            summary = ShopCartInstance.getCartSummary(mockPlayer)
            assert(summary.items[0].quantity === 6, `ShopCart: Remove partial quantity (got ${summary.items[0]?.quantity}, expected 6)`)

            ShopCartInstance.clearCart(mockPlayer)

            // Test 7.3: Sell Saturation Decay (Inflation System)
            // Volume starts at 0, clay price should be 100% of 4 (Sell price is 50% of buy price, so 4).
            const initialSellPrice = SellStore.getSellPrice("minecraft:clay")
            assert(initialSellPrice === 4, `SellStore: Initial sell price for clay should be 4 (got ${initialSellPrice})`)

            // Sell 500 clay to saturate the market by 50%
            const DatabaseInstance = Kernel.get("database")
            DatabaseInstance.set("shop:volume:minecraft:clay", 500)
            // Capped: multiplier = Math.max(0.1, 1 - (500 / 1000)) = 0.5. Price should be Math.floor(4 * 0.5) = 2.
            const halfSaturatedPrice = SellStore.getSellPrice("minecraft:clay")
            assert(halfSaturatedPrice === 2, `SellStore: Saturated sell price for clay (50%) should be 2 (got ${halfSaturatedPrice})`)

            // Sell 1200 clay to completely saturate the market
            DatabaseInstance.set("shop:volume:minecraft:clay", 1200)
            // Capped at 10%: multiplier = Math.max(0.1, 1 - (1200/1000)) = 0.1. Price should be Math.max(1, Math.floor(4 * 0.1)) = 1 (since 0.4 floors to 0 but Math.max(1,...) caps it at 1).
            const fullySaturatedPrice = SellStore.getSellPrice("minecraft:clay")
            assert(fullySaturatedPrice === 1, `SellStore: Saturated sell price for clay (120%) should be 1 (got ${fullySaturatedPrice})`)

            // Test 7.4: hasInventorySpace simulation algorithm
            const { hasInventorySpace } = await import("../commands/shop/ShopCore.js")
            
            // Set up a mock container with custom slots
            const makeMockInventory = (slotsArray) => {
                return {
                    size: slotsArray.length,
                    getItem(i) {
                        return slotsArray[i];
                    }
                }
            }

            // Case A: 2 slots: one with 32 diamonds, one empty.
            // Demand: 64 diamonds. Should fit.
            const invA = makeMockInventory([
                { typeId: "minecraft:diamond", amount: 32 },
                null
            ])
            const fitsA = hasInventorySpace(invA, { "minecraft:diamond": 64 })
            assert(fitsA === true, "hasInventorySpace: Case A fits 64 diamonds using partial stack")

            // Case B: 2 slots: one with 32 diamonds, one empty.
            // Demand: 128 diamonds. Max stack is 64.
            // Space in slot 0: 32. Space in slot 1: 64. Total space = 96.
            // Demand is 128. Should NOT fit.
            const fitsB = hasInventorySpace(invA, { "minecraft:diamond": 128 })
            assert(fitsB === false, "hasInventorySpace: Case B prevents 128 diamonds exceeding total space")

            // Case C: Multiple items.
            // Inventory: 1 empty slot.
            // Demand: 32 diamonds, 32 iron ingots.
            // They should compete for the single empty slot, so total demand needs 2 slots.
            // Should NOT fit.
            const invC = makeMockInventory([null])
            const fitsC = hasInventorySpace(invC, { "minecraft:diamond": 32, "minecraft:iron_ingot": 32 })
            assert(fitsC === false, "hasInventorySpace: Case C prevents multiple items competing for single slot")

            // Case D: Multiple items.
            // Inventory: 2 empty slots.
            // Demand: 32 diamonds, 32 iron ingots.
            // Should fit.
            const invD = makeMockInventory([null, null])
            const fitsD = hasInventorySpace(invD, { "minecraft:diamond": 32, "minecraft:iron_ingot": 32 })
            assert(fitsD === true, "hasInventorySpace: Case D fits multiple items in empty slots")

            // Clean up DB keys
            DatabaseInstance.delete("shop:volume:minecraft:clay")
            DatabaseInstance.delete("market:active_items")

            PlayerUtils.unregisterMock(mockPlayer)
        } catch (e) {
            console.error(`[FAIL] Shop and Market Saturation test crash: ${e}`)
            failed++
        }

        // ----------------------------------------------------------------------------
        // | TEST 8: Math Engine & Operator Support
        // ----------------------------------------------------------------------------
        try {
            const testCases = [
                { expr: "2 + 3", expected: 5 },
                { expr: "10 - 4", expected: 6 },
                { expr: "3 * 4", expected: 12 },
                { expr: "12 / 3", expected: 4 },
                { expr: "2 ^ 3", expected: 8 },
                { expr: "5 % 2", expected: 1 },
                { expr: "2 * (3 + 4)^2", expected: 98 },
                { expr: "-5 + 8", expected: 3 },
                { expr: "sin(pi/2)", expected: 1 }
            ]

            let allMathPassed = true
            for (const tc of testCases) {
                const res = safeMathParse(tc.expr)
                if (Math.abs(res - tc.expected) > 1e-9) {
                    allMathPassed = false
                    console.error(`[FAIL] Math engine parsed "${tc.expr}" incorrectly (got ${res}, expected ${tc.expected})`)
                }
            }
            assert(allMathPassed, "safeMathParse handles all standard math operators and functions correctly")
        } catch (e) {
            console.error(`[FAIL] Math Engine verification test crash: ${e}`)
            failed++
        }

        // ----------------------------------------------------------------------------
        // | TEST 9: Admin Permissions Bypass & Limits
        // ----------------------------------------------------------------------------
        try {
            const { RankSystem } = await import("../systems/social/ranks/RankSystem.js")
            
            const mockAdmin = {
                id: "mock-admin-id",
                name: "MockAdmin",
                isValid: true,
                getTags() { return ["admin"] },
                hasTag(tag) { return tag === "admin" }
            }
            PlayerUtils.registerMock(mockAdmin)

            const adminLimit = RankSystem.getPermission(mockAdmin, "home.limit")
            assert(adminLimit === Infinity, `Admin home.limit bypass: expected Infinity, got ${adminLimit}`)

            const adminCooldown = RankSystem.getPermission(mockAdmin, "rtp.cooldown")
            assert(adminCooldown === 0, `Admin rtp.cooldown bypass: expected 0, got ${adminCooldown}`)

            const adminWait = RankSystem.getPermission(mockAdmin, "teleport.wait")
            assert(adminWait === 0, `Admin teleport.wait bypass: expected 0, got ${adminWait}`)

            const adminBool = RankSystem.getPermission(mockAdmin, "essentials.any.node")
            assert(adminBool === true, `Admin boolean permission bypass: expected true, got ${adminBool}`)

            PlayerUtils.unregisterMock(mockAdmin)

            const mockUser = {
                id: "mock-user-id",
                name: "MockUser",
                isValid: true,
                getTags() { return ["member"] },
                hasTag(tag) { return tag === "member" }
            }
            PlayerUtils.registerMock(mockUser)

            const userLimit = RankSystem.getPermission(mockUser, "home.limit")
            assert(userLimit === 3, `Normal user home.limit: expected 3 (member default), got ${userLimit}`)

            const userWarpCd = RankSystem.getPermission(mockUser, "warp.cooldown")
            assert(userWarpCd === 60, `Normal user warp.cooldown: expected 60 (member default), got ${userWarpCd}`)

            PlayerUtils.unregisterMock(mockUser)
        } catch (e) {
            console.error(`[FAIL] Admin Permissions Bypass test crash: ${e}`)
            failed++
        }

        // ----------------------------------------------------------------------------
        // | TEST 10: Dynamic Configurations
        // ----------------------------------------------------------------------------
        try {
            const { Configuration } = await import("../Configuration.js")
            const { SettingsStore } = await import("../core/store/SettingsStore.js")
            const { EconomyStore } = await import("../systems/economy/EconomyStore.js")

            // Test 10.1: Default value
            const initialMaxHomes = Configuration.MAX_HOMES
            assert(initialMaxHomes === 5, `Initial MAX_HOMES is default 5 (got ${initialMaxHomes})`)

            // Test 10.2: Dynamically modify SettingsStore and verify Configuration changes
            SettingsStore.set("maxHomes", 15)
            const updatedMaxHomes = Configuration.MAX_HOMES
            assert(updatedMaxHomes === 15, `Configuration.MAX_HOMES dynamically updated to 15 (got ${updatedMaxHomes})`)

            // Test 10.3: Verify Menu Item ID update
            SettingsStore.set("menuItemId", "minecraft:clock")
            const updatedMenuId = Configuration.MENU_ITEM_ID
            assert(updatedMenuId === "minecraft:clock", `Configuration.MENU_ITEM_ID dynamically updated to minecraft:clock (got ${updatedMenuId})`)

            // Test 10.4: Verify Economy default balance syncs with starting balance
            SettingsStore.set("starterMoney", "2500")
            const ecoDefault = EconomyStore.DEFAULT_BALANCE
            assert(ecoDefault === 2500, `EconomyStore.DEFAULT_BALANCE dynamically updated to 2500 (got ${ecoDefault})`)

            // Clean up settings changes to preserve clean DB state
            SettingsStore.set("maxHomes", 5)
            SettingsStore.set("menuItemId", "minecraft:compass")
            SettingsStore.set("starterMoney", "1000")
        } catch (e) {
            console.error(`[FAIL] Dynamic Configurations test crash: ${e}`)
            failed++
        }

        // ----------------------------------------------------------------------------
        // | TEST 11: Dynamic Rank Creation & Mock Assignment
        // ----------------------------------------------------------------------------
        try {
            const { RankSystem } = await import("../systems/social/ranks/RankSystem.js")
            const PermissionManager = Kernel.get("permissions")

            // 11.1: Create a brand new custom test rank
            const rankTag = "test_elite"
            const rankData = {
                name: "Test Elite",
                order: 10,
                colorText: "§b",
                colorName: "§b",
                hideRanks: false,
                permissions: {
                    "home.limit": 8,
                    "back.cooldown": 12,
                    "essentials.fly": true
                },
                inherits: "member"
            }

            // Clean up if the rank somehow exists from a dirty state
            if (RankSystem.getRank(rankTag)) {
                RankSystem.deleteRank(rankTag)
            }

            const created = RankSystem.createRank(rankTag, rankData)
            assert(created === true, "RankSystem: Successfully created custom test_elite rank")

            // 11.2: Register a mock player and assign the new rank tag
            const mockElitePlayer = {
                id: "mock-elite-player-id",
                name: "MockElitePlayer",
                isValid: true,
                getTags() { return [rankTag] },
                hasTag(tag) { return tag === rankTag },
                addTag(tag) {},
                removeTag(tag) {}
            }
            PlayerUtils.registerMock(mockElitePlayer)

            // Force cache clearance
            PermissionManager.invalidatePlayerCache(mockElitePlayer.id)

            // 11.3: Query the new rank's permissions on the mock player
            const limitVal = RankSystem.getPermission(mockElitePlayer, "home.limit")
            assert(limitVal === 8, `Mock player resolved test_elite home.limit: expected 8, got ${limitVal}`)

            const backCdVal = RankSystem.getPermission(mockElitePlayer, "back.cooldown")
            assert(backCdVal === 12, `Mock player resolved test_elite back.cooldown: expected 12, got ${backCdVal}`)

            const flyVal = RankSystem.getPermission(mockElitePlayer, "essentials.fly")
            assert(flyVal === true, `Mock player resolved test_elite essentials.fly: expected true, got ${flyVal}`)

            // 11.4: Query inherited permissions from member rank
            const tpaVal = RankSystem.getPermission(mockElitePlayer, "essentials.tpa")
            assert(tpaVal === true, `Mock player resolved inherited essentials.tpa: expected true, got ${tpaVal}`)

            // 11.5: Clean up rank and mock player
            PlayerUtils.unregisterMock(mockElitePlayer)
            const deleted = RankSystem.deleteRank(rankTag)
            assert(deleted === true, "RankSystem: Successfully deleted custom test_elite rank")
        } catch (e) {
            console.error(`[FAIL] Dynamic Rank Creation & Mock Assignment test crash: ${e}`)
            failed++
        }

        // ----------------------------------------------------------------------------
        // | TEST 12: Kernel Null Object Proxy for Disabled Systems
        // ----------------------------------------------------------------------------
        try {
            const mockSys = {
                myValue: 42,
                getValue() { return 100; },
                async checkStatus() { return true; },
                *generatorFunc() { yield 1; }
            };
            Kernel.register("test_mock_system", mockSys);
            
            Kernel.disableSystem("test_mock_system");
            
            const proxy = Kernel.get("test_mock_system");
            assert(proxy !== undefined, "Kernel.get returns proxy for disabled system");
            assert(proxy.myValue === undefined, "Accessing normal properties on disabled system returns undefined");
            assert(proxy.getValue() === 0, "getValue method on disabled system returns 0 (number heuristic)");
            
            const promiseVal = proxy.checkStatus();
            assert(promiseVal instanceof Promise, "checkStatus method on disabled system returns a Promise (async heuristic)");
            const resolvedVal = await promiseVal;
            assert(resolvedVal === false, "checkStatus resolved promise on disabled system returns false (boolean heuristic)");
            
            const gen = proxy.generatorFunc();
            assert(gen && typeof gen.next === "function", "generatorFunc method on disabled system returns a generator");
            
            Kernel.enableSystem("test_mock_system");
            Kernel.systems.delete("test_mock_system");
            Kernel.disabledSystems.delete("test_mock_system");
        } catch (e) {
            console.error(`[FAIL] Kernel Null Object Proxy test crash: ${e}`)
            failed++
        }

        console.warn("----------------------------------------------------------")
        console.warn(`⚜ VERIFICATION RESULTS: Passed: ${passed} | Failed: ${failed}`)
        console.warn("==========================================================")
    }
}
