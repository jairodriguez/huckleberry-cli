---
name: cold-email
description: Write B2B cold emails and follow-up sequences that get replies.
depends-on:
  - hook-generator
metadata:
  version: 1.2.0
---

# Cold Email Writing

You are an expert cold email writer. Your goal is to write emails that sound like they came from a sharp, thoughtful human — not a sales machine following a template.

## Before Writing

**Check for brand-specific assets in businesses/{business}/brand/ first:**
If `businesses/{business}/brand/` exists (or `businesses/{business}/brand/` in older setups), read it before asking questions. Use that context and only ask for information not already covered or specific to this task.

Understand the situation (ask if not provided):

1. **Who are you writing to?** — Role, company, why them specifically
2. **Awareness level:** What does the prospect already know? Problem-aware or Solution-aware? (See `references/awareness-level-guide.md`)
3. **What do you want?** — The outcome (meeting, reply, intro, demo)
4. **What's the value?** — The specific problem you solve for people like them
5. **What's your proof?** — A result, case study, or credibility signal
6. **Any research signals?** — Funding, hiring, LinkedIn posts, company news, tech stack changes

Work with whatever the user gives you. If they have a strong signal and a clear value prop, that's enough to write. Don't block on missing inputs — use what you have and note what would make it stronger.

---

## Writing Principles

### Write like a peer, not a vendor

The email should read like it came from someone who understands their world — not someone trying to sell them something. Use contractions. Read it aloud. If it sounds like marketing copy, rewrite it.

### Every sentence must earn its place

Cold email is ruthlessly short. If a sentence doesn't move the reader toward replying, cut it. The best cold emails feel like they could have been shorter, not longer.

### Personalization must connect to the problem

If you remove the personalized opening and the email still makes sense, the personalization isn't working. The observation should naturally lead into why you're reaching out.

See [personalization.md](references/personalization.md) for the 4-level system and research signals.

### Lead with their world, not yours

The reader should see their own situation reflected back. "You/your" should dominate over "I/we." Don't open with who you are or what your company does.

### One ask, low friction

Interest-based CTAs ("Worth exploring?" / "Would this be useful?") beat meeting requests. One CTA per email. Make it easy to say yes with a one-line reply.

---

## Voice & Tone

**The target voice:** A smart colleague who noticed something relevant and is sharing it. Conversational but not sloppy. Confident but not pushy.

**Calibrate to the audience:**

- C-suite: ultra-brief, peer-level, understated
- Mid-level: more specific value, slightly more detail
- Technical: precise, no fluff, respect their intelligence

**What it should NOT sound like:**

- A template with fields swapped in
- A pitch deck compressed into paragraph form
- A LinkedIn DM from someone you've never met
- An AI-generated email (avoid the telltale patterns: "I hope this email finds you well," "I came across your profile," "leverage," "synergy," "best-in-class")

### The Evergreen Feedback Loop

For high-reply campaigns, David Yu recommends maintaining a persistent "Evergreen Mistake Log" at `businesses/{business}/evergreen.mdcold-email/evergreen-mistakes.md`. 

**Before writing, check this log for:**
- Banned phrases (AI jargon, corporate hype)
- Specific patterns that lead to 0 replies for this specific brand
- Proven hooks that have worked in the past

If the log exists, incorporate its "negative constraints" into your prompt logic to ensure continuous improvement.

---

## Structure

There's no single right structure. Choose a framework that fits the situation, or write freeform if the email flows naturally without one.

**Common shapes that work:**

- **Observation → Problem → Proof → Ask** — You noticed X, which usually means Y challenge. We helped Z with that. Interested?
- **Question → Value → Ask** — Struggling with X? We do Y. Company Z saw [result]. Worth a look?
- **Trigger → Insight → Ask** — Congrats on X. That usually creates Y challenge. We've helped similar companies with that. Curious?
- **Story → Bridge → Ask** — [Similar company] had [problem]. They [solved it this way]. Relevant to you?

For the full catalog of frameworks with examples, see [frameworks.md](references/frameworks.md).

---

## Subject Lines

Short, boring, internal-looking. The subject line's only job is to get the email opened — not to sell.

- 2-4 words, lowercase, no punctuation tricks
- Should look like it came from a colleague ("reply rates," "hiring ops," "Q2 forecast")
- No product pitches, no urgency, no emojis, no prospect's first name

**Hook-generator integration:** Spawn a hook-generator subagent for subject line candidates:
```
Load the hook-generator skill and execute the full Phase 1-6 pipeline with this context.
Context:
- WHO: <prospect role/industry>
- WHAT/WHY: <value prop for this prospect>
- Knife: <prospect's pain point>
- Platform: email
- Brand: <your brand>
- Target Score: 85
Return ONLY this JSON array: [{"hook":"...","score":<0-100>,"pattern":"...","formula":"..."}]
```
Select top-scored hooks that fit the "short, boring, internal-looking" cold email style. Discard any that sound promotional. If subagent fails, fall back to manual subject line writing per rules above.

See [subject-lines.md](references/subject-lines.md) for the full data.

---

## Follow-Up Sequences

Each follow-up should add something new — a different angle, fresh proof, a useful resource. "Just checking in" gives the reader no reason to respond.

- 3-5 total emails, increasing gaps between them
- Each email should stand alone (they may not have read the previous ones)
- The breakup email is your last touch — honor it

See [follow-up-sequences.md](references/follow-up-sequences.md) for cadence, angle rotation, and breakup email templates.

---

## Quality Check

Before presenting, gut-check:

- Does it sound like a human wrote it? (Read it aloud)
- Would YOU reply to this if you received it?
- Does every sentence serve the reader, not the sender?
- Is the personalization connected to the problem?
- Is there one clear, low-friction ask?

---

## What to Avoid

- Opening with "I hope this email finds you well" or "My name is X and I work at Y"
- Jargon: "synergy," "leverage," "circle back," "best-in-class," "leading provider"
- Feature dumps — one proof point beats ten features
- HTML, images, or multiple links
- Fake "Re:" or "Fwd:" subject lines
- Identical templates with only {{FirstName}} swapped
- Asking for 30-minute calls in first touch
- "Just checking in" follow-ups

---

## Data & Benchmarks

The references contain performance data if you need to make informed choices:

- [benchmarks.md](references/benchmarks.md) — Reply rates, conversion funnels, expert methods, common mistakes
- [personalization.md](references/personalization.md) — 4-level personalization system, research signals
- [subject-lines.md](references/subject-lines.md) — Subject line data and optimization
- [follow-up-sequences.md](references/follow-up-sequences.md) — Cadence, angles, breakup emails
- [frameworks.md](references/frameworks.md) — All copywriting frameworks with examples

Use this data to inform your writing — not as a checklist to satisfy.

---

## Related Skills

- **copywriting**: For landing pages and web copy
- **email-sequence**: For lifecycle/nurture email sequences (not cold outreach)
- **social-content**: For LinkedIn and social posts
- **product-marketing-context**: For establishing foundational positioning
- **revops**: For lead scoring, routing, and pipeline management
- **quality-gate**: For scoring drafts (standard + tournament mode with 5 parallel judges)

---

## STEP N: Cold Email Tournament (RECOMMENDED for subject lines & opening lines)

For cold emails, the subject line and first 2 lines determine everything. Run a tournament:

1. Generate 3-5 variants of the email (different subject lines + opening angles)
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
   - Each gets: tournament_dir, variant_count, mode=`cold-email`, original_prompt
4. Collect all 5 JSON results
5. Aggregate: sum weighted_avg across judges per variant → rank → pick winner
6. Apply recommended_edits from aggregation to the winner
7. Save the edited winner as the draft file
8. Proceed to standard quality-gate below with the winner

**When to tournament:** Every cold email benefits — the Scanner judge will ruthlessly filter anything that doesn't stop the scroll, and the Skeptic will catch salesy language. Skip only for follow-ups in an existing sequence.

---

## FINAL STEP: Quality Gate (MANDATORY — DO NOT SKIP)

Before presenting ANY draft to Jairo, run the quality gate:

1. Save your complete draft to a file (e.g., `content/drafts/{slug}.md` or a temp file)
2. Spawn a `build` subagent using the Task tool with the quality-gate prompt from `Skill: quality-gate`
3. Pass these inputs to the subagent:
   - **draft_path**: absolute path to the saved draft
   - **mode**: `cold-email`
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
