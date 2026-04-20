# Обновление только index.html на GitHub
$token = 'YOUR_GITHUB_TOKEN_HERE'
$repo = 'volkonskiy93-cyber/-2'
$baseUrl = "https://api.github.com/repos/$repo/contents"
$headers = @{
    'Authorization' = "token $token"
    'Accept' = 'application/vnd.github.v3+json'
}

$f = 'index.html'
$filePath = Join-Path (Get-Location) $f

Write-Host "Обновление $f на GitHub..." -ForegroundColor Cyan

if (Test-Path $filePath) {
    try {
        $content = [System.IO.File]::ReadAllText($filePath, [System.Text.Encoding]::UTF8)
        $b64 = [Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes($content))
        
        Write-Host "Размер: $($b64.Length) символов" -ForegroundColor Gray
        
        $getUrl = "$baseUrl/$f"
        $shaResponse = Invoke-RestMethod -Uri $getUrl -Method Get -Headers $headers
        $sha = $shaResponse.sha
        
        Write-Host "SHA: $($sha.Substring(0,8))..." -ForegroundColor Gray
        
        $body = @{
            message = "Fix registration and login - add error handling and global functions"
            content = $b64
            sha = $sha
        }
        
        $bodyJson = $body | ConvertTo-Json -Compress
        $bodyBytes = [System.Text.Encoding]::UTF8.GetBytes($bodyJson)
        
        Invoke-RestMethod -Uri "$baseUrl/$f" -Method Put -Headers $headers -Body $bodyBytes -ContentType 'application/json' | Out-Null
        
        Write-Host "OK - Файл обновлен успешно!" -ForegroundColor Green
    } catch {
        Write-Host "ERROR: $($_.Exception.Message)" -ForegroundColor Red
    }
} else {
    Write-Host "Файл не найден: $filePath" -ForegroundColor Red
}
