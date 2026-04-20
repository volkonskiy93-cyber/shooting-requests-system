# Обновление всех JS файлов на GitHub
$token = 'YOUR_GITHUB_TOKEN_HERE'
$repo = 'volkonskiy93-cyber/-2'
$baseUrl = "https://api.github.com/repos/$repo/contents"
$headers = @{
    'Authorization' = "token $token"
    'Accept' = 'application/vnd.github.v3+json'
}

$files = @('auth.js', 'data.js', 'admin.js')
$success = 0
$fail = 0

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  ОБНОВЛЕНИЕ JS ФАЙЛОВ НА GITHUB" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

foreach ($f in $files) {
    $filePath = Join-Path (Get-Location) $f
    
    if (Test-Path $filePath) {
        Write-Host "Обновление $f..." -NoNewline -ForegroundColor Cyan
        
        try {
            $content = [System.IO.File]::ReadAllText($filePath, [System.Text.Encoding]::UTF8)
            $b64 = [Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes($content))
            
            Write-Host " (размер: $($b64.Length) символов)" -NoNewline -ForegroundColor Gray
            
            # Проверяем, существует ли файл на GitHub
            $getUrl = "$baseUrl/$f"
            $sha = $null
            try {
                $shaResponse = Invoke-RestMethod -Uri $getUrl -Method Get -Headers $headers -ErrorAction Stop
                $sha = $shaResponse.sha
                Write-Host " (SHA: $($sha.Substring(0,8))...)" -NoNewline -ForegroundColor Gray
            } catch {
                # Файл не существует, создаем новый
            }
            
            $body = @{
                message = "Add/Update $f"
                content = $b64
            }
            
            if ($sha) {
                $body.sha = $sha
            }
            
            $bodyJson = $body | ConvertTo-Json -Compress
            $bodyBytes = [System.Text.Encoding]::UTF8.GetBytes($bodyJson)
            
            Invoke-RestMethod -Uri "$baseUrl/$f" -Method Put -Headers $headers -Body $bodyBytes -ContentType 'application/json' | Out-Null
            
            Write-Host " OK" -ForegroundColor Green
            $success++
        } catch {
            Write-Host " ERROR" -ForegroundColor Red
            Write-Host "  Ошибка: $($_.Exception.Message)" -ForegroundColor Red
            $fail++
        }
        
        Start-Sleep -Milliseconds 500
    } else {
        Write-Host "$f не найден" -ForegroundColor Red
        $fail++
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Результат: Success=$success Errors=$fail" -ForegroundColor $(if($fail -eq 0){'Green'}else{'Yellow'})
Write-Host "========================================" -ForegroundColor Cyan
