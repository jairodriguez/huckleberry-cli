# 🫐 Huckleberry

**Your own AI operations department — installed with one command.**

Huckleberry gives you a chief-of-staff AI team running on **your** machine, wired to **your** Discord, with persistent memory, 105+ professional skills, and a built-in repair agent (Hermes) that keeps the system alive 24/7.

> **One-liner:** *Your own AI department, running on your own server, answering in your own channels — built, trained, and maintained for you.*

## Quick Start

```bash
curl -fsSL https://raw.githubusercontent.com/jairodriguez/huckleberry-cli/main/install.sh | bash
```

Or manually:

```bash
npm install -g @jairodri/huckleberry-cli
huckleberry install
npm install -g opencode kimaki
huckleberry interview
```

Then finish setup:
1. **`huckleberry interview`** — your name, business, tone, optional API keys
2. **`~/.huckleberry/.env`** — add your `DISCORD_BOT_TOKEN` + `TYPESAFE_API_KEY` (Discord bot walkthrough: `~/.huckleberry/wiki/discord.md`)
3. **`huckleberry doctor`** — verify everything
4. **`opencode`** — start working with your Chief of Staff

**For AI agents** (Claude, Cursor, Codex, etc.) — point them at this repo and say: *"Read the README and run the Quick Start."* Every step is agent-executable.

## What You Get

| Component | What it does |
|---|---|
| **Chief of Staff** | Orchestrator agent — your main interface in Discord |
| **build / plan / researcher** | Worker agents: execution, strategy, web research |
| **🩺 Hermes (the doctor)** | System administrator — repairs the stack when it breaks |
| **Inkstone** | Persistent memory: decisions, contacts, procedures, past failures |
| **Jev** | Judgment layer: fast structured decisions (classify, rank, verify) |
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
- https://huckleberry.ai

## Requirements

- Node.js 18+
- macOS or Windows (background services) · Linux works for the core CLI
- npm

MIT licensed.
