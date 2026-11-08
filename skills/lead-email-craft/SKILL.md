---
name: lead-email-craft
repo: https://github.com/clawdbot/clawd
depends-on:
  - hook-generator
description: >
  Generate intelligence-driven, tailor-made sales emails per lead. NOT a template system — each email
  is crafted from CRM data, brand assets, and lead-specific research. Triggers on "craft email for",
  "write email to lead", "draft outreach to", "sales email for", or any request to write a
  per-lead email using brand voice + CRM intel. Also triggers on "lead email", "re-engage lead",
  "follow up with lead", or "write to [lead name]".
---

# lead-email-craft

Intelligence-driven per-lead email generation. Every email is custom-built from CRM intel, brand assets, and lead-specific research. No templates. No merge fields. No "just checking in."

## When to Use This Skill

- Writing a sales email to a specific lead (not batch outreach)
- Re-engaging a stale/cold lead
- Following up with a lead who went quiet
- Responding to an inbound inquiry with substance

## When NOT to Use

- Batch outbound sequences (use `b2b-cold-outreach` instead)
- Social media posts or marketing copy
- Internal communications

---

## Phase 1: CRM Intel (MANDATORY — do this FIRST, before any drafting)

Never draft an email without completing ALL intel steps. Classification determines everything downstream.

### Step 1: Pull Bigin deal record

```bash
npx mcporter call zoho-bigin.Bigin_searchRecords \
  query_parameters='{"module_api_name":"Pipelines","search_criteria":"(Deal_Name:contains:LEAD_NAME)"}'
```

Extract: Deal name, stage, amount, phone, email, description, source, assigned owner, created date, last activity.

### Step 2: Cross-reference Zoho Books

A lead may have an estimate or invoice in Zoho Books with NO record in Bigin. If you only check Bigin, you risk treating a quoted/invoiced lead as "never contacted" or sending duplicate pricing.

```bash
npx mcporter call zoho-books.Estimates_listEstimates \
  query_parameters='{"search_text":"LEAD_NAME"}'
```

```bash
npx mcporter call zoho-books.Invoices_listInvoices \
  query_parameters='{"search_text":"LEAD_NAME"}'
```

If estimates/invoices exist: note what was quoted, amounts, dates, line items. Do NOT re-quote something already quoted.

### Step 3: Check contact history

Look for existing notes, calls, or tasks on the Bigin contact:

```bash
npx mcporter call zoho-bigin.Bigin_getRecords \
  path_variables='{"module_api_name":"Contacts"}' \
  query_parameters='{"search_criteria":"(Email:equals:LEAD_EMAIL)"}'
```

Then pull notes for that contact ID.

### Step 4: CLAIM VERIFICATION GATE — No Fabricated Claims of ANY Kind

**Awareness Check:** Before verifying claims, determine the lead's awareness level from CRM data. See `references/awareness-level-guide.md`. Cold leads are typically problem-aware or solution-aware — use the advertorial funnel approach (validate → cause → mechanism → product), never lead with a product pitch.

Before drafting any email, verify ALL factual claims against authoritative sources. This applies to ALL claim types, not just product specs.

**Four claim categories that require verification:**

| Category | Examples | Authoritative Sources |
|----------|----------|----------------------|
| **Product specs** | model, size, price, material, features, certifications | brand docs, OPS.md, evergreen.md, Zoho Books |
| **Prospect facts** | expansion plans, locations, current setup, timeline, business model | their website, LinkedIn, Bigin CRM notes, lead dossiers |
| **Social proof** | "X resorts use our tents", quantities, locations, client relationship status | Zoho Books invoices, verified social proof docs |
| **Relationship claims** | "expanding with you", "following our conversation", "as discussed" | Bigin CRM thread history, actual prior correspondence |

If ANY claim (spec, prospect fact, social proof, relationship) is NOT documented in a source, you MUST either:
1. Research it from primary sources (their website, supplier docs, product pages)
2. Write it as `[VERIFY: need source]` and flag it for Jairo's review

**NEVER fabricate claims.** This includes prospect business claims ("expanding with you this year"), invented locations ("your Vail property" when Vail isn't on their site), and performance metrics ("installs in days" when no installation data exists). Wrong claims in sales emails destroy trust permanently.

### Step 5: Detect language (CRITICAL)

| Signal | Language |
|--------|----------|
| Phone starts with +52, +53, +54, +55, +56, +57, +58, +502-507, +591, +593, +595, +598, +34 | Spanish |
| Deal description contains Spanish ("cotizar", "precio", "catálogo", "modelos") | Spanish |
| WhatsApp-sourced lead | Likely Spanish |
| Inquiry text is in Spanish | Spanish |
| None of the above | English |

**NEVER mix English and Spanish in the same email.** If Spanish, write the ENTIRE email in Spanish. Use "Hola [Nombre]," NOT "Hi [Nombre]," — the greeting must match the language.

**Spanish rules:**
- "grado marino" NOT "grado marítimo"
- "acero galvanizado" NOT "aluminio" NOT "acero galvanizado en caliente"
- NO voseo (venís, tenés, sabés) — use standard conjugations
- "cotización" not "estimación"
- "lona" for canvas/fabric
- Currency in USD, written as "USD" not "$" alone to avoid confusion

### Step 5: Classify lead warmth

| Classification | Signals | Research Depth |
|----------------|---------|---------------|
| **Warm** | Inbound inquiry, recent activity, deal has description with specifics | Freshness check only — verify their situation is still current |
| **Lukewarm** | Old inquiry, went quiet after seeing price, no response to follow-up | Moderate research — find one new angle/hook |
| **Cold** | Stale deal, no activity in 30+ days, no response to multiple touches | Deep research — website, social, news, competitor usage. Build a profile. |

### Step 6: Extract their inquiry words

From the Bigin deal description, pull the lead's EXACT words. These are your strongest hook material.

Examples:
- "Sería posible me enviaran un catálogo, con modelos y precios" → catalog request in Spanish
- "What are the key differences between enchantents and gome-tribal?" → comparison question
- "Cotización de propuesta/precio" → saw price, went quiet

### Step 7: Check for deal-breakers

- **Jairo handles directly:** Steve Conley, SylvanSport — do NOT outreach
- **ElevenLabs phone not set up:** Never include a phone number for the agent
- **Already quoted in Zoho Books:** Do NOT re-quote with different pricing
- **Lead asked a question that Kareen may have answered by phone:** Never assume an inquiry went unanswered

---

## Phase 2: Load Brand Arsenal (from files, NEVER hardcode)

Read these files at runtime. Product specs change. Pricing changes. The skill must load current data.

### Required reads

```bash
# Product lineup (models, sizes, pricing)
cat /Users/Shared/nomadixgear/business-knowledge/products/tent-specifications.md

# Material specs (what they're made of)
cat /Users/Shared/nomadixgear/business-knowledge/products/technical-specifications.md

# Voice guide (how to sound)
cat ./businesses/nomadixgear-sa/enchantents/brand-assets/voice-guide.md

# Brand overrides (banned terms, material rules, currency)
cat ./businesses/nomadixgear-sa/enchantents/brand-assets/brand-overrides.md

# ICP profiles (who we sell to)
cat ./businesses/nomadixgear-sa/enchantents/brand-assets/icp-profiles.md

# Competitive landscape (for comparison questions)
cat ./businesses/nomadixgear-sa/enchantents/brand-assets/competitive-landscape.md
```

### Critical material specs (verified 2026-05-10)

These are CORRECT. Previous docs said "hot-dip galvanized" — that was WRONG.

- **Structure:** Galvanized steel (NOT aluminum, NOT "hot-dip galvanized")
- **Frame connectors:** Galvanized-steel couplings (2.28mm, Schedule 30), marine-grade epoxy coating
- **Fabric:** Solution-dyed acrylic (Mehler/Masacril), 10+ year fade-proof, mold/mildew resistant
- **Waterproofing:** 360mm water column (never say "with a water column rating" without the number)
- **Warranty:** 5-year manufacturing

### Product model links

Every model name MUST be a markdown link to its page:

```
[Quatin](https://enchantents.com/quatin) — 6.2 m², $3K
[Pentagome](https://enchantents.com/pentagome) — 10.7 m², $4K
[Hexagome](https://enchantents.com/hexagome) — 16 m², $6K
[Qualan](https://enchantents.com/qualan) — 25 m², $7.5K
[Octagome](https://enchantents.com/octagome) — 30 m², $8.5K
[Decagome](https://enchantents.com/decagome) — 48 m², $12.5K
[Zoltan](https://enchantents.com/zoltan) — 50 m², $15K
[Kanton](https://enchantents.com/kanton) — 60 m², $17.5K
[Megagome](https://enchantents.com/megagome) — 70 m², $20K
[Quazar](https://enchantents.com/quazar) — 100 m², $25K
[Kapuma](https://enchantents.com/kapuma) — 108 m², $27.5K
```

Max 2 models per email. Always: link + price + explain WHY it fits their situation.

---

## Phase 3: Research (depth depends on classification)

### Warm leads — freshness check (5 min max)

- Verify their project is still active (website check, recent news)
- Note any changes since last contact
- Skip deep research

### Lukewarm leads — moderate research

- Check their website/social for current projects
- Find ONE new angle since last touch
- If they went quiet after price: prepare value angle (ROI, comparison, social proof)

### Cold leads — deep research

- Website analysis: what they do, current projects, expansion signals
- LinkedIn/social: recent posts, hiring, announcements
- News: funding, acquisitions, permits, expansion plans
- Competitor usage: are they using competitor products? Which ones? What are the gaps?
- Build a one-paragraph lead profile with verified facts ONLY

**Creepiness rule:** Research is for finding genuine business hooks. Never reference personal information. Never say "I saw your post about your daughter's graduation." If you wouldn't say it in a professional conversation, don't write it.

**Never fabricate pain points.** Use actual inquiry + verified facts only. Don't invent "challenges with X" unless you have evidence.

---

## Phase 4: Hook + Subject Line (80% of your effort here)

The subject line determines whether the email gets opened. Spend disproportionate time here.

### Hook-generator integration

Spawn a hook-generator subagent for subject line and opening hook candidates:
```
Load the hook-generator skill and execute the full Phase 1-6 pipeline with this context.
Context:
- WHO: <lead role/industry from CRM>
- WHAT/WHY: <value prop relevant to this lead's inquiry>
- Knife: <lead's specific pain point from their inquiry words>
- Platform: email
- Brand: enchantents
- Target Score: 85
Return ONLY this JSON array: [{"hook":"...","score":<0-100>,"pattern":"...","formula":"..."}]
```
Select top-scored hooks that reference something specific to the lead (their property, their project, their question). Discard any generic hooks that could belong to any lead. If subagent fails, fall back to manual hook/subject construction per rules below.

### Subject line rules

**MUST:**
- Reference something specific to THEM (their property, their project, their question)
- Create curiosity or an open loop
- Stay under 40 characters
- Match the email's language (Spanish subject for Spanish email)

**NEVER:**
- Generic subjects that could belong to any lead (if you could swap the name and it still works, it's too generic)
- "Following up" / "Checking in" / "Circling back"
- "For your project" without naming what the project IS
- Anything about Enchantents — always reference THEM
- Subject lines about "shade solutions" or "glamping infrastructure" — too corporate

**Good examples:**
- "Quick idea for Capella Kenting" (specific property)
- "Gome Tribal vs Qualan — key differences" (their exact question)
- "Cotización Hexagome para Oleovinsa" (specific product + their company, in Spanish)
- "Modular tents for Phantom Canyon" (specific property)

**Bad examples:**
- "Following up on your inquiry" (any lead)
- "Glamping solutions for your project" (what project?)
- "Enchantents product update" (about us, not them)

### Hook construction

The hook is the first sentence. It must be:
1. Specific to THEM (reference their property, their question, their situation)
2. Factually verifiable (never hallucinate a connection point)
3. One sentence

**Good hooks:**
- "Saw the groundbreaking news for Capella Kenting — 65 oceanfront villas on the Hengchun Peninsula is a serious project."
- "You asked about the key differences between our tents and Gome Tribal — here's a straight comparison."
- "Me contacto por su solicitud de catálogo con modelos y precios."

**Bad hooks:**
- "I hope this email finds you well"
- "I'm reaching out because"
- "I wanted to check if [company] is still eyeing glamping infrastructure"

---

## Phase 5: Write the Email

### Structure (Kareen's actual pattern)

1. **Hook** — one sentence, specific to them
2. **Value** — what our product does for THEIR situation, with concrete numbers
3. **Product specs + pricing** — specific model (linked), size, price, WHY it fits
4. **ROI or proof point** — payback timeline, or reference to similar install
5. **Ask** — one clear question, easy to answer on a phone

### Voice rules (NON-NEGOTIABLE)

- **Warm and professional.** "Hi [Name]," not "Hey [Name]," not "Dear [Name]."
- **Lead with substance.** Hook is a specific observation, then immediately into how we can help.
- **Specifics everywhere.** Never "fast delivery" — say "7 business days from production to your site." Never "durable" — say "solution-dyed acrylic, 10+ year fade-proof, 360mm water column waterproofing."
- **Consultative tone.** Solve their problem, don't pitch a product. Frame from their perspective.
- **One clear ask.** Not "let's schedule a call." More like "Want me to send a sample?" or "Should I put together a quote for 3 Octagomes?"
- **4-8 sentences** in the body. Long enough for value, short enough to read on a phone.
- **Sign-off:** "Skye — Enchantents"

### Never say

- "I hope this email finds you well"
- "Just checking in" / "Circling back" / "Following up on this"
- "Yo," "looks sick," "btw," "no joke," or any forced casual slang
- "I'm reaching out because"
- "Synergy," "solution" (as buzzword), "stakeholder," "optimize," "leverage"
- "I'd love to schedule a brief 15-minute discovery call"
- "Frame material isn't specified" (sounds like stupid AI filler)
- "With a water column rating" (without the number: 360mm)
- Anything that could belong to any lead (if you could swap names and it still works, rewrite)
- Competitor product names as recommendations (Twin Peaks, Gloyts, etc.) — terminable offense

### Em dashes

NO em dashes (—) in email body text. Use periods or commas instead. Metadata headers in reasoning files can use dashes.

### Kareen's quote pattern

When a lead saw pricing and went quiet, don't downsell. Use Kareen's pattern:
- Reaffirm the value at the existing price point
- Add context that makes the price make sense (ROI, durability, warranty)
- Offer a concrete next step that reduces friction

**Don't downsell without evidence they can't afford it.** Price is rarely the real objection — it's uncertainty about value.

---

## Phase 6: Reasoning Audit (MANDATORY)

Every email draft MUST have an accompanying reasoning file. No exceptions.

### File naming

```
enq-YYYYMMDD-lead-slug-v1.md           # The email draft
enq-YYYYMMDD-lead-slug-v1-reasoning.md  # The reasoning audit
```

### Reasoning file structure

```markdown
# Reasoning Audit: [Draft ID]

## Lead intelligence
- CRM source: Bigin deal [ID] / Zoho Books estimate [ID]
- Classification: [warm/lukewarm/cold] — [why]
- Language: [English/Spanish — how determined: phone code, inquiry language, country]
- Deal amount: $[amount]
- Last activity: [date]
- Their inquiry words: "[exact quote from deal description]"

## Research findings
- [What you found, with source URLs]
- [Only verified facts, no assumptions]

## Hook logic
- Why this hook: [reason]
- Verified fact it references: [what + source]

## Subject line alternatives (at least 3)
1. [subject] — [why it works]
2. [subject] — [why it works]
3. [subject] — [why it works]
→ Selected: [#] because [reason]

## Model selection
- [Model 1]: Why it fits — [reason tied to lead's situation]
- [Model 2]: Why it fits — [reason tied to lead's situation]

## Language audit
- [ ] Entire email in one language (no mixing)
- [ ] Greeting matches language
- [ ] Spanish: no voseo, "grado marino" not "marítimo", "acero galvanizado" not "en caliente"

## Fact check
- [ ] No hallucinated interaction history
- [ ] No unverified claims about installs/social proof
- [ ] No fabricated pain points
- [ ] No fabricated prospect claims (expansion plans, locations, current setup, timeline)
- [ ] No invented locations (verify every location reference against their website)
- [ ] No fabricated performance claims (installation time, foundation requirements, etc.)
- [ ] No assumption that a question went unanswered (Kareen may have called)
- [ ] Every factual claim in the email has a cited source (Zoho, OPS.md, their website, CRM)
- [ ] Material specs: "galvanized steel" NOT "hot-dip" NOT "aluminum"
- [ ] Water column: "360mm" specified, not vague
- [ ] No em dashes in email body

## What I'm uncertain about
- [Anything you couldn't verify, flagged for human review]
```

---

## Phase 7: Deliver to Human

**Never show approval buttons before the human has read the full email text.** Present both the email and the reasoning file, then ask for approval.

Deliver format:
1. Subject line (with alternatives)
2. Full email body
3. Reasoning audit summary (or link to file)
4. Ask: approve, revise, or kill

---

## Post-Send: Bigin Update (MANDATORY — immediately after every send)

**Every email sent MUST be logged in Bigin before moving to the next lead. No exceptions.**

### Add note

```bash
npx mcporter call zoho-bigin.Bigin_addNotesToSpecificRecord \
  body='{"data":[{"Note_Title":"Email sent YYYY-MM-DD","Note_Content":"Subject: [subject]. Key products: [models]. Ask: [what you asked]. Status: awaiting reply."}]}' \
  path_variables='{"module_api_name":"Pipelines","id":"DEAL_ID"}'
```

### Update deal stage

```bash
npx mcporter call zoho-bigin.Bigin_updateRecords \
  body='{"data":[{"id":"DEAL_ID","Stage":"Contacted"}]}' \
  path_variables='{"module_api_name":"Pipelines"}'
```

### Email sending command

```bash
npx zele mail send \
  --account skye@enchantents.com \
  --from "Skye at Enchantents <skye@enchantents.com>" \
  --to LEAD_EMAIL \
  --subject 'SUBJECT' \
  --body 'BODY'
```

### Reply monitoring

```bash
npx zele mail list --account skye@enchantents.com --limit 100
```

Check for replies after 48 hours. If no reply in 7 days, plan re-engagement with NEW value (never "just checking in").

---

## Quick Reference: Anti-Patterns

| Anti-pattern | Why it fails | What to do instead |
|-------------|-------------|-------------------|
| "Following up on your inquiry" | Could be any lead | Reference their SPECIFIC inquiry words |
| "For your project" | What project? | Name the project/property |
| Em dashes in body | Not how Kareen writes | Use periods or commas |
| "Hot-dip galvanized" | Wrong per Jairo (2026-05-10) | "Galvanized steel" / "acero galvanizado" |
| "Frame material isn't specified" | AI filler | Know the spec or leave it unmentioned |
| "Water column rating" | Vague | "360mm water column" |
| Mixing English/Spanish | Confusing, unprofessional | Entire email in one language |
| "Hi [Name]" in Spanish email | Language mismatch | "Hola [Nombre]," |
| 3+ models in one email | Overwhelming | Max 2, with links and WHY |
| Model name without link | Tells them nothing | Always `[Model](https://enchantents.com/model)` |
| Downselling without evidence | Undermines value | Use Kareen's quote pattern |
| Fabricated pain points | Destroys trust | Use only verified facts |
| Phone number in signature | Not set up yet | Omit until ElevenLabs is configured |
| Recommending competitor products | Terminable | Never. Compare only when they ask. |

---

## STEP N: Copywriting Tournament (RECOMMENDED for subject lines + opening lines)

Generate 3-5 variants of the key subject lines + opening lines, then run them through 5 parallel judge personas to find the winner:

1. Generate 3-5 variants (different angles, formulas, or approaches)
2. Save each to: `content/tournaments/{slug}/variant-1.md` through `variant-N.md`
3. Spawn 5 PARALLEL `build` subagents (one per judge persona):
   - `~/.claude/skills/quality-gate/judge-personas/skeptic.md`
   - `~/.claude/skills/quality-gate/judge-personas/scanner.md`
   - `~/.claude/skills/quality-gate/judge-personas/buyer.md`
   - `~/.claude/skills/quality-gate/judge-personas/expert.md`
   - `~/.claude/skills/quality-gate/judge-personas/outsider.md`
   - Each gets: tournament_dir, variant_count, mode=`cold-email`, original_prompt
4. Collect all 5 JSON results, aggregate: sum weighted_avg per variant across judges
5. Pick winner, apply recommended_edits, save as draft
6. Winner enters standard quality-gate below

**When to use:** Every lead email — the Scanner judge filters anything that does not stop the scroll

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
