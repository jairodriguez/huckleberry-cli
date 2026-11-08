# opencode — AI CLI Tool

## Overview
opencode is the core CLI tool for AI-assisted development. It connects to AI models, runs agents, manages sessions, and provides tool execution.

## Key Files
- Config: `~/.opencode/opencode.json`
- Plugins: `~/.opencode/plugin/`
- MCP servers: `~/.opencode/mcp/`
- Binary: installed via npm or standalone download

## Configuration
Config file is at `~/.opencode/opencode.json`. Key sections:
- `mcp` — MCP server definitions (inkstone, context7, jev)
- `agent` — Agent definitions (build, plan, researcher, cos, hermes)
- `plugin` — Plugin references (env-inject.ts, inkstone-gate.ts)
- `permission` — Permission rules
- `compaction` — Context window management (safeguard mode at 85%)

## Common Issues & Fixes

### MCP Server Not Connecting
- Check server path in opencode.json
- Run server manually: `node <path/to/server.js>` — check errors
- Verify required env vars are set

### Plugin Not Loading
- Check plugin path is relative to opencode.json directory
- Verify file exists at the expected path
- Check for syntax errors in plugin file

### Agent Not Found
- Verify agent is defined in opencode.json `agent` section
- Check agent name spelling in spawn commands
- Ensure model string is valid

## Updating
`npm update -g @anthropic-ai/opencode`

## Troubleshooting
- Logs: check opencode output for error messages
- Version: `opencode --version`
- Config validation: verify JSON syntax in opencode.json