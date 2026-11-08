---
name: taskmaster
description: >
  Taskmaster task management system. Use when working with task files,
  creating tasks, updating statuses, or finding the next task to execute.
version: 1.0.0
---

# Taskmaster — Task Management System

## When to Use
- You are dispatched to complete a task
- You need to create, update, or find tasks
- A user asks you to track work items

## Task File Structure
Task data lives in JSON files at `.huckleberry/taskmaster/tasks/tasks.json`.

```json
{
  "projects": [{
    "name": "main",
    "channelId": ""
  }],
  "tasks": [{
    "id": 1,
    "title": "Task title",
    "description": "What needs doing",
    "status": "pending",
    "priority": "high",
    "agent": "build",
    "channelId": "",
    "threadId": "",
    "sessionId": "",
    "dependencies": [],
    "blocker_reason": null,
    "createdAt": "2026-07-25T12:00:00Z",
    "completedAt": null
  }]
}
```

## Commands

### Find next task
```bash
node .huckleberry/taskmaster/next-task.js
node .huckleberry/taskmaster/next-task.js --in-progress
node .huckleberry/taskmaster/next-task.js --tag research
```

### Update task status
```bash
node .huckleberry/taskmaster/update-status.js 1 done
node .huckleberry/taskmaster/update-status.js 1 blocked --note="Need API key"
```

### Valid Statuses
- `pending` — Not started
- `in-progress` — Actively working
- `done` — Completed successfully
- `blocked` — Needs human input
- `review` — Awaiting approval
- `deferred` — Postponed

## Worker Completion Protocol
1. Receive task via prompt
2. Complete the work
3. Update task status: `node .../update-status.js <id> done`
4. Include summary of what was done

## Dispatcher Integration
The dispatcher cron runs every 30 minutes:
1. Reads tasks.json
2. Picks highest-priority task with dependencies met and rotation fairness
3. Spawns worker via kimaki send
4. Stores threadId + sessionId in task record
5. On completion: stores completedAt + result summary
