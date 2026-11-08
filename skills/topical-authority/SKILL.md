---
name: topical-authority
description: Market-first topical authority system with systematic keyword-to-content-cluster workflow.
---
name: topical-authority
description: Market-first topical authority system using systematic framework. Complete workflow from keyword research through content cluster generation.
---

# Topical Authority Skill

**Market-first topical authority system using Jake Ward's 7-step framework**

## Overview

This skill implements a complete topical authority workflow that starts with market research (forums, Reddit, Quora) and builds SEO-optimized content clusters using SERP analysis and hub-and-spoke architecture.

**Key Innovation**: All script execution is delegated to Gemini CLI for 95%+ token savings.

## When to Use This Skill

Use this skill when:
- Starting SEO strategy for a new brand or niche
- Building topical authority in a specific domain
- Need to identify high-value content opportunities (GOLDEN/GOOD)
- Want to prevent keyword cannibalization via SERP clustering
- Building hub-and-spoke content architecture
- Auditing and improving internal linking structure

**Trigger phrases**:
- "build topical authority for [brand]"
- "run SEO discovery for [brand]"
- "identify content gaps for [brand]"
- "audit internal links for [brand]"

## Workflow Phases

### Phase 1: Forum Discovery (Scripts 1-4)
Scrape pain points and questions from multiple sources:
- **Reddit**: Pain point detection across ICP-relevant subreddits
- **Quora**: High-engagement questions by topic
- **People Also Ask**: Recursive PAA expansion from seed keywords
- **Competitor Analysis**: Content gap identification

**Output**: `businesses/{business}/evergreen.mdforum-data/*.json`

### Phase 2: Keyword Extraction (Script 5)
Use Gemini CLI to extract keyword variations from forum data:
- 5-10 keyword variations per forum item
- Volume estimates (high/medium/low)
- Search intent classification
- Deduplication and normalization

**Output**: `businesses/{business}/evergreen.mdkeyword-universe.json`

### Phase 3: SERP Clustering (Scripts 6-8)
Prevent keyword cannibalization using URL overlap analysis:
- **Fetch SERP URLs**: Top 10 results per keyword
- **Cluster by Intent**: Jaccard similarity + Gemini analysis
- **Build Architecture**: Identify pillars and clusters

**Algorithm**:
- ≥70% URL overlap → Same cluster (same page)
- <30% URL overlap → Different clusters (separate pages)
- 30-69% overlap → Gemini analyzes search intent

**Output**: `businesses/{business}/evergreen.mdhub-architecture.json`

### Phase 4: Gap Analysis (Scripts 9-10)
Identify high-value opportunities and research needs:
- **Content Gaps**: Priority Score = `Volume × (100 - Difficulty)`
- **Research Gaps**: Check if podcast research exists

**Opportunity Levels**:
- GOLDEN (top 10%): High volume + Very low difficulty (<20)
- GOOD (next 20%): Good volume + Low difficulty (20-40)
- MEDIUM (next 30%): Medium volume or medium difficulty
- SKIP (bottom 40%): Low volume or high difficulty (>60)

**Output**: `businesses/{business}/evergreen.mdcontent-gaps.json`, `research-gaps.json`

### Phase 5: Internal Linking (Scripts 11-12)
Audit and improve internal link structure:
- **Audit**: Build link graph, identify orphaned pages
- **Weave**: Auto-suggest strategic link insertions

**Health Metrics**:
- Orphan rate (% pages with no inbound links)
- Avg internal links per page
- Hub-spoke adherence score
- Linking density

**Output**: `businesses/{business}/evergreen.mdinternal-links-health.md`, `link-suggestions.md`

## Cost Structure

**Total estimated cost for 500-1,000 keywords**: ~$2-10

| Component | Cost | Notes |
|-----------|------|-------|
| SERP Fetching | Free | HTTP requests (production: use SERP API) |
| Keyword Extraction | ~$1-2 | Gemini CLI batch processing |
| SERP Clustering | ~$1-5 | Gemini only for ambiguous cases (30-69% overlap) |
| Total | ~$2-10 | vs $50/mo subscriptions |

## Usage

### Option 1: Run Complete Workflow
```bash
# Invoke skill and specify phase
Skill: topical-authority

# Then in skill context:
# Run all phases for brand ai.withjai
# Use defaults: min-volume=100, min-cluster-size=3
```

### Option 2: Run Individual Phases
```bash
# Phase 1: Forum discovery
/topical-authority-discover --brand ai.withjai

# Phase 2-3: SERP clustering
/topical-authority-cluster --brand ai.withjai

# Phase 4-5: Gap analysis + linking
/topical-authority-analyze --brand ai.withjai
```

### Option 3: Run Individual Scripts
```bash
# Forum scrapers
node scripts/seo/scrape-reddit-pain-points.js --brand ai.withjai
node scripts/seo/scrape-quora-questions.js --brand ai.withjai --topics "ai automation,content marketing"

# SERP clustering
node scripts/seo/fetch-serp-urls.js --brand ai.withjai --limit 100
node scripts/seo/gemini-serp-clustering.js --brand ai.withjai --threshold 0.7

# Gap analysis
node scripts/seo/identify-content-gaps.js --brand ai.withjai --min-volume 100
node scripts/seo/identify-research-gaps.js --brand ai.withjai --min-priority 2

# Internal linking
node scripts/seo/audit-internal-links.js --brand ai.withjai --min-links 3
node scripts/seo/weave-internal-links.js --brand ai.withjai --auto-insert
```

## Parameters

| Parameter | Default | Description |
|-----------|---------|-------------|
| `--brand` | Required | Brand identifier (ai.withjai, enchantents, etc) |
| `--subreddits` | Auto-detected | Comma-separated list of subreddits |
| `--topics` | Auto-detected | Comma-separated topics for Quora |
| `--seed-keywords` | Auto-detected | Seed keywords for PAA expansion |
| `--limit` | 100 | Max items to process per source |
| `--threshold` | 0.7 | SERP clustering threshold (70% overlap) |
| `--min-cluster-size` | 3 | Min keywords to be a pillar page |
| `--min-volume` | 100 | Min monthly search volume |
| `--min-priority` | 2 | Min priority level (1=GOLDEN, 2=GOOD) |
| `--min-links` | 3 | Min internal links per page |
| `--auto-insert` | false | Auto-insert suggested links (creates backups) |

## Integration with Existing Workflows

### After Topical Authority Setup → Content Creation
```bash
# 1. Run topical authority to identify opportunities
Skill: topical-authority

# 2. Check research gaps
# Output shows: "Need podcast research for: [topics]"

# 3. Use podcast-smart-ingestion to fill gaps
Skill: podcast-smart-ingestion

# 4. Create content using lean blog workflow
/podcast-blog-lean --podcast "{path}" --brand {brand}

# 5. Validate internal linking
node scripts/seo/audit-internal-links.js --brand {brand}
```

### Quarterly Refresh
```bash
# Every 3 months, refresh topical authority analysis
# 1. Re-scrape forums for new pain points
# 2. Re-fetch SERP data (search results change)
# 3. Re-analyze content gaps
# 4. Re-audit internal links
```

## Orchestrator Architecture

**Token Optimization**: All script execution delegated to Gemini CLI

```javascript
// Orchestrator pattern
1. User invokes skill with brand + phase
2. Orchestrator builds Gemini CLI prompt:
   - List of scripts to run
   - Parameters for each script
   - Expected outputs
   - Validation criteria
3. Gemini CLI executes scripts sequentially
4. Orchestrator validates outputs
5. Return summary to user
```

**Token Savings**: 95%+ reduction vs running scripts directly in Claude context

## Output Artifacts

All outputs saved to `businesses/{business}/evergreen.md`:

| File | Description |
|------|-------------|
| `forum-data/reddit-pain-points.json` | Reddit pain points by category |
| `forum-data/quora-questions.json` | High-engagement Quora questions |
| `forum-data/paa-questions.json` | People Also Ask recursive expansion |
| `forum-data/competitor-coverage.json` | Competitor content gap analysis |
| `keyword-universe.json` | Deduplicated keyword list with intent |
| `serp-data/serp-urls.json` | Top 10 URLs per keyword |
| `serp-data/keyword-clusters.json` | SERP-based keyword clusters |
| `hub-architecture.json` | Pillar pages + cluster structure + linking plan |
| `content-gaps.json` | Prioritized content opportunities |
| `research-gaps.json` | Missing research + podcast queries |
| `internal-links-graph.json` | Link graph + health metrics |
| `internal-links-health.md` | Human-readable link audit report |
| `link-suggestions.md` | Strategic link insertion suggestions |

## Success Criteria

**Forum Discovery**:
- ✅ 50+ pain points from Reddit
- ✅ 30+ high-engagement Quora questions
- ✅ 50+ PAA questions (depth 2)
- ✅ 10+ competitor content gaps

**SERP Clustering**:
- ✅ 100+ keywords validated
- ✅ 5-10 pillar pages identified
- ✅ 20-50 supporting clusters
- ✅ <$5 Gemini CLI cost

**Gap Analysis**:
- ✅ 10+ GOLDEN opportunities identified
- ✅ 20+ GOOD opportunities
- ✅ Research coverage >60%
- ✅ Podcast queries for gaps

**Internal Linking**:
- ✅ Health score >80/100
- ✅ Orphan rate <10%
- ✅ Avg 5+ links per page
- ✅ Hub-spoke adherence >80%

## Technical Implementation

**All 12 Scripts**:
1. `scripts/seo/scrape-reddit-pain-points.js`
2. `scripts/seo/scrape-quora-questions.js`
3. `scripts/seo/extract-paa-questions.js`
4. `scripts/seo/analyze-competitor-coverage.js`
5. `scripts/seo/extract-keywords-from-forums.js`
6. `scripts/seo/fetch-serp-urls.js`
7. `scripts/seo/gemini-serp-clustering.js`
8. `scripts/seo/build-clusters-from-serp.js`
9. `scripts/seo/identify-content-gaps.js`
10. `scripts/seo/identify-research-gaps.js`
11. `scripts/seo/audit-internal-links.js`
12. `scripts/seo/weave-internal-links.js`

**Orchestrator**: `.claude/skills/topical-authority/scripts/orchestrator.js`

**Slash Commands**:
- `/topical-authority-discover` - Phase 1: Forum discovery
- `/topical-authority-cluster` - Phase 2-3: SERP clustering
- `/topical-authority-analyze` - Phase 4-5: Gap analysis + linking

## References

- Jake Ward's Topical Authority Framework (YouTube)
- Implementation Plan: `docs/TOPICAL-AUTHORITY-IMPLEMENTATION-PLAN.md`
- SERP Clustering Algorithm: Jaccard similarity + Gemini intent analysis
- Priority Formula: `Volume × (100 - Difficulty)`

## Troubleshooting

**Issue**: SERP fetching blocked by Google
- **Solution**: Use SERP API (DataForSEO, SerpAPI, ValueSERP) or rotating proxies

**Issue**: Gemini CLI timeout on large datasets
- **Solution**: Reduce batch size or increase timeout

**Issue**: Low research coverage (<40%)
- **Solution**: Run podcast-smart-ingestion with research gap queries

**Issue**: Link health score <60/100
- **Solution**: Run weave-internal-links with --auto-insert

**Issue**: No GOLDEN opportunities found
- **Solution**: Lower min-volume threshold or expand keyword universe

## Version History

- **v1.0.0** (2025-11-17): Initial implementation with 12 scripts + Gemini CLI orchestration
