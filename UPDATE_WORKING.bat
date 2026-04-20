@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion
set GH_TOKEN=YOUR_GITHUB_TOKEN_HERE

echo ========================================
echo   ОБНОВЛЕНИЕ ФАЙЛОВ НА GITHUB
echo ========================================
echo.

cd /d "%~dp0"

echo Обновление файлов через GitHub CLI...
echo.

powershell -NoProfile -ExecutionPolicy Bypass -Command "$env:GH_TOKEN='YOUR_GITHUB_TOKEN_HERE'; $files=@('index.html','deepseek_htmlобщая.html','admin.html'); $successCount=0; $failCount=0; Write-Host 'Обновление файлов...' -ForegroundColor Magenta; foreach($f in $files){ if(Test-Path $f){ Write-Host \"Обновление $f...\" -NoNewline; try{ $c=Get-Content $f -Raw -Encoding UTF8; $b=[System.Text.Encoding]::UTF8.GetBytes($c); $b64=[Convert]::ToBase64String($b); $shaOutput=gh api repos/volkonskiy93-cyber/-2/contents/$f --method GET --jq .sha 2>&1; $sha=$shaOutput|Select-String -Pattern '^[a-f0-9]{40}$'|ForEach-Object{$_.Matches.Value}; $bodyFile=[System.IO.Path]::GetTempFileName(); if($sha){ $body='{\"message\":\"Update iOS 26 styles\",\"content\":\"'+$b64+'\",\"sha\":\"'+$sha+'\"}' }else{ $body='{\"message\":\"Update iOS 26 styles\",\"content\":\"'+$b64+'\"}' }; $body|Out-File -FilePath $bodyFile -Encoding UTF8 -NoNewline; gh api repos/volkonskiy93-cyber/-2/contents/$f --method PUT --input $bodyFile 2>&1|Out-Null; Remove-Item $bodyFile -Force -ErrorAction SilentlyContinue; if($LASTEXITCODE -eq 0){ Write-Host ' OK' -ForegroundColor Green; $successCount++ }else{ Write-Host ' ERROR' -ForegroundColor Red; $failCount++ } }catch{ Write-Host ' ERROR' -ForegroundColor Red; $failCount++ }; Start-Sleep -Milliseconds 500 }else{ Write-Host \"$f не найден\" -ForegroundColor Red; $failCount++ } }; Write-Host \"\nРезультат: Success=$successCount Errors=$failCount\" -ForegroundColor $(if($failCount -eq 0){'Green'}else{'Yellow'})"

echo.
echo ========================================
echo   ГОТОВО!
echo ========================================
echo.
pause
