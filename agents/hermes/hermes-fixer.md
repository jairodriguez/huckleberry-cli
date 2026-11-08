# Hermes Fixer Protocol

## DIAGNOSTIC (run first — always)
Non-interactive option: `huckleberry doctor` (prints the same checks).
Manual diagnostic:
```bash
echo "=== Node ===" && node --version 2>&1 || echo "MISSING"
echo "=== npm ===" && npm --version 2>&1 || echo "MISSING"
echo "=== opencode ===" && opencode --version 2>&1 || echo "MISSING"
echo "=== kimaki ===" && (command -v kimaki >/dev/null && kimaki --version 2>&1 || echo "MISSING")
echo "=== Inkstone ===" && ls ~/.huckleberry/mcp/inkstone/node_modules/@jairodri/huckleberry-inkstone/dist/mcp/server.js 2>&1 || echo "MISSING"
echo "=== Jev ===" && ls ~/.huckleberry/mcp/jev-mcp/node_modules/@jkudish/jev-mcp/dist/index.js 2>&1 || echo "MISSING"
echo "=== opencode config ===" && node -e "try{JSON.parse(require('fs').readFileSync(require('os').homedir()+'/.opencode/opencode.json','utf8'));console.log('VALID')}catch(e){console.log('INVALID:',e.message)}"
echo "=== Processes ===" && ps aux | grep -E "opencode|kimaki|inkstone" | grep -v grep
echo "=== Disk ===" && df -h ~ | tail -1
echo "=== Env key names (never values) ===" && grep -E "^[A-Z_]+=" ~/.huckleberry/.env 2>/dev/null | cut -d= -f1
```

## Fix Procedures

### kimaki Fixes
**Reference:** `~/.huckleberry/wiki/kimaki.md`

**Bot not responding:**
1. Check process: `ps aux | grep kimaki | grep -v grep`
2. If dead: restart per wiki (kimaki runs as a service — check `launchctl list | grep huckleberry` on macOS, or the systemd unit on Linux)
3. Wait 10s, check again
4. Read wiki: Section "Common Issues > Bot Not Responding"
5. Logs: `tail -50 ~/.kimaki/kimaki.log`

**Sessions not spawning:**
1. Read wiki: Section "Common Issues > Sessions Not Starting"
2. Validate opencode: `opencode --version`
3. Check agent names in `~/.opencode/opencode.json` match what's being spawned
4. Test: `kimaki send --channel <id> --prompt 'ping' --agent build`

**Token expired (401 errors):**
1. Read wiki: Section "Bot Setup (One-Time)"
2. Read `~/.huckleberry/wiki/discord.md`: Section "Common Issues > Bot Not Online"
3. User regenerates the token in the Discord Developer Portal
4. Update `~/.huckleberry/.env` (`DISCORD_BOT_TOKEN=...`)
5. Restart the kimaki service

### Discord Bot Fixes
**Reference:** `~/.huckleberry/wiki/discord.md`

**Bot not online:**
1. Check that `DISCORD_BOT_TOKEN` exists in `~/.huckleberry/.env` (name only — never print the value)
2. If token invalid: user regenerates in Discord Developer Portal
3. After token update: restart the kimaki service

**Bot can't see messages:**
1. Check Message Content Intent in Discord Developer Portal
2. Check channel permissions
3. Check server permissions override

**Bot joined wrong server:**
1. Read wiki: Section "Adding to Existing Server"
2. Regenerate OAuth2 URL
3. Remove bot from old server

### opencode / MCP Fixes
**Config invalid JSON:**
1. `node -e "JSON.parse(require('fs').readFileSync(require('os').homedir()+'/.opencode/opencode.json'))"` prints the parse error
2. Fix the syntax error (most common: trailing comma)
3. Restart the session

**Inkstone MCP missing:**
1. `cd ~/.huckleberry/mcp/inkstone && npm install`
2. Verify the server file exists (path in diagnostic above)

**Jev MCP missing:**
1. `cd ~/.huckleberry/mcp/jev-mcp && npm install`
2. If 401 from the API: `TYPESAFE_API_KEY` in `~/.huckleberry/.env` is missing/expired — user gets one at typesafe.ai

### Memory & Session Fixes
- Inkstone DB: `~/.huckleberry/inkstone.db` — never delete; back up before bulk ops
- Session logs: `~/.local/share/opencode/` — check size if disk is full

## Rules
- Fix the root cause, not the symptom
- Verify every fix with a concrete test (run the thing, don't assume)
- Never print secret values; show key names only
- If the fix requires user action (portal clicks, new tokens), give exact numbered steps
- Escalate after 3 real failed attempts with: what you tried, exact errors, recommended next step
