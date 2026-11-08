---
name: x-post-generator-openclaw
description: "Generate complete X/Twitter posts using 2026 best practices. Includes brand voice loading, proven hook patterns, self-scoring, and humanizer +..."
depends-on: [hook-generator, humanizer, quality-gate, sharp-thesis-validator]
---

# X Post Generator for OpenClaw

Transform a selected hook into a complete, scored X post or thread. Uses Gemini CLI (free, no API keys).

**This skill = the script.** The script generates a draft + self-score. The agent running this skill MUST chain humanizer + quality-gate afterward.

## Pipeline (MANDATORY)

```
hook-generator → sharp-thesis-validator (social) → user selects hook → this script → humanizer skill → quality-gate (mode: x)
                                  ↓ FAIL = BLOCK
                                  ↓ PASS = continue
                                                                         ↓
                                                                    PASS → present to user
                                                                    FAIL → rewrite (max 3 loops)
```

**Sharp-Thesis Validation (Phase 0):** Before proceeding, validate the hook passes the Cerebras Test in social mode:
```
sharp-thesis-validator --mode social --brand {brand} "{hook}"
```
- PASS: Proceed to script execution
- FAIL: STOP, return reframing suggestions

**Awareness Gate (Phase 00, MANDATORY):** Before hook generation, determine the target audience's awareness level. See `references/awareness-level-guide.md`. If unclear from context, ask the user.

**The script does NOT replace humanizer or quality-gate.** It produces a draft. Those skills validate it.

## What the Script Does

1. Loads brand voice from `brand/voice-dna.md` (first priority), then falls back to `brand/voice-profile.md` or `brand-assets/voice-guide.md`
2. Loads ICP + pain points from `icp-profile.md`
3. Loads proven Twitter hook patterns from `hook-generator/database/twitter-hooks.json`
4. Generates single post or thread via Gemini CLI
5. Applies regex humanization (basic)
6. Self-scores on 5 dimensions (hook_strength, voice_authenticity, specificity, value_density, algorithm_fit)
7. Saves post + metadata to `/tmp/xpost-{timestamp}.txt` and `.json`
8. Exits with code 2 if self-score says REWRITE

## What the Agent Must Do After

1. Read the saved draft
2. Run **humanizer** skill on it (full AI-pattern removal, not just regex)
3. Spawn **quality-gate** with `mode: x` and the draft path
4. If FAIL: rewrite with feedback, max 3 loops
5. If PASS: present to user

## Usage

```bash
# Single post
node scripts/generate-x-post.js \
  --hook "I cut my AI memory by 99%. The result?" \
  --topic "lightweight AI tools" \
  --brand aiwithjai \
  --objective engagement

# Thread
node scripts/generate-x-post.js \
  --hook "I rewrote my entire stack in Rust..." \
  --topic "Rust for indie hackers" \
  --brand aiwithjai \
  --objective engagement \
  --thread
```

### Parameters

| Param | Required | Description |
|-------|----------|-------------|
| `--hook` | Yes | Selected hook from hook-generator |
| `--topic` | Yes | Topic for context |
| `--brand` | No | Brand name (loads voice + ICP from brand/ dir) |
| `--objective` | No | `engagement` (default), `blog-traffic`, `authority` |
| `--format` | No | `single` (default) or `thread` |
| `--thread` | No | Shorthand for `--format thread` |

### Objectives

1. **engagement**: Reveal 90-95%. Max replies/shares.
2. **blog-traffic**: Reveal 50%, tease 50%. DM for link.
3. **authority**: Reveal 70-80%. Methodology focus.

## Brand Resolution

The script searches these roots for brand dirs:
- `./businesses/{brand}/`
- `/Users/Shared/clawd/newsletter/brands/{brand}/`

Looks for: `voice-dna.md` (first priority), `voice-profile.md`, `voice-guide.md`, `icp-profile.md`, `audience.md`

## 2026 X Algorithm Rules (Built Into Prompt)

**Do:**
- No external URLs (30-60% reach penalty)
- Reply to every reply in first 30-60 min
- "Save this" / "Bookmark" CTAs (saves weighted heavily)
- Short punchy lines with white space
- Lead with failed stories over success stories

**Don't:**
- Include external URLs
- Edit post after 10+ min (algo reset)
- Use more than 2 hashtags
- Post without humanization

## Self-Scoring Dimensions

| Dimension | Weight | What it checks |
|-----------|--------|---------------|
| hook_strength | High | Does the opening stop the scroll? |
| voice_authenticity | High | Sounds human, not AI? |
| specificity | Med | Concrete details vs vague claims? |
| value_density | Med | Useful info per character? |
| algorithm_fit | Low | 2026 X algo friendly? |

Exit code 2 = self-score failed, agent must humanize + quality-gate before presenting.

## Files

- `scripts/generate-x-post.js` — Main entry (Gemini CLI, no API keys)
- `database/twitter-hooks.json` — Proven hooks with engagement data (in hook-generator skill)

## Models

All via Gemini CLI (free tier, no API key needed):
- Generation: gemini-2.5-flash-lite
- Self-scoring: gemini-2.5-flash-lite

## Cost

$0.00 — all Gemini CLI free tier.
