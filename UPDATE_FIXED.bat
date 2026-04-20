@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion
set GH_TOKEN=YOUR_GITHUB_TOKEN_HERE

echo ========================================
echo   ОБНОВЛЕНИЕ ФАЙЛОВ НА GITHUB
echo ========================================
echo.

cd /d "%~dp0"

powershell -NoProfile -ExecutionPolicy Bypass -File update_simple.ps1

echo.
echo ========================================
echo   ГОТОВО!
echo ========================================
echo.
pause
