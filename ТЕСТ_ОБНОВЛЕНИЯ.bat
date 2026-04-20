@echo off
chcp 65001 >nul
cd /d "%~dp0"

echo ========================================
echo   ТЕСТ ОБНОВЛЕНИЯ ОДНОГО ФАЙЛА
echo ========================================
echo.

if not exist index.html (
    echo [ОШИБКА] index.html не найден!
    pause
    exit /b 1
)

if not exist update_github_files.ps1 (
    echo [ОШИБКА] update_github_files.ps1 не найден!
    pause
    exit /b 1
)

echo [OK] Файлы найдены. Тестирую обновление index.html...
echo.

powershell.exe -NoProfile -ExecutionPolicy Bypass -Command "$env:GH_TOKEN='YOUR_GITHUB_TOKEN_HERE'; $f='index.html'; if(Test-Path $f){ Write-Host \"Обновление $f...\" -ForegroundColor Cyan; try{ $c=[System.IO.File]::ReadAllText((Resolve-Path $f).Path,[System.Text.Encoding]::UTF8); $b64=[Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes($c)); Write-Host \"Размер: $($b64.Length) символов\" -ForegroundColor Gray; $getUrl='repos/volkonskiy93-cyber/-2/contents/index.html'; $getArgs=@('api',$getUrl,'--method','GET','--jq','.sha'); $shaOutput=& gh $getArgs 2>&1; $sha=$shaOutput|Select-String -Pattern '^[a-f0-9]{40}$'|ForEach-Object{$_.Matches.Value}; Write-Host \"SHA: $sha\" -ForegroundColor Gray; $tempDir=$env:TEMP; $bodyFile=Join-Path $tempDir \"gh_test.json\"; $body=@{message='Test update';content=$b64;sha=$sha}; ($body|ConvertTo-Json -Compress)|Out-File $bodyFile -Encoding UTF8 -NoNewline; $putUrl='repos/volkonskiy93-cyber/-2/contents/index.html'; $putArgs=@('api',$putUrl,'--method','PUT','--input',$bodyFile); $result=& gh $putArgs 2>&1; Remove-Item $bodyFile -Force -ErrorAction SilentlyContinue; if($LASTEXITCODE -eq 0){ Write-Host \"  [OK]\" -ForegroundColor Green }else{ Write-Host \"  [ERROR]\" -ForegroundColor Red; Write-Host $result -ForegroundColor Red } }catch{ Write-Host \"  [ERROR] $_\" -ForegroundColor Red } }else{ Write-Host \"Файл не найден\" -ForegroundColor Red }"

echo.
echo ========================================
echo   ГОТОВО!
echo ========================================
echo.
pause
