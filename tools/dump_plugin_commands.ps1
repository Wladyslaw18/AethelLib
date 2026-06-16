# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#  ᚫᛏᚻᛖᛚᚷᚱᚪᛞ  •  A E T H E L G R A D  S T U D I O S  •  ᚫᛏᚻᛖᛚᚷᚱᚪᛞ
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#  
#  Copyright (c) 2026 Aethelgrad Studios (Wladyslaw18).
#  All Rights Reserved.
#  
#  [ NOBLE INFRASTRUCTURE CORE - PLUGIN COMMANDS DUMPER ]
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

param(
    [switch]$AutoStart
)

Clear-Host
Write-Host "==========================================================" -ForegroundColor Green
Write-Host "             AETHELGRAD PLUGIN COMMANDS DUMPER            " -ForegroundColor White
Write-Host "==========================================================" -ForegroundColor Green
Write-Host "  This script will:" -ForegroundColor Gray
Write-Host "  1. Scan commands inside plugin directories." -ForegroundColor White
Write-Host "  2. Detect the current version from manifest.json." -ForegroundColor White
Write-Host "  3. Generate a complete, versioned plugin commands code dump." -ForegroundColor White
Write-Host "  4. Save the dump to the tools/Output directory." -ForegroundColor White
Write-Host "----------------------------------------------------------" -ForegroundColor DarkGray

if (!$AutoStart) {
    Write-Host "  Press [ENTER] to execute plugin commands dump | [Ctrl+C] to cancel" -ForegroundColor Green
    Write-Host "==========================================================" -ForegroundColor Green
    $null = Read-Host
} else {
    Write-Host "  [AutoStart Enabled] Executing plugin commands dump instantly..." -ForegroundColor Green
    Write-Host "==========================================================" -ForegroundColor Green
}

$PSScriptDir = $PSScriptRoot
if (!$PSScriptDir) { $PSScriptDir = (Get-Location).Path }
$ProjectRoot = (Get-Item $PSScriptDir).Parent.FullName

$PluginsPath = Join-Path $ProjectRoot "scripts\plugins"
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

$DumpFileName = "AethelLib_Plugin_Commands.txt"
$DumpFile = Join-Path $OutputPath $DumpFileName

Write-Host "`n[Scan] Scanning plugin command files (Version: $Version)... Let's see what features we have... 😤" -ForegroundColor Cyan

$Files = @()

# Scan for nested "commands" directories in plugins
if (Test-Path $PluginsPath) {
    $PluginCommands = Get-ChildItem -Path $PluginsPath -Recurse -Directory -Filter "commands"
    foreach ($Dir in $PluginCommands) {
        $Files += Get-ChildItem -Path $Dir.FullName -Recurse -File -Include "*.js"
    }
}

$DumpContent = "=== AethelLib Plugin Commands Code Dump (Version: $Version) ===`r`n"
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

Write-Host "[Done] Plugin Commands Dump created successfully! 🚀" -ForegroundColor Green
Write-Host "Path: $DumpFile`n" -ForegroundColor White
