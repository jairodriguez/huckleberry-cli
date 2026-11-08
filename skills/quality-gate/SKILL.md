---
name: quality-gate
description: "ICP-relative content quality gate. Two modes: 1."
version: 2.0.0
license: Internal use only
---

# Quality Gate — ICP-Relative Content Scoring

This skill is called by writing skills AFTER they finish a draft. It spawns a fresh subagent to review the content with clean context — no writer bias, no accumulated context pollution.

**v2.0 adds tournament mode**: generate multiple copy variants, run them through 5 distinct judge personas, pick the winner, then pass the winner through the standard quality gate.

## Architecture

### Awareness Gate Integration

Quality-gate checks that the content matches the target audience's awareness level. The writing skill MUST pass the awareness level as part of the submission context. If awareness level is not provided, flag it as a quality gap.

### Standard Mode

```
[Writing Skill] finishes draft
    → saves draft to file
    → spawns subagent with quality-gate prompt
    → subagent reads evergreen + brand + draft from scratch
    → subagent scores, returns JSON result
    → writing skill receives score
    → PASS: present to Jairo
    → FAIL: rewrite + re-run (max 3)
```

### Tournament Mode

```
[Writing Skill] generates 3-5 variants
    → saves all variants to tournament directory
    → spawns tournament subagent with tournament prompt
    → subagent reads evergreen + brand + ALL variants from scratch
    → subagent runs 5 judge personas against all variants
    → returns ranked results + winner
    → winner enters standard quality-gate flow
    → PASS: present to Jairo
    → FAIL: rewrite winner + re-run quality-gate (max 3)
```

## How to Call This Skill

Writing skills call this by spawning a `build` subagent with the appropriate prompt template below.

### Standard Mode

Required inputs:
- **draft_path**: absolute path to the saved draft file
- **mode**: one of `blog`, `social`, `x`, `copy`, `cold-email`, `hook`, `newsletter`
- **original_prompt**: the writing prompt that started the task (used to detect funnel stage)
- **attempt**: current attempt number (1, 1, 2, or 3)
- **brand_context**: JSON object with ICP, pains, positioning angles, offer, voice (MANDATORY for x/social)

### Tournament Mode (DEFAULT for X/social)

Required inputs:
- **tournament_dir**: absolute path to directory containing variant files (named `variant-1.md`, `variant-2.md`, etc.)
- **variant_count**: number of variants (3-5)
- **mode**: one of `copy`, `hook`, `cold-email`, `social` (tournament works best for short-form)
- **original_prompt**: the writing prompt that started the task
- **attempt**: current attempt number (1, 2, or 3)
- **brand_context**: JSON object with ICP, pains, positioning angles, offer, voice (MANDATORY)

## Subagent Spawn Template

Use the `Task` tool to spawn a `build` subagent with this exact prompt:

```
You are a quality gate reviewer. Your job is to evaluate whether a piece of written content
would resonate with the target buyer at the correct funnel stage.

## Your Task

1. READ THE BRAND CONTEXT BELOW — this is your world. Do not search for files. This IS the truth.
   
   BRAND CONTEXT:
   {brand_context_json}

2. Read the draft file at: {draft_path}

3. Read the original writing prompt below and determine the funnel stage:
   - TOFU (awareness): topic intros, "what is X", problem awareness, trend content
   - MOFU (consideration): comparisons, "why X over Y", deep dives, how-to guides
   - BOFU (decision): pricing, demos, case studies, "ready to buy" content

4. Roleplay as the ICP at that funnel stage and score the draft

## Original Writing Prompt
{original_prompt}

## Content Mode
{mode}

## Attempt Number
{attempt}

## Scoring Protocol

You ARE the target buyer. Score the **entire piece as one unit**. One score per dimension. Do NOT score individual posts/tweets separately and average them. Read the whole thing, form one impression, score that impression. Score HARSHLY. A 7 means mediocre. Most content should score 4-6. Only genuinely exceptional content scores 8+.

### Dimensions

**Stop-scroll** — "Would I pause my feed/inbox for this?"
- 10 = I screenshotted this to send to someone. Physically stopped mid-scroll.
- 8 = genuinely interesting, I read the whole thing
- 6 = mildly interesting but I've seen this take before
- 4 = glanced and kept scrolling
- 2 = actively annoying
- AUTO-FAIL (score 3): if the hook uses a statistic I've already seen 10 times ("97% of businesses waste...")

**Relevance** — "Is this talking to MY specific problem at MY stage?"
- 10 = this person read my mind, they know exactly what I'm dealing with
- 8 = clearly understands my world, specific details hit
- 6 = mostly relevant but some generic moments
- 4 = vaguely related but not my priority
- 2 = not for me

**Trust** — "Does this person understand my world?"
- 10 = they've clearly been in my shoes, the details prove it
- 8 = strong specificity, I believe they know what they're talking about
- 6 = seems knowledgeable but some generic claims
- 4 = sounds like they read a whitepaper about my industry
- 2 = obviously written by someone who's never done this

**Next step** — "Does this move me forward or waste my time?"
- 10 = I know exactly what to do next and I want to do it now
- 8 = clear, specific, actionable takeaway
- 6 = useful but vague — "pick one process" without naming which one or how
- 4 = interesting but no clear action
- 2 = read it, learned nothing, time wasted
- AUTO-FAIL (score 3): vague CTA like "start today for free" or "you can act on it"

**AI Slop** — "Does this sound like a robot wrote it?"
- 10 = sounds like a real person talking to me, zero AI tells
- 8 = human, maybe one slightly off phrase
- 6 = a few AI tells but mostly readable
- 4 = noticeable AI patterns
- 2 = clearly AI-generated
- AUTO-FAIL (score 3) for ANY of these AI tells:
  - Manufactured aphorisms: "A seat license is a purchase. A workflow is an asset."
  - Manufactured labels: "Anti-consulting playbook"
  - Fake wisdom: "One process. That's the whole story."
  - Corporate wit: "OpenAI spent $150M to reach that conclusion"
  - Generic closes: "You can start today for free"
  - Padded threads: a single-tweet insight stretched to 6 tweets
  - Every tweet the same length/rhythm (AI uniformity)

### Weights by Funnel Stage

| Dimension   | TOFU | MOFU | BOFU |
|------------|------|------|------|
| Stop-scroll |  3x  |  2x  |  1x  |
| Relevance   |  2x  |  3x  |  3x  |
| Trust       |  1x  |  2x  |  3x  |
| Next step   |  2x  |  3x  |  3x  |
| AI Slop     |  2x  |  2x  |  2x  |

### POSITIONING VALIDATION (MANDATORY for X/social)

The draft MUST align with at least ONE positioning angle from brand context. Check:
- Angle 1: Intelligence Multiplier (AI amplifies, doesn't replace)
- Angle 2: Order of Operations (stop buying tools, start deploying systems)
- Angle 3: Automate the Tedious to Inhabit the Miraculous (mission)
- Angle 4: Pain Pill Positioning (what does this save them from NOW?)
- Angle 5: Hacker-Farmer Identity (generalist who refuses to be a slave)

If NO alignment → Relevance score = 1 (auto-fail).

### Pass/Fail Rules

- **PASS**: weighted average >= 8.0 AND no single dimension below 6.0 AND ai-slop >= 7 AND no auto-fail triggered
- **FAIL**: anything else

### Hard Fail Rules (score 1 on the triggering dimension)

These override all other scores. Any single one = automatic FAIL regardless of weighted average:

1. **Thread bloat**: the content is a single tweet stretched to 3+ tweets with padding, tangents, or delayed payoff. If removing any tweet doesn't lose value, FAIL. Score stop-scroll = 1.
2. **Fake data**: the content cites a statistic or case study that is vague, unverifiable, or feels fabricated. Score trust = 1.
3. **Link in body**: any link in the thread body (not reply). Score next-step = 1.
4. **Brand voice kill**: the content uses a banned word, banned pattern, or violates a hard brand rule. Score ai-slop = 1.
5. **Thread structure failure**: tweets don't build on each other. The reader can read them in any order and it makes the same amount of sense. Score relevance = 1.
6. **Hook bait-and-switch**: the hook promises something the thread never delivers. Score trust = 1.
7. **Google spam-policy tripwire (blog/newsletter modes)**: the content reads as made-for-search-engines per `./guidelines.md` — summarizing other sources without added value, unanswerable promises (fake "confirmed" dates), keyword-stuffed link anchors, fake freshness dates, or a page that would look like one of a near-identical batch. Score trust = 1.

### Output Format

Print ONLY valid JSON, nothing else:

```json
{
  "passed": true/false,
  "attempt": {attempt_number},
  "funnel_stage": "TOFU|MOFU|BOFU",
  "icp_profile": "Brief description of who you roleplayed as",
  "positioning_aligned": true/false,
  "aligned_angles": ["Angle 2"],
  "scores": {
    "stop-scroll": 0-10,
    "relevance": 0-10,
    "trust": 0-10,
    "next-step": 0-10,
    "ai-slop": 0-10
  },
  "weighted_average": 0.0,
  "rewrite_instructions": "If failed: specific, actionable feedback. Name the exact lines/phrases that failed and what to replace them with. If passed: empty string."
}
```

### Rewrite Instructions Quality Standard

Bad rewrite instructions: "Make the hook more engaging."
Good rewrite instructions: "Stop-scroll scored 4: the hook 'Are you looking for glamping solutions?' is a generic question. Replace with a scene: '$8.75M MXN from 34 canvas tents — that's what LJS Chichikan reported after year one.' AI slop scored 3: two em dashes on line 4 and line 12, 'testament to' on line 7, rule-of-three pattern in paragraph 3. Strip all."

Be specific. Quote the failing text. Suggest concrete replacements.

## Important
- You MUST read the actual draft file. Do not guess its contents.
- You MUST use the brand context provided. Do not invent an ICP.
- Score harshly. A 7 means genuinely good, not "acceptable."
- If the draft is obviously AI-generated, AI slop score should be 3 or below regardless of other dimensions.
```

## Tournament Subagent Architecture

Tournament mode is now the **DEFAULT for X threads** (mode: `x` or `social`). It spawns **5 parallel subagents**, one per judge persona. Each subagent loads its persona from a file, reads the brand context (passed directly — no file walking), reads ALL variants, and scores independently. A final collector step aggregates results and ranks.

### Why Parallel Subagents (Mandatory for X)

- **True isolation**: Each judge has clean context — no cross-contamination between personas.
- **No simulation**: A single subagent "pretending" to be 5 people produces correlated scores. Real judges disagree.
- **Scalable**: Adding a 6th judge = adding a persona file + one more subagent. No prompt changes.

### Persona Files

Each judge persona is defined in a standalone file at:
```
~/.claude/skills/quality-gate/judge-personas/{name}.md
```

Available personas:
| Persona | File | Focus |
|---------|------|-------|
| The Skeptic | `skeptic.md` | Trust + AI Slop |
| The Scanner | `scanner.md` | Stop-scroll |
| The Buyer | `buyer.md` | Relevance + Next step |
| The Expert | `expert.md` | Trust + AI Slop |
| The Outsider | `outsider.md` | Relevance + Next step |

### Tournament Flow (DEFAULT for X/social)

```
1. Writing skill generates draft → saves to file
2. Quality gate ORCHESTRATOR reads evergreen.md + brand assets → extracts brand context
3. Orchestrator spawns 5 PARALLEL subagents (one per persona):
   - Each receives: persona file + brand context (ICP, pains, positioning, offer, voice) + draft + original prompt
   - Each scores independently using funnel-stage weights
   - Each returns JSON with scores + notes
4. Orchestrator collects all 5 results
5. Calculates total score per dimension (sum across all judges)
6. Ranks, applies winner edits, then runs STANDARD quality-gate on winner
7. PASS → present to Jairo | FAIL → rewrite (max 3 loops)
```

### Judge Subagent Spawn Template (Updated)

Use the `Task` tool to spawn **5 parallel** `build` subagents with this prompt. Each gets a different persona file:

```
You are a tournament judge. Your personality, biases, and scoring calibration are defined in your persona file.

## Your Task

1. Read your persona file at: {persona_file_path}
   This file defines WHO you are, what you care about, and how you score. Internalize it fully.

2. READ THE BRAND CONTEXT BELOW — this is your world. Do not search for files. This IS the truth.
   
   BRAND CONTEXT:
   {brand_context_json}

3. Read the draft file at: {draft_path}

4. Read the original writing prompt and determine the funnel stage:
   - TOFU (awareness): topic intros, "what is X", problem awareness, trend content
   - MOFU (consideration): comparisons, "why X over Y", deep dives, how-to guides
   - BOFU (decision): pricing, demos, case studies, "ready to buy" content

5. Score the draft as YOUR persona would, using the 5 standard dimensions.

6. Use the funnel-stage weights from the standard scoring protocol.

7. Return your scores as JSON.

## Original Writing Prompt
{original_prompt}

## Content Mode
{mode}

## Scoring Dimensions

Score each dimension 0-10 for the ENTIRE piece as one unit. Do NOT score individual posts/tweets and average. Read the whole thing, score your impression of the complete piece. Use the calibration from your persona file:

- **Stop-scroll** — "Would I pause my feed/inbox for this?"
- **Relevance** — "Is this talking to MY specific problem at MY stage?"
- **Trust** — "Does this person understand my world?"
- **Next step** — "Does this move me forward or waste my time?"
- **AI Slop** — "Does this sound like a robot wrote it?"

## Funnel-Stage Weights

| Dimension   | TOFU | MOFU | BOFU |
|------------|------|------|------|
| Stop-scroll |  3x  |  2x  |  1x  |
| Relevance   |  2x  |  3x  |  3x  |
| Trust       |  1x  |  2x  |  3x  |
| Next step   |  2x  |  3x  |  3x  |
| AI Slop     |  2x  |  2x  |  2x  |

## POSITIONING VALIDATION (MANDATORY for X/social)

The draft MUST align with at least ONE positioning angle from brand context. Check:
- Angle 1: Intelligence Multiplier (AI amplifies, doesn't replace)
- Angle 2: Order of Operations (stop buying tools, start deploying systems)
- Angle 3: Automate the Tedious to Inhabit the Miraculous (mission)
- Angle 4: Pain Pill Positioning (what does this save them from NOW?)
- Angle 5: Hacker-Farmer Identity (generalist who refuses to be a slave)

If NO alignment → Relevance score = 1 (auto-fail).

## Output Format

Print ONLY valid JSON, nothing else:

```json
{
  "judge": "{persona_name}",
  "funnel_stage": "TOFU|MOFU|BOFU",
  "positioning_aligned": true/false,
  "aligned_angles": ["Angle 2"],
  "scores": {
    "stop-scroll": 0-10,
    "relevance": 0-10,
    "trust": 0-10,
    "next-step": 0-10,
    "ai-slop": 0-10
  },
  "weighted_avg": 0.0,
  "notes": "Brief note from your persona's perspective",
  "specific_fails": ["Exact quote of failing line", "What to replace with"]
}
```

## Aggregation Step (Orchestrator Does This)

After all 5 judge subagents complete, the orchestrator:

```
For each dimension:
  total_score = sum(judge.scores[dimension] for judge in all_judges)
  
total_weighted_avg = sum(judge.weighted_avg for judge in all_judges) / 5

PASS if: total_weighted_avg >= 7.5 AND no dimension average < 5.5
```

### Aggregation Output Format

The orchestrator produces this JSON:

```json
{
  "mode": "tournament",
  "funnel_stage": "TOFU|MOFU|BOFU",
  "icp_profile": "Brief description from brand context",
  "positioning_angles": ["Angle 1", "Angle 2"],
  "dimension_averages": {
    "stop-scroll": 7.2,
    "relevance": 8.0,
    "trust": 7.6,
    "next-step": 7.4,
    "ai-slop": 7.8
  },
  "weighted_average": 7.6,
  "passed": true,
  "judge_disagreements": "Where judges disagreed most and why",
  "winner_strengths": "What the winner does better across judges",
  "winner_weaknesses": "What the winner could improve before standard quality-gate",
  "recommended_edits": "Specific edits to apply"
}
```

## Writing Skill Integration Pattern

### Standard Mode

Writing skills should add this as their FINAL STEP:

```markdown
## FINAL STEP: Quality Gate (MANDATORY)

1. Save your complete draft to a file (e.g., `content/drafts/{slug}.md`)
2. Spawn a `build` subagent using the Task tool with the quality-gate prompt template
3. Pass: draft_path, mode, original_prompt, attempt number
4. Parse the JSON result from the subagent
5. If FAIL and attempt < 3:
   - Rewrite the draft addressing the specific rewrite_instructions
   - Save the new draft
   - Spawn another subagent (attempt + 1)
6. If FAIL and attempt = 3:
   - Present to Jairo with all score reports attached
   - Say: "Couldn't pass quality gate after 3 attempts. Here's what's wrong."
7. If PASS:
   - Present to Jairo as normal
8. NEVER present a draft that hasn't passed quality gate (except after 3 failed attempts)
```

### Tournament Mode

Writing skills that support tournament mode add this BEFORE the standard quality-gate:

```markdown
## STEP N: Copywriting Tournament (OPTIONAL — when generating multiple variants)

1. Generate 3-5 variants of the content (different hooks, CTAs, angles, or approaches)
2. Save each variant to a tournament directory:
   - `content/tournaments/{topic}/variant-1.md`
   - `content/tournaments/{topic}/variant-2.md`
   - ... up to variant-{N}.md
3. Spawn 5 PARALLEL `build` subagents using the Task tool (one per judge persona):
   - Subagent 1: persona_file = judge-personas/skeptic.md
   - Subagent 2: persona_file = judge-personas/scanner.md
   - Subagent 3: persona_file = judge-personas/buyer.md
   - Subagent 4: persona_file = judge-personas/expert.md
   - Subagent 5: persona_file = judge-personas/outsider.md
   - Each gets: tournament_dir, variant_count, mode, original_prompt
4. Collect all 5 JSON results
5. Aggregate: sum weighted_avg across judges per variant → rank → pick winner
6. Apply the recommended_edits from the aggregation to the winner
7. Save the edited winner as the draft file
8. Proceed to standard quality-gate with the winner as the draft

## FINAL STEP: Quality Gate (MANDATORY — runs on tournament winner)
[Same as standard mode above]
```

### When to Use Tournament Mode

Tournament mode is most valuable for:
- **Landing page copy** — hero sections, CTAs, headlines
- **Outreach emails** — subject lines + opening lines
- **Social hooks** — first lines of tweets, LinkedIn posts
- **Ad copy** — headline + body variants
- **Product descriptions** — e-commerce copy

Tournament mode is NOT useful for:
- **Long-form blog posts** — too expensive to generate 5 full articles
- **Technical documentation** — no creative variance needed
- **Reports/analyses** — accuracy matters more than persuasion

## Mode-Specific Notes

### blog mode
- Reads full article. Scores all dimensions equally weighted toward depth.
- Trust scores higher if specific data/numbers cited.
- Google compliance: check against `./guidelines.md` (people-first criteria + spam tripwires, derived from Google's official Search Central docs). Original information/research, clear sourcing, and first-hand evidence raise Trust. Any spam-policy tripwire (Hard Fail Rule 7) is an auto-fail.

### social / x mode
- Read the ENTIRE thread/article as ONE piece. Score the complete piece holistically.
- If format is a thread: score the thread as a single unit. Does the whole thread work? Does it build? Is the payoff delivered? Are there wasted tweets?
- Stop-scroll: score the opening tweet AND whether the thread earns the read-through.
- Relevance: does the entire thread speak to the ICP's problem?
- Trust: does the full piece prove the author knows the world?
- Next-step: does the reader finish the thread knowing what to do?
- AI-slop: any AI tell anywhere in the thread = penalty. Uniform rhythm across tweets = penalty. Manufactured aphorisms anywhere = penalty.
- Format check (MANDATORY): Is this the right format? If the core insight fits in one tweet but the content is a 3+ tweet thread, FAIL. Score stop-scroll = 1.
- NO averaging individual tweets. One score per dimension for the whole piece.

### copy mode
- Relevance and next-step weighted heaviest — copy must convert.
- Trust scored on specificity of claims (no "industry-leading" nonsense).

### cold-email mode
- Stop-scroll is the subject line. If subject doesn't land, nothing else matters.
- Relevance scored on personalization depth (did they research the lead?).

### hook mode
- ONLY scores stop-scroll and ai-slop. Other dimensions irrelevant.
- A hook has one job: make you stop. Score accordingly.

### newsletter mode
- Trust and next-step weighted heaviest — newsletter readers are already warm.
- AI slop check is strictest — subscribers notice voice inconsistency immediately.

### tournament mode
- Works with any content type but best for `copy`, `hook`, `cold-email`, `social` modes.
- **5 parallel subagents** — one per judge persona, each loading its persona from `judge-personas/{name}.md`.
- To add a new judge: create a persona file in `judge-personas/`, add one more parallel subagent spawn. No prompt changes needed.
- Tournament judges use the same funnel-stage weights as standard mode.
- After tournament completes, the winner MUST still pass standard quality-gate. Tournament selects the best variant — standard gate validates it's actually good enough.
- If the tournament winner fails standard quality-gate, apply the rewrite instructions and re-run standard gate only (do not re-run the full tournament).
- 5 parallel subagents = ~2-3 minutes wall clock (they run concurrently). Sequential would be ~10 minutes.
- Judges SHOULD disagree. If all 5 rank variants identically, the personas may need more differentiation in their files.
- Each judge's persona file contains: identity, psychological profile, biases, scoring focus, scoring calibration rubric, example accept/reject reactions. The subagent reads this file first — it defines who they ARE.

## Anti-Patterns

- Do NOT call quality-gate before running humanizer. Humanizer runs first, then quality-gate scores the cleaned draft.
- Do NOT skip quality-gate because "it sounds good." That's exactly the bias this skill prevents.
- Do NOT modify the scoring thresholds. Current thresholds are calibrated to Jairo's bar: "so good Jai wants to read and share it."
- Do NOT present scores to Jairo as a marketing tool ("look, it scored 8.2!"). Scores are internal. Jairo sees the draft, not the scorecard.
- Do NOT pass content that would make Jairo embarrassed to put his name on it. If the draft uses generic stats, manufactured wisdom, padded threads, vague CTAs, or sounds like AI wrote it — FAIL, even if the weighted average looks close.
