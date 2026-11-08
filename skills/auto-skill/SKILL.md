---
name: auto-skill
description: "Automatic skill development pipeline. Detects repetitive tasks and user corrections, then creates or improves skills accordingly."
allowed-tools: []
---

# /auto-skill — Automatic Skill Development

Detects corrections and repetitive patterns, then creates or improves skills with dedup protection and git versioning.

## How It Works

Three detection mechanisms feed a queue, and this skill processes it:

1. **Correction detection** — User frustration/correction patterns auto-queue skill improvements
2. **Repetition detection** — Same task pattern 2+ times suggests skill extraction
3. **Excellence detection** — Exceptional output flagged by user ("this is fucking good," "save this pattern") triggers skill extraction to make it repeatable
4. **Skill routing** — High-confidence skill matches auto-load (0.8+), medium confidence suggests (0.6+)

## On Activation

1. Read `memory/skill-queue.md` for pending items
2. If queue is empty, report: "No pending skill improvements."
3. If queue has items, process each one

## Phase 1: Process Corrections

For each correction in the queue:

1. **Dedup check** — Run `findDuplicateSkill()` against all existing skills
2. **If match > 0.7** — IMPROVE existing skill:
   - Read the matching SKILL.md
   - Add the correction to Anti-Patterns table
   - Git commit: `skill(<name>): add correction — <summary>`
3. **If no match** — Draft new skill:
   - Create entry in queue with `status: pending-approval`
   - Present to user for approval before creating
   - NEVER auto-create without human approval

## Phase 2: Process Repetitions

For each repetition (2+ occurrences of same pattern):

1. **Check if existing skill covers it** — Fuzzy match against skill index
2. **If covered** — Add to that skill's Anti-Patterns: "Agent improvised instead of using this skill"
3. **If not covered** — Draft new skill with:
   - Name derived from the repeated pattern
   - Description capturing what was repeated
   - Status: `pending-approval`
   - Present to user for approval

## Phase 3: Process Excellence (Capture Repeatable Greatness)

For each excellence flag (user says "this is great," "save this," "make it repeatable"):

1. **Extract the pattern** — What made it work? (structure, voice, specific techniques, prompt chains)
2. **Check existing skill coverage** — Does a skill already produce this quality?
3. **If skill exists** — Add the winning pattern as "Golden Path" example in that skill
4. **If no skill covers it** — Draft new skill with:
   - Name from the pattern (e.g., "landing-page-architect" from a great landing page session)
   - Description capturing the repeatable method
   - Include the actual working output as reference example
   - Status: `pending-approval`
   - Present to user: "You said [X] was excellent. Here's a skill draft to make it repeatable. Approve?"

## Phase 4: Git Versioning

Every skill mutation:

1. Backup current SKILL.md to `skill-history/<name>-<timestamp>.md`
2. Apply the improvement
3. Git commit with semantic message: `skill(<name>): <verb> — <reason>`
4. Append to CHANGELOG.md in skill directory

Verbs: `improve`, `fix-trigger`, `add-anti-pattern`, `merge-from(<source>)`, `create`, `add-golden-path`

## Phase 5: Update Skill Index

After processing, rebuild `memory/skill-index.json`:

```javascript
// Regenerate the cached index with updated skills
node -e "const { buildSkillIndex } = require('./.agents/skills/auto-skill/skill-router.js'); ..."
```

## Anti-Patterns

| Mistake | Why Wrong | Fix |
|---------|-----------|-----|
| Creating duplicate skill | 5 blog skills instead of 1 improved one | Always dedup check first |
| Auto-creating without approval | User loses trust, low quality | New skills need human approval |
| Skipping git commit | Can't revert bad improvements | Every mutation gets committed |
| Ignoring skill-router matches | Agent improvises instead of using skill | Auto-load at 0.8+ confidence |
| **Improvising instead of using skill** | "I can do this better manually" | **ALWAYS check skills first (1b Skill-First Protocol)** |

## Key Rules

- **Auto-USE at 0.8+ confidence** — Don't suggest, just load and execute the skill
- **Suggest at 0.6-0.8** — Present as option
- **2 repetitions** = suggest skill creation
- **Every correction = its own git commit**
- **New skills require human approval**
- **Always improve existing before creating new**
- **Excellence flag = extract pattern within same session** — don't let great work evaporate

## Integration Points

- **memory-system plugin** — Correction detection + skill routing hooks
- **correction-queue.js** — Queue management module
- **dedup.js** — Dedup + git versioning module
- **skill-router.js** — Fuzzy matching + auto-load module

## File Structure

```
.agents/skills/auto-skill/
├── SKILL.md              ← this file
├── skill-router.js       ← fuzzy matching + auto-load
├── correction-queue.js   ← queue management
└── dedup.js              ← dedup + git versioning
```

## Queue File Format

`memory/skill-queue.md` entries:

```markdown
## Correction — 2026-05-09T18:00:00Z
- **status:** pending
- **type:** correction
- **text:** Why aren't you using the hook generation skill for article titles?
- **context:** Blog publishing pipeline, Step 1
- **queued:** 2026-05-09T18:00:00Z

## Repetition — 2026-05-09T18:30:00Z
- **status:** pending-approval
- **type:** repetition
- **pattern:** Generating LinkedIn posts from blog content
- **count:** 2
- **context:** content-atomizer runs
- **queued:** 2026-05-09T18:30:00Z

## Excellence — 2026-06-15T14:00:00Z
- **status:** pending-approval
- **type:** excellence
- **text:** "This landing page is fucking good — make it repeatable"
- **pattern:** Landing page built section-by-section with 8-section architecture, psychology-aligned CTAs, verification gates
- **reference_output:** /tmp/landing-page-output.md
- **context:** landing-page-architect run
- **queued:** 2026-06-15T14:00:00Z
```
