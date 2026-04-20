[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8
$PSDefaultParameterValues['*:Encoding'] = 'utf8'

$token = 'YOUR_GITHUB_TOKEN_HERE'
$repo = 'volkonskiy93-cyber/shooting-requests-system'
$baseUrl = "https://api.github.com/repos/$repo/contents"
$headers = @{
    'Authorization' = "token $token"
    'Accept' = 'application/vnd.github.v3+json'
}

$f = 'package.json'
$filePath = Join-Path (Get-Location) $f

Write-Host "Updating $f..." -ForegroundColor Cyan

try {
    $content = Get-Content $filePath -Raw -Encoding UTF8
    $b64 = [Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes($content))
    
    $getUrl = "$baseUrl/$f"
    $sha = $null
    try {
        $shaResponse = Invoke-RestMethod -Uri $getUrl -Method Get -Headers $headers -ErrorAction Stop
        $sha = $shaResponse.sha
    } catch {
    }
    
    $body = @{
        message = "Update package.json - upgrade Node.js to 24.x"
        content = $b64
    }
    
    if ($sha) {
        $body.sha = $sha
    }
    
    $bodyJson = $body | ConvertTo-Json -Compress
    $bodyBytes = [System.Text.Encoding]::UTF8.GetBytes($bodyJson)
    
    Invoke-RestMethod -Uri "$baseUrl/$f" -Method Put -Headers $headers -Body $bodyBytes -ContentType 'application/json' | Out-Null
    
    Write-Host "package.json updated successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next: Go to Vercel Dashboard and redeploy the project" -ForegroundColor Yellow
} catch {
    Write-Host "ERROR: $($_.Exception.Message)" -ForegroundColor Red
}
