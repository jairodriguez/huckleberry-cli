---
name: weekly-newsletter-digest
description: Generate weekly newsletter digests from accumulated content and research. Curated summaries with brand voice alignment.
depends-on:
  - hook-generator
---

# Skill: weekly-newsletter-digest

# Weekly Newsletter Digest

## Overview

Automatically compile a weekly newsletter digest by scanning recently published blog posts, generating engaging summaries, and formatting them into the "WithJai Weekly" brand template.

## When to Use This Skill

Invoke this skill when:
- **Weekly newsletter is due** (typically Fridays/Mondays)
- **Batching multiple articles** into a single email
- **Driving traffic** from the newsletter back to the blog
- **Maintaining consistency** in newsletter structure

## Awareness Gate (MANDATORY)

Before assembling the newsletter, determine the subscriber's awareness level. See `references/awareness-level-guide.md`. Newsletter subscribers are typically problem-aware or solution-aware — they know the problem and are looking for solutions. Content should validate struggles, explain causes, and introduce mechanisms before mentioning products.

## Core Workflow

### Phase 1: Content Discovery

1. **Scan Registry**: Read `businesses/{business}/evergreen.md_tracking/master-url-registry.json` (if available) or scan `03-production/blog/` for files modified in the last 7 days.
2. **Filter Published**: Identify articles that have been published to WordPress/GitHub.
3. **Extract Metadata**: Get titles, URLs, and key takeaways.

### Phase 2: Digest Assembly

Assemble the newsletter using the **WithJai Weekly** structure:
1. **Hook**: A short, farm-to-founder story from the week.
2. **The Digest**: A list of 2-4 articles published this week.
   - *Format*: [Title] + [2-3 sentence summary] + [Link]
3. **The Playbook**: A tactical tip related to one of the articles.
4. **Closing**: A single, soft CTA (Waitlist or Product demo).

### Phase 3: Drafting

Generate the complete markdown for the newsletter. Use the `humanizer` to ensure the farm-to-founder voice is authentic.

**Hook-generator integration:** Spawn a subagent for the digest's subject line + opening hook:
```
Load the hook-generator skill and execute the full Phase 1-6 pipeline with this context.
Context:
- WHO: <subscriber persona from brand>
- WHAT/WHY: <weekly theme from Phase 2>
- Knife: <top pain surfaced this week>
- Platform: medium
- Brand: <brand name>
- Target Score: 85
Return ONLY this JSON array: [{"hook":"...","score":<0-100>,"pattern":"...","formula":"..."}]
```
Use top-scored hook as subject line. If subagent fails, write subject line manually.

## Usage

```bash
Skill: weekly-newsletter-digest --brand ai.withjai --days 7
```

## Quality Standards

- **Link Accuracy**: Every summary MUST have a valid, live URL.
- **Narrative Flow**: The "Field Story" must connect logically to the weekly theme.
- **Brevity**: Keep summaries under 60 words each to encourage click-throughs.
- **No Fluff**: Get straight to the value in the summaries.

---

**Note**: This skill assumes the blog posts follow the AEO/Human Narrative dual-publishing pattern and will link to the Human Narrative version by default for better engagement.
