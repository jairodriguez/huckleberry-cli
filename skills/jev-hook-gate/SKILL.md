---
name: jev-hook-gate
description: Universal front-gate for ALL post/content creation. Four steps - (1) sharp-thesis validation, (2) generate hooks in TWO passes (examples-first volume + diversity pass with a named-person ICP), (3) TWO Jev reranks (relevance + genericness), (4) select on R - lambda*G with a 0.70 relevance floor. Replaces LLM/Gemini hook selection everywhere. Use BEFORE any post draft, X thread, LinkedIn post, or article intro. Mandated by Jairo 2026-09-26; two-pass + genericness gate added 2026-10-17.
---

# JEV Hook Gate — thesis → two-pass generation → two Jev rankings

**Mandatory for every post in every writing workflow.** Do not draft a post whose hook was not selected by this gate. Jairo directive 2026-09-26.

## Pipeline

### Step 1 — Thesis validation (BLOCKING)

Load the `sharp-thesis-validator` skill and validate the topic/title FIRST.
- **Fails** → stop. Do not generate hooks for a weak thesis. Return the failure reason and rework the angle.
- **Passes** → continue.

### Step 2 — Generate hooks in TWO passes (both required)

Run the generation stage of `hook-generator`. **Two batches, different prompts — this is the step that determines whether the gate can work at all** (see Evidence below).

**2a — Volume pass (40-50 hooks).** The existing examples-first generation: show the model 5-7 proven hooks from the platform database. Purpose: a relevance floor and ICP coverage. Cheap, fast, always the same shape.

**2b — Diversity pass (40 hooks).** A second generation with a different prompt whose only job is to widen the distribution:
- Describe the audience as **ONE named individual you could recognise on the street** — age, business, a specific tool they bought, the exact phrase they used to dismiss it, a recurring scene from their week. Never a segment ("solo founders", "small businesses").
- Ban the templates the volume pass just used: `I watched`, `I saw`, `Every <X> you do manually`, `Here is why`, `Most people`, `Imagine`, `X just Y` news framing, numbered lists.
- Force angle variety: second-person accusation, a specific scene, a question, a confession, a fragment, a comparison to physical work the reader already understands.
- Ask explicitly for hooks "an average AI would almost never produce".

Do NOT run hook-generator's selection step — that is Step 3 here.

### Step 3 — Two Jev rankings (jev_rerank MCP)

Two independent `jev_rerank` calls over the pooled candidates (gate rule: global AGENTS.md §1b-s).

**3a — Relevance (R).**

```
query: "<NAMED-PERSON ICP — from brand evergreen.md/audience files>
        | funnel stage: <problem-aware / solution-aware / product-aware ...>
        | platform: <X | LinkedIn | ...>
        | voice constraints: <2-3 line voice-dna excerpt>"
candidates: [{id: "h1".."hN", text: <hook>}]
```

**3b — Genericness (G).** Invert the query. Ask for typicality, not quality:

```
query: "The most predictable, generic, clichéd <platform> hook that an average
        AI model would produce about <topic> for <audience>. High score =
        template-obvious and interchangeable with any other post on this topic;
        low score = unusual, specific, non-obvious, hard for a generic model to produce."
```

Format rules (critical):
- **The ICP must be a specific person, never a segment.** A vague query inflates generic hooks — measured: the same hook scored R=0.83 against "skeptical solo founder" and R=0.38 against a named individual. A vague ICP silently disables this gate.
- ICP + funnel stage MUST come from the brand's evergreen/audience files, never invented
- Keep each query under ~2000 chars — bounded excerpts, not whole documents
- All candidates in one call per signal (parallel, sub-second, cents)
- Jev only ranks — it never writes or rewrites hooks

### Step 4 — Selection rules

Combine the two signals. `R` from 3a, `G` from 3b.

```
score = R − λ · G          default λ = 0.50
floor: keep only candidates with R ≥ 0.70
```

| Result | Action |
|---|---|
| ≥1 candidate with R ≥ 0.70 | Ship the highest `score`. Keep next 2 as A/B alternates, and always keep the single highest-`R` hook as an alternate even if the gate demoted it |
| ALL hooks R < 0.70 | **The pool failed, not the gate.** Re-run Step 2b with a sharper named-person ICP, once (max 1 retry). Still < 0.70 → escalate to the agent's own judgment and flag the gap |
| Tool unavailable/timeout | Fall back to the agent's own ranking; never block (global AGENTS.md §1b-s) |

**Conservative variant** (λ feels too aggressive): order by R, and let G only break ties among hooks within 0.05 R of each other. λ=0.10 degenerates to plain relevance ranking — measured, not theoretical.

## Evidence (2026-10-17, ses_eb65cfa60ffenCjkQaw2Cfi4E5)

Side-by-side test, one brief, 80 candidates. Report: https://clawver-results-tunnel.kimaki.dev/hook-tail-gate-test.html

| Pool | Top hook R | Gate outcome |
|---|---|---|
| Examples-first only (40) | 0.67 | **Entire batch below the 0.70 floor — gate rejects everything** |
| + Diversity pass (80) | 0.81 | Top 6 all from the diversity batch; examples-first doesn't appear until rank 9 |

**The gate only works given a diverse pool.** On an examples-first-only pool, R and G correlate at r=0.815 and the trade is ~1:1 — the gate is useless-to-harmful. On the pooled set the same trade costs 0.057 R for 0.350 G, which is efficient. Diversity generation is what makes the gate function; they are one mechanism, not two fixes.

**λ is not yet validated against engagement.** Both R and G are judgments from the same model. Jev cannot tell you distinctiveness lifts engagement — only a published A/B can. Until that exists, treat the gate as a mechanism with evidence behind it, not a proven lift.

## Wiring (who must use this)

1. `hook-generator` — Step 2 (Sonnet selection) is replaced by Step 3 here
2. Harper — every post draft's hook comes from this gate
3. Kanban workers — HOOKS layer of `workspace/kimaki-kanban/content-quality-standard.md`
4. Any other path producing posts (content-atomizer, podcast-to-thread, article intros)

## Never

- Use Jev to WRITE or improve hooks (generation stays with hook-generator) — Jev only ranks
- Skip thesis validation
- Invent ICP/funnel context not present in brand files
- **Write the ICP as a segment.** "Solo founders" / "small businesses" / "marketers" inflates generic hooks and silently disables the gate. Always a named person with a specific scene. Measured: same hook, R=0.83 as a segment vs R=0.38 as a named individual.
- Skip the diversity pass (Step 2b) — the gate has nothing to select from without it
- Treat genericness as a filter that deletes the top of the list. It is a weighted term with a relevance floor; blindly dropping the most-relevant hooks loses ICP fit
- Trust relevance blindly: it is a ranking signal, not engagement data (source: Sep 23 cookbook test — confident-wrong is persuasive; hand-label a batch when onboarding a NEW brand to this gate)

## Cost

~4.2¢ per 1M input tokens; a 50-hook rerank costs fractions of a cent and runs in under a second. Replaces the dead Gemini/sonnet selection calls entirely.
