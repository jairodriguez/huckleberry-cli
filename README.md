# 🫐 Huckleberry

**Your own AI operations department — installed with one command.**

Huckleberry installs a 5-agent system on **your** machine, wired to **your** Discord, with persistent memory, 105+ professional skills, and a built-in repair agent (Hermes) that keeps the system alive 24/7.

> **What you actually get:** 1 Chief of Staff (orchestrator) + 3 workers (build/plan/researcher) + 1 doctor (Hermes) = 5 agents total. All running on your hardware, your keys, your channels.

## Quick Start

```bash
curl -fsSL https://raw.githubusercontent.com/jairodriguez/huckleberry-cli/main/install.sh | bash
```

Or manually (same thing, step by step):

```bash
# 1. Install the CLI
npm install -g @jairodri/huckleberry-cli

# 2. Scaffold the system (~/.huckleberry + skills + configs)
huckleberry install

# 3. Install the runtime (opencode + kimaki Discord bot)
npm install -g opencode kimaki

# 4. Personalize: name, business, timezone, tone, optional keys
huckleberry interview
```

Then finish setup:

1. **Add your keys** to `~/.huckleberry/.env`:
   - `DISCORD_BOT_TOKEN` — create a Discord bot (walkthrough: `~/.huckleberry/wiki/discord.md`)
   - `TYPESAFE_API_KEY` — get one at https://typesafe.ai (enables Jev judgment tools)

2. **Verify everything**: `huckleberry doctor`

3. **Start**: `opencode` (opens your Chief of Staff in Discord)

**For AI agents** (Claude, Cursor, Codex, etc.) — point them at this repo and say: *"Read this README and run Quick Start."* Every step is agent-executable.

## Agent Structure

| Agent | Role | Bound to |
|---|---|---|
| **cos** (Chief of Staff) | Orchestrator — your main Discord interface, spawns workers, tracks tasks | Main Discord channel |
| **build** | Executor — writes files, runs tools, completes tasks | Background (spawned by cos) |
| **plan** | Strategist — read-only research, analysis, planning | Background (spawned by cos) |
| **researcher** | Intelligence — web research, competitive analysis, data gathering | Background (spawned by cos) |
| **🩺 hermes** | System doctor — repairs kimaki, Discord, opencode, Inkstone, Jev | `#system-repair` channel (you create) |

## What Else You Get

| Component | What it does |
|---|---|
| **Inkstone** | Persistent memory: decisions, contacts, procedures, past failures — survives restarts |
| **Jev** | Judgment layer: fast structured decisions (classify, rank, verify, gate) |
| **105+ skills** | 9 packs: content, SEO, CRO, web design, research, outreach, social |
| **Watchdog** | 5-minute health sweep + auto-repair + Discord alerts |
| **Self-improvement** | Weekly sweep proposes concrete improvements from the week's failures |

## Commands

```
huckleberry install           Full first-time install
huckleberry interview         Personalize your agents
huckleberry doctor            Health check — run when anything feels off
huckleberry packs             List available skill packs
huckleberry install-pack <p>  Deploy a pack (or: all)
huckleberry cro <url>         CRO audit of a landing page
huckleberry review            Weekly self-improvement review (proposals only)
huckleberry update            Update to the latest version
```

## Skill Packs

| Pack | Focus |
|---|---|
| `core` | Memory, context management, formatting *(installed by default)* |
| `doctor` | Jev judgment skills + system repair *(installed by default)* |
| `content` | Copywriting, articles, hooks, brand voice, quality gates |
| `cro` | Landing page / form / popup / onboarding CRO, A/B tests, analytics |
| `web-design` | Design quality (impeccable), landing pages, SEO/AEO |
| `research` | Web research, SERP analysis, Reddit/X/YouTube intelligence |
| `outreach-sales` | Cold email, lead crafting, sequences, sales enablement |
| `social` | X posts, campaigns, image gen, marketing strategy |
| `self-improvement` | Skill optimization loops, auto-research, expertise building |

```bash
huckleberry packs && huckleberry install-pack all
```

## When Something Breaks

Hermes is your system doctor. Three ways to reach it:

1. **Discord:** create a `#system-repair` channel, bind the `hermes` agent, say **"fix it"**
2. **Terminal:** `huckleberry doctor` — instant health check
3. **Automatic:** the watchdog runs every 5 minutes; on failure it alerts your Discord (set `DOCTOR_WEBHOOK_URL` in `.env`) and spawns Hermes to self-repair

## Philosophy

Your AI department runs on **your** machine, with **your** keys, answering in **your** channels. Nothing is rented. When it breaks, the system repairs itself — and shows its work.

## Docs

- Installed wiki: `~/.huckleberry/wiki/` — kimaki, Discord bot setup, opencode, Inkstone, Hermes

## Requirements

- Node.js 18+
- macOS or Windows (background services) · Linux works for the core CLI
- npm

MIT licensed.