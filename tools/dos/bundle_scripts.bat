@echo off
setlocal enabledelayedexpansion
chcp 65001 >nul 2>&1

cls
echo ==========================================================
echo            AETHELGRAD SCRIPT BUNDLER (DOS)
echo ==========================================================
echo   This script will:
echo   1. Scan the tools\dos folder for all batch scripts (*.bat).
echo   2. Read their contents, including this bundler script.
echo   3. Generate a single clean TXT file containing all code.
echo ----------------------------------------------------------
echo   Press [ENTER] to execute bundle creation ^| [Ctrl+C] to cancel
echo ==========================================================
pause >nul

set "OUTPUT_DIR=%~dp0..\Output"
if not exist "%OUTPUT_DIR%" mkdir "%OUTPUT_DIR%"
set "OUTPUT_FILE=%OUTPUT_DIR%\dos_scripts_bundle.txt"

echo [Bundler] Scanning dos directory: %~dp0
echo [Bundler] Creating bundle...

echo ================================================================================ > "%OUTPUT_FILE%"
echo AETHELGRAD ESSENTIALS - DOS TOOLS SCRIPTS BUNDLE >> "%OUTPUT_FILE%"
echo Generated on: %date% %time% >> "%OUTPUT_FILE%"
echo ================================================================================ >> "%OUTPUT_FILE%"
echo. >> "%OUTPUT_FILE%"

for %%F in ("%~dp0*.bat") do (
    echo [Bundler] Processing tools/dos/%%~nxF...
    
    echo ================================================================================ >> "%OUTPUT_FILE%"
    echo SCRIPT: %%~nxF >> "%OUTPUT_FILE%"
    echo PATH: tools/dos/%%~nxF >> "%OUTPUT_FILE%"
    echo ================================================================================ >> "%OUTPUT_FILE%"
    echo. >> "%OUTPUT_FILE%"
    
    type "%%F" >> "%OUTPUT_FILE%"
    echo. >> "%OUTPUT_FILE%"
    echo. >> "%OUTPUT_FILE%"
)

echo ==========================================================
echo   SUCCESS: Bundle created at:
echo   %OUTPUT_FILE%
echo ==========================================================
