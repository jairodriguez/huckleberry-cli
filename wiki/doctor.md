# Hermes — The Doctor

Hermes is Huckleberry's system administrator. When anything in the stack breaks — the Discord bot stops responding, sessions won't spawn, a config file gets corrupted — Hermes is the agent that diagnoses and repairs it.

## How to Use Hermes

### In Discord
Create a dedicated **#system-repair** channel and bind the `hermes` agent to it (see `discord.md`, "Channel Bindings"). When anything feels broken, go to that channel and say **"fix it"** — or describe the symptom ("bot is not responding", "sessions won't start", "Discord is dead").

Hermes will:
1. Run the full diagnostic
2. Identify the root cause
3. Apply the repair
4. **Verify with a live test** before telling you it's fixed
5. Report: what broke, why, what changed, proof it works

### From the terminal
```bash
huckleberry doctor    # non-interactive health check — all systems at a glance
```
If doctor shows failures, hand it to Hermes:
```bash
opencode run --agent hermes "huckleberry doctor shows failures — diagnose and repair per ~/.huckleberry/agents/hermes/hermes-fixer.md"
```

## Automatic Monitoring

The install registers a **doctor watchdog** that runs every 5 minutes (macOS: launchd; Windows: Task Scheduler). It checks:

- opencode + kimaki installed and runnable
- `~/.opencode/opencode.json` parses as valid JSON
- Inkstone + Jev MCP servers installed
- Disk space (alerts under 2GB)

On a failure it:
1. Posts an alert to your doctor Discord channel — if you set `DOCTOR_WEBHOOK_URL` in `~/.huckleberry/.env`
2. Spawns Hermes to attempt an automatic repair
3. Alerts only on state **changes** (healthy→broken, broken→healed) — no spam

## Weekly Self-Improvement

A second service runs a **self-improvement sweep** once a week:
- Reviews the week's failures and corrections in Inkstone memory
- Proposes 2–3 concrete improvements (proposals only — nothing is auto-changed)
- Writes the report to `~/.huckleberry/logs/self-improve/<date>.md` and pings the doctor channel

Run it manually anytime: `huckleberry review`

## Hermes' Boundaries

- Never prints secret values — key names only
- Never deletes your Inkstone memory database
- Verifies every fix with a live test — never "should work"
- Escalates to you after 3 real failed attempts, with exact errors and a recommended next step
