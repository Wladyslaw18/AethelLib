[CmdletBinding()]
param(
    [ValidateSet("STABLE", "BETA")]
    [string]$Channel = $null,
    [string]$Version = $null
)

# Aethelgrad Mojang API Linter for PowerShell
# Enforces safe coding rules for getComponent() null checks and runCommand() deprecations.

$ProjectRoot = Split-Path -Parent -Path $PSScriptRoot
$ScriptsDir = Join-Path $ProjectRoot "scripts"

$DefaultChannel = "BETA"
$DefaultVersion = "2.8.0"

# Source of truth resolution: try to load from node_modules first, then project manifest.json
$NodeModulesServerJson = Join-Path $ProjectRoot "node_modules/@minecraft/server/package.json"
$DefaultChannel = "BETA"
$DefaultVersion = "2.8.0"
$SourceOfTruth = "Default Fallback"

if (Test-Path $NodeModulesServerJson) {
    try {
        $Pkg = Get-Content $NodeModulesServerJson -Raw | ConvertFrom-Json
        $RawVer = $Pkg.version
        if ($RawVer -like "*-beta*") {
            $DefaultChannel = "BETA"
            if ($RawVer -match '^(\d+\.\d+\.\d+)') {
                $DefaultVersion = $Matches[1]
            } else {
                $DefaultVersion = $RawVer -replace "-beta.*", ""
            }
        } else {
            $DefaultChannel = "STABLE"
            if ($RawVer -match '^(\d+\.\d+\.\d+)') {
                $DefaultVersion = $Matches[1]
            } else {
                $DefaultVersion = $RawVer
            }
        }
        $SourceOfTruth = "node_modules (@minecraft/server)"
    } catch {}
} else {
    $ManifestPath = Join-Path $ProjectRoot "manifest.json"
    if (Test-Path $ManifestPath) {
        try {
            $Manifest = Get-Content $ManifestPath -Raw | ConvertFrom-Json
            $ServerDep = $Manifest.dependencies | Where-Object { $_.module_name -eq "@minecraft/server" }
            if ($ServerDep) {
                $RawVer = $ServerDep.version
                if ($RawVer -like "*-beta*") {
                    $DefaultChannel = "BETA"
                    $DefaultVersion = $RawVer -replace "-beta.*", ""
                } else {
                    $DefaultChannel = "STABLE"
                    $DefaultVersion = $RawVer
                }
                $SourceOfTruth = "manifest.json"
            }
        } catch {}
    }
}

if ($null -eq $Channel -or $Channel -eq "") {
    $Channel = $DefaultChannel
}

$ChannelUpper = $Channel.ToUpper()

if ($null -eq $Version -or $Version -eq "") {
    $Version = $DefaultVersion
}

# ANSI colors for premium vibes
$Esc = [char]27
$Red = "$Esc[91m"
$Yellow = "$Esc[93m"
$Green = "$Esc[92m"
$Cyan = "$Esc[96m"
$White = "$Esc[97m"
$Reset = "$Esc[0m"

# Parse node_modules/@minecraft/server/index.d.ts if available
$DtsPath = Join-Path $ProjectRoot "node_modules/@minecraft/server/index.d.ts"
$HasRunCommandAsync = $false
$ResolvedClasses = @{}

if (Test-Path $DtsPath) {
    # Check if runCommandAsync exists in typings
    if (Select-String -Path $DtsPath -Pattern "\brunCommandAsync\b" -Quiet) {
        $HasRunCommandAsync = $true
    }
    
    # Parse classes, methods, and properties from .d.ts
    $Classes = @{}
    $CurrentClass = $null
    try {
        $Lines = [System.IO.File]::ReadLines($DtsPath)
        foreach ($Line in $Lines) {
            $Trimmed = $Line.Trim()
            if ($Trimmed -match '^export (class|interface) (\w+)(?:\s+extends\s+([\w\.]+))?') {
                $CurrentClass = $Matches[2]
                $Parent = $Matches[3]
                if ($Parent -and $Parent.Contains(".")) {
                    $Parent = $Parent.Split(".")[-1]
                }
                $Classes[$CurrentClass] = @{
                    parent = $Parent
                    members = [System.Collections.Generic.HashSet[string]]::new([System.StringComparer]::Ordinal)
                }
                continue
            }
            if ($CurrentClass) {
                if ($Trimmed -eq "}") {
                    $CurrentClass = $null
                    continue
                }
                if ($Trimmed -match '^(\w+)(?:<[^>]+>)?\s*\(') {
                    [void]$Classes[$CurrentClass].members.Add($Matches[1])
                    continue
                }
                if ($Trimmed -match '^(?:readonly\s+)?(\w+)\??\s*:') {
                    [void]$Classes[$CurrentClass].members.Add($Matches[1])
                    continue
                }
            }
        }
        
        # Resolve inheritance recursively
        $Resolver = {
            param($ClassName)
            if (-not $Classes.ContainsKey($ClassName)) { return [System.Collections.Generic.HashSet[string]]::new() }
            if ($ResolvedClasses.ContainsKey($ClassName)) { return $ResolvedClasses[$ClassName] }
            $All = [System.Collections.Generic.HashSet[string]]::new($Classes[$ClassName].members, [System.StringComparer]::Ordinal)
            $Parent = $Classes[$ClassName].parent
            if ($Parent) {
                $ParentMembers = & $Resolver $Parent
                foreach ($M in $ParentMembers) { [void]$All.Add($M) }
            }
            $ResolvedClasses[$ClassName] = $All
            return $All
        }
        foreach ($Key in $Classes.Keys) {
            [void](& $Resolver $Key)
        }
    } catch {}
}

Write-Host "${Cyan}==========================================${Reset}"
Write-Host "${White}       AETHELGRAD MOJANG API LINTER       ${Reset}"
Write-Host "${Cyan}------------------------------------------${Reset}"
Write-Host "${Cyan} SCAN TARGET: ${White}${ChannelUpper} ${Version}${Reset}"
Write-Host "${Cyan} SOURCE:      ${White}${SourceOfTruth}${Reset}"
Write-Host "${Cyan}==========================================${Reset}"

$TotalWarnings = 0
$TotalFiles = 0

$RunCommandDeprecated = $HasRunCommandAsync
if ($null -eq $DtsPath -or -not (Test-Path $DtsPath)) {
    # Fallback to hardcoded rules if node_modules typings not found
    try {
        $VerParts = [regex]::Matches($Version, '\d+') | ForEach-Object { [int]$_.Value }
        if ($VerParts.Count -ge 2) {
            $Major = $VerParts[0]
            $Minor = $VerParts[1]
            if ($ChannelUpper -eq "BETA" -and ($Major -gt 2 -or ($Major -eq 2 -and $Minor -ge 8))) {
                $RunCommandDeprecated = $true
            }
            elseif ($ChannelUpper -eq "STABLE" -and ($Major -gt 2 -or ($Major -eq 2 -and $Minor -ge 7))) {
                $RunCommandDeprecated = $true
            }
        }
    }
    catch {
        if ($ChannelUpper -eq "BETA") {
            $RunCommandDeprecated = $true
        }
    }
}

# Get all JS files in scripts directory, ignoring node_modules or .git
$Files = Get-ChildItem -Path $ScriptsDir -Filter *.js -Recurse | Where-Object { 
    $_.FullName -notmatch "node_modules" -and $_.FullName -notmatch "\.git"
}

# Map variable name prefixes to native classes in the typings
$PrefixMap = @{
    "world" = "World"
    "system" = "System"
    "player" = "Player"
    "pl" = "Player"
    "target" = "Player"
    "sender" = "Player"
    "admin" = "Player"
    "entity" = "Entity"
    "ent" = "Entity"
    "dimension" = "Dimension"
    "itemstack" = "ItemStack"
    "container" = "Container"
    "inventory" = "Container"
}

foreach ($File in $Files) {
    $TotalFiles++
    $RelativePath = $File.FullName.Substring($ProjectRoot.Length + 1)
    $Lines = Get-Content -Path $File.FullName
    $FileIssues = @()

    for ($i = 0; $i -lt $Lines.Count; $i++) {
        $Line = $Lines[$i]
        $LineNum = $i + 1
        $Stripped = $Line.Trim()

        # Ignore comments
        if ($Stripped.StartsWith("//") -or $Stripped.StartsWith("*") -or $Stripped.StartsWith("/*")) {
            continue
        }

        # 0. Direct Import Check for Plugins
        if ($RelativePath -match "scripts[/\\]plugins[/\\]" -and ($Line -match 'from\s+["'']@minecraft/server(-ui)?["'']' -or $Line -match 'import\s+["'']@minecraft/server(-ui)?["'']')) {
            $FileIssues += [PSCustomObject]@{
                Type = "BYPASS_WARN"
                Line = $LineNum
                Desc = "Direct import of '@minecraft/server(-ui)' bypasses Kernel proxies. Memory leaks and circular imports are ON YOU if this breaks. 💀"
            }
        }

        # 1. getComponent Check
        if ($Line -match '(?:const|let|var)\s+(\w+)\s*=\s*(?:.*?\.)?getComponent\((.*?)\)') {
            $AssignedVar = $Matches[1]
            $CompName = $Matches[2].Trim()
            
            $HasCheck = $false
            if ($Line -match "$AssignedVar\?\.") {
                $HasCheck = $true
            } else {
                $EndIdx = [Math]::Min($i + 5, $Lines.Count - 1)
                for ($j = $i + 1; $j -le $EndIdx; $j++) {
                    $NextLine = $Lines[$j]
                    if ($NextLine -match "if\s*\(.*$AssignedVar" -or $NextLine -match "$AssignedVar\?\.") {
                        $HasCheck = $true
                        break
                    }
                }
            }

            if (-not $HasCheck) {
                $FileIssues += [PSCustomObject]@{
                    Type = "WARNING"
                    Line = $LineNum
                    Desc = "getComponent($CompName) assigned to '$AssignedVar' without a null check or optional chaining (?.)."
                }
            }
        } else {
            if ($Line -match '(\w+)\.getComponent\((.*?)\)\s*\.' -and $Line -notmatch '\?\.') {
                $ObjectVar = $Matches[1]
                $CompName = $Matches[2].Trim()
                $FileIssues += [PSCustomObject]@{
                    Type = "WARNING"
                    Line = $LineNum
                    Desc = "Direct chain call on getComponent($CompName) on '$ObjectVar' without optional chaining (?.). Potential Null Pointer Hazard."
                }
            }
        }

        # 2. runCommand Check
        if ($Line -like "*.runCommand(*" -and $Line -notlike "*runCommandAsync*") {
            if ($Line -notlike "*try*") {
                if ($RunCommandDeprecated) {
                    $FileIssues += [PSCustomObject]@{
                        Type = "DEPRECATION"
                        Line = $LineNum
                        Desc = "Synchronous .runCommand() is deprecated in Mojang API $Version ($ChannelUpper). Consider .runCommandAsync() to protect TPS."
                    }
                } else {
                    $FileIssues += [PSCustomObject]@{
                        Type = "WARNING"
                        Line = $LineNum
                        Desc = "Synchronous .runCommand() detected. Ensure it does not block main thread TPS on Mojang API $Version ($ChannelUpper)."
                    }
                }
            }
        }

        # 3. Dynamic Typings Member Validation Check
        if ($ResolvedClasses.Count -gt 0) {
            $MatchesList = [regex]::Matches($Line, '(?<!\.)\b(\w+)\.(\w+)\s*\(')
            foreach ($Match in $MatchesList) {
                $VarName = $Match.Groups[1].Value
                $MethodName = $Match.Groups[2].Value
                
                # Check mapping for known classes
                $ClassName = $null
                if ($PrefixMap.ContainsKey($VarName.ToLower())) {
                    $ClassName = $PrefixMap[$VarName.ToLower()]
                }
                
                if ($ClassName -and $ResolvedClasses.ContainsKey($ClassName)) {
                    $MembersSet = $ResolvedClasses[$ClassName]
                    if (-not $MembersSet.Contains($MethodName)) {
                        $FileIssues += [PSCustomObject]@{
                            Type = "WARNING"
                            Line = $LineNum
                            Desc = "Method '$MethodName' called on '$VarName' ($ClassName) does not exist in target @minecraft/server version."
                        }
                    }
                }
            }
        }
    }

    if ($FileIssues.Count -gt 0) {
        Write-Host ""
        Write-Host "${Yellow}[FILE] File: $RelativePath${Reset}"
        foreach ($Issue in $FileIssues) {
            $Color = if ($Issue.Type -eq "DEPRECATION" -or $Issue.Type -eq "BYPASS_WARN") { $Red } else { $Yellow }
            Write-Host "  [${Color}$($Issue.Type)${Reset}] Line $($Issue.Line): $($Issue.Desc)"
            $TotalWarnings++
        }
    }
}

Write-Host ""
Write-Host "${Cyan}------------------------------------------${Reset}"
if ($TotalWarnings -eq 0) {
    Write-Host "${Green}[OK] clean build! 0 issues found across $TotalFiles files.${Reset}"
} else {
    Write-Host "${Red}[WARN] scan finished: $TotalWarnings potential issues found.${Reset}"
}
Write-Host "${Cyan}==========================================${Reset}"
