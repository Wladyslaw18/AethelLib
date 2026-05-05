# AethelLib: The Industrial Backbone

AethelLib is a hard-coded shield for people who want to build things that don't crash the server every time a player joins. It’s a stable foundation that handles the messy data-cleanup so you don't have to.

## 🚀 WHY WASTE TIME?

*   **Don't Reinvent the Wheel**: I spent the sleepless nights making sure the Map lookups don't grow forever and the Database doesn't choke the engine. Just plug in and play. 🛡️
*   **Fork It**: Don't like my logic? Take it. Rip it apart. Make it faster.
*   **Expand It**: The Kernel is a modular dock. You can add your own systems in seconds without touching my core files.
*   **Learn From It**: See how we handle sharding and the Ghost Interpreter. Use it to level up your own scripts. 🧪

## 🏗️ THE ARCHITECTURE

We use the Stable Proxy Pattern. You talk to the Kernel; the Kernel talks to Minecraft. When Minecraft’s API changes (and it will, 😭), you only fix the Kernel. Your game logic stays 100% the same.

## 🛠️ HOW TO USE IT

### 1. Dock Your Logic
Got a custom system? Don't just dump it in main.js. Dock it so it's globally accessible.

```javascript
import { Kernel } from "./core/Kernel.js";

class MyEpicSystem {
    constructor() { this.v = "1.0.0"; }
    doCoolStuff() { /* Logic goes here */ }
}

// Register it once
Kernel.register("epic", new MyEpicSystem());

// Access it anywhere in your pack
const epic = Kernel.get("epic");
epic.doCoolStuff();
```

### 2. Inject Commands
Real commands with auto-complete and namespaces. No more messy chat-listener hacks.

```javascript
import { Kernel } from "./core/Kernel.js";

Kernel.get("commandRegistry").register("ping", {
    name: "ping",
    description: "Check if the heartbeat is alive",
    execute: (player) => player.sendMessage("PONG")
});
```

## 📜 LICENSE (LGPL v3.0)

*   **Your Logic = Private**: Link your own top-secret, closed-source code to AethelLib. Keep your secrets.
*   **The Core = Public**: If you optimize the Kernel or fix a bug in the Database, you MUST share that. Keep the backbone strong for the community. 😤

## 🛡️ THE RULES OF THE FORGE

1.  **Keep it Tiny**: If a file is over 120 lines, refactor it. Keep it readable.
2.  **Zero-Bypass**: Use the Kernel methods. Don't go rogue and call native APIs if a bridge exists.
3.  **Clean Your Trash**: Use the sharded DB. Don't let your data-buffers grow until the Watchdog kills us all.

**AethelLib: Built so you can actually enjoy modding.**
