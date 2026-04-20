# Тест доступа к GitHub API
$token = "YOUR_GITHUB_TOKEN_HERE"
$repoOwner = "volkonskiy93-cyber"
$repoName = "-2"

Write-Host "Testing GitHub API access..." -ForegroundColor Cyan
Write-Host ""

# Тест 1: Проверка репозитория
Write-Host "Test 1: Repository access" -ForegroundColor Yellow
try {
    $repoUrl = "https://api.github.com/repos/$repoOwner/$repoName"
    $repo = Invoke-RestMethod -Uri $repoUrl -Headers @{
        "Authorization" = "token $token"
        "Accept" = "application/vnd.github.v3+json"
    } -Method Get
    
    Write-Host "  SUCCESS!" -ForegroundColor Green
    Write-Host "  Repository: $($repo.full_name)" -ForegroundColor Green
    Write-Host "  Default branch: $($repo.default_branch)" -ForegroundColor Green
    Write-Host ""
} catch {
    Write-Host "  ERROR: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
}

# Тест 2: Проверка содержимого
Write-Host "Test 2: Content access" -ForegroundColor Yellow
try {
    $contentUrl = "https://api.github.com/repos/$repoOwner/$repoName/contents"
    $contents = Invoke-RestMethod -Uri $contentUrl -Headers @{
        "Authorization" = "token $token"
        "Accept" = "application/vnd.github.v3+json"
    } -Method Get
    
    Write-Host "  SUCCESS!" -ForegroundColor Green
    Write-Host "  Files found: $($contents.Count)" -ForegroundColor Green
    Write-Host ""
} catch {
    Write-Host "  ERROR: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
}

# Тест 3: Проверка прав токена
Write-Host "Test 3: Token permissions" -ForegroundColor Yellow
try {
    $userUrl = "https://api.github.com/user"
    $user = Invoke-RestMethod -Uri $userUrl -Headers @{
        "Authorization" = "token $token"
        "Accept" = "application/vnd.github.v3+json"
    } -Method Get
    
    Write-Host "  SUCCESS!" -ForegroundColor Green
    Write-Host "  Authenticated as: $($user.login)" -ForegroundColor Green
    Write-Host ""
} catch {
    Write-Host "  ERROR: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
}

Write-Host "API access test completed!" -ForegroundColor Magenta
