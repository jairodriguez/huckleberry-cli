---
name: auto-indexing
description: Automatically submit published articles to participating search engines (Bing, Yandex, Seznam via IndexNow) for faster indexing. Google is NOT an IndexNow participant — Google indexing requires sitemap submission in Search Console + manual URL inspection there.
---

# Auto-Indexing Skill

Automatically submit published articles to search engines for faster indexing.

## Purpose

After validating your site with Bing Webmaster Tools, this skill automates the indexing-ping process for every new article you publish. No manual submission required for IndexNow-participant engines.

**CRITICAL — Google coverage gap:** Google never joined IndexNow and deprecated its sitemap ping endpoint (2023). IndexNow submissions do NOT reach Google in any way. For Google you must: (1) submit your sitemap in Google Search Console, and (2) optionally request indexing per-URL via Search Console URL Inspection ("Request indexing").

## When to Use

**Invoke this skill**:
- After publishing a new blog article
- After updating an existing article significantly
- When you want to force re-indexing of a page

**Trigger phrases**:
- "submit the article for indexing"
- "index this article"
- "notify search engines about the new article"
- "auto-index the published article"

## What It Does

1. **IndexNow Protocol** (Priority Method)
   - Instantly notifies participating engines: Bing, Yandex, Seznam, Naver (+ all IndexNow participants) — **NOT Google**
   - No API limits, completely free
   - Typically crawled within 24-48 hours by participants

2. **Sitemap Submission** (Google path)
   - Google ignores IndexNow and killed its ping endpoint (`google.com/ping?sitemap=` → 404, deprecated 2023; Bing's → 410)
   - Submit the sitemap once in Google Search Console → Sitemaps; Google then discovers new URLs from it
   - Per-URL acceleration: Search Console → URL Inspection → "Request indexing" (UI only — no API)

3. **Key Management**
   - Auto-generates IndexNow key on first use
   - Saves key to `.indexnow-key.txt`
   - Provides instructions for uploading key file to site

## Prerequisites

**One-time setup** (after validating your site):

1. **Verify ownership** in Google Search Console and Bing Webmaster Tools
2. **Upload IndexNow key** to your site root (skill will generate and guide you)

That's it! After initial setup, indexing is fully automated.

## How to Use

### Basic Usage

```
Skill: auto-indexing

User provides:
- Article URL: https://www.thegptshop.online/blog/monetize-custom-gpts-2025
```

### Advanced Usage

```
Skill: auto-indexing

With options:
- Article URL: https://example.com/blog/article
- Sitemap URL: https://example.com/sitemap.xml (optional, auto-detected)
- Force re-index: true (for updated articles)
```

## Integration with Publishing Workflow

**Recommended workflow**:
1. Publish article with `github-blog-publisher` skill
2. Verify article is live
3. Invoke `auto-indexing` skill
4. Skill notifies all search engines automatically

**Optional automation**: Add to github-blog-publisher post-publish hook

## Technical Details

**Methods Used**:
- **IndexNow**: HTTP POST to api.indexnow.org (Bing, Yandex, Seznam + participants — NOT Google)
- **Sitemap Ping**: DEPRECATED — Google endpoint 404, Bing endpoint 410 (live-verified 2026-09). Do not rely on it.
- **Google Indexing API**: Limited to JobPosting/BroadcastEvent types only; not applicable to blog content

**Timeline**:
- Submission: Instant (< 5 seconds)
- Crawling by IndexNow participants: 24-48 hours
- Google: no fixed timeline — depends on sitemap submission in GSC, crawl budget, and internal links

**Cost**: Free (no API limits, no rate limits)

## Outputs

**Success**:
```
✅ IndexNow submission successful
   Notified: Bing, Yandex, Seznam (+ all IndexNow participants)
✨ Article submitted for crawling!
   Expected: Crawled by participants within 24-48 hours
ℹ️  Google NOT notified — submit sitemap in Search Console and/or use URL Inspection → Request indexing
```

**First-time setup**:
```
🔑 Generated new IndexNow key: abc123...
📝 Key saved to: .indexnow-key.txt

⚠️  IMPORTANT: Upload this key file to your site root:
   https://thegptshop.online/abc123....txt
   Content: abc123...
```

## Troubleshooting

**Key file not uploaded**:
- Skill generates key and provides upload instructions
- Upload to `public/[key].txt` in your Next.js site
- Redeploy site after uploading key

**Submission failed**:
- Check network connectivity
- Verify site URL is correct
- Check Search Console for manual submission as fallback

**Article not indexed after 72 hours**:
- Verify robots.txt allows crawling
- Check Google Search Console > Coverage report
- Add internal links to the article
- Request manual indexing in Search Console

## Examples

### Example 1: Index New Article
```
User: "I just published the Custom GPTs article, can you submit it for indexing?"
Assistant: "I'll submit your article to search engines for automatic indexing."
*Invokes auto-indexing skill*
Result: Article submitted to Bing, Yandex, Seznam via IndexNow (Google requires GSC sitemap submission / URL Inspection)
```

### Example 2: After Publishing Workflow
```
User: "Publish this article about AI automation"
Assistant: *Uses github-blog-publisher skill*
Assistant: "Article published successfully! Would you like me to submit it for search engine indexing?"
User: "Yes"
Assistant: *Invokes auto-indexing skill*
Result: Crawled by IndexNow participants within 24-48 hours (Google indexing depends on GSC sitemap + crawl)
```

### Example 3: Re-index Updated Article
```
User: "I updated the monetization guide, can you re-submit it for indexing?"
Assistant: *Invokes auto-indexing skill with force flag*
Result: Search engines notified of updated content
```

## Notes

- **No rate limits**: Unlike Google Indexing API, IndexNow has no submission limits
- **Multiple search engines**: One submission notifies all participating search engines
- **Instant notification**: Submission completes in seconds
- **Free forever**: No API costs or subscription fees
- **Works globally, EXCEPT Google**: IndexNow participants cover Bing/Yandex/Seznam/Naver traffic — Google (~90% of global search) is NOT covered and needs Search Console workflows

## Files

- `/scripts/auto-indexing.js` - Core indexing logic
- `.indexnow-key.txt` - Generated IndexNow key (gitignored)
- Integration with github-blog-publisher skill