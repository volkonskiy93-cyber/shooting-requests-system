@echo off
chcp 65001 >nul
cd /d "%~dp0"

echo ========================================
echo   ОБНОВЛЕНИЕ ФАЙЛОВ НА GITHUB
echo ========================================
echo.
echo Текущая директория: %CD%
echo.

if not exist index.html (
    echo [ОШИБКА] index.html не найден!
    echo Убедитесь, что файлы находятся в той же папке.
    pause
    exit /b 1
)

if not exist update_github_files.ps1 (
    echo [ОШИБКА] update_github_files.ps1 не найден!
    pause
    exit /b 1
)

echo [OK] Файлы найдены. Начинаю обновление...
echo.

REM ВАЖНО: Используем -File для вызова скрипта, а не -Command
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0update_github_files.ps1"

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ОШИБКА] Произошла ошибка при выполнении скрипта.
    echo Проверьте сообщения выше.
)

echo.
echo ========================================
echo   ГОТОВО!
echo ========================================
echo.
pause
