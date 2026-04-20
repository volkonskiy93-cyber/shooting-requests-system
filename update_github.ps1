# Скрипт для обновления файлов на GitHub через API
$token = "YOUR_GITHUB_TOKEN_HERE"
$repoOwner = "volkonskiy93-cyber"
$repoName = "-2"
$baseUrl = "https://api.github.com/repos/$repoOwner/$repoName/contents"

# Функция для обновления файла
function Update-File {
    param(
        [string]$FilePath,
        [string]$FileName
    )
    
    Write-Host "Обновление файла: $FileName" -ForegroundColor Cyan
    
    # Читаем содержимое файла
    $fileContent = Get-Content -Path $FilePath -Raw -Encoding UTF8
    
    # Кодируем в base64
    $bytes = [System.Text.Encoding]::UTF8.GetBytes($fileContent)
    $base64Content = [Convert]::ToBase64String($bytes)
    
    # Получаем SHA существующего файла (если есть)
    $getUrl = "$baseUrl/$FileName"
    $headers = @{
        "Authorization" = "token $token"
        "Accept" = "application/vnd.github.v3+json"
    }
    
    try {
        $existingFile = Invoke-RestMethod -Uri $getUrl -Headers $headers -Method Get
        $sha = $existingFile.sha
        Write-Host "  Найден существующий файл, SHA: $sha" -ForegroundColor Yellow
    } catch {
        $sha = $null
        Write-Host "  Файл не существует, будет создан новый" -ForegroundColor Yellow
    }
    
    # Подготавливаем данные для обновления
    $body = @{
        message = "Обновление стилей iOS 26"
        content = $base64Content
    }
    
    if ($sha) {
        $body.sha = $sha
    }
    
    $jsonBody = $body | ConvertTo-Json
    
    # Обновляем файл
    try {
        $response = Invoke-RestMethod -Uri $getUrl -Headers $headers -Method Put -Body $jsonBody -ContentType "application/json"
        Write-Host "  ✅ Успешно обновлен!" -ForegroundColor Green
        return $true
    } catch {
        Write-Host "  ❌ Ошибка: $($_.Exception.Message)" -ForegroundColor Red
        if ($_.Exception.Response) {
            $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
            $responseBody = $reader.ReadToEnd()
            Write-Host "  Детали: $responseBody" -ForegroundColor Red
        }
        return $false
    }
}

# Обновляем файлы
Write-Host "`n🚀 Начало обновления файлов на GitHub...`n" -ForegroundColor Magenta

$files = @(
    @{Path = "index.html"; Name = "index.html"},
    @{Path = "deepseek_htmlобщая.html"; Name = "deepseek_htmlобщая.html"},
    @{Path = "admin.html"; Name = "admin.html"}
)

$successCount = 0
$errorCount = 0

foreach ($file in $files) {
    if (Test-Path $file.Path) {
        $result = Update-File -FilePath $file.Path -FileName $file.Name
        if ($result) {
            $successCount++
        } else {
            $errorCount++
        }
        Start-Sleep -Seconds 1  # Небольшая задержка между запросами
    } else {
        Write-Host "❌ Файл не найден: $($file.Path)" -ForegroundColor Red
        $errorCount++
    }
    Write-Host ""
}

Write-Host "═══════════════════════════════════════════════════" -ForegroundColor Magenta
Write-Host "📊 Результаты обновления:" -ForegroundColor Magenta
Write-Host "  ✅ Успешно: $successCount" -ForegroundColor Green
Write-Host "  ❌ Ошибок: $errorCount" -ForegroundColor Red
Write-Host "═══════════════════════════════════════════════════`n" -ForegroundColor Magenta

if ($successCount -eq $files.Count) {
    Write-Host "🎉 Все файлы успешно обновлены на GitHub!" -ForegroundColor Green
} else {
    Write-Host "⚠️ Некоторые файлы не удалось обновить" -ForegroundColor Yellow
}
