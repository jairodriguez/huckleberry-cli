---
name: warm-outbound
description: >
  Pipeline that scrapes X engagers (likers + repliers on your posts), filters by ICP, enriches with email/contact info,
  drafts warm outreach messages referencing the specific post they engaged with, and tracks the pipeline in a local JSON tracker.
  Based on Finn Mallery's "WARM OUTBOUND" framework — reach out to people who've already seen your content.
  X → LinkedIn DM / Email outreach. NOT X DMs. NOT automated posting.
depends-on:
  - x-playwriter
  - lead-email-craft
  - send-email
  - hook-generator
trigger: >
  "warm outbound", "scrape engagers", "warm prospects", "reach out to likers",
  "who liked my posts", "warm outreach pipeline", "Finn Mallery warm outbound",
  "scrape my X engagers", "warm inbound"
---

# warm-outbound

**Dual-feed pipeline:** Google Maps (cold B2B) + X Engagers (warm) → Filter → Draft → Track

Reach decision-makers at businesses in your target verticals. Two source options:
- **Google Maps** — scrape resorts, hotels, agencies, etc. by search query. Free, unlimited.
- **X Engagers** — people who've liked/replied to your X posts. Warm, known audience.

The whole pipeline takes ~15 min to run (Maps) or ~30 min (X).

## System Architecture

**Awareness Gate:** Warm outbound targets problem-aware or solution-aware leads. Before drafting any message, determine the lead's awareness level from their engagement context (which post they engaged with, what it was about). Use the advertorial funnel approach from `references/awareness-level-guide.md` — never lead with a product pitch.

```
Google Maps ─→ scrape-maps-leads ──→ maps-leads-raw.json
                                            │
                                            ▼
                                     normalize-maps.js ──┐
                                                          │
X Profile ────→ scrape-x-engagers ──→ engagers-raw.json ──┤
                                                          │
                                                          ▼
                                                   filter-icp.js ──→ qualified.json
                                                          │
                                                          ▼
                                                   enrich-and-draft.js ──→ drafts/
                                                          │
                                                          ▼
                                                   Discord approval gate
                                                          │
                                                          ▼
                                                   Send (LinkedIn DM / email)
                                                          │
                                                          ▼
                                                   track.json
```

## Prerequisites

- **Chrome** with Playwriter extension installed + active session
- **For Google Maps scraping:** Chrome logged into Google (for richer results, not strictly required)
- **For X scraping:** X account logged in Chrome
- **For email outreach:** `send-email` skill + Resend API key
- **For LinkedIn outreach:** `contact-goat` for profiles, browser for DMs
- **A fresh `config.json`** at `businesses/{tenant}/warm-outbound/config.json`

## Pipeline Steps

### Step 0: Google Maps Lead Scraping (Alternative Feed)

Scrapes Google Maps for businesses matching a search query (e.g., "luxury hotels in Tulum", "digital agencies in Austin").
Extracts name, category, rating, address, phone, and website for each business.

**Script:** `scripts/warm-outbound/scrape-maps-leads.sh`

**Usage:**
```bash
./scripts/warm-outbound/run.sh --step maps --query "luxury hotels in Tulum" --limit 30
```

**Or standalone:**
```bash
bash scripts/warm-outbound/scrape-maps-leads.sh \
  --query "glamping resorts mexico" \
  --limit 20 \
  --session 1
```

**How it works:**
1. Opens Google Maps search results in Chrome via Playwriter
2. Scrolls the results panel to load more businesses (up to --limit)
3. Visits each business page to extract phone, website, and address
4. Saves to `maps-leads-raw.json`

**Normalization:**
```bash
node scripts/warm-outbound/normalize-maps.js \
  --tenant aiwithjai
```
Converts Maps fields (name, category, address) into the standard `engagers-raw.json` format
so `filter-icp.js` and `enrich-and-draft.js` can process them unchanged.

**Output:**
```json
{
  "scrapedAt": "2026-06-17T00:00:00Z",
  "query": "luxury hotels in Tulum",
  "totalLeads": 25,
  "leads": [
    {
      "name": "Hotel Esencia",
      "rating": "4.7",
      "category": "Hotel",
      "address": "Carretera Federal 307, Tulum",
      "phone": "+52 984 123 4567",
      "website": "https://hotelesencia.com"
    }
  ]
}
```

### Step 1: Scrape X Engagers (Warm Feed)

Uses `x-playwriter` to:
1. Navigate to your X profile
2. Extract your recent posts (configurable: last N days or N posts)
3. For each post: open it, scrape likers (click likes modal), scrape repliers
4. Deduplicate across posts (same person engaging multiple times = hotter)
5. Save to `engagers-raw.json`

**Script:** `scripts/warm-outbound/scrape-x-engagers.sh`

Output:
```json
{
  "scrapedAt": "2026-06-17T00:00:00Z",
  "handle": "@AIwithJai",
  "postsScraped": 10,
  "totalEngagers": 247,
  "engagers": [
    {
      "handle": "@user123",
      "displayName": "Jane Smith",
      "bio": "CEO at LawCorp | legal AI enthusiast",
      "profileUrl": "https://x.com/user123",
      "engagementType": "like",
      "postText": "AI employees are replacing entire departments...",
      "postUrl": "https://x.com/AIwithJai/status/123456",
      "postTopic": "AI employees",
      "engagementCount": 2,
      "firstEngaged": "2026-06-15"
    }
  ]
}
```

### Step 2: Filter by ICP

Scores each engager against the target ICP based on bio keywords, display name signals, and engagement patterns.

**Script:** `scripts/warm-outbound/filter-icp.js`

**Default ICP (AIwithJai):**
- **Target roles:** founder, CEO, COO, CTO, director, partner, head of, owner, principal, vp, president
- **Target verticals:** law, legal, real estate, property, marketing, agency, insurance, wholesale, manufacturing, construction
- **Exclude:** student, healthcare, finance, AI consultant, freelancer (unless strong role signal)
- **Score boost:** engaged multiple times, replied (vs liked), bio mentions pain keywords

Output: `qualified.json` — sorted by score, top-tier only.

### Step 3: Enrich + Draft Messages

For each qualified prospect:
1. Enrich with email via `contact-goat` (Happenstance/Deepline) — optional, human-gated
2. Generate a personalized warm message referencing their specific engagement
3. Template: "hey {NAME}, saw you liked my post on {TOPIC}. let me know if you'd ever want to connect to chat on it."
4. Draft an email version and a LinkedIn DM version

**Script:** `scripts/warm-outbound/enrich-and-draft.js`

Output: One JSON file per prospect in `drafts/` — pending approval.

### Step 4: Discord Approval Gate (MANDATORY)

Never send messages without human approval. Per AGENTS.md §1c: all automated outreach requires Discord approval gate.

For each draft, show in Discord:
- **Prospect:** handle, name, title, company
- **Warm signal:** which post they engaged with + how
- **Draft message:**
- **Buttons:** Approve / Edit / Reject / Skip

### Step 5: Send + Track

Approved messages are sent via the appropriate channel:
- **LinkedIn DM** → manual or playwriter-assisted
- **Email** → `send-email` skill (Resend)
- **Next follow-up** → tagged in tracker for Day 3/7 follow-up

**Tracker:** `track.json`
```json
{
  "prospects": [
    {
      "handle": "@user123",
      "status": "sent",           // new | drafted | approved | sent | replied | booked | closed | rejected
      "channel": "linkedin-dm",
      "messageSent": "hey Jane...",
      "sentAt": "2026-06-17",
      "replyAt": null,
      "followUpAt": "2026-06-20",
      "notes": "Engaged on AI employee post. CEO of law firm. Strong fit."
    }
  ],
  "stats": {
    "totalProspects": 20,
    "sent": 5,
    "replied": 2,
    "booked": 1
  }
}
```

## Weekly Automation Cadence

```
Monday 9 AM UTC → scrape new engagers (last 7 days)
                → auto-dedup against track.json
                → filter + score
                → generate drafts
                → post to Discord: "X new warm prospects, Y qualified, Z drafts ready"
                → await approval

Tuesday → send approved messages
Friday  → check for replies → trigger follow-ups
```

## Config (`config.json`)

```json
{
  "handle": "@AIwithJai",
  "tenant": "aiwithjai",
  "offer": "AI Workflow Audit ($999 → $25K/yr)",
  "offerUrl": "https://ai.withjai.com/ai-employee/",
  "maxPosts": 15,
  "maxDays": 14,
  "icp": {
    "targetRoles": ["founder","ceo","coo","cto","director","partner","head of","owner","principal","vp","president"],
    "targetVerticals": ["law","legal","real estate","property","marketing","agency","insurance","wholesale","manufacturing","construction"],
    "excludeKeywords": ["student","looking for","healthcare","physician","doctor","nurse","finance","banker","investor","ai consultant","ai agent builder","freelancer"],
    "boostKeywords": ["ai employee","workflow automation","ai automation","ops","operations","scaling","growth","revenue","efficiency"],
    "minScore": 3
  },
  "outreach": {
    "sequence": [
      { "touch": 1, "delay": 0, "channel": "linkedin-dm" },
      { "touch": 2, "delay": 3, "channel": "linkedin-dm" },
      { "touch": 3, "delay": 4, "channel": "email" },
      { "touch": 4, "delay": 3, "channel": "email" },
      { "touch": 5, "delay": 4, "channel": "linkedin-dm", "type": "breakup" }
    ]
  }
}
```

## When to Use

- **Google Maps pipeline:** Any time — scrape free, unlimited business leads by location/vertical. Best for Enchantents (resorts, hotels) and Nomadixgear (outdoor retailers).
- **X Engagers pipeline:** Weekly, Monday morning scrape last 7 days. Immediately after a high-engagement post.
- Before any outreach batch: check the tracker to avoid re-messaging people
- When pipeline is empty: run a Maps query for your target vertical

## When NOT to Use

- When you need the same person messaged multiple times — tracker auto-blocks re-messaging
- For X DMs — platform penalizes mass DMs; LinkedIn DM or email only
- For pure warm angle ("saw you liked my post") — Maps leads are cold; they need B2B outreach framing

## Run Examples

```bash
# Maps pipeline (recommended — feed is always available)
./scripts/warm-outbound/run.sh --query "luxury resorts in Cancun" --limit 30

# X engagers pipeline (needs active account engagement)
./scripts/warm-outbound/run.sh --step scrape

# Full pipeline from Maps
./scripts/warm-outbound/run.sh \
  --tenant enchantents \
  --query "glamping resorts Mexico" \
  --limit 50

# Step by step
./scripts/warm-outbound/run.sh --step maps --query "hotels Tulum"
./scripts/warm-outbound/run.sh --step normalize
./scripts/warm-outbound/run.sh --step filter
./scripts/warm-outbound/run.sh --step draft
```
