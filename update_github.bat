@echo off
chcp 65001 >nul
echo 🚀 Обновление файлов на GitHub...
echo.

set TOKEN=YOUR_GITHUB_TOKEN_HERE
set REPO_OWNER=volkonskiy93-cyber
set REPO_NAME=-2
set BASE_URL=https://api.github.com/repos/%REPO_OWNER%/%REPO_NAME%/contents

echo 📄 Обновление файла: index.html
curl -X GET "%BASE_URL%/index.html" -H "Authorization: token %TOKEN%" -H "Accept: application/vnd.github.v3+json" > temp_sha.json 2>nul
for /f "tokens=*" %%a in ('powershell -Command "(Get-Content temp_sha.json | ConvertFrom-Json).sha" 2^>nul') do set SHA=%%a
del temp_sha.json 2>nul

powershell -Command "$content = Get-Content 'index.html' -Raw -Encoding UTF8; $bytes = [System.Text.Encoding]::UTF8.GetBytes($content); $base64 = [Convert]::ToBase64String($bytes); $body = @{message='Обновление стилей iOS 26'; content=$base64}; if('%SHA%' NEQ '') { $body.sha = '%SHA%' }; $json = $body | ConvertTo-Json -Compress; Invoke-RestMethod -Uri '%BASE_URL%/index.html' -Method PUT -Headers @{Authorization='token %TOKEN%'; Accept='application/vnd.github.v3+json'; 'Content-Type'='application/json'} -Body $json -ContentType 'application/json'"
if %errorlevel% equ 0 (
    echo   ✅ index.html успешно обновлен!
) else (
    echo   ❌ Ошибка обновления index.html
)
echo.

echo 📄 Обновление файла: deepseek_htmlобщая.html
curl -X GET "%BASE_URL%/deepseek_htmlобщая.html" -H "Authorization: token %TOKEN%" -H "Accept: application/vnd.github.v3+json" > temp_sha.json 2>nul
for /f "tokens=*" %%a in ('powershell -Command "(Get-Content temp_sha.json | ConvertFrom-Json).sha" 2^>nul') do set SHA=%%a
del temp_sha.json 2>nul

powershell -Command "$content = Get-Content 'deepseek_htmlобщая.html' -Raw -Encoding UTF8; $bytes = [System.Text.Encoding]::UTF8.GetBytes($content); $base64 = [Convert]::ToBase64String($bytes); $body = @{message='Обновление стилей iOS 26'; content=$base64}; if('%SHA%' NEQ '') { $body.sha = '%SHA%' }; $json = $body | ConvertTo-Json -Compress; Invoke-RestMethod -Uri '%BASE_URL%/deepseek_htmlобщая.html' -Method PUT -Headers @{Authorization='token %TOKEN%'; Accept='application/vnd.github.v3+json'; 'Content-Type'='application/json'} -Body $json -ContentType 'application/json'"
if %errorlevel% equ 0 (
    echo   ✅ deepseek_htmlобщая.html успешно обновлен!
) else (
    echo   ❌ Ошибка обновления deepseek_htmlобщая.html
)
echo.

echo 📄 Обновление файла: admin.html
curl -X GET "%BASE_URL%/admin.html" -H "Authorization: token %TOKEN%" -H "Accept: application/vnd.github.v3+json" > temp_sha.json 2>nul
for /f "tokens=*" %%a in ('powershell -Command "(Get-Content temp_sha.json | ConvertFrom-Json).sha" 2^>nul') do set SHA=%%a
del temp_sha.json 2>nul

powershell -Command "$content = Get-Content 'admin.html' -Raw -Encoding UTF8; $bytes = [System.Text.Encoding]::UTF8.GetBytes($content); $base64 = [Convert]::ToBase64String($bytes); $body = @{message='Обновление стилей iOS 26'; content=$base64}; if('%SHA%' NEQ '') { $body.sha = '%SHA%' }; $json = $body | ConvertTo-Json -Compress; Invoke-RestMethod -Uri '%BASE_URL%/admin.html' -Method PUT -Headers @{Authorization='token %TOKEN%'; Accept='application/vnd.github.v3+json'; 'Content-Type'='application/json'} -Body $json -ContentType 'application/json'"
if %errorlevel% equ 0 (
    echo   ✅ admin.html успешно обновлен!
) else (
    echo   ❌ Ошибка обновления admin.html
)
echo.

echo ✅ Обновление завершено!
pause
