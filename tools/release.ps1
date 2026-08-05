# Aethelgrad Essentials - Auto-Release and Backup System
# Increments version, updates manifest.json, packages BP/RP, and saves backups/releases inside workspace.
# Uses System.IO.Compression.ZipFile to produce standard ZIP files that Minecraft accepts.

param(
    [switch]$NonInteractive,
    [switch]$AutoBump
)

[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
Add-Type -Assembly "System.IO.Compression.FileSystem" -ErrorAction SilentlyContinue

$PSScriptDir = $null
if ($PSScriptRoot) { $PSScriptDir = $PSScriptRoot } else { $PSScriptDir = Join-Path (Get-Location).Path "tools" }
$ToolsDir = if ($PSScriptDir -like "*tools*") { $PSScriptDir } else { Join-Path (Get-Item $PSScriptDir).Parent.FullName "tools" }
$ProjectRoot = (Get-Item $ToolsDir).Parent.FullName
$ManifestPath = Join-Path $ProjectRoot "manifest.json"

$OutputDir  = Join-Path $ProjectRoot "releases"
$ReleaseDir = Join-Path $ProjectRoot "releases"
$BackupDir  = Join-Path $ProjectRoot "backups"
$BuildDir   = Join-Path $ProjectRoot "build"

# Ensure output directories exist
if (!(Test-Path $OutputDir))  { New-Item -ItemType Directory -Path $OutputDir -Force | Out-Null }
if (!(Test-Path $BackupDir))  { New-Item -ItemType Directory -Path $BackupDir -Force | Out-Null }
if (!(Test-Path $ReleaseDir)) { New-Item -ItemType Directory -Path $ReleaseDir -Force | Out-Null }

Write-Host "==========================================" -ForegroundColor Yellow
Write-Host "     AETHELGRAD AUTO-RELEASE SYSTEM       " -ForegroundColor White
Write-Host "==========================================" -ForegroundColor Yellow

if (!$NonInteractive -and ([Console]::IsInputRedirected -eq $false) -and $Host.Name -eq 'ConsoleHost') {
    Write-Host "  Press [ENTER] to execute release runner | [Ctrl+C] to cancel" -ForegroundColor Gray
    try { $null = Read-Host } catch {}
}

# 1. READ VERSION (and optionally increment it)
if (!(Test-Path $ManifestPath)) {
    Write-Error "manifest.json not found in workspace!"
    exit 1
}

$ManifestContent = [System.IO.File]::ReadAllText($ManifestPath, [System.Text.Encoding]::UTF8)
$Manifest = ConvertFrom-Json $ManifestContent

$Version = $Manifest.header.version
$Major = [int]$Version[0]
$Minor = [int]$Version[1]
$Patch = [int]$Version[2]

$CurrentVersionStr = "$Major.$Minor.$Patch"

Write-Host ""
Write-Host "----------------------------------------------------------" -ForegroundColor DarkGray
Write-Host "  Current version: " -NoNewline -ForegroundColor Gray
Write-Host $CurrentVersionStr -ForegroundColor Yellow

$ShouldBump = $false
if ($AutoBump) {
    $ShouldBump = $true
} elseif ($NonInteractive -or [Console]::IsInputRedirected -or $Host.Name -ne 'ConsoleHost') {
    $ShouldBump = $false
} else {
    Write-Host "  Bump manifest version? [Y/n]: " -NoNewline -ForegroundColor Gray
    try {
        $Choice = Read-Host
        if ($Choice -eq "" -or $Choice -match "^[Yy]") {
            $ShouldBump = $true
        }
    } catch {
        $ShouldBump = $false
    }
}

if ($ShouldBump) {
    if ($Patch -lt 9) {
        $Patch++
    } elseif ($Minor -lt 9) {
        $Patch = 0
        $Minor++
    } else {
        $Patch = 0
        $Minor = 0
        $Major++
    }

    $NewVersionStr = "$Major.$Minor.$Patch"
    $NewVersionArray = @($Major, $Minor, $Patch)

    Write-Host "[Version] Bumping: $CurrentVersionStr -> $NewVersionStr" -ForegroundColor Green

    # Update manifest version properties in memory
    $Manifest.header.version = $NewVersionArray
    if ($Manifest.modules) {
        foreach ($Module in $Manifest.modules) {
            $Module.version = $NewVersionArray
        }
    }

    $CleanJson = ConvertTo-Json $Manifest -Depth 10
    $CleanJson = $CleanJson -replace '\[\s+(\d+),\s+(\d+),\s+(\d+)\s+\]', '[$1, $2, $3]'
    $Utf8NoBom = New-Object System.Text.UTF8Encoding($false)
    [System.IO.File]::WriteAllText($ManifestPath, $CleanJson, $Utf8NoBom)
} else {
    $NewVersionStr = $CurrentVersionStr
    Write-Host "[Version] Keeping version v$NewVersionStr" -ForegroundColor Yellow
}

# 2. BUILD WORKSPACE CLEANUP
Write-Host "[Packager] Cleaning build workspace..." -ForegroundColor Blue
if (Test-Path $BuildDir) { 
    Remove-Item -Path $BuildDir -Recurse -Force -ErrorAction SilentlyContinue 
}
New-Item -ItemType Directory -Path $BuildDir -Force | Out-Null

$BP_Temp = Join-Path $BuildDir "AethelLib_BP"
$RP_Temp = Join-Path $BuildDir "AethelLib_RP"
New-Item -ItemType Directory -Path $BP_Temp -Force | Out-Null
New-Item -ItemType Directory -Path $RP_Temp -Force | Out-Null

# Copy Behavior Pack assets
Write-Host "[Packager] Copying Behavior Pack assets..." -ForegroundColor Blue
$BP_Files = @("manifest.json", "pack_icon.png", "scripts", "entities", "LICENSE", "ACL.md")
foreach ($Item in $BP_Files) {
    $Source = Join-Path $ProjectRoot $Item
    if (Test-Path $Source) {
        Copy-Item -Path $Source -Destination $BP_Temp -Recurse -Force
    }
}

# Copy Resource Pack assets
Write-Host "[Packager] Copying Resource Pack assets..." -ForegroundColor Blue
$RP_Source = Join-Path $ProjectRoot "AethelLib (RP)"
if (Test-Path $RP_Source) {
    Copy-Item -Path "$RP_Source\*" -Destination $RP_Temp -Recurse -Force
}

# Copy licenses to Resource Pack
$LicenseFiles = @("LICENSE", "ACL.md")
foreach ($License in $LicenseFiles) {
    $Source = Join-Path $ProjectRoot $License
    if (Test-Path $Source) {
        Copy-Item -Path $Source -Destination $RP_Temp -Force
    }
}

# Compress packs using ZipFile (clean old packs first to prevent IOException)
Write-Host "[Packager] Compressing Packs..." -ForegroundColor Blue
$BP_Pack = Join-Path $BuildDir "AethelLib_BP.mcpack"
$RP_Pack = Join-Path $BuildDir "AethelLib_RP.mcpack"

if (Test-Path $BP_Pack) { Remove-Item -Path $BP_Pack -Force }
if (Test-Path $RP_Pack) { Remove-Item -Path $RP_Pack -Force }

[System.IO.Compression.ZipFile]::CreateFromDirectory($BP_Temp, $BP_Pack, [System.IO.Compression.CompressionLevel]::Optimal, $false)
[System.IO.Compression.ZipFile]::CreateFromDirectory($RP_Temp, $RP_Pack, [System.IO.Compression.CompressionLevel]::Optimal, $false)

# Package final .mcaddon
Write-Host "[Packager] Packaging final .mcaddon..." -ForegroundColor Blue
$AddonTemp = Join-Path $BuildDir "AethelLib_staged.mcaddon"
if (Test-Path $AddonTemp) { Remove-Item -Path $AddonTemp -Force }

$AddonStream = [System.IO.File]::Open($AddonTemp, [System.IO.FileMode]::Create)
$AddonZip    = [System.IO.Compression.ZipArchive]::new($AddonStream, [System.IO.Compression.ZipArchiveMode]::Create)

foreach ($Pack in @($BP_Pack, $RP_Pack)) {
    $EntryName   = [System.IO.Path]::GetFileName($Pack)
    $Entry       = $AddonZip.CreateEntry($EntryName, [System.IO.Compression.CompressionLevel]::Optimal)
    $EntryStream = $Entry.Open()
    $PackStream  = [System.IO.File]::OpenRead($Pack)
    $PackStream.CopyTo($EntryStream)
    $PackStream.Dispose()
    $EntryStream.Dispose()
}

$AddonZip.Dispose()
$AddonStream.Dispose()

# Define Release and Backup file paths
$ReleaseFile = Join-Path $ReleaseDir "AethelLib_v$NewVersionStr.mcaddon"
$BackupFile  = Join-Path $BackupDir  "AethelLib_backup_v$NewVersionStr.mcaddon"
$DevFile     = Join-Path $OutputDir  "AethelLib.mcaddon"

Copy-Item -Path $AddonTemp -Destination $ReleaseFile -Force
Copy-Item -Path $AddonTemp -Destination $BackupFile  -Force
Copy-Item -Path $AddonTemp -Destination $DevFile     -Force

# Cleanup temp build directory
Remove-Item -Path $BuildDir -Recurse -Force -ErrorAction SilentlyContinue

Write-Host "==========================================" -ForegroundColor Green
Write-Host "   RELEASE BUILD v$NewVersionStr SUCCESSFUL!   " -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Green
Write-Host "  -> Release: $ReleaseFile" -ForegroundColor Cyan
Write-Host "  -> Backup:  $BackupFile" -ForegroundColor Cyan
Write-Host "  -> Dev:     $DevFile" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Green
