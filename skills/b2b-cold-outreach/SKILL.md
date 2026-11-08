---
name: b2b-cold-outreach
description: "Build and execute a B2B cold outreach pipeline: scrape qualified leads, research decision makers, identify pain points, craft pain-point-specific..."
allowed-tools: []
---

# /b2b-cold-outreach — B2B Cold Outreach Pipeline

Build and execute a complete B2B cold outreach pipeline from lead scraping to email sending
and CRM tracking. This skill orchestrates lead discovery, decision-maker research, pain-point
identification, email crafting, and delivery — all tailored to the brand's offering and target
market.

For brand memory protocol, see /cmo [rules/brand-memory.md](../cmo/rules/brand-memory.md).

## On Activation

1. Read `brand/` directory: load `voice-profile.md`, `audience.md`, `positioning.md`, `competitors.md`, `learnings.md` if present.
2. Show what loaded:
   ```
   Brand context loaded:
   ├── Voice Profile   ✓/✗
   ├── Audience        ✓/✗
   ├── Positioning     ✓/✗
   ├── Competitors     ✓/✗
   └── Learnings       ✓/✗
   ```
3. If files missing, note suggestions at the end (e.g., run /brand-voice).
4. Assess the user's request and determine if this is the right skill.
5. Verify brand/ directory has creative-kit.md for visual context (optional but recommended).

## Phase 0: Gate Check

Gate check. Verify this skill is the right one for the request:

| Signal | Action |
|--------|--------|
| User wants to build a B2B prospecting pipeline for a specific region/vertical | Proceed. |
| User needs general marketing advice or brand building | Skip. Run `/cmo` or `/brainstorm` first. |
| User only wants to send emails without research/personalization | Skip. Run `/typefully` or `/email-sequences` for generic blasts. |
| User has no defined offering or target audience | Suggest running `/brand-voice` and `/audience-research` first. |

## Phase 1: Scrape Qualified Leads

Scrape Google Maps and other sources for qualified businesses in the target region/vertical:

1. Define search terms based on brand positioning and target audience:
   - Use `positioning.md` for vertical (e.g., "glamping structures", "eco-resorts")
   - Use `audience.md` for geographic focus (e.g., "Yucatan", "Quintana Roo")
   - Combine: `"[vertical] hotels [region]"`, `"[vertical] resort [region]"`, `"[vertical] lodge [region]"`

2. Execute scraping:
   - If Firecrawl credits available (>0): Use firecrawl to scrape Google Maps results
   - If Firecrawl credits exhausted: Use manual research notes or previously scraped data
   - Extract: business name, website, location, phone, amenities visible from photos

3. Filter leads:
   - Remove businesses that already have the competitor's offering (if known)
   - Keep only those with websites (for further research)
   - Tag each lead with: source, business_type, location, website_url

4. Save raw leads to: `sources/exports/raw-leads.json`

## Phase 2: Enrich and Research Leads

Enrich leads with contact information, decision makers, and pain points:

1. Email enrichment:
   - For each lead website, try to find:
     - General contact: info@, reservations@, bookings@
     - Decision maker emails: look for director, owner, GM, managing director on team pages
     - LinkedIn profiles of key decision makers
   - Save enriched leads to: `sources/exports/enriched-leads.json`

2. Decision-maker research (Playwriter/manual):
   - For top prospects (HOT/WARM tiers), research:
     - Names and titles of owners, GMs, directors
     - Recent news, expansions, renovations
     - Social media activity (LinkedIn, Instagram)
     - Pain points visible from public info (occupancy complaints, expansion desires)

3. Pain point identification:
   - For each lead, identify 1-3 specific pain points based on:
     - Website content (what they emphasize/complain about)
     - Reviews (common guest complaints)
     - Visible gaps (missing amenities, expansion potential)
     - Local market trends (new competitors, changing guest preferences)
   - Tag each lead with: `pain_points` array, `intent_signals`, `amenity_gaps`

4. Tier leads based on outreach readiness:
   - HOT: Has email + decision maker name + clear pain point + no competitor offering
   - WARM: Has email + some research OR pain point inferred
   - COLD: Missing email or minimal data
   - EXISTING: Already has similar offering (partner/competitor)

## Phase 3: Craft Pain-Point-Specific Emails

Craft emails that speak directly to each prospect's pain points in their language:

1. For each HOT/WARM lead with email:
   - Select primary pain point from research (must be specific and verifiable)
    - Craft subject line UNDER 40 characters that touches THAT specific pain point
    - Never use generic product descriptions in subject
    - Never use em dashes (—) in ANY language (AI slop indicator)
    - Use Mexican Spanish (tú not vos) for Mexico prospects
    - Subject must pass: "If I saw this on my phone, would I open it?"

2. **CRITICAL: Verify ALL client data before using it.** Never assume or invent:
   - Every client name, model, quantity, and location used in emails MUST be verified from Zoho Books
   - Use `mcporter call 'zoho-bigin.ZohoBooks_list_invoices'` with `customer_name` filter
   - Use `mcporter call 'zoho-bigin.ZohoBooks_get_invoice'` with `path_variables` for line items
   - Use `mcporter call 'zoho-bigin.ZohoBooks_list_items'` for product catalog
   - The invoice `line_items[].description` contains product model info (name field is often empty)
   - Client info in the email must match WHAT ZOHO BOOKS SAYS - not what you assume
   - **CONSEQUENCE OF LYING**: If you put wrong info about a client (wrong model, wrong units), it destroys Jairo's credibility with the prospect. This is non-negotiable.

3. **CRITICAL: Describe the product in the prospect's language.**
   - For Mexico hoteliers: "carpa de glamping de lujo" + specific materials (lona acrílica 300gr, acero galvanizado, hilo Tenara, 5 años garantía)
   - NOT vague corporate language like "estructuras modulares de alta gama" - that means nothing to a hotelier
   - NOT what the product is NOT (no camping, no safari, no domo) - only what it IS
   - Mention specific model names: Hexagome, Octagome, Decagome, Pentagome, Tatun, Dakini
   - The "por qué nosotros" = local Mexican manufacturer, materials premium, modular system, proven in tropical climate (Habitas, LJS Chichikan, Destino Mío)

4. Key constraints from Jairo's rules:
   - Subject lines under 40 chars, mobile-first
   - Subject MUST touch specific pain point, not generic product info
   - NEVER use em dashes (—) in ANY language
   - NEVER use voseo (venís, tenés, sabés). Use Mexican Spanish.
   - NEVER describe what product is NOT — only what it IS
   - "Why us" = local Mexico manufacturer, modular village system, proven in tropical climate
   - Must reach decision makers (owner/GM/director), NOT info@/reservations@
   - Body must sound human-typed, not marketing copy
   - Hook must be specific (numbers, competitor names), not generic
   - **STOP writing full emails until subject lines are approved first**

4. Subject line approval gate - CRITICAL WORKFLOW:
   - **Write ONLY subject lines first** - 3-4 options per prospect, under 40 chars, pain-point-specific
   - **Present subject lines for user approval** - do NOT write a single body line until approved
   - **Rationale**: If the subject doesn't make them open, nothing else matters. Writing the body first is wasted work.
   - After approval: write body, present for approval again
   - Only after body approval: send + push to CRM

5. Save email drafts to: `outreach/drafts/` as individual files or sequence

## Phase 3.5: Social Proof — Use Cached Evergreen Data First

**Before writing any client claim in an email, use this order of sources:**

1. **Check cached social proof first (`brand-assets/social-proof.md` or evergreen social proof section)**
   - The evergreen already stores verified social proof (client names, verified relationships, testimonial claims)
   - This data was verified from Zoho Books at the time it was written — no need to re-verify every run
   - Load it once, use it across all emails in this batch

2. **Only hit Zoho Books for NEW verification needs** — situations where:
   - A new client name is being used that isn't in the evergreen yet
   - You need specific model/quantity info that the evergreen doesn't have
   - The evergreen social proof is stale (more than 30 days since last update)

3. **If Zoho Books access is needed:**
   ```
   mcporter call 'zoho-bigin.ZohoBooks_list_invoices' \
     --config /path/to/mcporter.json \
     'query_params={"organization_id":"2738724","per_page":"200","customer_name":"Client Name"}'
   ```
   Invoice line items: `name` is often empty — read `description` instead.

4. **After Zoho Books verification, update the evergreen's social proof section** so the next run doesn't need to re-verify.

5. **NEVER** put a client claim in an email that isn't supported by either the evergreen or Zoho Books.
   - Wrong: "Instalamos Hexagome y Pentagome con Habitas" (if Zoho shows replacement panels)
   - Right: "Trabajamos con Habitas" (general, verified relationship)
   - Right: "Destino Mío nos compró terraza para Hexagome en Tulum este año" (specific, verified from INV-1092 line items)

## Phase 4: Send Emails and Track in CRM

Send approved emails and track engagement:

1. SMTP Setup:
   - Use credentials from `.env`: SKYE_SMTP_HOST, SKYE_SMTP_PORT, SKYE_SMTP_USER, SKYE_SMTP_PASS
   - Verify connection before sending
   - From: skye@enchantents.com (or brand equivalent)
   - Rate limit: 5 seconds between sends

2. Sending Process:
   - For each approved email draft:
     - Parse subject and body
     - Send via SMTP (nodemailer or equivalent)
     - Log result to: `outreach/sent/tracking.csv` with columns:
       timestamp, lead_email, business_name, template, sequence_step, smtp_status, lang

3. CRM Integration (Bigin/Zoho):
   - Only send leads with verified emails to CRM
   - For each sent lead:
     - Create Contact in Bigin with: First_Name, Last_Name, Email, Phone, Company, Description, Source
     - Create Deal linked to Contact with: Deal_Name, Stage (Primer contacto), Pipeline, Description
     - Track sync in: `sources/exports/bigin-sync.json` to avoid duplicates
   - Use mcporter for Zoho access: `npx mcporter@latest call 'zoho-bigin.ZohoBooks_list_invoices' --config ./config/mcporter.json`

## Phase 5: Review and Optimize

Review results and suggest next steps:

1. Check sent emails tracking for:
   - Delivery rates, opens (if tracking enabled)
   - Replies and engagement
   - Patterns in what subject lines/worked

2. Update learnings.md with:
   - What subject lines got opens/replies
   - Which pain points resonated
   - Which decision makers responded
   - Any changes to ideal customer profile

3. Suggest next actions:
   - Run skill again with refined search terms
   - Create follow-up sequence for non-responders
   - Route interested leads to sales nurture
   - Run /deepen-plan if strategy needs validation

## Worked Example

**User request:** 'Build a B2B cold outreach pipeline for Enchantents glamping structures targeting hotels in Yucatan and Quintana Roo, Mexico'

**Execution:**
1. **Gate Check**: Confirmed - user wants B2B pipeline for specific region/vertical
2. **On Activation**: Loads brand/ files (finds evergreen.md showing two segments: A=resort developers, B=smaller operators)
3. **Phase 1 - Scrape**:
   - Search terms: "glamping hotels Yucatan", "eco resorts Quintana Roo", "sustainable lodge Riviera Maya"
   - Scrapes 28 qualified prospects from Google Maps
   - Saves to sources/exports/raw-leads.json
4. **Phase 2 - Enrich**:
   - Finds emails for 19 prospects
   - Researches decision makers via Playwriter/LinkedIn:
     - Lourdes Vila (Cabañas Tulum) - Commercial Director
     - Alejandra Abella (Namron Hospitality) - Managing Director
     - Roth (AZULIK) - Founder
     - Daniel Aguayo (Ahau Collection) - Owner
     - LUV Tulum team - Ownership group
     - Colibri Boutique Hotels - Manages La Zebra
   - Identifies pain points:
     - Namron: Only 22 suites at La Valise, wants to expand without new construction
     - Cabañas Tulum: Wants extra occupancy without construction disruption
     - AZULIK: Expanding to new territories but wants zero concrete impact
     - Ahau: Has unused jungle land generating $0
     - LUV: 5 acres with 3 cenotes but zero installations
     - Colibri: 20 years in Tulum but has undeveloped land
   - Tiers 6 as HOT (decision maker + email + clear gap)
5. **Phase 3 - Craft Emails**:
   - Writes 6 subject lines focused on SPECIFIC pain points:
     - Alejandra: "La Valise solo tiene 22 suites" (22 suites = specific, verifiable)
     - Lourdes: "Ocupación extra en 3 semanas" (specific timeframe)
     - Roth: "Roth, zero concreto" (matches their brand language)
     - Daniel: "Ahau tiene tierra desperdiciada" (specific asset)
     - LUV: "5 acres vacíos generando $0" (specific dollar amount)
     - Colibri: "Colibri tiene terreno sin monetizar" (speaks to their asset mindset)
   - Waits for subject line approval (per Jairo's rule) ✓
   - After approval, writes first draft of bodies but makes MISTAKES:
     - ❌ Uses "estructuras modulares de alta gama" (vague, means nothing)
     - ❌ Says "Hexagome y Pentagome con Habitas" **(UNVERIFIED - invented, not in Zoho Books)**
     - ❌ Says "40+ unidades en LJS Chichikan" **(UNVERIFIED - assumed quantity)**
   - Jairo catches these mistakes and corrects:
     - ✅ Describe product as: "carpa de glamping de lujo" + materials (lona acrílica 300gr, acero galvanizado, hilo Tenara, 5 años garantía)
     - ✅ Verify ALL claims in Zoho Books before writing:
       - Habitas invoices show replacement panels for Bacalar structures - say "trabajamos con Habitas en Bacalar" (general)
       - LJS Chichikan has 14 invoices with Decagome + Tatun - say "14 facturas con LJS Chichikan" (verified)
       - Destino Mío bought Hexagome terrace kit in 2026 - say "Destino Mío nos compró terraza para Hexagome en Tulum este año" (specific, verified)
     - ✅ Product models = specific: Hexagome, Octagome, Decagome, Pentagome, Tatun, Dakini (from products.md / Zoho Books items)
   - Learns: never write data you haven't verified from Zoho Books
   - Learns: describe product in prospect's language, not corporate-speak
   - Corrects all 6 emails with verified data before presenting for approval
6. **Phase 4 - Send and Track**:
   - Sends 6 emails via SMTP from skye@enchantents.com
   - Pushes 6 leads to Bigin CRM as Contacts + Deals in "Proceso de venta" → "Primer contacto"
   - Logs all to tracking.csv and bigin-sync.json
7. **Phase 5 - Review**:
   - Suggests waiting 3-4 days for replies
   - Recommends creating 3-touch follow-up sequence
   - Notes to update learnings.md with which subject lines performed best

---
## Chain Offers

- `/deepen-plan` — if you need to validate positioning or messaging with deeper research
- `/email-sequences` — to create automated follow-up sequences for non-responders
- `/typefully` — to schedule LinkedIn outreach for prospects without emails
- `/page-cro` — if you create a landing page for these prospects to visit

---
## Anti-Patterns

| Anti-pattern | Instead |
|-------------|---------|
| Using generic subject lines like "Glamping opportunity for [Business]" | Subject lines must touch SPECIFIC, verifiable pain point (e.g., "La Valise solo tiene 22 suites") |
| Sending to info@/reservations@ without targeting decision maker | Must reach actual decision makers (owner/GM/director) - Jairo called this lazy |
| Describing what product is NOT ("no son carpas safari") | Only describe what it IS (carpa de glamping de lujo, lona acrílica 300gr, acero galvanizado, 5 años garantía) |
| Using em dashes (—) in any language | No em dashes in ANY language. Use a period, comma, or colon instead. Applies to English copy too. |
| Writing full emails before subject line approval | STOP - if they don't open, nothing else matters. Get subjects approved first. |
| **Inventing client data (models, quantities, locations)** | **ALWAYS verify from Zoho Books via mcporter first. "Trabajamos con Habitas" is OK. "Instalamos Hexagome y Pentagome con Habitas" is a LIE unless Zoho Books confirms it.** |
| Using vague product descriptions like "estructuras modulares de alta gama" | Say what the product IS: "carpa de glamping de lujo con lona acrílica 300gr, acero galvanizado, hilo Tenara" |
| Using generic proof like "we're the best" | Use specific local proof: "Trabajamos con Habitas en Bacalar, Destino Mío en Tulum, LJS Chichikan en Valladolid (14 facturas)" |
| Forgetting to track in CRM | Every sent email must create a Contact + Deal in Bigin for traceability |
| Sending blasts without personalization | Each email must reference the specific pain point discovered in research |
| Using English for Mexico prospects | Match prospect's language - use Mexican Spanish for Mexico businesses |
| Making product description the hero | Product is the solution to THEIR pain point - lead with THEIR problem |
| **Trying to find data via raw web search instead of Zoho Books** | Client data lives in Zoho Books, accessed via mcporter. Don't guess, don't web search - use the CRM. |
| **Writing what you think is true instead of what Zoho Books says** | If Zoho Books shows "replacement panels" not "Hexagome units", then say "replacement panels" or keep it general. Never upgrade the truth. |
| **Over-describing social proof** | Keep it general when you don't have specifics. "Trabajamos con Habitas" is enough. You don't need to say models or quantities if you're not sure. |
| **Hitting Zoho Books on every run for cached data** | Use the evergreen's social proof section first. It was verified when written. Only hit Zoho Books for NEW verification needs not in the evergreen. Update evergreen after verifying new data. |

---
## YAGNI Principles

- Don't add LinkedIn automation unless user explicitly asks for multi-channel
- Don't create complex email sequences (>3 touches) until first sequence validated
- Don't build custom tracking beyond SMTP logs + CRM until volume justifies it
- Don't create separate skills for each vertical - this skill is brand-agnostic
- Don't over-engineer the CRM sync - simple JSON file is fine for <100 leads/month
- Don't add email open tracking unless SMTP service supports it reliably
- Don't create HTML-rich emails - plain text sounds more human (Jairo's preference)
- Don't send more than 20-30 emails/day per sender to avoid spam flags
- Don't research beyond what's publicly available (no paid databases unless budgeted)
- Don't try to close in first email - goal is to start conversation, not sell