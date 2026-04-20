$ErrorActionPreference = 'Stop'

$token = 'YOUR_GITHUB_TOKEN_HERE'
$repo = 'volkonskiy93-cyber/shooting-requests-system'
$baseUrl = "https://api.github.com/repos/$repo/contents"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  FIXING 404 ERROR" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Copy file
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

# Step 2: Read file content
Write-Host "Reading $target..." -ForegroundColor Yellow
$content = Get-Content $target -Raw -Encoding UTF8
$bytes = [System.Text.Encoding]::UTF8.GetBytes($content)
$b64 = [Convert]::ToBase64String($bytes)

Write-Host "File size: $($content.Length) characters" -ForegroundColor Gray
Write-Host ""

# Step 3: Check if file exists on GitHub
Write-Host "Checking GitHub..." -ForegroundColor Yellow
$sha = $null
try {
    $getUrl = "$baseUrl/forms.html"
    $getHeaders = @{
        'Authorization' = "token $token"
        'Accept' = 'application/vnd.github.v3+json'
    }
    $response = Invoke-RestMethod -Uri $getUrl -Method Get -Headers $getHeaders
    $sha = $response.sha
    Write-Host "File exists, updating..." -ForegroundColor Gray
} catch {
    Write-Host "Creating new file..." -ForegroundColor Gray
}

# Step 4: Upload to GitHub
Write-Host ""
Write-Host "Uploading to GitHub..." -ForegroundColor Yellow

$body = @{
    message = "Add forms.html - fix 404 error for correspondent page"
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
    Write-Host ""
    Write-Host "SUCCESS! File uploaded to GitHub" -ForegroundColor Green
    Write-Host "Commit SHA: $($result.commit.sha.Substring(0,8))..." -ForegroundColor Gray
    Write-Host ""
    Write-Host "Vercel will auto-redeploy in 1-2 minutes" -ForegroundColor Yellow
    Write-Host "URL: https://shooting-requests-system.vercel.app" -ForegroundColor Cyan
} catch {
    Write-Host ""
    Write-Host "ERROR: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.ErrorDetails.Message) {
        Write-Host $_.ErrorDetails.Message -ForegroundColor Red
    }
    exit 1
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  DONE" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
