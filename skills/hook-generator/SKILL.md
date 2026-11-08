---
name: hook-generator
description: Generate platform-optimized hooks using Unified Hook Generator v3.0 (Volume generation + Jev ranking + Ralph). 3-step system - volume generation produces 50 hooks (85-90/100), jev_jev_rerank ranks all 50 against ICP + funnel stage + voice (sub-second), Ralph enhances top hooks to 90-95/100. Uses examples-first training with real engagement data across all 6 platforms (Twitter, LinkedIn, Instagram, YouTube, TikTok, Medium).
allowed-tools: Read, Grep, Glob, Bash
license: Internal use only
---

# Unified Hook Generator v3.0
**Status**: PRODUCTION-READY (upgraded 2026-01-23)
**Quality**: 90-95/100 (v3.0 with Ralph enhancement)

## Awareness Gate (MANDATORY)

Before generating hooks, determine the target audience's awareness level. See `references/awareness-level-guide.md`. If unclear, ask the user. The awareness level determines which hook patterns will resonate — problem-aware audiences respond to validation hooks, solution-aware to comparison hooks, product-aware to proof hooks.

## Quick Start
```bash

# Generate Twitter hooks (auto-detects niche from brand name)
~/clawd/skills/hook-generator-openclaw/scripts/generate.sh \
 --content "Building AI agents with OpenClaw" \
 --platform twitter \
 --brand aiwithjai \
 --count 3

# Generate hooks for Enchantents (auto-detects glamping niche)
--content "Glamping tent ROI" \
 --brand enchantents \

# Explicit niche override
node ~/clawd/skills/hook-generator-openclaw/scripts/generate-hooks-unified.js \
 --content "Your content" \
 --platform tiktok \
 --brand default \
 --niche enchantents-glamping
```

**Parameters:**
- `--content` (required): The content/idea to generate hooks for
- `--platform` (required): twitter, linkedin, instagram, youtube, tiktok, medium
- `--brand` (optional): Brand name for context + auto-niche detection, defaults to "default"
- `--niche` (optional): Explicit niche filter. Overrides brand-based detection
- `--count` (optional): Number of hooks to generate, default 3

**Brand → Niche Auto-Detection:**
- enchantents, nomadixgear, nomadix: `enchantents-glamping`
- aiwithjai, linkedgraphix, clawver: `ai-agents`
- (other/default): all examples, no filtering

## Overview
Single authoritative system for generating platform-optimized hooks across all 6 platforms using **examples-first training** instead of abstract formulas.

**Key Innovation**: Show AI 5-7 PROVEN hooks with real engagement data before generation → Consistent 85/100+ quality vs 76-81/100 baseline.

## When to Invoke
Use this skill when:
- **Creating hooks for social content** (platform-content-generator Phase 2)
- **Generating newsletter subject lines** (newsletter-strategist)
- **Writing blog post titles** (blog-workflow)
- **A/B testing hooks** for engagement optimization
- **Repurposing content** across platforms with consistent quality

## 4-Step Model Pipeline (v3.2 — two-pass generation, 2026-10-17)

> **Dead model warning (verified 2026-10-17):** this skill previously pinned `z-ai/glm-4.7-flash` (Step 1) and `z-ai/glm-4.7` (Step 3). Both now return **HTTP 200 with EMPTY content**. OpenRouter credits are NOT the problem — `anthropic/claude-haiku-4.5`, `google/gemini-2.5-flash-lite` and `openai/gpt-4o-mini` all respond normally on the same key. Repoint any pin before running, or the step silently produces nothing.

### Step 1a: Volume Generation (examples-first)
**Model**: `anthropic/claude-haiku-4.5` via OpenRouter (verified working 2026-10-17)
**Why**: Fast, cheap, optimized for volume
**Output**: 40-50 hooks — a relevance floor and ICP coverage

### Step 1b: Diversity Generation (REQUIRED — added 2026-10-17)
**Model**: same as 1a, **different prompt**
**Why**: the examples-first pass alone cannot produce a non-obvious hook. Measured: its genericness *floor* was 0.71 across 10 candidates — structurally zero hooks an average AI wouldn't write, so no selection step can find a tail that was never generated.
**Output**: 40 more hooks from a prompt that widens the distribution:
- Audience described as **ONE named individual** — age, business, the exact tool they bought, the phrase they used to dismiss it, a recurring scene from their week. Never a segment.
- Banned structures: `I watched`, `I saw`, `Every <X> you do manually`, `Here is why`, `Most people`, `Imagine`, `X just Y` news framing, numbered lists.
- Forced angle variety: second-person accusation, specific scene, question, confession, fragment, comparison to physical work the reader already understands.
- Explicit instruction: hooks "an average AI would almost never produce".

**Measured effect of adding 1b**: genericness floor 0.71 → 0.14, distribution range widened 4.1×, top-of-range held. On a named-person ICP query the examples-first batch scored R 0.36-0.67 (every one below the 0.70 ship floor) while the diversity batch took the entire top 6.

### Step 2: Hook Selection
**REPLACED 2026-09-26, EXTENDED 2026-10-17:** selection runs through the `jev-hook-gate` skill — TWO `jev_jev_rerank` calls over the pooled candidates (relevance R + genericness G), selected on `R − λ·G` with a 0.70 relevance floor. The old qwen/Sonnet/Gemini selection subagents are retired — do NOT use them.
**Why**: TypeSafe judgment model, typed scores, no wasted reasoning tokens, no rate limits.
**Output**: ranked list with both scores; best `R − λ·G` ships, next 2 kept as A/B alternates.
See: `jev-hook-gate` SKILL.md (gate rule: global AGENTS.md §1b-s).

### Step 3: Ralph Enhancement
**Model**: a stronger model than the volume pass — **verify the pin resolves before relying on it** (see dead model warning above)
**Why**: Consistent scoring, stable multi-step reasoning
**Output**: 3 hooks at 90-95/100 (+7-10 points)

**Fallback Pattern**: If Step 1 fails, retry with a different working model — never the dead GLM pins
**Cost**: ~$0.25-0.35 per batch (80-90 hooks → 3 final hooks)

## Architecture

### Four-Step System (v3.2 — two-pass generation)
Input: Content + Platform + Brand + NAMED-PERSON ICP
 ↓
Step 1a: Volume Generation — examples-first        → 40-50 hooks
 ├─ Show 5-7 proven hooks from the platform database
 └─ Purpose: relevance floor + ICP coverage
Step 1b: Diversity Generation — different prompt    → 40 hooks   [REQUIRED]
 ├─ Audience = one named individual, never a segment
 ├─ Template openers banned; angle variety forced
 └─ Purpose: make a tail exist so Step 2 can find it
Step 2: Jev Gate (jev_jev_rerank MCP — 2 calls, since 2026-09-26 + 2026-10-17)
 ├─ 3a relevance R — against the NAMED PERSON, not a segment
 ├─ 3b genericness G — inverted query, "what would every AI say"
 └─ Score = R − λ·G  (λ = 0.50), floor R ≥ 0.70; top 3 kept
Step 3: Ralph Enhancement
 ├─ Score top 3 (Ralph methodology)
 ├─ Generate improvement prompts
 ├─ Iterative enhancement (max 3 iterations)
 └─ Early stop if no progress
Output: 3 hooks at 90-95/100 (vs 85-88/100 v2.0)

**Quality Improvement**: +7-10 points per hook
**Cost**: ~$0.50-0.70 per batch (80-90 hooks + 2 gate calls + enhancement)
**Time**: ~2-3 minutes total

## Platform-Specific Databases

### Database Structure
Each platform has a JSON database with 20+ proven hooks:

```json
{
 "platform": "twitter",
 "description": "Real high-performing Twitter hooks for AI training",
 "source": "Bird CLI competitive data + 2026 viral research",
 "updated": "2026-01-15",
 "voice_requirements": {
 "tone": "Conversational, punchy, quotable",
 "structure": "Short lines with white space",
 "forbidden": ["Most people think", "Imagine", "Picture this"]
 },
 "examples": [
 "hook": "I watched Kip Bodnar build...",
 "engagement": {"likes": 7005, "retweets": 666},
 "why_it_works": "First-person witness, specific timeframe",
 "pattern": "First-Person Witness + Transformation",
 "validated": true
 }
 ],
 "anti_patterns": [
 "hook": "Kip Bodnar built an AI app...",
 "why_it_fails": "Third-person reporter, information overload",
 "pattern": "Information Overload",
 "validated": "2026-01-15 linkedgraphix test (scored 76/100)"
 ]

### Available Databases
- `database/twitter-hooks.json` - 39+ Twitter hooks (7k+ likes validated, 19 AI agent + 10 Enchantents)
- `database/linkedin-hooks.json` - 38+ LinkedIn hooks (81/100 validated, 8 AI agent + 10 Enchantents)
- `database/instagram-hooks.json` - 30+ Instagram Reels hooks (10 AI agent + 10 Enchantents)
- `database/youtube-hooks.json` - 22+ YouTube hooks (8 AI agent + 10 Enchantents)

**Niche Tags** (each hook has a `niche` field for filtering):
- `"ai-agents"` — AI tools, automation, AI agent content (aiwithjai, linkedgraphix, clawver)
- `"enchantents-glamping"` — Glamping tents, hospitality investment (enchantents, nomadixgear)
- `(no niche field)` — General hooks, used as fallback for any brand

**How niche filtering works:**
1. Pass `--brand enchantents` → auto-detects niche `enchantents-glamping`
2. Loads niche-specific hooks FIRST, then general hooks as fallback
3. Generator sees the most relevant examples → better output
4. Override with `--niche ai-agents` if needed

# Automatically loads appropriate database
node .claude/skills/hook-generator/scripts/generate-hooks-unified.js \
 --content "path/to/blog.md" \
 --brand linkedgraphix.app \

**What it does**:
- Loads 20+ proven hooks for target platform
- Selects top 5-7 examples to show Gemini
- Includes engagement data, patterns, "why it works" explanations

### Step 2: Extract Content Elements
Simple extraction (Gemini does heavy analysis):
- **Numbers**: `40%`, `3 minutes`, `16 talking points`
- **Timeframes**: `under 10 minutes`, `30-minute video`
- **Quotes**: Direct quotes from content
- **Context**: First 500 characters for understanding

### Step 3: Generate with Gemini CLI
**Prompt Structure**:
Study these 7 PROVEN [platform] hooks:

EXAMPLE 1:
Hook: [actual hook text]
Engagement: [real data]
Why it works: [specific reasons]
Pattern: [pattern name]

[... 6 more examples ...]

TASK: Generate 3 hooks using the SAME PATTERNS as proven examples.

For each hook, provide:
1. hook_text: The actual hook
2. pattern: Which example pattern it follows
3. why_it_works: Specific reason for performance
4. estimated_score: 0-100 (based on pattern match + specificity)
5. similar_to_example: Which example (1-7) it's most similar to

**Token Savings**: Hook examples (2-3k tokens) loaded in Gemini's context ($0.075/1M), not Claude's ($3/1M) = **95%+ savings**

### Step 4: Score & Rank
Ranks hooks by:
- Pattern match strength (does it follow proven pattern?)
- Specificity (concrete numbers, names, timeframes?)
- Curiosity gap (creates desire to learn more?)
- Platform fit (matches platform voice requirements?)

## Usage Examples

### Command Line
--content "brands/linkedgraphix.app/content/03-production/blog/article.md" \

# Generate LinkedIn hooks
--platform linkedin \

### From Claude Code (Skill Invocation)
Skill: hook-generator
Platform: twitter
Content: brands/{brand}/content/03-production/blog/{slug}/03-final.md
Brand: {brand}
Count: 3

### Programmatic (Node.js)
```javascript
const { generateHooksWithGemini, loadPlatformHooks } = require('./.claude/skills/hook-generator/scripts/generate-hooks-unified.js');

const hookDatabase = loadPlatformHooks('twitter');
const content = fs.readFileSync('article.md', 'utf8');
const elements = extractContentElements(content);

const hooks = await generateHooksWithGemini('twitter', hookDatabase, content, elements, 3);
console.log(hooks);

## Validated Results (LinkedGraphix Test - 2026-01-15)

### Twitter Hooks Generated
1. **88/100**: "I watched Kip build an AI app live. Under 10 minutes. 16 viral talking points from ONE video..." (Building in Public Journey)
2. **85/100**: "Kip Bodnar just killed the content repurposing industry..." (Shocking Action + Transformation)
3. **87/100**: "every YouTube video you watch manually is now a wasted opportunity..." (Contrarian + Hidden Opportunity)

### LinkedIn Hooks Generated
1. **81/100**: "I watched Kip Bodnar build an AI content repurposing app live..." (First-Person Witness - exact validated pattern)
2. **84/100**: "Two content creators, same YouTube video..." (A/B Comparison)
3. **82/100**: "A marketing exec just proved why most content creators are wasting hours..." (Exec Validation)

**Average**: 84.5/100 across both platforms
**Improvement**: +8.5 points over 76/100 baseline
**Consistency**: All hooks 81-88/100 (no quality variance)

## Key Principles

### 1. Examples Over Formulas
**OLD Approach**:
"Be contrarian. Create curiosity gap. Use specific numbers."

**NEW Approach**:
"Study these 7 PROVEN hooks with 7k+ likes.
Generate hooks using the SAME PATTERNS."

**Result**: AI learns from concrete examples, not abstract rules.

### 2. Platform-Specific Libraries
**Why**: Twitter hooks ≠ LinkedIn hooks ≠ Instagram hooks

**Example**:
- **Twitter**: "I watched Kip build..." (conversational, punchy)
- **LinkedIn**: "I watched Kip Bodnar build an AI content repurposing app live in under 10 minutes." (professional depth)
- **Instagram**: Text overlay: "This feels illegal to know." + Suspenseful audio (visual-first)

### 3. Validated 2026 Data
**Sources**:
- LinkedIn: 300 posts tested, algorithm analysis
- Instagram: 1.9M+ Reels analyzed
- Twitter: Real engagement (7k+ likes, 666 RTs)
- LinkedGraphix validation: 81/100 (LinkedIn), 76/100 (Twitter) - identified what works vs what doesn't

### 4. Token Efficiency
**Cost Comparison**:
- **Inline generation** (Claude): 40k tokens @ $3/1M = $0.12
- **Unified generator** (Gemini CLI): 3k tokens @ $0.075/1M = $0.0002
- **Savings**: 95%+ per generation

### 5. Continuous Improvement
**Process**:
1. Track published hooks + engagement (monthly)
2. Add top performers to databases
3. Remove underperformers
4. System improves automatically

### 6. Quantifiable Tension First (SkillOpt-trained, 2026-09-27)
**Rule**: Immediately present a quantifiable problem or tension that addresses the reader's exact situation. No generic "people" or abstract concepts — each hook is 1-2 sentences.

**Source**: Validation-gate-accepted edit from a live SkillOpt training run (baseline 0.60 → 1.00 on held-out hook tasks). Apply this as a hard requirement when scoring Step 1 volume output: hooks that open with a vague audience or an unquantified tension get regenerated before Ralph enhancement.

## Integration Points

### Current Integrations (UPDATED 2026-01-15)
**platform-content-generator** (Phase 2):
- INTEGRATED: Invokes unified hook generator
- Generates 3 hooks per platform
- Uses platform-specific databases
- Selects best hook for final content

**newsletter-strategist**:
- ⏳ PENDING: Update to use unified generator for subject lines

**social-content-generator**:
- ⏳ PENDING: Update to use unified generator for social hooks

## Performance Metrics

### Performance Metrics (v3.0)
**Quality Targets**:
- v2.0 Baseline: 85-88/100 (Gemini/Haiku generation only)
- v3.0 Target: 90-95/100 (Haiku + Sonnet + Ralph)
- Success Rate: 90%+ platforms reach target (vs 50% v2.0)
- Voice Quality: 100/100 maintained (zero AI clichés)

**Efficiency Targets**:
- Token Savings: 95%+ (Gemini vs Claude)
- Cost: $0.50-0.70 per batch (50 hooks + selection + enhancement)
- Consistency: Same quality across all platforms
- Speed: 2-3 minutes per generation

## Ralph Enhancement Methodology

### What is Ralph Enhancement?
Ralph is a quality scoring system that enhances hooks from 85-88/100 to 90-95/100 through:
1. **10-dimensional scoring** (Hook Effectiveness, Voice, Specificity, Emotion, etc.)
2. **Targeted improvement prompts** (focus on weak dimensions < 7/10)
3. **Pattern teaching** (explain WHY patterns work)
4. **Iterative refinement** (repeat until 90/100 or early stop)

### Enhancement Process
**For each of top 3 hooks**:

**Step 1: Score** (6 dimensions):
- Hook Effectiveness (40% weight) - Stops scrolling in 0.3 seconds?
- Voice Authenticity (20% weight) - Sounds like real person?
- Specificity (15% weight) - Concrete details vs vague claims?
- Emotion Strength (10% weight) - Single clear emotion at 7+/10?
- Pattern Recognition (10% weight) - Uses proven formulas?
- Platform Optimization (5% weight) - Platform-specific format?

**Step 2: Generate Improvement Prompt** (if score < 90/100):
- Load brand voice foundation (with 9/10 examples)
- Identify weak dimensions (score < 7/10)
- Inject banger hook options (if hook effectiveness weak)
- Teach patterns (Zeigarnik effect, cognitive dissonance, etc.)
- Preserve strong dimensions (score ≥ 7/10)
- Apply AI slop blacklist (remove generic phrases)
- Provide implementation steps

**Step 3: Improve** (Gemini/Claude):
- Apply improvement prompt, Generate enhanced hook, Re-score enhanced version
- Repeat if needed (max 3 iterations)
- Early stop if no progress

**Step 4: Output**:
- Enhanced hook at 90-95/100
- Dimension breakdown
- Improvement delta (+X points)
- Number of iterations

### Why Ralph Enhancement Works
**Compounds Quality**:
- Haiku baseline: 85-90/100 (zero AI slop)
- Sonnet selection: Best patterns from 50 options
- Ralph enhancement: Targeted improvements per dimension
- **Result: 90-95/100 consistently**

**Teaches Patterns**:
- Explains WHY hooks work (neuroscience, psychology)
- Shows 9/10 examples before improvement
- Injects banger hook alternatives
- System learns from improvements

**Preserves Strengths**:
- Doesn't break what's working (dimensions ≥ 7/10)
- Focuses only on weak areas
- Maintains voice authenticity
- Prevents trade-offs

## Troubleshooting

### "Generated hooks are generic"
- **Check**: Are you loading platform-specific database?
- **Fix**: Verify database path and platform parameter match

### "Quality varies between platforms"
- **Check**: Are examples being shown before generation?
- **Fix**: Ensure 5-7 examples loaded in Gemini's context

### "Hooks don't match brand voice"
- **Check**: Does database include brand-specific examples?
- **Fix**: Add brand's top performers to platform database

### "Gemini CLI error"
- **Check**: `gemini` command available in PATH?
- **Fix**: Use Task tool with examples as workaround pattern

## Supporting Resources
- `README.md` - Complete system documentation (110+ lines)
- `database/2026-PLATFORM-RESEARCH.md` - Research sources and findings
- `database/{platform}-hooks.json` - 6 platform-specific databases
- `scripts/generate-hooks-unified.js` - Main generator script
- `references/hook-generation-system.md` - Original 6-formula system (deprecated)
- `references/platform-optimization.md` - Platform-specific rules

## Migration from Old System
**OLD System** (7-formula):
- Abstract formulas: "Be contrarian", "Create curiosity gap"
- Inconsistent results (LinkedIn 81, Twitter 76)
- No examples shown during generation

**NEW System** (Unified v2.0):
- Examples-first: Show 5-7 proven hooks
- Consistent 85/100+ across platforms
- Real engagement data validates patterns

**Migration Steps**:
1. Update platform-content-generator SKILL.md (completed 2026-01-15)
2. ⏳ Update newsletter-strategist agent
3. ⏳ Update social-content-generator agent
4. ⏳ Archive old 7-formula system

**Status**: Production-ready | Validated 2026-01-15 | 95%+ token savings | 85/100+ quality