@echo off
echo ==============================================================================
echo                      AWSense Platform Launcher
echo   Intelligent Weather Station Data Reliability & Sensor Health Platform
echo             SIH26073 - Automated Weather Stations (AWS)
echo ==============================================================================
echo.

echo [1/2] Starting Python FastAPI Backend on http://127.0.0.1:8000 ...
start "AWSense Backend API" cmd /k "cd backend && python main.py"

timeout /t 3 /nobreak >nul

echo [2/2] Starting React Frontend on http://localhost:5173 ...
start "AWSense Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo ==============================================================================
echo AWSense is now launching!
echo Backend API & Docs: http://127.0.0.1:8000/docs
echo Web Application:    http://localhost:5173
echo ==============================================================================
echo Press any key to exit this launcher window...
pause >nul
