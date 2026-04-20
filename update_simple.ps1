# Простое обновление файлов на GitHub
$env:GH_TOKEN = 'YOUR_GITHUB_TOKEN_HERE'

Write-Host "Обновление файлов на GitHub..." -ForegroundColor Magenta
Write-Host ""

$files = @('index.html', 'deepseek_htmlобщая.html', 'admin.html')
$successCount = 0
$failCount = 0

foreach ($f in $files) {
    if (Test-Path $f) {
        Write-Host "Обновление $f..." -NoNewline
        
        try {
            # Читаем файл
            $content = Get-Content $f -Raw -Encoding UTF8
            $bytes = [System.Text.Encoding]::UTF8.GetBytes($content)
            $base64 = [Convert]::ToBase64String($bytes)
            
            # Получаем SHA
            $shaOutput = gh api repos/volkonskiy93-cyber/-2/contents/$f --method GET --jq .sha 2>&1
            $sha = $shaOutput | Select-String -Pattern '^[a-f0-9]{40}$' | ForEach-Object { $_.Matches.Value }
            
            # Создаем временный файл для тела запроса
            $bodyFile = [System.IO.Path]::GetTempFileName()
            
            if ($sha) {
                $body = '{"message":"Update iOS 26 styles","content":"' + $base64 + '","sha":"' + $sha + '"}'
            } else {
                $body = '{"message":"Update iOS 26 styles","content":"' + $base64 + '"}'
            }
            
            $body | Out-File -FilePath $bodyFile -Encoding UTF8 -NoNewline
            
            # Отправляем запрос
            gh api repos/volkonskiy93-cyber/-2/contents/$f --method PUT --input $bodyFile 2>&1 | Out-Null
            
            # Удаляем временный файл
            Remove-Item $bodyFile -Force -ErrorAction SilentlyContinue
            
            if ($LASTEXITCODE -eq 0) {
                Write-Host " OK" -ForegroundColor Green
                $successCount++
            } else {
                Write-Host " ERROR" -ForegroundColor Red
                $failCount++
            }
        } catch {
            Write-Host " ERROR: $($_.Exception.Message)" -ForegroundColor Red
            $failCount++
        }
        
        Start-Sleep -Milliseconds 500
    } else {
        Write-Host "$f не найден" -ForegroundColor Red
        $failCount++
    }
}

Write-Host ""
Write-Host "Результат: Success=$successCount Errors=$failCount" -ForegroundColor $(if($failCount -eq 0){'Green'}else{'Yellow'})
