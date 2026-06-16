# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#  ᚫᛏᚻᛖᛚᚷᚱᚪᛞ  •  A E T H E L G R A D  S T U D I O S  •  ᚫᛏᚻᛖᛚᚷᚱᚪᛞ
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#  
#  Copyright (c) 2026 Aethelgrad Studios (Wladyslaw18).
#  All Rights Reserved.
#  
#  [ NOBLE INFRASTRUCTURE CORE - UI DUMPER ]
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

param(
    [switch]$AutoStart
)

Clear-Host
Write-Host "==========================================================" -ForegroundColor Green
Write-Host "             AETHELGRAD UI SCHEMAS DUMPER                 " -ForegroundColor White
Write-Host "==========================================================" -ForegroundColor Green
Write-Host "  This script will:" -ForegroundColor Gray
Write-Host "  1. Scan both client-side JSON-UI and script-side UI files." -ForegroundColor White
Write-Host "  2. Detect the current version from manifest.json." -ForegroundColor White
Write-Host "  3. Generate a complete, versioned UI code dump file." -ForegroundColor White
Write-Host "  4. Save the dump to the tools/Output directory." -ForegroundColor White
Write-Host "----------------------------------------------------------" -ForegroundColor DarkGray

if (!$AutoStart) {
    Write-Host "  Press [ENTER] to execute UI dump | [Ctrl+C] to cancel" -ForegroundColor Green
    Write-Host "==========================================================" -ForegroundColor Green
    $null = Read-Host
} else {
    Write-Host "  [AutoStart Enabled] Executing UI dump instantly..." -ForegroundColor Green
    Write-Host "==========================================================" -ForegroundColor Green
}

$PSScriptDir = $PSScriptRoot
if (!$PSScriptDir) { $PSScriptDir = (Get-Location).Path }
$ProjectRoot = (Get-Item $PSScriptDir).Parent.FullName

$UiRpPath = Join-Path $ProjectRoot "AethelLib (RP)\ui"
$UiScriptPath = Join-Path $ProjectRoot "scripts\ui"
$OutputPath = Join-Path $PSScriptDir "Output"

if (!(Test-Path $OutputPath)) {
    New-Item -ItemType Directory -Path $OutputPath | Out-Null
}

$ManifestFile = Join-Path $ProjectRoot "manifest.json"
$Version = "Unknown"
if (Test-Path $ManifestFile) {
    $ManifestContent = Get-Content $ManifestFile -Raw
    if ($ManifestContent -match '"version":\s*\[\s*(\d+),\s*(\d+),\s*(\d+)\s*\]') {
        $Version = "$($matches[1]).$($matches[2]).$($matches[3])"
    }
}

$DumpFileName = "AethelLib_UI.txt"
$DumpFile = Join-Path $OutputPath $DumpFileName

Write-Host "`n[Scan] Scanning UI files (Version: $Version)... Praying for no layout loops 💀" -ForegroundColor Cyan

$Files = @()
if (Test-Path $UiRpPath) {
    $Files += Get-ChildItem -Path $UiRpPath -Recurse -File -Include "*.json"
}
if (Test-Path $UiScriptPath) {
    $Files += Get-ChildItem -Path $UiScriptPath -Recurse -File -Include "*.js"
}

$DumpContent = "=== AethelLib UI Code Dump (Version: $Version) ===`r`n"
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

Write-Host "[Done] UI Dump created successfully! No more client-crashing scrolling boxes 😤🎉" -ForegroundColor Green
Write-Host "Path: $DumpFile`n" -ForegroundColor White
