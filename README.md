# AethelLib:

AethelLib is a hard-coded shield for people who want to build things that don't crash the server every time a player joins. It’s a stable foundation that handles the messy data-cleanup so you don't have to.

## 🚀 WHY WASTE TIME?

- **Don't Reinvent the Wheel**: I spent the sleepless nights making sure the Map lookups don't grow forever and the Database doesn't choke the engine. Just plug in and play. 
- **Fork It**: Don't like my logic? Take it. Rip it apart. Make it faster.
- **Expand It**: The Kernel is a modular dock. You can add your own systems in seconds without touching my core files.
- **Learn From It**: See how we handle sharding and the Ghost Interpreter. Use it to level up your own scripts.

##  THE ARCHITECTURE

We use the Stable Proxy Pattern. You talk to the Kernel; the Kernel talks to Minecraft. When Minecraft’s API changes (and it will), you only fix the Kernel. Your game logic stays 100% the same.

## 🛠️ HOW TO USE IT

### 1. Dock Your Logic

Got a custom system? Don't just dump it in main.js. Dock it so it's globally accessible.

```javascript
import { Kernel } from "./core/Kernel.js";

class MyEpicSystem {
  constructor() {
    this.v = "1.0.0";
  }
  doCoolStuff() {
    /* Logic goes here */
  }
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
  execute: (player) => player.sendMessage("PONG"),
});
```

##  THE PLUGIN PROTOCOL (DON'T TOUCH THE CORE)

You don't want to dock stuff in the main core or kernel files? No issue. Follow the **Industrial Isolation Protocol**:

1.  **Create your Base**: Go to the `scripts/plugins/` folder and create a dedicated folder for your plugin.
2.  **Logic Separation**: Create a loader file (e.g., `MyCustomPlugin.js`) inside your folder. This file should handle all your imports and system registrations, similar to how `main.js` handles the core.
3.  **Unique Signature**: Ensure your plugin name and file names are unique. If you conflict with an existing module, the Kernel might reject your boot-sequence.
4.  **Register the Vector**: Add your plugin's path and a dynamic import to `scripts/plugins/PluginLoader.js`.

By using the plugin system, you ensure that your logic survives AethelLib core updates without you ever having to resolve merge conflicts in the kernel. Keep the core clean, keep the plugins dirty. 🛠️⛓️

## 📜 LICENSE (LGPL v3.0)

- **Your Logic = Private**: Link your own top-secret, closed-source code to AethelLib. Keep your secrets.
- **The Core = Public**: If you optimize the Kernel or fix a bug in the Database, you MUST share that. Keep the backbone strong for the community. 👍

## THE RULES OF THE FORGE

1.  **Keep it Tiny**: If a file is over 120 lines, refactor it. Or don't. I'm a rule, not your dad. (But seriously, your future self will find you and he will be angry).
2.  **Zero-Bypass**: Use the Kernel methods. Going rogue is fun until the engine updates and your script becomes a literal industrial paperweight.
3.  **Clean Your Trash**: Use the sharded DB. If the Watchdog kills the server because your buffers are bloated, I'm not helping you. I warned you.
4.  **The Vibe Check**: If it works, it's "Industrial Peak." If it crashes, it’s an "Advanced Feature Request."
5.  **Pure Command Supremacy**: UI is for the weak. (Actually, it’s just because I suck at building UIs). Stick to the command nexus for true industrial power.

**AethelLib: Built so you can actually enjoy modding (while breaking things).**
