# Aethelgrad Essentials - Auto-Release and Backup System
# Increments version, updates manifest.json, packages BP/RP, and saves backups/releases inside the workspace.
# Uses System.IO.Compression.ZipFile instead of Compress-Archive to produce standard ZIP files
# that Minecraft's importer accepts (Compress-Archive creates ZIP64 which MC rejects).

Clear-Host
Write-Host "==========================================================" -ForegroundColor Yellow
Write-Host "             AETHELGRAD AUTO-RELEASE ENGINE               " -ForegroundColor White
Write-Host "==========================================================" -ForegroundColor Yellow
Write-Host "  This script will:" -ForegroundColor Gray
Write-Host "  1. [Optional] Increment the manifest version (odometer)." -ForegroundColor White
Write-Host "  2. Compile and build the Behavior & Resource Pack files." -ForegroundColor White
Write-Host "  3. Save backups and releases directly in your workspace." -ForegroundColor White
Write-Host "----------------------------------------------------------" -ForegroundColor DarkGray
Write-Host "  Press [ENTER] to execute release runner | [Ctrl+C] to cancel" -ForegroundColor Yellow
Write-Host "==========================================================" -ForegroundColor Yellow
Read-Host | Out-Null

Add-Type -Assembly "System.IO.Compression.FileSystem"

$PSScriptDir = $PSScriptRoot
$ProjectRoot = (Get-Item $PSScriptDir).Parent.FullName
$ManifestPath = Join-Path $ProjectRoot "manifest.json"

$BackupDir = Join-Path $ProjectRoot "backups"
$ReleaseDir = Join-Path $ProjectRoot "releases"
$BuildDir = Join-Path $ProjectRoot "build"

# Ensure output directories exist
if (!(Test-Path $BackupDir)) { New-Item -ItemType Directory -Path $BackupDir -Force | Out-Null }
if (!(Test-Path $ReleaseDir)) { New-Item -ItemType Directory -Path $ReleaseDir -Force | Out-Null }

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "     AETHELGRAD AUTO-RELEASE SYSTEM       " -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

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

# Ask whether to bump the version or keep it as-is
Write-Host ""
Write-Host "----------------------------------------------------------" -ForegroundColor DarkGray
Write-Host "  Current version: " -NoNewline -ForegroundColor Gray
Write-Host $CurrentVersionStr -ForegroundColor Yellow
Write-Host "  Bump manifest version? " -NoNewline -ForegroundColor Gray
Write-Host "[Y]" -NoNewline -ForegroundColor Green
Write-Host "/" -NoNewline -ForegroundColor DarkGray
Write-Host "[n]" -ForegroundColor Red
Write-Host "----------------------------------------------------------" -ForegroundColor DarkGray
$BumpChoice = ""
if ($Host -and $Host.UI -and $Host.UI.RawUI -and $Host.Name -eq 'ConsoleHost' -and -not [Console]::IsInputRedirected) {
    while ($Host.UI.RawUI.KeyAvailable) {
        $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
    }
    $Key = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
    # Handle Ctrl+C
    if ($Key.VirtualKeyCode -eq 3 -or ($Key.VirtualKeyCode -eq 67 -and ($Key.ControlKeyState -match "LeftCtrl|RightCtrl"))) {
        Write-Host ""
        Write-Error "Operation cancelled by user."
        exit 1
    }
    $BumpChoice = $Key.Character
    if ([int]$Key.Character -eq 13) {
        $BumpChoice = ""
    }
    if ($BumpChoice -ne "") {
        Write-Host $BumpChoice
    } else {
        Write-Host ""
    }
} else {
    $BumpChoice = Read-Host
}

if ($BumpChoice -eq "" -or $BumpChoice -match "^[Yy]") {
    # Increment logic (Base-10 Odometer roll-over)
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

    # Update manifest in memory
    $Manifest.header.version = $NewVersionArray
    foreach ($Module in $Manifest.modules) {
        $Module.version = $NewVersionArray
    }

    # Serialize manifest back to file with clean standard formatting
    $Utf8NoBom = New-Object System.Text.UTF8Encoding($false)
    $ManifestObj = [ordered]@{
        format_version = $Manifest.format_version
        header = [ordered]@{
            name = $Manifest.header.name
            description = $Manifest.header.description
            uuid = $Manifest.header.uuid
            version = $NewVersionArray
            min_engine_version = $Manifest.header.min_engine_version
            license = $Manifest.header.license
        }
        modules = @(
            [ordered]@{
                description = $Manifest.modules[0].description
                type = $Manifest.modules[0].type
                uuid = $Manifest.modules[0].uuid
                version = $NewVersionArray
            },
            [ordered]@{
                description = $Manifest.modules[1].description
                language = $Manifest.modules[1].language
                type = $Manifest.modules[1].type
                uuid = $Manifest.modules[1].uuid
                entry = $Manifest.modules[1].entry
                version = $NewVersionArray
            }
        )
        dependencies = @(
            [ordered]@{
                module_name = $Manifest.dependencies[0].module_name
                version = $Manifest.dependencies[0].version
            },
            [ordered]@{
                module_name = $Manifest.dependencies[1].module_name
                version = $Manifest.dependencies[1].version
            }
        )
    }

    $CleanJson = ConvertTo-Json $ManifestObj -Depth 10
    # Clean up array formatting to keep version arrays single-line
    $CleanJson = $CleanJson -replace '\[\s+(\d+),\s+(\d+),\s+(\d+)\s+\]', '[$1, $2, $3]'
    [System.IO.File]::WriteAllText($ManifestPath, $CleanJson, $Utf8NoBom)
} else {
    $NewVersionStr = $CurrentVersionStr
    Write-Host "[Version] Skipping bump - keeping v$NewVersionStr" -ForegroundColor Yellow
}

# 2. RUN BUILD & COMPRESS
Write-Host "[Packager] Cleaning build workspace..." -ForegroundColor Blue
if (Test-Path $BuildDir) { Remove-Item -Path $BuildDir -Recurse -Force }
New-Item -ItemType Directory -Path $BuildDir -Force | Out-Null

$BP_Temp = Join-Path $BuildDir "AethelLib_BP"
$RP_Temp = Join-Path $BuildDir "AethelLib_RP"
New-Item -ItemType Directory -Path $BP_Temp -Force | Out-Null
New-Item -ItemType Directory -Path $RP_Temp -Force | Out-Null

# Copy Behavior Pack assets
Write-Host "[Packager] Copying Behavior Pack assets..." -ForegroundColor Blue
$BP_Files = @("manifest.json", "pack_icon.png", "scripts", "entities")
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

# Compress packs using ZipFile (standard ZIP, not ZIP64)
Write-Host "[Packager] Compressing Packs..." -ForegroundColor Blue
$BP_Pack = Join-Path $BuildDir "AethelLib_BP.mcpack"
$RP_Pack = Join-Path $BuildDir "AethelLib_RP.mcpack"

[System.IO.Compression.ZipFile]::CreateFromDirectory($BP_Temp, $BP_Pack, [System.IO.Compression.CompressionLevel]::Optimal, $false)
[System.IO.Compression.ZipFile]::CreateFromDirectory($RP_Temp, $RP_Pack, [System.IO.Compression.CompressionLevel]::Optimal, $false)

# Package final .mcaddon (zip containing both .mcpack files)
Write-Host "[Packager] Packaging final .mcaddon..." -ForegroundColor Blue
$AddonTemp   = Join-Path $BuildDir "AethelLib_staged.mcaddon"
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
$DevFile     = Join-Path $ProjectRoot "AethelLib.mcaddon"

# Copy to all destinations
Copy-Item -Path $AddonTemp -Destination $ReleaseFile -Force
Copy-Item -Path $AddonTemp -Destination $BackupFile  -Force
Copy-Item -Path $AddonTemp -Destination $DevFile     -Force

# Cleanup
Remove-Item -Path $BuildDir -Recurse -Force

Write-Host "==========================================" -ForegroundColor Green
Write-Host "   RELEASE BUILD v$NewVersionStr SUCCESSFUL!   " -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Green
Write-Host "  -> Release: $ReleaseFile" -ForegroundColor Cyan
Write-Host "  -> Backup:  $BackupFile" -ForegroundColor Cyan
Write-Host "  -> Dev:     $DevFile" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Green
