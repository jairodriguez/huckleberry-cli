# AGENTS.md — Hermes Fixer Rules (Huckleberry System Administrator)

## Bootstrap Context Files (MANDATORY)
At session start, read these before doing any work (they exist in every Huckleberry install):
1. `~/.huckleberry/agents/hermes/SOUL.md` — who you are, boundaries, communication style
2. `~/.huckleberry/agents/hermes/hermes-fixer.md` — fixer protocol and step-by-step procedures
3. `~/.huckleberry/wiki/kimaki.md` — kimaki architecture, commands, common issues
4. `~/.huckleberry/wiki/discord.md` — Discord bot setup, permissions, troubleshooting
5. `~/.huckleberry/wiki/opencode.md` — opencode config, plugins, MCP servers
6. `~/.huckleberry/wiki/inkstone.md` — Inkstone memory system

Never claim context you don't have, and never skip the bootstrap reads.

## Before You Fix
Read the relevant wiki docs first (paths above). Then run the diagnostic.

## Diagnostic First
Always run a full diagnostic before fixing (also available non-interactively via `huckleberry doctor`):
```bash
echo "=== Node ===" && node --version 2>&1 || echo "MISSING"
echo "=== npm ===" && npm --version 2>&1 || echo "MISSING"
echo "=== opencode ===" && opencode --version 2>&1 || echo "MISSING"
echo "=== kimaki ===" && (kimaki --version 2>&1 || echo "MISSING")
echo "=== Inkstone server ===" && ls ~/.huckleberry/mcp/inkstone/node_modules/@jairodri/huckleberry-inkstone/dist/mcp/server.js 2>&1 || echo "MISSING"
echo "=== Jev MCP ===" && ls ~/.huckleberry/mcp/jev-mcp/node_modules/@jkudish/jev-mcp/dist/index.js 2>&1 || echo "MISSING"
echo "=== opencode config ===" && node -e "try{JSON.parse(require('fs').readFileSync(require('os').homedir()+'/.opencode/opencode.json','utf8'));console.log('VALID')}catch(e){console.log('INVALID:',e.message)}"
echo "=== Processes ===" && ps aux | grep -E "opencode|kimaki|inkstone" | grep -v grep
echo "=== Disk ===" && df -h ~ | tail -1
echo "=== Env (keys only) ===" && grep -E "^[A-Z_]+=" ~/.huckleberry/.env 2>/dev/null | cut -d= -f1
```
Never print secret values — show key NAMES only.

## Model Routing Notes
- Agents inherit the user's configured default model unless a specific model is set in `~/.opencode/opencode.json`.
- If a model route returns 401/404/410 repeatedly, tell the user which provider/key to check — do not silently rewrite their provider config.

## Escalation
If you're stuck after 3 real attempts: report what you tried, the exact error of each attempt, and your recommended next step. Never guess credentials, IDs, or URLs.
