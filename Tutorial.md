# ⚒ AethelLib — Full Tutorial

> *"You installed it. Now what? This doc. Read this doc."*

This covers everything. Commands, systems, how the Kernel works, how to register your own stuff, how to not break everything. Read it top to bottom once. Skim it every time after that.

---

## ✦ TABLE OF CONTENTS

1. [How Commands Work](#how-commands-work)
2. [Economy](#economy)
3. [Teleportation](#teleportation)
4. [Homes & Warps](#homes--warps)
5. [TPA System](#tpa-system)
6. [Social & Chat](#social--chat)
7. [Ranks & Permissions](#ranks--permissions)
8. [Land Claims](#land-claims)
9. [Admin Tools](#admin-tools)
10. [Utility Commands](#utility-commands)
11. [Building Your Own System](#building-your-own-system)

---

## ☩ HOW COMMANDS WORK

Every command in AethelLib lives under the `ae:` namespace. That means you type `/ae:commandname` — not `/commandname`. This is intentional. It keeps AethelLib commands separate from vanilla Minecraft commands and any other addons you're running.

**The format is always:**
```
/ae:<command> [arguments]
```

Square brackets `[ ]` mean optional. Angle brackets `< >` mean required. If you skip a required argument, the command will tell you the correct usage.

Commands also have **permission nodes** — strings like `essentials.admin` or `essentials.tpa` that control who can run what. If you don't have the permission, the command won't run. How you assign permissions is covered in the [Ranks & Permissions](#ranks--permissions) section.

---

## ✦ ECONOMY

The economy system runs on a persistent in-memory store backed by the sharded database. Balances survive server restarts. Money is real (in the Minecraft sense). Don't lose it.

**Starting balance:** `$1,000` by default. Configurable in the admin panel.

---

### ⊕ Check your balance

```
/ae:money
```

Shows your current balance. That's it. No arguments needed.

---

### ⊕ Check someone else's balance

```
/ae:money <playerName>
```

Works for online players instantly. For offline players, it does a database scan — it'll be slightly slower, but it works. If the name doesn't exist in the records at all, it tells you.

---

### ⊕ Pay another player

```
/ae:pay <playerName> <amount>
```

Transfers money from your account to theirs. A few things to know:

- You can't pay yourself. Tried it. The code stops you.
- You can't pay more than you have. Atomic validation — no partial transfers.
- Minimum and maximum amounts are enforced. Don't try to send `$0` or `$999999999999`.
- The transaction either goes through completely or doesn't happen at all.

```
/ae:pay Wladyslaw18 500
```

---

### ⊕ Withdraw money as banknotes

```
/ae:withdraw <amount>
```

Converts your digital balance into physical banknote items in your inventory. Right-click to redeem them. Useful for trading with players who are offline or for physical shops.

- **Minimum:** $100
- **Maximum:** $1,000,000 per withdrawal
- Banknotes use real denominations: $100, $500, $1,000, $5,000 all the way up to $1,000,000
- If your inventory is full mid-operation, whatever couldn't be converted gets refunded automatically. No money disappears.

```
/ae:withdraw 5000
```

---

### ⊕ Shop

```
/ae:shop
```

Opens the item shop GUI. Browse categories, buy items directly. What's in the shop depends on what your server admin has set up.

---

### ⊕ Sell

```
/ae:sell
```

Opens the sell interface. Hold the item you want to sell, or use the UI to select from your inventory.

---

### ⊕ Auction House

```
/ae:auction
```

Opens the player-to-player auction house. List items for sale, bid on others, let the market figure out the price. Listings expire after a set time — unclaimed items and bids get refunded.

---

## ✦ TELEPORTATION

All teleport commands have a cooldown. The cooldown duration is controlled by your rank's `rtp.cooldown` permission value. Admins can configure this per rank. Combat teleportation is blocked while you're in a fight — yes, it tracks that.

---

### ⊕ Random teleport

```
/ae:rtp [range]
```

Throws you somewhere random in the overworld. The system actually looks for a safe landing spot — non-air, not inside a block, not in lava. It tries a few times before giving up, so if you're on a fully built-up server it might take a moment.

- Default range: 1,000 blocks from spawn
- You can specify a custom range between 100 and 10,000
- Blocked during combat
- Has a cooldown

```
/ae:rtp
/ae:rtp 3000
```

---

### ⊕ Back

```
/ae:back
```

Teleports you to your last location before your most recent teleport. If you used `/ae:rtp` and spawned in a cave, this is your escape. Only stores one location. Use it fast.

---

## ✦ HOMES & WARPS

**Homes** are personal. Only you can set and use them. You get a limited number based on your rank (default: 5).

**Warps** are global. Admins set them, everyone uses them.

---

### ⊕ Set a home

```
/ae:sethome <name>
```

Saves your current position as a named home. Names are case-sensitive. If you're at your base, call it `base`. If you have a farm, call it `farm`. You get the idea.

```
/ae:sethome base
/ae:sethome farm
```

---

### ⊕ Go to a home

```
/ae:home <name>
```

Teleports you to a saved home. Has a cooldown. Blocked during combat.

```
/ae:home base
```

---

### ⊕ List your homes

```
/ae:homes
```

Shows all your saved homes with their coordinates and dimensions. Use this when you forget what you named things, which happens more than you'd expect.

---

### ⊕ Delete a home

```
/ae:delhome <name>
```

Permanently removes a saved home. There's no undo.

```
/ae:delhome farm
```

---

### ⊕ Go to a warp

```
/ae:warp <name>
```

Teleports you to a server-wide warp point. These are set by admins.

```
/ae:warp spawn
/ae:warp market
```

---

### ⊕ List all warps

```
/ae:warps
```

Shows every available warp on the server.

---

### ⊕ Set a warp *(admin)*

```
/ae:setwarp <name>
```

Saves your current position as a global warp point. Requires admin permission.

---

### ⊕ Delete a warp *(admin)*

```
/ae:delwarp <name>
```

Removes a warp point permanently. Requires `essentials.warp.delete` permission.

---

## ✦ TPA SYSTEM

TPA is teleport-by-request. You ask, they accept or deny. No surprise teleportation. Requests expire after 60 seconds if no response. Players can disable incoming TPA requests entirely.

---

### ⊕ Request to teleport TO someone

```
/ae:tpa <playerName>
```

Sends a request to join the target player. They'll get a notification and need to accept with `/ae:tpaccept`. You cannot send a request to yourself. You cannot send requests to players who have TPA disabled.

```
/ae:tpa Wladyslaw18
```

---

### ⊕ Request someone to teleport TO you

```
/ae:tpahere <playerName>
```

Flips it — you're asking them to come to you instead.

```
/ae:tpahere Wladyslaw18
```

---

### ⊕ Accept a TPA request

```
/ae:tpaccept
```

Accepts the most recent incoming TPA request. The teleport happens after a short delay.

---

### ⊕ Deny a TPA request

```
/ae:tpadeny
```

Rejects the incoming request. The requester gets notified.

---

## ✦ SOCIAL & CHAT

---

### ⊕ Private message someone

```
/ae:msg <playerName> <message>
/ae:tell <playerName> <message>
```

Sends a direct message. Only the sender and receiver see it. Messages show a timestamp and direction indicator so both parties know who sent what.

```
/ae:msg Wladyslaw18 hey the base got raided
```

---

### ⊕ Reply to the last message

```
/ae:reply <message>
/ae:r <message>
```

Replies to whoever last messaged you. No need to type their name again. If they go offline between your messages, it'll tell you and won't send the reply into the void.

```
/ae:r what do you mean raided
```

---

### ⊕ Change your chat color

```
/ae:color [colorName]
```

Changes the color of your chat messages. Run it without arguments to open a visual color picker. Or just pass the color name directly.

Available colors depend on your rank permissions — not everyone gets every color.

```
/ae:color gold
/ae:color red
```

---

### ⊕ View online players

```
/ae:playerlist
```

Lists everyone currently on the server with their health status (Healthy / Hurt / Critical) and how long they've been online this session.

---

### ⊕ Report a player or bug

```
/ae:report <playerName|server> <reason>
```

Submits a report to the admin queue. Use `server` as the first argument to report a bug or server issue instead of a player. Reports are stored and visible to admins through the `/ae:reports` panel. You get a confirmation. The admins get a notification.

```
/ae:report PlayerX flying around killing everyone
/ae:report server there's a dupe glitch at the market warp
```

---

## ✦ RANKS & PERMISSIONS

Ranks are controlled via tags. If a player has a tag that matches a registered rank definition, they have that rank. That's it. No complicated database entries — it's just Minecraft tags backed by a definition store.

---

### ⊕ View your rank

```
/ae:rank
```

Shows your active ranks, the formatted prefix that appears in chat, and the specific permissions each rank grants. If you somehow have no rank at all, it auto-assigns `member` and shows you that.

---

### ⊕ Create a rank *(admin)*

```
/ae:createranks <rankTag> <displayName> [color]
```

Creates a new rank definition. `rankTag` is the internal identifier (what goes on the player as a tag). `displayName` is what shows in chat.

```
/ae:createranks vip VIP gold
```

---

### ⊕ Assign a rank *(admin)*

```
/ae:setranks <playerName> <rankTag>
```

Gives a player a rank. Adds the corresponding tag to their entity and flushes the permission cache so it takes effect immediately.

```
/ae:setranks Wladyslaw18 vip
```

---

### ⊕ Remove a rank *(admin)*

```
/ae:removeranks <playerName> <rankTag>
/ae:delrank <playerName> <rankTag>
```

Revokes a rank from a player. Cache is invalidated immediately.

---

### ⊕ Delete a rank definition *(admin)*

```
/ae:deleteranks <rankTag>
/ae:purgerank <rankTag>
```

Completely removes the rank definition AND cascades the tag removal to every online player who had it. This is destructive. Use it carefully.

---

## ✦ LAND CLAIMS

Land claims protect chunks from modification by players who aren't trusted. The default protection radius is 1 chunk. You can trust specific players to bypass your protection.

---

### ⊕ Claim land

```
/ae:claim
```

Claims the chunk you're standing in. Opens a UI if you run it without sub-commands.

---

### ⊕ Trust a player on your land

```
/ae:claim trust <playerName>
```

Gives another player permission to build on your claimed land.

---

### ⊕ Untrust a player

```
/ae:claim untrust <playerName>
```

Revokes their access. Changes take effect immediately.

---

### ⊕ Remove your claim

```
/ae:claim remove
```

Unclaims the current chunk. Anyone can build there again.

---

## ✦ ADMIN TOOLS

Everything here requires admin permissions. If you're not an admin, these commands won't run. The hierarchy check is strict — you cannot moderate someone with more permissions than you.

---

### ⊕ Open the admin panel

```
/ae:adminpanel
/ae:ap
/ae:admin
/ae:panel
```

Opens the full GUI admin dashboard. From here you can manage players, adjust economy settings, view bans, and configure server-wide settings — all without typing commands.

The panel shows real-time server stats: online player count, uptime, and TPS (currently hardcoded to 20 until a live monitor is added).

---

### ⊕ Ban a player

```
/ae:ban <playerName> [duration] [reason]
```

Permanently or temporarily bans a player. If no duration is given, the ban is permanent. Duration format: `1h`, `1d`, `1w`.

The ban is written to the database immediately. The player is kicked. Other online admins with `essentials.admin.notify` permission get a broadcast.

```
/ae:ban griefPlayer permanent Destroying spawn
/ae:ban ruleBreaker 7d Repeated spamming
```

---

### ⊕ Temporary ban

```
/ae:tempban <playerName> <duration> [reason]
```

Same as ban but explicitly temporary. Duration is required here.

```
/ae:tempban ruleBreaker 24h Spamming
```

---

### ⊕ Unban a player

```
/ae:unban <playerName>
```

Removes the ban record from the database. Use the exact name they were banned under. Case-insensitive search. Other admins get notified.

```
/ae:unban griefPlayer
```

---

### ⊕ Kick a player

```
/ae:kick <playerName> [reason]
```

Immediately disconnects a player. No database record — this is not a ban. They can rejoin.

---

### ⊕ Mute a player

```
/ae:mute <playerName> <duration>
```

Prevents a player from using chat. Duration format: `10m`, `1h`, `permanent`.

---

### ⊕ Unmute a player

```
/ae:unmute <playerName>
```

Restores their chat access. They must be online.

---

### ⊕ View and manage reports

```
/ae:reports
```

Opens the report management panel. See all submitted reports, read the details, and mark them as resolved. Requires `essentials.admin.reports`.

---

### ⊕ Server settings *(in the admin panel)*

The settings panel inside `/ae:adminpanel` lets you toggle individual systems on and off without touching the code. Things you can configure from there:

- Starting money and maximum balance
- Command prefix
- Which systems are active: money, homes, TPA, warps, back, RTP, shop, sell, auction, withdraw, messaging, combat tracking, land claims
- Whether ranks show in chat and on name tags
- Whether mob kill money rewards show in chat
- Random teleport range
- Server info message
- Join message

Changes apply immediately. No restart needed.

---

## ✦ UTILITY COMMANDS

### ⊕ Calculator

```
/ae:calculate <expression>
/ae:calc <expression>
```

Evaluates a math expression in chat. Uses a proper parser — it handles operator precedence, parentheses, and will yell at you for dividing by zero. Safe — it won't run arbitrary code.

```
/ae:calculate 2 + 3 * (4 / 2)
/ae:calc 100000 * 1.15
```

---

## ☩ BUILDING YOUR OWN SYSTEM

This is where it gets interesting. You don't have to touch the core files at all. Everything you build goes in `scripts/plugins/`.

---

### ✦ Step 1 — Create your folder

```
scripts/
  plugins/
    MyPlugin/
      MyPlugin.js      ← your loader
      MySystem.js      ← your logic
```

---

### ✦ Step 2 — Write your system

```javascript
// MySystem.js
export class MySystem {
    constructor() {
        this.version = "1.0.0"
        this.data = new Map()
    }

    doSomething(player) {
        this.data.set(player.id, Date.now())
        player.sendMessage("Done.")
    }
}
```

---

### ✦ Step 3 — Write your loader

```javascript
// MyPlugin.js
import { Kernel } from "../../core/Kernel.js"
import { MySystem } from "./MySystem.js"

export function onBoot() {
    Kernel.register("mySystem", new MySystem())
    console.log("[MyPlugin] Loaded.")
}
```

---

### ✦ Step 4 — Register in PluginLoader

```javascript
// scripts/plugins/PluginLoader.js — add this line
await import("./MyPlugin/MyPlugin.js")
```

That's it. Your system is now globally accessible from anywhere in the codebase via `Kernel.get("mySystem")`. No imports, no circular dependencies, no praying.

---

### ✦ Adding a command to your plugin

```javascript
// MyPlugin.js
import { Kernel } from "../../core/Kernel.js"
import { MySystem } from "./MySystem.js"

export function onBoot() {
    Kernel.register("mySystem", new MySystem())

    // register a command
    const CommandRegistry = Kernel.get("commandRegistry")
    CommandRegistry.register({
        name: "dosomething",
        description: "Does the thing",
        usage: "/ae:dosomething",
        permission: "myplugin.use",
        category: "utility",
        execute(_data, player, _args) {
            const sys = Kernel.get("mySystem")
            if (!sys) return  // always null-check
            sys.doSomething(player)
        }
    })

    console.log("[MyPlugin] Loaded.")
}
```

---

### ✦ A few things that will save you pain

**Always null-check `Kernel.get()`.**
If a service isn't registered yet when you call it, you get `null`. The Kernel doesn't throw. It returns `null` and lets you figure it out. Check for it.

```javascript
const sys = Kernel.get("mySystem")
if (!sys) {
    player.sendMessage("System not available.")
    return
}
```

**Don't register in `main.js`.** Your stuff lives in your plugin loader. That's the whole point of the plugin system. The core files are not yours to touch.

**Keep files under 120 lines.** Split things into smaller files if they grow. It's not optional — it's in the Rules of the Forge. The compiler doesn't enforce it but your future self will be upset.

**Use the sharded database for persistence.** Don't store data in plain `Map` objects if you need it to survive server restarts. Use `Kernel.get("database")` for world-level data or `Kernel.get("playerStore")` for per-player data.

```javascript
// Persist something to the world store
const db = Kernel.get("database")
db.set("myplugin:someKey", { value: 42 })

// Read it back
const stored = db.get("myplugin:someKey")
```

---

**AethelLib: The framework that survives Mojang. Mostly.**

*— Wladyslaw18*
