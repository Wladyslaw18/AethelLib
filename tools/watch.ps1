param(
    [switch]$AutoStart
)

# ============================================================
#  Aethelgrad Essentials - BDS Dev Watcher + Auto Restart
#  Save any file → syncs to BDS → restarts BDS automatically
#  NO more manual quit/rejoin cycle
# ============================================================

[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

# ── Helpers ─────────────────────────────────────────────────
function Info($m)    { Write-Host "[AE $(Get-Date -f HH:mm:ss)] $m" -ForegroundColor Cyan }
function Ok($m)      { Write-Host "[AE $(Get-Date -f HH:mm:ss)] $m" -ForegroundColor Green }
function Warn($m)    { Write-Host "[AE $(Get-Date -f HH:mm:ss)] $m" -ForegroundColor Yellow }
function Err($m)     { Write-Host "[AE $(Get-Date -f HH:mm:ss)] $m" -ForegroundColor Red }

function Resolve-BDS-Directory($path) {
    if ($path -and (Test-Path $path)) {
        $item = Get-Item $path
        if ($item.PSIsContainer) {
            return $item.FullName
        } else {
            return $item.DirectoryName
        }
    }
    return $null
}

function Test-Valid-BDS-Directory($path) {
    if (!$path -or !(Test-Path $path)) { return $null }
    $resolved = Resolve-BDS-Directory $path
    if ($resolved -and (Test-Path (Join-Path $resolved "bedrock_server.exe"))) {
        return $resolved
    }
    return $null
}

function Kill-BDS-Processes {
    param($ExcludeProcess = $null)
    $RunningBDS = Get-Process -Name "bedrock_server" -ErrorAction SilentlyContinue
    if ($ExcludeProcess) {
        $RunningBDS = $RunningBDS | Where-Object { $_.Id -ne $ExcludeProcess.Id }
    }
    if ($RunningBDS) {
        $PIDs = $RunningBDS.Id
        Warn "Found running bedrock_server instance(s) (PIDs: $($PIDs -join ', ')). Terminating..."
        foreach ($Proc in $RunningBDS) {
            try {
                Stop-Process -Id $Proc.Id -Force -ErrorAction Stop
            } catch {
                taskkill.exe /F /PID $Proc.Id /T > $null 2>&1
            }
        }
        Start-Sleep -Seconds 1
    }
    # Forceful fallback check to kill any rogue instances
    try {
        taskkill.exe /F /IM bedrock_server.exe /T > $null 2>&1
    } catch {}
}

# ── Paths & Setup ───────────────────────────────────────────
$PSScriptDir = $null
if ($PSScriptRoot) { $PSScriptDir = $PSScriptRoot } else { $PSScriptDir = Join-Path (Get-Location).Path "tools" }
if (!(Test-Path $PSScriptDir)) {
    if ((Get-Location).Path -like "*tools") {
        $PSScriptDir = (Get-Location).Path
    }
}
$ProjectRoot = $null
if ($PSScriptRoot) {
    $ProjectRoot = (Get-Item $PSScriptDir).Parent.FullName
} else {
    if ((Get-Location).Path -like "*tools") {
        $ProjectRoot = (Get-Item (Get-Location).Path).Parent.FullName
    } else {
        $ProjectRoot = (Get-Location).Path
    }
}
$ConfigPath  = Join-Path $ProjectRoot ".bds_path"
$BP_SOURCE   = $ProjectRoot

# ── BDS Root Resolution ─────────────────────────────────────
$BDS_ROOT = $null

# 1. Check environment variables
if ($env:BDS_PATH) {
    $BDS_ROOT = Test-Valid-BDS-Directory $env:BDS_PATH
}
if (!$BDS_ROOT -and $env:BDS_ROOT) {
    $BDS_ROOT = Test-Valid-BDS-Directory $env:BDS_ROOT
}

# 2. Check local config file
if (!$BDS_ROOT -and (Test-Path $ConfigPath)) {
    $Cached = Get-Content $ConfigPath -ErrorAction SilentlyContinue
    $BDS_ROOT = Test-Valid-BDS-Directory $Cached
}

# 3. Check default BDS folder in project root
if (!$BDS_ROOT) {
    $BDS_ROOT = Test-Valid-BDS-Directory (Join-Path $ProjectRoot "BDS")
}

# 4. Prompt user if still not found or invalid
while (!$BDS_ROOT) {
    Warn "BDS directory (containing bedrock_server.exe) not automatically detected or invalid."
    if ($env:NONINTERACTIVE -or [Console]::IsInputRedirected) {
        Err "Non-interactive/redirected environment detected. Cannot prompt for BDS directory path. Exiting."
        exit 1
    }
    Write-Host "Please enter the absolute path to your Bedrock Dedicated Server directory (or drag-and-drop bedrock_server.exe):" -ForegroundColor Gray
    $InputPath = Read-Host
    if ($null -eq $InputPath) {
        Err "No input received. Exiting."
        exit 1
    }
    # Trim quotes if dragged and dropped
    $InputPath = $InputPath.Trim('"', "'").Trim()
    
    $Resolved = Test-Valid-BDS-Directory $InputPath
    if ($Resolved) {
        $BDS_ROOT = $Resolved
        # Save to local configuration cache
        try {
            $BDS_ROOT | Out-File -FilePath $ConfigPath -Encoding utf8 -Force
            Ok "BDS path cached to .bds_path"
        } catch {
            Warn "Could not save BDS path cache: $_"
        }
    } else {
        Err "Path is invalid, does not exist, or does not contain bedrock_server.exe: $InputPath"
    }
}

$BDS_ROOT = (Get-Item $BDS_ROOT).FullName
$BP_DEST  = Join-Path $BDS_ROOT "development_behavior_packs\Aethelgrad Essentials"
$RP_DEST  = Join-Path $BDS_ROOT "development_resource_packs\AethelLib (RP)"
$BDS_EXE  = Join-Path $BDS_ROOT "bedrock_server.exe"

$DEBOUNCE_MS      = 800   # ms to wait after last save before restarting
$RESTART_COOLDOWN = 5     # seconds minimum between restarts

# ── Validate Sources & Executable ───────────────────────────
if (!(Test-Path $BP_SOURCE)) { Err "BP source not found: $BP_SOURCE"; exit 1 }
if (!(Test-Path $BDS_EXE))   { Err "bedrock_server.exe not found: $BDS_EXE"; exit 1 }

# ── Terminate existing BDS instances first ───────────────────
Kill-BDS-Processes

# ── Show Welcome / Interactive Confirmation ──────────────────
if (!$AutoStart) {
    Clear-Host
    Write-Host "==========================================================" -ForegroundColor Green
    Write-Host "             AETHELGRAD HOT-RELOAD WATCHER                " -ForegroundColor White
    Write-Host "==========================================================" -ForegroundColor Green
    Write-Host "  BDS Path:  $BDS_ROOT" -ForegroundColor Gray
    Write-Host "  Project:   $ProjectRoot" -ForegroundColor Gray
    Write-Host "----------------------------------------------------------" -ForegroundColor DarkGray
    Write-Host "  This script will:" -ForegroundColor Gray
    Write-Host "  1. Monitor behavior & resource pack files recursively." -ForegroundColor White
    Write-Host "  2. Automatically sync file changes to BDS upon save." -ForegroundColor White
    Write-Host "  3. Force-restart the bedrock server console dynamically." -ForegroundColor White
    Write-Host "----------------------------------------------------------" -ForegroundColor DarkGray
    Write-Host "  Press [ENTER] to start hot-watcher | [Ctrl+C] to cancel" -ForegroundColor Green
    Write-Host "==========================================================" -ForegroundColor Green

    $null = Read-Host
}

# ── Global Cache & Restart Status ───────────────────────────
$script:pendingRestart = $false
$script:lastChangeMs   = 0
$script:stdinClosed    = $false
$script:bdsProcess     = $null
$script:lastRestartSec = 0

# ── Full sync function ────────────────────────────────────────
function Sync-Packs {
    try {
        # Sync Behavior Pack
        if (Test-Path $BP_DEST) {
            Remove-Item -Path $BP_DEST -Recurse -Force -ErrorAction SilentlyContinue
        }
        New-Item -ItemType Directory -Path $BP_DEST -Force | Out-Null
        
        $BP_Files = @("manifest.json", "pack_icon.png", "scripts", "entities")
        foreach ($Item in $BP_Files) {
            $Source = Join-Path $BP_SOURCE $Item
            if (Test-Path $Source) {
                Copy-Item -Path $Source -Destination $BP_DEST -Recurse -Force
            }
        }
        
        # Sync Resource Pack
        $RP_Name = "AethelLib (RP)"
        $RP_Source = Join-Path $BP_SOURCE $RP_Name
        if (Test-Path $RP_Source) {
            if (Test-Path $RP_DEST) {
                Remove-Item -Path $RP_DEST -Recurse -Force -ErrorAction SilentlyContinue
            }
            New-Item -ItemType Directory -Path $RP_DEST -Force | Out-Null
            Copy-Item -Path "$RP_Source\*" -Destination $RP_DEST -Recurse -Force
        }
        
        # Clean local client's server resource pack cache to force dynamic re-download on join 😤
        $CachePaths = @(
            "$env:LOCALAPPDATA\Packages\Microsoft.MinecraftUWP_8wekyb3d8bbwe\LocalState\games\com.mojang\server_resource_packs",
            "$env:LOCALAPPDATA\Packages\Microsoft.MinecraftWindowsBeta_8wekyb3d8bbwe\LocalState\games\com.mojang\server_resource_packs",
            "$env:APPDATA\Minecraft Bedrock\users\*\games\com.mojang\server_resource_packs",
            "$env:APPDATA\Minecraft Bedrock Preview\users\*\games\com.mojang\server_resource_packs"
        )
        foreach ($Path in $CachePaths) {
            if (Test-Path $Path) {
                Remove-Item -Path "$Path\*" -Recurse -Force -ErrorAction SilentlyContinue
                Ok "Cleared cache path: $Path"
            }
        }
        
        Ok "Packs (BP + RP) synced to BDS"
    } catch {
        Err "Sync failed: $_"
    }
}

# ── BDS process management ───────────────────────────────────
function Start-BDS {
    if ($script:bdsProcess -and !$script:bdsProcess.HasExited) {
        Info "Stopping BDS..."
        try {
            $script:bdsProcess.Kill()
            $script:bdsProcess.WaitForExit(3000) | Out-Null
        } catch { }
    }

    # Ensure no other bedrock_server processes are running (clean port bind)
    Kill-BDS-Processes -ExcludeProcess $script:bdsProcess

    Info "Starting BDS..."
    $psi = New-Object System.Diagnostics.ProcessStartInfo
    $psi.FileName  = $BDS_EXE
    $psi.WorkingDirectory = $BDS_ROOT
    $psi.UseShellExecute = $false
    $psi.RedirectStandardOutput = $true
    $psi.RedirectStandardError  = $true
    $psi.RedirectStandardInput  = $true

    $script:bdsProcess = New-Object System.Diagnostics.Process
    $script:bdsProcess.StartInfo = $psi

    # Filter BDS output - only show script/error relevant lines
    $outputAction = {
        $line = $Event.SourceEventArgs.Data
        if (!$line) { return }
        if ($line -match "Script|script|ERROR|error|WARN|warn|\[AE\]|Pack Stack|Server started|Exception|exception|scripting") {
            $color = "Gray"
            if ($line -match "ERROR|error|Exception|exception") { $color = "Red" }
            elseif ($line -match "WARN|warn") { $color = "Yellow" }
            elseif ($line -match "Server started|Pack Stack") { $color = "Green" }
            Write-Host "  [BDS] $line" -ForegroundColor $color
        }
    }

    Register-ObjectEvent -InputObject $script:bdsProcess -EventName "OutputDataReceived" -Action $outputAction | Out-Null
    Register-ObjectEvent -InputObject $script:bdsProcess -EventName "ErrorDataReceived"  -Action $outputAction | Out-Null

    $script:bdsProcess.Start() | Out-Null
    $script:bdsProcess.BeginOutputReadLine()
    $script:bdsProcess.BeginErrorReadLine()
    $script:lastRestartSec = [DateTimeOffset]::UtcNow.ToUnixTimeSeconds()

    Ok "BDS started (PID $($script:bdsProcess.Id))"
}

# ── File watcher (Polling) ───────────────────────────────────
function Get-Watched-Files {
    $files = @{}
    
    # 1. Behavior Pack files
    $BP_Files = @("manifest.json", "pack_icon.png", "scripts", "entities")
    foreach ($Item in $BP_Files) {
        $Source = Join-Path $BP_SOURCE $Item
        if (Test-Path $Source) {
            if (Test-Path $Source -PathType Container) {
                Get-ChildItem -Path $Source -Recurse -File | ForEach-Object {
                    if ($_.FullName -notmatch '\.(tmp|swp|bak)$') {
                        $files[$_.FullName] = $_.LastWriteTime.Ticks
                    }
                }
            } else {
                if ($Source -notmatch '\.(tmp|swp|bak)$') {
                    $files[(Get-Item $Source).FullName] = (Get-Item $Source).LastWriteTime.Ticks
                }
            }
        }
    }
    
    # 2. Resource Pack files
    $RP_Name = "AethelLib (RP)"
    $RP_Source = Join-Path $BP_SOURCE $RP_Name
    if (Test-Path $RP_Source) {
        Get-ChildItem -Path $RP_Source -Recurse -File | ForEach-Object {
            if ($_.FullName -notmatch '\.(tmp|swp|bak)$') {
                $files[$_.FullName] = $_.LastWriteTime.Ticks
            }
        }
    }
    
    return $files
}

# ── Main Watch Setup ─────────────────────────────────────────
$global:fileCache = Get-Watched-Files

Write-Host ""
Write-Host "  +------------------------------------------+" -ForegroundColor Green
Write-Host "  |  Aethelgrad Essentials - Dev Watcher     |" -ForegroundColor Green
Write-Host "  |                                          |" -ForegroundColor Green
Write-Host "  |  Save any file -> BDS auto restarts      |" -ForegroundColor Green
Write-Host "  |  Script errors appear here instantly     |" -ForegroundColor Green
Write-Host "  |                                          |" -ForegroundColor Green
Write-Host "  |  Connect: 127.0.0.1:19132               |" -ForegroundColor Green
Write-Host "  |  Ctrl+C to stop everything               |" -ForegroundColor Green
Write-Host "  +------------------------------------------+" -ForegroundColor Green
Write-Host ""

Sync-Packs
Start-Sleep -Milliseconds 500
Start-BDS

# ── Main loop ────────────────────────────────────────────────
try {
    while ($true) {
        Start-Sleep -Milliseconds 500

        # Check standard input to forward console commands to BDS asynchronously
        if (!$script:stdinClosed) {
            try {
                if ([System.Console]::KeyAvailable) {
                    $line = [System.Console]::ReadLine()
                    if ($null -ne $line -and $line.Trim() -ne "") {
                        if ($script:bdsProcess -and !$script:bdsProcess.HasExited) {
                            $script:bdsProcess.StandardInput.WriteLine($line)
                        }
                    }
                }
            } catch {
                # Stdin is likely redirected or closed
                $script:stdinClosed = $true
            }
        }

        # Poll for changes
        $currentFiles = Get-Watched-Files
        $changed = $false
        
        foreach ($filePath in $currentFiles.Keys) {
            if (!$global:fileCache.ContainsKey($filePath) -or $global:fileCache[$filePath] -ne $currentFiles[$filePath]) {
                $relative = $filePath.Substring($BP_SOURCE.Length)
                Write-Host "  [CHANGED] $relative" -ForegroundColor DarkCyan
                $changed = $true
            }
        }
        foreach ($filePath in $global:fileCache.Keys) {
            if (!$currentFiles.ContainsKey($filePath)) {
                $relative = $filePath.Substring($BP_SOURCE.Length)
                Write-Host "  [DELETED] $relative" -ForegroundColor DarkCyan
                $changed = $true
            }
        }
        
        if ($changed) {
            $global:fileCache = $currentFiles
            $script:pendingRestart = $true
            $script:lastChangeMs = [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()
        }

        if ($script:pendingRestart) {
            $nowMs   = [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()
            $elapsed = $nowMs - $script:lastChangeMs

            # Wait for debounce — no more saves for 800ms
            if ($elapsed -ge $DEBOUNCE_MS) {
                $nowSec = [DateTimeOffset]::UtcNow.ToUnixTimeSeconds()
                $secsSinceLast = $nowSec - $script:lastRestartSec
                if ($secsSinceLast -ge $RESTART_COOLDOWN) {
                    $script:pendingRestart = $false
                    Warn "Change detected - syncing and restarting BDS..."
                    Sync-Packs
                    Start-Sleep -Milliseconds 500
                    Start-BDS
                }
            }
        }

        # Auto-recover if BDS crashes
        if ($script:bdsProcess -and $script:bdsProcess.HasExited -and !$script:pendingRestart) {
            $code = $script:bdsProcess.ExitCode
            Err "BDS exited (code $code) - check errors above"
            Warn "Restarting in 3s..."
            Start-Sleep -Seconds 3
            Start-BDS
        }
    }
} finally {
    Warn "Shutting down..."
    if ($script:bdsProcess -and !$script:bdsProcess.HasExited) {
        $script:bdsProcess.Kill()
    }
    Warn "Done."
}
