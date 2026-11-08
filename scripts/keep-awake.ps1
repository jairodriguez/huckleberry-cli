# Huckleberry Sleep Prevention
# Prevents Windows from sleeping while Huckleberry services are running
# Equivalent to macOS `caffeinate`

$scriptName = "huckleberry-keep-awake"
$logFile = "$env:USERPROFILE\.huckleberry\keep-awake.log"

function Log($msg) {
    $ts = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    Add-Content -Path $logFile -Value "[$ts] $msg"
}

Log "Keep-awake started"

# Method 1: Disable sleep via powercfg (temporary, needs admin)
try {
    powercfg -change -standby-timeout-ac 0 2>&1 | Out-Null
    powercfg -change -hibernate-timeout-ac 0 2>&1 | Out-Null
    Log "Sleep disabled via powercfg"
} catch {
    Log "powercfg failed (may need admin): $_"
}

# Method 2: Keep system awake by setting thread execution state
# Run this in a loop to prevent sleep
while ($true) {
    try {
        # Use Add-Type to call kernel32 SetThreadExecutionState
        Add-Type -TypeDefinition @"
using System;
using System.Runtime.InteropServices;
public class SleepPreventer {
    [DllImport("kernel32.dll", CharSet = CharSet.Auto, SetLastError = true)]
    public static extern uint SetThreadExecutionState(uint esFlags);
    public static void PreventSleep() {
        SetThreadExecutionState(0x80000003); // ES_CONTINUOUS | ES_SYSTEM_REQUIRED | ES_DISPLAY_REQUIRED
    }
    public static void AllowSleep() {
        SetThreadExecutionState(0x80000000); // ES_CONTINUOUS
    }
}
"@ -ErrorAction SilentlyContinue
        [SleepPreventer]::PreventSleep()
    } catch {
        # Fallback: keep process alive
    }
    Start-Sleep -Seconds 60
}
