---
name: content-repost-manager
repo: https://github.com/clawdbot/clawd
description: >
  Identify top-performing evergreen content for reposting across platforms.
  Brand-agnostic — reads analytics data and content taxonomy from any brand's
  evergreen system folder. Classifies posts as trending (skip) vs evergreen
  (repost eligible), applies platform-specific cooldowns, and outputs a
  repost queue. Triggers on "repost", "banger", "top performer", "content
  recycling", "repost queue", "evergreen content repost", or "which posts
  should I repost".
depends-on:
  - hook-generator
---

# Content Repost Manager

Brand-agnostic repost intelligence that reads from each brand's evergreen analytics system. Never duplicates existing platform-specific analytics — this is a **lens** on top of existing weekly reports and hook performance data.

## When to Use

- Agent or user asks "which posts should I repost"
- Weekly content review identifies bangers
- Cross-platform content recycling (X banger → LinkedIn adaptation)
- Building a repost queue from analytics data

## Core Principle: Trending vs Evergreen

**Trending posts are NEVER repost candidates.** They reference specific news, product launches, or time-bound events. Reposting stale news destroys credibility.

**Evergreen posts are repost candidates.** They address persistent pain points, share frameworks, or make contrarian observations that stay relevant.

### Classification Rules

| Tag | Category | Repost? |
|-----|----------|---------|
| `market_signal` | Trending (usually) | Only if content references a general pattern, not a specific news event |
| `market_news` | Trending | **Never repost** — news stales in hours |
| `tool_overload` | Evergreen | Repost eligible |
| `manual_loops` | Evergreen | Repost eligible |
| `founder_router` | Evergreen | Repost eligible |
| `unfinished_workflow` | Evergreen | Repost eligible |
| `proof_test` | Evergreen | Repost eligible |
| `context_bloat` | Evergreen | Repost eligible |
| `template_confusion` | Evergreen | Repost eligible |
| `expensive_mistake` | Evergreen | Repost eligible |
| `vertical_law` | Evergreen | Repost eligible |
| `vertical_real_estate` | Evergreen | Repost eligible |
| `agent_lifestyle` | Evergreen | Repost eligible |
| `contrarian` | Evergreen | Repost eligible |
| `first_person` | Context-dependent | Repost only if not referencing a specific dated event |
| `pain_pill` | Evergreen | Repost eligible |

When in doubt, read the post text. If it mentions a specific product name, date, or "this week/month" → trending. If it describes a universal pain or framework → evergreen.

## Brand-Agnostic Discovery

This skill works for ANY brand in the evergreen system. The agent must discover the brand's analytics structure by reading its evergreen.md first.

### Step 1: Identify the brand

Read the brand's evergreen.md from:
```
businesses/<brand-slug>/evergreen.md
```

Look for the **Connected Systems** or **File Locations** section to find:
- Analytics folder path
- Hook performance data path
- Content taxonomy definitions
- Weekly report paths

### Step 2: Read analytics data

Read the latest snapshot from the brand's analytics folder:
```
businesses/<brand-slug>/analytics/snapshots/latest-x-metrics.json
```

Or the latest weekly report:
```
businesses/<brand-slug>/analytics/reports/latest-weekly-report.md
```

If the brand has no analytics folder, check evergreen.md for alternative paths. Some brands store analytics under `content-systems/` or shared directories.

### Step 3: Read content taxonomy

Each brand defines its own pain angles and hook patterns. Read them from:
- The brand's `content-systems/` folder
- Or the `weekly-analytics-feedback-loop.md` if it exists for that brand
- Or the analytics script if it contains classification rules

If no taxonomy exists, extract it from the snapshot data itself (the `pain_angle` and `hook_pattern` fields in JSON snapshots).

## Repost Eligibility Criteria

A post qualifies for repost when ALL of the following are true:

1. **Performance**: Engagement ≥ 2x the brand's median weighted engagement
2. **Content type**: Classified as evergreen (see table above)
3. **Cooldown**: Not posted/reposted within the platform's cooldown window
4. **Not previously reposted**: Check repost history in the queue file

### Platform Cooldowns

| Platform | Cooldown | Rationale |
|----------|----------|-----------|
| X/Twitter | 30 days | Fast feed, audience overlap acceptable |
| LinkedIn | 60 days | Slower feed, different audience subset |
| Instagram | 45 days | Visual-first, needs fresh image |
| Medium | 90 days | Long-form, readers expect fresh takes |
| Threads/Bluesky | 30 days | Fast feed, similar to X |

### Engagement Thresholds

Use the brand's own data. Calculate median weighted engagement from the latest snapshot:

```
weighted_engagement = likes + (2 × replies) + (2 × reposts)
```

- **Tier 1 banger**: ≥ 3x median → prioritize for repost + cross-platform adaptation
- **Tier 2 solid**: ≥ 2x median → queue for repost on same platform
- **Tier 3 moderate**: ≥ 1.5x median → consider for cross-platform adaptation only

## Cross-Platform Adaptation

When a banger on one platform is adapted for another:

1. **Read the original post** — understand the hook, pain angle, proof, and CTA
2. **Adapt, never copy** — rephrase for the target platform's conventions:
   - X → LinkedIn: expand to 2-3 paragraphs, add professional framing
   - X → Instagram: condense to 1 punchy line + carousel slides
   - LinkedIn → X: extract the sharpest single insight
3. **Hook Regeneration** — For Tier 1 bangers, spawn hook-generator subagent for platform-optimized adaptation hooks:
   ```markdown
   Load the hook-generator skill and execute the full Phase 1-6 pipeline with this context:
   - WHO: [Target platform audience from brand evergreen.md]
   - WHAT/WHY: [Original post's core insight + pain angle]
   - Knife: [Original post's pain point]
   - Platform: [Target platform — LinkedIn/Instagram/Threads/etc.]
   - Brand: [Brand voice from evergreen.md]
   - Target Score: 80
   Return ONLY this JSON array: [{"hook":"...","score":<0-100>,"pattern":"...","formula":"..."}]
   ```
   Filter: Discard hooks that don't match target platform conventions (e.g., no thread hooks on LinkedIn, no hashtag-heavy hooks on Threads)
   Fallback: If subagent fails, use manual platform adaptation rules from step 2
4. **Preserve the winning formula** — keep the same pain angle and hook pattern that performed
5. **Update the CTA** — match the platform's link conventions
6. **Tag as `adapted_from: <original_url>`** in the repost queue

## Repost Queue File

Output location (brand-specific):
```
businesses/<brand-slug>/analytics/repost-queue.md
```

### Format

```md
# Repost Queue — <Brand Name>

> Last updated: YYYY-MM-DD
> Median engagement: X (from latest weekly report)

## Tier 1 — Bangers (≥ 3x median)
| Original URL | Platform | Pain | Pattern | Engagement | Repost Eligible On | Adapted For | Status |
|---|---|---|---|---:|---|---|---|
| https://x.com/... | X | tool_overload | contrarian | 22 | 2026-06-15 | LinkedIn | queued |

## Tier 2 — Solid (≥ 2x median)
| Original URL | Platform | Pain | Pattern | Engagement | Repost Eligible On | Adapted For | Status |
|---|---|---|---|---:|---|---|---|

## Tier 3 — Cross-Platform Candidates (≥ 1.5x median)
| Original URL | Platform | Pain | Pattern | Engagement | Adapt For | Status |
|---|---|---|---|---:|---|---|

## Repost History
| Date | Original URL | Platform | Action | Result |
|---|---|---|---|---|
```

### Status Values

- `queued` — waiting for cooldown to expire
- `ready` — cooldown passed, ready to post
- `adapted` — rewritten for different platform
- `posted` — live, track results
- `killed` — decided not to repost after all
- `skip` — content staled or became irrelevant

## Integration with Existing Systems

This skill is a **consumer** of analytics data, not a producer. It reads from:

| Data Source | Owner | What We Read |
|-------------|-------|-------------|
| Weekly analytics script | Hermes / analytics cron | JSON snapshots, weekly reports |
| Hook performance registry | Hook intelligence skill | Winning hook patterns |
| Content taxonomy | Brand evergreen.md | Pain angles, hook patterns, CTA types |
| Posting history | Platform posting queues | What was already posted/reposted |

It writes to:
| Output | What |
|--------|------|
| `analytics/repost-queue.md` | Repost candidates + history |
| Evergreen.md systems table | Entry pointing to this skill + queue file |

## Workflow

### Manual (on demand)

When user asks "what should I repost" or "which posts are bangers":

1. Read the brand's evergreen.md → find analytics paths
2. Read latest snapshot or report
3. Calculate median engagement
4. Filter for evergreen content types only
5. Apply cooldown check (compare post date vs today)
6. Output the repost queue

### Automated (cron extension)

Add a repost scan step to the existing weekly analytics cron:

```bash
# After the existing analytics script runs, scan for repost candidates
python3 scripts/content-repost-scan.py --business <brand-slug>
```

This script reads the snapshot output by the analytics script and appends to the repost queue.

## Anti-Patterns

| Mistake | Why Wrong | Fix |
|---------|-----------|-----|
| Reposting market news | Stale in hours, destroys credibility | Classify first, never repost trending |
| Same text on same platform | Audience remembers, looks lazy | Always adapt or add new framing |
| 30-day cooldown on news | Irrelevant — news is dead by then | No cooldown needed, just don't repost |
| Ignoring cross-platform opportunity | X banger may kill it on LinkedIn | Always check Tier 1 for adaptation |
| Duplicating analytics logic | Hermes already runs weekly analytics | Read data, don't regenerate |
| Brand-specific hardcoded paths | Breaks for other brands | Always discover from evergreen.md |
