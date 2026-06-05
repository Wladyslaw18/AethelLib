# LLM_SHIPMENT_ORCHESTRATOR
# ----------------------------------------------------------------------------
# Consolidates all industrial-logic nodes into a single high-density manifest 
# for LLM context-injection. 

Clear-Host
Write-Host "==========================================================" -ForegroundColor Yellow
Write-Host "            AETHELGRAD PAYLOAD CONSOLIDATOR               " -ForegroundColor White
Write-Host "==========================================================" -ForegroundColor Yellow
Write-Host "  This script will:" -ForegroundColor Gray
Write-Host "  1. Scan all JS, JSON, and MD files in the workspace." -ForegroundColor White
Write-Host "  2. Filter out libraries, build folders, and servers." -ForegroundColor White
Write-Host "  3. Consolidate everything into AethelLib(version).txt." -ForegroundColor White
Write-Host "----------------------------------------------------------" -ForegroundColor DarkGray
Write-Host "  Press [ENTER] to execute payload consolidation | [Ctrl+C] to cancel" -ForegroundColor Yellow
Write-Host "==========================================================" -ForegroundColor Yellow
Read-Host | Out-Null

$PSScriptDir = $PSScriptRoot
if (!$PSScriptDir) { $PSScriptDir = Split-Path $MyInvocation.MyCommand.Path -Parent }
$ProjectRoot = (Get-Item $PSScriptDir).Parent.FullName

$ManifestPath = Join-Path $ProjectRoot "manifest.json"
$VersionStr = "1.0.0"
if (Test-Path $ManifestPath) {
    try {
        $Manifest = Get-Content $ManifestPath -Raw -Encoding utf8 | ConvertFrom-Json
        $VersionStr = $Manifest.header.version -join "."
    } catch {}
}

$OutputDir = Join-Path $PSScriptDir "Output"
if (!(Test-Path $OutputDir)) {
    New-Item -ItemType Directory -Path $OutputDir -Force | Out-Null
}
$OutputFile = Join-Path $OutputDir "AethelLib($VersionStr).txt"
$OutputFilename = "AethelLib($VersionStr).txt"

$IncludeExtensions = @("*.js", "*.json", "*.md")
$IgnorePaths = @("node_modules", ".git", ".gemini", "bin", "dist", "RAW_CODE_DUMP.txt", "LLM_SHIPMENT_DUMP.txt", $OutputFilename, "build", "backups", "releases", "BDS")

if (Test-Path $OutputFile) { Remove-Item $OutputFile }

Write-Host "§6[SHIPMENT] Initializing extraction-vector..."

$Files = Get-ChildItem -Path $ProjectRoot -Recurse -File -Include $IncludeExtensions | Where-Object {
    $filePath = $_.FullName
    $shouldIgnore = $false
    foreach ($ignore in $IgnorePaths) {
        if ($filePath -like "*\$ignore*" -or $filePath -like "*$ignore") {
            $shouldIgnore = $true
            break
        }
    }
    !$shouldIgnore
}

Write-Host "§a[SHIPMENT] Staging $($Files.Count) modules for consolidation..."

foreach ($File in $Files) {
    $RelativePath = $File.FullName.Replace($ProjectRoot, "")
    "================================================================================" | Out-File -FilePath $OutputFile -Append -Encoding utf8
    "FILE_NODE: $RelativePath" | Out-File -FilePath $OutputFile -Append -Encoding utf8
    "================================================================================" | Out-File -FilePath $OutputFile -Append -Encoding utf8
    Get-Content $File.FullName | Out-File -FilePath $OutputFile -Append -Encoding utf8
    "`n" | Out-File -FilePath $OutputFile -Append -Encoding utf8
}

Write-Host "§b[SHIPMENT] Consolidation successful. Payload: $OutputFile"
