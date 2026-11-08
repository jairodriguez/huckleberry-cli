---
name: review-sites
description: "Claim and optimize brand profiles on review sites (G2, Capterra, Product Hunt, Sourceforge, etc.) that AI search engines use as trust signals."
allowed-tools: []
---

# /review-sites — Review Site Optimization for AI Search

AI search engines check review sites to determine if a product is real, credible, and widely used. G2, Capterra, Product Hunt, and similar platforms are among the highest-trust sources for AI engines building consensus about your brand. Being unlisted on these sites means AI engines can't verify you exist.

This skill handles claiming profiles, optimizing them for AI citation, and building review velocity.

For brand memory protocol, see /cmo [rules/brand-memory.md](../cmo/rules/brand-manager.md).

## On Activation

1. Read `brand/` directory: load `positioning.md`, `competitors.md`, `audience.md` if present.
2. If `brand/marketing/seo/platform-presence.md` exists, load it — check current review site status.
3. Show what loaded:
   ```
   Brand context loaded:
   ├── Positioning         ✓/✗
   ├── Competitors         ✓/✗
   ├── Audience            ✓/✗
   ├── Platform Presence   ✓/✗
   ```
4. Determine mode:
   - **Full Setup** — Claim + optimize + review solicitation (default)
   - **Claim Only** — Just claim profiles, no optimization or outreach
   - **Review Sprint** — Profile exists, just need more reviews

---

## Phase 1: Claim Profiles

### Priority Review Sites

| Site | AI Citation Value | Claim Effort | Who Uses It |
|------|------------------|-------------|-------------|
| **G2** | Very High | 30 min | B2B buyers, all AI engines |
| **Capterra** | High | 20 min | SMB software buyers |
| **Product Hunt** | High | 30 min | Early adopters, tech audience |
| **Sourceforge** | Medium | 15 min | Developer/technical audience |
| **Trustpilot** | Medium | 15 min | Consumer-facing products |
| **Software Advice** | Medium | 20 min | Enterprise software buyers |
| **GetApp** | Medium | 15 min | Business app buyers |
| **AlternativeTo** | Medium | 10 min | People searching for alternatives |
| **SaaSworthy** | Low-Medium | 10 min | SaaS comparison shoppers |
| **There's An AI For That** | High (for AI products) | 10 min | AI tool discovery |

### Claiming Process (Per Site)

For each site:

1. **Search** for existing listing: `site:g2.com "{brand name}"` or search directly on the platform
2. **If listing exists** — Claim it (verify ownership via email domain, LinkedIn, or phone)
3. **If no listing** — Create one from scratch
4. **Required info to prepare before starting:**
   - Product name (exact spelling)
   - One-sentence description (what it does, for who)
   - 3-5 key features with brief descriptions
   - Pricing model (free tier? starting price?)
   - Product category/tags
   - Logo (high-res PNG/SVG)
   - 2-3 screenshots or product images
   - Website URL
   - Support/contact email
   - Social media links
   - Founded year
   - Company size range
   - Headquarters location

### Profile Claiming Tracker

Write to `brand/marketing/review-sites/profiles.md`:

```yaml
---
brand: "{brand}"
last_updated: "{YYYY-MM-DD}"
profiles:
  g2:
    status: claimed
    url: "https://g2.com/products/{brand}"
    claimed_date: "{date}"
    reviews: 0
    rating: null
  capterra:
    status: claimed
    url: "https://capterra.com/p/{brand}"
    claimed_date: "{date}"
    reviews: 0
    rating: null
  product_hunt:
    status: not_listed
    url: null
    planned_launch: "{date or null}"
```

---

## Phase 2: Optimize Profiles

### Profile Optimization Checklist

For each claimed profile, optimize these fields for AI citation:

**Product Description:**
- Lead with what the product IS and WHO it's for (one sentence)
- Include the primary category keyword naturally
- Mention the target audience explicitly
- Example: "AIwithJai is an AI agent consulting service that helps small businesses automate workflows with custom AI employees, starting at $999."

**Feature Descriptions:**
- Each feature should answer: "What does this do?" and "Why does it matter?"
- Use the language buyers search for (from `subreddit-pain-extraction` or keyword research)
- Include specific numbers where possible

**Category Selection:**
- Pick the most specific category available (not the broadest)
- If multiple categories are allowed, select all relevant ones
- Categories determine which comparison pages you appear on

**Pricing Information:**
- Always include pricing. AI engines flag "contact for pricing" as a negative signal.
- Be specific: "$999 one-time setup" beats "affordable pricing"
- If you have a free tier, highlight it prominently

**Screenshots:**
- First screenshot should show the main value proposition visually
- Include alt text / captions with keywords
- 3-5 screenshots minimum

**Tags/Keywords:**
- Add all relevant tags the platform supports
- Include competitor-adjacent tags (people searching for competitors find you)
- Use the exact phrases buyers use (from pain point research)

### Competitor Benchmarking

For each review site, check what top competitors have:

| Competitor | G2 Rating | # Reviews | Profile Strength | What they do well |
|-----------|-----------|-----------|-----------------|-------------------|
| {Comp 1} | 4.8 | 47 | Strong | Detailed feature breakdowns, video testimonials |
| {Comp 2} | 4.5 | 23 | Moderate | Strong pricing transparency, case studies |

Use this to set targets: "We need 20+ reviews to match competitor baseline."

---

## Phase 3: Review Solicitation

### Review Sources (Priority Order)

1. **Existing customers** — Highest quality, most credible. Email them directly.
2. **Beta users / early adopters** — They have opinions. Channel them into reviews.
3. **Free tier users** — Volume, even if shorter reviews. Helps with review count.
4. **Partners / integrations** — Their perspective adds credibility.

### Review Solicitation Email

Use `send-email` skill to send individualized emails:

```
Subject: Quick favor — would you review us on G2?

Hi {Name},

You've been using {product} for {timeframe}, and I'd love to hear about
your experience.

If you have 5 minutes, would you leave an honest review on G2?
It helps other {audience} find us — and we read every single one.

{Direct link to G2 review page}

No pressure at all. If you've got feedback that doesn't fit in a review,
just reply to this email — I read everything.

Thanks,
{Name}
{Title}, {Brand}
```

### Review Solicitation Rules

1. **Ask for honest reviews, not positive reviews.** G2 and Capterra penalize incentivized reviews. A 4-star honest review is worth 10x a fake 5-star review.
2. **Space out requests.** 2-3 review requests per week maximum. A burst of 20 reviews in 2 days triggers spam filters.
3. **Make it easy.** Send a direct link to the review page. No login walls if possible.
4. **Never offer incentives for positive reviews.** You can offer a small thank-you (coffee gift card) for any review regardless of rating, but tie it to the act of reviewing, not the star count.
5. **Respond to every review.** Thank people for positive ones. Address concerns in negative ones professionally.
6. **Target 10 reviews minimum** per platform. Below 10, the rating isn't statistically meaningful. Above 20, it starts influencing AI citation.

### Review Response Templates

**Positive review:**
```
Thanks for the kind words, {Name}! Glad {specific feature they mentioned}
is working well for you. We're always improving — feel free to reach out
if you need anything.
```

**Negative/constructive review:**
```
{Name}, thanks for the honest feedback. {Acknowledge their specific concern}.
We're actively working on {related improvement}. Would you be open to a
quick call so we can learn more? {contact email}
```

---

## Phase 4: Ongoing Management

### Monthly Review Health Check

Add to the weekly cron or run manually monthly:

1. **Review count** — Track growth. Target: 5+ new reviews per month.
2. **Average rating** — Track trend. Below 4.0 needs attention.
3. **Response rate** — Every review gets a response within 48 hours.
4. **Competitor watch** — Are competitors gaining reviews faster?
5. **New platform opportunities** — Any new review sites gaining traction?

### Review Site SEO for AI Citation

Review site profiles rank in search engines independently. Optimize for this:

1. **Keep product descriptions updated** — Reflect current features and pricing
2. **Add new screenshots quarterly** — Fresh media signals activity
3. **Respond to reviews promptly** — Shows the brand is active and engaged
4. **Link back to your site** — Most profiles allow a website link
5. **Cross-link from your blog** — "Read our reviews on G2" posts drive traffic and authority

---

## Worked Example

**User request:** "Set up review site profiles for aiwithjai"

**Phase 1:** Search G2, Capterra, Product Hunt. None have aiwithjai listed. Create profiles on all three plus AlternativeTo and There's An AI For That.

**Phase 2:** Optimize each profile with: "AIwithJai builds custom AI employees for small businesses — automating content, outreach, and operations starting at $999." Add 4 screenshots, 6 feature descriptions, pricing ($999 setup + monthly), category: "AI Agent Platforms".

**Phase 3:** Email 12 existing customers asking for G2 reviews. Space 3 per week over 4 weeks. After 6 weeks: 8 reviews, 4.6 average rating.

**Phase 4:** Monthly check — 8 reviews on G2, 3 on Capterra. AI visibility audit shows G2 profile starting to appear in AI search results for "AI agent consulting service."

---

## Chain Offers

After completing, present:

- `/ai-consensus-builder` — Feed review site presence into the overall consensus strategy
- `/ai-visibility-audit` — Check if review profiles are getting cited by AI engines
- `/send-email` — Send review solicitation emails to customers
- "Schedule monthly review check" — Track review growth and respond to new reviews

---

## Anti-Patterns

| Anti-pattern | Instead | Why |
|-------------|---------|-----|
| Buying fake reviews | Solicit honest reviews from real customers | G2 and Capterra have sophisticated fake review detection. Getting caught removes all reviews and bans the profile. |
| Only creating G2 | Claim 5+ review sites | Different AI engines pull from different review sites. G2 is biggest but not universal. |
| Creating profiles and forgetting | Monthly review health check | A profile with 0 reviews is worse than no profile — it signals "nobody uses this." |
| Responding defensively to negative reviews | Acknowledge, address, take offline | Defensive responses are public and permanent. Professional responses build trust. |
| Asking all customers on the same day | Space requests over weeks | A review burst triggers spam filters. Steady trickle looks organic. |
| Copy-pasting the same review solicitation email | Personalize with usage details | "You've been using us for 3 months" proves it's not a mass email. |

## YAGNI Principles

- Don't build review widgets for your website — link to the profile directly
- Don't try to be on every review site — focus on the top 5-6 that AI engines cite
- Don't automate review responses — each response needs to address the specific feedback
- Don't track individual reviewer identities — focus on aggregate rating and count
- Don't create a review generation funnel — email outreach is sufficient for most brands
