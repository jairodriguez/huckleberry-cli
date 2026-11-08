#!/bin/bash
# Huckleberry weekly self-improvement sweep.
# Asks the model (via opencode) to review the week's sessions + Inkstone and
# propose 2-3 concrete improvements. Writes a report; posts to the doctor
# channel webhook if configured. Never auto-applies changes — proposals only.
set -u

HB_DIR="$HOME/.huckleberry"
LOG_DIR="$HB_DIR/logs/self-improve"
REPORT="$LOG_DIR/$(date '+%Y-%m-%d').md"
mkdir -p "$LOG_DIR"

PROMPT="Weekly self-improvement review for this Huckleberry system.
1. Review the last 7 days of failures/corrections in Inkstone (inkstone_memory_failures, inkstone_memory_search on recent decisions).
2. Read $HB_DIR/MEMORY.md and $HB_DIR/evergreen.md.
3. Propose 2-3 CONCRETE improvements (a skill to adjust, a repeated mistake to prevent, a workflow to automate).
4. For each: what to change, why (evidence), expected benefit. Do NOT apply changes — proposals only.
Write the report to $REPORT using the Write tool."

if command -v opencode >/dev/null 2>&1; then
  opencode run "$PROMPT" >> "$LOG_DIR/run.log" 2>&1
  echo "[$(date '+%Y-%m-%d %H:%M')] report: $REPORT" >> "$LOG_DIR/run.log"
else
  echo "[$(date '+%Y-%m-%d %H:%M')] opencode missing — skipped" >> "$LOG_DIR/run.log"
  exit 0
fi

# Notify if a webhook is configured
webhook=""
[ -f "$HB_DIR/.env" ] && webhook=$(grep -E '^DOCTOR_WEBHOOK_URL=' "$HB_DIR/.env" | cut -d= -f2-)
if [ -n "$webhook" ] && [ -f "$REPORT" ]; then
  curl -s -X POST -H 'Content-Type: application/json' \
    -d "{\"content\": \"📈 Weekly self-improvement report ready: $REPORT\"}" "$webhook" >/dev/null 2>&1
fi
