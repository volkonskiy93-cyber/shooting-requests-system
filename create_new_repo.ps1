[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8
$PSDefaultParameterValues['*:Encoding'] = 'utf8'

$token = 'YOUR_GITHUB_TOKEN_HERE'
$baseUrl = 'https://api.github.com'
$headers = @{
    'Authorization' = "token $token"
    'Accept' = 'application/vnd.github.v3+json'
    'Content-Type' = 'application/json'
}

# Создаем новый репозиторий
$repoName = 'shooting-requests-system'
$repoDescription = 'Shooting requests system - Dobroe Utro program'

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  CREATING NEW REPOSITORY" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Creating repository: $repoName..." -ForegroundColor Cyan

$repoBody = @{
    name = $repoName
    description = $repoDescription
    private = $false
    auto_init = $false
} | ConvertTo-Json

try {
    $createResponse = Invoke-RestMethod -Uri "$baseUrl/user/repos" -Method Post -Headers $headers -Body $repoBody
    Write-Host "Repository created successfully!" -ForegroundColor Green
    Write-Host "Repository URL: $($createResponse.html_url)" -ForegroundColor Green
    Write-Host ""
} catch {
    if ($_.Exception.Response.StatusCode -eq 422) {
        Write-Host "Repository already exists, continuing..." -ForegroundColor Yellow
    } else {
        Write-Host "Error creating repository: $($_.Exception.Message)" -ForegroundColor Red
        exit 1
    }
}

$repo = "volkonskiy93-cyber/$repoName"
$contentsUrl = "$baseUrl/repos/$repo/contents"

# Файлы для загрузки
$files = @(
    'index.html',
    'admin.html',
    'auth.js',
    'data.js',
    'admin.js',
    'vercel.json',
    'package.json'
)

Write-Host "Uploading files..." -ForegroundColor Cyan
Write-Host ""

$success = 0
$fail = 0

foreach ($f in $files) {
    $filePath = Join-Path (Get-Location) $f
    
    if (Test-Path $filePath) {
        Write-Host "Uploading $f..." -NoNewline -ForegroundColor Cyan
        
        try {
            $content = Get-Content $filePath -Raw -Encoding UTF8
            $b64 = [Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes($content))
            
            $body = @{
                message = "Initial commit: Add $f"
                content = $b64
            } | ConvertTo-Json -Compress
            
            $bodyBytes = [System.Text.Encoding]::UTF8.GetBytes($body)
            
            Invoke-RestMethod -Uri "$contentsUrl/$f" -Method Put -Headers $headers -Body $bodyBytes -ContentType 'application/json' | Out-Null
            
            Write-Host " OK" -ForegroundColor Green
            $success++
        } catch {
            Write-Host " ERROR: $($_.Exception.Message)" -ForegroundColor Red
            $fail++
        }
        
        Start-Sleep -Milliseconds 500
    } else {
        Write-Host "$f not found" -ForegroundColor Red
        $fail++
    }
}

# Загружаем deepseek_htmlобщая.html
$deepseekFile = Get-ChildItem -Path . -Filter "*.html" | Where-Object { $_.Name -like "*общая*" -or $_.Name -like "*deepseek*" } | Select-Object -First 1

if ($deepseekFile) {
    $f = $deepseekFile.Name
    Write-Host "Uploading $f..." -NoNewline -ForegroundColor Cyan
    
    try {
        $content = Get-Content $deepseekFile.FullName -Raw -Encoding UTF8
        $b64 = [Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes($content))
        
        $body = @{
            message = "Initial commit: Add $f"
            content = $b64
        } | ConvertTo-Json -Compress
        
        $bodyBytes = [System.Text.Encoding]::UTF8.GetBytes($body)
        
        Invoke-RestMethod -Uri "$contentsUrl/$f" -Method Put -Headers $headers -Body $bodyBytes -ContentType 'application/json' | Out-Null
        
        Write-Host " OK" -ForegroundColor Green
        $success++
    } catch {
        Write-Host " ERROR: $($_.Exception.Message)" -ForegroundColor Red
        $fail++
    }
} else {
    Write-Host "deepseek_htmlобщая.html not found" -ForegroundColor Red
    $fail++
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Result: Success=$success Errors=$fail" -ForegroundColor $(if($fail -eq 0){'Green'}else{'Yellow'})
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Repository URL: https://github.com/$repo" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Go to Vercel Dashboard: https://vercel.com/dashboard" -ForegroundColor Yellow
Write-Host "2. Click 'Add New Project'" -ForegroundColor Yellow
Write-Host "3. Import Git Repository: $repo" -ForegroundColor Yellow
Write-Host "4. Deploy!" -ForegroundColor Yellow
