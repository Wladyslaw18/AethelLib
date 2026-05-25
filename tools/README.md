# Aethelgrad Dev Tools

This directory contains the development and build scripting utilities for managing Aethelgrad Essentials.

## 🛠️ Build and Release Tools

### 1. `pack.ps1`
*   **Purpose**: Compiles Behavior Pack and Resource Pack files recursively from the active source-of-truth workspace, compresses them into `.mcpack` archives, and packages them into a local `AethelLib.mcaddon` file at the root of the workspace.
*   **Usage**:
    ```powershell
    powershell -ExecutionPolicy Bypass -File .\tools\pack.ps1
    ```

### 2. `release.ps1`
*   **Purpose**: Auto-bumping release packager. Reads the `manifest.json`, increments the version using a base-10 odometer system, updates version references in all manifest nodes, packages the BP and RP, and saves them to:
    *   `releases/AethelLib_v[version].mcaddon`
    *   `backups/AethelLib_backup_v[version].mcaddon`
    *   `AethelLib.mcaddon` (at workspace root)
*   **Usage**:
    ```powershell
    powershell -ExecutionPolicy Bypass -File .\tools\release.ps1
    ```

### 3. `deploy.ps1`
*   **Purpose**: Syncs behavior pack and resource pack assets directly to your local BDS server's `development_behavior_packs/` and `development_resource_packs/` directories for server-side testing.
*   **Usage**:
    ```powershell
    powershell -ExecutionPolicy Bypass -File .\tools\deploy.ps1
    ```

### 4. `watch.ps1`
*   **Purpose**: Watches behavior pack scripts recursively. When changes are saved, it triggers an instant sync to BDS and restarts the Bedrock Dedicated Server automatically so you don't have to manually quit/restart.
*   **Usage**:
    ```powershell
    powershell -ExecutionPolicy Bypass -File .\tools\watch.ps1
    ```

### 5. `test.ps1`
*   **Purpose**: Shorthand execution wrapper. Deploys updated packs to BDS and launches a clean bedrock dedicated server console window.
*   **Usage**:
    ```powershell
    powershell -ExecutionPolicy Bypass -File .\tools\test.ps1
    ```

---

## 🐍 Unix Edition (macOS & Linux)

Python 3 equivalents for macOS and Linux developers. Zero dependencies.
See **[tools/unix/README.md](./unix/README.md)** for full usage.

---

## 💀 DOS Edition

Batch file equivalents for CMD on Windows. Yes, really. Yes, they work.
See **[tools/dos/README.md](./dos/README.md)** for full usage (and the roast).

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


