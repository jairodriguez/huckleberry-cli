# kimaki — Discord Bridge & Session Manager

## Overview
kimaki bridges opencode to Discord. It manages sessions, spawns agents in threads, handles file uploads, and provides the `send` command for agent orchestration.

## Key Commands
| Command | Purpose |
|---------|---------|
| `kimaki send --channel <id> --prompt '...' --agent <name>` | Spawn agent in thread |
| `kimaki session list --json` | List active sessions |
| `kimaki session read <sessionId>` | Read full conversation |
| `kimaki session wait <sessionId>` | Wait and capture result |
| `kimaki session archive <threadId>` | Archive thread |
| `kimaki upload-to-discord --session <id> <file>` | Upload file to thread |
| `kimaki user list --guild <id>` | Find Discord user IDs |
| `kimaki project list --json` | List project channels |

## Key Files
- Config: `~/.kimaki/kimaki.db` (SQLite)
- Discord sessions: `~/.kimaki/discord-sessions.db`
- Start script: `start-kimaki.sh`
- Logs: `~/.kimaki/kimaki.log`

## Common Issues

### Bot Not Responding
- Check bot is online in Discord server
- Check logs: `tail -50 ~/.kimaki/kimaki.log`
- Verify bot token is valid (regenerate in Discord Developer Portal if needed)
- Restart: `kimaki start` or kill and re-run start-kimaki.sh

### Sessions Not Starting
- Check opencode config is valid
- Verify agent name exists in opencode.json
- Check MCP servers are running (Inkstone precheck gate blocks tools)

### Permission Denied (Discord)
- Verify bot has correct intents in Discord Developer Portal
  - Message Content Intent: ON
  - Server Members Intent: ON (if needed)
  - Privileged Gateway Intents: all needed ones enabled
- Verify bot has 'administrator' or required channel permissions

## Starting
`cd ~/.kimaki && bash start-kimaki.sh` or `kimaki start`

## Updating
`npm update -g kimaki`
