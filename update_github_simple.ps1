$ErrorActionPreference = 'Stop'
$token = 'YOUR_GITHUB_TOKEN_HERE'
$repo = 'volkonskiy93-cyber/-2'
$baseUrl = "https://api.github.com/repos/$repo/contents"
$headers = @{
    'Authorization' = "token $token"
    'Accept' = 'application/vnd.github.v3+json'
}

$files = @('index.html', 'admin.html', 'auth.js', 'data.js', 'admin.js', 'vercel.json', 'package.json')
$success = 0
$fail = 0

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  ОБНОВЛЕНИЕ ФАЙЛОВ НА GITHUB" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

foreach ($f in $files) {
    $filePath = Join-Path (Get-Location) $f
    
    if (Test-Path $filePath) {
        Write-Host "Обновление $f..." -NoNewline -ForegroundColor Cyan
        
        try {
            $content = [System.IO.File]::ReadAllText($filePath, [System.Text.Encoding]::UTF8)
            $b64 = [Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes($content))
            
            Write-Host " (размер: $($content.Length))" -NoNewline -ForegroundColor Gray
            
            $getUrl = "$baseUrl/$f"
            $sha = $null
            try {
                $shaResponse = Invoke-RestMethod -Uri $getUrl -Method Get -Headers $headers -ErrorAction Stop
                $sha = $shaResponse.sha
            } catch {
            }
            
            $body = @{
                message = "Update $f"
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
            Write-Host " ERROR: $($_.Exception.Message)" -ForegroundColor Red
            $fail++
        }
        
        Start-Sleep -Milliseconds 500
    } else {
        Write-Host "$f не найден" -ForegroundColor Red
        $fail++
    }
}

# Обновляем deepseek_htmlобщая.html отдельно
$deepseekFile = Get-ChildItem -Path . -Filter "*общая.html" | Select-Object -First 1
if ($deepseekFile) {
    $f = $deepseekFile.Name
    Write-Host "Обновление $f..." -NoNewline -ForegroundColor Cyan
    
    try {
        $content = [System.IO.File]::ReadAllText($deepseekFile.FullName, [System.Text.Encoding]::UTF8)
        $b64 = [Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes($content))
        
        Write-Host " (размер: $($content.Length))" -NoNewline -ForegroundColor Gray
        
        $getUrl = "$baseUrl/$f"
        $sha = $null
        try {
            $shaResponse = Invoke-RestMethod -Uri $getUrl -Method Get -Headers $headers -ErrorAction Stop
            $sha = $shaResponse.sha
        } catch {
        }
        
        $body = @{
            message = "Update $f - добавлена функция выгрузки в DOC"
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
        Write-Host " ERROR: $($_.Exception.Message)" -ForegroundColor Red
        $fail++
    }
} else {
    Write-Host "deepseek_htmlобщая.html не найден" -ForegroundColor Red
    $fail++
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Результат: Success=$success Errors=$fail" -ForegroundColor $(if($fail -eq 0){'Green'}else{'Yellow'})
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Ссылка на проект: https://2-git-main-pendehos-projects.vercel.app" -ForegroundColor Green
