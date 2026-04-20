@echo off
chcp 65001 >nul
cd /d "%~dp0"
cls
echo.
echo ========================================
echo   ЗАПУСК FLASK ПРИЛОЖЕНИЯ
echo   С ДИАГНОСТИКОЙ
echo ========================================
echo.
python diagnose_and_run.py
pause
