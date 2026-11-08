---
name: skill-self-improvement
description: "Weekly self-improvement pipeline for skills. Reads outcome journals, corrections, and content analytics to generate targeted skill mutations."
---

# Skill Self-Improvement — Weekly Pipeline

Closes the loop between content performance data → skill file improvements.

## Architecture

```
Monday 10:00 UTC cron fires
  → Phase 1: Gather — read outcomes, corrections, analytics, skill queue
  → Phase 2: Score — run eval scoring (weekly-review.mjs)
  → Phase 3: Analyze — match correction patterns to skill files
  → Phase 4: Mutate — generate specific skill improvements, queue for approval
  → Phase 5: Log — record outcomes of the improvement run
```

## When Triggered

Either by cron (Mondays 10:00 UTC) or manual invocation:
```bash
node scripts/self-improve/weekly-review/weekly-review.mjs run
```

## Phase 1: Gather

Read these data sources:

```bash
# 1. Outcome journal + eval scores
node scripts/self-improve/outcome-journal/log-outcome.mjs summary
node scripts/self-improve/outcome-journal/log-outcome.mjs json

# 2. Active corrections
cat memory/corrections.md

# 3. Skill queue (unprocessed items)
cat memory/skill-queue.md

# 4. Content analytics (if available per business)
# aiwithjai:
ls businesses/aiwithjai/analytics/reports/ 2>/dev/null
# nomadixgear:
ls businesses/nomadixgear-sa/analytics/reports/ 2>/dev/null
```

## Phase 2: Score

Run the weekly review eval scoring:

```bash
node scripts/self-improve/weekly-review/weekly-review.mjs score
```

This returns a JSON score with pass/fail per eval. Any eval that failed gets flagged for mutation in Phase 4.

## Phase 3: Analyze — Match Corrections to Skills

For each correction in the active queue and each "corrected" outcome from the past week:

1. **Extract the core failure pattern** — what specific behavior caused the correction?
2. **Fuzzy-match against skill index** — which skill(s) should have prevented this?
3. **If match found** — record "this skill needs an anti-pattern entry"
4. **If no match** — record "new skill may be needed" with `status: pending-approval`

Correction-to-skill mapping heuristics:

| Correction Pattern | Likely Skill |
|---|---|
| Forgot to use tool/skill X | Any skill named X; add trigger phrase |
| Wrong format for platform | `humanizer` or `platform-formatting` |
| Content too generic/boring | `hook-generator`, `direct-response-copy` |
| Forgot lint/typecheck | `self-improve` (add to pre-task check) |
| Voice doesn't sound human | `humanizer`, `brand-voice` |
| Wrong dependency assumed | `concierge-post-call` or `remotion-best-practices` |
| Not checking existing files | `document-review` |
| Wrong SEO/article format | `seo-content`, `blog-worker` |

## Phase 4: Mutate — Generate Skill Improvements

For each skill identified in Phase 3:

1. **Read the SKILL.md** for the affected skill
2. **Determine improvement type:**
   - **ADD_ANTI_PATTERN** — Add a row to the Anti-Patterns table documenting what went wrong
   - **ADD_TRIGGER** — Add trigger words to the description frontmatter
   - **ADD_STEP** — Add a verification step to the workflow
   - **REORDER** — Change the sequence of steps to prevent skip
   - **REWRITE_PROMPT** — Update a prompt template based on what actually works
3. **Write the improvement** — Write it to `memory/skill-queue.md` with status `pending-approval`
   ```
   ## Improvement — <skill-name> — <timestamp>
   - **status:** pending-approval
   - **type:** ADD_ANTI_PATTERN
   - **file:** .claude/skills/<skill-name>/SKILL.md
   - **change:** Add anti-pattern: "Agent forgot to use this skill when pattern X appeared"
   - **evidence:** Correction from <date>: <correction text>
   ```
4. **DO NOT auto-edit** — skill files are read-only without human approval

## Phase 5: Log Outcomes

After the pipeline completes, log the result:

```bash
node scripts/self-improve/outcome-journal/log-outcome.mjs log \
  "skill-self-improvement weekly run" \
  success \
  "" \
  kestrel
```

If the pipeline failed (scripts errored, no data, etc.), log as `corrected` or `failed` with the specific issue.

## Phase 6: Auto-Skill Queue Revival

**This is the most important phase if the queue is stale.**

1. Read `memory/skill-queue.md`
2. Count entries with `status: done` that have actionable correction text
3. Filter OUT: praise ("this is fucking good", "this is fucking excellent"), non-sequiturs, duplicates
4. Filter IN: corrections about specific skills or behaviors ("fix the skill", "use the hook generator", "check for skills")
5. For each actionable entry: change `status: done` → `status: pending`
6. The auto-skill cron will pick these up on next Monday run

**Filtering examples:**
- "Fuck yeah! Now we need to develop an X offer" → KEEP (actionable request)
- "This is fucking good!" → DISCARD (praise)
- "Fucking fix the skill" → KEEP (vague but actionable — flag for review)
- "I don't use Claude code" → DISCARD (not a skill issue)
- "That Landing page is fucking good!" → DISCARD (praise)
- "who the fuck cares about citations in X?" → KEEP (signals skill needs to respect platform context)

## Known Behaviors

- **First run after setup:** Expect some failing evals because the system was always reporting 100%. This is healthy — it means scoring is finally working.
- **No analytics data:** Some weeks may have no content analytics. The pipeline still runs on corrections + outcomes alone; analytics are a bonus signal.
- **Empty queue is success:** If Phase 3 finds nothing actionable, that means skills are working. Log and move on.

## Anti-Patterns

| Mistake | Why Wrong | Fix |
|---|---|---|
| Auto-editing skill files | Bypasses human review, can break working skills | Always queue for approval |
| Ignoring corrections with anger | Frustration signals the most important failures | Extract signal from noise |
| Only checking corrections file | Outcome journal has richer correction data | Check both sources |
| Skipping content analytics | Misses the connection between skill quality and content performance | Always check analytics dirs |
| Marking queue as done without applying | This is what killed the auto-skill system | Never mark done until applied |
