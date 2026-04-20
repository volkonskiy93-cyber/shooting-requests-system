$token = 'YOUR_GITHUB_TOKEN_HERE'
$repo = 'volkonskiy93-cyber/shooting-requests-system'
$baseUrl = "https://api.github.com/repos/$repo/contents"

$deepseekFile = Get-ChildItem -Path . -Filter "*.html" | Where-Object { $_.Name -like "*общая*" } | Select-Object -First 1

if (!$deepseekFile) {
    Write-Host "File not found" -ForegroundColor Red
    exit 1
}

$fileName = $deepseekFile.Name
Write-Host "Found: $fileName" -ForegroundColor Green
Write-Host "Uploading..." -ForegroundColor Cyan

$content = Get-Content $deepseekFile.FullName -Raw -Encoding UTF8
$b64 = [Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes($content))

$sha = $null
try {
    $shaResponse = Invoke-RestMethod -Uri "$baseUrl/$fileName" -Method Get -Headers @{'Authorization'="token $token";'Accept'='application/vnd.github.v3+json'}
    $sha = $shaResponse.sha
} catch {
}

$body = @{
    message = 'Add/Update deepseek_htmlобщая.html'
    content = $b64
}

if ($sha) {
    $body.sha = $sha
}

$bodyJson = $body | ConvertTo-Json -Compress
$bodyBytes = [System.Text.Encoding]::UTF8.GetBytes($bodyJson)

try {
    $result = Invoke-RestMethod -Uri "$baseUrl/$fileName" -Method Put -Headers @{'Authorization'="token $token";'Accept'='application/vnd.github.v3+json';'Content-Type'='application/json'} -Body $bodyBytes
    Write-Host "SUCCESS! File uploaded" -ForegroundColor Green
    Write-Host "Vercel will auto-redeploy" -ForegroundColor Yellow
} catch {
    Write-Host "ERROR: $($_.Exception.Message)" -ForegroundColor Red
}
