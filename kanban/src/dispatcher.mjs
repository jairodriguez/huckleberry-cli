#!/usr/bin/env node
import { spawn } from 'node:child_process'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { resolve, dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { Database } from 'bun:sqlite'
import {
    connectDb,
    countRunningTasks,
    failRun,
    getDefaultDbPath,
    getDispatchable,
    getTask,
    initDb,
    startRun,
} from './kanban.mjs'

const CONFIG_PATH = join(dirname(fileURLToPath(import.meta.url)), '..', 'config', 'dispatcher-config.json')
const DAILY_LIMITS_PATH = `${process.env.HOME || process.env.USERPROFILE}/.kimaki/daily-limits.json`
const NOTIFY_USER_ID = process.env.KIMAKI_NOTIFY_USER_ID || '826516320904151040'

function loadDispatcherConfig() {
    try {
        const raw = readFileSync(CONFIG_PATH, 'utf8')
        return JSON.parse(raw)
    } catch {
        return {}
    }
}

function loadDailyLimits() {
    try {
        const raw = readFileSync(DAILY_LIMITS_PATH, 'utf8')
        return JSON.parse(raw)
    } catch {
        return { date: new Date().toISOString().split('T')[0], perTenant: {}, perAssignee: {}, global: 0 }
    }
}

function saveDailyLimits(limits) {
    writeFileSync(DAILY_LIMITS_PATH, JSON.stringify(limits, null, 2))
}

async function sendDiscordNotification(channelId, content) {
    const token = process.env.KIMAKI_BOT_TOKEN
    if (!token || !channelId) return
    try {
        const res = await fetch(`https://discord.com/api/v10/channels/${channelId}/messages`, {
            method: 'POST',
            headers: {
                'Authorization': `Bot ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ content }),
        })
        if (!res.ok) console.log(`[NOTIFY] Discord API returned ${res.status}`)
    } catch (err) {
        console.log(`[NOTIFY] Failed: ${err instanceof Error ? err.message : err}`)
    }
}

function checkTaskNotification(task) {
    const title = (task.title || '').toLowerCase()
    const isHooks = title.includes('generate hooks') || title.startsWith('hooks:')
    const isPublish = title.includes('publish to wordpress') || title.startsWith('publish:')
    const mention = `<@${NOTIFY_USER_ID}>`
    const topic = task.title.includes(':') ? task.title.split(':').slice(1).join(':').trim() : task.title

    if (isHooks) {
        return `${mention} **Hooks ready** for "${topic}". Review and pick your favorite before polish continues.\n` +
               `Thread: <#${task.thread_id || notifyChannel}>`
    }
    if (isPublish) {
        const url = task.result?.match(/https?:\/\/[^\s]+/)
        return `${mention} **Article published**: "${topic}"${url ? `\nURL: ${url[0]}` : ''}`
    }
    // Notify on ALL task completions so Jairo can review
    const brand = task.tenant || 'unknown'
    const threadLink = task.thread_id ? `\nThread: <#${task.thread_id}>` : ''
    return `${mention} **Task done** [${brand}]: "${topic}"${threadLink}`
}

function resetDailyLimitsIfNewDay(limits) {
    const today = new Date().toISOString().split('T')[0]
    if (limits.date !== today) {
        return { date: today, perTenant: {}, perAssignee: {}, global: 0 }
    }
    return limits
}

function checkDailyLimits(task, config, limits) {
    const tenantLimit = config.dailyLimits?.perTenant?.[task.tenant] ?? config.dailyLimits?.perTenant?.default ?? 2
    const assigneeLimit = config.dailyLimits?.perAssignee?.[task.assignee] ?? config.dailyLimits?.perAssignee?.default ?? 3
    const globalLimit = config.dailyLimits?.global ?? 10

    const tenantUsed = limits.perTenant[task.tenant] || 0
    const assigneeUsed = limits.perAssignee[task.assignee] || 0
    const globalUsed = limits.global || 0

    if (tenantUsed >= tenantLimit) return { allowed: false, reason: `Tenant ${task.tenant} daily limit reached (${tenantUsed}/${tenantLimit})` }
    if (assigneeUsed >= assigneeLimit) return { allowed: false, reason: `Assignee ${task.assignee} daily limit reached (${assigneeUsed}/${assigneeLimit})` }
    if (globalUsed >= globalLimit) return { allowed: false, reason: `Global daily limit reached (${globalUsed}/${globalLimit})` }
    return { allowed: true }
}

function incrementDailyLimits(task, limits) {
    limits.perTenant[task.tenant] = (limits.perTenant[task.tenant] || 0) + 1
    limits.perAssignee[task.assignee] = (limits.perAssignee[task.assignee] || 0) + 1
    limits.global = (limits.global || 0) + 1
    saveDailyLimits(limits)
}

function getDefaultSessionDbPath() {
    return `${process.env.HOME || process.env.USERPROFILE}/.kimaki/discord-sessions.db`
}

function lookupSessionId(threadId, sessionDbPath) {
    if (!threadId || !existsSync(sessionDbPath)) return null
    try {
        const sdb = new Database(sessionDbPath)
        sdb.exec('PRAGMA busy_timeout = 3000')
        const row = sdb.query('SELECT session_id FROM thread_sessions WHERE thread_id = ?').get(threadId)
        sdb.close()
        return row ? row.session_id : null
    } catch { return null }
}

function loadAgentMapping() {
    const mappingPath = join(dirname(fileURLToPath(import.meta.url)), '..', 'config', 'agent-mapping.json')
    try {
        const raw = readFileSync(mappingPath, 'utf8')
        return JSON.parse(raw)
    } catch {
        return {}
    }
}

const MODEL_OVERRIDES = {
    'harper': 'zai/glm-5.1',
    'writer': 'zai/glm-5.1',
}

function getModelForAssignee(assignee) {
    return MODEL_OVERRIDES[assignee] || null
}

function getNextProvider(assignee) {
    const providers = {
        'researcher': ['gemini', 'sonnet', 'opus'],
        'writer': ['sonnet', 'opus', 'gemini'],
        'build': ['sonnet', 'gemini', 'opus'],
        'cro-auditor': ['sonnet', 'opus'],
        'default': ['sonnet', 'gemini', 'opus']
    }
    const list = providers[assignee] || providers.default
    return list[Math.floor(Math.random() * list.length)]
}

const TENANT_CHANNELS = {
    'ai-employee-setup': '1517784870225449102',
    'natureshares': '1517784525327831120',
    'enchantents': '1517784706278621244',
    'nomadixgear': '1517784331458711602',
    'nomadixgear-sa': '1517784331458711602',
    'aiwithjai': '1485339133608988753',
    'madamgroovy': '1517785073187819681',
    'harper': '1503480258442301571',
    'teyoapa': '1481846036786843853',
}

function getChannelForTenant(tenant) {
    return TENANT_CHANNELS[tenant] || null
}

function resolveAgent(assignee, mapping, fallback = 'build') {
    if (!assignee || assignee === 'unassigned') return fallback
    for (const [agent, roles] of Object.entries(mapping)) {
        if (roles.includes(assignee)) return agent
    }
    return fallback
}

const TENANT_WORKDIRS = {
    'ai-employee-setup': '/Users/clawdbot/clawd/businesses/huckleberry/platform/ai-employee-setup',
    'natureshares': '/Users/clawdbot/clawd/businesses/natureshares',
    'enchantents': '/Users/clawdbot/clawd/businesses/nomadixgear-sa/enchantents',
    'nomadixgear': '/Users/clawdbot/clawd/businesses/nomadixgear-sa',
    'nomadixgear-sa': '/Users/clawdbot/clawd/businesses/nomadixgear-sa',
    'aiwithjai': '/Users/clawdbot/clawd/businesses/aiwithjai',
    'madamgroovy': '/Users/clawdbot/clawd/businesses/madamgroovy',
    'harper': '/Users/clawdbot/clawd/businesses/harper',
    'teyoapa': '/Users/clawdbot/clawd/businesses/teyoapa',
}

function getWorkdirForTenant(tenant, defaultWorkdir) {
    return TENANT_WORKDIRS[tenant] || defaultWorkdir
}

const args = process.argv.slice(2)

function parseFlags(argv) {
    const flags = { interval: '30', once: false }
    for (let i = 0; i < argv.length; i++) {
        const arg = argv[i]
        if (arg === '--once') flags.once = true
        else if (arg === '--daily-limits') flags.dailyLimits = true
        else if (arg === '--reset-daily-limits') flags.resetDailyLimits = true
        else if (arg.startsWith('--')) {
            flags[arg.slice(2)] = argv[i + 1]
            i++
        }
    }
    return flags
}

const flags = parseFlags(args)
    const dbPath = flags.db || getDefaultDbPath()
    const sessionDbPath = flags['session-db'] || getDefaultSessionDbPath()
    const intervalMs = Number(flags.interval || 30) * 1000
    const kimakiBin = flags.kimaki || process.env.KIMAKI_BIN || 'kimaki'
    const notifyChannel = flags.channel || process.env.KIMAKI_KANBAN_CHANNEL
    const notifyThread = flags.thread || process.env.KIMAKI_KANBAN_THREAD
    const notifyUser = flags.user || process.env.KIMAKI_KANBAN_USER
    const workerAgent = flags.agent || process.env.KIMAKI_KANBAN_AGENT || 'build'
    const maxConcurrency = Number(flags['max-concurrency'] || flags.maxConcurrency || 1)
    const tenantFilter = flags.tenant || process.env.KIMAKI_KANBAN_TENANT || null

const config = loadDispatcherConfig()
let dailyLimits = loadDailyLimits()
dailyLimits = resetDailyLimitsIfNewDay(dailyLimits)

if (flags.dailyLimits) {
    console.log('=== DAILY LIMITS STATUS ===')
    console.log(`Date: ${dailyLimits.date}`)
    console.log(`Global: ${dailyLimits.global || 0}/${config.dailyLimits?.global || 10}`)
    console.log('')
    console.log('Per Tenant:')
    for (const [tenant, limit] of Object.entries(config.dailyLimits?.perTenant || {})) {
        const used = dailyLimits.perTenant[tenant] || 0
        console.log(`  ${tenant}: ${used}/${limit}`)
    }
    console.log('')
    console.log('Per Assignee:')
    for (const [assignee, limit] of Object.entries(config.dailyLimits?.perAssignee || {})) {
        const used = dailyLimits.perAssignee[assignee] || 0
        console.log(`  ${assignee}: ${used}/${limit}`)
    }
    process.exit(0)
}

if (flags.resetDailyLimits) {
    dailyLimits = { date: new Date().toISOString().split('T')[0], perTenant: {}, perAssignee: {}, global: 0 }
    saveDailyLimits(dailyLimits)
    console.log('Daily limits reset for today')
    process.exit(0)
}

initDb(dbPath)
const agentMapping = loadAgentMapping()

function buildPrompt(task) {
    const full = getTask(connectDb(dbPath), task.id)
    const parentResults = (full.parentResults || [])
        .map(p => {
            let line = `- ${p.id} (${p.status}) ${p.title}: ${p.result || ''}`
            // Extract deliverable file paths from parent metadata
            const parentMeta = p.metadata || {}
            const parentDels = parentMeta.deliverables
            if (parentDels && Array.isArray(parentDels) && parentDels.length > 0) {
                const paths = parentDels.map(d => typeof d === 'string' ? d : d.path).filter(Boolean)
                if (paths.length) line += `\n  Deliverable files: ${paths.join(', ')}`
            }
            return line
        })
        .join('\n')

    const comments = (full.comments || []).slice(-3).map(c => `> ${c.author}: ${c.body}`).join('\n')

    const skills = (full.skills || []).filter(Boolean)
    const skillInstructions = skills.length
        ? `Load these skills via the \`skill()\` tool and follow their instructions:\n${skills.map(s => `  - \`skill("${s}")\` — load and follow`).join('\n')}\n`
        : ''

    const workspaceRoot = process.env.KIMAKI_KANBAN_WORKSPACE || '/Users/clawdbot/clawd'

    return `[Kanban] ${task.title}

${task.body || ''}

${skillInstructions}

${parentResults ? `Parent results:\n${parentResults}` : ''}
${comments ? `\nHistory:\n${comments}` : ''}

## File paths
Workspace root: ${workspaceRoot}
All deliverable paths are relative to the workspace root. Read input files from there and write outputs there.
Example: \`businesses/aiwithjai/content/_drafts/article.md\` means \`${workspaceRoot}/businesses/aiwithjai/content/_drafts/article.md\`

## Scope boundary — READ THIS
You are assigned ONE task. Complete ONLY this task. Do NOT start other tasks, do NOT optimize other pages, do NOT fix other issues. Stop after finishing this task.

## Context budget — CRITICAL
- Write outputs to disk IMMEDIATELY. Do not hold content in your conversation memory.
- Do NOT load image/media files into context. Save generated images to disk and reference by path.
- If your context is getting large, PRIORITIZE writing your deliverable file over doing additional research.
- Use ctx_execute_file for file analysis instead of reading raw file contents.
- If you receive a "context was compacted" message, you have lost your task. Call \`kanban block ${task.id} --reason "context compacted"\` immediately.

When done: bun ${resolve('src/cli.mjs')} complete ${task.id} --summary "..." --deliverable "path/to/output.md"
  (use --deliverable for each file you produced — this lets the audit verify completion)
  The system will VERIFY that deliverable files exist and meet minimum size requirements before accepting completion.
  Do NOT call complete without first writing your output file to disk.
If blocked: bun ${resolve('src/cli.mjs')} block ${task.id} --reason "..."`
}

function runKimakiTask(task) {
    if (kimakiBin.includes('/') && !existsSync(kimakiBin)) {
        throw new Error(`kimaki binary not found: ${kimakiBin}`)
    }
    if (!notifyThread && !notifyChannel) {
        throw new Error('dispatcher needs --thread or --channel to spawn a Kimaki worker session')
    }

    const db = connectDb(dbPath)
    const runId = startRun(db, task.id, { assignee: task.assignee })
    const threadId = notifyThread || notifyChannel
    db.query('UPDATE tasks SET thread_id = ? WHERE id = ?').run(String(threadId), task.id)
    db.close()

    const fullTask = getTask(connectDb(dbPath), task.id)
    const provider = fullTask.metadata?.provider || null
    const providerArg = provider ? ['--provider', provider] : []

    const tenantChannel = getChannelForTenant(task.tenant)
    const channelArg = tenantChannel ? ['--channel', tenantChannel] : ['--channel', notifyChannel]

    const prompt = buildPrompt(task)
    const userArgs = notifyUser ? ['--user', notifyUser] : []
    const resolvedAgent = resolveAgent(task.assignee, agentMapping, workerAgent)
    const agentArg = ['--agent', resolvedAgent]
    const modelOverride = getModelForAssignee(task.assignee)
    const modelArg = modelOverride ? ['--model', modelOverride] : []

    const child = spawn(kimakiBin, ['send', '--prompt', prompt, ...agentArg, ...modelArg, ...userArgs, ...channelArg, ...providerArg], {
        cwd: undefined,
        env: {
            ...process.env,
            KIMAKI_KANBAN_TASK: task.id,
            KIMAKI_KANBAN_DB: dbPath,
            KIMAKI_KANBAN_RUN: String(runId),
            KIMAKI_KANBAN_NOTIFY_CHANNEL: tenantChannel || notifyChannel || '',
        },
        stdio: ['ignore', 'pipe', 'pipe'],
    })

    let stderr = ''
    let stdout = ''
    child.stderr.on('data', chunk => { stderr += chunk.toString() })
    child.stdout.on('data', chunk => {
        stdout += chunk.toString()
        process.stdout.write(`[${task.id}] ${chunk}`)
    })

    let idPolled = false
    const pollInterval = setInterval(() => {
        if (idPolled) { clearInterval(pollInterval); return }
        const threadMatch = stdout.match(/\/channels\/\d+\/(\d+)/)
        if (!threadMatch || threadMatch[1] === notifyChannel) return
        const threadId = threadMatch[1]
        const sessionId = lookupSessionId(threadId, sessionDbPath)
        if (!sessionId) return
        const db2 = connectDb(dbPath)
        db2.query('UPDATE tasks SET thread_id = ?, session_id = ? WHERE id = ?').run(threadId, sessionId, task.id)
        db2.query("UPDATE task_runs SET session_id = ? WHERE task_id = ? AND status = 'running'").run(sessionId, task.id)
        db2.close()
        idPolled = true
        clearInterval(pollInterval)
        console.log(`[${task.id}] resolved thread=${threadId} session=${sessionId}`)
    }, 2000)

    child.on('exit', code => {
        const db2 = connectDb(dbPath)
        const latest = getTask(db2, task.id)
        if (code !== 0 && latest && latest.status === 'running') {
            const errorMsg = `worker exited with code ${code}; ${stderr.slice(-1000)}`
            
            const isRateLimited = /rate.?limit|too many requests|429|quota exceeded/i.test(stderr)
            
            if (isRateLimited && latest.consecutive_failures < (latest.max_retries || 3)) {
                const newProvider = getNextProvider(latest.assignee)
                console.log(`[${task.id}] Rate limited, switching to ${newProvider} and retrying...`)
                
                db2.query('UPDATE tasks SET metadata = json_set(COALESCE(metadata, "{}"), "$.provider", ?) WHERE id = ?').run(newProvider, task.id)
                db2.query('UPDATE tasks SET cooldown_until = 0, consecutive_failures = consecutive_failures + 1 WHERE id = ?').run(task.id)
            } else {
                failRun(db2, task.id, errorMsg)
            }
        } else {
            // Task succeeded - clear provider override
            db2.query('UPDATE tasks SET metadata = json_remove(COALESCE(metadata, "{}"), "$.provider") WHERE id = ?').run(task.id)
            
            const threadMatch = stdout.match(/\/channels\/\d+\/(\d+)/)
            if (threadMatch && threadMatch[1] !== notifyChannel) {
                const threadId = threadMatch[1]
                db2.query('UPDATE tasks SET thread_id = ? WHERE id = ?').run(threadId, task.id)
                const sessionId = lookupSessionId(threadId, sessionDbPath)
                if (sessionId) {
                    db2.query('UPDATE tasks SET session_id = ? WHERE id = ?').run(sessionId, task.id)
                    db2.query("UPDATE task_runs SET session_id = ? WHERE task_id = ? AND status = 'running'").run(sessionId, task.id)
                }
            }
        }
        // Send user notification for hooks/publish task completion
        const completed = getTask(db2, task.id)
        if (completed && completed.status === 'done') {
            const notif = checkTaskNotification(completed)
            if (notif) {
                sendDiscordNotification(notifyChannel, notif)
                console.log(`[${task.id}] sent user notification: hooks/publish completed`)
            }
        }
        db2.close()
    })

    console.log(`spawned ${task.id} (${task.assignee}) via kimaki send pid=${child.pid} [channel: ${tenantChannel || notifyChannel}]`)
}

const recentlySpawned = new Map()

function dispatchOnce() {
    const db = connectDb(dbPath)
    const running = countRunningTasks(db)
    const available = Math.max(0, maxConcurrency - running)
    if (available <= 0) { db.close(); return 0 }
    const opts = {}
    if (tenantFilter) opts.tenant = tenantFilter
    
    dailyLimits = resetDailyLimitsIfNewDay(dailyLimits)
    
    const tasks = getDispatchable(db, opts).filter(t => {
        const lastSpawn = recentlySpawned.get(t.id)
        if (lastSpawn && Date.now() - lastSpawn < intervalMs * 2) return false
        
        const limitCheck = checkDailyLimits(t, config, dailyLimits)
        if (!limitCheck.allowed) {
            console.log(`[${t.id}] SKIPPED: ${limitCheck.reason}`)
            return false
        }
        return true
    }).slice(0, available)
    db.close()
    for (const task of tasks) {
        try {
            recentlySpawned.set(task.id, Date.now())
            incrementDailyLimits(task, dailyLimits)
            runKimakiTask(task)
        } catch (err) {
            recentlySpawned.delete(task.id)
            const db2 = connectDb(dbPath)
            failRun(db2, task.id, err instanceof Error ? err.message : String(err))
            db2.close()
        }
    }
    for (const [id, ts] of recentlySpawned) {
        if (Date.now() - ts > intervalMs * 3) recentlySpawned.delete(id)
    }
    return tasks.length
}

const count = dispatchOnce()
console.log(`dispatch tick: ${count} task(s)`)

if (!flags.once) {
    setInterval(() => {
        const n = dispatchOnce()
        if (n) console.log(`dispatch tick: ${n} task(s)`)
    }, intervalMs)
}