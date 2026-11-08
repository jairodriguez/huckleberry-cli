---
name: landing-page-architect
description: "Design and build high-converting landing pages from scratch using a proven 8-section architecture. Synthesizes positioning, copy, CRO, and..."
depends-on:
  - hook-generator
allowed-tools: []
---

# /landing-page-architect — Build High-Converting Landing Pages, Section by Section

One skill to architect, write, and structure a complete landing page. Combines positioning angles, direct-response copy, CRO scoring, and persuasion psychology into a single sequential build. You get a conversion-optimized page — not just copy, not just structure, the full blueprint.

Based on an 8-section architecture proven across SaaS, info products, and DTC brands.

For brand memory protocol, see /cmo [rules/brand-memory.md](../cmo/rules/brand-memory.md).

## On Activation

1. **Read evergreen documents first.** Before loading brand files, check for evergreen documents:
   - Look in `businesses/{business}/evergreen.md` — the company bible with positioning, audience, offers, claims
   - Look in `businesses/{business}/{sub-brand}/evergreen.md` — sub-brand specifics (e.g., `enchantents/evergreen.md`, `nomadixgear/evergreen.md`)
   - Look in `businesses/{business}/operations/evergreen.md` — operational context (CRM, shipping, bookkeeping)
   - Evergreen docs contain ground-truth claims, audience definitions, offer details, and competitive positioning that must override assumptions
   - If an evergreen doc exists, its content is the **source of truth** for the landing page — brand files enhance it, evergreen anchors it
   - Check the Claims Blacklist in evergreen docs — never make claims that are blacklisted

2. **Read `brand/` directory.** Load these if present:
   ```
   Evergreen + Brand context loaded:
   ├── Evergreen doc ✓/✗
   │   ├── Claims Blacklist ✓/✗
   │   └── Offer details ✓/✗
   ├── Voice Profile ✓/✗
   ├── Audience ✓/✗
   ├── Positioning ✓/✗
   ├── Competitors ✓/✗
   ├── Creative Kit ✓/✗
   └── Learnings ✓/✗
   ```

3. If evergreen AND brand files are both missing, note: "No brand memory found. I'll ask what I need. Run /cmo or /brand-voice later for personalization."

4. Assess the request — is this a new page build, a restructure, or a section-by-section audit of an existing page?

---

## Phase 0: Gate Check

| Signal | Action |
|--------|--------|
| "Build me a landing page" / "create a landing page" / "design my page" | Proceed — this is the right skill |
| "Audit my existing page" / "improve my conversions" | Route to `/page-cro` — they need a fix, not a build |
| "Write copy for my landing page" (structure already exists) | Route to `/direct-response-copy` — they need copy, not architecture |
| "Find my positioning angle" / "what's my hook" | Run `/positioning-angles` first, then come back here |
| "Just write headlines" / "give me CTA ideas" | Route to `/copywriting` — too narrow for this skill |

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

## Phase 1: Gather Intelligence

Before writing a single word, collect everything needed to build a page that converts.

### 1.1 From Evergreen Documents (Priority Source)

Read the relevant evergreen.md files. Extract:

- **Company positioning** — What do they sell? What's the unique mechanism?
- **Audience definition** — Who is the ICP? What pain do they have? What language do they use?
- **Offer details** — Pricing, tiers, what's included, guarantees, bonuses
- **Claims and proof points** — Specific results, testimonials, case studies, data
- **Claims Blacklist** — What NOT to say (regulatory, unverified, competitor-claimed)
- **Competitive landscape** — Key differentiators, saturated claims to avoid
- **Brand voice** — Tone, vocabulary, formality level

If the evergreen doc has a "Landing Pages" or "Conversion" section, that content takes priority over generic best practices.

### 1.2 From Brand Files (Enhancement Layer)

| File | What to Extract for the Page |
|------|------------------------------|
| `voice-profile.md` | Tone, vocabulary, rhythm — every section must match this voice |
| `audience.md` | Awareness level (drives headline approach), pain points (drive Problem-Agitate), objections (drive FAQ) |
| `positioning.md` | The chosen angle becomes the page's foundation — every section reinforces it |
| `competitors.md` | Saturated claims to avoid, white space to exploit |
| `creative-kit.md` | Visual direction, color palette, image style for design handoff |
| `learnings.md` | What worked on previous pages, what bombed |

### 1.3 Ask What's Missing

If evergreen + brand files don't cover these, ask:

1. **What's the ONE action** you want visitors to take? (Buy, signup, book call, download)
2. **Where is traffic coming from?** (Ads, organic, email, social — this changes the hero)
3. **What's the offer?** (Price, guarantee, bonuses, urgency element)
4. **What proof do you have?** (Testimonials with specific results, case studies, numbers)
5. **What objections would stop someone from converting?** (Price, trust, effort, switching cost)

---

## Phase 2: The 8-Section Architecture

This is the page structure. Build it section by section, in order. Each section has a job — if it doesn't do its job, the page leaks conversions.

```
┌─────────────────────────────────────────┐
│  1. HERO — Get email or get scroll      │
├─────────────────────────────────────────┤
│  2. SUCCESS — Kill buyer's remorse      │
│     (conditional — post-opt-in only)    │
├─────────────────────────────────────────┤
│  3. PROBLEM-AGITATE — Make status quo   │
│     painful                             │
├─────────────────────────────────────────┤
│  4. VALUE STACK — Make saying no feel   │
│     stupid                              │
├─────────────────────────────────────────┤
│  5. SOCIAL PROOF — Let others convince  │
│     them                                │
├─────────────────────────────────────────┤
│  6. TRANSFORMATION — Make outcome       │
│     tangible                            │
├─────────────────────────────────────────┤
│  7. SECONDARY CTA — Catch the scrollers │
├─────────────────────────────────────────┤
│  8. FOOTER — Professional legitimacy    │
└─────────────────────────────────────────┘
```

---

### Section 1: HERO

**Job:** Get email or get scroll. The hero must instantly communicate value and make stopping feel like the only rational move.

**Elements:**
- Eyebrow (category label or micro-hook)
- Headline (single most important message)
- Subheadline (expands HOW, not just restates)
- Primary CTA (action verb + outcome)
- Trust signals (logos, stat, testimonial snippet)

**Headline approach by awareness level** (from Schwartz, loaded via audience.md or evergreen):

| Awareness | Headline Type | Example |
|-----------|--------------|---------|
| Unaware | Curiosity + identity | "You're leaving money on every invoice" |
| Problem-aware | Problem naming | "Tired of chasing payments manually?" |
| Solution-aware | Mechanism + speed | "Get paid in 2 days, not 45, with automated follow-up" |
| Product-aware | Proof + specificity | "3,847 freelancers switched from FreshBooks this month" |
| Most-aware | Direct offer | "Start your free trial — no card needed" |

**Hook-generator integration:** Spawn a hook-generator subagent for hero headline candidates:
```
Load the hook-generator skill and execute the full Phase 1-6 pipeline with this context.
Context:
- WHO: <audience from positioning>
- WHAT/WHY: <core value proposition>
- Knife: <primary pain point>
- Platform: web
- Brand: <brand name>
- Target Score: 85
Return ONLY this JSON array: [{"hook":"...","score":<0-100>,"pattern":"...","formula":"..."}]
```
Map awareness level to subagent filtering: Unaware→keep curiosity hooks, Problem-aware→keep problem-naming hooks, Solution-aware→keep mechanism hooks, Product-aware→keep proof hooks, Most-aware→keep direct offer hooks. If subagent fails, fall back to the manual frameworks below.

**Generate 5-10 headline variants** using these frameworks (fallback):
1. Direct Benefit — [Action verb] + [specific outcome] + [timeframe/contrast]
2. Curiosity Gap — Opens a loop, implies hidden knowledge
3. Social Proof — Leads with a number or result
4. Contrarian — Challenges conventional wisdom
5. Story — Setup, tension, resolution implied

Present with QUICK PICK summary. Mark recommended with ★.

**CTA copy:**
- Weak: "Sign Up" / "Submit" / "Learn More"
- Strong: "Start Free Trial" / "Get [Specific Thing]" / "See [Product] in Action"
- Below CTA: Risk reversal + social proof + speed/ease ("No credit card required · 2-min setup · 12,000+ teams use it")

**Hero checklist:**
- [ ] 5-second test: Can a stranger answer what it does, who it's for, why care, what to do?
- [ ] Headline is specific, not generic
- [ ] CTA is benefit-oriented, not "Submit"
- [ ] At least one trust signal visible without scrolling

---

### Section 2: SUCCESS (Conditional)

**Job:** Kill buyer's remorse. This section only appears AFTER someone opts in — it's the confirmation/thank-you experience.

**Elements:**
- Checkmark or confirmation icon
- Clear "You're in" / "You did it" statement
- Deliverable list (exactly what they get, when, how)
- Next step CTA (watch video, check email, join community)
- Optional: Upsell or share-with-friend prompt

**Why this matters:** Most landing page skills skip the post-conversion experience. But buyer's remorse hits within seconds of opting in. A strong success section:
- Confirms they made the right choice
- Shows immediate value (deliverable list makes the abstract concrete)
- Gives them a next action (momentum kills remorse)
- Optionally activates viral loops (share, referral)

**Write the success section even if the page doesn't need it yet** — it becomes the thank-you page spec.

---

### Section 3: PROBLEM-AGITATE

**Job:** Make the status quo painful. Until they feel the problem, they won't value the solution.

**Elements:**
- 3 problems with agitation (not just listing — making each one hurt)
- Personal transition ("I know because I was there" or "Our customers told us...")

**Agitation formula:**
1. Name the problem specifically
2. Quantify the cost (hours, dollars, missed opportunities)
3. Paint the scenario (a moment where this pain is visceral)
4. Show the compounding effect (it gets worse, not better)

**Pain quantification** — do the math:
> "4 hrs setting up emails + 6 hrs designing a landing page + 4 hrs for Stripe webhooks = 22+ hours of headaches."

**Voice source:** Use exact language from audience.md or evergreen voice-of-customer quotes. Mirror the words they use to describe their problem — not your words, theirs.

---

### Section 4: VALUE STACK

**Job:** Make saying no feel stupid. Stack so much value that the price looks like a rounding error.

**Elements:**
- 4 tiers of value, descending from highest perceived value
- Each tier named and priced individually (anchor the value)
- Total value summed up
- Your actual price (the contrast creates the deal)
- Guarantee / risk reversal

**Value stacking structure:**

```
VALUE STACK
├── Tier 1: [Core product/service] — Worth $X
├── Tier 2: [Primary bonus] — Worth $X
├── Tier 3: [Secondary bonus] — Worth $X
└── Tier 4: [Support/community/extra] — Worth $X

Total Value: $XXX
Your Price: $XX  ← (this should feel like a steal)
```

**Sourcing from evergreen:** The evergreen doc's offer section should contain pricing, tiers, bonuses, and guarantee details. Use those as-is. If evergreen doesn't have offer details, ask.

**Pricing psychology:**
- Anchor high (show individual values first)
- Contrast sharply (total value vs your price)
- Remove risk (guarantee, free trial, money-back)
- Add urgency only if authentic (deadline, limited seats, expiring bonus)

**From `/pricing-strategy`:** If the page needs a pricing table (not a single-offer value stack), use good-better-best tiering with the middle tier visually recommended.

---

### Section 5: SOCIAL PROOF

**Job:** Let others convince them. People believe strangers more than they believe you.

**Elements:**
- Section header (results-oriented, not "Testimonials")
- 3 testimonials with specific results (not "great product" — actual outcomes)
- Optional: Logo bar, stats, case study link, review badges

**Testimonial structure (every testimonial must hit this):**
- Named person (not "J.S." or "A customer")
- Role + company (context = credibility)
- Specific result ("cut onboarding time by 60%" not "saved time")
- Optional: Photo, title, link to case study

**Placement rule:** Social proof must appear BEFORE the main CTA, not buried at the bottom. The sequence is: Value Stack → Social Proof → CTA. Proof greases the CTA click.

**From evergreen:** Pull real testimonials, case studies, and proof points from the evergreen doc. Never fabricate testimonials — if proof is thin, flag it and suggest collecting more before shipping.

---

### Section 6: TRANSFORMATION

**Job:** Make the outcome tangible. Show them the before → after so viscerally that they want it.

**Elements:**
- 4 stages of transformation: Quick Win → Compound → Advantage → 10x
- Each stage is a milestone they can picture

**Transformation roadmap:**

```
TRANSFORMATION ROADMAP

Stage 1: QUICK WIN (Week 1)
→ [First tangible result they get within days]
Example: "Your first automated workflow ships in 20 minutes"

Stage 2: COMPOUND (Month 1)
→ [Result that builds on the quick win]
Example: "You're saving 4 hours/week, every week"

Stage 3: ADVANTAGE (Month 3)
→ [Competitive edge that compounds]
Example: "Your team ships 3x faster than peers still doing it manually"

Stage 4: 10x (Year 1)
→ [Transformational outcome that redefines their situation]
Example: "You've replaced an entire ops role with automations — $65k/year back"
```

**Why this works:** Most landing pages sell the tool. The transformation roadmap sells the journey. It makes the outcome concrete and sequential — not "someday maybe" but "here's exactly what happens and when."

**Source from evergreen:** Look for customer journey data, typical time-to-value, and outcome milestones. If the evergreen doc has case studies, extract the timeline from those.

---

### Section 7: SECONDARY CTA

**Job:** Catch the scrollers. Some people read everything and aren't convinced. Others scroll fast and need a second chance to convert.

**Elements:**
- Avatar stack (faces of people who already said yes)
- Question headline ("Ready to [achieve outcome]?" or "Still on the fence?")
- "Yes" button (same CTA as hero, restated)
- Friction reducers repeated (guarantee, free trial, no card)

**This is NOT a repeat of the hero CTA.** The secondary CTA is for a different reader state:
- Hero CTA: For people who were already convinced at the headline
- Secondary CTA: For people who needed the full page argument before deciding

The avatar stack works because of social proof + belonging: "All these people did it, and I can too."

---

### Section 8: FOOTER

**Job:** Professional legitimacy. A bare footer looks like a scam. A real footer builds trust for the people who scroll to the bottom to check.

**Elements:**
- Logo
- Navigation links (key pages, not every page)
- Legal links (Privacy, Terms, Refund Policy)
- Social links
- Optional: Brief tagline or mission restatement

**Anti-pattern:** Don't stuff the footer with CTAs. Its job is legitimacy, not conversion. If someone scrolled past the secondary CTA, another button won't help — but "Privacy Policy" and "Terms of Service" might.

---

## Phase 3: Assemble and Score

### 3.1 Full Page Assembly

Combine all 8 sections into a single landing page document. Output format:

```markdown
# [Product/Offer Name] — Landing Page

## Section 1: Hero
[Eyebrow, headline, subheadline, CTA, trust signals]

## Section 2: Success (Post-Opt-In)
[Confirmation, deliverables, next step CTA]

## Section 3: Problem-Agitate
[3 problems with agitation, personal transition]

## Section 4: Value Stack
[4 tiers, total value, your price, guarantee]

## Section 5: Social Proof
[3 specific testimonials, optional logos/stats]

## Section 6: Transformation
[4-stage roadmap: Quick Win → Compound → Advantage → 10x]

## Section 7: Secondary CTA
[Avatar stack, question headline, yes button, friction reducers]

## Section 8: Footer
[Logo, nav, legal, social]
```

### 3.2 Copy Scoring Rubric

Rate the complete page on 7 dimensions (1-10 each):

| # | Dimension | 10 Looks Like |
|---|-----------|---------------|
| 1 | Clarity | Crystal clear in one read. Zero re-reading required. |
| 2 | Specificity | Every claim has a specific number or example. |
| 3 | Voice | Unmistakably human. Matches voice-profile.md. |
| 4 | Desire | Reader feels FOMO by paragraph 2. Visceral pull toward CTA. |
| 5 | Proof | Specific testimonials, data, case studies. Nothing unsubstantiated. |
| 6 | Urgency | Time-bound + consequence of inaction. Authentic, not manufactured. |
| 7 | Flow | Impossible to stop reading. Slippery slide from headline to CTA. |

**Thresholds:**

| Range | Verdict |
|-------|---------|
| 63-70 (90-100%) | Ship it. |
| 56-62 (80-89%) | Strong. Ship with small tweaks. |
| 49-55 (70-79%) | Passing. Leaving performance on the table. |
| 42-48 (60-69%) | Weak. Rewrite priority sections. |
| Below 42 | Full rewrite needed. |

If the score is below 56, revise the weakest sections before delivering.

### 3.3 Claims Verification

Cross-check every claim against:
- **Evergreen Claims Blacklist** — remove any blacklisted claims
- **Evergreen proof points** — verify numbers and testimonials are sourced
- **Competitors saturated claims** — avoid echoing what 3+ competitors say
- If a claim can't be verified, mark it `[UNVERIFIED — replace with sourced claim]`

### 3.4 A/B Test Recommendations

After the page is assembled, suggest 3-5 tests:

| Test | Priority | Expected Lift |
|------|----------|---------------|
| Headline variant (Direct Benefit vs Story) | HIGH | +15-50% CTR |
| Opening line (Story vs Challenge vs Result) | HIGH | +10-30% scroll depth |
| CTA copy (Benefit vs Command) | MEDIUM | +5-20% CTR |
| Proof structure (Testimonial-first vs Data-first) | MEDIUM | +5-15% conversion |
| Value stack order (Highest value first vs last) | LOW | +5-10% conversion |

---

## Phase 4: File Output and Design Handoff

### 4.1 Write the Page

Write the complete landing page to:

```
marketing/campaigns/{campaign-name}/landing-page.md
```

With frontmatter:

```yaml
---
type: landing-page
campaign: "{campaign-name}"
target_audience: "{segment}"
awareness_level: unaware | problem-aware | solution-aware | product-aware | most-aware
architecture: 8-section
sections: [hero, success, problem-agitate, value-stack, social-proof, transformation, secondary-cta, footer]
variant: a
word_count: 0
date: 2026-05-27
status: draft
score: 0
evergreen_source: "{path-to-evergreen-md}"
---
```

### 4.2 Design Handoff Notes

Create a companion file for the designer/front-end builder:

```
marketing/campaigns/{campaign-name}/design-notes.md
```

Include:
- Section order and which sections are conditional
- CTA button hierarchy (primary vs secondary styling)
- Trust signal placement (above fold, mid-page, pre-CTA)
- Visual direction from `creative-kit.md` (if available)
- Mobile-specific notes (what folds, what stays visible)
- Avatar stack spec (how many faces, sizing)

---

## Worked Example

**Product:** Nomadix Gear portable charger for resort guests
**Source:** `businesses/nomadixgear-sa/nomadixgear/evergreen.md`
**Awareness:** Problem-aware (resorts know guests complain about dead phones, don't know there's a branded solution)

**Evergreen extract:**
- ICP: Resort/hotel GMs, 100+ rooms, guest experience priority
- Pain: Guest complaints about dead phones, lost revenue from bad reviews
- Offer: $X/charger, branded with resort logo, revenue share model
- Proof: "X resorts deployed, Y% fewer guest complaints about charging"
- Claims Blacklist: Don't say "eliminates complaints" (can't verify), use "reduces charging complaints"

**Hero:**
- Eyebrow: Branded Guest Experience
- Headline: "Stop apologizing for dead outlets. Give every guest a charger with your logo on it."
- Subhead: "Nomadix Gear deploys branded portable chargers across your resort. Guests keep their phones alive. You keep your reviews high."
- CTA: "Get a sample charger with your logo →"
- Trust signal: "[X] resorts · [Y]% fewer charging complaints · Average ROI in 60 days"

**Problem-Agitate:**
1. "Dead phones = dead patience" — Guests with 5% battery don't enjoy the pool, they hunt for outlets
2. "The 2-star review you can't undo" — "No outlets by the bed" shows up in 1-star reviews more than you think
3. "Your front desk is a charging station" — Staff wastes time lending out cables and extension cords

**Value Stack:**
- Tier 1: Custom-branded chargers (your logo, your colors) — Worth $X
- Tier 2: Revenue share program (chargers pay for themselves) — Worth $X
- Tier 3: Guest analytics dashboard (see charging patterns) — Worth $X
- Tier 4: Dedicated account manager — Worth $X
- Total value: $XXX · Your investment: $XX per charger

**Transformation:**
- Quick Win: First guest picks up a branded charger and smiles
- Compound: "No outlets" disappears from your reviews
- Advantage: Your resort becomes the one where phones never die
- 10x: Charging becomes a profit center, not a cost

---

## Chain Offers

After completing, present:

- `/page-cro` — Audit the built page against CRO benchmarks before going live
- `/creative` — Generate visual assets (hero images, testimonial cards, CTA buttons)
- `/ab-test-setup` — Set up the headline and CTA tests recommended in Phase 3
- `/lead-magnet` — Build a top-of-funnel asset to drive traffic to this page
- `/email-sequences` — Create the nurture sequence that sends traffic here

---

## Anti-Patterns

| Anti-pattern | Instead | Why |
|-------------|---------|-----|
| Writing copy before checking evergreen | Read evergreen.md FIRST, then write | Evergreen contains ground-truth claims and audience data. Ignoring it produces pages with wrong offers, blacklisted claims, or off-brand messaging. |
| Building all sections equally | Prioritize Hero, Problem-Agitate, Value Stack | These 3 do 80% of the conversion work. The others support but don't drive. |
| Fabricating testimonials or proof points | Mark as [NEEDS PROOF] and flag | Fake testimonials destroy trust and create legal liability. Evergreen docs should have real ones. |
| Using generic headlines ("The best platform") | Specific outcome + timeframe + contrast | Generic headlines fail the 5-second test. Specific headlines stop the scroll. |
| Adding urgency that isn't authentic | Only use real deadlines, limits, or expiring bonuses | Manufactured urgency destroys trust. If there's no real urgency, the Value Stack and Transformation create enough desire. |
| Skipping the Success section | Always write it, even as a separate thank-you page spec | Post-conversion remorse kills retention. A confirmation experience prevents refunds and cancellations. |
| Copying competitor structure | Use competitive data to find white space, not copy structure | If you copy their structure, you copy their positioning. Use their claims map to avoid what's saturated. |
| One CTA only | Primary CTA in hero + Secondary CTA near bottom | 30-50% of converters click the secondary CTA. These are the readers who needed the full argument. |

## YAGNI Principles

- Don't add more than 8 sections — if you need more, the page is trying to do too much
- Don't write 5,000-word sales pages here — this is for landing pages (800-2000 words). Use `/direct-response-copy` for long-form sales pages
- Don't include pricing strategy theory — reference `/pricing-strategy` if needed, don't duplicate it
- Don't build the actual HTML/CSS — this skill produces copy + structure, not code
- Don't audit existing pages — that's `/page-cro`
- Don't do keyword research — that's `/keyword-research`
- Don't generate images — that's `/creative` or `/image-gen`
