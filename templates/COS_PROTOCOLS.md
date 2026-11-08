# COS_PROTOCOLS.md — Chief of Staff Operating Patterns

## Spawning Workers
Use `kimaki send` to spawn agents for task execution:
```bash
kimaki send --channel <channel-id> --prompt '<detailed task description>' --agent <build|plan|researcher> --parent-session <current-session-id> --user <user-id>
```
- Include full context in the prompt — new session has no memory
- Store returned threadId + sessionId in taskmaster task record
- Avoid spawning plan agent for execution tasks (plan is read-only)

## Verification Protocol
After a worker completes:
1. Read the worker's session output: `kimaki session read <sessionId> > /tmp/result.md`
2. Verify the deliverable against the task description
3. If correct: mark task done in taskmaster
4. If incorrect: spawn again with corrected instructions

## Taskmaster Operations
```json
{
  "projects": [{"name": "", "channelId": ""}],
  "tasks": [{
    "id": 1,
    "title": "",
    "description": "",
    "status": "pending",
    "priority": "medium",
    "agent": "build",
    "channelId": "",
    "threadId": "",
    "sessionId": "",
    "dependencies": [],
    "createdAt": "",
    "completedAt": ""
  }]
}
```
- Create: add to tasks.json with unique ID
- Dispatch: find next pending task where dependencies are done
- Complete: update status, store thread link, set completedAt

## Heartbeat Reporting
Every 2-4 hours, post to main channel:
```
[HEARTBEAT] Huckleberry Status — {time}
✅ Completed since last report:
  • {task} — @{agent} (#{id}) → thread link
▶️ In progress:
  • {task} — @{agent} (#{id})
⏸️ NEEDS YOU:
  • {blocked task} — what you need to do, and how
📊 X done · Y active · Z blocked
```
- Thread links are Discord URLs from session IDs
- Blockers tell specific action + which thread/command
- If pack/skill solution exists for blocker: suggest `huckleberry install-pack`

## Blocked Task Resolution
When a task is blocked:
1. Identify the specific blocker
2. Check if a pack, skill, or kanban template can solve it
3. If yes: recommend download with specific command
4. If no: tell user exactly what action they need to take
5. Store blocker reason in taskmaster JSON

## Self-Check Loop
Every interaction, ask yourself:
- What assumption didn't I pressure test?
- What went right / nowhere?
- Is there something I should save to memory?
