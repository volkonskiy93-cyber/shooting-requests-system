# Обновление файлов на GitHub
$env:GH_TOKEN = 'YOUR_GITHUB_TOKEN_HERE'

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  ОБНОВЛЕНИЕ ФАЙЛОВ НА GITHUB" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Переходим в директорию скрипта
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptPath

Write-Host "Текущая директория: $(Get-Location)" -ForegroundColor Gray
Write-Host ""

$files = @('index.html', 'deepseek_htmlобщая.html', 'admin.html')
$successCount = 0
$failCount = 0

Write-Host "Проверка файлов..." -ForegroundColor Yellow
foreach ($f in $files) {
    if (Test-Path $f) {
        Write-Host "  $f - найден" -ForegroundColor Green
    } else {
        Write-Host "  $f - НЕ НАЙДЕН" -ForegroundColor Red
    }
}
Write-Host ""

Write-Host "Начало обновления..." -ForegroundColor Magenta
Write-Host ""

foreach ($f in $files) {
    if (Test-Path $f) {
        Write-Host "Обновление $f..." -NoNewline -ForegroundColor Cyan
        
        try {
            # Читаем файл
            $content = Get-Content $f -Raw -Encoding UTF8
            $bytes = [System.Text.Encoding]::UTF8.GetBytes($content)
            $base64 = [Convert]::ToBase64String($bytes)
            
            Write-Host " (размер: $($base64.Length) символов)" -NoNewline -ForegroundColor Gray
            
            # Получаем SHA существующего файла (используем массив аргументов)
            $getUrl = "repos/volkonskiy93-cyber/-2/contents/$f"
            $getArgs = @("api", $getUrl, "--method", "GET", "--jq", ".sha")
            $shaOutput = & gh $getArgs 2>&1
            $sha = $shaOutput | Select-String -Pattern '^[a-f0-9]{40}$' | ForEach-Object { $_.Matches.Value }
            
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
            
            # Создаем временный файл для тела запроса в коротком пути (избегаем длинных путей)
            $tempDir = $env:TEMP
            $bodyFile = Join-Path $tempDir "gh_update_$([System.IO.Path]::GetRandomFileName()).json"
            $bodyJson = $body | ConvertTo-Json -Compress
            $bodyJson | Out-File -FilePath $bodyFile -Encoding UTF8 -NoNewline
            
            # Отправляем запрос через временный файл (избегаем длинной командной строки)
            # Используем массив аргументов для избежания проблем с длиной команды
            $apiUrl = "repos/volkonskiy93-cyber/-2/contents/$f"
            $ghArgs = @("api", $apiUrl, "--method", "PUT", "--input", $bodyFile)
            $result = & gh $ghArgs 2>&1
            
            # Удаляем временный файл
            Remove-Item $bodyFile -Force -ErrorAction SilentlyContinue
            
            if ($LASTEXITCODE -eq 0) {
                Write-Host " OK" -ForegroundColor Green
                $successCount++
            } else {
                Write-Host " ERROR" -ForegroundColor Red
                Write-Host "  Детали: $result" -ForegroundColor Red
                $failCount++
            }
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
    $githubUrl = "https://github.com/volkonskiy93-cyber/-2"
    Write-Host $githubUrl -ForegroundColor Cyan
}
