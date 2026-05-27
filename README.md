# ⚜&#xFE0E; AethelLib

> *"Built at 3am. Tested in production. Regretted nothing."*

AethelLib is a hard-coded shield for people who want to build things that **don't crash the server every time a player joins.** It's a stable foundation that handles the messy data-cleanup so you don't have to.

I wrote this because I was tired. Tired of Map leaks. Tired of the Database choking the engine at peak load. Tired of Mojang breaking the API every update and watching six months of work become a runtime error.

So I built the last framework I'll ever need for Bedrock. And now it's yours.

---

## ✦&#xFE0E; WHY WASTE TIME?

- **Don't Reinvent the Wheel** — I spent the sleepless nights so you don't have to. The Map lookups don't grow forever. The Database won't choke the engine. The cache evicts itself. Just plug in and play.
- **Fork It** &#x262D; — Don't like my logic? Take it. Rip it apart. Make it faster. I won't cry. (I will cry. Please credit me.)
- **Expand It** — The Kernel is a modular dock. Add your own systems in seconds without touching my core files. The plugin protocol exists specifically so your merge conflicts are *your* problem, not mine.
- **Learn From It** — See how we handle sharding, the Ghost Interpreter, and the 3-phase boot sequence. Use it to level up your own scripts. Or just copy-paste it. I don't judge.

---

## &#x2683;&#xFE0E; WAIT — NEW HERE?

Never written a Bedrock addon before? That's fine. Here's all you need to know:

> Minecraft Bedrock lets you write **JavaScript** to control the game server. Events, players, items, economy — all of it. AethelLib is the toolkit that makes that NOT a nightmare.

**Before you touch anything, you need:**
- A **Minecraft Bedrock Dedicated Server** (BDS) set up and running
- **Node.js** (for tooling and the deploy scripts)
- Basic JavaScript knowledge — if you know what a `class` is, you're fine
- A high tolerance for Mojang breaking things (this is non-negotiable)

Once you have that? Clone the repo, drop it in your server's `behavior_packs` folder, and you're docked.

---

## ☨ THE ARCHITECTURE

We use the **Stable Proxy Pattern.**

```
YOUR CODE  →  Kernel  →  Minecraft API
```

You talk to the Kernel. The Kernel talks to Minecraft. When Minecraft's API changes — *and it will, it always does, I've seen things* — you only fix the Kernel. Your game logic stays 100% the same.

The boot sequence runs in **3 phases** so nothing blows up during startup:

| Phase | File | What happens |
|---|---|---|
| **Phase 0** | `early.js` | Registries only. No heavy deps. No circular imports. |
| **Phase 1** | `core.js` | All services registered into the Kernel. |
| **Phase 2** | `services.js` | Background workers, staggered every 100 ticks to protect TPS. |

Why staggered? Because I learned the hard way what happens when you boot 12 systems simultaneously on server start. The server did not enjoy it. The players did not enjoy it. I did not enjoy it.

---

## &#x262D; HOW TO USE IT

### 1. Dock Your Logic

Got a custom system? **Don't dump it in `main.js`.** I will find you. Dock it so it's globally accessible and doesn't become someone else's circular dependency at 2am.

```javascript
import { Kernel } from "./core/Kernel.js";

class MyEpicSystem {
  constructor() {
    this.version = "1.0.0";
  }

  doCoolStuff() {
    /* your logic here */
  }
}

// Register it once — Kernel holds the reference forever
Kernel.register("epic", new MyEpicSystem());

// Access it from anywhere in your pack. No imports. No coupling.
const epic = Kernel.get("epic");
epic.doCoolStuff();
```

> ⚡︎ `Kernel.get()` returns `null` if the service doesn't exist. Check for it. I'm not responsible for your null pointer exceptions.

### 2. Inject Commands

Real commands with auto-complete and namespaces. No more chat-listener hacks that break every update.

```javascript
import { Kernel } from "./core/Kernel.js";

Kernel.get("commandRegistry").register({
  name: "ping",
  description: "Check if the heartbeat is alive",
  usage: "/ae:ping",
  permission: "essentials.basic",
  category: "utility",
  execute(_data, player, _args) {
    player.sendMessage("PONG");
  }
});
```

Commands auto-register into the Ghost Interpreter, which handles parsing, permission checks, and namespacing. You write the logic. The Kernel handles the rest.

---

## &#x2756; THE PLUGIN PROTOCOL *(Don't Touch The Core)*

You don't want to dock stuff directly in the kernel files? Smart. Follow the **Industrial Isolation Protocol:**

1. **Create Your Base** — Go to `scripts/plugins/` and create a dedicated folder for your plugin.
2. **Separate Your Logic** — Create a loader file (e.g., `MyPlugin.js`) inside your folder. This handles your imports and registrations — same pattern as `main.js` but for your stuff only.
3. **Unique Signature** — Make sure your plugin name is unique. If you conflict with an existing module, the Kernel will reject your boot-sequence. Loudly. In the console. With your name on it.
4. **Register the Vector** — Add a dynamic import for your loader to `scripts/plugins/PluginLoader.js`.

```javascript
// PluginLoader.js — add your line here
await import("./MyPlugin/MyPlugin.js")
```

**Why bother?** Because when AethelLib updates, your plugin survives. Zero merge conflicts in the kernel. Keep the core clean, keep the plugins dirty. &#xFE0E;&#x221E;

---

## &#x2630; LICENSE (LGPL v3.0)

- **Your Logic = Private** — Link your own top-secret, closed-source addon to AethelLib. Keep your secrets. We don't care.
- **The Core = Public** — If you optimize the Kernel or fix a bug in the Database, you **MUST** share that back. The backbone stays strong for everyone.&#x1F592;&#xFE0E;

---

## &#x2699;&#xFE0E; THE RULES OF THE FORGE

These aren't suggestions. They're hard-won lessons written in server crashes and lost player data.

1. **Keep it Tiny** — Files over 120 lines get refactored. Or don't. I'm a rule, not your dad. (But seriously — your future self will find you, and he will be exhausted and angry.)

2. **Zero-Bypass** — Use the Kernel methods. Going rogue is fun until the engine updates and your clever hack becomes a paperweight. The Kernel exists to absorb that pain. Let it.

3. **Clean Your Trash** — Use the sharded DB. Use the cache. If the Watchdog kills the server because your buffers are bloated, I am not helping you. I warned you. It's right here. You're reading it.

4. **The Vibe Check** — If it works, it's *"Industrial Peak."* If it crashes, it's an *"Advanced Feature Request."* There is no in-between.

5. **Pure Command Supremacy** — UI is for the weak. (It's actually because I'm bad at building UIs. But also the commands are cleaner. Both things are true.)

---

**AethelLib: Built so you can actually enjoy modding. While breaking things. While crying a little.**

*— Wladyslaw18, somewhere at 3am, probably*

---

## ✦ HEADLESS COMMAND TESTING

Developers can run and debug script commands directly from the server console/stdin without joining the game.

### 1. Headless Commands
Commands are dispatched using `/scriptevent ae:test_cmd`.

*   **List Warps**: `scriptevent ae:test_cmd listwarp`
*   **Set Warp**: `scriptevent ae:test_cmd setwarp <name>`
*   **Teleport to Warp**: `scriptevent ae:test_cmd warp <name>`
*   **Delete Warp**: `scriptevent ae:test_cmd delwarp <name>`
*   **Calculator**: `scriptevent ae:test_cmd calc <expression>`

### 2. Implementation details
*   **PowerShell Input Redirection**: `watch.ps1` runs a background thread to forward host terminal input directly to BDS.
*   **MockPlayer Object**: Bypasses network connectivity checks by instantiating a mock client satisfying coordinate, dimension, and permission queries.
*   **Stack Tracing**: Errors are trapped and prefixed with `[Scripting] [error]` to ensure they bypass watcher output filters.
