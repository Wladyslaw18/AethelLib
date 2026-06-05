# AethelLib - 30-Commit Farm Script
# Stages and commits all changes from the May 21 session in logical atomic units.

$root = (Get-Item $PSScriptRoot).Parent.FullName
Set-Location $root

function Commit {
    param([string]$msg)
    git commit -m $msg
    Write-Host "`n[COMMITTED] $msg`n" -ForegroundColor Green
}

Write-Host "=== AETHELGRAD COMMIT FARMER ===" -ForegroundColor Cyan

# ── 1. Fix: CommandHandler.js imports
git add scripts/commands/base/CommandHandler.js
Commit "fix(commands): switch CommandHandler.js to explicit relative import paths"

# ── 2. Fix: CommandRegistry.js imports
git add scripts/commands/base/CommandRegistry.js
Commit "fix(commands): switch CommandRegistry.js to explicit relative import paths"

# ── 3. Fix: RankAdminCommands.js imports
git add scripts/commands/social/ranks/RankAdminCommands.js
Commit "fix(commands): switch RankAdminCommands.js to explicit relative import paths"

# ── 4. Fix: CommandManager.js imports
git add scripts/core/commands/CommandManager.js
Commit "fix(core): switch CommandManager.js to explicit relative import paths"

# ── 5. Fix: DatabaseManager.js imports
git add scripts/core/datastore/DatabaseManager.js
Commit "fix(core): switch DatabaseManager.js to explicit relative import paths"

# ── 6. Fix: ChatSystem.js imports
git add scripts/systems/social/chat/ChatSystem.js
Commit "fix(systems): switch ChatSystem.js to explicit relative import paths"

# ── 7. Fix: TpaHandshake.js imports
git add scripts/systems/tpa/TpaHandshake.js
Commit "fix(systems): switch TpaHandshake.js to explicit relative import paths"

# ── 8. Fix: TpaService.js imports
git add scripts/systems/tpa/TpaService.js
Commit "fix(systems): switch TpaService.js to explicit relative import paths"

# ── 9. Fix: BountyHunter/index.js imports
git add scripts/plugins/BountyHunter/index.js
Commit "fix(plugins): switch BountyHunter/index.js to explicit relative import paths"

# ── 10. Fix: CoreEconomy/index.js imports
git add scripts/plugins/CoreEconomy/index.js
Commit "fix(plugins): switch CoreEconomy/index.js to explicit relative import paths"

# ── 11. Fix: manifest.json formatting
git add manifest.json
Commit "fix(manifest): reformat to standard 4-space indentation with inlined version arrays"

# ── 12. Chore: .gitignore
git add .gitignore
Commit "chore: update .gitignore - whitelist tools/, lockdown private scripts and shipment dumps"

# ── 13. Feat: tools/pack.ps1
git add tools/pack.ps1
Commit "feat(tools): add pack.ps1 - interactive addon packager using standard ZIP 2.0"

# ── 14. Feat: tools/release.ps1
git add tools/release.ps1
Commit "feat(tools): add release.ps1 - auto-release engine with base-10 odometer versioning"

# ── 15. Feat: tools/deploy.ps1
git add tools/deploy.ps1
Commit "feat(tools): add deploy.ps1 - dual-sync BP and RP deployer for local BDS"

# ── 16. Feat: tools/watch.ps1
git add tools/watch.ps1
Commit "feat(tools): add watch.ps1 - hot-reload file watcher for BDS development loop"

# ── 17. Feat: tools/test.ps1
git add tools/test.ps1
Commit "feat(tools): add test.ps1 - BDS test launcher shorthand"

# ── 18. Docs: tools/README.md
git add tools/README.md
Commit "docs(tools): add tools/README.md with cross-platform build suite documentation"

# ── 19. Feat: tools/unix/pack.py
git add "tools/unix/pack.py"
Commit "feat(tools/unix): add pack.py - Python addon packager for macOS and Linux"

# ── 20. Feat: tools/unix/release.py
git add "tools/unix/release.py"
Commit "feat(tools/unix): add release.py - Python auto-release engine for macOS and Linux"

# ── 21. Feat: tools/unix/deploy.py
git add "tools/unix/deploy.py"
Commit "feat(tools/unix): add deploy.py - Python BDS deployer for macOS and Linux"

# ── 22. Docs: tools/unix/README.md
git add "tools/unix/README.md"
Commit "docs(tools/unix): add unix/README.md with macOS and Linux usage documentation"

# ── 23. Feat: tools/dos/pack.bat
git add "tools/dos/pack.bat"
Commit "feat(tools/dos): add pack.bat - CMD batch addon packager"

# ── 24. Feat: tools/dos/release.bat
git add "tools/dos/release.bat"
Commit "feat(tools/dos): add release.bat - CMD batch auto-release engine"

# ── 25. Feat: tools/dos/deploy.bat
git add "tools/dos/deploy.bat"
Commit "feat(tools/dos): add deploy.bat - CMD batch BDS deployer"

# ── 26. Docs: tools/dos/README.md
git add "tools/dos/README.md"
Commit "docs(tools/dos): add dos/README.md with roast documentation and OS Trinity notes"

# ── 27. Feat: BountyHunter src scaffold
git add "scripts/plugins/BountyHunter/src/"
Commit "feat(plugins): add BountyHunter src/ scaffold - EconomyBridge, BountyData, BountySystem, bootloader"

# ── 28. Docs: May 19 hotfix
git add "Docs/2026/H1/May_19_hotfix.md"
Commit "docs: add May_19_hotfix.md - v1.0.2 system upgrades and hardening changelog"

# ── 29. Docs: May 20 hotfix
git add "Docs/2026/H1/May_20_hotfix.md"
Commit "docs: add May_20_hotfix.md - v1.0.3 plugin system and command fixes changelog"

# ── 30. Docs: May 21 tooling overhaul
git add "Docs/2026/H1/May_21_tooling_overhaul.md"
Commit "docs: add May_21_tooling_overhaul.md - cross-platform build suite and Kernel fix changelog"

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "   30 COMMITS DONE. PUSHING TO ORIGIN..." -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

git push origin main

Write-Host "==========================================" -ForegroundColor Green
Write-Host "   ALL DONE. GITHUB IS LIVE." -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Green
