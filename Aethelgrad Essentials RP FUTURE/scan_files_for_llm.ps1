# PowerShell Script to Scan All Files for LLM Shipment
# This script recursively scans all files in the current directory and subdirectories,
# concatenates their contents into a single text file suitable for LLM processing.

param(
    [string]$OutputFile = "llm_input.txt",
    [string[]]$ExcludeExtensions = @(".png", ".jpg", ".jpeg", ".gif", ".bmp", ".ico", ".exe", ".dll", ".zip", ".rar", ".7z"),
    [string[]]$ExcludeDirectories = @(".git", "node_modules", "__pycache__", "bin", "obj"),
    [long]$MaxFileSizeMB = 10
)

Write-Host "Starting file scan for LLM shipment..." -ForegroundColor Green
Write-Host "Output file: $OutputFile" -ForegroundColor Yellow

# Get current directory
$CurrentDir = Get-Location
$MaxFileSizeBytes = $MaxFileSizeMB * 1MB

# Initialize output file
"LLM FILE SCAN - Generated on $(Get-Date)" | Out-File -FilePath $OutputFile -Encoding UTF8
"Source Directory: $CurrentDir" | Out-File -FilePath $OutputFile -Encoding UTF8 -Append
"" | Out-File -FilePath $OutputFile -Encoding UTF8 -Append
"========================================" | Out-File -FilePath $OutputFile -Encoding UTF8 -Append
"" | Out-File -FilePath $OutputFile -Encoding UTF8 -Append

# Get all files recursively
$AllFiles = Get-ChildItem -Path $CurrentDir -Recurse -File | Where-Object {
    # Exclude by extension
    $Extension = $_.Extension.ToLower()
    $ExcludeByExtension = $ExcludeExtensions -contains $Extension
    
    # Exclude by directory
    $ExcludeByDirectory = $false
    foreach ($ExcludeDir in $ExcludeDirectories) {
        if ($_.FullName -like "*\$ExcludeDir\*") {
            $ExcludeByDirectory = $true
            break
        }
    }
    
    # Exclude by size
    $ExcludeBySize = $_.Length -gt $MaxFileSizeBytes
    
    # Include file if not excluded by any criteria
    -not $ExcludeByExtension -and -not $ExcludeByDirectory -and -not $ExcludeBySize
}

Write-Host "Found $($AllFiles.Count) files to process" -ForegroundColor Cyan

# Process each file
$FileCounter = 0
foreach ($File in $AllFiles) {
    $FileCounter++
    $RelativePath = $File.FullName.Replace($CurrentDir, "").TrimStart("\")
    
    Write-Progress -Activity "Scanning files" -Status "Processing $RelativePath" -PercentComplete (($FileCounter / $AllFiles.Count) * 100)
    
    try {
        # Add file header
        "FILE: $RelativePath" | Out-File -FilePath $OutputFile -Encoding UTF8 -Append
        "SIZE: $($File.Length) bytes" | Out-File -FilePath $OutputFile -Encoding UTF8 -Append
        "MODIFIED: $($File.LastWriteTime)" | Out-File -FilePath $OutputFile -Encoding UTF8 -Append
        "----------------------------------------" | Out-File -FilePath $OutputFile -Encoding UTF8 -Append
        
        # Read and add file content
        $Content = Get-Content -Path $File.FullName -Raw -Encoding UTF8 -ErrorAction SilentlyContinue
        if ($null -eq $Content) {
            $Content = "[Binary file or unreadable content]"
        }
        $Content | Out-File -FilePath $OutputFile -Encoding UTF8 -Append
        
        # Add separator
        "" | Out-File -FilePath $OutputFile -Encoding UTF8 -Append
        "========================================" | Out-File -FilePath $OutputFile -Encoding UTF8 -Append
        "" | Out-File -FilePath $OutputFile -Encoding UTF8 -Append
        
    } catch {
        "ERROR reading file: $($_.Exception.Message)" | Out-File -FilePath $OutputFile -Encoding UTF8 -Append
        "" | Out-File -FilePath $OutputFile -Encoding UTF8 -Append
        "========================================" | Out-File -FilePath $OutputFile -Encoding UTF8 -Append
        "" | Out-File -FilePath $OutputFile -Encoding UTF8 -Append
    }
}

# Add summary at the end
"" | Out-File -FilePath $OutputFile -Encoding UTF8 -Append
"SCAN COMPLETE" | Out-File -FilePath $OutputFile -Encoding UTF8 -Append
"Total files processed: $FileCounter" | Out-File -FilePath $OutputFile -Encoding UTF8 -Append
"Generated on: $(Get-Date)" | Out-File -FilePath $OutputFile -Encoding UTF8 -Append

Write-Progress -Activity "Scanning files" -Completed
Write-Host "Scan complete! Output saved to: $OutputFile" -ForegroundColor Green
Write-Host "Total files processed: $FileCounter" -ForegroundColor Cyan

# Show output file size
$OutputFileInfo = Get-Item $OutputFile
Write-Host "Output file size: $([math]::Round($OutputFileInfo.Length / 1MB, 2)) MB" -ForegroundColor Yellow
