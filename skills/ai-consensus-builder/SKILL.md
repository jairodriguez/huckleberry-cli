---
name: ai-consensus-builder
description: "Orchestrate multi-platform presence so AI search engines see consensus that your brand is authoritative."
allowed-tools: []
---

# /ai-consensus-builder — Multi-Platform Presence for AI Search

AI search doesn't rank pages. It builds consensus. When Perplexity, ChatGPT, or Google AI Mode answer a question, they look for signals across many sites: does this brand appear on LinkedIn? Reddit? YouTube? Review sites? PR outlets? If the answer is yes across multiple sources, the AI trusts the consensus and cites the brand.

If you only exist on your own website, you're invisible to AI search no matter how good your content is.

This skill audits where you show up across the platforms AI engines pull from, identifies gaps, and orchestrates the creation of platform-native content to fill them.

For brand memory protocol, see /cmo [rules/brand-memory.md](../cmo/rules/brand-memory.md).

## On Activation

1. Read `brand/` directory: load `positioning.md`, `competitors.md`, `audience.md` if present.
2. If an `ai-visibility-audit` exists at `brand/marketing/seo/ai-visibility-audit.md`, load it — the source platform analysis section is direct input.
3. Show what loaded:
   ```
   Brand context loaded:
   ├── Positioning         ✓/✗
   ├── Competitors         ✓/✗
   ├── Audience            ✓/✗
   ├── AI Visibility Audit ✓/✗
   ```
4. Determine mode:
   - **Audit + Build** — Check platform presence, then create content for gaps (default)
   - **Audit Only** — Just check where the brand appears and report gaps
   - **Build Specific** — Create content for a specific platform the user names

---

## The AI Consensus Model

### How AI Search Builds Consensus

```
User asks: "Best AI agent consulting service for small businesses?"
                    ↓
AI engine queries multiple sources:
  ├── Web index (Google, Bing, Brave)
  ├── Reddit threads
  ├── YouTube videos + descriptions
  ├── LinkedIn articles
  ├── Medium posts
  ├── G2 / Capterra reviews
  ├── Forbes / Inc / PR outlets
  └── Quora answers
                    ↓
Brand appears on 1 platform → weak signal → probably not cited
Brand appears on 5+ platforms → strong consensus → likely cited
```

### Platform-Citation Power

Not all platforms are equal. Based on the AI platform data map:

| Platform | ChatGPT pulls from | Perplexity pulls from | Google AI Mode pulls from | Claude pulls from |
|----------|-------------------|----------------------|--------------------------|-------------------|
| **LinkedIn** | High | Medium | Medium | Medium |
| **Reddit** | Very High | High | Medium | Medium |
| **YouTube** | Medium | Medium | Very High (Google-owned) | Low |
| **Medium** | Medium | High | Medium | Medium |
| **X/Twitter** | Medium | Medium | Low | Very High (Grok pulls heavily) |
| **G2/Capterra** | Medium | Medium | Medium | Medium |
| **Forbes/Inc/PR** | High | High | High | High |
| **Quora** | Medium | Medium | Low | Low |
| **Hacker News** | Medium | High | Low | Low |
| **Product directories** | Medium | High | Medium | Low |

---

## Phase 1: Platform Presence Audit

### Check Current Presence

For each platform, determine if the brand has an active presence:

| Platform | How to Check | Presence Levels |
|----------|-------------|-----------------|
| **LinkedIn** | Search `site:linkedin.com/company/{brand}` + check if company page exists | None / Claimed / Active |
| **Reddit** | Search `site:reddit.com "{brand}"` | None / Mentioned / Participating |
| **YouTube** | Search for brand channel + `site:youtube.com "{brand}"` | None / Channel exists / Active uploads |
| **Medium** | Search for brand publication + `site:medium.com @{brand}` | None / Publication / Active |
| **X/Twitter** | Check for brand account + recent posts | None / Account exists / Active |
| **G2** | Search `site:g2.com "{brand}"` | None / Claimed / Reviews |
| **Capterra** | Search `site:capterra.com "{brand}"` | None / Listed / Reviews |
| **Product Hunt** | Search for brand product page | None / Launched |
| **Hacker News** | Search `site:news.ycombinator.com "{brand}"` | None / Mentioned |
| **Quora** | Search `site:quora.com "{brand}"` | None / Mentioned / Answering |
| **Forbes/Inc/PR** | Search `site:forbes.com OR site:inc.com "{brand}"` | None / Mentioned / Featured |

### Output: Presence Map

```markdown
## Platform Presence Map — {Brand}

| Platform | Status | AI Citation Value | Priority Gap? |
|----------|--------|-------------------|---------------|
| LinkedIn | Active | High | — |
| Reddit | None | Very High | ✓ P0 |
| YouTube | None | Very High | ✓ P0 |
| Medium | None | High | ✓ P1 |
| G2 | None | Medium | P1 |
| X/Twitter | Active | Medium | — |
| Directories | None | High | ✓ P0 |
| PR/Forbes | None | High | P2 |
```

### Cross-Reference with AI Visibility Audit

If an `ai-visibility-audit.md` exists, cross-reference:
1. Which platforms did the AI engines cite for your target queries? → These are your P0 platforms
2. Where do competitors have presence that you lack? → These are P1 platforms
3. Which platforms are you on but not getting cited from? → Content quality/optimization issue, not presence issue

---

## Phase 2: Platform-Native Content Strategy

Each platform requires different content. Never cross-post identical content — AI engines and humans both penalize lazy syndication.

### Platform Content Requirements

**LinkedIn:**
- Format: Long-form articles (800-1500 words) or short posts with stat callouts
- Content: Industry insights, original data, case studies, contrarian takes
- Voice: Professional but opinionated. First-person. Named author.
- Frequency: 2-3 posts per week minimum
- CTA: Drive to blog for full research/report
- Skill: `linkedin-publisher`

**Reddit:**
- Format: Text posts or comments in relevant subreddits
- Content: Genuine participation, helpful answers, sharing original data without self-promotion
- Voice: Casual, transparent, no marketing speak. Redditors destroy self-promotion.
- Rules: 10:1 ratio (10 helpful comments for every 1 self-referential post). Never lead with your product.
- Strategy: Find 3-5 relevant subreddits. Answer questions honestly. Share original research when it genuinely helps. Become a known community member.
- Skill: Manual (no automation for Reddit — authenticity is the whole point)

**YouTube:**
- Format: 5-15 minute explainer videos, or Shorts under 60 seconds
- Content: Tutorials, tool comparisons, behind-the-scenes, data walkthroughs
- Voice: Conversational, direct, shows face or screen
- SEO: YouTube descriptions with full keywords + timestamps. Title optimized for search.
- Why it matters: Gemini pulls heavily from YouTube (Google-owned). A single well-optimized video can get cited by AI for years.
- Skill: `video-content`, `marketing-demo`, `cmo-remotion`

**Medium:**
- Format: Full articles (cross-post from blog, adapted for Medium audience)
- Content: How-to guides, industry analysis, opinion pieces, data reports
- Voice: Slightly more narrative than LinkedIn, still professional
- Rules: Use canonical URL pointing to original blog post. Add unique intro/outro for Medium.
- Skill: `medium-publisher`

**Product Directories (There's An AI For That, Future Tools, TopAI.tools, etc.):**
- Format: Product listing with description, pricing, screenshots, categories
- Content: Clear 1-2 sentence description of what the product does and who it's for
- Rules: Accurate categories, real pricing, honest feature list
- Why it matters: Directory listings are the #1 source of backlinks and AI citations for new brands. Multiple competitors rank from directory listings alone.
- Skill: `startup-launcher`, manual submission

**G2 / Capterra / Review Sites:**
- Format: Product profile + customer reviews
- Content: Claim the profile, add accurate details, solicit reviews from customers
- Why it matters: AI engines treat review sites as trust signals. Being listed = existing. Having reviews = credible.
- Skill: Manual (profile claiming + review solicitation emails via `send-email`)

**Hacker News:**
- Format: Link post or "Show HN" post
- Content: Open-source projects, novel approaches, original data, technical deep-dives
- Voice: Technical, evidence-based, no marketing
- Rules: Only post genuinely interesting technical content. HN destroys marketing spam.
- Skill: Manual

**Quora:**
- Format: Detailed answers to questions in your domain
- Content: Authoritative, long-form answers with specific data and examples
- Voice: Expert, helpful, transparent about your affiliation
- Strategy: Find questions your target audience asks. Write the best answer. Include a brief mention of your product if genuinely relevant.
- Skill: Manual

---

## Phase 3: Execute Platform Build-Out

### Priority Order

Build presence in this order (highest AI citation impact first):

1. **Product directories** — Fastest (hours), immediate backlinks + AI citation surface
2. **LinkedIn articles** — Days, but compounds (LinkedIn articles rank in Google)
3. **Medium cross-posts** — Days, canonical URL preserves SEO
4. **Reddit participation** — Weeks to build credibility, but extremely high ChatGPT citation
5. **YouTube** — Weeks, highest Gemini citation power
6. **G2/Capterra** — Weeks (needs customer reviews), strong trust signal
7. **Hacker News** — One good post can get massive traction, but must be genuinely interesting
8. **PR/earned media** — Months, highest trust signal, use `earned-media` skill if available

### Execution

For each platform gap identified in Phase 1:

1. **Produce platform-native content** using the appropriate skill
2. **Publish or schedule** using the right tool (postiz, typefully, linkedin-publisher, medium-publisher)
3. **Log what was published** to `brand/marketing/seo/platform-presence.md`
4. **Verify publication** — check the content is live and indexed

### Platform Presence Tracker

Write to `brand/marketing/seo/platform-presence.md`:

```yaml
---
brand: "{brand}"
last_updated: "{YYYY-MM-DD}"
platforms:
  linkedin:
    status: active
    url: "https://linkedin.com/company/{brand}"
    last_post: "{date}"
    post_frequency: "2-3/week"
  reddit:
    status: building
    subreddits: ["r/AIagents", "r/smallbusiness"]
    karma: 0
    last_post: null
  youtube:
    status: none
    channel_url: null
  medium:
    status: none
    publication_url: null
  directories:
    status: in_progress
    submitted: ["theresanaiforthat.com", "futuretools.io"]
    listed: []
  g2:
    status: claimed
    url: "https://g2.com/products/{brand}"
    reviews: 0
---
```

---

## Phase 4: Verify Consensus Building

After content is published across platforms, verify the consensus is forming:

1. **Wait 2-4 weeks** for indexing and AI engine crawling
2. **Re-run `ai-visibility-audit`** with the same buyer prompts
3. **Check if AI engines now cite the new platform content**
4. **Compare visibility scores** before and after

### Consensus Score

```
Consensus Score = Platforms with active presence / Total high-value platforms × 100
```

| Score | What it means |
|-------|--------------|
| 0-20% | Invisible to AI — no consensus possible |
| 20-40% | Emerging — AI may mention but unlikely to cite |
| 40-60% | Moderate — AI sees some consensus, citation possible |
| 60-80% | Strong — AI likely to cite for relevant queries |
| 80-100% | Authoritative — AI cites consistently, competitor resistant |

---

## Worked Example

**User request:** "Build AI search consensus for aiwithjai"

**Phase 1:** Audit shows aiwithjai is on LinkedIn and X only. Missing: Reddit, YouTube, Medium, G2, directories, PR. The visibility audit shows competitors Lindy.ai and Harvey.ai appear on 5+ platforms each.

**Phase 2:** Priority build-out:
- P0: Submit to 10 AI tool directories (hours, immediate backlinks)
- P0: Start Reddit participation in r/AIagents, r/smallbusiness, r/ArtificialIntelligence
- P1: Cross-post blog articles to Medium with canonical URLs
- P1: Claim G2 profile, email 5 customers for reviews
- P2: Create 2 YouTube explainer videos ("What is an AI Employee?" and "AI Agent Setup Walkthrough")

**Phase 3:** Execute. Use `startup-launcher` for directories. Write 3 Reddit comments per day for 2 weeks before any self-referential post. Cross-post top 5 blog articles to Medium.

**Phase 4:** After 4 weeks, re-run visibility audit. Check if AI engines now cite the directory listings, Reddit mentions, or Medium articles.

---

## Chain Offers

After completing, present:

- `/ai-visibility-audit` — Re-run to check if consensus building improved citations
- `/content-atomizer` — Atomize existing content for the new platforms
- `/original-research` — Produce proprietary data that all platforms can reference
- `/social-campaign` — Schedule ongoing presence across platforms
- "Schedule monthly consensus check" — Track platform presence over time

---

## Anti-Patterns

| Anti-pattern | Instead | Why |
|-------------|---------|-----|
| Cross-posting identical content everywhere | Adapt content natively per platform | AI engines penalize duplicate content. Each platform has different audience expectations. |
| Blasting self-promotional content on Reddit | Participate genuinely for weeks before any self-reference | Reddit destroys marketers. One self-promo post before building credibility = permanent community damage. |
| Creating profiles and never posting again | Commit to a minimum cadence per platform | An abandoned profile is worse than no profile — it signals inactivity. Only claim platforms you'll maintain. |
| Trying to be on every platform at once | Start with 3-4 highest-impact platforms | Spreading thin across 10 platforms means 10 weak presences. 3 strong ones beat 10 weak ones for AI consensus. |
| Automating Reddit/HN posts | Manual participation for authenticity-dependent platforms | Reddit and Hacker News require genuine human-like engagement. Automation gets detected and punished. |
| Ignoring the "canonical URL" on Medium cross-posts | Always set canonical URL to original blog post | Without it, Medium outranks your own site for your own content. You lose SEO to Medium. |
| Building platform presence without original content | Create original research/data first, then distribute | Platforms amplify existing content. Empty profiles + great content > active profiles + generic content. |

## YAGNI Principles

- Don't build custom scrapers to check platform presence — use web search and manual verification
- Don't automate Reddit or Hacker News — these require genuine human participation
- Don't create profiles on platforms your audience doesn't use
- Don't track every possible platform — focus on the 8-10 that AI engines actually cite
- Don't build a dashboard — the platform-presence.md tracker and weekly cron are sufficient
