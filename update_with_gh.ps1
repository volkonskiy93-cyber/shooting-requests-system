$env:GH_TOKEN = 'YOUR_GITHUB_TOKEN_HERE'

Write-Host "Обновление файлов на GitHub..." -ForegroundColor Magenta
Write-Host ""

$files = @('index.html', 'deepseek_htmlобщая.html', 'admin.html')
$success = 0
$error = 0

foreach ($f in $files) {
    if (Test-Path $f) {
        Write-Host "Обновление: $f" -ForegroundColor Cyan
        
        $content = Get-Content $f -Raw -Encoding UTF8
        $bytes = [System.Text.Encoding]::UTF8.GetBytes($content)
        $base64 = [Convert]::ToBase64String($bytes)
        
        try {
            $shaOutput = gh api "repos/volkonskiy93-cyber/-2/contents/$f" --method GET --jq .sha 2>&1
            $sha = $shaOutput | Where-Object { $_ -match '^[a-f0-9]{40}$' }
            
            if ($sha) {
                gh api "repos/volkonskiy93-cyber/-2/contents/$f" --method PUT -f message='Update iOS 26 styles' -f content=$base64 -f sha=$sha | Out-Null
            } else {
                gh api "repos/volkonskiy93-cyber/-2/contents/$f" --method PUT -f message='Update iOS 26 styles' -f content=$base64 | Out-Null
            }
            
            if ($LASTEXITCODE -eq 0) {
                Write-Host "  OK" -ForegroundColor Green
                $success++
            } else {
                Write-Host "  ERROR" -ForegroundColor Red
                $error++
            }
        } catch {
            Write-Host "  ERROR: $_" -ForegroundColor Red
            $error++
        }
        
        Start-Sleep -Milliseconds 500
    } else {
        Write-Host "Файл не найден: $f" -ForegroundColor Red
        $error++
    }
}

Write-Host ""
Write-Host "Результат: Success=$success Errors=$error" -ForegroundColor $(if($error -eq 0){'Green'}else{'Yellow'})
