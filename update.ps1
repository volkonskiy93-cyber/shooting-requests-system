$token = "YOUR_GITHUB_TOKEN_HERE"
$repoOwner = "volkonskiy93-cyber"
$repoName = "-2"
$baseUrl = "https://api.github.com/repos/$repoOwner/$repoName/contents"

function UpdateFile($filePath, $fileName) {
    Write-Host "Updating: $fileName"
    
    if (-not (Test-Path $filePath)) {
        Write-Host "  ERROR: File not found" -ForegroundColor Red
        return $false
    }
    
    try {
        $content = Get-Content -Path $filePath -Raw -Encoding UTF8
        $bytes = [System.Text.Encoding]::UTF8.GetBytes($content)
        $base64 = [Convert]::ToBase64String($bytes)
        
        $sha = $null
        try {
            $existing = Invoke-RestMethod -Uri "$baseUrl/$fileName" -Headers @{Authorization="token $token"; Accept="application/vnd.github.v3+json"} -Method Get
            $sha = $existing.sha
        } catch {}
        
        $body = @{message="Update iOS 26 styles"; content=$base64}
        if ($sha) { $body.sha = $sha }
        
        $json = $body | ConvertTo-Json -Compress
        Invoke-RestMethod -Uri "$baseUrl/$fileName" -Method Put -Headers @{Authorization="token $token"; Accept="application/vnd.github.v3+json"; "Content-Type"="application/json"} -Body $json -ContentType "application/json" | Out-Null
        
        Write-Host "  SUCCESS!" -ForegroundColor Green
        return $true
    } catch {
        Write-Host "  ERROR: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

Write-Host "Starting update..." -ForegroundColor Magenta
Write-Host ""

$files = @(
    @{Path="index.html"; Name="index.html"},
    @{Path="deepseek_htmlобщая.html"; Name="deepseek_htmlобщая.html"},
    @{Path="admin.html"; Name="admin.html"}
)

$success = 0
$error = 0

foreach ($file in $files) {
    if (UpdateFile -FilePath $file.Path -FileName $file.Name) {
        $success++
    } else {
        $error++
    }
    Start-Sleep -Seconds 1
}

Write-Host ""
Write-Host "Results: SUCCESS=$success ERROR=$error" -ForegroundColor Magenta
