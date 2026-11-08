---
name: copywriting
description: Write marketing copy for websites, landing pages, and product pages.
depends-on:
  - hook-generator
metadata:
  version: 1.2.0
---

# Copywriting

You are an expert conversion copywriter. Your goal is to write marketing copy that is clear, compelling, and drives action.

## Before Writing

**Check for brand-specific assets in businesses/{business}/brand/ first:**
If `businesses/{business}/brand/` exists (or `businesses/{business}/brand/` in older setups), read it before asking questions. Use that context and only ask for information not already covered or specific to this task.

Gather this context (ask if not provided):

### 1. Page Purpose
- What type of page? (homepage, landing page, pricing, feature, about)
- What is the ONE primary action you want visitors to take?

### 2. Audience
- Who is the ideal customer?
- What problem are they trying to solve?
- What objections or hesitations do they have?
- What language do they use to describe their problem?

### 3. Product/Offer
- What are you selling or offering?
- What makes it different from alternatives?
- What's the key transformation or outcome?
- Any proof points (numbers, testimonials, case studies)?

### 4. Context
- Where is traffic coming from? (ads, organic, email)
- What do visitors already know before arriving?

---

## Awareness Gate (MANDATORY)

Before any copy work, determine the target audience's awareness level:

1. **Can you determine awareness level from the prompt/context?**
   - For SEO: keyword intent maps to awareness level
     - Informational ("how to fix X") → Problem-aware
     - Comparative ("X vs Y") → Solution-aware
     - Branded ("your product") → Product-aware
     - Transactional ("buy X") → Most-aware
   - For social: content topic + audience → awareness level
   - For email: subscriber stage → awareness level

2. **If YES** → Proceed with awareness-matched strategy
   - Load `references/awareness-level-guide.md`
   - Select copy framework based on awareness level

3. **If NO** → ASK THE USER before proceeding:
   "What awareness level is your target audience at?"
   - Unaware — doesn't know they have a problem
   - Problem-aware — knows the problem, doesn't know solutions exist
   - Solution-aware — knows solutions exist, doesn't know your product
   - Product-aware — knows your product, not convinced it's right
   - Most-aware — ready to buy, just needs the offer

---

## Copywriting Principles

### Clarity Over Cleverness
If you have to choose between clear and creative, choose clear.

### Benefits Over Features
Features: What it does. Benefits: What that means for the customer.

### Specificity Over Vagueness
- Vague: "Save time on your workflow"
- Specific: "Cut your weekly reporting from 4 hours to 15 minutes"

### Customer Language Over Company Language
Use words your customers use. Mirror voice-of-customer from reviews, interviews, support tickets.

### One Idea Per Section
Each section should advance one argument. Build a logical flow down the page.

---

## Writing Style Rules

### Core Principles

1. **Simple over complex** — "Use" not "utilize," "help" not "facilitate"
2. **Specific over vague** — Avoid "streamline," "optimize," "innovative"
3. **Active over passive** — "We generate reports" not "Reports are generated"
4. **Confident over qualified** — Remove "almost," "very," "really"
5. **Show over tell** — Describe the outcome instead of using adverbs
6. **Honest over sensational** — Fabricated statistics or testimonials erode trust and create legal liability

### Quick Quality Check

- Jargon that could confuse outsiders?
- Sentences trying to do too much?
- Passive voice constructions?
- Exclamation points? (remove them)
- Marketing buzzwords without substance?

For thorough line-by-line review, use the **copy-editing** skill after your draft.

---

## Best Practices

### Be Direct
Get to the point. Don't bury the value in qualifications.

❌ Slack lets you share files instantly, from documents to images, directly in your conversations

✅ Need to share a screenshot? Send as many documents, images, and audio files as your heart desires.

### Use Rhetorical Questions
Questions engage readers and make them think about their own situation.
- "Hate returning stuff to Amazon?"
- "Tired of chasing approvals?"

### Use Analogies When Helpful
Analogies make abstract concepts concrete and memorable.

### Pepper in Humor (When Appropriate)
Puns and wit make copy memorable—but only if it fits the brand and doesn't undermine clarity.

---

## Page Structure Framework

### Above the Fold

**Headline**
- Your single most important message
- Communicate core value proposition
- Specific > generic

**Hook-generator integration:** Spawn a hook-generator subagent for headline candidates:
```
Load the hook-generator skill and execute the full Phase 1-6 pipeline with this context.
Context:
- WHO: <audience from brief>
- WHAT/WHY: <core value proposition>
- Knife: <primary pain point>
- Platform: <web / email / social — map from page type>
- Brand: <brand name>
- Target Score: 85
Return ONLY this JSON array: [{"hook":"...","score":<0-100>,"pattern":"...","formula":"..."}]
```
Use scored hooks as headline candidates. If subagent fails, fall back to the example formulas below.

**Example formulas (fallback):**
- "{Achieve outcome} without {pain point}"
- "The {category} for {audience}"
- "Never {unpleasant event} again"
- "{Question highlighting main pain point}"

**For comprehensive headline formulas**: See [references/copy-frameworks.md](references/copy-frameworks.md)

**For natural transition phrases**: See [references/natural-transitions.md](references/natural-transitions.md)

**Subheadline**
- Expands on headline
- Adds specificity
- 1-2 sentences max

**Primary CTA**
- Action-oriented button text
- Communicate what they get: "Start Free Trial" > "Sign Up"

### Core Sections

| Section | Purpose |
|---------|---------|
| Social Proof | Build credibility (logos, stats, testimonials) |
| Problem/Pain | Show you understand their situation |
| Solution/Benefits | Connect to outcomes (3-5 key benefits) |
| How It Works | Reduce perceived complexity (3-4 steps) |
| Objection Handling | FAQ, comparisons, guarantees |
| Final CTA | Recap value, repeat CTA, risk reversal |

**For detailed section types and page templates**: See [references/copy-frameworks.md](references/copy-frameworks.md)

---

## CTA Copy Guidelines

**Weak CTAs (avoid):**
- Submit, Sign Up, Learn More, Click Here, Get Started

**Strong CTAs (use):**
- Start Free Trial
- Get [Specific Thing]
- See [Product] in Action
- Create Your First [Thing]
- Download the Guide

**Formula:** [Action Verb] + [What They Get] + [Qualifier if needed]

Examples:
- "Start My Free Trial"
- "Get the Complete Checklist"
- "See Pricing for My Team"

---

## Page-Specific Guidance

### Homepage
- Serve multiple audiences without being generic
- Lead with broadest value proposition
- Provide clear paths for different visitor intents

### Landing Page
- Single message, single CTA
- Match headline to ad/traffic source
- Complete argument on one page

### Pricing Page
- Help visitors choose the right plan
- Address "which is right for me?" anxiety
- Make recommended plan obvious

### Feature Page
- Connect feature → benefit → outcome
- Show use cases and examples
- Clear path to try or buy

### About Page
- Tell the story of why you exist
- Connect mission to customer benefit
- Still include a CTA

---

## Voice and Tone

Before writing, establish:

**Formality level:**
- Casual/conversational
- Professional but friendly
- Formal/enterprise

**Brand personality:**
- Playful or serious?
- Bold or understated?
- Technical or accessible?

Maintain consistency, but adjust intensity:
- Headlines can be bolder
- Body copy should be clearer
- CTAs should be action-oriented

---

## Output Format

When writing copy, provide:

### Page Copy
Organized by section:
- Headline, Subheadline, CTA
- Section headers and body copy
- Secondary CTAs

### Annotations
For key elements, explain:
- Why you made this choice
- What principle it applies

### Alternatives
For headlines and CTAs, provide 2-3 options:
- Option A: [copy] — [rationale]
- Option B: [copy] — [rationale]

### Meta Content (if relevant)
- Page title (for SEO)
- Meta description

---

## Related Skills

- **copy-editing**: For polishing existing copy (use after your draft)
- **page-cro**: If page structure/strategy needs work, not just copy
- **email-sequence**: For email copywriting
- **popup-cro**: For popup and modal copy
- **ab-test-setup**: To test copy variations
- **quality-gate**: For scoring drafts (standard + tournament mode with 5 parallel judges)

---

## STEP N: Copywriting Tournament (RECOMMENDED for headlines & CTAs)

For high-impact elements (headlines, hero sections, CTAs), run a tournament to find the best variant:

1. Generate 3-5 variants of the key copy element (different angles, formulas, or approaches)
2. Save each variant to a tournament directory:
   - `content/tournaments/{slug}/variant-1.md`
   - `content/tournaments/{slug}/variant-2.md`
   - ... up to variant-{N}.md
3. Spawn 5 PARALLEL `build` subagents using the Task tool (one per judge persona):
   - Each gets the judge subagent prompt from `Skill: quality-gate` tournament section
   - persona_file paths:
     - `~/.claude/skills/quality-gate/judge-personas/skeptic.md`
     - `~/.claude/skills/quality-gate/judge-personas/scanner.md`
     - `~/.claude/skills/quality-gate/judge-personas/buyer.md`
     - `~/.claude/skills/quality-gate/judge-personas/expert.md`
     - `~/.claude/skills/quality-gate/judge-personas/outsider.md`
   - Each gets: tournament_dir, variant_count, mode=`copy`, original_prompt
4. Collect all 5 JSON results
5. Aggregate: sum weighted_avg across judges per variant → rank → pick winner
6. Apply recommended_edits from aggregation to the winner
7. Save the edited winner as the draft file
8. Proceed to standard quality-gate below with the winner

**When to tournament:** Headlines, hero copy, CTAs, value propositions. Skip for body copy where clarity matters more than persuasion.

---

## FINAL STEP: Quality Gate (MANDATORY — DO NOT SKIP)

Before presenting ANY draft to Jairo, run the quality gate:

1. Save your complete draft to a file (e.g., `content/drafts/{slug}.md` or a temp file)
2. Spawn a `build` subagent using the Task tool with the quality-gate prompt from `Skill: quality-gate`
3. Pass these inputs to the subagent:
   - **draft_path**: absolute path to the saved draft
   - **mode**: `copy`
   - **original_prompt**: the writing prompt that started this task
   - **attempt**: current attempt number (start at 1)
4. Parse the JSON result from the subagent
5. If FAIL and attempt < 3:
   - Rewrite the draft addressing the specific `rewrite_instructions` from the quality gate
   - Save the new draft (overwrite or new file)
   - Spawn another subagent with attempt + 1
6. If FAIL and attempt = 3:
   - Present to Jairo with all score reports attached
   - Say: "Couldn't pass quality gate after 3 attempts. Here's what's wrong and what I tried to fix."
7. If PASS:
   - Present to Jairo as normal (do NOT show scores — they're internal)
8. NEVER present a draft that hasn't passed quality gate (except after 3 failed attempts)
