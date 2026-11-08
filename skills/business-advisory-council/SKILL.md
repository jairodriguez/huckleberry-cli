---
name: business-advisory-council
description: Analyze high-leverage decisions with multiple expert perspectives.
---
name: business-advisory-council
description: Analyze high-leverage decisions with multiple expert perspectives. Multi-persona deliberation for strategic business choices.
---

# Business Advisory Council
**Use when:** Analyzing high-leverage decisions with multiple expert perspectives.

---

## USE WHEN
**Trigger events:**
- Product launches (new tent models, new services)
- Pricing strategy changes
- Partnership opportunities ($5,000+ impact)
- Major pivots or strategic shifts
- Investments (tooling, software, equipment)
- Supplier relationships (like Steve Conley/SylvanSport)

**Example scenarios:**
- "Should we pursue this partnership?"
- "Is this pricing strategy viable?"
- "Should we invest in this equipment?"
- "Should we launch this product now?"

## DON'T WHEN
**Low-leverage decisions:**
- Routine operational choices (<$500 impact)
- Minor adjustments or iterations
- Decisions with clear best practice

**Quick decisions:**
- Time-critical emergencies (minutes matter)
- Reversible experiments
- Low-risk choices

- "What color should this button be?"
- "Should we send this email now?"
- "What should we have for lunch?"

## HOW TO USE

### Command Line
```bash

# Simple decision
python3 skills/business-advisory-council/business-advisory-council.py \
 --brief "Pursue Steve Conley partnership for fabric sourcing?" \
 --model zai-custom/glm-4.7

# Full brief
--brief-file skills/business-advisory-council/examples/steve-conley-partnership.json \
```

### Brief Format (JSON)
```json
{
 "decision": "What are we deciding?",
 "context": "Background, market situation, current state",
 "constraints": "Budget, timeline, resource limits",
 "success_criteria": "What does good look like?"
}

### Output Files
- `decision_YYYYMMDD_HHMMSS.json` — Structured expert analysis
- `decision_YYYYMMDD_HHMMSS.md` — Human-readable report

## EXPERT PERSONAS
Financial Analyst, Focus=ROI, margins, cash flow, Key Question="Can we afford this?"
Operations Lead, Focus=Execution, logistics, timeline, Key Question="Can we actually do this?"
Marketing Strategist, Focus=Market fit, positioning, Key Question="Will anyone buy this?"
Risk Assessor, Focus=Downside scenarios, Key Question="What could go wrong?"
Growth Hacker, Focus=Scale, virality, Key Question="How do we 10x this?"

## IMPLEMENTATION NOTES
**Current: Option B (Single Model)**
- All 5 experts in one model call
- Fast, cheap (~$0.10-0.50 per decision)
- Can cross-reference between perspectives

**Future options:**
- Option A (Full Parallel): 5 agents, true independence
- Option C (Hybrid): 3 agents, balance of speed/independence

## COSTS
- Single model: ~50K tokens = $0.10-0.50
- Full parallel: ~100K tokens = $0.50-2.50
- Usage: 10 decisions/week = ~$5-50/year

**Status:** Prototype v1.0 ready
**Created:** 2026-02-26