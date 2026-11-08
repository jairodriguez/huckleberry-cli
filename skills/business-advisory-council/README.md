# Business Advisory Council
**Multi-expert parallel analysis for high-leverage decisions.**

---

## What It Does
The Business Advisory Council provides systematic expert perspectives on major decisions:
- **Financial Analyst**: ROI, margins, cash flow
- **Operations Lead**: Execution, logistics, timeline
- **Marketing Strategist**: Market fit, positioning, messaging
- **Risk Assessor**: Downside scenarios, failure modes
- **Growth Hacker**: Scale, virality, leverage opportunities

Each expert analyzes independently → Synthesis surfaces consensus, conflicts, blind spots → Clearer decisions with higher confidence.

## When to Use
**Trigger events:**
- Product launches (new tent models, new services)
- Pricing strategy changes
- Partnership opportunities ($5,000+ impact)
- Major pivots or strategic shifts
- Investments (tooling, software, equipment)
- Supplier relationships (like Steve Conley/SylvanSport)

## Usage

### Quick Start (Command Line)
```bash

# Simple decision analysis
python3 business-advisory-council.py \
 --brief "Launch new hexagone tent model for $50K?"
 --model zai-custom/glm-4.7

# Full brief with context
--brief "Pursue SylvanSport partnership for fabric sourcing?" \
 --context "They offered shared suppliers + volume discounts. Currently sourcing from China." \
 --constraints "Timeline: 1-2 weeks, expecting 20%+ cost reduction" \
 --success-criteria "20%+ cost reduction, 2+ non-Chinese suppliers, quality approved" \

# Load brief from JSON file
--brief-file examples/steve-conley-partnership.json \
```

### Brief File Format (JSON)
```json
{
 "decision": "What are we deciding?",
 "context": "Background, market situation, current state",
 "constraints": "Budget, timeline, resource limits",
 "success_criteria": "What does good look like?"
}

### Output
**Files created:**
- `decision_YYYYMMDD_HHMMSS.json` — Structured data with expert analysis
- `decision_YYYYMMDD_HHMMSS.md` — Human-readable report

**Sample report structure:**

# Business Advisory Council Analysis

## Decision Brief
- What we're deciding: [X]
- Context: [X], Constraints: [X], Success criteria: [X]

## Expert Analysis

### Financial Analyst
- Recommendation: proceed, Financial impact: ..., Risks: [...], Reasoning: ...

[...other 4 experts...]

## Synthesis
**Consensus:** PROCEED
**Vote summary:** 4 proceed, 1 defer
**Top risks:** [...]
**Leverage opportunities:** [...]

**Recommendation: PROCEED**
4/5 experts recommend proceeding. 3 key risks identified.
Confidence: high

## Models Supported
**Recommended:**
- `zai-custom/glm-4.7` — Fast, good reasoning, low cost
- `google/gemini-3-flash` — Fast, good analysis
- `moonshot/kimi-k2.5` — Balanced speed/quality

**Not recommended:**
- Anthropic models (restricted per policy, use only on CoS agent)

**Cost estimate:**
- Single model (current implementation): ~50K tokens = $0.10-0.50
- 10 decisions/week = ~$5-50/year

## Implementation Notes

### Current Implementation (Option B - Single Model)
All 5 expert personas run in one model call:
- **Pros:** Fast, cheap, cross-references possible
- **Cons:** Serial processing, less independent thinking

### Future Options
**Option A - Full Parallel:**
- 5 agents spawned simultaneously
- True independent analysis
- Cost: 5x single model (~$0.50-2.50 per decision)

**Option C - Hybrid:**
- Financial + Risk: Single model (data-heavy)
- Operations + Marketing + Growth: Parallel spawns
- Cost: 3x single model (~$0.30-1.50 per decision)

## Examples
See `/examples/` for sample briefs:
- `steve-conley-partnership.json` — Supplier partnership decision
- `new-product-launch.json` — Product launch decision (coming soon)

## Integration Notes
This skill can be called from:
1. **Command line** (direct use)
2. **Chief of Staff agent** (proactive analysis)
3. **Other agents** (decision support)

For automated use, the agent should:
1. Detect high-leverage decision trigger
2. Create brief automatically from context
3. Call `business-advisory-council.py`
4. Parse synthesis + recommend action
5. Ask user for final decision

**Status:** Prototype v1.0 (single model implementation)

*Created: 2026-02-26*
*Author: Clawd (Chief of Staff)*