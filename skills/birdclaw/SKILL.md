---
name: birdclaw
description: Use for X/Twitter archive search, mentions triage, likes/bookmarks sync, and reply workflows. Local SQLite-backed Twitter workspace.
---

# Birdclaw

Local-first Twitter workspace — archive import, live sync, mentions triage, reply flows. Uses `bird` CLI for live transport (no `xurl` needed).

## Setup

- Repo: `~/Projects/birdclaw`
- DB: `~/.birdclaw/birdclaw.sqlite`
- Config: `~/.birdclaw/config.json` (bird transport via authed wrapper)
- Auth wrapper: `~/.local/bin/bird-authed` (loads `~/.config/bird/auth.env`)

All CLI commands run from `~/Projects/birdclaw`:
```bash
cd ~/Projects/birdclaw && pnpm cli <command>
```

## Health Check

```bash
cd ~/Projects/birdclaw && pnpm cli db stats --json
```

## Key Commands

### Mentions (for agents)
```bash
# All recent mentions
cd ~/Projects/birdclaw && pnpm cli mentions export --mode bird --limit 20 --json

# Unreplied only (triage queue)
cd ~/Projects/birdclaw && pnpm cli mentions export --unreplied --mode bird --limit 10 --json

# Filtered mentions
cd ~/Projects/birdclaw && pnpm cli mentions export "agent" --mode bird --limit 10 --json
```

### Sync Likes & Bookmarks
```bash
cd ~/Projects/birdclaw && pnpm cli sync likes --mode bird --limit 20 --json
cd ~/Projects/birdclaw && pnpm cli sync bookmarks --mode bird --limit 20 --json
```

### Search (requires archived/imported data)
```bash
cd ~/Projects/birdclaw && pnpm cli --json search tweets "query" --limit 20
cd ~/Projects/birdclaw && pnpm cli --json search tweets --since 2025-01-01 --until 2026-01-01 --originals-only --hide-low-quality --limit 20000
```

### DMs
```bash
cd ~/Projects/birdclaw && pnpm cli dms --help
```

### Compose (tweet/reply)
```bash
cd ~/Projects/birdclaw && pnpm cli compose --help
```

## Picking the Right Approach

- **Mentions triage for agents** → `mentions export --unreplied --mode bird`
- **Single tweet lookup** → `search tweets "query"`
- **Year vibe summary** → `search tweets --since YYYY-01-01 --until (YYYY+1)-01-01 --originals-only --hide-low-quality --limit 20000`
- **Multi-year arc** → Run per year, do NOT shortcut with top-N like_count

## Filters

- `--originals-only` — excludes replies, keeps authored posts only
- `--hide-low-quality` — removes noise (pure RTs, tiny posts, low-signal link captions)
- "low-like" = `like_count < 50`

## Notes

- Live reads use `bird` via `~/.local/bin/bird-authed` wrapper
- No Twitter archive imported yet — search only works on live-synced data (likes, bookmarks, mentions)
- To import archive: place Twitter zip in Downloads, then `pnpm cli import`
- WIP status — expect some rough edges
