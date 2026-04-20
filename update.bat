@echo off
chcp 65001 >nul
echo ========================================
echo   Updating files on GitHub
echo ========================================
echo.

powershell -NoProfile -ExecutionPolicy Bypass -Command "$token='YOUR_GITHUB_TOKEN_HERE'; $repoOwner='volkonskiy93-cyber'; $repoName='-2'; $baseUrl='https://api.github.com/repos/'+$repoOwner+'/'+$repoName+'/contents'; $files=@('index.html','deepseek_htmlобщая.html','admin.html'); $success=0; $error=0; foreach($f in $files){ Write-Host \"[ ] $f\" -NoNewline; try{ if(-not(Test-Path $f)){ Write-Host \" - FILE NOT FOUND\" -ForegroundColor Red; $error++; continue }; $c=Get-Content $f -Raw -Encoding UTF8; $b=[System.Text.Encoding]::UTF8.GetBytes($c); $b64=[Convert]::ToBase64String($b); try{ $ex=Invoke-RestMethod -Uri ($baseUrl+'/'+$f) -Headers @{Authorization='token '+$token; Accept='application/vnd.github.v3+json'} -Method Get -ErrorAction Stop; $sha=$ex.sha }catch{$sha=$null}; $body=@{message='Update iOS 26 styles'; content=$b64}; if($sha){$body.sha=$sha}; $json=$body|ConvertTo-Json -Compress; Invoke-RestMethod -Uri ($baseUrl+'/'+$f) -Method Put -Headers @{Authorization='token '+$token; Accept='application/vnd.github.v3+json'; 'Content-Type'='application/json'} -Body $json -ContentType 'application/json' -ErrorAction Stop | Out-Null; Write-Host \" - OK\" -ForegroundColor Green; $success++ }catch{ Write-Host \" - ERROR: $($_.Exception.Message)\" -ForegroundColor Red; $error++ }; Start-Sleep -Milliseconds 500 }; Write-Host \"\n========================================\" -ForegroundColor Cyan; Write-Host \"RESULT: Success: $success  Errors: $error\" -ForegroundColor $(if($error -eq 0){'Green'}else{'Yellow'}); Write-Host \"========================================\" -ForegroundColor Cyan"

echo.
pause
