#!/usr/bin/env node
import Fastify from 'fastify'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
    addComment,
    assignTask,
    blockTask,
    completeTask,
    connectDb,
    createTask,
    getDefaultDbPath,
    getTask,
    initDb,
    listTasks,
    promoteTask,
    setTaskStatus,
    unblockTask,
} from './kanban.mjs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const dbPath = process.env.KIMAKI_KANBAN_DB || getDefaultDbPath()
initDb(dbPath)

const app = Fastify({ logger: false })

function db() { return connectDb(dbPath) }

app.get('/api/tasks', async (req) => {
    const d = db()
    const tasks = listTasks(d, req.query || {})
    d.close()
    return tasks
})

app.get('/api/tasks/:id', async (req, reply) => {
    const d = db()
    const task = getTask(d, req.params.id)
    d.close()
    if (!task) return reply.code(404).send({ error: 'not found' })
    return task
})

app.post('/api/tasks', async (req) => {
    const d = db()
    const task = createTask(d, req.body || {})
    d.close()
    return task
})

app.post('/api/tasks/:id/complete', async (req) => {
    const d = db()
    const task = completeTask(d, req.params.id, req.body || {})
    d.close()
    return task
})

app.post('/api/tasks/:id/block', async (req) => {
    const d = db()
    const task = blockTask(d, req.params.id, req.body || {})
    d.close()
    return task
})

app.post('/api/tasks/:id/unblock', async (req) => {
    const d = db()
    const task = unblockTask(d, req.params.id)
    d.close()
    return task
})

app.patch('/api/tasks/:id', async (req, reply) => {
    const d = db()
    let task = null
    if (req.body?.status) task = setTaskStatus(d, req.params.id, req.body.status)
    if (req.body?.assignee !== undefined || req.body?.skills !== undefined) {
        task = assignTask(d, req.params.id, req.body.assignee, { skills: req.body.skills })
    }
    d.close()
    if (!task) return reply.code(404).send({ error: 'not found' })
    return task
})

app.post('/api/tasks/:id/promote', async (req, reply) => {
    const d = db()
    const task = promoteTask(d, req.params.id, req.body || {})
    d.close()
    if (!task) return reply.code(404).send({ error: 'not found' })
    return task
})

app.post('/api/tasks/:id/comments', async (req) => {
    const d = db()
    const comment = addComment(d, req.params.id, req.body?.author || 'user', req.body?.body || '')
    d.close()
    return comment
})

app.get('/', async (_req, reply) => {
    const html = readFileSync(join(__dirname, '..', 'dashboard', 'index.html'), 'utf8')
    reply.type('text/html').send(html)
})

const port = Number(process.env.PORT || 4717)
app.listen({ port, host: '127.0.0.1' }).then(() => {
    console.log(`Kimaki Kanban dashboard: http://127.0.0.1:${port}`)
})
