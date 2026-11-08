---
name: kanban
description: >
  Work as a Kimaki Kanban worker. Use when a task has KIMAKI_KANBAN_TASK or
  the user asks to manage the multi-agent kanban board. Also use when the user
  asks to stamp or list workflow templates.
version: 0.2.0
---

# Kimaki Kanban Worker

## When to Use

Use this skill when:
- You are spawned by the Kimaki Kanban dispatcher
- The user asks to create, list, complete, block, or orchestrate kanban tasks
- The user asks about workflow templates or wants to stamp one

## Environment

- `KIMAKI_KANBAN_TASK` — current task id
- `KIMAKI_KANBAN_DB` — SQLite database path
- `KIMAKI_KANBAN_RUN` — current run id

## Required Worker Loop

1. Read the task details from the prompt.
2. **Load the skills listed in the task's `skills:` field.** Use the `skill` tool for each one (e.g., `skill("blog-publish-pipeline")`). If no skills are listed, proceed without loading any.
3. Complete the requested work using the loaded skills and normal Kimaki tools.
4. If you create artifacts, include exact file paths in your completion summary.
5. Complete the task:

```bash
bun ~/.huckleberry/kanban/src/cli.mjs complete "$KIMAKI_KANBAN_TASK" --summary "Completed: <what changed>"
```

5. If you are blocked:

```bash
bun ~/.huckleberry/kanban/src/cli.mjs block "$KIMAKI_KANBAN_TASK" --reason "Need human input: <specific question>"
```

## Workflow Templates

The kanban system supports brand-agnostic workflow templates. These are YAML files in `templates/` that define multi-step task DAGs with variable interpolation.

### Listing Templates

```bash
bun ~/.huckleberry/kanban/src/cli.mjs templates
bun ~/.huckleberry/kanban/src/cli.mjs templates --details
```

### Stamping a Template for a Brand

See **CLI Reference** below for full syntax.

## CLI Reference

All commands: `bun ~/.huckleberry/kanban/src/cli.mjs <command> [options]`

Common flags: `--db <path>` (default: `kanban.db` in cwd)

### Task Lifecycle

```bash
# Create a task
~/.huckleberry/kanban/src/cli.mjs create "Task title" --tenant <business> --project <project> --assignee <agent> --skills skill1,skill2

# List tasks (supports all filters)
~/.huckleberry/kanban/src/cli.mjs list [--tenant <business>] [--project <project>] [--status ready|todo|in_progress|done|blocked] [--assignee <agent>] [--limit N]

# Show task details
~/.huckleberry/kanban/src/cli.mjs show <task_id>

# Complete a task
~/.huckleberry/kanban/src/cli.mjs complete <task_id> --summary "What was done"

# Block a task
~/.huckleberry/kanban/src/cli.mjs block <task_id> --reason "Why blocked"
```

### Templates

```bash
# List available templates
~/.huckleberry/kanban/src/cli.mjs templates [--details]

# Stamp a template (creates all tasks in the DAG)
~/.huckleberry/kanban/src/cli.mjs stamp <template-name> \
  --var topic="solar chargers" \
  --var tenant=nomadixgear \
  --project seo-hub-spoke
```

### --project Flag

The `--project` flag groups tasks within a tenant by project. Use it on `create`, `list`, and `stamp`:

```bash
# Create with project
~/.huckleberry/kanban/src/cli.mjs create "Build hub pages" --tenant enchantents --project seo-hub-spoke

# List only tasks for a specific project
~/.huckleberry/kanban/src/cli.mjs list --tenant enchantents --project seo-hub-spoke

# Stamp with project (all tasks in the DAG inherit it)
~/.huckleberry/kanban/src/cli.mjs stamp blog-social-campaign --var topic="solar chargers" --var tenant=enchantents --var content_tier=commodity --var digital_brain_delta="one line: what this piece adds to the brand's digital brain" --project seo-hub-spoke
```

Available templates:
- `blog-social-campaign` — Research (keywords + Reddit + PAA) → AEO triplet publish → multi-platform distribution (15 tasks, requires content_tier + digital_brain_delta)
- `ai-visibility-sprint` — AI citation audit → gap analysis → content overhaul → distribute → tracking setup (5 tasks)
- `product-launch` — Position → assets → listing + announce (4 tasks)
- `b2b-outreach` — Scrape → research → emails → send (4 tasks)
- `seo-silo` — Keywords → hub pages → spoke pages → off-page (4 tasks)

### Building a New Template

Create a YAML file in `~/.huckleberry/kanban/templates/`:

```yaml
name: My Workflow
description: What it does

variables:
  - name: topic
    required: true
  - name: tenant
    required: true

tasks:
  - id: step1
    title: "Step 1: {{topic}}"
    assignee: researcher
    skills: [keyword-research]
    priority: 3
    body: |
      Research {{topic}} and save results.

  - id: step2
    title: "Step 2: {{topic}}"
    assignee: writer
    skills: [Publishing Blog Articles]
    parents: [step1]
    priority: 2
    body: |
      Write about {{topic}} using step1 results.
```

Run `bun ~/.huckleberry/kanban/src/cli.mjs stamp-help` for the full agent guide.

## Human Gates

Block instead of continuing when:

- External publishing or sending is required
- Pricing/positioning needs approval
- The task requires credentials or access you do not have
- Source data is insufficient and continuing would require guessing

## Quality Bar

- Deliver artifacts, not status.
- Keep summaries concise.
- Never fabricate results.
- Use parent task results as source context.
