@echo off
REM AI Town Startup Script for Windows
REM Starts all required services with a single command

echo ========================================
echo   AI Town Unified Startup (Windows)
echo ========================================

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed or not in PATH
    pause
    exit /b 1
)

REM Check if Python is installed
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Python is not installed or not in PATH
    pause
    exit /b 1
)

echo Starting AI Town services...
echo.

REM Start API Server
echo Starting API Server on port 3002...
start "AI Town API" cmd /k "node server/server.js"

REM Wait for API to start
timeout /t 3 /nobreak >nul

REM Start Frontend
echo Starting Frontend on port 8080...
start "AI Town Frontend" cmd /k "python -m http.server 8080"

REM Wait for frontend to start
timeout /t 3 /nobreak >nul

echo.
echo ========================================
echo   AI Town is now running!
echo ========================================
echo.
echo Frontend: http://localhost:8080
echo API:      http://localhost:3002
echo.
echo Press any key to open the application in your browser...
pause >nul

REM Open in default browser
start http://localhost:8080

echo.
echo To stop the application, close the command windows that opened.
echo.
pause