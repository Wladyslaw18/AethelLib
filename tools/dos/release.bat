@echo off
setlocal enabledelayedexpansion
chcp 65001 >nul 2>&1

cls
echo ==========================================================
echo           AETHELGRAD AUTO-RELEASE ENGINE (DOS)
echo ==========================================================
echo   This script will:
echo   1. Automatically increment the manifest version.
echo   2. Synchronize version arrays across all modules.
echo   3. Compile and build the Behavior ^& Resource Packs.
echo   4. Save backups and releases directly in your workspace.
echo ----------------------------------------------------------
echo   Press [ENTER] to execute release runner ^| [Ctrl+C] to cancel
echo ==========================================================
pause >nul

:: Resolve workspace root (two levels up from tools\dos\)
set "SCRIPT_DIR=%~dp0"
pushd "%SCRIPT_DIR%..\.."
set "PROJECT_ROOT=%CD%"
popd

set "BUILD_DIR=%PROJECT_ROOT%\build"
set "BACKUP_DIR=%PROJECT_ROOT%\backups"
set "RELEASE_DIR=%PROJECT_ROOT%\releases"
set "MANIFEST=%PROJECT_ROOT%\manifest.json"

if not exist "%BACKUP_DIR%" mkdir "%BACKUP_DIR%"
if not exist "%RELEASE_DIR%" mkdir "%RELEASE_DIR%"

echo ==========================================
echo      AETHELGRAD AUTO-RELEASE SYSTEM
echo ==========================================

:: Use PowerShell to handle JSON versioning and packaging
powershell -ExecutionPolicy Bypass -Command ^
    "Add-Type -Assembly 'System.IO.Compression.FileSystem';" ^
    "$root='%PROJECT_ROOT%';" ^
    "$mPath='%MANIFEST%';" ^
    "$m=Get-Content $mPath -Raw -Encoding utf8 | ConvertFrom-Json;" ^
    "$v=$m.header.version;" ^
    "$ma=[int]$v[0];$mi=[int]$v[1];$p=[int]$v[2];" ^
    "$old=\"$ma.$mi.$p\";" ^
    "if($p -lt 9){$p++}elseif($mi -lt 9){$p=0;$mi++}else{$p=0;$mi=0;$ma++};" ^
    "$new=\"$ma.$mi.$p\";" ^
    "Write-Host \"[Version] $old -> $new\" -ForegroundColor Green;" ^
    "$utf8=New-Object System.Text.UTF8Encoding($false);" ^
    "$mev=$m.header.min_engine_version -join ', ';" ^
    "$cleanJson=\"{`n    \`\"format_version\`\": $($m.format_version),`n    \`\"header\`\": {`n        \`\"name\`\": \`\"$($m.header.name)\`\",`n        \`\"description\`\": \`\"$($m.header.description)\`\",`n        \`\"uuid\`\": \`\"$($m.header.uuid)\`\",`n        \`\"version\`\": [$ma, $mi, $p],`n        \`\"min_engine_version\`\": [$mev],`n        \`\"license\`\": \`\"$($m.header.license)\`\"`n    },`n    \`\"modules\`\": [`n        {`n            \`\"description\`\": \`\"$($m.modules[0].description)\`\",`n            \`\"type\`\": \`\"$($m.modules[0].type)\`\",`n            \`\"uuid\`\": \`\"$($m.modules[0].uuid)\`\",`n            \`\"version\`\": [$ma, $mi, $p]`n        },`n        {`n            \`\"description\`\": \`\"$($m.modules[1].description)\`\",`n            \`\"language\`\": \`\"$($m.modules[1].language)\`\",`n            \`\"type\`\": \`\"$($m.modules[1].type)\`\",`n            \`\"uuid\`\": \`\"$($m.modules[1].uuid)\`\",`n            \`\"entry\`\": \`\"$($m.modules[1].entry)\`\",`n            \`\"version\`\": [$ma, $mi, $p]`n        }`n    ],`n    \`\"dependencies\`\": [`n        {`n            \`\"module_name\`\": \`\"$($m.dependencies[0].module_name)\`\",`n            \`\"version\`\": \`\"$($m.dependencies[0].version)\`\"`n        },`n        {`n            \`\"module_name\`\": \`\"$($m.dependencies[1].module_name)\`\",`n            \`\"version\`\": \`\"$($m.dependencies[1].version)\`\"`n        }`n    ]`n}\";" ^
    "[System.IO.File]::WriteAllText($mPath, $cleanJson, $utf8);" ^
    "$b=\"$root\build\";" ^
    "if(Test-Path $b){Remove-Item $b -Recurse -Force};" ^
    "New-Item \"$b\AethelLib_BP\" -ItemType Directory -Force|Out-Null;" ^
    "New-Item \"$b\AethelLib_RP\" -ItemType Directory -Force|Out-Null;" ^
    "Write-Host '[Packager] Copying BP assets...' -ForegroundColor Blue;" ^
    "foreach($f in @('manifest.json','pack_icon.png','scripts','entities')){" ^
    "  $s=\"$root\$f\";if(Test-Path $s){Copy-Item $s \"$b\AethelLib_BP\" -Recurse -Force}};" ^
    "Write-Host '[Packager] Copying RP assets...' -ForegroundColor Blue;" ^
    "$rps=\"$root\AethelLib (RP)\";" ^
    "if(Test-Path $rps){Copy-Item \"$rps\*\" \"$b\AethelLib_RP\" -Recurse -Force};" ^
    "Write-Host '[Packager] Compressing (standard ZIP, no ZIP64)...' -ForegroundColor Blue;" ^
    "$bp=\"$b\AethelLib_BP.mcpack\"; $rp=\"$b\AethelLib_RP.mcpack\";" ^
    "[System.IO.Compression.ZipFile]::CreateFromDirectory(\"$b\AethelLib_BP\", $bp, [System.IO.Compression.CompressionLevel]::Optimal, $false);" ^
    "[System.IO.Compression.ZipFile]::CreateFromDirectory(\"$b\AethelLib_RP\", $rp, [System.IO.Compression.CompressionLevel]::Optimal, $false);" ^
    "$staged=\"$b\AethelLib_staged.mcaddon\";" ^
    "$fs=[System.IO.File]::Open($staged,[System.IO.FileMode]::Create);" ^
    "$az=[System.IO.Compression.ZipArchive]::new($fs,[System.IO.Compression.ZipArchiveMode]::Create);" ^
    "foreach($pk in @($bp,$rp)){" ^
    "  $e=$az.CreateEntry([System.IO.Path]::GetFileName($pk),[System.IO.Compression.CompressionLevel]::Optimal);" ^
    "  $es=$e.Open();$ps=[System.IO.File]::OpenRead($pk);$ps.CopyTo($es);$ps.Dispose();$es.Dispose()};" ^
    "$az.Dispose();$fs.Dispose();" ^
    "$rel=\"$root\releases\AethelLib_v$new.mcaddon\";" ^
    "$bak=\"$root\backups\AethelLib_backup_v$new.mcaddon\";" ^
    "$dev=\"$root\AethelLib.mcaddon\";" ^
    "Copy-Item $staged $rel -Force;" ^
    "Copy-Item $staged $bak -Force;" ^
    "Copy-Item $staged $dev -Force;" ^
    "Remove-Item $b -Recurse -Force;" ^
    "Write-Host '';" ^
    "Write-Host '==========================================' -ForegroundColor Green;" ^
    "Write-Host \"   RELEASE BUILD v$new SUCCESSFUL!\" -ForegroundColor Green;" ^
    "Write-Host '==========================================' -ForegroundColor Green;"

echo.
