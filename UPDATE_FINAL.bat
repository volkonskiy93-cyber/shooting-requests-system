@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion
set GH_TOKEN=YOUR_GITHUB_TOKEN_HERE

echo ========================================
echo   ОБНОВЛЕНИЕ ФАЙЛОВ НА GITHUB
echo ========================================
echo.

cd /d "%~dp0"

echo Текущая директория:
cd
echo.

echo Проверка файлов...
if exist index.html (echo   index.html - найден) else (echo   index.html - НЕ НАЙДЕН)
if exist admin.html (echo   admin.html - найден) else (echo   admin.html - НЕ НАЙДЕН)
if exist deepseek_htmlобщая.html (echo   deepseek_htmlобщая.html - найден) else (echo   deepseek_htmlобщая.html - НЕ НАЙДЕН)
echo.

echo Обновление файлов через GitHub CLI...
echo.

powershell -NoProfile -ExecutionPolicy Bypass -Command "$env:GH_TOKEN='YOUR_GITHUB_TOKEN_HERE'; $files=@('index.html','deepseek_htmlобщая.html','admin.html'); $successCount=0; $failCount=0; Write-Host 'Начало обновления...' -ForegroundColor Magenta; foreach($f in $files){ $fullPath=Join-Path (Get-Location) $f; if(Test-Path $fullPath){ Write-Host \"Обновление $f...\" -NoNewline; try{ $c=Get-Content $fullPath -Raw -Encoding UTF8; $b=[System.Text.Encoding]::UTF8.GetBytes($c); $b64=[Convert]::ToBase64String($b); $shaOutput=gh api repos/volkonskiy93-cyber/-2/contents/$f --method GET --jq .sha 2>&1; $sha=$shaOutput|Select-String -Pattern '^[a-f0-9]{40}$'|ForEach-Object{$_.Matches.Value}; $bodyFile=[System.IO.Path]::GetTempFileName(); if($sha){ $bodyJson=@{\"message\"=\"Update iOS 26 styles\";\"content\"=$b64;\"sha\"=$sha}|ConvertTo-Json -Compress }else{ $bodyJson=@{\"message\"=\"Update iOS 26 styles\";\"content\"=$b64}|ConvertTo-Json -Compress }; $bodyJson|Out-File -FilePath $bodyFile -Encoding UTF8 -NoNewline; $result=gh api repos/volkonskiy93-cyber/-2/contents/$f --method PUT --input $bodyFile 2>&1; Remove-Item $bodyFile -Force -ErrorAction SilentlyContinue; if($LASTEXITCODE -eq 0){ Write-Host ' OK' -ForegroundColor Green; $successCount++ }else{ Write-Host \" ERROR: $result\" -ForegroundColor Red; $failCount++ } }catch{ Write-Host \" ERROR: $($_.Exception.Message)\" -ForegroundColor Red; $failCount++ }; Start-Sleep -Milliseconds 500 }else{ Write-Host \"$f не найден по пути: $fullPath\" -ForegroundColor Red; $failCount++ } }; Write-Host \"\nРезультат: Success=$successCount Errors=$failCount\" -ForegroundColor $(if($failCount -eq 0){'Green'}else{'Yellow'})"

echo.
echo ========================================
echo   ГОТОВО!
echo ========================================
echo.
pause
