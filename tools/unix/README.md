# Aethelgrad Dev Tools - Unix Edition (macOS & Linux)

This directory contains pure Python 3 equivalents of the PowerShell scripting tools, designed to run flawlessly on both **macOS (Darwin)** and **Linux** systems.

Together with Windows (PowerShell), they complete the **OS Trinity** of compatibility!

All scripts use the Python 3 standard library and have **zero external dependencies** (no `pip install` required!).

## 🚀 Interactive Scripts

### 1. `pack.py`
*   **Purpose**: Gathers the Behavior Pack and Resource Pack files recursively, creates compressed `.mcpack` files, and packages them into a clean, unified `AethelLib.mcaddon` file at the root of your workspace.
*   **Usage**:
    ```bash
    python3 tools/unix/pack.py
    ```

### 2. `release.py`
*   **Purpose**: Auto-release and odometer version bumping system. Increments the version inside your `manifest.json`, updates module version dependencies, builds the packages, and places them in:
    *   `releases/AethelLib_v[version].mcaddon`
    *   `backups/AethelLib_backup_v[version].mcaddon`
    *   `AethelLib.mcaddon` (at the root of your workspace)
*   **Usage**:
    ```bash
    python3 tools/unix/release.py
    ```

### 3. `deploy.py`
*   **Purpose**: Directly syncs behavior and resource packs to your local BDS development directories for immediate server-side testing.
*   **Usage**:
    ```bash
    python3 tools/unix/deploy.py
    ```

## ⚙️ Permissions
Before running the scripts on macOS or Linux, mark them as executable in your terminal:
```bash
chmod +x tools/unix/*.py
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
