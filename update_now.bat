@echo off
setlocal enabledelayedexpansion
set GH_TOKEN=YOUR_GITHUB_TOKEN_HERE

echo ========================================
echo   ОБНОВЛЕНИЕ ФАЙЛОВ НА GITHUB
echo ========================================
echo.

cd /d "%~dp0"

echo Обновление index.html...
powershell -NoProfile -Command "$env:GH_TOKEN='YOUR_GITHUB_TOKEN_HERE'; $c=[System.Text.Encoding]::UTF8.GetBytes((Get-Content 'index.html' -Raw -Encoding UTF8)); $b64=[Convert]::ToBase64String($c); $sha=gh api repos/volkonskiy93-cyber/-2/contents/index.html --method GET --jq .sha; gh api repos/volkonskiy93-cyber/-2/contents/index.html --method PUT -f message='Update iOS 26 styles' -f content=$b64 -f sha=$sha | Out-Null; if($LASTEXITCODE -eq 0){ Write-Host '  OK' -ForegroundColor Green }else{ Write-Host '  ERROR' -ForegroundColor Red }"
if %errorlevel% equ 0 (echo   OK) else (echo   ERROR)

echo.
echo Обновление deepseek_htmlобщая.html...
powershell -NoProfile -Command "$env:GH_TOKEN='YOUR_GITHUB_TOKEN_HERE'; $c=[System.Text.Encoding]::UTF8.GetBytes((Get-Content 'deepseek_htmlобщая.html' -Raw -Encoding UTF8)); $b64=[Convert]::ToBase64String($c); $sha=gh api repos/volkonskiy93-cyber/-2/contents/deepseek_htmlобщая.html --method GET --jq .sha; gh api repos/volkonskiy93-cyber/-2/contents/deepseek_htmlобщая.html --method PUT -f message='Update iOS 26 styles' -f content=$b64 -f sha=$sha | Out-Null; if($LASTEXITCODE -eq 0){ Write-Host '  OK' -ForegroundColor Green }else{ Write-Host '  ERROR' -ForegroundColor Red }"
if %errorlevel% equ 0 (echo   OK) else (echo   ERROR)

echo.
echo Обновление admin.html...
powershell -NoProfile -Command "$env:GH_TOKEN='YOUR_GITHUB_TOKEN_HERE'; $c=[System.Text.Encoding]::UTF8.GetBytes((Get-Content 'admin.html' -Raw -Encoding UTF8)); $b64=[Convert]::ToBase64String($c); $sha=gh api repos/volkonskiy93-cyber/-2/contents/admin.html --method GET --jq .sha; gh api repos/volkonskiy93-cyber/-2/contents/admin.html --method PUT -f message='Update iOS 26 styles' -f content=$b64 -f sha=$sha | Out-Null; if($LASTEXITCODE -eq 0){ Write-Host '  OK' -ForegroundColor Green }else{ Write-Host '  ERROR' -ForegroundColor Red }"
if %errorlevel% equ 0 (echo   OK) else (echo   ERROR)

echo.
echo ========================================
echo   ГОТОВО!
echo ========================================
echo.
pause
