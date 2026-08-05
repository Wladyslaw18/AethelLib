# AETHELGRAD PAYLOAD SHIPPER (C++ WRAPPER)
# Compiles ship_payload.cpp to ship_payload.exe if compiler present, then executes at native C++ speed!

Clear-Host
$PSScriptDir = $PSScriptRoot
if (!$PSScriptDir) { $PSScriptDir = Split-Path $MyInvocation.MyCommand.Path -Parent }
$ToolsDir = if ($PSScriptDir -like "*tools*") { $PSScriptDir } else { Join-Path (Get-Item $PSScriptDir).FullName "tools" }
$CppFile = Join-Path $ToolsDir "ship_payload.cpp"
$ExeFile = Join-Path $ToolsDir "ship_payload.exe"

# Detect C++ compiler (g++, clang++, or MSVC cl.exe)
$Compiler = Get-Command "g++", "clang++", "cl" -ErrorAction SilentlyContinue | Select-Object -First 1

if ($Compiler -and (!(Test-Path $ExeFile) -or ((Get-Item $CppFile).LastWriteTime -gt (Get-Item $ExeFile).LastWriteTime))) {
    Write-Host "[C++ Compiler] Found $($Compiler.Name), building ship_payload.exe..." -ForegroundColor Cyan
    if ($Compiler.Name -eq "cl") {
        cl /EHsc /O2 /std:c++17 /Fe:"$ExeFile" "$CppFile" | Out-Null
    } else {
        & $Compiler.Name -O3 -std=c++17 "$CppFile" -o "$ExeFile"
    }
}

if (Test-Path $ExeFile) {
    Write-Host "[C++ Engine] Executing native binary ship_payload.exe..." -ForegroundColor Green
    Set-Location $ToolsDir
    & $ExeFile
} else {
    Write-Host "[Notice] Native compiler not in PATH. Running optimized .NET PowerShell engine..." -ForegroundColor Yellow
    & (Join-Path $ToolsDir "ship_payload.ps1")
}
