# Обновление deepseek_htmlобщая.html на GitHub
$token = 'YOUR_GITHUB_TOKEN_HERE'
$repo = 'volkonskiy93-cyber/-2'
$baseUrl = "https://api.github.com/repos/$repo/contents"
$headers = @{
    'Authorization' = "token $token"
    'Accept' = 'application/vnd.github.v3+json'
}

$fileName = 'deepseek_htmlобщая.html'
$filePath = Join-Path (Get-Location) $fileName

Write-Host "Поиск файла: $fileName" -ForegroundColor Cyan

# Ищем файл
$foundFile = $null
if (Test-Path $filePath) {
    $foundFile = Get-Item $filePath
} else {
    # Ищем файл по части имени
    $allFiles = Get-ChildItem -Path . -Filter "*.html"
    foreach ($file in $allFiles) {
        if ($file.Name.Contains('общая')) {
            $foundFile = $file
            break
        }
    }
}

if ($foundFile) {
    Write-Host "Файл найден: $($foundFile.Name)" -ForegroundColor Green
    Write-Host "Обновление на GitHub..." -ForegroundColor Cyan
    
    try {
        $content = [System.IO.File]::ReadAllText($foundFile.FullName, [System.Text.Encoding]::UTF8)
        $b64 = [Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes($content))
        
        Write-Host "Размер: $($b64.Length) символов" -ForegroundColor Gray
        
        $getUrl = "$baseUrl/$fileName"
        $shaResponse = Invoke-RestMethod -Uri $getUrl -Method Get -Headers $headers
        $sha = $shaResponse.sha
        
        Write-Host "SHA: $($sha.Substring(0,8))..." -ForegroundColor Gray
        
        $body = @{
            message = "Fix authorization check - add delay for auth.js loading"
            content = $b64
            sha = $sha
        }
        
        $bodyJson = $body | ConvertTo-Json -Compress
        $bodyBytes = [System.Text.Encoding]::UTF8.GetBytes($bodyJson)
        
        Invoke-RestMethod -Uri "$baseUrl/$fileName" -Method Put -Headers $headers -Body $bodyBytes -ContentType 'application/json' | Out-Null
        
        Write-Host "OK - Файл обновлен успешно!" -ForegroundColor Green
    } catch {
        Write-Host "ERROR: $($_.Exception.Message)" -ForegroundColor Red
    }
} else {
    Write-Host "Файл не найден" -ForegroundColor Red
    Write-Host "Найденные HTML файлы:" -ForegroundColor Gray
    Get-ChildItem -Path . -Filter "*.html" | ForEach-Object { Write-Host "  - $($_.Name)" -ForegroundColor Gray }
}
