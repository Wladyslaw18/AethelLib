@echo off
setlocal enabledelayedexpansion
chcp 65001 >nul 2>&1

cls
echo ==========================================================
echo            AETHELGRAD ADDON PACKAGER (DOS)
echo ==========================================================
echo   This script will:
echo   1. Sync current Behavior and Resource Pack files.
echo   2. Compile them into a clean .mcaddon archive.
echo   3. Save AethelLib.mcaddon at the workspace root.
echo ----------------------------------------------------------
echo   Press [ENTER] to execute packager ^| [Ctrl+C] to cancel
echo ==========================================================
pause >nul

:: Resolve paths (go up two levels from tools\dos\ to workspace root)
set "SCRIPT_DIR=%~dp0"
set "TOOLS_DIR=%SCRIPT_DIR%.."
set "PROJECT_ROOT=%TOOLS_DIR%\.."

:: Normalize the path
pushd "%PROJECT_ROOT%"
set "PROJECT_ROOT=%CD%"
popd

set "BUILD_DIR=%PROJECT_ROOT%\build"
set "OUT_FILE=%PROJECT_ROOT%\AethelLib.mcaddon"

echo [Packager] Cleaning build workspace...
if exist "%BUILD_DIR%" rmdir /s /q "%BUILD_DIR%"
if exist "%OUT_FILE%" del /q "%OUT_FILE%"
mkdir "%BUILD_DIR%\AethelLib_BP"
mkdir "%BUILD_DIR%\AethelLib_RP"

echo [Packager] Copying Behavior Pack assets...
for %%F in (manifest.json pack_icon.png) do (
    if exist "%PROJECT_ROOT%\%%F" copy /y "%PROJECT_ROOT%\%%F" "%BUILD_DIR%\AethelLib_BP\%%F" >nul
)
if exist "%PROJECT_ROOT%\scripts" xcopy /e /i /q "%PROJECT_ROOT%\scripts" "%BUILD_DIR%\AethelLib_BP\scripts" >nul
if exist "%PROJECT_ROOT%\entities" xcopy /e /i /q "%PROJECT_ROOT%\entities" "%BUILD_DIR%\AethelLib_BP\entities" >nul

echo [Packager] Copying Resource Pack assets...
if exist "%PROJECT_ROOT%\AethelLib (RP)" xcopy /e /i /q "%PROJECT_ROOT%\AethelLib (RP)" "%BUILD_DIR%\AethelLib_RP" >nul

echo [Packager] Compressing and packaging via PowerShell (standard ZIP, no ZIP64)...
powershell -ExecutionPolicy Bypass -Command ^
    "Add-Type -Assembly 'System.IO.Compression.FileSystem';" ^
    "$b='%BUILD_DIR%';" ^
    "$r='%PROJECT_ROOT%';" ^
    "$bp=\"$b\AethelLib_BP.mcpack\";" ^
    "$rp=\"$b\AethelLib_RP.mcpack\";" ^
    "[System.IO.Compression.ZipFile]::CreateFromDirectory(\"$b\AethelLib_BP\", $bp, [System.IO.Compression.CompressionLevel]::Optimal, $false);" ^
    "[System.IO.Compression.ZipFile]::CreateFromDirectory(\"$b\AethelLib_RP\", $rp, [System.IO.Compression.CompressionLevel]::Optimal, $false);" ^
    "$out=\"$r\AethelLib.mcaddon\";" ^
    "$fs=[System.IO.File]::Open($out,[System.IO.FileMode]::Create);" ^
    "$az=[System.IO.Compression.ZipArchive]::new($fs,[System.IO.Compression.ZipArchiveMode]::Create);" ^
    "foreach($p in @($bp,$rp)){" ^
    "  $e=$az.CreateEntry([System.IO.Path]::GetFileName($p),[System.IO.Compression.CompressionLevel]::Optimal);" ^
    "  $es=$e.Open(); $ps=[System.IO.File]::OpenRead($p); $ps.CopyTo($es); $ps.Dispose(); $es.Dispose()};" ^
    "$az.Dispose(); $fs.Dispose();"

rmdir /s /q "%BUILD_DIR%"

echo.
echo ==========================================
echo    BUILD SUCCESSFUL! AethelLib.mcaddon
echo ==========================================
echo.
