---
name: sharp-thesis-validator
description: Validate that a topic or title passes the Sharp-Thesis (Cerebras) Test before writing begins — single arguable claim, concrete number, urgency, and title length limits. Use when validating article titles, selecting topics, planning content, or filtering NLM mindmap nodes.
---

# sharp-thesis-validator

**Purpose:** Validate that a topic/title passes the Sharp-Thesis (Cerebras) Test before writing begins. Requires a single arguable claim, a concrete number, urgency, and a title expressible in ≤80 chars (long-form) or ≤280 chars (social). Brand-agnostic — loads evergreen brand-assets for context-aware validation.

> **Invocation (two ways):**
> 1. **CLI (deterministic — for scripts, cron, kanban workers):**
>    `sharp-thesis-validator "<title>" --brand <brand> [--mode long-form|social] [--json]`
>    Installed at `~/clawd/scripts/validate-thesis.mjs`, symlinked to `~/.local/bin/sharp-thesis-validator`.
>    Exit codes: 0 = PASS, 1 = FAIL, 2 = usage error. `--json` emits the verdict schema below.
>    Note: the CLI counts only numbers present IN the title and prints rule-based fix hints.
> 2. **Interactive (for brand-aware reframe suggestions):** load via
>    `skill("sharp-thesis-validator")` — the agent can additionally enrich from brand
>    pricing/ICP files (official-pricing.md, icp-profiles.md) that the CLI does not read.

**Use when:** validating article titles, selecting topics, planning content, filtering NLM mindmap nodes, pre-checking before any writing skill, validating social post hooks.

---

## Configuration

```yaml
name: sharp-thesis-validator
description: >
  Validates topics/titles against the Sharp-Thesis (Cerebras) Test.
  Requires: single arguable claim, concrete number, urgency, title ≤80/280 chars.
  Brand-agnostic — loads evergreen brand-assets for context.
  Use when: validating titles, selecting topics, pre-writing checks.
depends-on: []
triggers:
  - validate thesis
  - sharp thesis
  - cerebras test
  - topic validation
  - is this topic sharp enough
  - validate title
  - validate hook
mode:
  - long-form  # ≤80 chars, all criteria strict
  - social     # ≤280 chars, urgency relaxed
allowed-tools:
  - Read
  - Glob
  - Bash
```

---

## Execution Flow

### Step 1: Parse Input

Extract from user input:
- **topic** or **title** (required)
- **brand** (optional, e.g., "enchantents", "nomadixgear", "aiwithjai")
- **mode** (optional, default "long-form"; options: "long-form", "social")

If no brand provided → run universal-only validation (no brand enrichment).

### Step 2: Resolve Brand Assets

```
Primary path: businesses/{parent}/{brand}/brand-assets/
Fallback path: brands/{brand}/content/00-assets/
If neither exists → proceed with universal rules only
```

**Load these files (graceful degradation — skip missing):**
| File | Purpose |
|------|---------|
| `voice-guide.md` | Title tone, writing style |
| `icp-profiles.md` | What numbers resonate with this ICP |
| `business-profile.md` | Market context, what "urgency" means |
| `brand-overrides.md` | Banned claims, positioning constraints |
| `landscape.md` | Claims blacklist |
| `thesis-config.md` | Brand-specific overrides (optional) |
| `official-pricing.md` | Dollar figures for number suggestions |
| `technical-specifications.md` | Specs for concrete numbers |

### Step 3: Load thesis-config.md (if exists)

Override universal defaults:
```yaml
# thesis-config.md example
number_style:
  currency: USD
  preferred_metrics: [ROI, payback_period, lifespan_years, replacement_cost]
  number_format: digits

title_preferences:
  max_length: 72  # override default 80
  allow_colons: false
  style: magazine_cover

urgency_triggers:
  - Hurricane season (June-November)
  - Replacement cycle year 2-3
  - New competitor entering market

banned_patterns:
  - "X is the future"
  - "Why you need X"
  - "The ultimate guide to X"

social:
  max_length: 200
  urgency_required: false
```

### Step 4: Validate Against 4 Criteria

#### Criterion 1: Single Arguable Claim
```
PASS: "X does Y because Z" — a position someone could disagree with
FAIL: "X is important" / "All about X" / survey-style topic

Test: Can a reasonable person argue against this?
```

**Detection logic:**
- Look for causal language: "because", "causes", "costs", "beats", "outperforms"
- Look for comparative language: "more than", "vs", "better than", "cheaper than"
- Reject descriptive-only: "is", "has", "includes", "about"
- Reject survey language: "guide to", "overview of", "introduction to"

#### Criterion 2: Concrete Number
```
PASS: Dollar figure, percentage, timeframe, count, ratio
FAIL: "lots of money" / "significant savings" / "many customers"

Test: Strip the number out — does the claim lose its engine?
```

**Detection logic (regex patterns):**
- Currency: `\$[\d,]+(\.\d{2})?` or `USD[\d,]+` or `€[\d,]+` or `£[\d,]+`
- Percentage: `\d+%` or `percent`
- Timeframe: `\d+\s*(years?|months?|weeks?|days?|hours?)`
- Count: `\d+\s*(units?|customers?|users?|posts?|articles?)`
- Ratio: `\d+:\d+` or `\d+x` (e.g., "10x", "3:1")

#### Criterion 3: Urgency / Why Now
```
PASS: Time-bound trigger (season, deadline, regulatory change, market shift,
      competitor failure, new data, product launch)
FAIL: "it's always been true" / evergreen only with no time delta

Test: Would this article be less urgent in 6 months?
      If no urgency delta → FAIL.
```

**Detection logic:**
- Time markers: "2026", "this year", "now", "before", "deadline", "season"
- Event markers: "launch", "change", "new", "shift", "crisis", "update"
- Comparative urgency: "vs last year", "since", "for the first time"
- Brand enrichment: check thesis-config.md for brand-specific urgency triggers

**Social mode relaxation:**
- If mode="social" AND thesis-config.social.urgency_required=false
- Then urgency is OPTIONAL
- Otherwise: required for both modes

#### Criterion 4: Title Expressibility (≤max_length chars)
```
PASS: Thesis fits in title under max_length
FAIL: Needs subtitle to make sense, or exceeds character limit

Default max_length:
  - long-form: 80 chars
  - social: 280 chars (tweet length)
Override: thesis-config.title_preferences.max_length or thesis-config.social.max_length
```

**Test:**
1. Write the title from the topic
2. Count characters (including spaces)
3. Check against limit
4. No colons-as-cheating (unless thesis-config.title_preferences.allow_colons=true)

### Step 5: Generate Output

#### On PASS (all 4 criteria met):
```json
{
  "result": "PASS",
  "title": "Why cheap glamping fabric costs more than hurricane damage",
  "title_length": 56,
  "criteria": {
    "1_claim": { "passed": true, "detected_claim": "Cheap fabric replacement cycles cost more than hurricane damage" },
    "2_number": { "passed": true, "detected_number": "$168,960 vs $25,000" },
    "3_urgency": { "passed": true, "detected_urgency": "Tropical UV degradation runs 2x faster, replacement cycles accelerating" },
    "4_title_length": { "passed": true, "length": 56, "max_allowed": 80 }
  },
  "mode": "long-form",
  "action": "PROCEED"
}
```

#### On FAIL (any criterion failed):
```json
{
  "result": "FAIL",
  "topic": "Glamping tents are durable",
  "failed_criteria": [1, 2, 3],
  "failures": {
    "1": {
      "criterion": "single_arguable_claim",
      "reason": "Not an arguable claim — 'durable' is a description, not a position",
      "fix": "Reframe as: 'X outperforms Y because Z'"
    },
    "2": {
      "criterion": "concrete_number",
      "reason": "No concrete number found",
      "fix": "Add a dollar figure, percentage, or timeframe"
    },
    "3": {
      "criterion": "urgency",
      "reason": "No time-bound urgency — true today, true in 2026, true in 2030",
      "fix": "Add a time trigger: 'before hurricane season', 'in 2026', etc."
    }
  },
  "reframe_suggestions": [
    {
      "title": "Why cheap fabric costs more than hurricane damage",
      "rationale": "Uses pricing data from brand-assets/official-pricing.md",
      "source_file": "official-pricing.md"
    },
    {
      "title": "The $2,800 cover that outlasts 5 cheaper replacements",
      "rationale": "Lifespan comparison from brand-assets/technical-specifications.md",
      "source_file": "technical-specifications.md"
    }
  ],
  "claims_blacklist_hits": [],
  "mode": "long-form",
  "action": "BLOCKED — reframe topic before proceeding"
}
```

### Step 6: Claims Blacklist Check (Always Runs)

If brand was provided AND brand-assets loaded:
1. Read `brand-overrides.md` → extract banned claims
2. Read `landscape.md` → extract "Claims Blacklist" section
3. Read `thesis-config.md` → extract `banned_patterns`
4. Check proposed title against all banned patterns
5. If hits found → add to `claims_blacklist_hits` array in output

**This check is additive — a topic can pass 4 criteria but still FAIL if it hits the blacklist.**

---

## Mode Switching

Determine mode from input:
```
--mode long-form  → use long-form limits (default)
--mode social     → use social limits
```

Or infer from calling skill:
- Called by article-generator, blog-worker, nlm-hub-spoke → long-form
- Called by social-construction, x-post-generator-openclaw, content-atomizer → social

Apply limits:
| Criterion | long-form | social |
|-----------|-----------|--------|
| Title max length | 80 (or thesis-config override) | 280 (or thesis-config.social override) |
| Urgency required | Always | Only if thesis-config.social.urgency_required != false |
| Claim (single arguable) | Required | Required |
| Number (concrete) | Required | Required |

---

## Brand-Aware Reframe Engine

When generating reframe suggestions on FAIL:

1. **Read official-pricing.md** → extract dollar figures for number suggestions
2. **Read icp-profiles.md** → match pain points to urgency triggers
3. **Read technical-specifications.md** → find concrete specs (dimensions, lifespan, materials)
4. **Read landscape.md** → check claims blacklist before suggesting
5. **Read thesis-config.md** → apply brand-specific title preferences

Generate 2-3 reframe suggestions that:
- Pass all 4 criteria
- Use brand-specific numbers/pricing
- Avoid blacklist hits
- Match voice/tone from voice-guide.md

---

## Examples

### Long-form PASS
```
Input: "Why cheap glamping fabric costs more than hurricane damage"
Brand: enchantents
Mode: long-form

Output: {
  "result": "PASS",
  "title": "Why cheap glamping fabric costs more than hurricane damage",
  "title_length": 56,
  "criteria": {...all passed...},
  "action": "PROCEED"
}
```

### Long-form FAIL
```
Input: "Glamping tents are durable"
Brand: enchantents
Mode: long-form

Output: {
  "result": "FAIL",
  "failed_criteria": [1, 2, 3],
  "failures": {...},
  "reframe_suggestions": [...],
  "action": "BLOCKED"
}
```

### Social PASS
```
Input: "Survived 3 hurricane seasons with zero patches. This $2,800 fabric isn't cheap — it's cheap to replace."
Brand: nomadixgear
Mode: social

Output: {
  "result": "PASS",
  "title_length": 108,
  "criteria": {...all passed (urgency relaxed)...},
  "action": "PROCEED"
}
```

### Social FAIL
```
Input: "Our glamping tents are the best! DM for details."
Brand: nomadixgear
Mode: social

Output: {
  "result": "FAIL",
  "failed_criteria": [1, 2],
  "failures": {...},
  "reframe_suggestions": [...],
  "action": "BLOCKED"
}
```

---

## Usage

### Direct Call
```
sharp-thesis-validator "Why cheap fabric costs more than hurricane damage" --brand enchantents --mode long-form
```

### From Another Skill
```javascript
const validator = require('sharp-thesis-validator');
const result = await validator.validate({
  topic: "Why cheap fabric costs more than hurricane damage",
  brand: "enchantents",
  mode: "long-form"
});

if (result.result === "FAIL") {
  // Block pipeline, show reframe suggestions
  console.log("Topic failed Sharp-Thesis Test:", result.failures);
  console.log("Reframe suggestions:", result.reframe_suggestions);
  process.exit(1);
}
```

### From Kanban Task
```yaml
- id: thesis-validation
  name: "Validate sharp thesis"
  skill: sharp-thesis-validator
  args:
    topic: "{{topic}}"
    brand: "{{tenant}}"
    mode: "long-form"
  gate: true  # blocks downstream until PASS
```