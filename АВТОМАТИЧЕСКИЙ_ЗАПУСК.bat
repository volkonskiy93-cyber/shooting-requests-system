@echo off
chcp 65001 >nul 2>&1
title Telegram Bot Auto Setup
color 0A

echo.
echo ========================================
echo    TELEGRAM BOT - AUTO SETUP
echo ========================================
echo.

cd /d "%~dp0"

REM Check for Node.js in common locations
set NODE_FOUND=0
set NODE_PATH=

REM Check if node is in PATH
where node >nul 2>&1
if %errorlevel% equ 0 (
    set NODE_FOUND=1
    set NODE_PATH=node
    goto :node_found
)

REM Check common installation paths
if exist "C:\Program Files\nodejs\node.exe" (
    set NODE_FOUND=1
    set NODE_PATH=C:\Program Files\nodejs\node.exe
    goto :node_found
)

if exist "C:\Program Files (x86)\nodejs\node.exe" (
    set NODE_FOUND=1
    set NODE_PATH=C:\Program Files (x86)\nodejs\node.exe
    goto :node_found
)

if exist "%LOCALAPPDATA%\Programs\nodejs\node.exe" (
    set NODE_FOUND=1
    set NODE_PATH=%LOCALAPPDATA%\Programs\nodejs\node.exe
    goto :node_found
)

REM Check if npm exists
where npm >nul 2>&1
if %errorlevel% equ 0 (
    REM npm exists, try to find node through npm
    for /f "tokens=*" %%i in ('where npm') do (
        set NPM_PATH=%%i
        set NODE_DIR=%%~dpi
        if exist "!NODE_DIR!node.exe" (
            set NODE_FOUND=1
            set NODE_PATH=!NODE_DIR!node.exe
            goto :node_found
        )
    )
)

:node_found
if %NODE_FOUND% equ 0 (
    echo [ERROR] Node.js not found!
    echo.
    echo Please install Node.js:
    echo 1. Go to: https://nodejs.org/
    echo 2. Download LTS version
    echo 3. Install it
    echo 4. Restart computer
    echo 5. Run this script again
    echo.
    echo Opening Node.js download page...
    start https://nodejs.org/
    pause
    exit /b 1
)

echo [OK] Node.js found!
"%NODE_PATH%" --version
echo.

REM Check for npm
where npm >nul 2>&1
if errorlevel 1 (
    echo [ERROR] npm not found!
    echo Please reinstall Node.js
    pause
    exit /b 1
)

echo [OK] npm found!
npm --version
echo.

REM Check if node_modules exists
if not exist "node_modules" (
    echo [1/2] Installing dependencies...
    echo This may take a few minutes...
    echo.
    call npm install
    if errorlevel 1 (
        echo.
        echo [ERROR] Failed to install dependencies!
        pause
        exit /b 1
    )
    echo.
    echo [OK] Dependencies installed!
) else (
    echo [OK] Dependencies already installed
)

echo.
echo [2/2] Starting bot...
echo.
echo ========================================
echo    BOT IS STARTING...
echo    Press Ctrl+C to stop
echo ========================================
echo.

"%NODE_PATH%" bot.js

if errorlevel 1 (
    echo.
    echo [ERROR] Bot stopped with error!
    pause
)
