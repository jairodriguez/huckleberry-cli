---
name: ai-cold-email-intelligence
description: "David Yu style AI Cold Email System. Implements the 6-phase high-reply workflow."
metadata:
  version: 1.0.0
---

# AI Cold Email Intelligence (David Yu System)

This skill transforms cold outreach from "spam" to "peer-to-peer recommendation" by hitting customer pain points extracted from real reviews.

## Commands

`Skill: ai-cold-email-intelligence --brand {brand} --task gathering --query "HVAC in Austin"`
`Skill: ai-cold-email-intelligence --brand {brand} --task research --domain "company.com"`
`Skill: ai-cold-email-intelligence --brand {brand} --task draft --lead-info {json}`
`Skill: ai-cold-email-intelligence --brand {brand} --task review --draft-file {path}`

## 6-Phase Workflow

### Phase 1: Strategic Gathering
Use the Google Maps scraper to find local targets or Apollo for SaaS.
```bash
node scripts/research/google-maps-leads.js --query "{query}" --brand {brand}
```

### Phase 2: Mandatory Verification
(Manual/Million Verifier) Ensure CSV is cleaned before importing to Phase 3.

### Phase 3: Categorization
Use `@lead-categorizer` (internal prompt) to bucket leads by specific sub-niche.

### Phase 4: Deep Pain-Point Research
Scrape 1-3 star reviews for the prospect's domain.
```bash
node scripts/research/deep-review-scraper.js --domain "{domain}" --brand {brand}
```

### Phase 5: Hyper-Personalized Drafting
Use the `cold-email` skill but anchor the opener specifically on the results from Phase 4.
**Rule**: If the customer complained about "late shipping," the opener MUST offer "shipping automation."
**Awareness Gate:** Cold outreach targets problem-aware or solution-aware prospects. Use the advertorial funnel approach (validate → cause → mechanism → product) from `references/awareness-level-guide.md`. Never lead with a product pitch.

### Phase 6: Evergreen Feedback Loop
1. Draft generated.
2. `@cold-email-critic` grades it.
3. If fail: Critique is applied, draft rewritten.
4. Mistakes are logged to `businesses/{business}/evergreen.mdcold-email/evergreen-mistakes.md`.

## Integration with existing Cold-Email Skill
When using the core `cold-email` skill, ALWAYS pass the `pain-points.json` as a primary research signal.

## References
- `evergreen-mistakes.md`: Persistent log of banned patterns (AI jargon, em-dashes).
