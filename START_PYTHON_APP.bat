@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo ========================================
echo   Запуск Python приложения Flask
echo ========================================
echo.
python run.py
pause
