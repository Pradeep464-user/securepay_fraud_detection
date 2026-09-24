@echo off
title SecurePay Launcher
echo ========================================================
echo               STARTING SECUREPAY APPLICATION
echo ========================================================
echo.

:: 1. Start MongoDB on Port 27018 (if not already running)
netstat -ano | findstr 27018 >nul
if %errorlevel% neq 0 (
    echo [1/3] Starting SecurePay Database on port 27018...
    if not exist "%~dp0backend\data\db" mkdir "%~dp0backend\data\db"
    start /b "" mongod --port 27018 --dbpath "%~dp0backend\data\db"
    timeout /t 3 /nobreak >nul
) else (
    echo [1/3] Database is already running on port 27018.
)

:: 2. Start Backend Server
echo [2/3] Starting Backend Server on port 5000...
start "SecurePay Backend" cmd /k "cd /d %~dp0backend && node server.js"
timeout /t 2 /nobreak >nul

:: 3. Start Frontend Dev Server
echo [3/3] Starting Frontend Server on port 5500...
start "SecurePay Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"
timeout /t 3 /nobreak >nul

:: Open browser
echo.
echo Opening SecurePay in your browser...
start http://127.0.0.1:5500/index.html

echo.
echo ========================================================
echo SecurePay is running!
echo User Login:  alex.smith@example.com / User@123
echo Admin Login: admin@securepay.com / Admin@123
echo ========================================================
