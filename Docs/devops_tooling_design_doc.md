# 🛠️ AGE OF STEEL - DEVOPS TOOLING DESIGN SYSTEM

This design document outlines the specifications for porting, expanding, and implementing the Aethelgrad devops pipeline directly into a C# game engine project (**Age of Steel**). It supports dual-platform automation (Windows PowerShell/DOS & Unix Bash/Python), auto-compilation, multi-scoped LLM codebase packing, and odometer semantic versioning.

---

## 📂 DevOps Tooling Directory Structure

```
Age Of Steel/
├── tools/
│   ├── Output/                       # Generated LLM text bundles and builds
│   ├── config/
│   │   ├── engine_path.txt           # Cached path to game engine binary
│   │   └── llm_header.txt            # System prompt and Mega Manifesto rules
│   │
│   # ── WINDOWS AUTOMATION ──────────────────────────────────────────
│   ├── pack.ps1                      # Builds C# DLLs and packages Game Assets
│   ├── watch.ps1                     # File watcher + hot compiler trigger
│   ├── dump_codebase.ps1             # Multi-scope codebase packager for LLM feeds
│   ├── release.ps1                   # Runs odometer version bump + manifest update
│   │
│   # ── UNIX AUTOMATION (macOS & Linux) ──────────────────────────────
│   ├── unix/
│   │   ├── pack.sh                   # Bash build script running dotnet publish/build
│   │   ├── watch.py                  # Python-based FileSystemWatcher running dotnet build
│   │   ├── dump_codebase.py          # Python script mirroring multi-scope code packing
│   │   └── release.py                # Python script mirroring odometer version bumps
│   │
│   # ── LEGACY CMD AUTOMATION ────────────────────────────────────────
│   └── dos/
│       ├── pack.bat                  # CMD wrapper for pack.ps1
│       └── dump.bat                  # CMD wrapper for codebase packing
```

---

## 🛠️ Tool Specifications & Logic Flow

### 1. The Multi-Scope LLM Codebase Packer (`dump_codebase.ps1` & `dump_codebase.py`)
This tool packages the codebase into a single formatted text file. It must allow scoping to limit the dump size when the user is only editing a specific system (e.g. `Systems`, `Core`, `AI`).

#### Windows PowerShell Arguments:
```powershell
# Usage:
# .\tools\dump_codebase.ps1 -Scope Full
# .\tools\dump_codebase.ps1 -Scope Systems
# .\tools\dump_codebase.ps1 -Scope Core
# .\tools\dump_codebase.ps1 -Scope AI
param(
    [ValidateSet("Full", "Systems", "Core", "AI")]
    [string]$Scope = "Full"
)
```

#### Selection Mapping:
*   **`Full`**: Scans the entire project (excl. `bin/`, `obj/`, `.git/`, `.vs/`, `tools/Output/`).
    *   File naming: `AgeOfSteel_Full_v<Version>_<Timestamp>.txt`
*   **`Systems`**: Only scans the `Systems/` directory.
    *   File naming: `AgeOfSteel_Systems_v<Version>_<Timestamp>.txt`
*   **`Core`**: Only scans the `Core/` directory.
    *   File naming: `AgeOfSteel_Core_v<Version>_<Timestamp>.txt`
*   **`AI`**: Only scans AI files in `Systems/` (files matching `AiDirector.cs`, `AiEconomist.cs`, `AiStrategist.cs`, `AiTactician.cs`).
    *   File naming: `AgeOfSteel_AI_v<Version>_<Timestamp>.txt`

#### Interactive Confirmation Flow (PowerShell & Python):
1.  Clear host.
2.  Display active scope and files detected.
3.  Read the active version number from the configuration manifest (`manifest.json` or `engine.toml`).
4.  Print target file name.
5.  Prompt: `Press [ENTER] to confirm dump creation | [Ctrl+C] to reject`.

---

### 2. Odometer Manifest Version Updater (`release.ps1` & `release.py`)
This script automates version updates using a strict base-10 odometer system to increment version numbers in files such as `manifest.json` or `AssemblyInfo.cs`.

#### Version Form:
*   `[Major, Minor, Patch]` (e.g., `1.0.0`)

#### Bumping Math:
```
if Patch < 9:
    Patch = Patch + 1
else if Minor < 9:
    Patch = 0
    Minor = Minor + 1
else:
    Patch = 0
    Minor = 0
    Major = Major + 1
```

#### Execution:
1.  Read current version array from JSON/TOML manifest.
2.  Display current version.
3.  Ask user: `Bump version? [Y/n]`. (Pressing Enter defaults to Yes).
4.  Apply odometer mathematics:
    *   `1.0.0` -> `1.0.1` -> ... -> `1.0.9` -> `1.1.0`
    *   `1.9.9` -> `2.0.0`
5.  Update version nodes recursively across all manifests and config files.
6.  Save changes.

---

### 3. File Watcher & Auto-Compiler (`watch.ps1` & `watch.py`)
Monitors the codebase recursively, building DLLs on change.

*   **Mechanism**: Monitors `*.cs` and `*.toml` files.
*   **Unix Watcher**: Uses Python's `watchdog` library or standard polling checks if `watchdog` is not installed, triggering `dotnet build` or `mcs`.
*   **Debounce Cooldown**: Wait `800ms` after a file change event before triggering a compilation pass to group multi-file saves into a single build.
*   **Automatic Server Restarters**: If running a dedicated server build, it kills running instances and reboots them on compile success.

---

### 4. Unix Equivalent Commands (Python / Bash)
To maintain zero-dependency execution on Unix platforms (macOS/Linux):
*   Python 3 is used for processing heavy directory walking and regex matching (doing version bumps and code dumps).
*   Bash is used for process handling and CLI wrapper execution.

---

## 🎨 Walkthrough: How the LLM Should Write the Scripts

1. **Step 1: dump_codebase.ps1 skeleton**
   ```powershell
   $Version = Get-VersionFromManifest
   $TargetFile = "AgeOfSteel_$Scope`_v$Version`_$Timestamp.txt"

   Write-Host "Ready to dump $Scope directory to $TargetFile"
   Write-Host "Press [ENTER] to execute | [Ctrl+C] to reject"
   Read-Host | Out-Null

   $Files = Get-FilesByScope $Scope
   $Header = Get-Content "tools/config/llm_header.txt"
   $Header | Out-File $TargetFile -Encoding utf8
   foreach ($f in $Files) {
       Append-FileContent $f $TargetFile
   }
   ```

2. **Step 2: release.py version bumper skeleton**
   ```python
   def bump_version(major, minor, patch):
       if patch < 9:
           patch += 1
       elif minor < 9:
           patch = 0
           minor += 1
       else:
           patch = 0
           minor = 0
           major += 1
       return major, minor, patch
   ```

3. **Step 3: unix/pack.sh script**
   ```bash
   echo "=== AGE OF STEEL COMPILER (UNIX) ==="
   echo "Press [ENTER] to build | [Ctrl+C] to cancel"
   read -r
   dotnet build --configuration Debug
   ```

> [!NOTE]
> Ensure that standard output streams on Unix scripts use UTF-8 without BOM to preserve compatibility with standard Unix utilities (like `grep` or `cat`).

> [!IMPORTANT]
> The Python file watcher in `unix/watch.py` should implement a fallback loop using simple file stat timestamps in case the developer runs the tool inside an environment where Python's `watchdog` package is missing.
