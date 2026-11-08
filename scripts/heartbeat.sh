#!/bin/bash
# Huckleberry Heartbeat — reads taskmaster and reports status
# Called by cron every 2-4 hours
set -euo pipefail

HB_DIR="${HOME}/.huckleberry"
TASK_FILE="${HB_DIR}/taskmaster/tasks/tasks.json"
STATE_FILE="${HB_DIR}/heartbeat-state.json"
LOG="${HB_DIR}/heartbeat.log"

log() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*" >> "$LOG"; }

if [ ! -f "$TASK_FILE" ]; then
    log "No task file found — first run or empty"
    echo '{"last_report": null, "tasks_since_last": []}' > "$STATE_FILE"
    exit 0
fi

log "=== Heartbeat ==="

# Read task statuses
COMPLETED=$(python3 -c "
import json
with open('$TASK_FILE') as f: d = json.load(f)
tasks = d.get('tasks', [])
done = [t for t in tasks if t.get('status') == 'done']
active = [t for t in tasks if t.get('status') == 'in-progress']
blocked = [t for t in tasks if t.get('status') == 'blocked']
print(f'{len(done)}|{len(active)}|{len(blocked)}')
" 2>/dev/null || echo "0|0|0")

echo "$COMPLETED"
log "Status: $COMPLETED tasks (done|active|blocked)"

# Save state for COS to read
echo "{
  \"checked_at\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\",
  \"task_summary\": \"$COMPLETED\"
}" > "$STATE_FILE"

log "=== Heartbeat complete ==="
