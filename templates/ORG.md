# ORG.md — File Organization

## Directory Structure
```
~/.huckleberry/
├── AGENTS.md                  # Master rules
├── SOUL.md                    # Identity, principles
├── IDENTITY.md                # Role definition
├── COS_PROTOCOLS.md           # COS operating patterns
├── TOOLS.md                   # Agent tool reference
├── HEARTBEAT.md               # Self-check protocol
├── MEMORY.md                  # Claims database
├── EXECUTIVE-MODE.md          # Operational excellence
├── ORG.md                     # This file
├── evergreen.md               # Business bible
├── .env                       # API keys (gitignored)
├── taskmaster/
│   ├── next-task.js           # Task finder
│   ├── update-status.js       # Task status updater
│   └── tasks/tasks.json       # Task database
├── scripts/                   # Cron scripts (keepalive, heartbeat)
├── wiki/                      # System documentation
├── memory/                    # Daily logs, self-reviews, corrections
└── kanban/                    # Kanban templates + skill

~/.opencode/
├── opencode.json              # Main config
├── plugin/env-inject.ts       # .env auto-loader
├── plugin/inkstone-priority.ts # Inkstone boot-context injection (no gate)
└── mcp/                       # MCP server files

~/.claude/skills/              # Installed skills
```
