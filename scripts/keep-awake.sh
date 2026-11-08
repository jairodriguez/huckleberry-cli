#!/bin/bash
# Huckleberry macOS Sleep Prevention
# Uses caffeinate to prevent sleep while services run

LOGFILE="$HOME/.huckleberry/keep-awake.log"
PIDFILE="$HOME/.huckleberry/keep-awake.pid"

log() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*" >> "$LOGFILE"; }

case "${1:-start}" in
  start)
    log "Starting caffeinate..."
    caffeinate -dimsu -w $$ &
    CPID=$!
    echo $CPID > "$PIDFILE"
    log "caffeinate PID: $CPID"
    ;;
  stop)
    if [ -f "$PIDFILE" ]; then
      kill $(cat "$PIDFILE") 2>/dev/null && log "caffeinate stopped"
      rm -f "$PIDFILE"
    fi
    ;;
  status)
    if [ -f "$PIDFILE" ] && kill -0 $(cat "$PIDFILE") 2>/dev/null; then
      echo "Keep-awake is running"
    else
      echo "Keep-awake is stopped"
    fi
    ;;
esac
