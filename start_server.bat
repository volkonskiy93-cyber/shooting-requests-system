@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo.
echo ========================================
echo   Starting Flask Application
echo ========================================
echo.
python --version
echo.
if not exist "app.py" (
    echo ERROR: app.py not found!
    cd
    pause
    exit /b 1
)
if not exist "run.py" (
    echo ERROR: run.py not found!
    pause
    exit /b 1
)
echo.
echo Starting server...
echo.
echo ========================================
echo   Server will be available at:
echo   http://localhost:5000
echo ========================================
echo.
echo Press Ctrl+C to stop the server
echo.
python run.py
pause
