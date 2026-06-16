# AethelLib RP Pack Linter
# Validates JSON UI files, textures, and script UI API usage

param(
    [string]$RpPath = "",
    [switch]$Fix
)

$ScriptDir = Split-Path -Parent $PSScriptRoot
if (!$RpPath) { $RpPath = Join-Path $ScriptDir "AethelLib (RP)" }

$UiFolder = Join-Path $RpPath "ui"
$TexFolder = Join-Path $RpPath "textures"
$DefsFile = Join-Path $UiFolder "_ui_defs.json"

$errs = 0
$warns = 0

function LogError($file, $msg) { $script:errs++; Write-Host "  ERROR [$file] $msg" -Foreground Red }
function LogWarn($file, $msg)  { $script:warns++; Write-Host "  WARN  [$file] $msg" -Foreground Yellow }
function LogOK($msg)           { Write-Host "  OK    $msg" -Foreground Green }

Write-Host "=== AethelLib RP LINTER ===" -Foreground Cyan
Write-Host "RP: $RpPath" -Foreground Gray
Write-Host ""

# 1. _ui_defs.json
Write-Host "-- 1. _ui_defs.json --" -Foreground Magenta
if (!(Test-Path $DefsFile)) {
    LogError "_ui_defs.json" "MISSING"
} else {
    try {
        $json = Get-Content $DefsFile -Raw | ConvertFrom-Json
        foreach ($f in $json.ui_defs) {
            $fp = Join-Path $RpPath $f
            if (!(Test-Path $fp)) { LogError $f "Declared but FILE NOT FOUND" }
        }
        Get-ChildItem $UiFolder -Filter "*.json" | Where-Object { $_.Name -ne "_ui_defs.json" } | ForEach-Object {
            $rel = "ui/" + $_.Name
            if ($rel -notin $json.ui_defs) { LogWarn $_.Name "Not declared in _ui_defs.json" }
        }
        LogOK ("Loaded: " + $json.ui_defs.Count + " files declared")
    } catch { LogError "_ui_defs.json" "INVALID JSON: $_" }
}

# 2. Validate each JSON UI file
Write-Host ""
Write-Host "-- 2. JSON UI Files --" -Foreground Magenta
Get-ChildItem $UiFolder -Filter "*.json" | Where-Object { $_.Name -ne "_ui_defs.json" } | ForEach-Object {
    $fn = $_.Name
    Write-Host "  File: $fn" -Foreground Gray
    try {
        $raw = Get-Content $_.FullName -Raw
        $obj = $raw | ConvertFrom-Json
        if (!$obj.namespace) { LogError $fn "Missing namespace" }
        else { LogOK ("namespace: " + $obj.namespace) }
        
        # Find texture references
        $texRefs = [regex]::Matches($raw, '"texture"\s*:\s*"([^"]+)"')
        foreach ($m in $texRefs) {
            $texPath = $m.Groups[1].Value
            # Remove .png if present, add it, check
            $basePath = $texPath -replace '\.png$',''
            $fullTex = Join-Path $TexFolder ($basePath -replace '^textures/','') + ".png"
            if (!(Test-Path $fullTex)) {
                LogWarn $fn ("Missing texture: " + $texPath + " (not found at textures/)")
            }
        }
        
        # Find cross-file @namespace refs
        $xrefs = [regex]::Matches($raw, '@([a-zA-Z_][a-zA-Z0-9_]*)\.')
        foreach ($m in $xrefs) {
            $ns = $m.Groups[1].Value
            if ($ns -eq "common" -or $ns -eq "common_dialogs") { continue }
            $found = $false
            Get-ChildItem $UiFolder -Filter "*.json" | Where-Object { $_.Name -ne $fn } | ForEach-Object {
                $c = Get-Content $_.FullName -Raw
                if ($c -match '"namespace"\s*:\s*"' + [regex]::Escape($ns) + '"') { $found = $true }
            }
            if (!$found) { LogWarn $fn ("Unknown namespace reference: @" + $ns) }
        }
    } catch { LogError $fn ("INVALID JSON: $_") }
}

# 3. Textures
Write-Host ""
Write-Host "-- 3. Textures --" -Foreground Magenta
if (Test-Path $TexFolder) {
    $count = (Get-ChildItem $TexFolder -Recurse -Filter "*.png" | Measure-Object).Count
    LogOK ("textures/ exists with " + $count + " PNGs")
} else {
    LogWarn "ROOT" "No textures/ folder found"
}

# 4. Script API Validation
Write-Host ""
Write-Host "-- 4. Script UI API --" -Foreground Magenta
$idxFiles = @(
    (Join-Path $ScriptDir "IndexUIBeta2.1.0.txt"),
    (Join-Path $ScriptDir "index.UId.txt")
)
$indexFile = $null
foreach ($if in $idxFiles) { if (Test-Path $if) { $indexFile = $if; break } }

if ($indexFile) {
    $idxContent = Get-Content $indexFile -Raw
    LogOK ("Using index: " + (Split-Path $indexFile -Leaf))
    
    $scriptFiles = Get-ChildItem (Join-Path $ScriptDir "scripts") -Recurse -Filter "*.js"
    $methodNames = @("title","body","button","divider","header","label","show","submitButton","slider","toggle","dropdown","textField")
    $usedMethods = @{}
    
    foreach ($sf in $scriptFiles) {
        $sc = Get-Content $sf.FullName -Raw
        foreach ($mn in $methodNames) {
            if ($sc -match "\." + $mn + "\(") {
                if (!$usedMethods.ContainsKey($mn)) { $usedMethods[$mn] = @() }
                $usedMethods[$mn] += $sf.Name
            }
        }
    }
    
    foreach ($mn in $usedMethods.Keys) {
        $pattern = "(?ms)[\w\.]+\s+" + [regex]::Escape($mn) + "\s*\("
        if ($idxContent -match $pattern) {
            LogOK ("Method '" + $mn + "()' found in index")
        } else {
            LogWarn "INDEX" ("Method '" + $mn + "()' used in scripts but NOT in index")
        }
    }
} else {
    LogWarn "INDEX" "No UI index file found"
}

# Summary
Write-Host ""
Write-Host "=== RESULTS ===" -Foreground Cyan
if ($errs -gt 0) { Write-Host ("ERRORS: " + $errs) -Foreground Red }
else             { Write-Host "ERRORS: 0" -Foreground Green }
if ($warns -gt 0) { Write-Host ("WARNINGS: " + $warns) -Foreground Yellow }
else              { Write-Host "WARNINGS: 0" -Foreground Green }
if ($errs -eq 0 -and $warns -eq 0) { Write-Host "ALL OK" -Foreground Green }
