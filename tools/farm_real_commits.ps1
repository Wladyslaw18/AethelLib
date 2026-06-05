# staging directory setup
$root = (Get-Item $PSScriptRoot).Parent.FullName
Set-Location $root

function Commit-File {
    param(
        [string]$filePath,
        [string]$message
    )
    if (Test-Path $filePath) {
        git add $filePath
        git commit -m $message
        Write-Host "[SUCCESS] Committed $filePath -> $message" -ForegroundColor Green
    } else {
        Write-Host "[WARN] File not found: $filePath" -ForegroundColor Yellow
    }
}

Write-Host "=== STARTING ATOMIC 30+ COMMIT PIPELINE ===" -ForegroundColor Cyan

# 1. Economy & Money Command
Commit-File "scripts/commands/economy/MoneyCommand.js" "fix(economy): add missing PlayerUtils import to MoneyCommand"

# 2. General Menu Command
Commit-File "scripts/commands/general/MenuCommand.js" "fix(general): add missing Kernel import to MenuCommand"

# 3. Message Command
Commit-File "scripts/commands/general/MessageCommand.js" "fix(general): resolve world object reference via Kernel in MessageCommand"

# 4. Report Command
Commit-File "scripts/commands/general/ReportCommand.js" "refactor(general): optimize ReportCommand parameter count to support Bedrock limits"

# 5. Whois Command
Commit-File "scripts/commands/general/WhoisCommand.js" "fix(general): resolve rank display name and home/claims count in WhoisCommand"

# 6. Color Command
Commit-File "scripts/commands/social/ColorCommand.js" "fix(social): add missing Kernel import and autocomplete parameters to ColorCommand"

# 7. Delete Home Command
Commit-File "scripts/commands/teleport/DelHomeCommand.js" "fix(teleport): add missing Kernel import to DelHomeCommand"

# 8. Set Warp Command
Commit-File "scripts/commands/teleport/SetWarpCommand.js" "fix(teleport): fix warp capacity check using object keys count"

# 9. Command Manager
Commit-File "scripts/core/commands/CommandManager.js" "feat(core): add chatcolor enum suggestions registration"

# 10. Permission Manager
Commit-File "scripts/core/permissions/PermissionManager.js" "fix(permissions): bypass boolean conversion for numeric home limits"

# 11. Bounty Hunter old bootloader
Commit-File "scripts/plugins/BountyHunter/src/boot/bootloader.js" "fix(bounty): add autocomplete parameters to placebounty command"

# 12. Plugin Loader
Commit-File "scripts/plugins/PluginLoader.js" "chore(plugins): disable old BountyHunter plugin from main registry"

# 13. Player Utils
Commit-File "scripts/utils/PlayerUtils.js" "refactor(utils): migrate PlayerUtils to use new isValid boolean property"

# 14. Celebrate Command
Commit-File "scripts/commands/general/CelebrateCommand.js" "feat(general): add thunder sound effect on celebrate start"

# 15. AethelEssentials BountyStore
Commit-File "scripts/plugins/AethelEssentials/src/systems/stores/BountyStore.js" "feat(bounty): create BountyStore for AethelEssentials"

# 16. AethelEssentials BountyListener
Commit-File "scripts/plugins/AethelEssentials/src/systems/listeners/BountyListener.js" "feat(bounty): create BountyListener for auto-bounties and claims"

# 17. AethelEssentials PlaceBountyCommand
Commit-File "scripts/plugins/AethelEssentials/src/commands/economy/PlaceBountyCommand.js" "feat(bounty): create PlaceBountyCommand command file"

# 18. AethelEssentials BountiesCommand
Commit-File "scripts/plugins/AethelEssentials/src/commands/economy/BountiesCommand.js" "feat(bounty): create BountiesCommand listing command file"

# 19. AethelEssentials EconomyRegistry
Commit-File "scripts/plugins/AethelEssentials/src/commands/EconomyRegistry.js" "feat(bounty): create EconomyRegistry command registry"

# 20. AethelEssentials SystemsLoader
Commit-File "scripts/plugins/AethelEssentials/src/loaders/SystemsLoader.js" "feat(bounty): register bounty store and listener in SystemsLoader"

# 21. AethelEssentials index manifest
Commit-File "scripts/plugins/AethelEssentials/index.js" "feat(bounty): register economy command registry and add dependencies"

# 22. Clear Inventory Command
Commit-File "scripts/commands/admin/ClearInventoryCommand.js" "refactor(admin): migrate ClearInventoryCommand to isValid property"

# 23. Feed Command
Commit-File "scripts/commands/admin/FeedCommand.js" "refactor(admin): migrate FeedCommand to isValid property"

# 24. Fly Command
Commit-File "scripts/commands/admin/FlyCommand.js" "refactor(admin): migrate FlyCommand to isValid property"

# 25. God Command
Commit-File "scripts/commands/admin/GodCommand.js" "refactor(admin): migrate GodCommand to isValid property"

# 26. Heal Command
Commit-File "scripts/commands/admin/HealCommand.js" "refactor(admin): migrate HealCommand to isValid property"

# 27. Back Command
Commit-File "scripts/commands/general/BackCommand.js" "refactor(general): migrate BackCommand to isValid property"

# 28. Claim Command
Commit-File "scripts/commands/general/ClaimCommand.js" "refactor(general): migrate ClaimCommand to isValid property"

# 29. Rank Admin Commands
Commit-File "scripts/commands/social/ranks/RankAdminCommands.js" "refactor(social): migrate RankAdminCommands to isValid property"

# 30. Rank Admin Perms UI
Commit-File "scripts/ui/social/ranks/modules/RankAdminPermsUI.js" "refactor(ui): migrate RankAdminPermsUI to isValid property"

# 31. Rank ChestShop Perms UI
Commit-File "scripts/ui/social/ranks/modules/RankChestShopPermsUI.js" "refactor(ui): migrate RankChestShopPermsUI to isValid property"

# 32. Rank Land Perms UI
Commit-File "scripts/ui/social/ranks/modules/RankLandPermsUI.js" "refactor(ui): migrate RankLandPermsUI to isValid property"

# 33. Manifest JSON
Commit-File "manifest.json" "chore(manifest): bump version or format manifest file"

# 34. Catch-all for remaining untracked or modified files (excluding BDS and backups)
git add scripts/commands/admin/PermListCommand.js
git add scripts/commands/admin/PluginReloadCommand.js
git add scripts/commands/admin/SystemDisCommand.js
git add scripts/commands/admin/SystemOnCommand.js
git add scripts/commands/shop/
git add scripts/ui/economy/EconomyUI.js
git add scripts/ui/tpa/
git add scripts/utils/VerificationSuite.js
git add tools/
git add jsconfig.json
git add package.json
git add architecture.md
git add Docs/

git commit -m "chore(build): commit remaining workspace updates and documentation changes"

Write-Host "=== COMPLETED 34 COMMITS ===" -ForegroundColor Green
