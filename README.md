# AethelLib: The Titanium Framework 🛡️💎

**AethelLib** is a high-performance, modular library for Minecraft Bedrock Dedicated Servers. Built on the **Titanium Kernel** architecture, it provides a stable API proxy that decouples your addon logic from volatile Minecraft Beta API changes.

## 🚀 Why AethelLib?

*   **Titanium Kernel**: A centralized service locator that ensures "one-spot-fix" stability for server updates. 🛡️
*   **Modular Design**: Every system (Economy, TPA, Ranks, etc.) is a standalone module docked into the Kernel.
*   **Performance First**: Uses an optimized `DatabaseManager` with sharding and a `TickScheduler` for high-frequency tasks. 🧪
*   **ESM Compliant**: Fully modernized for the latest Bedrock scripting standards.

## 🏗️ Architectural Overview

AethelLib uses the **Stable API Proxy** pattern. Instead of calling `@minecraft/server` directly in your business logic, you interact with the Kernel and its docked systems. This ensures that when Minecraft changes its API, only the Kernel needs an update—not your entire codebase.

## 🛠️ How to Use (As a Library)

### 1. Docking a Custom System
You can extend AethelLib without modifying the core files:

```javascript
import { Kernel } from "./core/Kernel.js";

class MyCustomSystem {
    constructor() {
        this.version = "1.0.0";
    }
    doSomething() {
        console.log("Doing something cool!");
    }
}

// Register with the Kernel
Kernel.register("mySystem", new MyCustomSystem());

// Access it anywhere
const mySys = Kernel.get("mySystem");
mySys.doSomething();
```

### 2. Adding Custom Commands
AethelLib's `CommandRegistry` makes adding new functionality seamless:

```javascript
import { Kernel } from "./core/Kernel.js";

const MyCommand = {
    name: "ping",
    description: "Check server response",
    execute(data, player, args) {
        player.sendMessage("Pong! 🏓");
    }
};

Kernel.get("commandRegistry").register(MyCommand);
```

## 🍴 Forking & License

AethelLib is licensed under the **LGPL v3.0**. 📜

*   **You CAN**: Fork this repository, use it as a library for your own addons, and modify the source code.
*   **You MUST**: Keep the core library open-source if you distribute modified versions of AethelLib itself.
*   **Linkability**: You can link AethelLib with your own proprietary addons without being forced to open-source your custom game logic (the "Lesser" GPL advantage).

## 🛡️ The Smith Forge Principles
1. **No Spaghetti**: Keep modules under 120 lines.
2. **Kernel First**: Never call volatile APIs directly.
3. **Data Oriented**: Use the sharded database for persistence.

**AethelLib: Built to Survive.** 🛡️💎🚀
