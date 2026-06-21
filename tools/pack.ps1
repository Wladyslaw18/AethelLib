# Aethelgrad Essentials - Addon Packager
# Builds clean, production-ready .mcpack files and compiles them into a single .mcaddon file in the workspace root.
# Uses System.IO.Compression.ZipFile instead of Compress-Archive to produce standard ZIP files
# that Minecraft's importer accepts (Compress-Archive creates ZIP64 which MC rejects).

Clear-Host
Write-Host "==========================================================" -ForegroundColor Green
Write-Host "               AETHELGRAD ADDON PACKAGER                  " -ForegroundColor White
Write-Host "==========================================================" -ForegroundColor Green
Write-Host "  This script will:" -ForegroundColor Gray
Write-Host "  1. Sync current Behavior and Resource Pack files." -ForegroundColor White
Write-Host "  2. Compile them into a clean .mcaddon archive." -ForegroundColor White
Write-Host "  3. Save AethelLib.mcaddon at the workspace root." -ForegroundColor White
Write-Host "----------------------------------------------------------" -ForegroundColor DarkGray
Write-Host "  Press [ENTER] to execute packager | [Ctrl+C] to cancel" -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Green
Read-Host | Out-Null

Add-Type -Assembly "System.IO.Compression.FileSystem"

$PSScriptDir = $PSScriptRoot
$ProjectRoot = (Get-Item $PSScriptDir).Parent.FullName
$BuildDir    = Join-Path $ProjectRoot "build"
$OutFile     = Join-Path $ProjectRoot "AethelLib.mcaddon"

Write-Host "[Packager] Cleaning build workspace..." -ForegroundColor Blue
if (Test-Path $BuildDir) { Remove-Item -Path $BuildDir -Recurse -Force }
if (Test-Path $OutFile)  { Remove-Item -Path $OutFile -Force }
New-Item -ItemType Directory -Path $BuildDir -Force | Out-Null

$BP_Temp = Join-Path $BuildDir "AethelLib_BP"
$RP_Temp = Join-Path $BuildDir "AethelLib_RP"
New-Item -ItemType Directory -Path $BP_Temp -Force | Out-Null
New-Item -ItemType Directory -Path $RP_Temp -Force | Out-Null

# 1. Copy Behavior Pack assets
Write-Host "[Packager] Copying Behavior Pack assets..." -ForegroundColor Cyan
$BP_Files = @("manifest.json", "pack_icon.png", "scripts", "entities", "LICENSE", "ACL.md")
foreach ($Item in $BP_Files) {
    $Source = Join-Path $ProjectRoot $Item
    if (Test-Path $Source) {
        Copy-Item -Path $Source -Destination $BP_Temp -Recurse -Force
    }
}

# 2. Copy Resource Pack assets
Write-Host "[Packager] Copying Resource Pack assets..." -ForegroundColor Cyan
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

# 3. Create .mcpack files using ZipFile (produces standard ZIP, not ZIP64)
Write-Host "[Packager] Compressing Packs..." -ForegroundColor Cyan
$BP_Pack = Join-Path $BuildDir "AethelLib_BP.mcpack"
$RP_Pack = Join-Path $BuildDir "AethelLib_RP.mcpack"

[System.IO.Compression.ZipFile]::CreateFromDirectory($BP_Temp, $BP_Pack, [System.IO.Compression.CompressionLevel]::Optimal, $false)
[System.IO.Compression.ZipFile]::CreateFromDirectory($RP_Temp, $RP_Pack, [System.IO.Compression.CompressionLevel]::Optimal, $false)

# 4. Create final .mcaddon (a zip containing both .mcpack files)
Write-Host "[Packager] Creating final AethelLib.mcaddon..." -ForegroundColor Green
$AddonStream = [System.IO.File]::Open($OutFile, [System.IO.FileMode]::Create)
$AddonZip    = [System.IO.Compression.ZipArchive]::new($AddonStream, [System.IO.Compression.ZipArchiveMode]::Create)

foreach ($Pack in @($BP_Pack, $RP_Pack)) {
    $EntryName = [System.IO.Path]::GetFileName($Pack)
    $Entry     = $AddonZip.CreateEntry($EntryName, [System.IO.Compression.CompressionLevel]::Optimal)
    $EntryStream = $Entry.Open()
    $PackStream  = [System.IO.File]::OpenRead($Pack)
    $PackStream.CopyTo($EntryStream)
    $PackStream.Dispose()
    $EntryStream.Dispose()
}

$AddonZip.Dispose()
$AddonStream.Dispose()

# 5. Cleanup temp directory
Remove-Item -Path $BuildDir -Recurse -Force

Write-Host "[Packager] Build successful! Addon packaged at: $OutFile" -ForegroundColor Green

