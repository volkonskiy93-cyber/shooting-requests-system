# Прямое обновление файлов через GitHub API
$token = 'YOUR_GITHUB_TOKEN_HERE'
$repo = 'volkonskiy93-cyber/-2'
$baseUrl = "https://api.github.com/repos/$repo/contents"
$headers = @{
    'Authorization' = "token $token"
    'Accept' = 'application/vnd.github.v3+json'
}

$files = @('index.html', 'deepseek_htmlобщая.html', 'admin.html')
$success = 0
$fail = 0

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  ОБНОВЛЕНИЕ ФАЙЛОВ НА GITHUB" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Текущая директория: $(Get-Location)" -ForegroundColor Gray
Write-Host ""

foreach ($f in $files) {
    # Ищем файл с учетом возможных проблем кодировки
    $filePath = $null
    
    # Сначала пробуем прямой путь
    if (Test-Path $f) {
        $filePath = (Resolve-Path $f).Path
    } else {
        # Ищем файл по части имени или по всем HTML файлам
        if ($f -eq 'deepseek_htmlобщая.html') {
            # Ищем файл, содержащий "общая" в имени
            $foundFile = Get-ChildItem -Path . -Filter "*.html" -ErrorAction SilentlyContinue | 
                Where-Object { $_.Name -like "*общая*" -or $_.Name -like "*общая*" } | 
                Select-Object -First 1
            if ($foundFile) {
                $filePath = $foundFile.FullName
            }
        } else {
            # Для других файлов ищем по точному имени
            $foundFile = Get-ChildItem -Path . -Filter $f -ErrorAction SilentlyContinue | Select-Object -First 1
            if ($foundFile) {
                $filePath = $foundFile.FullName
            }
        }
    }
    
    if ($filePath) {
        Write-Host "Обновление $f..." -NoNewline -ForegroundColor Cyan
        
        try {
            # Читаем файл
            $content = [System.IO.File]::ReadAllText($filePath, [System.Text.Encoding]::UTF8)
            $b64 = [Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes($content))
            
            Write-Host " (размер: $($b64.Length) символов)" -NoNewline -ForegroundColor Gray
            
            # Получаем SHA существующего файла
            $getUrl = "$baseUrl/$f"
            $shaResponse = Invoke-RestMethod -Uri $getUrl -Method Get -Headers $headers -ErrorAction SilentlyContinue
            $sha = $shaResponse.sha
            
            if ($sha) {
                Write-Host " (SHA: $($sha.Substring(0,8))...)" -NoNewline -ForegroundColor Gray
            }
            
            # Создаем тело запроса
            $commitMessage = if ($f -eq 'index.html') { 
                "Fix registration and login - add error handling and global functions" 
            } else { 
                "Update iOS 26 styles" 
            }
            $body = @{
                message = $commitMessage
                content = $b64
            }
            
            if ($sha) {
                $body.sha = $sha
            }
            
            # Отправляем запрос
            $bodyJson = $body | ConvertTo-Json -Compress
            $bodyBytes = [System.Text.Encoding]::UTF8.GetBytes($bodyJson)
            $putUrl = "$baseUrl/$f"
            
            Invoke-RestMethod -Uri $putUrl -Method Put -Headers $headers -Body $bodyBytes -ContentType 'application/json' -ErrorAction Stop | Out-Null
            
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
        Write-Host "  Попытка найти файл..." -ForegroundColor Yellow
        $allFiles = Get-ChildItem -Path . -Filter "*.html" | Select-Object Name
        Write-Host "  Найденные HTML файлы:" -ForegroundColor Gray
        $allFiles | ForEach-Object { Write-Host "    - $($_.Name)" -ForegroundColor Gray }
        $fail++
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Результат: Success=$success Errors=$fail" -ForegroundColor $(if($fail -eq 0){'Green'}else{'Yellow'})
Write-Host "========================================" -ForegroundColor Cyan

if ($success -eq $files.Count) {
    Write-Host ""
    Write-Host "Проверьте изменения:" -ForegroundColor Yellow
    Write-Host "https://github.com/volkonskiy93-cyber/-2" -ForegroundColor Cyan
}
