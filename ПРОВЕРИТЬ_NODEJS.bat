@echo off
echo ========================================
echo    CHECKING NODE.JS INSTALLATION
echo ========================================
echo.

where node >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js is NOT installed or not in PATH!
    echo.
    echo Please:
    echo 1. Download Node.js from: https://nodejs.org/
    echo 2. Install it
    echo 3. Restart your computer
    echo 4. Run this script again
    echo.
) else (
    echo SUCCESS: Node.js is installed!
    echo.
    node --version
    npm --version
    echo.
    echo You can now run the bot!
)

echo.
pause
