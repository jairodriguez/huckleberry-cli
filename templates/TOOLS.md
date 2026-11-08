# TOOLS.md — Agent Tool Reference
*Reference for available tools, commands, and their usage.*

## Core CLI
| Command | Purpose |
|---------|---------|
| `opencode` | Start AI assistant session |
| `kimaki send --channel <id> --prompt '...' --agent <name>` | Spawn agent in thread |
| `kimaki session list --json` | List active sessions |
| `kimaki session read <sessionId>` | Read session output |
| `kimaki session wait <sessionId>` | Wait for session to complete |
| `kimaki session archive <sessionId>` | Archive a thread |
| `kimaki upload-to-discord` | Upload files to thread |

## Huckleberry CLI
| Command | Purpose |
|---------|---------|
| `huckleberry install` | Install Huckleberry system |
| `huckleberry interview` | Personalize agents (name, business, keys) |
| `huckleberry doctor` | Health check — run when anything feels off |
| `huckleberry packs` | List available skill packs |
| `huckleberry install-pack <name>` | Deploy a skill pack (core, doctor, content, cro, web-design, research, outreach-sales, social, self-improvement, all) |
| `huckleberry cro <url>` | CRO audit of a landing page |
| `huckleberry review` | Weekly self-improvement review (proposals only) |
| `huckleberry update` | Update to latest version |
| `huckleberry version` | Show version |

## Inkstone (Memory)
| Command | Purpose |
|---------|---------|
| `inkstone memory_search` | Search memories |
| `inkstone memory_write` | Write new memory |
| `inkstone memory_failures` | Check known failure patterns |
| `inkstone ingest chatgpt <file>` | Import ChatGPT export |
| `inkstone ingest claude <file>` | Import Claude export |
| `inkstone ingest files <dir>` | Import file directory |
| `inkstone dream` | Run memory maintenance cycle |
| `inkstone status` | Check DB status |
| `inkstone backup` | Create database backup |

## Context-Mode (Token Savings)
| Tool | Purpose |
|------|---------|
| `ctx_execute` | Run code in sandbox, only result enters context |
| `ctx_batch_execute` | Run multiple commands, auto-index results |
| `ctx_search` | Search indexed knowledge base |
| `ctx_index` | Store content for search |
| `ctx_fetch_and_index` | Fetch URL and index for search |

## Taskmaster
| Command | Purpose |
|---------|---------|
| `node .huckleberry/taskmaster/next-task.js [--business <name>]` | Find next task |
| `node .huckleberry/taskmaster/update-status.js <id> <status>` | Update task status |

## Kanban (Workflows)
| Command | Purpose |
|---------|---------|
| `kanban init` | Initialize kanban |
| `kanban templates --details` | List workflow templates |
| `kanban stamp <name> --var k=v` | Instantiate workflow template |
| `kanban list` | View all tasks |
| `kanban complete <id> --summary "..."` | Mark task done |
| `kanban block <id> --reason "..."` | Block task |

## MCP Servers
| Server | Purpose |
|--------|---------|
| Inkstone MCP | Memory search, write, dream cycle, graph |
| Context7 MCP | Documentation lookup for libraries/tools |
| Jev MCP | Fast judgment tools (classify, rerank, verify, gate) |