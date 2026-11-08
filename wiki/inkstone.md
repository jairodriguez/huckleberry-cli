# Inkstone — Memory System

## Overview
Inkstone is a SQLite-based persistent memory system for AI agents. It stores knowledge as versioned chunks with full-text search, vector embeddings, exponential decay, graph-based entity relations, and a 14-step dream cycle maintenance pipeline. Exposed via MCP (Model Context Protocol).

## Key Files
- Database: `~/.huckleberry/inkstone.db` (SQLite, WAL mode)
- MCP server: `~/.huckleberry/mcp/inkstone/dist/mcp/server.js`
- Config via environment: `INKSTONE_DB` env var

## Commands
| Command | Purpose |
|---------|---------|
| `inkstone status` | Check DB integrity and stats |
| `inkstone search <query>` | Search memories |
| `inkstone write <text> --ns=<namespace>` | Write memory |
| `inkstone dream` | Run maintenance cycle |
| `inkstone backup` | Create backup |
| `inkstone ingest chatgpt <file>` | Import ChatGPT data |
| `inkstone ingest claude <file>` | Import Claude data |
| `inkstone ingest files <dir>` | Import from files |

## Architecture
```
MCP Client (opencode)
    │ stdio
MCP Server (server.ts — 19 tools)
    │
DB Layer (schema.ts — better-sqlite3, WAL mode)
    │
FTS5 + Vector + Graph
```

## Common Issues

### `[dedup:ref sha=...]` on all tool calls
- Symptom: Tool outputs replaced with `[dedup:ref sha=...]`
- Cause: context-mode output dedup (NOT a gate — the old inkstone-gate plugin was removed 2026-07-31, commit 664eb0ec, as root cause of this poisoning)
- Fix: vary the command/output so hashes differ; if stuck, restart the session. Do NOT re-introduce a tool-blocking precheck gate — it re-armed across host restarts and killed long sessions (task si/28)

### MCP Server Won't Start
- Check Node.js: `node --version` (need 18+)
- Check database path: verify INKSTONE_DB env var is set
- Run server manually: `node ~/.huckleberry/mcp/inkstone/dist/mcp/server.js`
- Check for SQLite native module errors

### Database Corruption
- Run health check: `inkstone status`
- Restore from backup: `cp backup/inkstone-*.db ~/.huckleberry/inkstone.db`
- Rebuild: delete DB and re-initialize (schema is auto-created)

## Dream Cycle
Runs nightly via cron. 14 steps:
1-3: Decay scoring and pruning
4-7: Consolidation and contradiction detection
8-10: Hypothesis generation and testing
11-14: Goal tracking and archive clean-up

Uses OmniRoute free model combo (no Ollama needed).

## Backup
- Automatic: configured via cron
- Manual: `inkstone backup`
- Google Drive: suggested storage for offsite backup
