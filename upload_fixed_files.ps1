$ErrorActionPreference = 'Stop'

$token = 'YOUR_GITHUB_TOKEN_HERE'
$repo = 'volkonskiy93-cyber/shooting-requests-system'
$baseUrl = "https://api.github.com/repos/$repo/contents"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  UPLOADING FIXED FILES" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Copy forms.html
$source = "deepseek_htmlобщая.html"
$target = "forms.html"

if (Test-Path $source) {
    Write-Host "Copying $source -> $target..." -ForegroundColor Yellow
    Copy-Item $source $target -Force
    Write-Host "File copied" -ForegroundColor Green
} else {
    Write-Host "ERROR: $source not found" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Upload forms.html
Write-Host "Uploading forms.html..." -ForegroundColor Yellow
$content = Get-Content $target -Raw -Encoding UTF8
$bytes = [System.Text.Encoding]::UTF8.GetBytes($content)
$b64 = [Convert]::ToBase64String($bytes)

$sha = $null
try {
    $getUrl = "$baseUrl/forms.html"
    $getHeaders = @{
        'Authorization' = "token $token"
        'Accept' = 'application/vnd.github.v3+json'
    }
    $response = Invoke-RestMethod -Uri $getUrl -Method Get -Headers $getHeaders
    $sha = $response.sha
} catch {}

$body = @{
    message = "Update forms.html - fix visual artifacts and save issues"
    content = $b64
}

if ($sha) {
    $body.sha = $sha
}

$putHeaders = @{
    'Authorization' = "token $token"
    'Accept' = 'application/vnd.github.v3+json'
    'Content-Type' = 'application/json'
}

$bodyJson = $body | ConvertTo-Json -Compress
$bodyBytes = [System.Text.Encoding]::UTF8.GetBytes($bodyJson)

try {
    $putUrl = "$baseUrl/forms.html"
    $result = Invoke-RestMethod -Uri $putUrl -Method Put -Headers $putHeaders -Body $bodyBytes
    Write-Host "SUCCESS! forms.html uploaded" -ForegroundColor Green
    Write-Host "Commit SHA: $($result.commit.sha.Substring(0,8))..." -ForegroundColor Gray
} catch {
    Write-Host "ERROR uploading forms.html: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Upload admin.js
Write-Host "Uploading admin.js..." -ForegroundColor Yellow
$content = Get-Content "admin.js" -Raw -Encoding UTF8
$bytes = [System.Text.Encoding]::UTF8.GetBytes($content)
$b64 = [Convert]::ToBase64String($bytes)

$sha = $null
try {
    $getUrl = "$baseUrl/admin.js"
    $getHeaders = @{
        'Authorization' = "token $token"
        'Accept' = 'application/vnd.github.v3+json'
    }
    $response = Invoke-RestMethod -Uri $getUrl -Method Get -Headers $getHeaders
    $sha = $response.sha
} catch {}

$body = @{
    message = "Update admin.js - fix application display"
    content = $b64
}

if ($sha) {
    $body.sha = $sha
}

$bodyJson = $body | ConvertTo-Json -Compress
$bodyBytes = [System.Text.Encoding]::UTF8.GetBytes($bodyJson)

try {
    $putUrl = "$baseUrl/admin.js"
    $result = Invoke-RestMethod -Uri $putUrl -Method Put -Headers $putHeaders -Body $bodyBytes
    Write-Host "SUCCESS! admin.js uploaded" -ForegroundColor Green
    Write-Host "Commit SHA: $($result.commit.sha.Substring(0,8))..." -ForegroundColor Gray
} catch {
    Write-Host "ERROR uploading admin.js: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  DONE" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Vercel will auto-redeploy in 1-2 minutes" -ForegroundColor Yellow
Write-Host "URL: https://shooting-requests-system.vercel.app" -ForegroundColor Cyan
