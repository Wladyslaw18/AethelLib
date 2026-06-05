@echo off
setlocal enabledelayedexpansion
chcp 65001 >nul 2>&1

:: Resolve paths (go up two levels from tools\dos\ to workspace root)
set "SCRIPT_DIR=%~dp0"
set "TOOLS_DIR=%SCRIPT_DIR%.."
set "PROJECT_ROOT=%TOOLS_DIR%\.."

:: Normalize the path
pushd "%PROJECT_ROOT%"
set "PROJECT_ROOT=%CD%"
popd

:: Parse parameters
set "CHANNEL=%~1"
if "!CHANNEL!"=="" set "CHANNEL=BETA"

set "VERSION=%~2"

:: Launch the PowerShell linter script forwarding parameters
powershell -NoProfile -ExecutionPolicy Bypass -File "%TOOLS_DIR%\lint_mojang.ps1" -Channel !CHANNEL! -Version "!VERSION!"
