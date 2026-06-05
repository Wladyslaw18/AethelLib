# History Purge Script
# Sanitizes commit history by cleaning up private development tokens.

Clear-Host
Write-Host "==========================================================" -ForegroundColor Red
Write-Host "            WARNING: GIT HISTORY REWRITE                  " -ForegroundColor White
Write-Host "==========================================================" -ForegroundColor Red
Write-Host "  This script will:" -ForegroundColor Gray
Write-Host "  1. Rewrite ALL git commits using filter-branch." -ForegroundColor White
Write-Host "  2. Replace private dev tokens with clean production flags." -ForegroundColor White
Write-Host "  WARNING: This changes commit hashes! Back up before running!" -ForegroundColor Red
Write-Host "----------------------------------------------------------" -ForegroundColor DarkGray
Write-Host "  Press [ENTER] to execute history purge | [Ctrl+C] to cancel" -ForegroundColor Red
Write-Host "==========================================================" -ForegroundColor Red
Read-Host | Out-Null

$env:FILTER_BRANCH_SQUELCH_WARNING = "1"
git filter-branch -f --msg-filter 'sed "s/L""LM/Industrial/g; s/A""I/Vector/g; s/l""lm/industrial/g; s/a""i/vector/g"' -- --all
