---
name: inkstone-admin
description: Inkstone admin and power tools — DAG, graph, NLM, Gemini, namespace, user management. Load when you need advanced memory operations beyond basic search/write/failures.
---

# Inkstone Admin Tools

Advanced Inkstone memory operations. Core tools (search, write, failures, hybrid_answer) are always available — use this skill for power operations.

## Graph & DAG Operations

| Tool | Use When |
|------|----------|
| `inkstone_memory_dag_describe` | Analyze memory hierarchy depth, find root/leaf nodes |
| `inkstone_memory_dag_expand` | Expand a DAG node to see its source chunks |
| `inkstone_memory_dag_grep` | Search DAG nodes with depth filtering (e.g. find D2 nodes about "decision") |
| `inkstone_memory_graph_centrality` | Find most connected memory chunks (by edge count) |
| `inkstone_memory_graph_context` | Get full context graph around a chunk (neighbors up to depth N) |
| `inkstone_memory_graph_contradictions` | Find chunks that contradict or supersede a given chunk |
| `inkstone_memory_graph_neighbors` | Get neighboring chunks connected by graph edges |
| `inkstone_memory_graph_path` | Find shortest path between two memory chunks |

## Deep Archive & External

| Tool | Use When |
|------|----------|
| `inkstone_memory_deep_query` | Broad historical/business questions — routes to NotebookLM archive with domain routing and citations |
| `inkstone_memory_nlm_query` | Query a specific NotebookLM notebook |
| `inkstone_memory_nlm_status` | Show configured NLM domain routes and active notebooks |
| `inkstone_memory_nlm_sync` | Sync a session to NotebookLM |
| `inkstone_memory_gemini_query` | Query Inkstone + Gemini File Search deep archive with automatic fallback |
| `inkstone_memory_gemini_sync` | Sync summary chunks to Gemini File Search store |

## Memory Management

| Tool | Use When |
|------|----------|
| `inkstone_memory_consolidate` | Merge specific memory chunks by ID |
| `inkstone_memory_contradictions` | List unresolved contradictions across all memories |
| `inkstone_memory_dream` | Run dream cycle (decay, consolidate, prune, extract, detect contradictions) |
| `inkstone_memory_get` | Read a specific memory by ID |
| `inkstone_memory_summarize` | Summarize raw text into a structured memory entry |
| `inkstone_memory_global_search` | Cross-agent search across all namespaces (admin only) |
| `inkstone_memory_self_model` | Read agent self-knowledge (capabilities, limits, preferences) |
| `inkstone_memory_hypotheses` | Track hypotheses: list, create, confirm, or reject |
| `inkstone_memory_goals` | List, complete, or abandon tracked goals |

## Namespace & User Admin

| Tool | Use When |
|------|----------|
| `inkstone_namespace_grant` | Grant a user permission on a namespace |
| `inkstone_namespace_revoke` | Revoke a user's permission on a namespace |
| `inkstone_user_create` | Create a new user with API key |
| `inkstone_user_list` | List all users |
| `inkstone_user_remove` | Remove a user and revoke all permissions |

## Usage Pattern

Most sessions only need `search`, `write`, `failures`, and `hybrid_answer`. Load this skill when:

- Debugging memory integrity (`dag_describe`, `contradictions`)
- Exploring memory graphs (`graph_context`, `graph_centrality`)
- Syncing to external archives (`nlm_sync`, `gemini_sync`)
- Admin operations (`namespace_grant`, `user_create`)
- Running maintenance (`dream`, `consolidate`)
