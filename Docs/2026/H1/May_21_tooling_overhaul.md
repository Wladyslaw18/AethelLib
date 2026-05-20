# ⚜︎ AethelLib Tooling Overhaul & Cross-Platform Infrastructure — 5/21/26

---

### ✦ Added

* **- `tools/` Build Suite** Dedicated directory for all development, build, and release scripts — fully separated from addon source.

* **- `tools/unix/` (macOS & Linux)** Pure Python 3 scripts (`pack.py`, `release.py`, `deploy.py`) with zero external dependencies and ANSI color banners. Completes macOS and Linux support.

* **- `tools/dos/` (CMD)** Batch file equivalents (`pack.bat`, `release.bat`, `deploy.bat`) for Windows Command Prompt. Completes the OS Trinity: PowerShell / Python / Batch.

* **- Interactive Confirmation Banners** All scripts display a color-coded operation summary at launch. `[ENTER]` to proceed, `[Ctrl+C]` to abort.

* **- Auto-Release Odometer Engine** Base-10 version incrementer across all release scripts. Reads `manifest.json`, rolls patch → minor → major, and writes the updated version to the header and all module nodes atomically.

* **- Ship Payload Output Versioning** Shipment scripts now read the active version from `manifest.json` and output versioned files (`AethelLib(1.0.x).txt`) instead of static filenames.

---

### ✦ Fixed

* **- Critical: Kernel Import Failure — `ReferenceError: Import [core/Kernel.js] not found`** Addon booted correctly on BDS but failed on live World install via `.mcaddon`. The Bedrock UWP client resolves imports relative to the `scripts/` root, not the calling file. Bare paths (`core/Kernel.js`) worked on BDS but were rejected by the UWP runtime. Rewrote all cross-module imports to use explicit relative prefixes (`./`, `../`). Addon now loads without errors in both BDS and World environments.

* **- `.mcaddon` Import Failure (ZIP64)** Minecraft rejected archives built by `Compress-Archive` (PowerShell) and default `zipfile` (Python) due to ZIP64 extensions. Replaced with `ZipFile.CreateFromDirectory` + `ZipArchive` (PowerShell/Batch) and `allowZip64=False` (Python), producing standard ZIP 2.0 output matching 7-zip.

* **- `manifest.json` Pyramid Formatting** `ConvertTo-Json` and `json.dump` produced deep-indented pyramid output on every release run. Replaced with static clean template strings across all release scripts on all platforms. Format is now permanent and consistent.

---

### ✦ Changed

* **- `tools/linux/` → `tools/unix/`** Renamed to reflect that the Python suite is compatible with both macOS and Linux, not Linux-only.

* **- Private Script Gitignore Lockdown** `msg_filter.ps1`, `purge_history.ps1`, and all `ship_*.ps1` scripts excluded from Git tracking. Build tools remain fully public on GitHub.

* **- `tools/README.md` Public Cleanup** Removed all references to private tooling. Added cross-reference links to `unix/` and `dos/` sub-READMEs.
