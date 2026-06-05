# AETHELGRAD COMMAND CONSOLIDATOR (GHOST PROTOCOL)
# ----------------------------------------------------------------------------
# Industrial-grade extraction of command infrastructure for LLM ingestion.

Clear-Host
Write-Host "==========================================================" -ForegroundColor Yellow
Write-Host "            AETHELGRAD COMMAND CONSOLIDATOR               " -ForegroundColor White
Write-Host "==========================================================" -ForegroundColor Yellow
Write-Host "  This script will:" -ForegroundColor Gray
Write-Host "  1. Scan all command registration and execution files." -ForegroundColor White
Write-Host "  2. Append manifest.json configuration for context." -ForegroundColor White
Write-Host "  3. Consolidate everything into AethelLib_commands(version).txt." -ForegroundColor White
Write-Host "----------------------------------------------------------" -ForegroundColor DarkGray
Write-Host "  Press [ENTER] to execute command consolidation | [Ctrl+C] to cancel" -ForegroundColor Yellow
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

$OutputFile = Join-Path $ProjectRoot "AethelLib_commands($VersionStr).txt"
$TargetPaths = @("$ProjectRoot\scripts\commands", "$ProjectRoot\scripts\core\commands")
$RootPath = $ProjectRoot
$IncludeExtensions = @("*.js", "*.json")

if (Test-Path $OutputFile) { Remove-Item $OutputFile }

Write-Host "`n§6[COMMAND_SHIP] Initializing extraction-vector..." -ForegroundColor Cyan

$ConsolidatedCount = 0

foreach ($Root in $TargetPaths) {
    if (Test-Path $Root) {
        $Files = Get-ChildItem -Path $Root -Recurse -File -Include $IncludeExtensions
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

# Also include manifest.json for environment context
if (Test-Path $ManifestPath) {
    "================================================================================" | Out-File -FilePath $OutputFile -Append -Encoding utf8
    "NODE_IDENTIFIER: \manifest.json" | Out-File -FilePath $OutputFile -Append -Encoding utf8
    "================================================================================" | Out-File -FilePath $OutputFile -Append -Encoding utf8
    Get-Content $ManifestPath | Out-File -FilePath $OutputFile -Append -Encoding utf8
    $ConsolidatedCount++
}

Write-Host "§a[SUCCESS] Extraction complete. $ConsolidatedCount modules stabilized." -ForegroundColor Green
Write-Host "§b[PAYLOAD] $OutputFile is ready for LLM shipment.`n" -ForegroundColor Blue
