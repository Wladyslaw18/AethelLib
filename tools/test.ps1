# Aethelgrad Essentials - BDS Deployment & Test Script
# This script syncs the BP to the BDS development folder and launches a clean server session.

Clear-Host
Write-Host "==========================================================" -ForegroundColor Green
Write-Host "             AETHELGRAD DUAL-SYNC RUNNER                  " -ForegroundColor White
Write-Host "==========================================================" -ForegroundColor Green
Write-Host "  This script will:" -ForegroundColor Gray
Write-Host "  1. Terminate any running Bedrock Dedicated Server instances." -ForegroundColor White
Write-Host "  2. Clean and synchronize behavior and resource packs." -ForegroundColor White
Write-Host "  3. Boot up a clean BDS console session." -ForegroundColor White
Write-Host "----------------------------------------------------------" -ForegroundColor DarkGray
Write-Host "  Press [ENTER] to execute test run | [Ctrl+C] to cancel" -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Green
Read-Host | Out-Null

$PackName = "Aethelgrad Essentials"
$PSScriptDir = $PSScriptRoot
$ProjectRoot = (Get-Item $PSScriptDir).Parent.FullName
$SourcePath = $ProjectRoot
$DestPath = Join-Path $ProjectRoot "BDS\development_behavior_packs\$PackName"
$ServerExeName = "bedrock_server.exe"
$ServerDir = Join-Path $ProjectRoot "BDS"

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "  AETHELGRAD DEPLOYMENT SUITE  " -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

# 1. KILL EXISTING PROCESSES
$Process = Get-Process -Name "bedrock_server" -ErrorAction SilentlyContinue
if ($Process) {
    Write-Host "[Process] Existing BDS found. Terminating..." -ForegroundColor Yellow
    Stop-Process -Name "bedrock_server" -Force
    Start-Sleep -Seconds 1
} else {
    Write-Host "[Process] No existing instances found." -ForegroundColor Gray
}

# 2. SYNC BEHAVIOR PACKS
Write-Host "[Sync] Deploying Behavior Packs..." -ForegroundColor Blue

$Packs = @("Aethelgrad Essentials")

foreach ($P in $Packs) {
    $P_Dest = Join-Path $ProjectRoot "BDS\development_behavior_packs\$P"
    $P_Source = Join-Path $SourcePath $P
    
    if (Test-Path $P_Dest) {
        Remove-Item -Path $P_Dest -Recurse -Force
    }
    
    # Fallback for the root files (Essentials is the root)
    if ($P -eq "Aethelgrad Essentials") {
        New-Item -Path $P_Dest -ItemType Directory -Force | Out-Null
        $FilesToSync = @("manifest.json", "pack_icon.png", "scripts", "entities")
        foreach ($Item in $FilesToSync) {
            Copy-Item -Path (Join-Path $SourcePath $Item) -Destination (Join-Path $P_Dest $Item) -Recurse -Force
        }
    }
}

# 3. SYNC RESOURCE PACK
$RPName = "AethelLib (RP)"
$RPSource = Join-Path $SourcePath $RPName
$RPDest = Join-Path $ProjectRoot "BDS\development_resource_packs\$RPName"

Write-Host "[Sync] Copying Resource Pack to BDS development folder..." -ForegroundColor Yellow
if (Test-Path $RPDest) {
    Remove-Item -Path $RPDest -Recurse -Force
}
if (Test-Path $RPSource) {
    Copy-Item -Path $RPSource -Destination $RPDest -Recurse -Force
}

Write-Host "[Sync] All packs successfully deployed." -ForegroundColor Green

# 4. LAUNCH SERVER
Write-Host "[Server] Launching Bedrock Dedicated Server..." -ForegroundColor Cyan
Write-Host "------------------------------------------" -ForegroundColor Gray
Set-Location -Path $ServerDir

# Run the server using the call operator
$ServerPath = Join-Path $ServerDir $ServerExeName
& $ServerPath
