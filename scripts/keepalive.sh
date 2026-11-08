#!/bin/bash
# Huckleberry Keepalive — checks and restarts critical services
set -euo pipefail

HB_DIR="${HOME}/.huckleberry"
LOG="${HB_DIR}/keepalive.log"
MAX_RESTARTS=3
RESTART_COUNT=0

log() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*" >> "$LOG"; }

check_service() {
    local name=$1
    local pid_pattern=$2
    local restart_cmd=$3

    if pgrep -f "$pid_pattern" > /dev/null 2>&1; then
        log "$name: OK"
        return 0
    else
        log "$name: DOWN — restarting..."
        eval "$restart_cmd" &
        log "$name: restart issued"
        return 1
    fi
}

log "=== Keepalive check ==="

# Check Inkstone MCP
check_service "inkstone" "inkstone.*mcp/server" "node ~/.huckleberry/mcp/inkstone/dist/mcp/server.js &"

# Check opencode server if running
if pgrep -f "opencode" > /dev/null 2>&1; then
    log "opencode: OK"
fi

# Check kimaki
if pgrep -f "kimaki" > /dev/null 2>&1; then
    log "kimaki: OK"
fi

log "=== Keepalive complete ==="
