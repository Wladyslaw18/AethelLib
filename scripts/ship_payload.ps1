# LLM_SHIPMENT_ORCHESTRATOR
# ----------------------------------------------------------------------------
# Consolidates all industrial-logic nodes into a single high-density manifest 
# for LLM context-injection. 
#
# PHILOSOPHY: Content is data. Metadata is noise. We purge the noise.

$OutputFile = "LLM_SHIPMENT_DUMP.txt"
$IncludeExtensions = @("*.js", "*.json", "*.md")
$IgnorePaths = @("node_modules", ".git", ".gemini", "bin", "dist", "RAW_CODE_DUMP.txt", "LLM_SHIPMENT_DUMP.txt")

if (Test-Path $OutputFile) { Remove-Item $OutputFile }

Write-Host "§6[SHIPMENT] Initializing extraction-vector..."

$Files = Get-ChildItem -Recurse -File -Include $IncludeExtensions | Where-Object {
    $filePath = $_.FullName
    $shouldIgnore = $false
    foreach ($ignore in $IgnorePaths) {
        if ($filePath -like "*\$ignore*" -or $filePath -like "*$ignore") {
            $shouldIgnore = $true
            break
        }
    }
    !$shouldIgnore
}

Write-Host "§a[SHIPMENT] Staging $($Files.Count) modules for consolidation..."

foreach ($File in $Files) {
    $RelativePath = $File.FullName.Replace((Get-Location).Path, "")
    "================================================================================" | Out-File -FilePath $OutputFile -Append -Encoding utf8
    "FILE_NODE: $RelativePath" | Out-File -FilePath $OutputFile -Append -Encoding utf8
    "================================================================================" | Out-File -FilePath $OutputFile -Append -Encoding utf8
    Get-Content $File.FullName | Out-File -FilePath $OutputFile -Append -Encoding utf8
    "`n" | Out-File -FilePath $OutputFile -Append -Encoding utf8
}

Write-Host "§b[SHIPMENT] Consolidaton successful. Payload: $OutputFile"
