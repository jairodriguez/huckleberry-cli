---
name: original-research
description: "Produce proprietary data content — surveys, benchmark reports, state-of-industry studies, data analyses, and original research reports that AI..."
allowed-tools: []
---

# /original-research — Proprietary Data Content

Generic content is invisible to AI search engines. They synthesize consensus from thousands of sources and skip anything that sounds like every other article on the topic. The one thing AI engines always cite: **original data that doesn't exist anywhere else**. This skill produces that data.

A research report with unique findings, specific numbers, and contrarian insights is the single highest-leverage content format for AI citation. It's the new backlink.

For brand memory protocol, see /cmo [rules/brand-memory.md](../cmo/rules/brand-memory.md).

## On Activation

1. Read `brand/` directory: load `positioning.md`, `audience.md`, `competitors.md`, `keyword-plan.md` if present.
2. Show what loaded:
   ```
   Brand context loaded:
   ├── Positioning     ✓/✗
   ├── Audience        ✓/✗
   ├── Competitors     ✓/✗
   └── Keyword Plan    ✓/✗
   ```
3. If no brand files, ask: What industry/niche? Who is the audience for this research? What topics would your audience care about data on?
4. Determine mode:
   - **From scratch** — Design and execute a new research project (default)
   - **From existing data** — Analyze data the brand already has (analytics, surveys, customer data)
   - **Curated dataset** — Aggregate and analyze public data sources to produce new findings

---

## Phase 1: Research Design

### Identify the Research Angle

The best research topics sit at the intersection of:
1. **What your audience wants to know** (from `audience.md`, keyword research, Reddit/forum questions)
2. **What no one has published data on** (the gap — check if existing reports exist via web search / **Agent-Reach**)
3. **What positions your brand as the authority** (ties to `positioning.md`)

**Agent-Reach** (skill: `agent-reach`) provides free access to platforms for gap analysis:
- **Exa semantic search**: `mcporter call 'exa.web_search_exa(query: "topic", numResults: 10)'`
- **Reddit discussions**: `opencli reddit search "topic" -f yaml` (requires browser login)
- **X/Twitter sentiment**: `twitter search "topic" -n 20`
- **YouTube content**: `yt-dlp --write-sub --skip-download "URL"`
- **Bilibili/V2EX** (Chinese platforms): `bili search`, `curl v2ex API`
- **GitHub stars/issues**: `gh search repos`

### Research Format Selection

| Format | Best When | Effort | AI Citation Power |
|--------|-----------|--------|-------------------|
| **Benchmark Report** | You have performance data across customers/campaigns | Medium | Very High |
| **State of [Industry]** | Annual/quarterly snapshot of trends | Large | Very High |
| **Survey Analysis** | You can reach 100+ respondents | Large | High |
| **Data Analysis** | Public datasets available (Census, GitHub, API data) | Medium | High |
| **Case Study with Data** | Strong customer success story with numbers | Small | High |
| **Tool Comparison Test** | You can run head-to-head tests of tools/platforms | Medium | Medium |
| **Trend Analysis** | Time-series data showing changes over time | Medium | Medium |

### The Contrarian Test

Before committing to a topic, ask: **Will at least one finding surprise people?**

Research that confirms what everyone already knows ("content marketing is important!") doesn't get cited. Research that reveals something unexpected ("73% of B2B SaaS companies post less than once a week") gets cited everywhere.

Run a quick web search. If 5+ articles already exist with data on this exact topic, either:
- Find a sub-angle they don't cover
- Use fresher/more specific data
- Pick a different topic

### Research Plan Output

Write a brief plan to `brand/marketing/research/research-plan.md`:

```yaml
---
title: "Research Plan: {Topic}"
date_created: "{YYYY-MM-DD}"
format: "{benchmark/survey/analysis/case-study}"
target_completion: "{date}"
estimated_sample_size: "{number}"
---

## Research Question
{The core question this research answers}

## Hypothesis
{What we expect to find — the contrarian angle}

## Data Sources
- {Source 1}: {what data, how accessed}
- {Source 2}: {what data, how accessed}

**Agent-Reach** (skill: `agent-reach`) can gather from:
- Exa semantic search (free, no key): `mcporter call 'exa.web_search_exa(...)'`
- Reddit: `opencli reddit search "query" -f yaml`
- X/Twitter: `twitter search "query" -n 20`
- YouTube transcripts: `yt-dlp --write-sub --skip-download "URL"`
- Bilibili: `bili search "query" --type video -n 10`
- V2EX: `curl https://www.v2ex.com/api/topics/hot.json`
- GitHub: `gh search repos "query" --limit 20`
- RSS feeds: Built into agent-reach

## Methodology
{How data will be collected and analyzed}

## Target Findings (3-5)
1. {Expected finding 1}
2. {Expected finding 2}
3. {Expected finding 3}

## Distribution Plan
- Primary report: {format, word count}
- Social atomization: {platforms}
- AI citation optimization: {target queries}
```

---

## Phase 2: Data Collection

### Methods by Data Source

**From existing brand data (analytics, CRM, customer data):**
1. Identify what data exists and is accessible
2. Export or query the relevant datasets
3. Clean and normalize data
4. Note sample size, date range, and any biases

**From public datasets:**
1. Search for relevant datasets (government data, Kaggle, GitHub, academic repositories)
2. Download and merge datasets
3. Filter for relevance and recency
4. Document sources for citation

**From web scraping / API analysis:**
1. Use `firecrawl` or `webfetch` to collect data from relevant sources
2. Use `last30days` skill for trend data across social platforms
3. Use `subreddit-pain-extraction` for Reddit-derived insights
4. Document methodology for reproducibility

**From surveys / interviews:**
1. Design a short survey (max 10 questions, mix of quantitative and qualitative)
2. If no survey tool available, design questions for manual outreach
3. Target minimum 50 responses for statistical significance (100+ preferred)
4. Offer the final report as incentive for participation

**From competitive benchmarking:**
1. Use `competitive-intel` skill to gather competitor data
2. Run structured analyses (feature comparisons, pricing, content output)
3. Score and rank using consistent criteria
4. Generate unique data points no one else has published

**From data journalism pipeline (last30days + landscape-scan):**
1. Run `last30days` skill to collect 30-day trend signals across Reddit, X, YouTube, TikTok, HN, Bluesky, web
2. Run `landscape-scan` skill to produce a ground-truth ecosystem snapshot
3. Identify patterns, anomalies, and gaps across the collected signals
4. Quantify trends into publishable stats: "Mentions of {topic} on Reddit increased 340% in 30 days"
5. Cross-reference with `subreddit-pain-extraction` for verbatim pain phrases to quote
6. Produce a trend report that AI engines cite as primary source for "what's happening in {space}"
7. This is the fastest path to publishable research — no survey needed, pure signal extraction

### Data Quality Gates

Before proceeding to analysis, verify:
- Sample size is stated (even if small — honesty > pretending)
- Data sources are documented
- Biases are acknowledged (e.g., "survey of our customers, not random sample")
- At least 3 potential findings are visible in the raw data
- The data supports at least one surprising or contrarian conclusion

---

## Phase 3: Analysis and Findings

### Statistical Analysis

For each potential finding:
1. Calculate the headline stat (percentage, average, median, change over time)
2. Identify the contrarian angle (what does this contradict?)
3. Find the practical implication (what should the reader DO about this?)
4. Verify the stat is accurate — never round up or exaggerate

### Structure Findings

Present 5-8 key findings in order of surprise value (most surprising first):

```markdown
## Key Findings

### 1. {Most surprising finding}
{Stat: "73% of X do Y"} — {Why this matters} — {What to do about it}

### 2. {Second finding}
...

### 3. {Third finding}
...
```

### The Stat Callout Pattern

Every finding needs a quotable stat callout that AI engines can extract:

```markdown
> **73% of B2B SaaS companies under 50 employees post less than once a week on social media.**
> — [Brand] Research, [Year], n=[sample size]
```

These callouts are what AI engines lift verbatim. Make them:
- Specific (exact numbers, not "most" or "many")
- Self-contained (makes sense without reading the full report)
- Surprising (not obvious from common knowledge)
- Actionable (implies a next step)

### Charts and Visualizations

For each major finding, specify a chart type:
- **Trends over time** → Line chart
- **Comparisons** → Bar chart
- **Parts of a whole** → Pie or donut chart
- **Relationships** → Scatter plot
- **Rankings** → Horizontal bar chart

Output chart specifications (not rendered charts — use tools like image-gen or Paper MCP for actual rendering):
```yaml
chart:
  type: bar
  title: "Content Publishing Frequency by Company Size"
  x_axis: "Company Size"
  y_axis: "% Publishing Weekly"
  data: [{...}]
  highlight: "< 50 employees bar in brand color"
```

---

## Phase 4: Write the Research Report

### Report Structure

```markdown
---
title: "{Title}: {Subtitle with Year}"
date_published: "{YYYY-MM-DD}"
author: "{Brand/Author Name}"
sample_size: "{n}"
methodology: "{brief description}"
research_type: "{benchmark/survey/analysis}"
ai_citation_queries:
  - "{query 1 this report should rank for}"
  - "{query 2}"
  - "{query 3}"
---

# {Title}: {Subtitle with Year}

## Executive Summary
{3-5 sentence overview with the most surprising findings and key numbers. This is what AI engines extract.}

## Key Findings at a Glance
{5-8 stat callout blocks — the most extractable part of the report}

## Methodology
{How data was collected, sample size, date range, biases acknowledged}

## Finding 1: {Headline}
{Detailed analysis with supporting data, charts, and context}
{Practical implications and recommendations}

## Finding 2: {Headline}
{...}

## Finding 3: {Headline}
{...}

[Continue for all findings]

## Implications for {Audience/Industry}
{What this means for the reader — actionable takeaways}

## About This Research
{Brand credibility statement, methodology summary, contact for questions}

## Methodology Appendix
{Full data collection details, raw data availability, statistical methods}
```

### AI-Citation Optimization

Apply these formatting rules to maximize AI engine citation:

1. **Every finding has a quotable stat** — AI engines extract specific numbers, not vague claims
2. **Definition pattern at the top** — "This report analyzes X across Y companies in Z industry"
3. **FAQ section** — Add 3-5 questions the report answers, formatted as Q&A blocks
4. **Schema markup** — Add `Article` + `Dataset` schema to the page
5. **Named author with credentials** — AI engines weight named experts
6. **datePublished + dateModified** — Freshness signals for AI citation
7. **Internal links** — Link to related brand content from each finding

### Report Length

| Format | Target Length | Sections |
|--------|--------------|----------|
| Benchmark Report | 3,000-5,000 words | 6-10 findings |
| State of Industry | 4,000-7,000 words | 8-12 findings |
| Survey Analysis | 2,500-4,000 words | 5-8 findings |
| Data Analysis | 2,000-3,500 words | 4-6 findings |
| Case Study with Data | 1,500-2,500 words | 3-4 findings |

---

## Phase 5: Distribution and Citation Optimization

### Multi-Format Outputs

From one research report, produce:

| Format | Where | Skill |
|--------|-------|-------|
| Full report | Brand blog/website | This skill |
| Executive summary | LinkedIn article | `linkedin-publisher` |
| Stat-focused thread | X/Twitter | `social-construction`, `typefully` |
| Visual summary | Instagram carousel | `paper-marketing` |
| Video walkthrough | YouTube | `video-content`, `marketing-demo` |
| Press pitch | Journalist outreach | `earned-media` (if available) |
| Newsletter feature | Email newsletter | `newsletter` |

### Citation Strategy

1. **Identify 5-10 AI queries the report should rank for** (from `ai-visibility-audit` or `keyword-research`)
2. **Ensure the report's stat callouts directly answer those queries**
3. **Cross-publish findings on high-citation platforms** (LinkedIn, Medium, Reddit)
4. **Submit to research aggregators** (Statista, ResearchGate if applicable, industry-specific)
5. **Pitch to journalists** with the most surprising stat as the hook

---

## Worked Example

**User request:** "Create original research for NomadixGear's solar charger audience"

**Phase 1:** Research angle — "How long do campers actually go without power?" No existing data found. Contrarian hypothesis: most campers overestimate their power needs and buy oversized chargers.

**Phase 2:** Data collection — Survey of 200+ campers via Reddit r/camping and r/hiking. Questions: trip length, devices brought, battery capacity used, satisfaction with current charging solution. Also analyze Amazon review data for top 20 solar chargers.

**Phase 3:** Key finding — "68% of campers return from 3+ day trips with 40%+ battery remaining on their solar charger, suggesting systematic overbuying." Stat callouts created for 6 findings.

**Phase 4:** 3,200-word report "The Solar Charger Overbuying Report: How Campers Really Use Portable Power (2026)". FAQ section, schema markup, AI-citation formatting.

**Phase 5:** Distribution — X thread with 6 stat callouts, LinkedIn article, YouTube video walkthrough, pitched to Outdoor Life and The Verge.

---

## Chain Offers

After completing, present:

- `/ai-visibility-audit` — Check if the research report gets cited by AI engines
- `/content-atomizer` — Distribute findings across all platforms
- `/ai-seo` — Optimize the report for AI citation
- `/social-campaign` — Schedule social posts promoting the findings
- "Schedule monthly research" — Set up recurring research production

---

## Anti-Patterns

| Anti-pattern | Instead | Why |
|-------------|---------|-----|
| Publishing findings without a surprising angle | Find the contrarian data point first, build around it | Research that confirms what everyone knows doesn't get cited. Surprise drives sharing and citation. |
| Fabricating or rounding up data | Use exact numbers, acknowledge limitations | One fabricated stat destroys credibility across all content. Underreport but be accurate. |
| Making the report too long (10,000+ words) | 3,000-5,000 words with dense stats | AI engines extract stat callouts, not essays. Dense and short beats long and diluted. |
| Skipping methodology disclosure | Always state sample size, date range, biases | Credible methodology = credible data. AI engines and human readers both penalize hidden methodology. |
| Writing a report no one searched for | Check keyword research and AI visibility gaps first | The best research answers a question people are already asking AI engines. |
| Publishing only on the brand blog | Cross-publish stat callouts on LinkedIn, Medium, Reddit | AI engines build consensus across platforms. Single-source data gets cited less. |
| Using percentages without sample sizes | Always: "73% (n=200)" | "73%" is meaningless without context. Every stat needs a sample size. |

## YAGNI Principles

- Don't build a survey platform — use existing tools or manual outreach
- Don't create interactive data visualizations — static charts in the report are sufficient
- Don't wait for 1,000+ respondents — 50-100 with honest methodology beats inflated numbers
- Don't produce quarterly research unless you have the data pipeline for it — one good report beats four mediocre ones
- Don't add PDF download gating — ungated research gets cited 5-10x more than gated
