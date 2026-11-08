#!/usr/bin/env node
import { resolve } from 'node:path'
import { existsSync, readFileSync } from 'node:fs'
import { createInterface } from 'node:readline/promises'
import {
    addComment,
    archiveTask,
    assignTask,
    blockTask,
    boardStats,
    completeTask,
    connectDb,
    createTask,
    getDefaultDbPath,
    getDispatchable,
    getTask,
    initDb,
    linkTasks,
    listTasks,
    promoteTask,
    setTaskStatus,
    unblockTask,
} from './kanban.mjs'
import { loadTemplate, listTemplates, stampTemplate, stampBatch, preflight, applyAnswers, detectBrandFiles, TEMPLATES_DIR } from './stamp.mjs'

const NOTIFY_USER_ID = process.env.KIMAKI_NOTIFY_USER_ID || '826516320904151040'

async function notifyTaskCompletion(task) {
    if (!task || task.status !== 'done') return
    const title = (task.title || '').toLowerCase()
    const isHooks = title.includes('generate hooks') || title.startsWith('hooks:')
    const isPublish = title.includes('publish to wordpress') || title.startsWith('publish:')
    if (!isHooks && !isPublish) return

    const token = process.env.KIMAKI_BOT_TOKEN
    const channel = process.env.KIMAKI_KANBAN_NOTIFY_CHANNEL
    if (!token || !channel) return

    const topic = task.title.includes(':') ? task.title.split(':').slice(1).join(':').trim() : task.title
    const mention = `<@${NOTIFY_USER_ID}>`
    let content
    if (isHooks) {
        content = `${mention} **Hooks ready** for "${topic}". Review and pick your favorite before polish continues.`
        if (task.thread_id) content += `\nThread: <#${task.thread_id}>`
    } else {
        const url = (task.result || '').match(/https?:\/\/[^\s]+/)
        content = `${mention} **Article published**: "${topic}"${url ? `\n${url[0]}` : ''}`
    }

    try {
        const res = await fetch(`https://discord.com/api/v10/channels/${channel}/messages`, {
            method: 'POST',
            headers: { 'Authorization': `Bot ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ content }),
        })
        if (!res.ok) console.error(`[notify] Discord API ${res.status}`)
    } catch (e) {
        console.error(`[notify] ${e instanceof Error ? e.message : e}`)
    }
}

const args = process.argv.slice(2)

function parseFlags(argv) {
    const flags = {}
    const positional = []
    for (let i = 0; i < argv.length; i++) {
        const arg = argv[i]
        if (arg.startsWith('--')) {
            const key = arg.slice(2)
            const next = argv[i + 1]
            if (!next || next.startsWith('--')) {
                flags[key] = true
            } else {
                if (key === 'var') {
                    if (!flags.var) flags.var = []
                    flags.var.push(next)
                } else if (key === 'skill' || key === 'parent' || key === 'deliverable') {
                    if (!flags[key]) flags[key] = []
                    flags[key].push(next)
                } else {
                    flags[key] = next
                }
                i++
            }
        } else {
            positional.push(arg)
        }
    }
    return { flags, positional }
}

function parseStampVars(flags) {
    const vars = {}
    const varList = Array.isArray(flags.var) ? flags.var : flags.var ? [flags.var] : []
    for (const v of varList) {
        const eq = v.indexOf('=')
        if (eq === -1) throw new Error(`Invalid --var format: "${v}". Use --var key=value`)
        vars[v.slice(0, eq)] = v.slice(eq + 1)
    }
    if (flags.tenant) vars.tenant = flags.tenant
    if (flags.project) vars.project = flags.project
    return vars
}

function readStdin(question) {
    const rl = createInterface({ input: process.stdin, output: process.stdout })
    return rl.question(question).finally(() => rl.close())
}

function usage() {
    console.log(`kimaki-kanban

Usage:
  kanban init [--db path]
  kanban create "title" [--body text] [--assignee name] [--tenant name] [--project name] [--skill a,b] [--parent id,id] [--priority n]
  kanban list [--status ready] [--assignee name] [--tenant name] [--project name]
  kanban show <task_id>
  kanban complete <task_id> --summary text [--result text] [--deliverable path] [--deliverable path2]
  kanban block <task_id> --reason text
  kanban unblock <task_id>
  kanban promote <task_id> [--assignee name] [--skill a,b] [--body text]
  kanban assign <task_id> --assignee name [--skill a,b]
  kanban status <task_id> --status ready
  kanban comment <task_id> --body text [--author name]
  kanban link <parent_id> <child_id>
  kanban archive <task_id>
  kanban stats
  kanban ready
  kanban templates [--details]
  kanban stamp <template-name-or-path> [--var key=value ...] [--tenant name] [--project name] [--force] [--db path]
  kanban stamp-batch <template-name> --file batch.json [--force] [--db path]
  kanban stamp <template-name-or-path> --preflight [--workdir path]
  kanban stamp <template-name-or-path> --interview [--workdir path] [--var key=value ...]
  kanban brand-files [--workdir path]
  kanban stamp-help
`)
}

function open(flags) {
    return flags.db ? initDb(flags.db) : initDb(getDefaultDbPath())
}

function printStampHelp() {
    console.log(`
=== Kimaki Kanban Workflow Templates — Agent Guide ===

WHAT ARE TEMPLATES?

Workflow templates are brand-agnostic YAML files that define a DAG (directed acyclic graph)
of tasks with skills, dependencies, and variable placeholders. You stamp a template for a
specific brand/tenant by providing variable values — the system creates all tasks in the
kanban DB with correct dependency links, and the dispatcher executes them via Kimaki agents.

HOW TO LIST TEMPLATES

  kanban templates              # List available template names
  kanban templates --details    # Show variables, tasks, and dependencies for each

HOW TO STAMP (RUN) A TEMPLATE

  kanban stamp <template-name> --var key=value [--var key2=value2 ...]

Examples:

  kanban stamp blog-social-campaign \\
    --var topic="solar chargers" \\
    --var tenant=nomadixgear \\
    --var audience=campers

  kanban stamp product-launch \\
    --var product="HyperFrames" \\
    --var tenant=aiwithjai \\
    --var vertical="developer tools"

  kanban stamp b2b-outreach \\
    --var vertical=resorts \\
    --var tenant=nomadixgear \\
    --var region=Caribbean

  kanban stamp seo-silo \\
    --var seed_keyword="solar chargers" \\
    --var tenant=nomadixgear \\
    --var page_count=30

HOW TO BUILD A NEW TEMPLATE

Create a YAML file in: ${TEMPLATES_DIR}/

Template structure:

  name: Human-readable name
  description: What this workflow does

  variables:
    - name: topic           # Variable key used in {{topic}} placeholders
      required: true        # Must be provided or stamp fails
      description: Help text for the agent
    - name: audience
      default: general      # Optional — used if not provided
      description: Target audience

  tasks:
    - id: research                    # Unique ID within this template
      title: "Research: {{topic}}"    # {{vars}} get interpolated
      assignee: researcher            # Maps to a kanban worker role
      skills: [keyword-research]      # Skills the worker agent should load
      priority: 3                     # Higher = runs first within a tier
      body: |                         # Detailed instructions for the agent
        Research {{topic}} for {{audience}}...

    - id: draft
      title: "Write blog: {{topic}}"
      assignee: writer
      skills: [Publishing Blog Articles]
      parents: [research]             # Wait for these tasks to complete first
      priority: 2
      body: |
        Write about {{topic}}...

RULES FOR TEMPLATES:

1. Variables: Use {{variable_name}} in title, body, and description fields.
   Required variables MUST be provided when stamping or it errors.
   Optional variables fall back to their default value.

2. Task IDs: Must be unique within the template. Used for parent links.
   These are logical IDs — the DB assigns real task IDs (t_xxxxxxxx).

3. Dependencies: Use "parents: [task_id]" to create dependency links.
   Child tasks start as "todo" and auto-promote to "ready" when all parents complete.

4. Skills: List skills the worker agent should have loaded. These map to
   the skill names in ~/.claude/skills/ or the available_skills list.

5. Assignees: Logical role names (researcher, writer, social, etc.).
   The dispatcher maps these to Kimaki agent sessions.

6. Body text: This is the prompt sent to the worker agent. Be specific.
   Include what to produce, where to save it, and what to reference.

7. Tenant: The "tenant" variable is special — it namespaces tasks per brand.
   Include it as a required variable in most templates.

EXECUTION FLOW:

  1. You run: kanban stamp <template> --var ...
  2. Tasks are created in the kanban DB with dependency links
  3. Root tasks (no parents) start as "ready"
  4. Child tasks start as "todo"
  5. The dispatcher polls for "ready" tasks and spawns Kimaki workers
  6. When a worker completes a task, its children auto-promote to "ready"
  7. The next dispatch tick picks up the newly ready tasks
  8. This continues until all tasks are done or blocked

STARTING THE DISPATCHER:

  bun src/dispatcher.mjs \\
    --workdir /path/to/brand/project \\
    --channel <discord-channel-id> \\
    --agent general \\
    --interval 30

DASHBOARD:

  bun src/server.mjs
  open http://127.0.0.1:4717
`)
}

function fmtTime(ts) {
    if (!ts) return ''
    return new Date(ts * 1000).toISOString().replace('T', ' ').slice(0, 19)
}

function printTask(task) {
    const tenant = task.tenant ? `[${task.tenant}] ` : ''
    const project = task.project ? `/${task.project} ` : ''
    console.log(`${task.id}  ${task.status.padEnd(8)}  ${(task.assignee || 'unassigned').padEnd(18)} ${tenant}${project}${task.title}`)
}

(async function main() {
    const { flags, positional } = parseFlags(args)
    const cmd = positional[0]

    if (!cmd || flags.help || flags.h) {
        usage()
        process.exit(0)
    }

    try {
    if (cmd === 'init') {
        const path = flags.db || getDefaultDbPath()
        initDb(path)
        console.log(`Initialized kanban DB: ${path}`)
    } else if (cmd === 'create') {
        const db = open(flags)
        const title = positional[1]
        if (!title) throw new Error('create requires a title')
        const skillInput = Array.isArray(flags.skill) ? flags.skill.join(',') : flags.skill
        const parentInput = Array.isArray(flags.parent) ? flags.parent.join(',') : flags.parent
        const skills = skillInput ? String(skillInput).split(',').map(s => s.trim()).filter(Boolean) : []
        const parents = parentInput ? String(parentInput).split(',').map(s => s.trim()).filter(Boolean) : []
        const status = parents.length > 0 ? 'todo' : (flags.status || 'ready')
        const task = createTask(db, {
            title,
            body: flags.body || '',
            assignee: flags.assignee || null,
            tenant: flags.tenant || null,
            project: flags.project || null,
            priority: flags.priority ? Number(flags.priority) : 0,
            status,
            skills,
            parents,
        })
        printTask(task)
    } else if (cmd === 'list') {
        const db = open(flags)
        listTasks(db, {
            status: flags.status,
            assignee: flags.assignee,
            tenant: flags.tenant,
            project: flags.project,
            limit: flags.limit ? Number(flags.limit) : 100,
        }).forEach(printTask)
    } else if (cmd === 'ready') {
        const db = open(flags)
        getDispatchable(db).forEach(printTask)
    } else if (cmd === 'show') {
        const db = open(flags)
        const task = getTask(db, positional[1])
        if (!task) throw new Error(`task not found: ${positional[1]}`)
        console.log(`${task.id}: ${task.title}`)
        console.log(`status:   ${task.status}`)
        console.log(`assignee: ${task.assignee || ''}`)
        console.log(`tenant:   ${task.tenant || ''}`)
        console.log(`project:  ${task.project || ''}`)
        console.log(`skills:   ${task.skills.join(', ')}`)
        console.log(`created:  ${fmtTime(task.created_at)}`)
        if (task.body) console.log(`\n${task.body}`)
        if (task.parents.length) console.log(`\nparents:  ${task.parents.join(', ')}`)
        if (task.children.length) console.log(`children: ${task.children.join(', ')}`)
        if (task.parentResults.length) {
            console.log('\nParent results:')
            for (const p of task.parentResults) console.log(`- ${p.id} (${p.status}) ${p.title}: ${p.result || ''}`)
        }
        if (task.comments.length) {
            console.log('\nComments:')
            for (const c of task.comments) console.log(`- ${fmtTime(c.created_at)} ${c.author}: ${c.body}`)
        }
        if (task.events.length) {
            console.log('\nEvents:')
            for (const e of task.events) console.log(`- ${fmtTime(e.created_at)} ${e.kind} ${e.payload || ''}`)
        }
    } else if (cmd === 'complete') {
        const db = open(flags)
        const deliverables = flags.deliverable ? (Array.isArray(flags.deliverable) ? flags.deliverable : [flags.deliverable]) : undefined
        const task = completeTask(db, positional[1], { summary: flags.summary, result: flags.result, deliverables })
        printTask(task)
        // Send Discord notification for hooks/publish task completion
        notifyTaskCompletion(task)
    } else if (cmd === 'block') {
        const db = open(flags)
        const task = blockTask(db, positional[1], { reason: flags.reason || 'blocked', author: flags.author || 'worker' })
        printTask(task)
    } else if (cmd === 'unblock') {
        const db = open(flags)
        const task = unblockTask(db, positional[1])
        if (!task) throw new Error(`cannot unblock task: ${positional[1]}`)
        printTask(task)
    } else if (cmd === 'promote') {
        const db = open(flags)
        const skillInput = Array.isArray(flags.skill) ? flags.skill.join(',') : flags.skill
        const skills = skillInput ? String(skillInput).split(',').map(s => s.trim()).filter(Boolean) : undefined
        const task = promoteTask(db, positional[1], { assignee: flags.assignee || undefined, skills, body: flags.body || undefined })
        if (!task) throw new Error(`task not found: ${positional[1]}`)
        printTask(task)
    } else if (cmd === 'assign') {
        const db = open(flags)
        const skillInput = Array.isArray(flags.skill) ? flags.skill.join(',') : flags.skill
        const skills = skillInput ? String(skillInput).split(',').map(s => s.trim()).filter(Boolean) : undefined
        const task = assignTask(db, positional[1], flags.assignee || null, { skills })
        if (!task) throw new Error(`task not found: ${positional[1]}`)
        printTask(task)
    } else if (cmd === 'status') {
        const db = open(flags)
        const task = setTaskStatus(db, positional[1], flags.status)
        if (!task) throw new Error(`task not found: ${positional[1]}`)
        printTask(task)
    } else if (cmd === 'comment') {
        const db = open(flags)
        const c = addComment(db, positional[1], flags.author || 'user', flags.body || '')
        console.log(`comment ${c.id} added`)
    } else if (cmd === 'link') {
        const db = open(flags)
        linkTasks(db, positional[1], positional[2])
        console.log(`linked ${positional[1]} -> ${positional[2]}`)
    } else if (cmd === 'archive') {
        const db = open(flags)
        archiveTask(db, positional[1])
        console.log(`archived ${positional[1]}`)
    } else if (cmd === 'stats') {
        const db = open(flags)
        console.log(JSON.stringify(boardStats(db), null, 2))
    } else if (cmd === 'templates') {
        const templates = listTemplates()
        if (!templates.length) {
            console.log(`No templates found in ${TEMPLATES_DIR}`)
        } else if (flags.details) {
            for (const t of templates) {
                try {
                    const tpl = loadTemplate(t.file.replace(/\.ya?ml$/, ''))
                    console.log(`\n=== ${tpl.name} (${t.file}) ===`)
                    if (tpl.description) console.log(tpl.description)
                    console.log(`\nVariables:`)
                    for (const v of tpl.variables) {
                        const req = v.required ? '(required)' : '(optional)'
                        const def = v.default ? ` default: ${v.default}` : ''
                        console.log(`  ${v.name} ${req}${def}${v.description ? ' — ' + v.description : ''}`)
                    }
                    console.log(`\nTasks (${tpl.tasks.length}):`)
                    for (const task of tpl.tasks) {
                        const deps = task.parents.length ? ` [after: ${task.parents.join(', ')}]` : ''
                        console.log(`  ${task.id}: ${task.title} → ${task.assignee || 'unassigned'} | skills: ${task.skills.join(', ')}${deps}`)
                    }
                } catch (err) {
                    console.log(`  ${t.file}: error loading — ${err.message}`)
                }
            }
        } else {
            for (const t of templates) {
                console.log(`  ${t.file.padEnd(35)} ${t.name}`)
            }
            console.log(`\nUse --details to see variables and tasks.`)
        }
    } else if (cmd === 'stamp') {
        const templateName = positional[1]
        if (!templateName) throw new Error('stamp requires a template name or path. Use "kanban templates" to list available templates.')

        if (flags.preflight) {
            const tpl = loadTemplate(templateName)
            const vars = parseStampVars(flags)
            const workdir = flags.workdir ? resolve(flags.workdir) : process.cwd()
            const manifest = preflight(tpl, vars, workdir)
            console.log(JSON.stringify(manifest, null, 2))
            console.error(`\nBrand level: L${manifest.brand_level} (${manifest.brand_populated.length} of 10 files populated)`)
            console.error(`${manifest.questions.length} questions needed before stamping.`)
            if (manifest.missing_required.length) {
                console.error(`Missing required variables (no question available): ${manifest.missing_required.join(', ')}`)
            }
            process.exit(0)
        }

        if (flags.interview) {
            const tpl = loadTemplate(templateName)
            const cliVars = parseStampVars(flags)
            const workdir = flags.workdir ? resolve(flags.workdir) : process.cwd()
            const manifest = preflight(tpl, cliVars, workdir)

            if (manifest.questions.length === 0 && manifest.missing_required.length === 0) {
                console.error('All variables satisfied. Proceeding to stamp...')
            } else {
                if (manifest.missing_required.length) {
                    throw new Error(`Missing required variables with no question: ${manifest.missing_required.join(', ')}`)
                }
                console.error(`\n=== Interview Mode: ${manifest.questions.length} questions ===\n`)
                const answers = {}
                for (const q of manifest.questions) {
                    const prompt = q.required ? `[REQUIRED] ` : `[optional]  `
                    const def = q.default ? ` (default: ${q.default})` : ''
                    const pre = q.prefill ? ` [current: ${q.prefill}]` : ''
                    console.error(`${prompt}${q.question}${def}${pre}`)
                    const input = await readStdin(`${q.var}> `)
                    const val = input.trim()
                    if (val) {
                        answers[q.var] = val
                    } else if (q.default) {
                        answers[q.var] = q.default
                    }
                }
                cliVars.answers = answers
            }

            return
        }

        const tpl = loadTemplate(templateName)
        const vars = parseStampVars(flags)
        if (flags.tenant) vars.tenant = flags.tenant
        const db = open(flags)
        const result = stampTemplate(db, tpl, vars, { force: !!flags.force })
        console.log(`\nStamped: ${result.template} (${result.tasks.length} tasks, tenant: ${vars.tenant || vars.brand || 'none'}, project: ${vars.project || 'none'})`)
        console.log(`\nTask DAG:`)
        for (const t of result.tasks) {
            console.log(`  ${t.dbId}  ${t.templateId.padEnd(15)} ${t.title}`)
        }
        console.log(`\nDispatcher will pick up ready tasks automatically.`)
        console.log(`Run: bun src/dispatcher.mjs --workdir /path/to/project --channel <id> --agent general`)
    } else if (cmd === 'stamp-batch') {
        const templateName = positional[1]
        if (!templateName) throw new Error('stamp-batch requires a template name')
        if (!flags.file) throw new Error('stamp-batch requires --file <path> (JSON array of variable objects)')

        const tpl = loadTemplate(templateName)
        const batchPath = resolve(flags.file)
        if (!existsSync(batchPath)) throw new Error(`Batch file not found: ${batchPath}`)

        const batchEntries = JSON.parse(readFileSync(batchPath, 'utf-8'))
        if (!Array.isArray(batchEntries)) throw new Error('Batch file must contain a JSON array')

        const db = open(flags)
        const result = stampBatch(db, tpl, batchEntries, { force: !!flags.force })

        console.log(`\nBatch stamp: ${result.template}`)
        console.log(`  Stamped: ${result.stamped.length} pipelines (${result.totalTasks} total tasks)`)
        console.log(`  Skipped: ${result.skipped.length} (duplicates)`)

        for (const r of result.stamped) {
            console.log(`\n  Pipeline (tenant: ${r.tenant || 'none'}):`)
            for (const t of r.tasks) {
                console.log(`    ${t.dbId}  ${t.templateId.padEnd(15)} ${t.title}`)
            }
        }

        if (result.skipped.length) {
            console.log(`\nSkipped entries:`)
            for (const s of result.skipped) {
                const slug = s.vars.podcast_slug || s.vars.slug || s.vars.keyword || '?'
                console.log(`  ${slug}: ${s.reason}`)
            }
        }
    } else if (cmd === 'brand-files') {
        const workdir = flags.workdir ? resolve(flags.workdir) : process.cwd()
        const brand = detectBrandFiles(workdir)
        console.log(`Brand directory: ${workdir}/brand/`)
        console.log(`CMO Level: L${brand.level} (${brand.populated.length} of 10 files)`)
        console.log(`\nPopulated files (${brand.populated.length}):`)
        for (const f of brand.populated) console.log(`  ✓ ${f}`)
        console.log(`\nMissing or template-only (${brand.missing.length}):`)
        for (const f of brand.missing) console.log(`  ✗ ${f}`)
        if (flags.json) {
            console.log(JSON.stringify(brand, null, 2))
        }
    } else if (cmd === 'stamp-help') {
        printStampHelp()
    } else {
        throw new Error(`unknown command: ${cmd}`)
    }
} catch (err) {
    console.error(err instanceof Error ? err.message : String(err))
    process.exit(1)
}
})()
