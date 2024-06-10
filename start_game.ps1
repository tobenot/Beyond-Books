# 确认执行策略允许脚本执行
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser -Force

# 设置端口
$Port = 8000

Write-Host "Starting HTTP server on port $Port"

# 切换到当前目录
try {
    $currentDir = Get-Location
    Write-Host "Current Directory: $currentDir"
} catch {
    Write-Host "Failed to get current directory"
    exit
}

# 启动Python的HTTP服务器作为后台任务
$job = Start-Job -ScriptBlock {
    param ($Port, $currentDir)
    
    try {
        Set-Location $currentDir
        python -m http.server $Port
    } catch {
        $_ | Write-Host
    }
} -ArgumentList $Port, $currentDir

Start-Sleep -Seconds 1 # 等待服务器启动

# 打开默认浏览器并跳转到本地服务器网址
Start-Process "http://localhost:$Port"

# 使用用户输入来停止服务器
Write-Host "Press 'q' to stop the server..."
while ($true) {
    $input = Read-Host
    if ($input -eq 'q') {
        Write-Host "Stopping HTTP server..."
        Stop-Job -Id $job.Id
        Remove-Job -Id $job.Id
        Write-Host "HTTP server stopped."
        break
    }
}