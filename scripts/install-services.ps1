# Huckleberry Windows Services Setup
# Creates Scheduled Tasks matching the 12 macOS launchd agents
# Run as Administrator: Right-click > Run as Administrator

$hbDir = "$env:USERPROFILE\.huckleberry"
$kimakiDir = "$env:USERPROFILE\.kimaki"
$logDir = "$env:USERPROFILE\.huckleberry\logs"
New-Item -ItemType Directory -Path $logDir -Force | Out-Null

function New-Task {
    param(
        [string]$Name,
        [string]$Command,
        [string]$Args = "",
        [string]$Trigger = "AtStartup",
        [int]$IntervalSeconds = 0,
        [string]$Description = ""
    )

    $taskName = "Huckleberry-$Name"
    $action = New-ScheduledTaskAction -Execute $Command -Argument $Args
    $settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable -RestartCount 3 -RestartInterval (New-TimeSpan -Minutes 1)

    if ($Trigger -eq "AtStartup") {
        $trigger = New-ScheduledTaskTrigger -AtStartup -RandomDelay (New-TimeSpan -Seconds 30)
    } elseif ($Trigger -eq "Repetition") {
        $trigger = New-ScheduledTaskTrigger -Once -At (Get-Date) -RepetitionInterval (New-TimeSpan -Seconds $IntervalSeconds) -RepetitionDuration ([TimeSpan]::MaxValue)
    }

    try {
        Unregister-ScheduledTask -TaskName $taskName -Confirm:$false -ErrorAction SilentlyContinue
        Register-ScheduledTask -TaskName $taskName -Action $action -Trigger $trigger -Settings $settings -Description $Description -Force | Out-Null
        Write-Host "  [OK] $taskName" -ForegroundColor Green
    } catch {
        Write-Host "  [WARN] $taskName — $_" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "  Huckleberry — Setting up Windows services..." -ForegroundColor Cyan
Write-Host ""

# 1. kimaki bot (KeepAlive = always running)
New-Task -Name "kimaki-bot" -Command "powershell.exe" -Args "-WindowStyle Hidden -Command `"cd '$kimakiDir'; .\start-kimaki.sh`"" -Description "Huckleberry kimaki Discord bridge"

# 2. kimaki watchdog
New-Task -Name "kimaki-watchdog" -Command "node" -Args "$kimakiDir\watchdog\index.js" -Description "Huckleberry kimaki watchdog"

# 3. Health monitor (every 5 min)
New-Task -Name "kimaki-monitor" -Command "powershell.exe" -Args "-WindowStyle Hidden -File `"$hbDir\scripts\keepalive.ps1`"" -Trigger "Repetition" -IntervalSeconds 300 -Description "Huckleberry health monitor (every 5min)"

# 4. Kanban server
New-Task -Name "kanban-server" -Command "node" -Args "$hbDir\kanban\src\server.mjs" -Description "Huckleberry kanban API server"

# 5. Kanban dispatcher
New-Task -Name "kanban-dispatcher" -Command "node" -Args "$hbDir\kanban\src\dispatcher.mjs" -Description "Huckleberry kanban task dispatcher"

# 6. Kanban completion watchdog
New-Task -Name "kanban-completion-watchdog" -Command "node" -Args "$hbDir\kanban\src\completion-watchdog.mjs" -Description "Huckleberry kanban completion tracker"

# 7. Kanban stall detector
New-Task -Name "kanban-stall-detector" -Command "node" -Args "$hbDir\kanban\src\stall-detector.mjs" -Description "Huckleberry kanban stall detection"

# 8. Kanban tunnel (keepalive)
New-Task -Name "kanban-tunnel" -Command "powershell.exe" -Args "-WindowStyle Hidden -File `"$hbDir\scripts\keepalive.ps1`"" -Description "Huckleberry kanban tunnel keepalive"

# 9. Dream dispatcher (every 30 min)
New-Task -Name "dream-dispatcher" -Command "node" -Args "$hbDir\taskmaster\dispatcher.mjs" -Trigger "Repetition" -IntervalSeconds 1800 -Description "Huckleberry dream cycle dispatcher (every 30min)"

# 10. Dream distiller (hourly)
New-Task -Name "dream-distiller" -Command "powershell.exe" -Args "-WindowStyle Hidden -File `"$hbDir\scripts\heartbeat.ps1`"" -Trigger "Repetition" -IntervalSeconds 3600 -Description "Huckleberry memory distiller"

# 11. Keystone load balancer
New-Task -Name "keystone" -Command "node" -Args "$env:USERPROFILE\keystone\keystone.js" -Description "Huckleberry keystone load balancer"

# 12. Monitor and notify (every 5 min)
New-Task -Name "monitor-and-notify" -Command "powershell.exe" -Args "-WindowStyle Hidden -File `"$hbDir\scripts\heartbeat.ps1`"" -Trigger "Repetition" -IntervalSeconds 300 -Description "Huckleberry notifications"

Write-Host ""
Write-Host "  Services configured. Start manually or reboot." -ForegroundColor Green
Write-Host "  To remove: .\huckleberry\scripts\uninstall-services.ps1" -ForegroundColor DarkGray
Write-Host ""
