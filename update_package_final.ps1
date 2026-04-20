$token = 'YOUR_GITHUB_TOKEN_HERE'
$repo = 'volkonskiy93-cyber/shooting-requests-system'
$baseUrl = "https://api.github.com/repos/$repo/contents/package.json"
$headers = @{
    'Authorization' = "token $token"
    'Accept' = 'application/vnd.github.v3+json'
}

$filePath = 'package.json'
$content = Get-Content $filePath -Raw -Encoding UTF8
$b64 = [Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes($content))

try {
    $shaResponse = Invoke-RestMethod -Uri $baseUrl -Method Get -Headers $headers
    $sha = $shaResponse.sha
    Write-Host "Found existing file, SHA: $($sha.Substring(0,8))..." -ForegroundColor Gray
} catch {
    $sha = $null
    Write-Host "File not found, creating new" -ForegroundColor Gray
}

$body = @{
    message = 'Update package.json - upgrade Node.js to 24.x'
    content = $b64
}

if ($sha) {
    $body.sha = $sha
}

$bodyJson = $body | ConvertTo-Json -Compress
$bodyBytes = [System.Text.Encoding]::UTF8.GetBytes($bodyJson)

try {
    $result = Invoke-RestMethod -Uri $baseUrl -Method Put -Headers $headers -Body $bodyBytes -ContentType 'application/json'
    Write-Host "SUCCESS! package.json updated" -ForegroundColor Green
    Write-Host "Commit SHA: $($result.commit.sha)" -ForegroundColor Green
    Write-Host "Vercel will automatically redeploy" -ForegroundColor Yellow
} catch {
    Write-Host "ERROR: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "Response: $responseBody" -ForegroundColor Red
    }
}
