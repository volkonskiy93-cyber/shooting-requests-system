# Тест доступа к GitHub API
$token = "YOUR_GITHUB_TOKEN_HERE"
$repoOwner = "volkonskiy93-cyber"
$repoName = "-2"
$url = "https://api.github.com/repos/$repoOwner/$repoName"

Write-Host "Testing GitHub API access..." -ForegroundColor Cyan
Write-Host "Repository: $repoOwner/$repoName" -ForegroundColor Yellow

try {
    $response = Invoke-RestMethod -Uri $url -Headers @{
        "Authorization" = "token $token"
        "Accept" = "application/vnd.github.v3+json"
    } -Method Get
    
    Write-Host "SUCCESS! API access working!" -ForegroundColor Green
    Write-Host "Repository name: $($response.name)" -ForegroundColor Green
    Write-Host "Full name: $($response.full_name)" -ForegroundColor Green
    Write-Host "Default branch: $($response.default_branch)" -ForegroundColor Green
    
    return $true
} catch {
    Write-Host "ERROR: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "Response: $responseBody" -ForegroundColor Red
    }
    return $false
}
