# Aethelgrad Essentials - Dual-Sync Deployment Script
# Syncs both Behavior and Resource packs to the BDS development folders.

Clear-Host
Write-Host "==========================================================" -ForegroundColor Yellow
Write-Host "              AETHELGRAD DUAL-DEPLOYER                    " -ForegroundColor White
Write-Host "==========================================================" -ForegroundColor Yellow
Write-Host "  This script will:" -ForegroundColor Gray
Write-Host "  1. Sync Behavior Pack files directly into local BDS development folders." -ForegroundColor White
Write-Host "  2. Sync Resource Pack files directly into local BDS development folders." -ForegroundColor White
Write-Host "----------------------------------------------------------" -ForegroundColor DarkGray
Write-Host "  Press [ENTER] to execute deployment | [Ctrl+C] to cancel" -ForegroundColor Yellow
Write-Host "==========================================================" -ForegroundColor Yellow
Read-Host | Out-Null

$BP_Name = "Aethelgrad Essentials"
$RP_Name = "AethelLib (RP)"
$PSScriptDir = $PSScriptRoot
$ProjectRoot = (Get-Item $PSScriptDir).Parent.FullName
$SourcePath = $ProjectRoot
$BDS_Path = Join-Path $ProjectRoot "BDS"

$BP_Dest = Join-Path $BDS_Path "development_behavior_packs\$BP_Name"
$RP_Dest = Join-Path $BDS_Path "development_resource_packs\$RP_Name"

Write-Host "[Aethelgrad] Syncing BP to BDS..." -ForegroundColor Blue
if (Test-Path $BP_Dest) { Remove-Item -Path $BP_Dest -Recurse -Force }
New-Item -ItemType Directory -Path $BP_Dest -Force

$BP_Files = @("manifest.json", "pack_icon.png", "scripts", "entities")
foreach ($Item in $BP_Files) {
    $Source = Join-Path $SourcePath $Item
    if (Test-Path $Source) { Copy-Item -Path $Source -Destination $BP_Dest -Recurse -Force }
}

Write-Host "[Aethelgrad] Syncing RP to BDS..." -ForegroundColor Blue
if (Test-Path $RP_Dest) { Remove-Item -Path $RP_Dest -Recurse -Force }
New-Item -ItemType Directory -Path $RP_Dest -Force

$RP_Source = Join-Path $SourcePath $RP_Name
if (Test-Path $RP_Source) {
    Copy-Item -Path "$RP_Source\*" -Destination $RP_Dest -Recurse -Force
}

Write-Host "[Aethelgrad] Dual-Sync Complete! Packs deployed." -ForegroundColor Green
