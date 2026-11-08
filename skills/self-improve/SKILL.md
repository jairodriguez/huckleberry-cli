---
name: self-improve
description: "Self-improvement system for agent behavior. Three layers: outcome journaling, behavior evals, and weekly review."
---

# Self-Improvement System

Three layers that close the loop: observe → evaluate → improve → repeat.

---

## Pre-Task Check (MANDATORY)

**Before starting any task for Jairo**, scan active corrections to avoid repeating mistakes:

```bash
node scripts/self-improve/behavior-eval/behavior-eval.mjs stats
```

Or read `memory/corrections.md` directly — focus on the **Active Corrections** section.

**Why:** Corrections are useless if you never read them. This is the closed loop — read before acting, log after acting, review weekly.

---

## Layer 1: Outcome Journal

**After every task**, log the outcome:

```bash
node scripts/self-improve/outcome-journal/log-outcome.mjs log "<task description>" <success|corrected|failed|partial> "<correction if any>" <agent-name>
```

**When to log:**
- After completing any task Jairo asked for
- After a task fails or gets corrected
- After sub-agent work completes (log the sub-agent's outcome)

**Examples:**
```bash
# Success
node scripts/self-improve/outcome-journal/log-outcome.mjs log "fixed auth timeout bug" success "" kestrel

# Corrected — Jairo said to use WhatsApp format, not Discord format
node scripts/self-improve/outcome-journal/log-outcome.mjs log "send update to Jairo" corrected "used Discord formatting instead of WhatsApp format → check platform before formatting" kestrel

# Failed
node scripts/self-improve/outcome-journal/log-outcome.mjs log "deploy to production" failed "Vercel API key expired → always check key validity before deploy attempts" kestrel
```

**View stats:**
```bash
node scripts/self-improve/outcome-journal/log-outcome.mjs summary
```

**Key files:**
- `memory/outcome-journal.md` — raw outcome log
- `memory/corrections.md` — extracted correction patterns

---

## Layer 2: Behavior Evals

16 binary evals that define "good agent behavior." Scored weekly.

**Defined in:** `memory/behavior-evals.md`

**Eval categories:**
- Core Behavior (10 evals) — acknowledgment, conciseness, execution style
- Content Quality (3 evals) — scroll-stopping, authentic voice, actionable
- Technical (3 evals) — lint, conventions, dependency checking

**How evals connect to corrections:**
When a correction is logged, it's pattern-matched against eval categories. If the same category keeps getting corrections, that eval starts failing.

**Check evals:**
```bash
node scripts/self-improve/behavior-eval/behavior-eval.mjs list   # show all evals
node scripts/self-improve/behavior-eval/behavior-eval.mjs stats  # recent stats
node scripts/self-improve/behavior-eval/behavior-eval.mjs prompt # generate review prompt
```

**Scoring threshold:**
- 90%+: Healthy, no action needed
- 75-89%: Improvement zone, targeted mutations
- <75%: Autoresearch recommended on failing evals

---

## Layer 3: Weekly Self-Review

**Cron:** Mondays at 09:00 UTC

**What it does:**
1. Reads the past 7 days of outcomes and corrections
2. Scores all behavior evals
3. Identifies failing evals and suggests AGENTS.md mutations
4. Writes score to `memory/eval-scores.md`
5. If score < 75%, recommends running autoresearch

**Run manually:**
```bash
node scripts/self-improve/weekly-review/weekly-review.mjs run    # full review
node scripts/self-improve/weekly-review/weekly-review.mjs score  # JSON score only
```

**Review output includes:**
- Outcome stats for the week
- Pass/fail for each eval
- Suggested AGENTS.md mutations for failing evals
- Corrections to distill into MEMORY.md

---

## How the Loop Works

```
Task completes
  → log outcome (Layer 1)
  → if corrected/failed, log correction with pattern

Weekly cron fires
  → scores all evals against week's outcomes (Layer 2)
  → identifies failing patterns (Layer 3)
  → proposes AGENTS.md / SOUL.md mutations
  → if score < 75%, flag for autoresearch

Jairo approves mutations (or autoresearch runs them)
  → agent behavior improves
  → outcomes get better
  → repeat
```

---

## Integration with Existing Systems

**MEMORY.md:** Weekly review extracts correction patterns and writes them as lessons
**AGENTS.md:** Mutations from eval failures get proposed as specific rule additions
**autoresearch skill:** If eval score < 75%, the review recommends running autoresearch on the agent's behavior prompts
**memory_dream:** Corrections older than 30 days get archived during dream cycle

---

## Adding New Evals

When a new pattern of mistake is identified:
1. Write it as a binary yes/no question
2. Add to `memory/behavior-evals.md` in the appropriate category
3. Add a scoring case to `scripts/self-improve/weekly-review/weekly-review.mjs` in the `scoreEvals()` function
4. The weekly review will start scoring it automatically

---

## Maintenance (Auto-Pruned)

Nothing grows forever. Every file has hard limits:

| File | Max Age | Max Size | Pruned By |
|------|---------|----------|-----------|
| `corrections.md` | 7 days | 10 entries | Weekly review + log-outcome |
| `outcome-journal.md` | 30 days | N/A | Weekly review (prune command) |
| `eval-scores.md` | Indefinite | Table rows only | Manual (trend data, small) |
| `behavior-evals.md` | Indefinite | ~16 evals | Quarterly review, remove ones that always pass |

**The principle:** corrections are RAM, not disk. They exist to be distilled into behavior, not stored. If a correction keeps recurring, it becomes a rule in AGENTS.md. Once learned, the correction disappears.
