# Обновление файлов через GitHub CLI
$env:GH_TOKEN = 'YOUR_GITHUB_TOKEN_HERE'

Write-Host "🚀 Обновление файлов на GitHub через GitHub CLI..." -ForegroundColor Magenta
Write-Host ""

function Update-File-GH {
    param(
        [string]$FilePath,
        [string]$FileName
    )
    
    Write-Host "📄 Обновление: $FileName" -ForegroundColor Cyan
    
    if (-not (Test-Path $FilePath)) {
        Write-Host "  ❌ Файл не найден" -ForegroundColor Red
        return $false
    }
    
    try {
        # Читаем файл
        $content = Get-Content -Path $FilePath -Raw -Encoding UTF8
        $base64Content = [Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes($content))
        Write-Host "  ✓ Файл прочитан и закодирован" -ForegroundColor Green
        
        # Получаем SHA существующего файла
        $shaJson = gh api "repos/volkonskiy93-cyber/-2/contents/$FileName" --method GET --jq .sha 2>&1
        $sha = $shaJson | Where-Object { $_ -match '^[a-f0-9]{40}$' }
        
        if ($sha) {
            Write-Host "  ✓ SHA получен: $($sha.Substring(0, 8))..." -ForegroundColor Yellow
        } else {
            Write-Host "  ℹ Файл новый" -ForegroundColor Yellow
            $sha = $null
        }
        
        # Обновляем файл
        $body = @{
            message = "Обновление стилей iOS 26"
            content = $base64Content
        }
        
        if ($sha) {
            $body.sha = $sha
        }
        
        $bodyJson = $body | ConvertTo-Json -Compress
        
        $result = gh api "repos/volkonskiy93-cyber/-2/contents/$FileName" --method PUT --input - --raw-field message="Обновление стилей iOS 26" --raw-field content=$base64Content $(if($sha){"--raw-field sha=$sha"}) 2>&1
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "  ✅ Файл успешно обновлен!" -ForegroundColor Green
            return $true
        } else {
            Write-Host "  ❌ Ошибка: $result" -ForegroundColor Red
            return $false
        }
    } catch {
        Write-Host "  ❌ Ошибка: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

$files = @(
    @{Path = "index.html"; Name = "index.html"},
    @{Path = "deepseek_htmlобщая.html"; Name = "deepseek_htmlобщая.html"},
    @{Path = "admin.html"; Name = "admin.html"}
)

$success = 0
$error = 0

foreach ($file in $files) {
    if (Update-File-GH -FilePath $file.Path -FileName $file.Name) {
        $success++
    } else {
        $error++
    }
    Write-Host ""
    Start-Sleep -Seconds 1
}

Write-Host "═══════════════════════════════════════════════════" -ForegroundColor Magenta
Write-Host "📊 Результаты: ✅ $success  ❌ $error" -ForegroundColor $(if($error -eq 0){'Green'}else{'Yellow'})
Write-Host "═══════════════════════════════════════════════════" -ForegroundColor Magenta

if ($success -eq $files.Count) {
    Write-Host ""
    Write-Host "🎉 Все файлы обновлены!" -ForegroundColor Green
    Write-Host "Проверьте: https://github.com/volkonskiy93-cyber/-2" -ForegroundColor Cyan
}
