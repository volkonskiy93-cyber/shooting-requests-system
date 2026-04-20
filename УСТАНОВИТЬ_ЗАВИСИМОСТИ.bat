@echo off
chcp 65001 >nul
echo ========================================
echo    📦 УСТАНОВКА ЗАВИСИМОСТЕЙ
echo ========================================
echo.

cd /d "%~dp0"

echo Установка зависимостей для Telegram бота...
call npm install

if errorlevel 1 (
    echo.
    echo ❌ Ошибка при установке зависимостей!
) else (
    echo.
    echo ✅ Зависимости успешно установлены!
)

echo.
pause
