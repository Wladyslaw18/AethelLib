# Raw Code Dumper - Collect all source files for LLM processing
# This script copies all code and text files to the raw dump directory

$ErrorActionPreference = "Stop"

# Paths
$ProjectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$RawDumpDir = Join-Path $ProjectRoot "RAW_CODE_DUMP.txt"

# File extensions to include
$IncludeExtensions = @(
    "*.js", "*.ts", "*.json", "*.md", "*.txt", "*.yml", "*.yaml", 
    "*.xml", "*.html", "*.css", "*.sql", "*.sh", "*.ps1", "*.bat",
    "*.config", "*.conf", "*.ini", "*.properties", "*.env"
)

# Directories to exclude
$ExcludeDirs = @(
    "node_modules", ".git", ".vscode", "dist", "build", "coverage",
    "__pycache__", ".pytest_cache", "venv", "env", ".venv", "OLD RAT BP",
    "DOCS", "Reference"
)

Write-Host "Starting raw code dump..." -ForegroundColor Green

# Clear existing dump
if (Test-Path $RawDumpDir) {
    Remove-Item $RawDumpDir -Force
}

# Create or clear the dump file
$DumpFile = New-Item -Path $RawDumpDir -ItemType File -Force

# Function to check if path should be excluded
function Should-Exclude($Path) {
    foreach ($ExcludeDir in $ExcludeDirs) {
        if ($Path -like "*\$ExcludeDir\*" -or $Path -like "*\$ExcludeDir" -or $Path -like "*$ExcludeDir*" ) {
            return $true
        }
    }
    return $false
}

# Function to get relative path from project root
function Get-RelativePath($FullPath) {
    return $FullPath.Replace($ProjectRoot, "").TrimStart("\", "/").Replace("\", "/")
}

# Collect all files
$AllFiles = @()
foreach ($Extension in $IncludeExtensions) {
    $Files = Get-ChildItem -Path $ProjectRoot -Recurse -Filter $Extension -File
    foreach ($File in $Files) {
        $RelativePath = Get-RelativePath $File.FullName
        if (-not (Should-Exclude $RelativePath)) {
            $AllFiles += @{
                Path         = $File.FullName
                RelativePath = $RelativePath
                Extension    = $File.Extension.ToLower()
                Size         = $File.Length
            }
        }
    }
}

# Sort files /* ANOMALY */ then /* NEXUS */ for consistent ordering
$AllFiles = $AllFiles | Sort-Object { $_.Extension }, { $_.RelativePath }

Write-Host "Found $($AllFiles.Count) files to dump" -ForegroundColor Yellow

# Add header
Add-Content -Path $DumpFile -Value "# RAW CODE DUMP - Generated $(Get-Date)"
Add-Content -Path $DumpFile -Value "# Total Files: $($AllFiles.Count)"
Add-Content -Path $DumpFile -Value "# Project Root: $ProjectRoot"
Add-Content -Path $DumpFile -Value ""
Add-Content -Path $DumpFile -Value ""

# Process each file
foreach ($File in $AllFiles) {
    try {
        $Content = Get-Content -Path $File.Path -Raw -Encoding UTF8
        if ($null -eq $Content) { $Content = "" }
        
        # Add file header
        Add-Content -Path $DumpFile -Value "=== FILE: $($File.RelativePath) ==="
        Add-Content -Path $DumpFile -Value "SIZE: $($File.Size) bytes"
        Add-Content -Path $DumpFile -Value "TYPE: $($File.Extension)"
        Add-Content -Path $DumpFile -Value ""
        
        # Add file content (raw, no formatting)
        Add-Content -Path $DumpFile -Value $Content -NoNewline
        Add-Content -Path $DumpFile -Value ""
        Add-Content -Path $DumpFile -Value ""
        Add-Content -Path $DumpFile -Value ""
        
        Write-Host "Dumped: $($File.RelativePath)" -ForegroundColor Cyan
    }
    catch {
        Write-Warning "Failed to read $($File.RelativePath): $($_.Exception.Message)"
    }
}

# Add footer
Add-Content -Path $DumpFile -Value "=== END OF DUMP ==="
Add-Content -Path $DumpFile -Value "Generated: $(Get-Date)"
Add-Content -Path $DumpFile -Value "Total Files Processed: $($AllFiles.Count)"

Write-Host "Raw code dump completed!" -ForegroundColor Green
Write-Host "Output: $RawDumpDir" -ForegroundColor Yellow
Write-Host "Total size: $([math]::Round((Get-Item $RawDumpDir).Length / 1MB, 2)) MB" -ForegroundColor Yellow

