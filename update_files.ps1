[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8
$PSDefaultParameterValues['*:Encoding'] = 'utf8'

$token = 'YOUR_GITHUB_TOKEN_HERE'
$repo = 'volkonskiy93-cyber/-2'
$baseUrl = "https://api.github.com/repos/$repo/contents"
$headers = @{
    'Authorization' = "token $token"
    'Accept' = 'application/vnd.github.v3+json'
}

$files = @('index.html', 'admin.html', 'auth.js', 'data.js', 'admin.js', 'vercel.json', 'package.json')
$success = 0
$fail = 0

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  UPDATING FILES ON GITHUB" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

foreach ($f in $files) {
    $filePath = Join-Path (Get-Location) $f
    
    if (Test-Path $filePath) {
        Write-Host "Updating $f..." -NoNewline -ForegroundColor Cyan
        
        try {
            $content = Get-Content $filePath -Raw -Encoding UTF8
            $b64 = [Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes($content))
            
            Write-Host " (size: $($content.Length))" -NoNewline -ForegroundColor Gray
            
            $getUrl = "$baseUrl/$f"
            $sha = $null
            try {
                $shaResponse = Invoke-RestMethod -Uri $getUrl -Method Get -Headers $headers -ErrorAction Stop
                $sha = $shaResponse.sha
            } catch {
            }
            
            $body = @{
                message = "Update $f"
                content = $b64
            }
            
            if ($sha) {
                $body.sha = $sha
            }
            
            $bodyJson = $body | ConvertTo-Json -Compress
            $bodyBytes = [System.Text.Encoding]::UTF8.GetBytes($bodyJson)
            
            Invoke-RestMethod -Uri "$baseUrl/$f" -Method Put -Headers $headers -Body $bodyBytes -ContentType 'application/json' | Out-Null
            
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

# Обновляем deepseek_htmlобщая.html
# Ищем файл разными способами из-за проблем с кодировкой
$deepseekFile = $null
$allFiles = Get-ChildItem -Path . -Filter "*.html"
foreach ($file in $allFiles) {
    if ($file.Name -like "*общая*" -or $file.Name -like "*deepseek*") {
        $deepseekFile = $file
        break
    }
}

if ($deepseekFile) {
    $f = $deepseekFile.Name
    Write-Host "Updating $f..." -NoNewline -ForegroundColor Cyan
    
    try {
        $content = Get-Content $deepseekFile.FullName -Raw -Encoding UTF8
        $b64 = [Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes($content))
        
        Write-Host " (size: $($content.Length))" -NoNewline -ForegroundColor Gray
        
        $getUrl = "$baseUrl/$f"
        $sha = $null
        try {
            $shaResponse = Invoke-RestMethod -Uri $getUrl -Method Get -Headers $headers -ErrorAction Stop
            $sha = $shaResponse.sha
        } catch {
        }
        
        $body = @{
            message = "Update $f - added DOC export function"
            content = $b64
        }
        
        if ($sha) {
            $body.sha = $sha
        }
        
        $bodyJson = $body | ConvertTo-Json -Compress
        $bodyBytes = [System.Text.Encoding]::UTF8.GetBytes($bodyJson)
        
        Invoke-RestMethod -Uri "$baseUrl/$f" -Method Put -Headers $headers -Body $bodyBytes -ContentType 'application/json' | Out-Null
        
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
Write-Host "Project URL: https://2-git-main-pendehos-projects.vercel.app" -ForegroundColor Green
Write-Host "Wait 1-2 minutes for automatic Vercel deployment" -ForegroundColor Yellow
