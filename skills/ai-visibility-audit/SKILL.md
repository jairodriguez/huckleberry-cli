---
name: ai-visibility-audit
description: "Audit your brand's visibility across AI search engines — Google AI Mode, ChatGPT, Perplexity, Claude, Gemini."
allowed-tools: []
---

# /ai-visibility-audit — AI Search Visibility Audit

Measure what matters now. Traditional SEO tracks keyword rankings and referral traffic. AI search killed that game — 93% of Google AI Mode searches end without a click, and only 17-36% of traditional top-10 results overlap with AI Mode citations. This skill measures the new metric: **AI visibility** (mentions + citations across AI engines).

For brand memory protocol, see /cmo [rules/brand-memory.md](../cmo/rules/brand-memory.md).

## On Activation

1. Read `brand/` directory: load `positioning.md`, `competitors.md`, `audience.md`, `keyword-plan.md` if present.
2. Show what loaded:
   ```
   Brand context loaded:
   ├── Positioning     ✓/✗
   ├── Competitors     ✓/✗
   ├── Audience        ✓/✗
   └── Keyword Plan    ✓/✗
   ```
3. If no brand files exist, ask: What product/service do you want to audit? Who are your top 3-5 competitors? What do your buyers search for?
4. Determine mode:
   - **Full Audit** — Generate buyer prompts + test across engines (default)
   - **Quick Check** — Test 3-5 prompts on 1-2 engines (fast)
   - **Comparison** — Audit your brand vs a specific competitor

---

## Phase 0: Generate Buyer Prompts

The audit is only as good as the prompts. AI search uses full sentences and questions — not keywords.

### Source Prompts From

1. **Brand files** (if present):
   - `keyword-plan.md` → Convert top keywords into natural-language questions
   - `positioning.md` → Extract core value propositions as "best X for Y" queries
   - `competitors.md` → Generate "[competitor] vs [brand]" and "[competitor] alternatives" queries
   - `audience.md` → Derive pain-point questions from ICP description

2. **If no brand files**, generate prompts from these templates (pick 10-15 total):

   | Category | Prompt Template |
   |----------|----------------|
   | Product category | "What is the best [product type] for [use case]?" |
   | Comparison | "How does [brand] compare to [competitor] for [use case]?" |
   | Problem-solution | "How do I [solve problem] without [common approach]?" |
   | Category alternatives | "What are the best alternatives to [market leader]?" |
   | Buyer-specific | "What [product type] should a [company size/type] use for [goal]?" |
   | Feature-specific | "Which [product category] has the best [feature]?" |
   | Price-conscious | "Best [product type] for small teams on a budget" |
   | Educational | "How does [technology/process] work for [industry]?" |

3. **Save prompts** to `brand/buyer-prompts.md` (create if needed) so future audits reuse the same set for comparison.

### Prompt Quality Check

Each prompt must:
- Be a full sentence or question (not keywords)
- Reflect how a real buyer would ask an AI
- Cover different stages: problem-aware, solution-aware, comparison-ready
- Include at least 3 comparison prompts against named competitors

---

## Phase 1: Test Each Prompt Across AI Engines

Run every buyer prompt against the AI search engines you can access. Not all engines will be testable every time — audit what you can, note what you couldn't test.

### Testing Methods (use what's available)

**With browser automation (Playwriter / usecomputer):**
1. **Google AI Mode** — Navigate to google.com, switch to AI Mode, enter prompt. Screenshot the full response.
2. **ChatGPT** — Navigate to chatgpt.com, enter prompt with web search enabled. Screenshot.
3. **Perplexity** — Navigate to perplexity.ai, enter prompt. Screenshot.
4. **Claude** — Navigate to claude.ai, enter prompt with web search. Screenshot.
5. **Gemini** — Navigate to gemini.google.com, enter prompt. Screenshot.

**With web fetch only:**
1. Use Perplexity API (if API key available) for programmatic queries
2. Use web search to check what sources appear for "site:yourdomain.com [topic]"
3. Check if your content appears in SERP features for AI-style queries

**With no external access:**
1. Use `ai-seo` skill's content audit approach — analyze existing content against AI citation patterns
2. Review schema markup, content structure, entity signals
3. Note limitation: "Live AI testing requires browser or web access. This audit covers content optimization only."

### For Each Response, Record

| Field | What to capture |
|-------|----------------|
| Prompt | The exact query tested |
| Engine | Which AI search engine |
| Brand mentioned? | Yes/No + context (positive, neutral, negative) |
| Brand cited? | Yes/No + URL of cited page |
| Position | Where in the response (first mention, middle, end, not at all) |
| Competitors mentioned | List all competitors that appeared |
| Sources cited | List all URLs/domains the AI cited |
| Response type | Comparison table, narrative, list, single answer |
| Data sources AI used | What kind of content did AI pull from (blog, YouTube, Reddit, review sites, PR) |

### Screenshot Protocol

For every test, take a screenshot. Screenshots serve as:
- Proof of current state (baseline for future comparison)
- Evidence of competitor positioning
- Visual reference for the audit report

Save to: `brand/marketing/seo/ai-audit-screenshots/{YYYY-MM-DD}/{engine}-{prompt-number}.png`

---

## Phase 2: Analyze Results

### Per-Engine Summary

For each engine, calculate:

```
Visibility Score = (Mentions + Citations) / Total Prompts × 100
```

| Engine | Prompts Tested | Mentions | Citations | Visibility Score | Grade |
|--------|---------------|----------|-----------|-----------------|-------|
| Google AI Mode | 15 | 3 | 1 | 27% | D |
| ChatGPT | 15 | 5 | 2 | 47% | C |
| Perplexity | 15 | 7 | 4 | 73% | B |
| Claude | 15 | 2 | 0 | 13% | F |
| Gemini | 15 | 4 | 2 | 40% | C |

Grading: A ≥ 80%, B ≥ 60%, C ≥ 40%, D ≥ 20%, F < 20%

### Gap Analysis

For each prompt where the brand was absent:

1. **Who appeared instead?** → Identify which competitors own that query
2. **What sources did AI cite?** → YouTube? Reddit? Forbes? G2? → These are the platforms you need to be on
3. **What content gap does this reveal?** → Missing topic, missing depth, missing platform presence, missing data
4. **How hard is this to fix?** → Quick win (existing content needs optimization) vs. new content needed vs. new platform presence needed

### Competitor Intelligence

Build a competitor visibility matrix:

| Competitor | Mentioned in X prompts | Cited in X prompts | Strongest engines | What they do differently |
|-----------|----------------------|--------------------|--------------------|------------------------|
| [Comp 1] | 12/15 | 8/15 | Perplexity, ChatGPT | Has YouTube channel, published on Forbes |
| [Comp 2] | 9/15 | 5/15 | Google AI Mode | Strong FAQ schema, comparison tables |
| [Brand] | 3/15 | 1/15 | — | — |

### Source Platform Analysis

AI engines pull from specific platforms. Track which platforms appear most:

| Platform | Times cited | Your presence? |
|----------|-------------|----------------|
| YouTube | 23 | ✗ (no channel) |
| Reddit | 18 | ✗ (no posts) |
| Forbes/Inc/PR | 12 | ✗ (no earned media) |
| G2/Capterra | 9 | ✗ (no profile) |
| LinkedIn | 7 | ✓ (active) |
| Company blog | 15 | ✓ (exists) |

This directly informs the multi-platform distribution strategy.

---

## Phase 3: Generate Prioritized Action Plan

### Categorize Actions

| Priority | Criteria | Example |
|----------|----------|---------|
| **P0 — Critical** | Brand absent from high-intent buyer queries | Not mentioned for "best [product] for [ICP]" |
| **P1 — High** | Brand mentioned but not cited; competitors cited | You appear in prose but no link to your site |
| **P2 — Medium** | Brand cited but low position or weak context | Cited as #5 in a list, described generically |
| **P3 — Maintenance** | Brand cited strongly; maintain and expand | Already source #1-2, protect position |

### Action Items

For each gap, create a specific action:

| Gap | Root Cause | Action | Skill to use | Effort |
|-----|-----------|--------|-------------|--------|
| Not mentioned for "best X for Y" | No comparison page | Create /compare/[brand]-vs-[comp] page | seo-machine, ai-seo | Medium |
| AI pulls from YouTube, no YT content | No video presence | Create 3 explainer videos | video-content, cmo-remotion | Large |
| AI cites Reddit threads, no Reddit presence | No community presence | Build Reddit authority | ai-consensus-builder | Large |
| Mentioned but not cited | Content lacks extractable structure | Add FAQ schema, comparison tables | ai-seo, schema-markup | Small |
| Competitor cited from Forbes article | No earned media | Pitch original research to journalists | earned-media | Large |
| Brand mentioned generically | No differentiating data | Publish proprietary research | original-research | Large |

---

## Phase 4: Write Audit Report

### Output File

Write to: `brand/marketing/seo/ai-visibility-audit.md`

### Frontmatter

```yaml
---
title: "AI Search Visibility Audit"
date: "{YYYY-MM-DD}"
previous_audit: "{path to last audit or 'none'}"
prompts_tested: {number}
engines_tested: ["Google AI Mode", "ChatGPT", "Perplexity", "Claude", "Gemini"]
overall_visibility_score: "{percentage} ({grade})"
mentions: {number}
citations: {number}
top_competitor: "{name} — {their score}"
critical_gaps: {number}
quick_wins: {number}
new_content_needed: {number}
---
```

### Report Structure

```markdown
# AI Search Visibility Audit — {Brand Name}

## Executive Summary
- Overall visibility: {score} ({grade})
- {mentions} mentions, {citations} citations across {prompts} prompts
- {critical_gaps} critical gaps, {quick_wins} quick wins
- Top threat: {competitor} appears in {X}% more queries

## Per-Engine Results
[Engine-by-engine tables from Phase 2]

## Prompt-by-Prompt Detail
[Full results for each prompt — mentioned, cited, competitors, sources, screenshots]

## Competitor Landscape
[Competitor matrix from Phase 2]

## Source Platform Analysis
[Which platforms AI engines cite, your presence on each]

## Prioritized Action Plan
[P0-P3 actions from Phase 3]

## Delta from Previous Audit
[If previous audit exists, show what changed: mentions gained/lost, citations gained/lost, competitor movements]

## Next Steps
[Top 3 recommended actions with skill suggestions]
```

### Delta Tracking

If a previous audit exists at `brand/marketing/seo/ai-visibility-audit.md`:
1. Read the previous file
2. Compare mentions and citations per prompt
3. Generate a delta section showing:
   - Queries gained/lost mentions
   - Queries gained/lost citations
   - New competitor appearances
   - Score changes per engine
4. Archive the previous audit to `brand/marketing/seo/ai-visibility-audit-{date}.md`

---

## Worked Example

**User request:** "Check our AI visibility for NomadixGear"

**Phase 0:** Load brand files. NomadixGear sells portable solar chargers. Generate prompts:
- "Best portable solar charger for camping"
- "NomadixGear vs Jackery solar charger"
- "What solar charger works best for off-grid living?"
- "Best solar chargers under $200 for hiking"
- (12 more...)

**Phase 1:** Test 15 prompts across 5 engines. Screenshot each. Record mentions, citations, competitors, sources.

**Phase 2:** Results: 4/15 mentions, 1/15 citations. Visibility: 33% (D). Competitor Jackery appears in 11/15. AI engines cite YouTube reviews (brand has none), Reddit threads (brand has no presence), and Wirecutter articles.

**Phase 3:** P0 gaps: Absent from "best solar charger for camping" on all engines. P1: Mentioned but not cited in 3 queries. Action plan: Create 3 YouTube videos, get featured on outdoor gear review sites, add comparison pages vs Jackery/GoalZero, create FAQ-rich product pages.

**Phase 4:** Write audit report. Save. Offer to schedule weekly re-check.

---

## Chain Offers

After completing, present:

- `/ai-seo` — Optimize content for AI citation based on audit findings
- `/seo-machine` — Ship comparison and alternatives pages for competitor queries
- `/content-atomizer` — Distribute content to the platforms AI engines cite most
- `/keyword-research` — Find more buyer prompts to add to the audit set
- "Schedule weekly visibility check" — Set up recurring cron to track changes

---

## Anti-Patterns

| Anti-pattern | Instead | Why |
|-------------|---------|-----|
| Testing keyword-style queries ("solar chargers") | Use natural language ("best solar charger for camping trips") | AI search uses conversational prompts, not keywords. Keyword queries test the wrong thing. |
| Testing only Google | Test across 4-5 AI engines minimum | Each engine uses a different index and ranking logic. Google-only audits miss 60%+ of AI search. |
| One-time audit with no follow-up | Archive each audit, compare deltas weekly | AI visibility is volatile — a single snapshot proves nothing. Trends matter more than points. |
| Only checking if brand appears | Also record what sources AI pulls from | Knowing AI cites YouTube and Reddit for your category is more actionable than knowing you're absent. |
| Skipping the screenshot step | Screenshot every response | Screenshots are the only proof of what AI said. Memory of "I think it mentioned us" is useless. |
| Testing brand name queries ("NomadixGear review") | Test category and problem queries first | Anyone can rank for their brand name. Category queries are where buyers discover you. |
| Auditing with fewer than 10 prompts | Minimum 10, ideal 15-20 | Too few prompts gives noisy data. One good/bad result swings the whole score. |

## YAGNI Principles

- Don't try to automate the AI queries with API calls — browser testing captures the real user experience
- Don't build a dashboard — a markdown file with screenshots is sufficient for weekly tracking
- Don't score individual prompts on a 1-100 scale — mentioned/cited/absent is granular enough for action
- Don't test every possible query — 10-15 buyer-focused prompts cover 80% of visibility
- Don't try to reverse-engineer AI ranking algorithms — focus on what you can control (content, structure, distribution)
