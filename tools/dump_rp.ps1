# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#  ᚫᛏᚻᛖᛚᚷᚱᚪᛞ  •  A E T H E L G R A D  S T U D I O S  •  ᚫᛏᚻᛖᛚᚷᚱᚪᛞ
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#  
#  Copyright (c) 2026 Aethelgrad Studios (Wladyslaw18).
#  All Rights Reserved.
#  
#  [ NOBLE INFRASTRUCTURE CORE - RESOURCE PACK DUMPER ]
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

param(
    [switch]$AutoStart
)

Clear-Host
Write-Host "==========================================================" -ForegroundColor Green
Write-Host "             AETHELGRAD RP DUMPER                         " -ForegroundColor White
Write-Host "==========================================================" -ForegroundColor Green
Write-Host "  This script will:" -ForegroundColor Gray
Write-Host "  1. Scan resource pack metadata and JSON-UI definitions." -ForegroundColor White
Write-Host "  2. Detect the current version from manifest.json." -ForegroundColor White
Write-Host "  3. Generate a complete, versioned RP code dump." -ForegroundColor White
Write-Host "  4. Save the dump to the tools/Output directory." -ForegroundColor White
Write-Host "----------------------------------------------------------" -ForegroundColor DarkGray

if (!$AutoStart) {
    Write-Host "  Press [ENTER] to execute RP dump | [Ctrl+C] to cancel" -ForegroundColor Green
    Write-Host "==========================================================" -ForegroundColor Green
    $null = Read-Host
} else {
    Write-Host "  [AutoStart Enabled] Executing RP dump instantly..." -ForegroundColor Green
    Write-Host "==========================================================" -ForegroundColor Green
}

$PSScriptDir = $PSScriptRoot
if (!$PSScriptDir) { $PSScriptDir = (Get-Location).Path }
$ProjectRoot = (Get-Item $PSScriptDir).Parent.FullName

$RpPath = Join-Path $ProjectRoot "AethelLib (RP)"
$OutputPath = Join-Path $PSScriptDir "Output"

if (!(Test-Path $OutputPath)) {
    New-Item -ItemType Directory -Path $OutputPath | Out-Null
}

$ManifestFile = Join-Path $RpPath "manifest.json"
$Version = "Unknown"
if (Test-Path $ManifestFile) {
    $ManifestContent = Get-Content $ManifestFile -Raw
    if ($ManifestContent -match '"version":\s*\[\s*(\d+),\s*(\d+),\s*(\d+)\s*\]') {
        $Version = "$($matches[1]).$($matches[2]).$($matches[3])"
    }
}

$DumpFileName = "AethelLib_RP.txt"
$DumpFile = Join-Path $OutputPath $DumpFileName

Write-Host "`n[Scan] Scanning Resource Pack files (Version: $Version)... collecting client UI logic... 😤" -ForegroundColor Cyan

$Files = @()

# Add manifest.json if exists
if (Test-Path $ManifestFile) {
    $Files += Get-Item $ManifestFile
}

# Scan for UI JSON files
$UiPath = Join-Path $RpPath "ui"
if (Test-Path $UiPath) {
    $Files += Get-ChildItem -Path $UiPath -Recurse -File -Include "*.json"
}

$DumpContent = "=== AethelLib Resource Pack Code Dump (Version: $Version) ===`r`n"
$DumpContent += "Generated: $(Get-Date)`r`n"
$DumpContent += "Files Included: $($Files.Count)`r`n`r`n"

foreach ($File in $Files) {
    # Get relative path for clean headers
    $RelativePath = $File.FullName.Substring($ProjectRoot.FullName.Length).TrimStart('\', '/')
    
    $DumpContent += "======================================================================`r`n"
    $DumpContent += "FILE: $RelativePath`r`n"
    $DumpContent += "======================================================================`r`n"
    $DumpContent += (Get-Content $File.FullName -Raw)
    $DumpContent += "`r`n`r`n"
}

# Write out the file
[System.IO.File]::WriteAllText($DumpFile, $DumpContent, [System.Text.Encoding]::UTF8)

Write-Host "[Done] RP Dump created successfully! 🚀" -ForegroundColor Green
Write-Host "Path: $DumpFile`n" -ForegroundColor White
