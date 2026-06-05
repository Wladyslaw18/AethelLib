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

:: Launch the PowerShell watcher script
powershell -NoProfile -ExecutionPolicy Bypass -File "%TOOLS_DIR%\watch.ps1"
