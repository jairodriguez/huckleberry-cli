---
name: social-worker
description: Humanize and format social media content from NLM research for X, LinkedIn, Instagram. Follows guardrail framework.
depends-on:
  - hook-generator
license: Internal use only
---

# GUARDRAILS FRAMEWORK

This skill follows the mandatory guardrail protocol. See: .claude/skills/guardrail-framework/SKILL.md

## Pre-Execution Protocol
1. Read ENTIRE skill before executing ANY step
2. Copy-paste exact prompts — never paraphrase
3. Update pipeline-registry.json before each action
4. If uncertain, ask human before proceeding
5. **Funnel grounding** (if `funnel_id` provided): Read `funnels/{funnel_id}-*.md` from the brand's `funnels/` directory. Every post MUST include `funnel_id`, `buyer_stage`, `cta`, `icp_segment`. Use the funnel's CTA — not a generic one.
6. **Awareness Gate** — determine target audience awareness level before any copy work (see below).

## ✅ ALLOWED
- Run humanizer skill on NLM social drafts
- Format for X (single, thread, article)
- Format for LinkedIn (post, article, carousel)
- Format for Instagram (caption, hashtags)
- Extract visual prompts from NLM outputs
- Present drafts to human for review
- Update registry

## ❌ FORBIDDEN
- Generate original social content
- Post without human approval
- Skip humanization step
- Make platform decisions without human
- Skip checkpoint gates

---

## Pipeline Registry Update (START)

Update `businesses/{business}/content/pipeline-registry.json`:
```json
{
  "runId": "from-orchestrator",
  "currentSkill": "social-worker",
  "currentStep": 1,
  "stepName": "find_social_drafts",
  "status": "in_progress"
}
```

---

## Step 1: Find NLM Social Drafts

Location: `businesses/{business}/evergreen.mdcompetitor-intel/{date}-{topic-slug}/`

Files to find:
- `x-posts.md` - X post drafts
- `linkedin-article.md` - LinkedIn article draft
- `linkedin-infographic.md` - Infographic prompts
- `slide-deck-short.md` - Slide content for visual worker

---

## Step 2: Humanize X Content

Run: `Skill: humanizer`

Input: NLM x-posts.md
Output: Cleaned X posts in `businesses/{business}/content/social/x-posts-humanized.md`

**Platform requirements**:
- Single post: 280 chars max
- Thread: 15-25 posts, each under 280 chars
- Article: Full article with hook

---

## CHECKPOINT: X Content Review

> "X content humanized. Ready as [single/thread/article]. Waiting for your go-ahead."

[WAIT for go-ahead before proceeding to LinkedIn]

---

## Step 3: Humanize LinkedIn Content

Run: `Skill: humanizer` (or use X content if approved)

Input: NLM linkedin-article.md
Output: Cleaned LinkedIn content in `businesses/{business}/content/social/linkedin-article-humanized.md`

**Platform requirements**:
- Post: 3000 chars max, first 200 chars critical
- Article: Full article with 3-5 section headers
- Carousel: 10 slides, hook in first

---

## CHECKPOINT: LinkedIn Content Review

> "LinkedIn content humanized. Ready as [post/article/carousel]. Waiting for your go-ahead."

[WAIT for go-ahead before proceeding to Instagram]

---

## Step 4: Format Instagram Content

From NLM outputs or LinkedIn content, create:
- Caption: Hook (first 125 chars) + body + hashtags

**Hook-generator integration:** Spawn a hook-generator subagent for Instagram caption opening hooks:
```
Load the hook-generator skill and execute the full Phase 1-6 pipeline with this context.
Context:
- WHO: <audience from brand>
- WHAT/WHY: <post's core value or insight>
- Knife: <pain this content addresses>
- Platform: instagram
- Brand: <brand name>
- Target Score: 85
Return ONLY this JSON array: [{"hook":"...","score":<0-100>,"pattern":"...","formula":"..."}]
```
Use top-scored hook as first 125 chars. If subagent fails, write hook manually per NLM output.
- Hashtags: 3-5 relevant, niche-specific

Save to: `businesses/{business}/content/social/instagram-caption.md`

---

## Step 5: Extract Visual Prompts

From NLM outputs, extract prompts for:
- X images (if needed)
- LinkedIn infographic
- Instagram visuals

Save to: `businesses/{business}/content/social/visual-prompts.md`

---

## Pipeline Registry Update (COMPLETE)

```json
{
  "status": "completed",
  "completedAt": "2026-04-05T12:45:00Z",
  "outputFiles": [
    "04-ready/social/x-posts-humanized.md",
    "04-ready/social/linkedin-article-humanized.md",
    "04-ready/social/instagram-caption.md",
    "04-ready/social/visual-prompts.md"
  ]
}
```

---

## STEP N: Copywriting Tournament (RECOMMENDED for post hooks)

Generate 3-5 variants of the key post hooks, then run them through 5 parallel judge personas to find the winner:

1. Generate 3-5 variants (different angles, formulas, or approaches)
2. Save each to: `content/tournaments/{slug}/variant-1.md` through `variant-N.md`
3. Spawn 5 PARALLEL `build` subagents (one per judge persona):
   - `~/.claude/skills/quality-gate/judge-personas/skeptic.md`
   - `~/.claude/skills/quality-gate/judge-personas/scanner.md`
   - `~/.claude/skills/quality-gate/judge-personas/buyer.md`
   - `~/.claude/skills/quality-gate/judge-personas/expert.md`
   - `~/.claude/skills/quality-gate/judge-personas/outsider.md`
   - Each gets: tournament_dir, variant_count, mode=`social`, original_prompt
4. Collect all 5 JSON results, aggregate: sum weighted_avg per variant across judges
5. Pick winner, apply recommended_edits, save as draft
6. Winner enters standard quality-gate below

**When to use:** For the opening line of social content

---

## FINAL STEP: Quality Gate (MANDATORY — DO NOT SKIP)

Before presenting ANY draft to Jairo, run the quality gate:

1. Save your complete draft to a file (e.g., `content/drafts/{slug}.md` or a temp file)
2. Spawn a `build` subagent using the Task tool with the quality-gate prompt from `Skill: quality-gate`
3. Pass these inputs to the subagent:
   - **draft_path**: absolute path to the saved draft
   - **mode**: `social`
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
