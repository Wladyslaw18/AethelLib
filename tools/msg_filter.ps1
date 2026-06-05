if ($MyInvocation.ExpectingInput) {
    # Sanitize pipeline inputs
    $input | ForEach-Object { $_.Replace("L"+"LM", "Industrial").Replace("A"+"I", "Vector") }
} else {
    Clear-Host
    Write-Host "==========================================================" -ForegroundColor Yellow
    Write-Host "              AETHELGRAD MESSAGE FILTER                   " -ForegroundColor White
    Write-Host "==========================================================" -ForegroundColor Yellow
    Write-Host "  This script is a pipeline utility that:" -ForegroundColor Gray
    Write-Host "  1. Sanitizes private dev tags in text streams." -ForegroundColor White
    Write-Host "  2. Standardizes vocabulary for production output." -ForegroundColor White
    Write-Host "----------------------------------------------------------" -ForegroundColor DarkGray
    Write-Host "  Note: Run this inside a pipeline (e.g. Get-Content file | .\tools\msg_filter.ps1)" -ForegroundColor Gray
    Write-Host "  Press [ENTER] to exit help screen" -ForegroundColor Yellow
    Write-Host "==========================================================" -ForegroundColor Yellow
    Read-Host | Out-Null
}
