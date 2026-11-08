---
name: article-generator
description: >
  Multi-format article generator router. Delegates to the right sub-skill based on
  available inputs: YouTube→NLM research, NLM mindmap hub & spoke, or keyword-driven SEO.
  All sub-skills read brand intelligence from evergreen brand-assets.
  Use when: generating articles, blog posts, hub & spoke content, NLM to article,
  YouTube research for articles, SEO article, content generation for any brand.
depends-on:
  - hook-generator
  - sharp-thesis-validator
---

# Article Generator

Routes to the right sub-skill based on what you have. Three paths, one brand intelligence source.

## Phase 0: Awareness Gate (MANDATORY)

Before any copy work, determine the target audience's awareness level:

1. **Can you determine awareness level from the prompt/context?**
   - For SEO: keyword intent maps to awareness level
     - Informational ("how to fix X") → Problem-aware
     - Comparative ("X vs Y") → Solution-aware
     - Branded ("your product") → Product-aware
     - Transactional ("buy X") → Most-aware
   - For social: content topic + audience → awareness level
   - For email: subscriber stage → awareness level

2. **If YES** → Proceed with awareness-matched strategy
   - Load `references/awareness-level-guide.md`
   - Select copy framework based on awareness level

3. **If NO** → ASK THE USER before proceeding:
   "What awareness level is your target audience at?"
   - Unaware — doesn't know they have a problem
   - Problem-aware — knows the problem, doesn't know solutions exist
   - Solution-aware — knows solutions exist, doesn't know your product
   - Product-aware — knows your product, not convinced it's right
   - Most-aware — ready to buy, just needs the offer

## Phase 1: Sharp-Thesis Validation (MANDATORY — Applied Before Writing)

Before proceeding to any mode, validate the topic/title using the Sharp-Thesis (Cerebras) Test:

```
sharp-thesis-validator --mode long-form --brand {brand} "{topic/title}"
```

**On PASS:** Proceed to Mode Router.
**On FAIL:** STOP and return reframing suggestions to Jairo. Do not proceed to research or writing.

### Validation Requirements:
- **Single arguable claim** (not "X is important" but "X does Y because Z")
- **Concrete number** (dollar figure, percentage, timeframe, count)
- **Urgency** (time-bound trigger, not evergreen)
- **Title expressibility** (≤80 chars for magazine-cover style)

### Brand Context Loading:
- Loads brand-assets from evergreen path: `businesses/nomadixgear-sa/{brand}/brand-assets/`
- Reads: `thesis-config.md`, `icp-profiles.md`, `business-profile.md`, `competitive-analysis.md`
- Enriches reframe suggestions with brand-specific numbers and positioning

### Mode Router

Three modes. Pick based on what you have:

### Mode A: Keyword → SEO Article
**When:** You only have a keyword or topic (no NLM notebook).
**Action:** Delegate to `seo-content` skill. Keyword→article with brand intelligence, no NLM needed.

### Mode B: NLM Mindmap → Hub & Spoke Articles
**When:** You have an existing NLM mindmap/notebook with nodes.
**Action:** Delegate to `nlm-hub-spoke` skill. Generates hub pages first, then spoke articles per hub. Each article gets a human version + AEO counterpart.

### Mode C: YouTube → NotebookLM → Hub & Spoke
**When:** You have a YouTube video or channel to research first, no existing NLM notebook.
**Action:** Delegate to `youtube-notebooklm-research` skill for research phase. After NLM notebook + mindmap is created, continue with Mode B (`nlm-hub-spoke`) for writing phase.

**Sub-skills and their jobs:**
- `seo-content` — Keyword → SEO article (Mode A, writing phase without NLM)
- `nlm-hub-spoke` — NLM mindmap → hub & spoke articles (Mode B, writing phase with NLM)
- `youtube-notebooklm-research` — YouTube → NLM notebook + mindmap (Mode C, research phase)

**When delegating, pass along:**
- Brand name
- Evergreen brand-assets path
- landscape.md path (if exists at `{brand-assets}/landscape.md`)
- first-party-data.md path (if exists at `{brand-assets}/first-party-data.md`)
- Topic/keyword
- Any enrichment files relevant to the topic

**Path contract:** The sub-skill (seo-content for Mode A) MUST use the passed landscape.md path directly (step 1 resolve → step 8 read), not re-resolve from its own convention. If no landscape.md path is passed, check at resolved brand dir.

### Brand Naming & Claims Rules (MANDATORY — Applied Before Writing)

Every article MUST comply with the brand's naming conventions and claims blacklist. Load these from the brand's `competitive-reference.md` (if it exists) or `landscape.md`:

**Product naming:**
- Use the brand's product names as they appear in `products.md` (e.g., "Gome Clan," not "portable shelter model")
- Match ICP search language in SEO titles/h2s (e.g., "luxury camping tent," "glamping tent")
- Never use banned terms (e.g., "dome" for NomadixGear — always "glamping tent")

**Claims blacklist (hard gate):**
- Load `landscape.md` or `competitive-reference.md` and read the claims blacklist section
- Any claim in the blacklist MUST NOT appear in the article
- This includes taglines (e.g., "World's Most Advanced Portable Shelter" is blacklisted for some brands)
- Only use claims from the "Verified Safe Claims" section

**Product data accuracy:**
- Read `products.md` for specifications — never make up or estimate dimensions/prices
- When specs are behind a login wall (e.g., "Login to see price"), use Zoho Books pricing data if available
- Material tiers (e.g., Semi-Permanent vs Permanent) must be accurately distinguished

**Cron scheduling:** When creating scheduled tasks (`kimaki send`) for article generation, use `--agent plan`. The plan agent handles research and outline phases better. After approval, switch to build agent for execution.

## Downstream Pipeline

After any sub-skill produces a draft article, chain into:
1. **seo-content (Phase N3)** — Generate hooks/titles (MANDATORY — never skip). seo-content now includes hook-generator subagent integration for SEO title scoring.
2. **blog-publish-pipeline** — WordPress publishing with human + AEO pairs

**Hook-generator integration:** The seo-content sub-skill handles hook generation internally. If running article-generator outside the seo-content pipeline, spawn a hook-generator subagent directly for article titles:
```
Load the hook-generator skill and execute the full Phase 1-6 pipeline with this context.
Context:
- WHO: <ICP from brand assets>
- WHAT/WHY: <article's core thesis>
- Knife: <primary misconception or pain>
- Platform: medium
- Brand: <brand name>
- Target Score: 85
Return ONLY this JSON array: [{"hook":"...","score":<0-100>,"pattern":"...","formula":"..."}]
```
If subagent fails, use keyword + benefit formula for titles.

**Flow:** sub-skill output → seo-content Phase N3 → blog-publish-pipeline

## Brand Intelligence

All sub-skills share the same brand intelligence source:

**Primary (evergreen):** `businesses/nomadixgear-sa/{brand}/brand-assets/`
**Fallback (newsletter):** `brands/{brand}/content/00-assets/`

**Core files (all sub-skills load these):**
| File | Purpose |
|------|---------|
| `voice-guide.md` | Brand voice, tone, writing style |
| `business-profile.md` | Business model, ICP, market position |
| `icp-profiles.md` | Ideal customer profiles, pain points |
| `products.md` | Full product catalog |
| `brand-overrides.md` | Material rules, banned terms, positioning constraints (if exists, fallback: claims blacklist in `landscape.md` or `competitive-reference.md`) |

**Funnel grounding (if `funnel_id` provided):**
Read `funnels/{funnel_id}-*.md` from the brand's `funnels/` directory before writing.
Every output article MUST include: `funnel_id`, `buyer_stage`, `cta`, `icp_segment`.
If the article's CTA doesn't match the funnel's conversion step, STOP and fix it.
When no funnel_id is provided, proceed without funnel constraints.

**Selective enrichment (topic-matched, 2-3KB each):**
| If topic matches | Load this file |
|------------------|----------------|
| pricing, cost, budget | `official-pricing.md` |
| vs, compare, alternative, competitor | `competitive-analysis.md` |
| specs, dimensions, materials | `technical-specifications.md` |
| materials, fabric, durability | `knowledge-base.txt` |

NEVER load entire enrichment files. Extract only the relevant section.

---

## STEP N: Copywriting Tournament (RECOMMENDED for headlines + CTAs)

Generate 3-5 variants of the key headlines + CTAs, then run them through 5 parallel judge personas to find the winner:

1. Generate 3-5 variants (different angles, formulas, or approaches)
2. Save each to: `content/tournaments/{slug}/variant-1.md` through `variant-N.md`
3. Spawn 5 PARALLEL `build` subagents (one per judge persona):
   - `~/.claude/skills/quality-gate/judge-personas/skeptic.md`
   - `~/.claude/skills/quality-gate/judge-personas/scanner.md`
   - `~/.claude/skills/quality-gate/judge-personas/buyer.md`
   - `~/.claude/skills/quality-gate/judge-personas/expert.md`
   - `~/.claude/skills/quality-gate/judge-personas/outsider.md`
   - Each gets: tournament_dir, variant_count, mode=`copy`, original_prompt
4. Collect all 5 JSON results, aggregate: sum weighted_avg per variant across judges
5. Pick winner, apply recommended_edits, save as draft
6. Winner enters standard quality-gate below

**When to use:** For the article headline and CTA sections

---

## FINAL STEP: Quality Gate (MANDATORY — DO NOT SKIP)

Before presenting ANY draft to Jairo, run the quality gate:

1. Save your complete draft to a file (e.g., `content/drafts/{slug}.md` or a temp file)
2. Spawn a `build` subagent using the Task tool with the quality-gate prompt from `Skill: quality-gate`
3. Pass these inputs to the subagent:
   - **draft_path**: absolute path to the saved draft
   - **mode**: `blog`
   - **original_prompt**: the writing prompt that started this task
   - **attempt**: current attempt number (start at 1)
4. Parse the JSON result from the subagent
5. If FAIL and attempt < 3:
   - Rewrite the draft addressing the specific `rewrite_instructions` from the quality gate
   - Save the new draft (overwrite or new file)
   - Spawn another subagent with attempt + 1
6. If FAIL and attempt = 3:
   - Present to Jairo with all score reports attached
   - Say: "Couldn't pass quality gate after 3 attempts. Here's what's wrong and what I tried to fix."
7. If PASS:
   - Present to Jairo as normal (do NOT show scores — they're internal)
8. NEVER present a draft that hasn't passed quality gate (except after 3 failed attempts)
