---
slash_command: false
name: x-research
description: Search and research X (Twitter) using bird CLI. Use when researching social media sentiment, trending topics, user activity, or platform-specific content that only exists on X.
---

## USE WHEN
**Use this skill when:**

- Researching **X/Twitter-specific content** that won't appear in web search
- Analyzing **social media sentiment** around topics, brands, or people
- Tracking **trending hashtags** or conversations on X
- Researching **user activity** and tweet history (recent tweets, engagement patterns)
- Finding **real-time reactions** to events or announcements
- Monitoring **brand mentions** or competitor activity on X
- Researching **influencer or thought leader** presence and engagement
- Finding **thread content** or quote tweets (context not in web search)

**Example scenarios:**
- "What's X saying about NVDA stock today?" → sentiment analysis + recent tweets
- "Research @elonmusk's recent AI-related tweets" → user tweet history
- "Find trending hashtags for #AI" → hashtag research
- "Who's mentioning Nomadixgear on X?" → brand mention monitoring
- "What's the reaction to this news on X?" → real-time sentiment

## DON'T WHEN
**Don't use this skill when:**

- Researching **general web content** (use web_search or web_fetch instead)
- Topic is **not X-specific** (general knowledge, Wikipedia, etc.)
- Looking for **long-form content** (blog posts, articles) → use web_fetch
- Researching **official documentation** or press releases → use web_fetch on official sites
- User wants **broad research across platforms** (not just X)
- Topic is **evergreen content** (not time-sensitive tweets)
- Need **in-depth analysis** (X is for quick hits, use deep-research for comprehensive)

**Wrong uses:**
- "What's the capital of France?" → Use web_search or answer directly
- "Read this blog post" → Use web_fetch on the URL
- "Who is CEO of Apple?" → Use web_search, not X search
- "Find me documentation for X API" → Use web_fetch on docs.x.com
- "Research competitor features" → Use deep-research or web_search (broader than X)

**Alternative patterns:**
- Web search → web_search tool (broader sources)
- URL content → web_fetch tool (direct access)
- Deep research → deep-research skill (comprehensive with citations)
- Social media beyond X → Consider platform-specific tools or web_search with site filters

# X Research Skill
Search and research X (Twitter) using bird CLI.

## Agent-Reach Integration (Free X Search)

**Agent-Reach** (skill: `agent-reach`) provides free X/Twitter search via bird CLI / twitter-cli (no API key, zero config):
```bash
agent-reach doctor --json  # Check if X backend is available (shows bird CLI or twitter-cli)

# Search tweets
twitter search "query" -n 10
# or
bird search "query"

# Read single tweet/thread
twitter tweet URL
bird tweet URL

# User timeline
twitter user-posts @username -n 20
```

**Use Agent-Reach for**: Quick searches, broad discovery, zero-setup research.
**Use x-research skill for**: Structured queries with time filters, sentiment analysis, historical tracking.

## Usage
```bash

# Quick search (via x-research skill)
x-research --query "OpenClaw skills" --time 24h

# Quick search (via Agent-Reach, zero config)
twitter search "OpenClaw skills" -n 10

# Deep research with analysis (x-research skill)
x-research --query "what are people saying about NVDA today" --time today --analyze

# Search specific user tweets (x-research skill)
x-research --query "from:@elonmusk AI" --time 7d

# Read specific tweet/thread (Agent-Reach)
twitter tweet "https://x.com/user/status/123"
```

## Time Filters
- `1h`, `24h`, `today`, `7d`, `30d`

## Output Formats

### Quick Search
- Tweet text and metadata
- Author, timestamp, engagement stats
- URLs and hashtags

### Analysis Mode (--analyze)
- Sentiment summary (positive/negative/neutral), Top themes extracted, Key accounts mentioned, Engagement patterns

# Recent conversation tracking
x-research --query "AIwithJai" --time 24h

# Sentiment analysis
x-research --query "Nomadixgear" --time today --analyze

# Competitor monitoring
x-research --query "competitor-name" --time 7d

# Trending hashtag research
x-research --query "#glamping" --time today

## Tips
- X search is best for **recent, time-sensitive content** (last 1-7 days)
- For older content, X search is limited — use web_search with site:twitter.com
- Engagement metrics help identify **influential tweets** vs noise
- Analysis mode provides **qualitative insights** beyond raw tweet lists

## Limitations
- X search API limits historical data (usually 7 days for full search, longer for user-specific)
- Retweets and quote tweets may need manual inspection for context
- Direct messages (DMs) are not searchable
- Deleted tweets remain indexed briefly in some cases
