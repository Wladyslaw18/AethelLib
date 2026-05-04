# PowerShell Script to Copy All Files to LLMShipment Folder
# This script copies all files (not folders) from current directory and subdirectories
# into a single LLMShipment folder for easy shipment

param(
    [string]$TargetFolder = "LLMShipment",
    [string[]]$ExcludeDirectories = @(".git", "node_modules", "__pycache__", "bin", "obj", "LLMShipment")
)

Write-Host "Starting file copy to LLMShipment folder..." -ForegroundColor Green

# Get current directory
$CurrentDir = Get-Location
$TargetPath = Join-Path $CurrentDir $TargetFolder

# Create target folder if it doesn't exist
if (-not (Test-Path $TargetPath)) {
    New-Item -Path $TargetPath -ItemType Directory -Force | Out-Null
    Write-Host "Created folder: $TargetFolder" -ForegroundColor Yellow
}

# Clear target folder to ensure clean copy
Write-Host "Clearing target folder..." -ForegroundColor Yellow
Get-ChildItem -Path $TargetPath -File | Remove-Item -Force

# Get all files recursively, excluding specified directories
$AllFiles = Get-ChildItem -Path $CurrentDir -Recurse -File | Where-Object {
    # Exclude by directory
    $ExcludeByDirectory = $false
    foreach ($ExcludeDir in $ExcludeDirectories) {
        if ($_.FullName -like "*\$ExcludeDir\*") {
            $ExcludeByDirectory = $true
            break
        }
    }
    
    # Exclude the script itself
    $ExcludeSelf = $_.Name -like "*.ps1"
    
    # Include file if not excluded
    -not $ExcludeByDirectory -and -not $ExcludeSelf
}

Write-Host "Found $($AllFiles.Count) files to copy" -ForegroundColor Cyan

# Copy each file to target folder
$FileCounter = 0
$DuplicateCounter = 0

foreach ($File in $AllFiles) {
    $FileCounter++
    $RelativePath = $File.FullName.Replace($CurrentDir, "").TrimStart("\")
    
    Write-Progress -Activity "Copying files" -Status "Processing $RelativePath" -PercentComplete (($FileCounter / $AllFiles.Count) * 100)
    
    try {
        $TargetFile = Join-Path $TargetPath $File.Name
        
        # Handle duplicate filenames by adding counter
        $Counter = 1
        $OriginalTargetFile = $TargetFile
        while (Test-Path $TargetFile) {
            $NameWithoutExt = [System.IO.Path]::GetFileNameWithoutExtension($File.Name)
            $Extension = [System.IO.Path]::GetExtension($File.Name)
            $TargetFile = Join-Path $TargetPath "$NameWithoutExt`_$Counter$Extension"
            $Counter++
        }
        
        if ($TargetFile -ne $OriginalTargetFile) {
            $DuplicateCounter++
            Write-Host "Duplicate found: $($File.Name) -> $(Split-Path $TargetFile -Leaf)" -ForegroundColor Magenta
        }
        
        # Copy the file
        Copy-Item -Path $File.FullName -Destination $TargetFile -Force
        
    } catch {
        Write-Host "ERROR copying file: $($File.FullName) - $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Progress -Activity "Copying files" -Completed

# Show summary
Write-Host "`nCopy complete!" -ForegroundColor Green
Write-Host "Total files copied: $FileCounter" -ForegroundColor Cyan
Write-Host "Duplicates renamed: $DuplicateCounter" -ForegroundColor Yellow
Write-Host "Target folder: $TargetPath" -ForegroundColor Yellow

# Show folder size
$TotalSize = (Get-ChildItem -Path $TargetPath -Recurse -File | Measure-Object -Property Length -Sum).Sum
Write-Host "Total size: $([math]::Round($TotalSize / 1MB, 2)) MB" -ForegroundColor Yellow

# Count by file type
Write-Host "`nFile types in shipment:" -ForegroundColor White
$FileTypes = Get-ChildItem -Path $TargetPath -File | Group-Object Extension | Sort-Object Count -Descending
foreach ($FileType in $FileTypes) {
    $Ext = if ($FileType.Name) { $FileType.Name } else { "(no extension)" }
    Write-Host "  $Ext : $($FileType.Count) files" -ForegroundColor Gray
}
