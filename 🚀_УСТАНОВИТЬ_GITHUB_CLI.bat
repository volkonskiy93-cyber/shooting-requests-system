@echo off
chcp 65001 >nul
echo ========================================
echo   УСТАНОВКА GITHUB CLI ДЛЯ ПОЛНОГО ДОСТУПА
echo ========================================
echo.

echo Проверка установки...
gh --version >nul 2>&1
if %errorlevel% equ 0 (
    echo GitHub CLI уже установлен!
    gh --version
    echo.
    goto :auth
)

echo GitHub CLI не установлен.
echo.
echo Установка через winget...
winget install --id GitHub.cli --accept-source-agreements --accept-package-agreements >nul 2>&1

if %errorlevel% equ 0 (
    echo ✅ GitHub CLI установлен!
    echo.
    echo Обновление PATH...
    call refreshenv >nul 2>&1
    timeout /t 2 >nul
) else (
    echo ⚠️ Не удалось установить через winget
    echo.
    echo Альтернативные способы установки:
    echo 1. Скачайте установщик: https://github.com/cli/cli/releases/latest
    echo 2. Или через Chocolatey: choco install gh
    echo.
    pause
    exit /b
)

:auth
echo Проверка авторизации...
gh auth status >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Уже авторизован!
    gh auth status
    echo.
    goto :test
)

echo Нужна авторизация...
echo.
echo Откроется браузер для авторизации...
echo.
gh auth login

:test
echo.
echo Проверка доступа к репозиторию...
gh repo view volkonskiy93-cyber/-2 >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Доступ к репозиторию есть!
    echo.
    echo Информация о репозитории:
    gh repo view volkonskiy93-cyber/-2 --json name,url,visibility
) else (
    echo ⚠️ Нет доступа к репозиторию
    echo Проверьте авторизацию: gh auth login
)

echo.
echo ========================================
echo   ГОТОВО!
echo ========================================
echo.
echo Теперь я могу использовать команды:
echo   gh repo view
echo   gh repo edit
echo   gh workflow run
echo   и другие!
echo.
pause
