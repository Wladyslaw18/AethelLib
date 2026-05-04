# Aethelgrad Essentials - BDS Deployment & Test Script
# This script syncs the BP to the BDS development folder and launches a clean server session.

$PackName = "Aethelgrad Essentials (BP)"
$SourcePath = Join-Path $PSScriptRoot $PackName
$DestPath = Join-Path $PSScriptRoot "BDS\development_behavior_packs\$PackName"
$ServerExeName = "bedrock_server.exe"
$ServerDir = Join-Path $PSScriptRoot "BDS"

Clear-Host
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

# 2. SYNC BEHAVIOR PACK
Write-Host "[Sync] Copying pack to BDS development folder..." -ForegroundColor Blue
if (Test-Path $DestPath) {
    Remove-Item -Path $DestPath -Recurse -Force
}
Copy-Item -Path $SourcePath -Destination $DestPath -Recurse -Force
Write-Host "[Sync] Pack successfully deployed." -ForegroundColor Green

# 3. LAUNCH SERVER
Write-Host "[Server] Launching Bedrock Dedicated Server..." -ForegroundColor Cyan
Write-Host "------------------------------------------" -ForegroundColor Gray
Set-Location -Path $ServerDir

# Run the server using the call operator
$ServerPath = Join-Path $ServerDir $ServerExeName
& $ServerPath
