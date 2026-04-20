@echo off
chcp 65001 >nul
echo ========================================
echo   УСТАНОВКА GITHUB CLI
echo ========================================
echo.

echo Проверка установки GitHub CLI...
gh --version >nul 2>&1
if %errorlevel% equ 0 (
    echo GitHub CLI уже установлен!
    echo.
    echo Проверка авторизации...
    gh auth status >nul 2>&1
    if %errorlevel% equ 0 (
        echo Вы уже авторизованы!
        echo.
        echo Проверка доступа к репозиторию...
        gh repo view volkonskiy93-cyber/-2 >nul 2>&1
        if %errorlevel% equ 0 (
            echo ✅ Всё настроено! Доступ к репозиторию есть!
        ) else (
            echo ⚠️ Нужна авторизация...
            echo.
            echo Запускаю авторизацию...
            gh auth login
        )
    ) else (
        echo Нужна авторизация...
        echo.
        echo Запускаю авторизацию...
        gh auth login
    )
) else (
    echo GitHub CLI не установлен!
    echo.
    echo Варианты установки:
    echo 1. Через winget: winget install --id GitHub.cli
    echo 2. Через Chocolatey: choco install gh
    echo 3. Скачать: https://github.com/cli/cli/releases/latest
    echo.
    echo После установки запустите этот файл снова.
)

echo.
pause
