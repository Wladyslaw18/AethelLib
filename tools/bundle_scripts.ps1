# Aethelgrad Essentials - Script Bundler Utility
# Concatenates all tools scripts (including itself) into a single TXT file for clean viewing/backups.

Clear-Host
Write-Host "==========================================================" -ForegroundColor Green
Write-Host "             AETHELGRAD SCRIPT BUNDLER                    " -ForegroundColor White
Write-Host "==========================================================" -ForegroundColor Green
Write-Host "  This script will:" -ForegroundColor Gray
Write-Host "  1. Scan the tools folder for all PowerShell scripts (*.ps1)." -ForegroundColor White
Write-Host "  2. Read their contents, including this bundler script." -ForegroundColor White
Write-Host "  3. Generate a single clean TXT file containing all code." -ForegroundColor White
Write-Host "----------------------------------------------------------" -ForegroundColor DarkGray
Write-Host "  Press [ENTER] to execute bundle creation | [Ctrl+C] to cancel" -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Green
Read-Host | Out-Null

$PSScriptDir = $PSScriptRoot
if (!$PSScriptDir) { $PSScriptDir = Split-Path $MyInvocation.MyCommand.Path -Parent }
$ProjectRoot = (Get-Item $PSScriptDir).Parent.FullName

$OutputDir = Join-Path $PSScriptDir "Output"
if (!(Test-Path $OutputDir)) {
    New-Item -ItemType Directory -Path $OutputDir -Force | Out-Null
}
$OutputFile = Join-Path $OutputDir "tools_scripts_bundle.txt"

Write-Host "[Bundler] Scanning tools directory: $PSScriptDir" -ForegroundColor Blue

# Find all .ps1 files in the tools directory
$Scripts = Get-ChildItem -Path $PSScriptDir -Filter *.ps1 -File | Sort-Object Name

Write-Host "[Bundler] Found $($Scripts.Count) script(s) to process." -ForegroundColor Blue

# Initialize or clear the output file
if (Test-Path $OutputFile) {
    Remove-Item -Path $OutputFile -Force | Out-Null
}

$Header = @"
================================================================================
AETHELGRAD ESSENTIALS - TOOLS SCRIPTS BUNDLE
Generated on: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
Total Scripts: $($Scripts.Count)
================================================================================

"@
$Header | Out-File -FilePath $OutputFile -Encoding utf8 -Force

foreach ($Script in $Scripts) {
    $RelativePath = "tools/$($Script.Name)"
    Write-Host "[Bundler] Processing $RelativePath..." -ForegroundColor Cyan
    
    $ScriptHeader = @"

================================================================================
SCRIPT: $($Script.Name)
PATH: $RelativePath
================================================================================

"@
    $ScriptHeader | Out-File -FilePath $OutputFile -Encoding utf8 -Append
    
    # Read and append content
    Get-Content -Path $Script.FullName -Raw | Out-File -FilePath $OutputFile -Encoding utf8 -Append
    
    # Add trailing spacing
    "`n`n" | Out-File -FilePath $OutputFile -Encoding utf8 -Append
}

Write-Host "==========================================================" -ForegroundColor Green
Write-Host "  SUCCESS: Bundle created at:" -ForegroundColor White
Write-Host "  $OutputFile" -ForegroundColor Yellow
Write-Host "==========================================================" -ForegroundColor Green
