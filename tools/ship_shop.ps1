# AETHELGRAD SHOP-SYSTEM CONSOLIDATOR (MERCANTILE PROTOCOL)
# ----------------------------------------------------------------------------
# Extraction vector for Shop UI, Data, and Logic modules.

Clear-Host
Write-Host "==========================================================" -ForegroundColor Yellow
Write-Host "             AETHELGRAD SHOP CONSOLIDATOR                 " -ForegroundColor White
Write-Host "==========================================================" -ForegroundColor Yellow
Write-Host "  This script will:" -ForegroundColor Gray
Write-Host "  1. Scan shop items, user interfaces, and shop commands." -ForegroundColor White
Write-Host "  2. Package mercantile mechanics for context analysis." -ForegroundColor White
Write-Host "  3. Consolidate everything into AethelLib_shop(version).txt." -ForegroundColor White
Write-Host "----------------------------------------------------------" -ForegroundColor DarkGray
Write-Host "  Press [ENTER] to execute shop consolidation | [Ctrl+C] to cancel" -ForegroundColor Yellow
Write-Host "==========================================================" -ForegroundColor Yellow
Read-Host | Out-Null

$PSScriptDir = $PSScriptRoot
$ProjectRoot = (Get-Item $PSScriptDir).Parent.FullName

$ManifestPath = Join-Path $ProjectRoot "manifest.json"
$VersionStr = "1.0.0"
if (Test-Path $ManifestPath) {
    try {
        $Manifest = Get-Content $ManifestPath -Raw -Encoding utf8 | ConvertFrom-Json
        $VersionStr = $Manifest.header.version -join "."
    } catch {}
}

$OutputFile = Join-Path $ProjectRoot "AethelLib_shop($VersionStr).txt"
$TargetPaths = @(
    "$ProjectRoot\scripts\data\minecraft-items.js",
    "$ProjectRoot\scripts\ui\shop",
    "$ProjectRoot\scripts\commands\shop"
)
$IncludeExtensions = @("*.js", "*.json")
$RootPath = $ProjectRoot

if (Test-Path $OutputFile) { Remove-Item $OutputFile }

Write-Host "`n§e[SHOP_SHIP] Initializing mercantile extraction..." -ForegroundColor Yellow

$ConsolidatedCount = 0

foreach ($Path in $TargetPaths) {
    if (Test-Path $Path) {
        if ((Get-Item $Path).PSIsContainer) {
            $Files = Get-ChildItem -Path $Path -Recurse -File -Include $IncludeExtensions
        } else {
            $Files = @(Get-Item $Path)
        }
        
        foreach ($File in $Files) {
            $RelativePath = $File.FullName.Replace($RootPath, "")
            
            "================================================================================" | Out-File -FilePath $OutputFile -Append -Encoding utf8
            "NODE_IDENTIFIER: $RelativePath" | Out-File -FilePath $OutputFile -Append -Encoding utf8
            "================================================================================" | Out-File -FilePath $OutputFile -Append -Encoding utf8
            
            Get-Content $File.FullName | Out-File -FilePath $OutputFile -Append -Encoding utf8
            "`n" | Out-File -FilePath $OutputFile -Append -Encoding utf8
            
            $ConsolidatedCount++
        }
    }
}

Write-Host "§a[SUCCESS] Extraction complete. $ConsolidatedCount mercantile modules stabilized." -ForegroundColor Green
Write-Host "§b[PAYLOAD] $OutputFile is ready for LLM shipment.`n" -ForegroundColor Blue
