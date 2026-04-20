$token = 'YOUR_GITHUB_TOKEN_HERE'
$repo = 'volkonskiy93-cyber/shooting-requests-system'
$baseUrl = "https://api.github.com/repos/$repo/contents"
$headers = @{
    'Authorization' = "token $token"
    'Accept' = 'application/vnd.github.v3+json'
}

# Ищем файл с "общая" в названии
$deepseekFile = Get-ChildItem -Path . -Filter "*.html" | Where-Object { $_.Name -like "*общая*" } | Select-Object -First 1

if (!$deepseekFile) {
    Write-Host "Файл deepseek_htmlобщая.html не найден" -ForegroundColor Red
    exit 1
}

$fileName = $deepseekFile.Name
Write-Host "Найден файл: $fileName" -ForegroundColor Green
Write-Host "Загрузка на GitHub..." -ForegroundColor Cyan

$content = Get-Content $deepseekFile.FullName -Raw -Encoding UTF8
$b64 = [Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes($content))

try {
    $shaResponse = Invoke-RestMethod -Uri "$baseUrl/$fileName" -Method Get -Headers $headers -ErrorAction Stop
    $sha = $shaResponse.sha
    Write-Host "Файл существует на GitHub, обновляем..." -ForegroundColor Yellow
} catch {
    $sha = $null
    Write-Host "Файл не существует на GitHub, создаем новый..." -ForegroundColor Yellow
}

$body = @{
    message = "Add/Update deepseek_htmlобщая.html - fix form opening"
    content = $b64
}

if ($sha) {
    $body.sha = $sha
}

$bodyJson = $body | ConvertTo-Json -Compress
$bodyBytes = [System.Text.Encoding]::UTF8.GetBytes($bodyJson)

try {
    $result = Invoke-RestMethod -Uri "$baseUrl/$fileName" -Method Put -Headers $headers -Body $bodyBytes -ContentType 'application/json'
    Write-Host "SUCCESS! Файл загружен на GitHub" -ForegroundColor Green
    Write-Host "Commit SHA: $($result.commit.sha)" -ForegroundColor Green
    Write-Host "Vercel автоматически пересоберет проект" -ForegroundColor Yellow
} catch {
    Write-Host "ERROR: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "Response: $responseBody" -ForegroundColor Red
    }
}
