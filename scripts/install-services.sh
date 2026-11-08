#!/bin/bash
# Huckleberry macOS Services Setup
# Installs launchd plists for the Huckleberry stack. Conditional entries are
# skipped when their program file doesn't exist. All paths use $HOME.
set -euo pipefail

HB_DIR="$HOME/.huckleberry"
LAUNCH_DIR="$HOME/Library/LaunchAgents"
LOG_DIR="$HB_DIR/logs"
NODE="$(command -v node || echo /opt/homebrew/bin/node)"
mkdir -p "$LAUNCH_DIR" "$LOG_DIR"

# name:label:program:args:interval(0=KeepAlive) — program may contain $HOME refs
SERVICES=(
  "kimaki-monitor:com.huckleberry.kimaki.monitor:/bin/bash:$HB_DIR/scripts/keepalive.sh:300"
  "doctor-watchdog:com.huckleberry.doctor.watchdog:/bin/bash:$HB_DIR/scripts/doctor-watchdog.sh:300"
  "kanban-server:com.huckleberry.kanban.server:$NODE:$HB_DIR/kanban/src/server.mjs:0"
  "kanban-dispatcher:com.huckleberry.kanban.dispatcher:$NODE:$HB_DIR/kanban/src/dispatcher.mjs:0"
  "dream-dispatcher:com.huckleberry.dream.dispatcher:$NODE:$HB_DIR/taskmaster/dispatcher.mjs:1800"
  "selfimprove-weekly:com.huckleberry.selfimprove.weekly:/bin/bash:$HB_DIR/scripts/self-improve-weekly.sh:604800"
)

# Optional services — only installed when their target exists
[ -f "$HB_DIR/kanban/src/completion-watchdog.mjs" ] && SERVICES+=("kanban-completion-watchdog:com.huckleberry.kanban.completion-watchdog:$NODE:$HB_DIR/kanban/src/completion-watchdog.mjs:0")
[ -f "$HB_DIR/kanban/src/stall-detector.mjs" ] && SERVICES+=("kanban-stall-detector:com.huckleberry.kanban.stall-detector:$NODE:$HB_DIR/kanban/src/stall-detector.mjs:0")
[ -f "$HOME/keystone/keystone.js" ] && SERVICES+=("keystone:com.huckleberry.keystone:$NODE:$HOME/keystone/keystone.js:0")

chmod +x "$HB_DIR/scripts/"*.sh 2>/dev/null || true

for service in "${SERVICES[@]}"; do
  IFS=":" read -r name label prog args interval <<< "$service"
  PLIST="$LAUNCH_DIR/$label.plist"

  cat > "$PLIST" << PLISTEOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>$label</string>
    <key>ProgramArguments</key>
    <array>
        <string>$prog</string>
        <string>$args</string>
    </array>
    <key>RunAtLoad</key>
    <true/>
PLISTEOF

  if [ "$interval" = "0" ]; then
    cat >> "$PLIST" << 'KEEPA'
    <key>KeepAlive</key>
    <true/>
KEEPA
  else
    {
      echo "    <key>StartInterval</key>"
      echo "    <integer>$interval</integer>"
    } >> "$PLIST"
  fi

  {
    echo "    <key>StandardOutPath</key>"
    echo "    <string>$LOG_DIR/$name.log</string>"
    echo "    <key>StandardErrorPath</key>"
    echo "    <string>$LOG_DIR/$name.err</string>"
    echo "</dict>"
    echo "</plist>"
  } >> "$PLIST"

  if [ "${HUCKLEBERRY_NO_LOAD:-0}" = "1" ]; then
    echo "  [WRITTEN-ONLY] $label"
    continue
  fi
  launchctl unload "$PLIST" 2>/dev/null || true
  launchctl load "$PLIST" 2>/dev/null && echo "  [OK] $label" || echo "  [WARN] $label"
done

echo ""
echo "  Services installed. Check with: launchctl list | grep huckleberry"
echo "  Remove: launchctl unload ~/Library/LaunchAgents/com.huckleberry.*.plist"
