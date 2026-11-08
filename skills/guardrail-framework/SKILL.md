---
name: guardrail-framework
description: Reusable guardrail template preventing hallucinations in pipeline skills.
license: Internal use only
---

# Guardrail Framework

This is a reusable template. Add these guardrails to EVERY skill in the content pipeline.

---

## Pre-Execution Protocol (ALWAYS MANDATORY)

1. **Read ENTIRE skill** before executing ANY step
2. **Copy-paste exact prompts** from the skill — never paraphrase
3. **Verify current step** in pipeline-run.json before each action
4. **If uncertain**, ask human before proceeding

---

## Step Logging (MANDATORY)

Before ANY action, update the pipeline registry file:

**File**: `businesses/{business}/content/pipeline-registry.json`

**Update**:
```json
{
  "runId": "uuid-from-orchestrator",
  "currentSkill": "skill-name",
  "currentStep": 1,
  "stepName": "execute_step_name",
  "status": "in_progress",
  "startedAt": "2026-04-05T12:00:00Z",
  "completedAt": null,
  "outputFiles": []
}
```

After completing the step:
```json
{
  "status": "completed",
  "completedAt": "2026-04-05T12:05:00Z",
  "outputFiles": ["path/to/output.md"]
}
```

---

## Checkpoint Gates (MANDATORY)

- **Stage N MUST complete** before Stage N+1 starts
- **NEVER skip stages**
- **NEVER skip human approval** at checkpoint gates
- **If blocked**, wait for human intervention

### Checkpoint Gate Template

> "Per [SKILL.md] Stage [X], I have completed [action]. 
> My next step is [Stage Y]. Waiting for your go-ahead before proceeding."

---

## Verbal Check-in (ALWAYS)

Before executing any sub-task, state:

> "Per [SKILL_NAME] SKILL.md, I am now [exact action].
> Step [N] of [total]. Current status: [in_progress/completed]."

---

## Restricted Agency Model

Every skill must define explicit allowed/forbidden actions.

### ✅ ALLOWED (explicit actions this skill can do)

- Run scripts or CLI commands defined in this skill
- Invoke other skills explicitly listed
- Transform/clean/format existing content
- Present output to human
- Update pipeline registry

### ❌ FORBIDDEN (strict prohibitions)

- Generate original content (that's another skill's job)
- Make decisions without human approval
- Skip stages or reorder execution
- Call APIs or services not listed in this skill
- Proceed past checkpoint without go-ahead
- **Paraphrase standard operating procedure prompts to force context**. If a prompt requires previous context, inject it into an explicit `[CONTEXT]` variable. If there is no `[CONTEXT]` variable, **FAIL LOUDLY**.

---

## Pipeline Registry Schema

All pipeline runs track progress in a shared registry:

```json
{
  "runId": "uuid",
  "topic": "topic-slug",
  "startedAt": "ISO timestamp",
  "currentSkill": "skill-name",
  "currentStep": 1,
  "workers": {
    "blog": { "status": "pending|completed|failed", "completedAt": null },
    "social": { "status": "pending|completed|failed", "completedAt": null },
    "video": { "status": "pending|completed|failed", "completedAt": null },
    "visuals": { "status": "pending|completed|failed", "completedAt": null },
    "publish": { "status": "pending|completed|failed", "completedAt": null }
  },
  "qualityCheck": {
    "status": "pending_review|approved|rejected",
    "feedback": null,
    "reviewedAt": null
  },
  "completedAt": null
}
```

---

## How to Apply This Template

### Step 1: Add Guardrails Header to SKILL.md

```markdown
---
name: your-skill-name
description: ...
---

# GUARDRAILS FRAMEWORK

This skill follows the mandatory guardrail protocol. See: .claude/skills/guardrail-framework/SKILL.md

## Pre-Execution Protocol
[Copy from template above]

## [Your Skill's Steps Below]
```

### Step 2: Update Pipeline Registry at Each Step

At the START of each major section:
1. Read current registry
2. Update currentSkill/currentStep
3. Write updated registry

At the END of each section:
1. Update status to "completed"
2. Add completedAt timestamp
3. Add outputFiles list

### Step 3: Add Checkpoint Gates

Before any stage that requires human approval:

```
---

## CHECKPOINT: [Stage Name]

[State what was just completed]
[State what you're about to do]
[WAIT for go-ahead before proceeding]
```

### Step 4: Verify Before Executing

Before running ANY command or calling ANY skill:
- Have I read the full skill?
- Is this action explicitly allowed?
- Have I updated the registry?
- Is this the correct step order?

---

## Example: Applied to a Worker Skill

```markdown
---
name: blog-worker
description: Humanize and polish blog content from NLM research, add schema and AI files.
---

# GUARDRAILS FRAMEWORK

This skill follows the mandatory guardrail protocol. See: .claude/skills/guardrail-framework/SKILL.md

## Pre-Execution Protocol
1. Read ENTIRE skill before executing
2. Copy-paste exact prompts — never paraphrase
3. Update pipeline-registry.json before each action

## ✅ ALLOWED
- Run humanizer skill on NLM blog draft
- Add schema markup (Article schema)
- Generate AI md file
- Generate FAQ JSON
- Present to human for review
- Update registry

## ❌ FORBIDDEN
- Generate original blog content
- Skip humanization step
- Publish without approval
- Make content decisions without human

---

## Pipeline Registry Update (START)

Update `businesses/aiwithjai/content/pipeline-registry.json`:
```json
{
  "runId": "from-orchestrator",
  "currentSkill": "blog-worker",
  "currentStep": 1,
  "stepName": "humanize_blog",
  "status": "in_progress"
}
```

---

## Step 1: Humanize Blog Draft

Run: Skill: humanizer

Input: businesses/aiwithjai/evergreen.mdcompetitor-intel/{date}-{topic}/blog-draft.md

Output: Cleaned content in businesses/aiwithjai/content/blog/{slug}/03-draft-humanized.md

---

## CHECKPOINT: Present to Human

> "Blog draft has been humanized. Ready for your review before adding schema."

[WAIT for go-ahead]

---

## Step 2: Add Schema and AI Files

[Continue with schema markup, AI md file, FAQ generation]

---

## Pipeline Registry Update (COMPLETE)

```json
{
  "status": "completed",
  "completedAt": "2026-04-05T12:30:00Z",
  "outputFiles": [
    "03-production/blog/{slug}/03-final.md",
    "03-production/blog/{slug}/03-final_ai.md",
    "03-production/blog/{slug}/03-final_faq.json"
  ]
}
```
```

---

## Skills Requiring This Framework

| Skill | Status |
|-------|--------|
| content-pipeline-orchestrator | ✅ Added |
| notebooklm-browser-agent | ✅ Already has built-in (Three Laws) |
| blog-worker | ✅ Created |
| social-worker | ✅ Created |
| video-worker | ✅ Created |
| visual-worker | ✅ Created |
| asset-pairing | ✅ Created |
| x-playwriter | ✅ Already exists |
| linkedin-publisher | ✅ Created |
| medium-publisher | ✅ Created |
| publish-validator (was quality-check) | ✅ Created |

---

## Quality Gate (MANDATORY for all writing skills)

Any skill that produces written content (blog posts, social posts, emails, copy, newsletters, hooks) MUST run `quality-gate` as its final step before presenting to Jairo. This is non-negotiable.

The quality gate:
1. Spawns a **fresh subagent** (clean context, no writer bias)
2. Subagent reads **evergreen.md + brand assets** to understand the ICP
3. Subagent **roleplays as the target buyer** at the correct funnel stage (TOFU/MOFU/BOFU)
4. Scores the draft on 5 ICP-relative dimensions (stop-scroll, relevance, trust, next-step, AI slop)
5. Returns pass/fail with specific rewrite instructions
6. Writing skill rewrites and re-runs (max 3 attempts)
7. After 3 failures: escalate to Jairo with all score reports

See `Skill: quality-gate` for the full subagent prompt template and scoring protocol.

**Exempt skills:** Research, planning, audit, technical, and analysis skills that don't produce written content for audiences.

---

## Summary

All worker skills and publishers have been created with guardrail framework. The pipeline now has:

1. **Checkpoint gates** at every stage
2. **Human-in-the-loop** at quality-check
3. **Quality gate** at writing stage (ICP-relative, subagent-reviewed)
4. **Step logging** to pipeline-registry.json
5. **Verbal check-ins** before each action
6. **Restricted agency model** - workers transform, not generate
