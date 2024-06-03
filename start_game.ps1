# 设置端口
$Port = 8000

# 设置当前目录路径
$Directory = Get-Location

# 确认执行策略允许脚本执行
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser -Force

Write-Host "Starting HTTP server in $Directory on port $Port"

# 启动Python的HTTP服务器作为后台任务
$job = Start-Job -ScriptBlock {
    python -m http.server $Port
}

Start-Sleep -Seconds 2 # 等待服务器启动

# 打开默认浏览器并跳转到本地服务器网址
Start-Process "http://localhost:$Port"

# 阻塞终端直到任务完成
Write-Host "Press Ctrl+C to stop the server..."
Wait-Job -Id $job.Id

# 终止后台任务
Stop-Job -Id $job.Id
Remove-Job -Id $job.Id

Write-Host "HTTP server stopped."