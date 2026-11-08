---
name: earned-media
description: "PR pitching skill for getting coverage in authority outlets that AI search engines trust. AI engines (ChatGPT, Perplexity, Google AI Mode) cite..."
allowed-tools: []
---

# /earned-media — PR Pitching for AI Search Authority

AI search engines treat mentions in authoritative publications (Forbes, Inc, TechCrunch, industry journals) as the strongest trust signal. A single Forbes mention can move your AI citation rate more than 50 blog posts. This skill finds the right journalists, crafts pitches they'll actually read, and tracks outreach.

For brand memory protocol, see /cmo [rules/brand-memory.md](../cmo/rules/brand-memory.md).

## On Activation

1. Read `brand/` directory: load `positioning.md`, `competitors.md`, `audience.md` if present.
2. If `brand/marketing/seo/ai-visibility-audit.md` exists, load it — check if PR/Forbes gaps were identified.
3. If `original-research` output exists (research reports, data), load it — original data is the best pitch hook.
4. Show what loaded:
   ```
   Brand context loaded:
   ├── Positioning         ✓/✗
   ├── Competitors         ✓/✗
   ├── Audience            ✓/✗
   ├── AI Visibility Audit ✓/✗
   ├── Original Research   ✓/✗
   ```
5. Determine mode:
   - **Full Campaign** — Research journalists + craft pitches + track outreach (default)
   - **Pitch Only** — Craft pitches for a specific journalist or outlet the user names
   - **Journalist Research** — Just find the right journalists, no pitch writing

---

## Phase 1: Journalist Research

### Find Reporters Who Cover Your Space

Search for journalists using these methods:

**Method 1: Competitor coverage mining**
1. Search `site:forbes.com "{competitor}"` and `site:techcrunch.com "{competitor}"` for each competitor
2. Note the bylines — these journalists already cover your category
3. Collect: name, outlet, recent article title, article date

**Method 2: Topic-based search**
1. Search `site:forbes.com OR site:inc.com "{your category}"` (e.g., "AI agents for business")
2. Search `site:techcrunch.com "{your vertical}"` 
3. Filter for articles from the last 6 months — active reporters only

**Method 3: HARO / Connectively monitoring**
1. Check https://connectively.us (formerly HARO) for journalist queries in your domain
2. These are journalists actively seeking sources — highest response rate

**Method 4: Twitter/X journalist lists**
1. Search X/Twitter for journalists in your space: `"{topic}" (journalist OR reporter OR editor)`
2. Note their recent tweets — what stories are they working on?

### Journalist Database Output

Write to `brand/marketing/earned-media/journalists.md`:

```markdown
## Journalist Database — {Brand}

| Name | Outlet | Beat | Recent Article | Date | Contact Method | Pitch Angle |
|------|--------|------|---------------|------|---------------|-------------|
| Jane Smith | Forbes | AI/ML in business | "How AI Agents Are Changing Small Business Operations" | 2026-05-15 | jsmith@forbes.com | Our pricing data |
| ... | ... | ... | ... | ... | ... | ... |
```

### Targeting Rules

- **Only pitch journalists who actively cover your category.** A Forbes tech reporter who covers crypto won't care about your AI consulting service.
- **Prioritize journalists who cited your competitors.** They already know the space and need fresh sources.
- **Check recency.** If their last relevant article was >6 months ago, they may have moved to a different beat.
- **Target 15-20 journalists** per campaign. Expect 2-5 responses.

---

## Phase 2: Craft the Pitch

### Pitch Formats

**Format 1: Data-First Pitch (highest success rate)**

Use when you have original research or proprietary data from `original-research` skill.

```
Subject: New data: [surprising stat from your research]

Hi [Name],

I saw your recent piece on [their recent article] — great coverage of [specific point].

I just completed a study of [sample size] [audience] on [topic], and found something
that contradicts the conventional wisdom:

[Surprising stat with specific numbers]

For context: [2-3 sentences of context]

Would this be useful for a follow-up piece? Happy to share the full dataset.

[Your name]
[Your title], [Your brand]
[Link to research report]
```

**Format 2: Expert Source Pitch**

Use when you're offering yourself as a source for their ongoing coverage.

```
Subject: Source for [topic] coverage — [your unique angle]

Hi [Name],

I've been building [your product/service] for [audience] for [timeframe].
A few observations from the trenches:

- [Specific, non-obvious insight 1]
- [Specific, non-obvious insight 2]
- [Contrarian take relevant to their beat]

If you're writing about [topic] again, happy to be a source.

[Your name]
[Your title], [Your brand]
```

**Format 3: News Peg Pitch**

Use when there's breaking news (Google I/O, new AI model release, policy change) that your brand has a relevant take on.

```
Subject: [Brand] take on [breaking news event]

Hi [Name],

With [news event] today, here's what this means for [your audience]:

[Your unique angle — not generic commentary]

[Specific implication with data or example]

Available for comment if helpful.

[Your name]
```

### Pitch Quality Rules

1. **Subject line under 10 words.** Journalists get 200+ pitches per day. Specificity beats cleverness.
2. **Lead with value, not your brand.** The pitch should help them write a better article, not promote your product.
3. **Include specific numbers.** "73% of our 200 clients" beats "most of our customers."
4. **Reference their recent work.** Proves you read their stuff, not just mass-emailing.
5. **Keep it under 150 words total.** If they're interested, they'll ask for more.
6. **Never attach files to cold pitches.** Link to the research instead.
7. **One pitch per journalist.** If they don't respond, follow up once after 5 days. Then stop.

---

## Phase 3: Outreach Tracking

### Pipeline

Write to `brand/marketing/earned-media/pitch-tracker.md`:

```yaml
---
brand: "{brand}"
campaign_start: "{YYYY-MM-DD}"
pitches_sent: 0
responses: 0
coverage: 0
---

## Pitch Tracker

| Journalist | Outlet | Pitch Sent | Subject Line | Status | Follow-up | Response Date | Coverage |
|-----------|--------|-----------|-------------|--------|-----------|--------------|----------|
| Jane Smith | Forbes | 2026-05-27 | "New data: 73% of..." | Sent | 2026-06-01 | — | — |
```

### Status Values

| Status | Meaning | Next Action |
|--------|---------|-------------|
| Draft | Written but not sent | Send via `send-email` skill |
| Sent | Delivered, awaiting response | Schedule follow-up for 5 days out |
| Followed Up | One follow-up sent | Wait. No second follow-up. |
| Responded | Journalist replied | Engage. Provide what they need. Fast. |
| Passed | Journalist declined | Thank them. Move on. |
| Coverage | Article published with your brand | Log the URL. Share everywhere. Feed back into AI consensus. |
| Ghosted | No response after follow-up | Mark as ghosted. Try again in 3 months with a different angle. |

### Follow-Up Rules

- **One follow-up only**, sent 5 business days after the original pitch.
- Follow-up should add one new piece of information, not just "bumping this."
- Never send a second follow-up. Journalists interpret persistence as spam.

---

## Phase 4: Coverage Amplification

When you get coverage:

1. **Share everywhere** — X thread, LinkedIn post, Medium article, Reddit (if genuine). The coverage itself becomes a new citation source for AI engines.
2. **Link to the article** from your website (blog post: "As seen in Forbes...").
3. **Add to your brand's credibility page** — "Featured in: Forbes, TechCrunch..."
4. **Feed back into AI visibility** — Run `ai-visibility-audit` to see if the coverage moves your citation rate.
5. **Thank the journalist** — Builds the relationship for future coverage.

---

## Worked Example

**User request:** "Get press coverage for aiwithjai"

**Phase 1:** Search for journalists covering "AI agents for small business." Find 18 reporters: 5 at Forbes, 3 at Inc, 4 at TechCrunch, 3 at VentureBeat, 3 at industry blogs. Note 6 of them wrote about competitors Lindy.ai or Harvey.ai in the last 3 months.

**Phase 2:** Use the `original-research` skill's pricing data ("AI agent setup costs $5K-$400K from agencies, but $999 from specialists"). Craft data-first pitch: "New data: Small businesses overpay 10-50x for AI agent setup." 

**Phase 3:** Send 15 pitches via `send-email` skill. Track in pitch-tracker.md. Follow up on 5 that got no response after 5 days. Get 3 responses, 1 commitment to include in upcoming roundup article.

**Phase 4:** Forbes publishes a roundup mentioning aiwithjai's $999 price point. Share as LinkedIn article, X thread, and Medium cross-post. The Forbes mention now becomes an AI-citation signal across all engines.

---

## Chain Offers

After completing, present:

- `/ai-consensus-builder` — Use the coverage to build consensus across more platforms
- `/ai-visibility-audit` — Check if coverage improved AI citations
- `/original-research` — Produce more pitch-worthy data
- `/content-atomizer` — Amplify the coverage across social platforms
- "Schedule monthly PR check" — Monitor for new journalist queries and coverage opportunities

---

## Anti-Patterns

| Anti-pattern | Instead | Why |
|-------------|---------|-----|
| Mass-emailing 100 journalists with the same pitch | Research 15-20 relevant journalists, personalize each pitch | Generic pitches get deleted. Journalists talk — a bad pitch burns the outlet forever. |
| Leading with your product | Lead with data, insight, or a story | Journalists don't care about your product. They care about writing something their readers will share. |
| Pitching "we launched a product" as news | Pitch the trend, insight, or data your product reveals | Product launches aren't news unless you're Apple. Original findings are always news. |
| Following up 3+ times | One follow-up, then stop | Persistence = spam. Journalists remember who spammed them. |
| Writing the article for them | Provide facts, quotes, and data — let them write | Journalists have their own voice and editorial standards. Pre-written copy gets ignored. |
| Pitching embargoed news to non-exclusive outlets | Offer exclusivity to one outlet, then broaden | Exclusivity increases your chances dramatically. Save the big data for one top-tier outlet. |

## YAGNI Principles

- Don't build a media database — manual research produces better-targeted pitches
- Don't automate pitch sending — each pitch needs genuine personalization
- Don't track every journalist on earth — 15-20 well-targeted ones per campaign
- Don't write press releases — journalists ignore them. Pitch emails work better.
- Don't create a press page until you have actual coverage to show
