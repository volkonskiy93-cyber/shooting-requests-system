@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion
set GH_TOKEN=YOUR_GITHUB_TOKEN_HERE

echo ========================================
echo   ОБНОВЛЕНИЕ ФАЙЛОВ НА GITHUB
echo ========================================
echo.

cd /d "%~dp0"

echo [1/3] Обновление index.html...
powershell -NoProfile -Command "$env:GH_TOKEN='YOUR_GITHUB_TOKEN_HERE'; $c=[System.Text.Encoding]::UTF8.GetBytes((Get-Content 'index.html' -Raw -Encoding UTF8)); $b64=[Convert]::ToBase64String($c); $sha=gh api repos/volkonskiy93-cyber/-2/contents/index.html --method GET --jq .sha 2>&1 | Select-String -Pattern '^[a-f0-9]{40}$'; if($sha){ gh api repos/volkonskiy93-cyber/-2/contents/index.html --method PUT -f message='Update iOS 26 styles' -f content=$b64 -f sha=$sha 2>&1 | Out-Null }else{ gh api repos/volkonskiy93-cyber/-2/contents/index.html --method PUT -f message='Update iOS 26 styles' -f content=$b64 2>&1 | Out-Null }; if($LASTEXITCODE -eq 0){ Write-Host '  OK' -ForegroundColor Green }else{ Write-Host '  ERROR' -ForegroundColor Red }"
if %errorlevel% equ 0 (echo   OK) else (echo   ERROR)

echo.
echo [2/3] Обновление deepseek_htmlобщая.html...
powershell -NoProfile -Command "$env:GH_TOKEN='YOUR_GITHUB_TOKEN_HERE'; $c=[System.Text.Encoding]::UTF8.GetBytes((Get-Content 'deepseek_htmlобщая.html' -Raw -Encoding UTF8)); $b64=[Convert]::ToBase64String($c); $sha=gh api repos/volkonskiy93-cyber/-2/contents/deepseek_htmlобщая.html --method GET --jq .sha 2>&1 | Select-String -Pattern '^[a-f0-9]{40}$'; if($sha){ gh api repos/volkonskiy93-cyber/-2/contents/deepseek_htmlобщая.html --method PUT -f message='Update iOS 26 styles' -f content=$b64 -f sha=$sha 2>&1 | Out-Null }else{ gh api repos/volkonskiy93-cyber/-2/contents/deepseek_htmlобщая.html --method PUT -f message='Update iOS 26 styles' -f content=$b64 2>&1 | Out-Null }; if($LASTEXITCODE -eq 0){ Write-Host '  OK' -ForegroundColor Green }else{ Write-Host '  ERROR' -ForegroundColor Red }"
if %errorlevel% equ 0 (echo   OK) else (echo   ERROR)

echo.
echo [3/3] Обновление admin.html...
powershell -NoProfile -Command "$env:GH_TOKEN='YOUR_GITHUB_TOKEN_HERE'; $c=[System.Text.Encoding]::UTF8.GetBytes((Get-Content 'admin.html' -Raw -Encoding UTF8)); $b64=[Convert]::ToBase64String($c); $sha=gh api repos/volkonskiy93-cyber/-2/contents/admin.html --method GET --jq .sha 2>&1 | Select-String -Pattern '^[a-f0-9]{40}$'; if($sha){ gh api repos/volkonskiy93-cyber/-2/contents/admin.html --method PUT -f message='Update iOS 26 styles' -f content=$b64 -f sha=$sha 2>&1 | Out-Null }else{ gh api repos/volkonskiy93-cyber/-2/contents/admin.html --method PUT -f message='Update iOS 26 styles' -f content=$b64 2>&1 | Out-Null }; if($LASTEXITCODE -eq 0){ Write-Host '  OK' -ForegroundColor Green }else{ Write-Host '  ERROR' -ForegroundColor Red }"
if %errorlevel% equ 0 (echo   OK) else (echo   ERROR)

echo.
echo ========================================
echo   ГОТОВО!
echo ========================================
echo.
echo Проверьте изменения:
echo https://github.com/volkonskiy93-cyber/-2
echo.
pause
