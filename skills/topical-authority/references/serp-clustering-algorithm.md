# SERP Clustering Algorithm

**Purpose**: Prevent keyword cannibalization by grouping keywords with identical search intent

## The Problem: Keyword Cannibalization

When multiple pages on your site target keywords with the same search intent, they compete against each other for rankings. Google will typically only rank one page from your site for a given search intent, so multiple pages dilute your authority instead of multiplying it.

**Example**:
- Page A targets "email marketing tools"
- Page B targets "best email marketing software"
- SERP overlap: 85% (same domains appear in top 10)
- Result: Pages compete, both rank lower than if you had one comprehensive page

## The Solution: SERP-Based Clustering

Group keywords by analyzing their search results. If two keywords show the same URLs in their top 10 results, Google considers them to have the same search intent.

## Algorithm

### Step 1: Fetch SERP URLs
For each keyword in your universe:
1. Query Google (or SERP API)
2. Extract top 10 organic results
3. Store: `[keyword → [url1, url2, ..., url10]]`
4. Rate limit: 2-3 seconds between requests (avoid blocking)
5. Cache results (SERPs don't change daily)

### Step 2: Calculate Jaccard Similarity
For each pair of keywords, calculate URL overlap:

```
Jaccard Similarity = |A ∩ B| / |A ∪ B|

Where:
- A = Set of domains in keyword A's top 10
- B = Set of domains in keyword B's top 10
- ∩ = Intersection (domains in both sets)
- ∪ = Union (all unique domains)
```

**Example**:
```
Keyword A top 10 domains: [zapier.com, buffer.com, hootsuite.com, hubspot.com, semrush.com, ahrefs.com, moz.com, ...]
Keyword B top 10 domains: [zapier.com, buffer.com, hootsuite.com, hubspot.com, mailchimp.com, sendgrid.com, activecampaign.com, ...]

Intersection: [zapier.com, buffer.com, hootsuite.com, hubspot.com] = 4 domains
Union: 13 unique domains

Jaccard Similarity = 4 / 13 = 0.31 (31% overlap)
```

### Step 3: Three-Tier Classification

**Tier 1: Obvious Same Intent (≥70% overlap)**
- Action: Group into same cluster automatically
- Reason: High overlap = Google sees these as identical intent
- Example: "email marketing tools" vs "best email marketing software" (85% overlap)
- Cost: Free (no AI needed)

**Tier 2: Ambiguous (30-69% overlap)**
- Action: Use Gemini/GPT-4 to analyze intent
- Reason: Medium overlap = unclear if intent is same or different
- Example: "content marketing tools" vs "social media marketing tools" (45% overlap)
- Cost: ~$0.001 per comparison
- Optimization: Only call AI for ambiguous cases (saves 70-80% of AI costs)

**Tier 3: Obvious Different Intent (<30% overlap)**
- Action: Keep in separate clusters automatically
- Reason: Low overlap = Google sees these as different intent
- Example: "email marketing" vs "email marketing automation" (25% overlap)
- Cost: Free (no AI needed)

### Step 4: Gemini Intent Analysis (Tier 2 Only)

**Prompt Template**:
```
You are an SEO search intent analyzer.
Compare these two keywords and determine if they have the SAME search intent (should be on same page) or DIFFERENT intent (need separate pages).

Keyword 1: "{keyword1}"
Keyword 2: "{keyword2}"

Return ONLY "SAME" or "DIFFERENT". No explanation.

SAME = Same topic, same user goal, same type of content expected
DIFFERENT = Different topics, different user goals, or different content types

Examples:
Q: "email marketing tools" vs "best email marketing software" → SAME
Q: "email marketing" vs "email marketing automation" → DIFFERENT
Q: "content calendar" vs "social media calendar" → SAME
Q: "seo tools" vs "seo strategy" → DIFFERENT
```

**Response Parsing**:
- If response contains "SAME" → Group into same cluster
- If response contains "DIFFERENT" → Keep in separate clusters
- If error/timeout → Default to DIFFERENT (conservative approach)

### Step 5: Cluster Merging

After pairwise comparisons, merge overlapping clusters:

```javascript
// Cluster building algorithm
const clusters = [];

for (const [kw1, kw2] of keyword_pairs) {
  const similarity = calculateJaccardSimilarity(kw1, kw2);
  let shouldCluster = false;

  if (similarity >= 0.7) {
    shouldCluster = true; // Obvious same
  } else if (similarity < 0.3) {
    shouldCluster = false; // Obvious different
  } else {
    shouldCluster = analyzeIntentWithGemini(kw1, kw2); // Ambiguous
  }

  if (shouldCluster) {
    // Find existing cluster or create new one
    let cluster = clusters.find(c => c.keywords.includes(kw1) || c.keywords.includes(kw2));

    if (cluster) {
      // Add to existing cluster
      if (!cluster.keywords.includes(kw1)) cluster.keywords.push(kw1);
      if (!cluster.keywords.includes(kw2)) cluster.keywords.push(kw2);
    } else {
      // Create new cluster
      clusters.push({ keywords: [kw1, kw2] });
    }
  }
}
```

### Step 6: Singleton Handling

Keywords not clustered with any others become singleton clusters (one keyword = one page).

## Cost Optimization

**Traditional approach**: Call SERP API + AI for every keyword pair
- 500 keywords = 124,750 pairs
- Cost: $0.01 per API call = $1,247.50
- Time: Hours to days

**Our optimized approach**: Jaccard similarity + selective AI
- Free: 70% obvious same (≥70% overlap)
- Free: 20% obvious different (<30% overlap)
- AI: 10% ambiguous (30-69% overlap)
- Cost for 500 keywords: ~$2-5 (only 12,475 AI calls)
- Time: 10-30 minutes

**Savings**: 99.5% cost reduction

## Implementation Details

### SERP Fetching Options

**Option 1: Free HTTP Requests** (Development)
```javascript
async function fetchGoogleSERP(keyword) {
  const url = `https://www.google.com/search?q=${encodeURIComponent(keyword)}`;
  // Parse HTML, extract top 10 domains
  // Rate limit: 2-3 seconds between requests
  // Risk: Google may block after ~100 requests
}
```

**Option 2: SERP APIs** (Production)
- DataForSEO: $0.002 per keyword
- SerpAPI: $0.004 per keyword
- ValueSERP: $0.003 per keyword
- Benefit: Reliable, no blocking, structured data

**Option 3: Browser Automation** (Alternative)
- Puppeteer/Playwright with rotating proxies
- Cost: Proxy fees (~$5/mo)
- Benefit: More reliable than raw HTTP

### Caching Strategy

```javascript
// Cache SERP results to avoid re-fetching
const cache = {
  keyword: {
    urls: [...],
    fetchedAt: ISO_timestamp,
    ttl: 30_days // SERPs don't change daily
  }
};
```

### Checkpointing

For large keyword sets (1,000+), save progress every 100 keywords:
```javascript
if (processedCount % 100 === 0) {
  saveCheckpoint(clusters, processedCount);
}
```

## Output Format

```json
{
  "clusters": [
    {
      "id": "cluster-1",
      "keywords": [
        "email marketing tools",
        "best email marketing software",
        "top email marketing platforms"
      ],
      "size": 3,
      "primaryKeyword": "email marketing tools",
      "avgOverlap": 0.82
    },
    {
      "id": "cluster-2",
      "keywords": ["email marketing automation"],
      "size": 1,
      "primaryKeyword": "email marketing automation",
      "avgOverlap": 0
    }
  ],
  "summary": {
    "totalKeywords": 500,
    "totalClusters": 87,
    "avgClusterSize": 5.7,
    "singletons": 23,
    "geminiCalls": 12,
    "estimatedCost": "0.012"
  }
}
```

## Validation

**Quality Checks**:
1. No keyword appears in multiple clusters (mutual exclusivity)
2. All keywords accounted for (clustered or singleton)
3. Cluster sizes make sense (most 1-10 keywords, few outliers)
4. Primary keyword is most generic in cluster

**Manual Spot Checks**:
- Sample 10 clusters
- Verify keywords have same intent
- Check if SERP overlap makes sense

## Common Edge Cases

### 1. Brand vs Generic Keywords
```
"mailchimp" vs "email marketing software"
```
- SERP overlap: 15% (mailchimp.com dominates first, not second)
- Action: Separate clusters (different intent: branded vs category)

### 2. How-to vs What-is
```
"how to do email marketing" vs "what is email marketing"
```
- SERP overlap: 35% (ambiguous)
- Gemini: DIFFERENT (how-to = implementation, what-is = definition)
- Action: Separate clusters

### 3. Singular vs Plural
```
"email marketing tool" vs "email marketing tools"
```
- SERP overlap: 95% (nearly identical)
- Action: Same cluster

### 4. Year-Specific Keywords
```
"email marketing tools 2024" vs "email marketing tools 2025"
```
- SERP overlap: 60% (ambiguous)
- Gemini: SAME (same intent, just time-specific)
- Action: Same cluster, update content yearly

## Integration with Hub Architecture

After clustering:
1. Large clusters (5+ keywords) → Pillar pages
2. Medium clusters (2-4 keywords) → Supporting cluster pages
3. Singletons → Decide: Create page or merge into related cluster

## Performance Benchmarks

**500 keywords**:
- SERP fetching: 5-10 minutes (with rate limiting)
- Jaccard calculation: <1 minute (local computation)
- Gemini calls: 2-5 minutes (only 10-15% of pairs)
- Total time: 10-20 minutes
- Total cost: $2-5

**1,000 keywords**:
- SERP fetching: 15-30 minutes
- Jaccard calculation: 2-3 minutes
- Gemini calls: 5-10 minutes
- Total time: 25-45 minutes
- Total cost: $5-10

## Troubleshooting

**Issue**: Google blocking requests
- Solution: Use SERP API or browser automation with proxies

**Issue**: High Gemini costs
- Solution: Increase ambiguous threshold (30-69% → 40-60%)

**Issue**: Too many singletons
- Solution: Lower clustering threshold (70% → 60%)

**Issue**: Too few clusters
- Solution: Raise clustering threshold (70% → 80%)

## References

- Jake Ward's SERP Clustering Method
- Jaccard Similarity Algorithm
- Implementation: `scripts/seo/gemini-serp-clustering.js`
