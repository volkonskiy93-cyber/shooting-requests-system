@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo.
echo ========================================
echo   Запуск Flask приложения
echo ========================================
echo.
echo Проверка Python...
python --version
echo.
echo Проверка файлов...
if not exist "app.py" (
    echo ОШИБКА: Файл app.py не найден!
    echo Текущая директория:
    cd
    pause
    exit /b 1
)
if not exist "run.py" (
    echo ОШИБКА: Файл run.py не найден!
    pause
    exit /b 1
)
echo Файлы найдены.
echo.
echo Запуск приложения...
echo.
echo ========================================
echo   Сервер будет доступен по адресу:
echo   http://localhost:5000
echo ========================================
echo.
echo Нажмите Ctrl+C для остановки сервера
echo.
python run.py
pause
