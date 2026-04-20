# Тест доступа к GitHub через разные методы

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  ТЕСТ ДОСТУПА К GITHUB" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Тест 1: GitHub CLI
Write-Host "Тест 1: GitHub CLI (gh)" -ForegroundColor Yellow
try {
    $ghVersion = gh --version 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  ✅ GitHub CLI установлен" -ForegroundColor Green
        Write-Host "  Версия: $($ghVersion[0])" -ForegroundColor Gray
        
        # Проверка авторизации
        $ghAuth = gh auth status 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Host "  ✅ Авторизован в GitHub" -ForegroundColor Green
            
            # Проверка доступа к репозиторию
            $repoInfo = gh repo view volkonskiy93-cyber/-2 --json name,url 2>&1
            if ($LASTEXITCODE -eq 0) {
                Write-Host "  ✅ Доступ к репозиторию есть!" -ForegroundColor Green
                Write-Host "  Репозиторий: volkonskiy93-cyber/-2" -ForegroundColor Gray
            } else {
                Write-Host "  ⚠️ Нет доступа к репозиторию" -ForegroundColor Yellow
                Write-Host "  Выполните: gh auth login" -ForegroundColor Gray
            }
        } else {
            Write-Host "  ⚠️ Не авторизован" -ForegroundColor Yellow
            Write-Host "  Выполните: gh auth login" -ForegroundColor Gray
        }
    } else {
        Write-Host "  ❌ GitHub CLI не установлен" -ForegroundColor Red
        Write-Host "  Установите: winget install --id GitHub.cli" -ForegroundColor Gray
    }
} catch {
    Write-Host "  ❌ GitHub CLI не найден" -ForegroundColor Red
}
Write-Host ""

# Тест 2: Токен доступа
Write-Host "Тест 2: Токен доступа (API)" -ForegroundColor Yellow
$token = "YOUR_GITHUB_TOKEN_HERE"
$repoOwner = "volkonskiy93-cyber"
$repoName = "-2"

try {
    $response = Invoke-RestMethod -Uri "https://api.github.com/repos/$repoOwner/$repoName" -Headers @{
        "Authorization" = "token $token"
        "Accept" = "application/vnd.github.v3+json"
    } -Method Get
    
    Write-Host "  ✅ Токен работает!" -ForegroundColor Green
    Write-Host "  Репозиторий: $($response.full_name)" -ForegroundColor Gray
    Write-Host "  Видимость: $($response.visibility)" -ForegroundColor Gray
    
    # Проверка прав токена
    $userResponse = Invoke-RestMethod -Uri "https://api.github.com/user" -Headers @{
        "Authorization" = "token $token"
        "Accept" = "application/vnd.github.v3+json"
    } -Method Get
    Write-Host "  Авторизован как: $($userResponse.login)" -ForegroundColor Gray
    
} catch {
    Write-Host "  ❌ Ошибка доступа: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  РЕКОМЕНДАЦИЯ" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Для полного доступа установите GitHub CLI:" -ForegroundColor Yellow
Write-Host "  winget install --id GitHub.cli" -ForegroundColor White
Write-Host ""
Write-Host "Затем авторизуйтесь:" -ForegroundColor Yellow
Write-Host "  gh auth login" -ForegroundColor White
Write-Host ""
