---
name: voice-extraction
description: "Reverse-engineer any person's writing voice from their content. Paste in posts, articles, tweets, or essays and this skill launches 10 parallel..."
---

# /voice-extraction — Universal Voice DNA Extraction

Reverse-engineer anyone's writing voice from their actual writing. Produces a structured `voice-dna.md` that lets any writer or AI replicate that voice accurately.

Works with any source: files, NLM notebooks, URLs, raw text, social archives. Model-agnostic — runs on whatever model is in the session (GLM-5.1, Gemini Flash, Qwen, etc.). No Anthropic dependency.

---

## When to Use

- "Extract my voice from these journal entries"
- "Analyze how this person writes"
- "Build a voice profile from my content"
- "Match this voice" / "Make me sound like this"
- "Study this writing and create a voice file"
- Replacing a generic voice-profile.md with one built from real source material
- Setting up brand voice before any content generation

---

## Three Modes

| Mode | Input | Output |
|------|-------|--------|
| **extract** | Source material (any combination) | `voice-dna.md` |
| **validate** | Content draft + `voice-dna.md` | Score (0-100) + specific fixes |
| **inject** | `voice-dna.md` + target context | System prompt addition |

---

## Mode 1: Extract

### Step 1: Collect Sources

Gather writing samples from one or more sources. Minimum: 500 words (one article, 5+ posts, or 10+ tweets). More is better — patterns need repetition.

**Source types supported:**

| Source | How to Collect |
|--------|---------------|
| **Local files** | Glob for `.md`, `.txt` files — `--files "~/journals/*.md"` |
| **NLM notebook** | Query via `nlm` CLI — `--nlm "<notebook-id>"` |
| **URLs** | Fetch web pages — `--url "https://..."` |
| **Raw text** | Paste directly — `--text "..."` |
| **birdclaw DB** | Pull original tweets — `--birdclaw "@handle"` |
| **Stdin** | Pipe text in — `echo "text" \| --stdin` |

Use `scripts/collect-sources.sh` for automated collection:

```bash
# From local files
bash scripts/collect-sources.sh --files "~/writing/*.md" --output corpus.txt

# From NLM notebook
bash scripts/collect-sources.sh --nlm "notebook-id-here" --output corpus.txt

# Mixed sources
bash scripts/collect-sources.sh --files "~/drafts/*.md" --url "https://blog.com/post" --output corpus.txt
```

Or collect manually — the corpus is just text. The skill doesn't require the script.

### Step 2: Normalize (Optional)

If the corpus has YAML frontmatter, source markers, or messy formatting:

```bash
node scripts/build-corpus.js raw-input.txt --output clean-corpus.txt
```

This strips frontmatter, normalizes whitespace, and reports word count.

### Step 3: Run Extraction

Load `references/extraction-prompt.md` and feed it the corpus. This is a single deep analysis pass — no multi-subagent fan-out needed. The large context windows of modern models (GLM-5.1 at 200K, Gemini Flash at 1M, Qwen at 1M) handle the full corpus in one shot.

**For large corpora (50K+ words):**

1. Split into sections of ~30K words each
2. Run the extraction prompt on each section
3. Run the synthesis prompt (in `extraction-prompt.md`) to combine the section analyses into one voice-dna.md

**For small corpora (under 500 words):**

Use the Quick Extraction Prompt instead — it's lighter and faster.

### Step 4: Save Output

Save the result following `references/voice-dna-template.md` format.

**Location:**
- If this is the canonical brand voice: `brand/voice-dna.md`
- If extracting a specific person's voice: `brand/voices/[name].md`
- If standalone: `./voice-dna.md`

**Important:** If a `voice-profile.md` exists in the same brand directory, the new `voice-dna.md` supersedes it. Note this in the output and flag for the correction leak prevention step (grep for stale references to the old file).

---

## Mode 2: Validate

Score content against an existing `voice-dna.md`.

### Process

1. Load the `voice-dna.md`
2. Load the content draft to validate
3. Check against the **Validation Criteria** section of the voice-dna:
   - Count how many MUST HAVE patterns are present
   - Count how many SHOULD HAVE patterns are present
   - Check for any KILL FLAGS (instant fail patterns)
4. Output:
   - Overall score (0-100, weighted)
   - Category breakdown
   - Specific fixes needed (quote the voice-dna rule, show what to change)
   - Verdict: PASS / REVISE / FAIL

### Scoring

```
MUST HAVE patterns (each present = +15 pts, max 60)
SHOULD HAVE patterns (each present = +10 pts, max 30)
No KILL FLAGS (each kill flag = -25 pts)
Natural feel bonus (reviewer judgment = 0-10 pts)

PASS = 80+
REVISE = 60-79
FAIL = <60 or any KILL FLAG triggered
```

---

## Mode 3: Inject

Wire a `voice-dna.md` into a content generation context.

### Process

1. Load the `voice-dna.md`
2. Identify the target context (a skill, a system prompt, a content brief)
3. Extract the most relevant sections for the target:
   - For tweets: Voice Signatures + DO/DON'T pairs + Twitter platform adaptation
   - For blog posts: Sentence Architecture + Thematic Anchors + Blog platform adaptation
   - For newsletters: Emotional Patterns + Newsletter platform adaptation + Thematic Anchors
4. Format as a system prompt addition:

```
## Voice DNA (MUST FOLLOW)

### Voice Signatures
[Relevant signatures with examples]

### DO / DON'T
[Relevant pairs]

### Kill Flags
[What to never do]

### Validation Checklist
[MUST HAVE / KILL FLAGS for self-checking]
```

5. Inject into the target context

---

## Extraction Quality Rules

### The output must be CONCRETE, not abstract

| BAD (useless) | GOOD (actionable) |
|---------------|-------------------|
| "Confident tone" | "Uses 2-4 word fragments for emphasis: 'Four hours daily. Copying. Pasting.'" |
| "Professional voice" | "Opens with a provocation, never a pleasantry. First sentence always makes a claim." |
| "Engaging writing" | "Alternates between 3-word fragments and 25-word explanation sentences. The rhythm creates tension." |
| "Authentic" | "Shares specific failures ('lost $6,500 to an agent error') before sharing wins." |

### Every claim needs evidence

- Every voice signature must have 2-3 verbatim quotes from the corpus
- Every DO/DON'T pair must be based on observed patterns, not guesses
- If the corpus doesn't show enough evidence for a section, say "Insufficient data" rather than guessing

### Anti-patterns to avoid in the output

- Generic personality descriptors ("confident", "professional", "authentic")
- Advice instead of analysis ("be more specific" is advice, not a pattern)
- Summarizing content instead of analyzing voice (WHAT they write about, not HOW)
- Vague hedge words ("tends to", "often", "generally") — quote the text or don't claim it

---

## File Structure

```
voice-extraction/
├── SKILL.md                              # This file
├── scripts/
│   ├── collect-sources.sh                # Multi-source text collection
│   └── build-corpus.js                   # Normalize + combine sources
└── references/
    ├── extraction-prompt.md              # Master analysis prompt (core IP)
    ├── voice-dna-template.md             # Output format specification
    └── voice-elements.md                 # Prior extraction example (Jairo's journal)
```

---

## Model Compatibility

This skill is model-agnostic. It works with:

- **GLM-5.1** (200K context) — handles ~30K word corpora in one pass
- **Gemini 2.5 Flash** (1M context) — handles ~150K word corpora in one pass
- **Qwen3 Coder** (1M context) — handles ~150K word corpora in one pass
- **Any model with 32K+ context** — use chunked extraction for larger corpora

**No Anthropic dependency.** No Claude-specific tools. No "Claude in Chrome." No multi-subagent fan-out. The extraction is a single deep analysis pass leveraging large context windows.

---

## Related Skills

- **brand-voice** — builds voice from interview or website scrape (lighter weight)
- **x-post-generator-openclaw** — reads voice-dna.md for tweet generation
- **copywriting** — reads voice-dna.md for marketing copy
- **hook-generator** — reads voice-dna.md for hook pattern matching
- **quality-gate** — can use voice-dna validation criteria for scoring
- **notebooklm-journal-voice** — legacy NLM-specific skill, now superseded by this skill's NLM source adapter
