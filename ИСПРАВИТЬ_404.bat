@echo off
chcp 65001 >nul
cd /d "%~dp0"
python fix_404.py
pause
