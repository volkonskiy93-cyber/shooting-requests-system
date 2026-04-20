# Обновление файлов через GitHub API используя curl
$token = 'YOUR_GITHUB_TOKEN_HERE'
$repo = 'volkonskiy93-cyber/-2'
$baseUrl = "https://api.github.com/repos/$repo/contents"

$files = @('index.html', 'deepseek_htmlобщая.html', 'admin.html')
$successCount = 0
$failCount = 0

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  ОБНОВЛЕНИЕ ФАЙЛОВ НА GITHUB" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

foreach ($f in $files) {
    if (Test-Path $f) {
        Write-Host "Обновление $f..." -NoNewline -ForegroundColor Cyan
        
        try {
            # Читаем файл
            $content = [System.IO.File]::ReadAllText((Resolve-Path $f).Path, [System.Text.Encoding]::UTF8)
            $bytes = [System.Text.Encoding]::UTF8.GetBytes($content)
            $base64 = [Convert]::ToBase64String($bytes)
            
            Write-Host " (размер: $($base64.Length) символов)" -NoNewline -ForegroundColor Gray
            
            # Получаем SHA существующего файла через curl
            $getUrl = "$baseUrl/$f"
            $headers = @{
                "Authorization" = "token $token"
                "Accept" = "application/vnd.github.v3+json"
            }
            
            $shaResponse = Invoke-RestMethod -Uri $getUrl -Method Get -Headers $headers -ErrorAction SilentlyContinue
            $sha = $shaResponse.sha
            
            if ($sha) {
                Write-Host " (SHA: $($sha.Substring(0,8))...)" -NoNewline -ForegroundColor Gray
            }
            
            # Создаем тело запроса
            $body = @{
                message = "Update iOS 26 styles"
                content = $base64
            }
            
            if ($sha) {
                $body.sha = $sha
            }
            
            # Создаем временный файл для тела запроса
            $tempDir = $env:TEMP
            $bodyFile = Join-Path $tempDir "gh_update_$([System.IO.Path]::GetRandomFileName()).json"
            $bodyJson = $body | ConvertTo-Json -Compress
            $bodyJson | Out-File -FilePath $bodyFile -Encoding UTF8 -NoNewline
            
            # Отправляем запрос через curl
            $putUrl = "$baseUrl/$f"
            $bodyBytes = [System.Text.Encoding]::UTF8.GetBytes($bodyJson)
            
            $response = Invoke-RestMethod -Uri $putUrl -Method Put -Headers $headers -Body $bodyBytes -ContentType "application/json" -ErrorAction Stop
            
            # Удаляем временный файл
            Remove-Item $bodyFile -Force -ErrorAction SilentlyContinue
            
            Write-Host " OK" -ForegroundColor Green
            $successCount++
        } catch {
            Write-Host " ERROR" -ForegroundColor Red
            Write-Host "  Ошибка: $($_.Exception.Message)" -ForegroundColor Red
            $failCount++
        }
        
        Start-Sleep -Milliseconds 500
    } else {
        Write-Host "$f не найден" -ForegroundColor Red
        $failCount++
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Результат: Success=$successCount Errors=$failCount" -ForegroundColor $(if($failCount -eq 0){'Green'}else{'Yellow'})
Write-Host "========================================" -ForegroundColor Cyan

if ($successCount -eq $files.Count) {
    Write-Host ""
    Write-Host "Проверьте изменения:" -ForegroundColor Yellow
    Write-Host "https://github.com/volkonskiy93-cyber/-2" -ForegroundColor Cyan
}
