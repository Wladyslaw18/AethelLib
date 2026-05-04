# Aethelgrad Essentials - Instant Deployment Script
# Syncs the current Behavior Pack to the BDS development folder.

$PackName = "Aethelgrad Essentials (BP)"
$SourcePath = Join-Path $PSScriptRoot $PackName
$DestPath = Join-Path $PSScriptRoot "BDS\development_behavior_packs\$PackName"

Write-Host "[Aethelgrad] Syncing Pack to BDS..." -ForegroundColor Blue

if (Test-Path $DestPath) {
    Remove-Item -Path $DestPath -Recurse -Force
}

Copy-Item -Path $SourcePath -Destination $DestPath -Recurse -Force

Write-Host "[Aethelgrad] Pack deployed to development_behavior_packs!" -ForegroundColor Green
