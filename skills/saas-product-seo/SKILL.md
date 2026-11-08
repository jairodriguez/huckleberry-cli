---
name: saas-product-seo
description: SEO system for SaaS products targeting features, comparisons, and B2B buyers.
---

# Skill: SaaS Product SEO

## Overview

SaaS-focused SEO system for ai.withjai and similar product businesses. Unlike local SEO (GBP, citations, service areas), SaaS SEO targets: product features, comparison content, developer adoption, and B2B buyer journey.

## When to Use

- SaaS/automation products with feature pages and pricing
- Developer tools and APIs
- Product-led content marketing (tutorials, case studies, documentation)
- Competitor comparison pages (Product A vs Product B)
- Building authority in SaaS ecosystem (directories, reviews, integrations)

## Core Value Proposition

**Problem:** Most SaaS companies do generic SEO or borrow local SEO tactics (GMB, citations, service areas) that don't apply to software products.

**Solution:** Systematic SaaS SEO that targets:
1. **Product Keywords:** Feature names, use cases, integrations
2. **Comparison SEO:** "X vs Y" pages, feature comparison tables
3. **Technical Content:** Developer docs, API guides, integration tutorials
4. **Authority Signals:** SaaS directories, product reviews, tool mentions
5. **Buyer Journey:** Problem-aware → comparison → decision → integration

---

## Quick Start

```bash
# Load business context (adapted for SaaS model)
node scripts/seo/load-business-context.js --brand ai.withjai --interactive

# Run SaaS-specific SEO prompts
node scripts/seo/saas-prompts/run-prompt.js --prompt 1 --brand ai.withjai
```

---

## Prompt System (10 Prompts)

### Phase 1: Foundation (Weeks 1-2)
**Prompt 0: SaaS Business Context Loader**
- Load product details, features, pricing, target customers
- Identify key product differentiators
- Map buyer journey stages (problem-aware → evaluation → adoption)

**Prompt 1: Product Keyword Research**
- Extract product keywords from: feature names, use cases, integrations, problems solved
- Identify competitor ranking for these product keywords
- Prioritize by: (1) Your unique features, (2) High-intent comparison searches

**Prompt 2: Competitor Product Analysis**
- Analyze competitor pricing pages, feature lists, case studies
- Extract: Value propositions, messaging angles, feature positioning
- Identify gaps: Features competitors don't highlight that you should

### Phase 2: Content Foundation (Weeks 3-5)
**Prompt 3: Comparison Page Strategy**
- Build "ai.withjai vs Make.com" framework
- Create comparison tables for all major competitors
- Generate content briefs for: Feature vs feature, pricing vs pricing, use case vs use case

**Prompt 4: Feature Page Optimization**
- Optimize product feature pages (e.g., "Newsletter Automation" page)
- Structure: Problem → Feature → Benefit → Use Case → CTA
- Include: Feature screenshots, integrations, pricing anchors

**Prompt 5: Technical Content Strategy**
- Identify developer-facing content opportunities:
  - API documentation and guides
  - Integration tutorials
  - Developer use cases
  - Code examples
- Build content calendar targeting technical keywords

### Phase 3: Authority Building (Weeks 6-7)
**Prompt 6: SaaS Directory Audit**
- Research SaaS/product directories:
  - G2, Product Hunt, Capterra
  - Capterra, Trustpilot, SoftwareAdvice
  - Niche directories (newsletter automation, etc.)
- Check: Listings exist, NAP consistency, reviews, feature descriptions
- Build submission prioritized list

**Prompt 7: Backlink Gap Analysis**
- Use Ahrefs to find:
  - Backlinks to Make.com, Zapier, Automation Anywhere
  - SaaS blog mentions (features, integrations)
  - Tool directory listings
- Identify: High-value targets, low-hanging fruit
- Build 90-day outreach plan

**Prompt 8: Product Review Strategy**
- Research how competitors collect and showcase reviews:
  - G2 reviews, Trustpilot, Capterra screenshots
  - Social proof on pricing pages
  - Case study testimonials
- Build review collection system + showcase strategy

### Phase 4: Competitive Intelligence (Weeks 8-10)
**Prompt 9: Competitor Content Audit**
- Analyze competitor blog content strategy:
  - Topics covered (features, use cases, comparisons)
  - Content formats (tutorials, case studies, product updates)
  - Publishing frequency and cadence
  - Social distribution of blog content
- Identify gaps: Topics they don't cover (your opportunity)

**Prompt 10: Product Positioning Map**
- Map competitor positioning across dimensions:
  - Price point (budget, mid-market, premium)
  - Feature focus (comprehensive vs specialized vs minimal)
  - Target audience (enterprise vs SMB vs indie)
  - Brand voice (technical vs playful vs enterprise)
- Identify: Unoccupied positioning territory (your competitive advantage)

---

## Business Context Structure

**File:** `businesses/{business}/seo/business-context.json`

```json
{
  "business_basics": {
    "name": "[product name]",
    "address": "Remote/Digital-first",
    "phone": "[contact if applicable]",
    "website": "[website URL]",
    "years_in_business": "[X years]",
    "team_size": "[solo / small team / large team]"
  },
  "product_market": {
    "primary_category": "SaaS - Newsletter Automation",
    "product_type": "B2B SaaS with freemium",
    "target_customer": "Digital entrepreneurs, indie builders, AI-forward creators",
    "average_revenue_per_customer": "$X/month",
    "pricing_model": "Monthly subscription: [starter, growth, enterprise]"
  },
  "product_differentiators": [
    "[unique feature 1]",
    "[unique feature 2]",
    "[unique feature 3]"
  ],
  "seo_goals": {
    "top_keywords": [
      "[primary product keyword]",
      "[secondary product keyword]",
      "[competitor comparison keyword]"
    ],
    "currently_rank_for": [
      "[keyword 1]",
      "[keyword 2]"
    ],
    "should_rank_but_dont": [
      "[opportunity keyword 1]",
      "[opportunity keyword 2]"
    ]
  },
  "competitors": [
    {
      "name": "Competitor Name",
      "website": "https://competitor.com",
      "product_type": "[SaaS / automation tool]",
      "pricing": "[budget / mid-market / premium]",
      "why_they_beat_you": "[strength analysis]"
    }
  ],
  "current_standings": {
    "organic_traffic": "[monthly organic traffic]",
    "top_ranking_pages": "[top pages by traffic]",
    "conversion_rate": "[free trial to paid conversion %]",
    "biggest_seo_problem": "[honest assessment]"
  }
}
```

---

## Success Metrics

**90-Day Targets (Per Brand):**
- Product keyword rankings: +5 top 10 positions
- Comparison traffic: 40-60% increase
- Backlink profile: +5-10 quality SaaS links
- SaaS directory listings: 10+ new listings
- Product reviews showcased: 20+ reviews on site

### Proof Points
- Comparison pages → higher CTR for research-stage keywords
- Technical content → developer trust and backlinks
- SaaS directories → authority signals in product niche
- Product positioning → stand out from crowded market

---

## Key Advantages Over Local SEO System

| Aspect | Local SEO (Sarvesh) | SaaS Product SEO |
|--------|---------------------|------------------|
| **Keywords** | Service + city | Product features + comparisons |
| **Pages** | Service + city location | Feature pages, comparison pages |
| **Authority** | GBP reviews, local citations | SaaS directories, product reviews |
| **Content** | Neighborhood-specific | Technical, tutorials, case studies |
| **Target** | Local homeowners | Digital entrepreneurs, developers |
| **Competition** | Local service businesses | Other SaaS products |
| **Timeline** | 7-14 days (local intent) | 90+ days (SaaS consideration) |

---

## Implementation

### Scripts

**Directory:** `scripts/seo/saas-prompts/`

**Prompt Runner:** `run-prompt.js` (reuses existing structure)
- Loads SaaS business context
- Executes prompt from prompt library
- Tracks execution log

**Business Context:** Adapted for SaaS model
- Removed GBP-specific fields
- Added product differentiators
- Replaced services with product categories
- Updated goals for product keywords

---

## Integration with Existing Workflows

**Connects to:**
- `content-pipeline-complete` - Use comparison page briefs for blog posts
- `platform-content-generator` - Distribute SaaS-focused content
- `publishing-blog-articles` - Create optimized feature pages
- `analytics-tracking` - Track product keyword rankings

**Complementary Skills:**
- `developing-seo-strategy` - Product-focused keyword research
- `schema-markup` - SoftwareApplication schema for product pages
- `seo-audit` - Technical SEO validation

---

## Common Mistakes to Avoid

- ❌ Using local SEO tactics for SaaS products (GMB, citations, service areas)
- ❌ Ignoring competitor comparison opportunities (huge traffic source)
- ❌ Not creating feature-specific pages (e.g., "Newsletter Automation" vs generic "Features" page)
- ❌ Missing technical content (developers need docs, not just benefits)
- ❌ Forgetting SaaS directories (G2, Product Hunt, Capterra matter)
- ❌ Not showcasing product reviews and social proof

---

## Example: ai.withjai Comparison Strategy

**Competitor:** Make.com

**Comparison Page Structure:**
1. Hero section: "ai.withjai vs Make.com: Which Newsletter Automation Platform is Right for You?"
2. Feature comparison table: Core features with checkmarks
3. Pricing comparison: Starter plans side-by-side
4. Use case section: Real newsletter examples from each platform
5. Differentiators: "Why ai.withjai for [specific user type]"
6. CTA: "Start free trial and compare side-by-side"

**Keywords Targeted:**
- "newsletter automation tool"
- "make.com alternatives"
- "best ai newsletter tool"
- "newsletter platform comparison"
- "ai.withjai vs make.com"

---

## Resources

### SaaS Directories
- G2: https://www.g2.com/
- Product Hunt: https://www.producthunt.com/
- Capterra: https://www.capterra.com/
- Trustpilot: https://www.trustpilot.com/
- SoftwareAdvice: https://www.softwareadvice.com/
- Capterra: https://www.capterra.com/

### Competitor Research Tools
- SimilarWeb: https://www.similarweb.com/
- BuiltWith: https://www.builtwith.com/
- G2 StackShare: https://stackshare.io/

### Schema Markup
- SoftwareApplication: https://schema.org/SoftwareApplication
- TechArticle: https://schema.org/TechArticle
- HowTo: https://schema.org/HowTo

---

## Support

### Getting Started
1. Run SaaS business context loader with interactive mode
2. Execute prompts 1-2 first (foundation)
3. Review outputs and adjust context if needed
4. Continue through phases systematically
5. Use monthly performance tracking to measure results

### Questions
- For implementation help: Check scripts/seo/saas-prompts/
- For prompt customization: Review business context structure
- For integration guidance: See "Integration with Existing Workflows" section

---

**System Status:** ✅ Designed | 📊 SaaS-Focused | 🎯 10 Proven Prompts | 💰 Competitor-First

**Last Updated:** 2026-03-25
**Philosophy:** Don't force local SEO system onto SaaS business model. Build system that matches your customers, competitors, and content reality.
