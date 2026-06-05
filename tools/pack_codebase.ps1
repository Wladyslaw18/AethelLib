# Age Of Steel - Codebase Bundler & LLM Packer
# Gathers the entire C# codebase and architecture rules into a single TXT file for LLM ingestion.

Clear-Host
Write-Host "==========================================================" -ForegroundColor Red
Write-Host "         💀 AGE OF STEEL - CODEBASE BUNDLER 💀            " -ForegroundColor White
Write-Host "==========================================================" -ForegroundColor Red
Write-Host "  This script will:" -ForegroundColor Gray
Write-Host "  1. Scan Core/, Systems/, Interface/, Utils/ for C# files." -ForegroundColor White
Write-Host "  2. Include core config files (Program.cs, scenario.toml)." -ForegroundColor White
Write-Host "  3. Append the Mega Manifesto design rules & constraints." -ForegroundColor White
Write-Host "  4. Generate a single formatted TXT file for LLM ingestion." -ForegroundColor White
Write-Host "----------------------------------------------------------" -ForegroundColor DarkGray
Write-Host "  Press [ENTER] to execute packing | [Ctrl+C] to reject" -ForegroundColor Red
Write-Host "==========================================================" -ForegroundColor Red
$null = Read-Host

$PSScriptDir = $PSScriptRoot
if (!$PSScriptDir) { $PSScriptDir = (Get-Location).Path }

# Resolve project root (if running from a tools/ subfolder)
if ($PSScriptDir -like "*tools") {
    $ProjectRoot = (Get-Item $PSScriptDir).Parent.FullName
} else {
    $ProjectRoot = $PSScriptDir
}

$OutputDir = Join-Path $ProjectRoot "tools\Output"
if (!(Test-Path $OutputDir)) {
    New-Item -ItemType Directory -Path $OutputDir -Force | Out-Null
}

$Timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$OutputFile = Join-Path $OutputDir "AgeOfSteel_Codebase_LLM_Feed_${Timestamp}.txt"

Write-Host "[Scanner] Locating source files in $ProjectRoot..." -ForegroundColor Cyan

# Gather all C# files, excluding bin, obj, git, and output folders
$Files = Get-ChildItem -Path $ProjectRoot -Recurse -File | Where-Object {
    ($_.Extension -eq ".cs" -or $_.Name -eq "scenario.toml") -and
    $_.FullName -notlike "*\bin\*" -and
    $_.FullName -notlike "*\obj\*" -and
    $_.FullName -notlike "*\.git\*" -and
    $_.FullName -notlike "*\.vs\*" -and
    $_.FullName -notlike "*\tools\Output\*"
}

Write-Host "[Scanner] Found $($Files.Count) files to pack." -ForegroundColor Cyan

# Define the LLM Prompt header and Mega Manifesto rules
$PromptHeader = @"
================================================================================
AGE OF STEEL - FULL CODEBASE & SPECIFICATION BUNDLE
================================================================================
Generated on: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
Total Files Packed: $($Files.Count)

================================================================================
💀 DIRECTIVE FOR THE LLM (READ THIS FIRST) 💀
================================================================================
You are analyzing the C# Game Engine codebase "Age of Steel".
You must inspect the provided files and implement updates or additions that 
adhere strictly to the design rules in the Mega Manifesto:

1. Code defines behavior. Data defines everything else. Do NOT hardcode country stats, unit templates, or content.
2. String-blind runtime: All IDs must map to integers at runtime using stable FNV-1a hashes. Do not do string comparisons in hot paths.
3. Atomic Task Pattern: Do not poll or scan everything per-turn. Queue investments/tasks and process only active queues.
4. Deterministic RNG: Use prime-multiplied XOR seeds based on ProvinceId, Turn, and Purpose index.
5. Foreign Phased Combat: Sort allied defenders by strength descending and resolve battles in tiers.
6. USSR Samson Mode & Feral Theater Allocators: Respect stack-allocated Struct layouts and branchless logic checks.

================================================================================
CORE ARCHITECTURE AND FILE CONTROLS
================================================================================
"@

$PromptHeader | Out-File -FilePath $OutputFile -Encoding utf8 -Force

foreach ($File in $Files) {
    # Get relative path for clean headers
    $RelativePath = $File.FullName.Substring($ProjectRoot.Length).TrimStart('\', '/')
    Write-Host "[Packer] Appending $RelativePath..." -ForegroundColor Yellow
    
    $FileHeader = @"

======================================================================
FILE: $RelativePath
======================================================================
"@
    $FileHeader | Out-File -FilePath $OutputFile -Encoding utf8 -Append
    Get-Content -Path $File.FullName -Raw | Out-File -FilePath $OutputFile -Encoding utf8 -Append
}

Write-Host "==========================================================" -ForegroundColor Green
Write-Host "  SUCCESS: LLM codebase feed created at:" -ForegroundColor White
Write-Host "  $OutputFile" -ForegroundColor Yellow
Write-Host "==========================================================" -ForegroundColor Green
