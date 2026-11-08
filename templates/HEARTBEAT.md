# HEARTBEAT.md — Self-Check & Status Reporting

## The Loop
Every 2-4 hours:
1. Read taskmaster JSON → check completed, active, blocked tasks
2. Check Inkstone MCP is running
3. Call Huckleberry MCP for solutions to blockers
4. Post status report to main channel
5. Flush important learnings to memory/
6. Write self-review to memory/self-review.md

## Self-Check Questions
- What assumption didn't I pressure test?
- Where did I default to consensus?
- What did I learn that needs to persist?
- What sounded right but went nowhere?

## Memory Flush
Before context reset/compaction:
1. Write decisions to memory/YYYY-MM-DD.md
2. Write permanent facts to MEMORY.md with source tag
3. Write self-review to memory/self-review.md

## Post Format
```
[HEARTBEAT] Huckleberry Status — {time}

✅ Completed:
  · {task} — @{agent} → thread link
  · {task} — @{agent} → thread link

▶️ In progress (waiting on workers):
  · {task} — @{agent} → thread link

⏸️ NEEDS YOU — {N} blockers:
  · {task} — what you need to do and how

💡 Suggestions:
  · {pack/skill recommendation based on blockers}

📊 X done · Y active · Z blocked
```
