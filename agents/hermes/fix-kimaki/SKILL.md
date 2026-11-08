---
name: fix-kimaki
description: Use when the kimaki Discord bot is down, not responding, sessions won't spawn, or Discord integration fails. Also use when the user says "fix kimaki", "kimaki is down", "bot not working", etc.
---

# Fix Kimaki — Huckleberry System Repair

Diagnose first, fix second, verify third. Full procedures live in `~/.huckleberry/agents/hermes/hermes-fixer.md` — read it before acting.

## Quick Path
1. Run `huckleberry doctor` (non-interactive diagnostic) — or the manual diagnostic block in hermes-fixer.md
2. Read `~/.huckleberry/wiki/kimaki.md` + `~/.huckleberry/wiki/discord.md` for the failing area
3. Apply the matching fix procedure (bot down / sessions / token 401 / intents)
4. Verify live: process up, `kimaki send` ping lands in Discord, log tail clean
5. Report: what broke, root cause, what you changed, proof it works

## Key Facts
- kimaki config/logs: `~/.kimaki/` (log: `~/.kimaki/kimaki.log`)
- Discord token: `DISCORD_BOT_TOKEN` in `~/.huckleberry/.env` (never print values)
- opencode config: `~/.opencode/opencode.json` (must parse as valid JSON)
- Inkstone MCP: `~/.huckleberry/mcp/inkstone/` · Jev MCP: `~/.huckleberry/mcp/jev-mcp/`
- macOS services: `launchctl list | grep huckleberry`

## Hard Rules
- Never print secret values — key names only
- Never delete the Inkstone DB
- Verify every fix with a live test before reporting done
