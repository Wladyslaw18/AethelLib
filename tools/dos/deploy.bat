@echo off
setlocal enabledelayedexpansion
chcp 65001 >nul 2>&1

cls
echo ==========================================================
echo            AETHELGRAD DUAL-DEPLOYER (DOS)
echo ==========================================================
echo   This script will:
echo   1. Sync Behavior Pack into local BDS development folder.
echo   2. Sync Resource Pack into local BDS development folder.
echo ----------------------------------------------------------
echo   Press [ENTER] to execute deployment ^| [Ctrl+C] to cancel
echo ==========================================================
pause >nul

:: Resolve workspace root
pushd "%~dp0..\.."
set "PROJECT_ROOT=%CD%"
popd

set "BP_NAME=Aethelgrad Essentials"
set "RP_NAME=AethelLib (RP)"
set "BDS=%PROJECT_ROOT%\BDS"
set "BP_DEST=%BDS%\development_behavior_packs\%BP_NAME%"
set "RP_DEST=%BDS%\development_resource_packs\%RP_NAME%"

echo [Aethelgrad] Syncing BP to BDS...
if exist "%BP_DEST%" rmdir /s /q "%BP_DEST%"
mkdir "%BP_DEST%"

for %%F in (manifest.json pack_icon.png) do (
    if exist "%PROJECT_ROOT%\%%F" copy /y "%PROJECT_ROOT%\%%F" "%BP_DEST%\%%F" >nul
)
if exist "%PROJECT_ROOT%\scripts" xcopy /e /i /q "%PROJECT_ROOT%\scripts" "%BP_DEST%\scripts" >nul
if exist "%PROJECT_ROOT%\entities" xcopy /e /i /q "%PROJECT_ROOT%\entities" "%BP_DEST%\entities" >nul

echo [Aethelgrad] Syncing RP to BDS...
if exist "%RP_DEST%" rmdir /s /q "%RP_DEST%"
mkdir "%RP_DEST%"

if exist "%PROJECT_ROOT%\%RP_NAME%" (
    xcopy /e /i /q "%PROJECT_ROOT%\%RP_NAME%" "%RP_DEST%" >nul
)

echo.
echo [Aethelgrad] Dual-Sync Complete! Packs deployed.
echo.
