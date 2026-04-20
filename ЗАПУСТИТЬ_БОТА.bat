@echo off
chcp 65001 >nul 2>&1
echo ========================================
echo    TELEGRAM BOT STARTUP
echo ========================================
echo.

cd /d "%~dp0"

echo Checking Node.js...
where node >nul 2>&1
if errorlevel 1 (
    echo.
    echo ERROR: Node.js is not installed or not in PATH!
    echo.
    echo Please install Node.js from: https://nodejs.org/
    echo Or add Node.js to your system PATH
    echo.
    pause
    exit /b 1
)

node --version
echo.

echo [1/2] Installing dependencies...
call npm install
if errorlevel 1 (
    echo.
    echo ERROR: Failed to install dependencies!
    pause
    exit /b 1
)

echo.
echo [2/2] Starting bot...
echo.
echo Bot is starting...
echo Press Ctrl+C to stop
echo.

node bot.js

pause
