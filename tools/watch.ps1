# ============================================================
#  Aethelgrad Essentials - BDS Dev Watcher + Auto Restart
#  Save any file → syncs to BDS → restarts BDS automatically
#  NO more manual quit/rejoin cycle
# ============================================================

Clear-Host
Write-Host "==========================================================" -ForegroundColor Green
Write-Host "             AETHELGRAD HOT-RELOAD WATCHER                " -ForegroundColor White
Write-Host "==========================================================" -ForegroundColor Green
Write-Host "  This script will:" -ForegroundColor Gray
Write-Host "  1. Monitor behavior pack workspace files recursively." -ForegroundColor White
Write-Host "  2. Automatically sync file changes to BDS upon save." -ForegroundColor White
Write-Host "  3. Force-restart the bedrock server console dynamically." -ForegroundColor White
Write-Host "----------------------------------------------------------" -ForegroundColor DarkGray
Write-Host "  Press [ENTER] to start hot-watcher | [Ctrl+C] to cancel" -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Green
Read-Host | Out-Null


$PSScriptDir = $PSScriptRoot
$ProjectRoot = (Get-Item $PSScriptDir).Parent.FullName

$BP_SOURCE  = $ProjectRoot
$BDS_ROOT   = Join-Path $ProjectRoot "BDS"
$BP_DEST    = Join-Path $BDS_ROOT "development_behavior_packs\Aethelgrad Essentials"
$BDS_EXE    = Join-Path $BDS_ROOT "bedrock_server.exe"

$DEBOUNCE_MS      = 800   # ms to wait after last save before restarting
$RESTART_COOLDOWN = 5     # seconds minimum between restarts

# ── Helpers ─────────────────────────────────────────────────
function Info($m)    { Write-Host "[AE $(Get-Date -f HH:mm:ss)] $m" -ForegroundColor Cyan }
function Ok($m)      { Write-Host "[AE $(Get-Date -f HH:mm:ss)] $m" -ForegroundColor Green }
function Warn($m)    { Write-Host "[AE $(Get-Date -f HH:mm:ss)] $m" -ForegroundColor Yellow }
function Err($m)     { Write-Host "[AE $(Get-Date -f HH:mm:ss)] $m" -ForegroundColor Red }

# ── Validate ────────────────────────────────────────────────
if (!(Test-Path $BP_SOURCE)) { Err "BP source not found: $BP_SOURCE"; exit 1 }
if (!(Test-Path $BDS_EXE))   { Err "bedrock_server.exe not found: $BDS_EXE"; exit 1 }

# ── Create BP dest if needed ─────────────────────────────────
if (!(Test-Path $BP_DEST)) {
    New-Item -ItemType Directory -Path $BP_DEST -Force | Out-Null
    Ok "Created BP dest: $BP_DEST"
}

# ── Full sync function ────────────────────────────────────────
function Sync-BP {
    try {
        # Sync only behavior pack files, ignoring BDS folder, build folders, node_modules, etc.
        $BP_Files = @("manifest.json", "pack_icon.png", "scripts", "entities")
        foreach ($Item in $BP_Files) {
            $Source = Join-Path $BP_SOURCE $Item
            if (Test-Path $Source) {
                Copy-Item -Path $Source -Destination $BP_DEST -Recurse -Force
            }
        }
        Ok "BP synced to BDS"
    } catch {
        Err "Sync failed: $_"
    }
}

# ── BDS process management ───────────────────────────────────
$script:bdsProcess  = $null
$script:lastRestart = 0

function Start-BDS {
    if ($script:bdsProcess -and !$script:bdsProcess.HasExited) {
        Info "Stopping BDS..."
        try {
            $script:bdsProcess.Kill()
            $script:bdsProcess.WaitForExit(3000) | Out-Null
        } catch { }
    }

    Info "Starting BDS..."
    $psi = New-Object System.Diagnostics.ProcessStartInfo
    $psi.FileName  = $BDS_EXE
    $psi.WorkingDirectory = $BDS_ROOT
    $psi.UseShellExecute = $false
    $psi.RedirectStandardOutput = $true
    $psi.RedirectStandardError  = $true

    $script:bdsProcess = New-Object System.Diagnostics.Process
    $script:bdsProcess.StartInfo = $psi

    # Filter BDS output - only show script/error relevant lines
    $outputAction = {
        $line = $Event.SourceEventArgs.Data
        if (!$line) { return }
        if ($line -match "Script|script|ERROR|error|WARN|warn|\[AE\]|Pack Stack|Server started|Exception|exception|scripting") {
            $color = if ($line -match "ERROR|error|Exception|exception") { "Red" }
                     elseif ($line -match "WARN|warn") { "Yellow" }
                     elseif ($line -match "Server started|Pack Stack") { "Green" }
                     else { "Gray" }
            Write-Host "  [BDS] $line" -ForegroundColor $color
        }
    }

    Register-ObjectEvent -InputObject $script:bdsProcess -EventName "OutputDataReceived" -Action $outputAction | Out-Null
    Register-ObjectEvent -InputObject $script:bdsProcess -EventName "ErrorDataReceived"  -Action $outputAction | Out-Null

    $script:bdsProcess.Start() | Out-Null
    $script:bdsProcess.BeginOutputReadLine()
    $script:bdsProcess.BeginErrorReadLine()
    $script:lastRestart = [DateTimeOffset]::UtcNow.ToUnixTimeSeconds()

    Ok "BDS started (PID $($script:bdsProcess.Id))"
}

# ── Debounce state ───────────────────────────────────────────
$script:pendingRestart = $false
$script:lastChange     = 0

function Queue-Restart {
    $script:pendingRestart = $true
    $script:lastChange = [DateTime]::UtcNow.Ticks / 10000
}

# ── File watcher ─────────────────────────────────────────────
$watcher = New-Object System.IO.FileSystemWatcher
$watcher.Path = $BP_SOURCE
$watcher.Filter = "*.*"
$watcher.IncludeSubdirectories = $true
$watcher.NotifyFilter = [System.IO.NotifyFilters]::LastWrite -bor
                        [System.IO.NotifyFilters]::FileName  -bor
                        [System.IO.NotifyFilters]::DirectoryName
$watcher.EnableRaisingEvents = $true

$fileAction = {
    $fullPath = $Event.SourceEventArgs.FullPath
    if ($fullPath -match '\.(tmp|swp|bak)$') { return }
    # Ignore changes in build, backups, releases, and BDS folders
    if ($fullPath -match '\\(build|backups|releases|BDS|node_modules|\.git)\\' -or $fullPath -match '\\(build|backups|releases|BDS|node_modules|\.git)$') { return }
    if (Test-Path $fullPath -PathType Container) { return }
    $relative = $fullPath.Substring($using:BP_SOURCE.Length)
    Write-Host "  [CHANGED] $relative" -ForegroundColor DarkCyan
    Queue-Restart
}

Register-ObjectEvent $watcher "Changed" -Action $fileAction | Out-Null
Register-ObjectEvent $watcher "Created" -Action $fileAction | Out-Null
Register-ObjectEvent $watcher "Deleted" -Action $fileAction | Out-Null
Register-ObjectEvent $watcher "Renamed" -Action $fileAction | Out-Null

# ── Banner ───────────────────────────────────────────────────
Write-Host ""
Write-Host "  ╔══════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "  ║  Aethelgrad Essentials - Dev Watcher     ║" -ForegroundColor Green
Write-Host "  ║                                          ║" -ForegroundColor Green
Write-Host "  ║  Save any file -> BDS auto restarts      ║" -ForegroundColor Green
Write-Host "  ║  Script errors appear here instantly     ║" -ForegroundColor Green
Write-Host "  ║                                          ║" -ForegroundColor Green
Write-Host "  ║  Connect: 127.0.0.1:19132               ║" -ForegroundColor Green
Write-Host "  ║  Ctrl+C to stop everything               ║" -ForegroundColor Green
Write-Host "  ╚══════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""

# ── Initial sync + start ─────────────────────────────────────
Sync-BP
Start-BDS

# ── Main loop ────────────────────────────────────────────────
try {
    while ($true) {
        Start-Sleep -Milliseconds 200

        if ($script:pendingRestart) {
            $now     = [DateTime]::UtcNow.Ticks / 10000
            $elapsed = $now - $script:lastChange

            # Wait for debounce — no more saves for 800ms
            if ($elapsed -ge $DEBOUNCE_MS) {
                $secsSinceLast = [DateTimeOffset]::UtcNow.ToUnixTimeSeconds() - $script:lastRestart
                if ($secsSinceLast -ge $RESTART_COOLDOWN) {
                    $script:pendingRestart = $false
                    Warn "Change detected - syncing and restarting BDS..."
                    Sync-BP
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
    $watcher.EnableRaisingEvents = $false
    $watcher.Dispose()
    if ($script:bdsProcess -and !$script:bdsProcess.HasExited) {
        $script:bdsProcess.Kill()
    }
    Warn "Done."
}
