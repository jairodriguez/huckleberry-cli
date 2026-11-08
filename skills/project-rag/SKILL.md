---
name: project-rag
description: >
  Per-business RAG indexes for semantic search over project files (supplier docs, leads, contracts, brand content).
  Use this skill when adding new directories to index, adding new agents, creating new business indexes,
  or troubleshooting project_search / project_index tools. Triggers: "add rag directory", "new rag index",
  "project search", "rag config", "add agent to rag".
---

# Project RAG System

Semantic search over business project files. Agents call `project_search(query)` instead of speculative grep chains across hundreds of files.

## Architecture

- **Plugin**: `$HOME/.config/opencode/plugins/memory-system/index.ts` (compiled to `dist/index.js`)
- **Config**: `./config/rag-indexes.json`
- **Embeddings**: Ollama `nomic-embed-text` (free, local, 768-dim)
- **Storage**: SQLite + FTS5 per business, at `<business-root>/.rag/memory/memory.sqlite`
- **Auto-sync**: Every 30 minutes on search calls

## Tools

- `project_search(query, agent?, maxResults?, sync?)` — semantic search across agent-scoped indexes
- `project_index(indexName?, agent?)` — sync project files into RAG index

## How to Add a New Directory to an Existing Index

1. Edit `./config/rag-indexes.json`
2. Add directory name to the `dirs` array of the target index
3. Run `project_index(indexName)` or wait for auto-sync (30 min)

Example — adding a `partnerships/` dir to nomadixgear:

```json
{
  "indexes": {
    "nomadixgear": {
      "dirs": [
        "business-knowledge",
        "partnerships"
      ]
    }
  }
}
```

## How to Add a New Agent

1. Add agent to `agent_access` in `config/rag-indexes.json` with their allowed indexes
2. Create a `.rag-agent` file in the agent's workspace directory containing their agent ID (one word)

Example — adding a new agent called `scout` with nomadixgear access:

```json
{
  "agent_access": {
    "scout": ["nomadixgear"]
  }
}
```

Then: `echo "scout" > /path/to/scout/workspace/.rag-agent`

For agents that need all indexes: `"scout": { "all": true }`

For path filtering (agent only sees specific subdirs of an index):

```json
{
  "agent_filters": {
    "scout": {
      "newsletter": ["brands/specific-brand"]
    }
  }
}
```

## How to Create a New Business Index

1. Add entry to `indexes` in `config/rag-indexes.json`:

```json
{
  "indexes": {
    "newbusiness": {
      "root": "/Users/Shared/newbusiness",
      "dirs": ["docs", "clients", "contracts"],
      "root_files": true,
      "extensions": [".md", ".txt", ".csv"],
      "exclude": ["node_modules", ".git", "*.js", "*.ts", "memory/"],
      "max_file_size_kb": 512
    }
  }
}
```

2. Grant access in `agent_access`
3. Run `project_index("newbusiness")` to build the index

## Agent Access Map

| Agent | Access |
|-------|--------|
| kestrel, hermes | All indexes |
| atlas | nomadixgear + newsletter (filtered to brands/nomadixgear.com + brands/enchantents) |
| skye | nomadixgear only |
| paco | nomadixgear only |
| rai | nomadixgear only |
| harper | newsletter only |

## Agent Identity Resolution

Agents are identified in this order:
1. Explicit `agent` parameter in tool call
2. `.rag-agent` file in workspace directory (walks up max 5 levels)
3. Workspace path mapping (hardcoded in plugin)
4. `RAG_AGENT_ID` environment variable

## Gotchas

- **Chunk size**: Capped at 6000 chars for Ollama's context window. If chunks exceed this, embeddings fail silently and fall back to FTS5-only.
- **Large files**: `max_file_size_kb: 512` skips files over 512KB. Adjust per index if needed.
- **No PDF extraction**: Only indexes text files (.md, .txt, .csv). PDFs need external extraction first.
- **Index path**: The SQLite DB lives at `<root>/.rag/memory/memory.sqlite` (NOT `<root>/.rag/memory.sqlite`).
- **Duplicate files**: Never index the same files in multiple indexes. Use `agent_access` to share indexes across agents.
- **Rebuild**: To fully reindex (e.g. after config changes), delete `<root>/.rag/memory/` then run `project_index`.
