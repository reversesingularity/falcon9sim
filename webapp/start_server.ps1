# Falcon 9 Simulation Web Application Launcher
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "Falcon 9 Simulation Web Application" -ForegroundColor Green
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Starting server..." -ForegroundColor Yellow
Write-Host ""

Set-Location $PSScriptRoot
python app.py

Read-Host "Press Enter to exit"
