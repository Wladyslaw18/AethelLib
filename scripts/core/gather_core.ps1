# FUCK BLOAT. GATHERING EVERYTHING INTO ONE MONOLITH.
$outputPath = "Core.txt"
if (Test-Path $outputPath) { Remove-Item $outputPath }

Get-ChildItem -Recurse -File | Where-Object { $_.Name -ne 'Core.txt' -and $_.Name -ne 'gather_core.ps1' } | ForEach-Object {
    [System.IO.File]::AppendAllText($outputPath, "`n`n// === FILE: $($_.FullName) ===`n")
    [System.IO.File]::AppendAllText($outputPath, [System.IO.File]::ReadAllText($_.FullName))
}
