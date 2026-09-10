Write-Host "==============================================================================" -ForegroundColor Cyan
Write-Host "                     AWSense Platform Launcher" -ForegroundColor White
Write-Host "  Intelligent Weather Station Data Reliability & Sensor Health Platform" -ForegroundColor Gray
Write-Host "            SIH26073 - Automated Weather Stations (AWS)" -ForegroundColor Yellow
Write-Host "==============================================================================" -ForegroundColor Cyan
Write-Host ""

$baseDir = Split-Path -Parent $MyInvocation.MyCommand.Path

Write-Host "[1/2] Starting Python FastAPI Backend on http://127.0.0.1:8000 ..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$baseDir\backend'; python main.py"

Start-Sleep -Seconds 3

Write-Host "[2/2] Starting React Frontend on http://localhost:5173 ..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$baseDir\frontend'; npm run dev"

Write-Host ""
Write-Host "==============================================================================" -ForegroundColor Cyan
Write-Host "AWSense is now active!" -ForegroundColor Green
Write-Host "Backend API & Docs: http://127.0.0.1:8000/docs" -ForegroundColor Yellow
Write-Host "Web Application:    http://localhost:5173" -ForegroundColor Yellow
Write-Host "==============================================================================" -ForegroundColor Cyan
