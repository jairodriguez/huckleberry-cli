#!/bin/bash
# Huckleberry Doctor Watchdog — lightweight health sweep, runs every 5 min.
# Checks the stack; on failure, notifies via the doctor Discord channel (webhook)
# and, if `opencode` is available, asks Hermes to fix it. Never deletes data.
set -u

HB_DIR="$HOME/.huckleberry"
LOG="$HB_DIR/logs/doctor-watchdog.log"
STATE="$HB_DIR/logs/doctor-state"
mkdir -p "$HB_DIR/logs"

log() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*" >> "$LOG"; }

notify() {
  # $1 = message
  local webhook=""
  [ -f "$HB_DIR/.env" ] && webhook=$(grep -E '^DOCTOR_WEBHOOK_URL=' "$HB_DIR/.env" | cut -d= -f2-)
  if [ -n "$webhook" ]; then
    curl -s -X POST -H 'Content-Type: application/json' \
      -d "{\"content\": \"🩺 Huckleberry Doctor: $1\"}" "$webhook" >/dev/null 2>&1
  fi
  log "NOTIFY: $1"
}

# Only alert on state TRANSITIONS (healthy→broken / broken→healed) to avoid spam
was_bad=0
[ -f "$STATE" ] && was_bad=1
is_bad=0

# 1. opencode present?
if ! command -v opencode >/dev/null 2>&1; then
  log "FAIL: opencode missing"
  is_bad=1
fi

# 2. opencode config valid JSON?
if ! node -e "JSON.parse(require('fs').readFileSync(require('os').homedir()+'/.opencode/opencode.json','utf8'))" >/dev/null 2>&1; then
  log "FAIL: ~/.opencode/opencode.json invalid"
  is_bad=1
fi

# 3. Inkstone MCP installed?
if [ ! -f "$HB_DIR/mcp/inkstone/node_modules/@jairodri/huckleberry-inkstone/dist/mcp/server.js" ]; then
  log "FAIL: Inkstone MCP missing"
  is_bad=1
fi

# 4. Jev MCP installed?
if [ ! -f "$HB_DIR/mcp/jev-mcp/node_modules/@jkudish/jev-mcp/dist/index.js" ]; then
  log "FAIL: Jev MCP missing"
  is_bad=1
fi

# 5. Disk under 2GB free?
free_kb=$(df -k "$HOME" | tail -1 | awk '{print $4}')
if [ -n "$free_kb" ] && [ "$free_kb" -lt 2097152 ]; then
  log "FAIL: disk low ($((free_kb/1024))MB free)"
  is_bad=1
fi

if [ "$is_bad" = "1" ] && [ "$was_bad" = "0" ]; then
  notify "Problem detected (details: $LOG). Say 'fix it' in the Hermes channel and I'll repair it."
  # Best-effort self-repair via Hermes when opencode is usable
  if command -v opencode >/dev/null 2>&1; then
    log "Spawning Hermes self-repair"
    opencode run --agent hermes "Doctor watchdog detected a problem: run the diagnostic in ~/.huckleberry/agents/hermes/hermes-fixer.md, fix the root cause, verify with a live test, and report what broke + what you fixed. Check $LOG for the failure lines." >> "$LOG" 2>&1 &
  fi
elif [ "$is_bad" = "0" ] && [ "$was_bad" = "1" ]; then
  notify "All checks passing again — healed."
  log "HEALED"
fi

if [ "$is_bad" = "1" ]; then touch "$STATE"; else rm -f "$STATE"; fi
