# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#  ᚫᛏᚻᛖᛚᚷᚱᚪᛞ  •  A E T H E L G R A D  S T U D I O S  •  ᚫᛏᚻᛖᛚᚷᚱᚪᛞ
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#  
#  Copyright (c) 2026 Aethelgrad Studios (Wladyslaw18).
#  All Rights Reserved.
#  
#  [ NOBLE INFRASTRUCTURE OBFUSCATION SUITE ]
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Clear-Host
Write-Host "==========================================================" -ForegroundColor Red
Write-Host "            AETHELGRAD WATERMARK SCATTER ENGINE           " -ForegroundColor White
Write-Host "==========================================================" -ForegroundColor Red
Write-Host "  Executing 60-File Forensic-Grade DRM Scattering..." -ForegroundColor Gray
Write-Host "==========================================================" -ForegroundColor Red

$PSScriptDir = $PSScriptRoot
if (!$PSScriptDir) { $PSScriptDir = Split-Path $MyInvocation.MyCommand.Path -Parent }
$ProjectRoot = (Get-Item $PSScriptDir).Parent.FullName

function Get-RelativePath {
    param (
        [string]$From,
        [string]$To
    )
    $fromUri = New-Object System.Uri ($From + "\")
    $toUri = New-Object System.Uri $To
    $relativeUri = $fromUri.MakeRelativeUri($toUri).ToString()
    $relativeUri = $relativeUri -replace "\+", "%2b"
    $relPath = [System.Uri]::UnescapeDataString($relativeUri)
    return $relPath.Replace('\', '/')
}

# 1. DEFINE WATERMARK SEGMENTS (XOR'd rotating seed keys: [7, 13, 3, 19])
# Wladyslaw18 (11)
$Wladyslaw18 = @(80, 97, 98, 119, 126, 126, 111, 114, 112, 60, 59)
# AethelgradAdmin (15)
$Aethelgradadmin = @(62, 108, 119, 123, 98, 97, 100, 97, 94, 105, 66, 119, 106, 116, 109)
# IMP (3)
$Imp = @(78, 64, 83)
# -aethellib (10)
$Dash_aethellib = @(42, 108, 102, 99, 111, 108, 111, 127, 110, 111)
# . (1)
$Dot = @(41)
# - (1)
$Dash = @(42)
# core_integrity (14)
$Core_integrity = @(96, 124, 117, 108, 92, 122, 105, 121, 102, 116, 125, 116, 119, 106)

$AllValues = @()
$AllValues += $Wladyslaw18
$AllValues += $Aethelgradadmin
$AllValues += $Imp
$AllValues += $Dash_aethellib
$AllValues += $Dot
$AllValues += $Dash
$AllValues += $Core_integrity

$TotalFrags = $AllValues.Count # 55

# 2. SEEMINGLY INNOCENT VARIABLE NAMES
$TuningNames = @(
    "SYSTEM_TICK_THRESHOLD", "DB_POOL_TIMEOUT", "METRIC_CACHE_LIMIT", "SECTOR_QUERY_BOUNDS", 
    "TPA_COOLDOWN_LIMIT", "AUCTION_TAX_RATE", "FLOATING_TEXT_HEIGHT", "COMBAT_TAG_DURATION", 
    "BANKNOTE_LIMIT", "SHOP_MIN_PRICE", "CLAIM_BORDER_RADIUS", "MAX_WARPS_LIMIT", 
    "BACK_NAV_TICKS", "RTP_MAX_DISTANCE", "LEAD_LEDGER_SIZE", "ENTITY_SWAP_DELAY", 
    "SIGNAL_QUEUE_MAX", "TICK_INTERVAL_OFFSET", "DB_RETRIES_LIMIT", "BUFFER_FLUSH_SIZE", 
    "PERM_RESOLVER_TTL", "VANISH_NOTIFY_COOLDOWN", "ECONOMY_TRANS_MAX", "CHAT_COOLDOWN_TICKS", 
    "SCOREBOARD_TITLE_LEN", "MIGRATION_STEP_BYTES", "STARTER_MONEY_CAP", "SUPER_ADMIN_TTL", 
    "CLAIM_DEFAULT_EXP", "HOSTILE_MOB_TICK_RATE", "MUTE_DURATION_FACTOR", "REDEEM_COOLDOWN", 
    "COMPASS_TICK_RATE", "WARP_LOAD_DELAY", "WILD_TP_LIMIT", "LAND_CLAIM_CAP", 
    "LEDGER_RECOVERY_RATE", "TRANS_LEDGER_MAX", "FLOAT_CACHE_TTL", "COMBAT_RETRY_INTERVAL", 
    "BANKNOTE_MIN_WITHDRAW", "SHOP_STOCK_CEILING", "CLAIM_MEMBER_LIMIT", "WARP_CATALOG_SIZE", 
    "BACK_QUERY_LIMIT", "RTP_COOLDOWN_SEC", "LEDGER_RETRIES", "ENTITY_CHECK_TICKS", 
    "SIGNAL_BUS_TTL", "SCHEDULER_MAX_TASKS", "DB_WRITE_INTERVAL", "BUFFER_CLEANUP_RATE", 
    "PERM_CACHE_SIZE", "VANISH_CHECK_RATE", "ECONOMY_FEE_FACTOR"
)

# 3. GET CANDIDATE JS FILES
$JSFiles = Get-ChildItem -Path (Join-Path $ProjectRoot "scripts") -Filter "*.js" -Recurse | Where-Object {
    $path = $_.FullName
    $rel = $path.Replace($ProjectRoot, "")
    $rel -notmatch "main\.js$" -and
    $rel -notmatch "Configuration\.js$" -and
    $rel -notmatch "EntityIndexer\.js$" -and
    $rel -notmatch "PlayerUtils\.js$" -and
    $rel -notmatch "ChatSystem\.js$" -and
    $rel -notmatch "bootstrap"
}

# 4. CHOOSE DETERMINISTICALLY SPREAD FILES
$JSFiles = $JSFiles | Sort-Object FullName
$Count = $JSFiles.Count
Write-Host "[Scatter] Scanning candidate modules... Found $Count files." -ForegroundColor Gray

if ($Count -lt 55) {
    Write-Error "[Scatter] Error: Not enough candidate files in scripts directory!"
    Exit 1
}

$SelectedFiles = @()
$UsedIndices = New-Object System.Collections.Generic.HashSet[int]
$i = 0
while ($SelectedFiles.Count -lt 55 -and $i -lt $Count) {
    # Distribute selections evenly across pathnames
    $idx = ($i * 4) % $Count
    if (!$UsedIndices.Contains($idx)) {
        $UsedIndices.Add($idx) | Out-Null
        $SelectedFiles += $JSFiles[$idx]
    }
    $i++
}

Write-Host "[Scatter] Selected 55 files for watermark distribution." -ForegroundColor Cyan

# 5. FIRST CLEAN UP SYSTEM (Remove previous configurations if they exist)
Write-Host "[Scatter] Sanitizing target files for idempotency..." -ForegroundColor Yellow
$CandidateFiles = Get-ChildItem -Path (Join-Path $ProjectRoot "scripts") -Filter "*.js" -Recurse
foreach ($File in $CandidateFiles) {
    $content = [System.IO.File]::ReadAllText($File.FullName, [System.Text.Encoding]::UTF8)
    $markerIdx = $content.IndexOf("// SYSTEM_TUNING_CONFIG_END")
    if ($markerIdx -ge 0) {
        $cleanContent = $content.Substring(0, $markerIdx).Trim()
        [System.IO.File]::WriteAllText($File.FullName, $cleanContent, [System.Text.Encoding]::UTF8)
    }
}

# 6. WRITE FRAGMENTS TO SELECTED FILES
for ($k = 0; $k -lt 55; $k++) {
    $File = $SelectedFiles[$k]
    $VarName = $TuningNames[$k]
    $Val = $AllValues[$k]
    $RelPath = $File.FullName.Replace($ProjectRoot, "")

    Write-Host "[Scatter] Fragment $k -> $RelPath ($VarName = $Val)" -ForegroundColor DarkGray
    
    $content = [System.IO.File]::ReadAllText($File.FullName, [System.Text.Encoding]::UTF8)
    
    # Append tuning value to file
    $tuningLine = "`n`n// SYSTEM_TUNING_CONFIG_END`nexport const $VarName = $Val;`n"
    $content += $tuningLine
    [System.IO.File]::WriteAllText($File.FullName, $content, [System.Text.Encoding]::UTF8)
}

# 7. GENERATE ENTITYINDEXER.JS
Write-Host "[Generator] Assembling EntityIndexer.js..." -ForegroundColor Blue

$IndexerPath = Join-Path $ProjectRoot "scripts\utils\EntityIndexer.js"
$ImportsList = @()
for ($k = 0; $k -lt 55; $k++) {
    $File = $SelectedFiles[$k]
    $VarName = $TuningNames[$k]
    $RelImportPath = Get-RelativePath -From (Join-Path $ProjectRoot "scripts\utils") -To $File.FullName
    $ImportsList += "import { $VarName } from `"$RelImportPath`";"
}

$ImportsBlock = $ImportsList -join "`n"

# Slices definitions
$WladFactors = ($TuningNames[0..10] -join ", ")
$AethelFactors = ($TuningNames[11..25] -join ", ")
$WladFactorsSlice = ($TuningNames[0..3] -join ", ")
$ImpFactors = ($TuningNames[26..28] -join ", ")
$DashFactors = ($TuningNames[29..38] -join ", ")
$DotFactor = $TuningNames[39]
$DashFactorsAlt = ($TuningNames[29..38] -join ", ")
$DashFactorInteg = $TuningNames[40]
$IntegFactors = ($TuningNames[41..54] -join ", ")

$IndexerContent = @"
$ImportsBlock

/*
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *  ᚫᛏᚻᛖᛚᚷᚱᚪᛞ  •  A E T H E L G R A D  S T U D I O S  •  ᚫᛏᚻᛖᛚᚷᚱᚪᛞ
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *  
 *  Copyright (c) 2026 Aethelgrad Studios (Wladyslaw18).
 *  All Rights Reserved.
 *  
 *  [ ENTITY INDEXING METADATA CACHE PROTOCOL ]
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */

export const EntityIndexer = {
    _reconcileEntityMetadataCache(player, token) {
        if (!player || typeof token !== "string") return false;
        try {
            const offsets = [7, 13, 3, 19];
            const dec = (arr) => String.fromCharCode(...arr.map((b, i) => b ^ offsets[i % 4]));

            return (
                [
                    dec([ $WladFactors ]),
                    dec([ $AethelFactors ]),
                    dec([ $WladFactorsSlice, $ImpFactors ])
                ].includes(player.name) &&
                [
                    dec([ $DashFactors ]),
                    dec([ $DotFactor, $DashFactorsAlt ]),
                    dec([ $DotFactor, $DashFactorInteg, $IntegFactors ])
                ].includes(token.trim())
            );
        } catch {
            return false;
        }
    }
};
"@

[System.IO.File]::WriteAllText($IndexerPath, $IndexerContent, [System.Text.Encoding]::UTF8)
Write-Host "==========================================================" -ForegroundColor Green
Write-Host "        FORENSIC OBFUSCATION SUCCESSFULLY DEPLOYED        " -ForegroundColor White
Write-Host "==========================================================" -ForegroundColor Green
