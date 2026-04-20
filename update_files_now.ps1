# Обновление файлов на GitHub через API с полным доступом
$ErrorActionPreference = "Stop"

$token = "YOUR_GITHUB_TOKEN_HERE"
$repoOwner = "volkonskiy93-cyber"
$repoName = "-2"
$baseUrl = "https://api.github.com/repos/$repoOwner/$repoName/contents"

function Update-File {
    param(
        [string]$FilePath,
        [string]$FileName
    )
    
    Write-Host "📄 Обновление файла: $FileName" -ForegroundColor Cyan
    
    if (-not (Test-Path $FilePath)) {
        Write-Host "  ❌ Файл не найден: $FilePath" -ForegroundColor Red
        return $false
    }
    
    try {
        # Читаем файл
        $fileContent = Get-Content -Path $FilePath -Raw -Encoding UTF8
        Write-Host "  ✓ Файл прочитан ($($fileContent.Length) символов)" -ForegroundColor Green
        
        # Кодируем в base64
        $bytes = [System.Text.Encoding]::UTF8.GetBytes($fileContent)
        $base64Content = [Convert]::ToBase64String($bytes)
        Write-Host "  ✓ Файл закодирован в base64" -ForegroundColor Green
        
        # Получаем SHA существующего файла
        $getUrl = "$baseUrl/$FileName"
        $headers = @{
            "Authorization" = "token $token"
            "Accept" = "application/vnd.github.v3+json"
        }
        
        $sha = $null
        try {
            $existingFile = Invoke-RestMethod -Uri $getUrl -Headers $headers -Method Get
            $sha = $existingFile.sha
            Write-Host "  ✓ Найден существующий файл, SHA: $($sha.Substring(0, 8))..." -ForegroundColor Yellow
        } catch {
            Write-Host "  ℹ Файл не существует, будет создан новый" -ForegroundColor Yellow
        }
        
        # Обновляем файл
        $body = @{
            message = "Обновление стилей iOS 26 - автоматическое обновление"
            content = $base64Content
        }
        
        if ($sha) {
            $body.sha = $sha
        }
        
        $jsonBody = $body | ConvertTo-Json -Compress
        
        $updateUrl = "$baseUrl/$FileName"
        $response = Invoke-RestMethod -Uri $updateUrl -Headers $headers -Method Put -Body $jsonBody -ContentType "application/json"
        
        Write-Host "  ✅ Файл успешно обновлен!" -ForegroundColor Green
        Write-Host "  Коммит: $($response.commit.sha)" -ForegroundColor Gray
        return $true
        
    } catch {
        Write-Host "  ❌ Ошибка: $($_.Exception.Message)" -ForegroundColor Red
        if ($_.Exception.Response) {
            try {
                $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
                $responseBody = $reader.ReadToEnd()
                $errorData = $responseBody | ConvertFrom-Json
                Write-Host "  Детали: $($errorData.message)" -ForegroundColor Red
            } catch {
                Write-Host "  Детали: $responseBody" -ForegroundColor Red
            }
        }
        return $false
    }
}

# Основной код
Write-Host ""
Write-Host "🚀 Обновление файлов на GitHub с полным доступом..." -ForegroundColor Magenta
Write-Host ""

# Проверка доступа
try {
    $repoInfo = Invoke-RestMethod -Uri "https://api.github.com/repos/$repoOwner/$repoName" -Headers @{
        "Authorization" = "token $token"
        "Accept" = "application/vnd.github.v3+json"
    } -Method Get
    Write-Host "✅ Доступ к репозиторию подтвержден!" -ForegroundColor Green
    Write-Host "   Репозиторий: $($repoInfo.full_name)" -ForegroundColor Gray
    Write-Host "   Видимость: $($repoInfo.visibility)" -ForegroundColor Gray
    Write-Host ""
} catch {
    Write-Host "❌ Ошибка доступа к репозиторию: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

$files = @(
    @{Path = "index.html"; Name = "index.html"},
    @{Path = "deepseek_htmlобщая.html"; Name = "deepseek_htmlобщая.html"},
    @{Path = "admin.html"; Name = "admin.html"}
)

$successCount = 0
$errorCount = 0

foreach ($file in $files) {
    $result = Update-File -FilePath $file.Path -FileName $file.Name
    if ($result) {
        $successCount++
    } else {
        $errorCount++
    }
    Write-Host ""
    Start-Sleep -Seconds 1
}

Write-Host "═══════════════════════════════════════════════════" -ForegroundColor Magenta
Write-Host "📊 Результаты обновления:" -ForegroundColor Magenta
Write-Host "  ✅ Успешно: $successCount" -ForegroundColor Green
Write-Host "  ❌ Ошибок: $errorCount" -ForegroundColor Red
Write-Host "═══════════════════════════════════════════════════" -ForegroundColor Magenta
Write-Host ""

if ($successCount -eq $files.Count) {
    Write-Host "🎉 Все файлы успешно обновлены на GitHub!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Проверьте изменения:" -ForegroundColor Yellow
    Write-Host "https://github.com/$repoOwner/$repoName" -ForegroundColor Cyan
} else {
    Write-Host "⚠️ Некоторые файлы не удалось обновить" -ForegroundColor Yellow
}

Write-Host ""
