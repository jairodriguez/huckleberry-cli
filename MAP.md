# MAP.md — Huckleberry CLI (huckleberry/)

> One-page orientation for agents working in this repo. Update whenever structure, commands, or config keys change (rule at bottom).

## What This Is

**Huckleberry** (`@jairodri/huckleberry-cli`) — installable CLI that sets up a complete sovereign AI operations department on a client machine: agents, skills, kanban, taskmaster, MCP servers (Inkstone memory + Jev judgment), opencode config, launchd/scheduled background services.

- Jairo's install + runtime for the Huckleberry Managed Service (business: `businesses/huckleberry/`)
- First client instance: **Hickory** (AG Catering & Events, Fort McMurray AB)
- ESM only (`"type": "module"`), plain Node.js (no TS build step, no framework)

## Run / Check Commands

| Command | Does |
|---|---|
| `node bin/huckleberry.js help` | Show commands (bin is 4 lines → `src/cli.js run()`) |
| `node bin/huckleberry.js doctor` | Health check: node/npm/opencode/kimaki versions, ~/.huckleberry state, MCP installs, skills count, .env keys, disk free |
| `node bin/huckleberry.js install` | Full install → `~/.huckleberry/` + `~/.claude/skills` + `~/.opencode/opencode.json` |
| `node bin/huckleberry.js packs` / `install-pack <p>` | List/deploy skill packs (manifest: `skills/manifest.json`) |
| `node bin/huckleberry.js harness list` | List harness adapters (opencode, deepseek, pi) + active selection |
| `node bin/huckleberry.js harness set <name>` | Persist default adapter to `~/.huckleberry/harness.json` |
| `node bin/huckleberry.js harness test <name>` | Wire-format smoke test for an adapter |
| `node bin/huckleberry.js golden run --adapter <a> [--filter id]` | Run golden tasks from `tests/golden/`; writes telemetry JSONL + summary JSON to `huckleberry/tests/baseline/` |
| `node tests/deepseek-wire.test.js` | Offline wire-format test for the DeepSeek adapter (stubbed fetch, no key) |
| `HUCKLEBERRY_TEST=1 node bin/huckleberry.js install` | Sandbox install (HOME redirected via `HUCKLEBERRY_HOME`; never loads launchd services) |
| `node --check <file>` | Syntax gate — all new/edited JS must pass (no tsc; repo is plain JS) |

Test command (documented per success criteria): `for f in src/harness/*.js src/cli.js bin/huckleberry.js; do node --check $f; done && HUCKLEBERRY_TEST=1 node bin/huckleberry.js golden run --adapter opencode --filter ...`

## File Map

```
huckleberry/
├── bin/huckleberry.js        # entry (4 lines)
├── src/
│   ├── cli.js                # command dispatch + install/doctor/cro/review/update
│   ├── interview.js          # first-run personalization
│   ├── postinstall.js        # npm postinstall
│   └── harness/              # Phase 1 harness-engineering layer
│       ├── types.js          # HarnessAdapter interface (JSDoc contract) + helpers
│       ├── registry.js       # adapter registry + selection policy (cost-optimized, capability-matched)
│       ├── telemetry.js      # per-task token/cost JSONL recorder
│       ├── deepseek.js       # DeepSeek/OpenRouter client (provider routing, pricing, usage → cost)
│       ├── opencode-adapter.js   # DEFAULT adapter; wraps `opencode run` (existing behavior)
│       ├── deepseek-adapter.js   # DeepSeek adapter (direct API OR OpenRouter route)
│       └── pi-adapter.js         # Pi coding-agent adapter (`pi --print`, lean cold-start)
├── agents/cos.json, agents/hermes/   # chief-of-staff + hermes agent defs
├── skills/                   # 124 skill packs (manifest.json drives install-pack)
├── kanban/                   # kanban workflow (own package.json, npm-installed)
├── taskmaster/               # next-task.js, update-status.js, dispatcher.mjs, SKILL.md
├── scripts/                  # doctor-watchdog.sh, heartbeat.sh, keepalive, self-improve-weekly.sh, install-services.*, sync-skills.mjs
├── templates/                # 12 files copied to ~/.huckleberry on install (incl. opencode.json with {{USERPROFILE}} placeholders)
├── mcp/                      # MCP host dirs created at install (inkstone, jev-mcp npm hosts)
├── plugins/                  # opencode plugins copied to ~/.opencode/plugin (env-inject, inkstone-gate)
├── wiki/                     # copied to ~/.huckleberry/wiki
└── tests/
    ├── golden/               # 10 golden tasks (AG Catering ops scope) + runner.js
    └── baseline/             # doctor baseline + golden-run telemetry outputs (gitignored artifacts OK)
```

Business docs (NOT code) live at `businesses/huckleberry/` — evergreen.md, tasks.md (HKY- prefix), clients/ag-catering/, offering/.

## Config Keys

- `templates/opencode.json` — installed to `~/.opencode/opencode.json`; `{{USERPROFILE}}` placeholders; keys: `mcp` (inkstone w/ `INKSTONE_DB`, context7, jev w/ `TYPESAFE_API_KEY`), `permission.doom_loop: deny`, `plugin`, `compaction` (safeguard, 0.85), `agent`, `instructions`
- `~/.huckleberry/.env` — `DISCORD_BOT_TOKEN`, `TYPESAFE_API_KEY`, `DOCTOR_WEBHOOK_URL`, `DOCTOR_CHANNEL_ID`, plus harness keys: `OPENROUTER_API_KEY` (drives deepseek + pi adapters) or `DEEPSEEK_API_KEY` (direct DeepSeek), `HUCKLEBERRY_HARNESS` (default adapter), `HUCKLEBERRY_DEEPSEEK_PROVIDER` (`deepseek`|`openrouter`), `DEEPSEEK_MODEL`, `PI_MODEL`
- `~/.huckleberry/harness.json` — persisted harness selection: `{ "default": "opencode" }`
- `HUCKLEBERRY_HOME` (env) — redirects install/state root (sandbox testing); `HUCKLEBERRY_TEST=1` also suppresses launchd service loading
- `skills/manifest.json` — pack → skill folder list

## Data Dirs (installed state)

- `~/.huckleberry/` — logs, memory, agents, scripts, taskmaster, kanban, mcp/, wiki/, .env, harness.json
- `~/.claude/skills/` — deployed skill packs
- `~/.opencode/` — plugin/ + opencode.json
- launchd services (macOS): doctor watchdog + heartbeat (suppressed under HUCKLEBERRY_TEST=1)

## Gotchas

- **Credential precedence gotcha**: `~/.huckleberry/.env` WINS over ambient process env for harness keys. A stale `OPENROUTER_API_KEY` exported in the shell (or inherited from a workspace `.env`) will NOT override the install's own key — this prevents a dead ambient key from silently 401-ing every task.
- **opencode cold start**: running `opencode run` inside a large repo (clawd workspace) loads its full AGENTS.md + 200+ skills and can exceed the timeout. The opencode adapter runs from a neutral temp cwd with `stdin: ignore` (required — opencode hangs without it) and `--agent build` (default `plan` agent refuses to execute).
- **pi model ids are provider-qualified**: use `openrouter/deepseek/deepseek-v4.1-flash`; a bare `deepseek/...` is ambiguous across providers and pi errors out.
- **launchd is host-global**: install-services ignores HOME redirects; install forces `HUCKLEBERRY_NO_LOAD=1` when HOME isn't the real home. Always sandbox-test with `HUCKLEBERRY_TEST=1`.
- `bin/huckleberry.js` resolves ROOT via `import.meta.url` — running from a copied/symlinked tree still uses the source tree's package.json.
- `templates/opencode.json` merge policy: existing user config wins; only missing top-level keys are filled (`writeConfig()`).
- Skill count check in doctor expects ≥10 dirs with SKILL.md in `~/.claude/skills`.
- No `npm test` — use `node --check` + the golden runner + `tests/deepseek-wire.test.js`.
- Golden checks are format-tolerant for numbers (`$2,467.50` == `2467.50`) but exact for required phrases; failures are usually model-output variance, not code bugs. Re-run the failing task before treating it as a regression.

## Update Rule

Any agent adding/changing a command, file, config key, or gotcha in this repo MUST update this MAP.md in the same session. Keep it one page. If MAP.md is missing or stale after exploring, regenerate it (Jairo directive 2026-11-01).
