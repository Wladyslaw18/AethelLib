param(
    [switch]$AutoStart
)

Clear-Host
Write-Host "==========================================================" -ForegroundColor Green
Write-Host "             AETHELGRAD PLUGIN DUMPER                     " -ForegroundColor White
Write-Host "==========================================================" -ForegroundColor Green
Write-Host "  This script will:" -ForegroundColor Gray
Write-Host "  1. Scan the AethelEssentials plugin directory." -ForegroundColor White
Write-Host "  2. Detect the current version from index.js." -ForegroundColor White
Write-Host "  3. Generate a complete, versioned code dump file." -ForegroundColor White
Write-Host "  4. Save the dump to the tools/Output directory." -ForegroundColor White
Write-Host "----------------------------------------------------------" -ForegroundColor DarkGray

if (!$AutoStart) {
    Write-Host "  Press [ENTER] to execute dump | [Ctrl+C] to cancel" -ForegroundColor Green
    Write-Host "==========================================================" -ForegroundColor Green
    $null = Read-Host
} else {
    Write-Host "  [AutoStart Enabled] Executing dump instantly..." -ForegroundColor Green
    Write-Host "==========================================================" -ForegroundColor Green
}

$PSScriptDir = $PSScriptRoot
if (!$PSScriptDir) { $PSScriptDir = (Get-Location).Path }
$ProjectRoot = (Get-Item $PSScriptDir).Parent.FullName

$PluginPath = Join-Path $ProjectRoot "scripts\plugins\AethelEssentials"
$OutputPath = Join-Path $PSScriptDir "Output"

if (!(Test-Path $OutputPath)) {
    New-Item -ItemType Directory -Path $OutputPath | Out-Null
}

$IndexFile = Join-Path $PluginPath "index.js"
if (!(Test-Path $IndexFile)) {
    Write-Host "Could not find index.js at $IndexFile" -ForegroundColor Red
    exit 1
}

$IndexContent = Get-Content $IndexFile -Raw
$Version = "Unknown"
if ($IndexContent -match 'version:\s*"([^"]+)"') {
    $Version = $matches[1]
}

$Timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$DumpFileName = "AethelEssentials_v${Version}_${Timestamp}.txt"
$DumpFile = Join-Path $OutputPath $DumpFileName

Write-Host "`n[Scan] Scanning AethelEssentials plugin (Version: $Version)..." -ForegroundColor Cyan

$Files = Get-ChildItem -Path $PluginPath -Recurse -File -Filter "*.js"
$DumpContent = "=== AethelEssentials Code Dump (Version: $Version) ===`r`n"
$DumpContent += "Generated: $(Get-Date)`r`n"
$DumpContent += "Files Included: $($Files.Count)`r`n`r`n"

foreach ($File in $Files) {
    # Get relative path for clean headers
    $RelativePath = $File.FullName.Substring($PluginPath.Length).TrimStart('\', '/')
    
    $DumpContent += "======================================================================`r`n"
    $DumpContent += "FILE: $RelativePath`r`n"
    $DumpContent += "======================================================================`r`n"
    $DumpContent += (Get-Content $File.FullName -Raw)
    $DumpContent += "`r`n`r`n"
}

# Write out the file
[System.IO.File]::WriteAllText($DumpFile, $DumpContent, [System.Text.Encoding]::UTF8)

Write-Host "[Done] Dump created successfully!" -ForegroundColor Green
Write-Host "Path: $DumpFile`n" -ForegroundColor White
