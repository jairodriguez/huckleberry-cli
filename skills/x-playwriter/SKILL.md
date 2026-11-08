---
name: x-playwriter
description: Extract and interact with X via Playwriter browser automation.
---

# X Playwriter Skill

## Overview

This skill provides Playwriter-based automation for X (Twitter), enabling extraction of posts, replies, engagement metrics, and navigation through threads and quoted content.

**When to invoke:**
- "Browse X", "Extract tweets", "Get X feed content"
- "Analyze X trends", "Scrape competitor posts"
- Any task requiring authenticated X interaction

---

## Prerequisites

### 1. Install Playwriter Extension

Install from: https://chromewebstore.google.com/detail/playwriter/jfeammnjpkecdekppnclgkkffahnhfhe

### 2. Create Playwriter Session

```bash
npx playwriter@latest session new
# → outputs session ID (e.g. "1")
```

### 3. Navigate to X in Chrome

Open the X page you want to scrape in your Chrome browser before running automation.

---

## Quick Start

### Extract Tweets from Current View

```bash
npx playwriter@latest -s 1 -e "
const tweets = await page.locator('[data-testid=\"tweet\"]').all();
const results = await Promise.all(tweets.slice(0, 10).map(async t => {
  const text = await t.locator('[data-testid=\"tweetText\"]').textContent().catch(() => '');
  const author = await t.locator('[data-testid=\"User-Name\"]').textContent().catch(() => '');
  const metrics = await t.locator('[data-testid=\"reply\"]').textContent().catch(() => '0');
  return { text: text.slice(0, 200), author, metrics };
}));
console.log(JSON.stringify(results, null, 2));
"
```

### Navigate to X Home and Extract

```bash
npx playwriter@latest -s 1 -e "
await page.goto('https://x.com/home', { waitUntil: 'networkidle', timeout: 30000 });
await page.waitForTimeout(3000);
const tweets = await page.locator('[data-testid=\"tweet\"]').allTextContents();
console.log(JSON.stringify(tweets.slice(0, 20), null, 2));
"
```

---

## Verified X Selectors (Tested March 2026)

| Element | Selector | Description |
|---------|----------|-------------|
| Tweet container | `[data-testid="tweet"]` | Main tweet article element |
| Tweet text | `[data-testid="tweetText"]` | Tweet content |
| Author name | `[data-testid="User-Name"]` | Author display name + handle |
| Reply count | `[data-testid="reply"]` | Reply metric label |
| Like count | `[data-testid="like"]` | Like metric label |
| Retweet count | `[data-testid="retweet"]` | Retweet metric label |
| Posted time | `[data-testid="tweetTimestamp"]` | Timestamp link |
| Profile image | `[data-testid="avatar"]` | User avatar |
| Load more | `text=Show` | Load more replies |
| Tweet link | `article a[href*=\"/status/\"]` | Links within tweets |

---

## Core Functions

### 1. Extract Feed Posts

Extract posts from any X feed (Home, Profile, List, Search).

```javascript
async function extractFeedPosts(page, limit = 20) {
  await page.waitForSelector('[data-testid="tweet"]', { timeout: 15000 });
  
  const tweets = await page.locator('[data-testid="tweet"]').all();
  const posts = [];
  
  for (const tweet of tweets.slice(0, limit)) {
    try {
      const text = await tweet.locator('[data-testid="tweetText"]').textContent();
      const author = await tweet.locator('[data-testid="User-Name"]').textContent();
      const time = await tweet.locator('[data-testid="tweetTimestamp"]').textContent();
      const replyCount = await tweet.locator('[data-testid="reply"]').textContent();
      const likeCount = await tweet.locator('[data-testid="like"]').textContent();
      const retweetCount = await tweet.locator('[data-testid="retweet"]').textContent();
      
      // Get tweet ID from link
      const tweetLink = await tweet.locator('a[href*="/status/"]').first().getAttribute('href');
      
      posts.push({
        text: text?.trim() || '',
        author: author?.trim() || '',
        time: time?.trim() || '',
        metrics: { reply: replyCount, like: likeCount, retweet: retweetCount },
        id: tweetLink?.match(/\/status\/(\d+)/)?.[1]
      });
    } catch (e) {
      // Skip malformed tweets
    }
  }
  
  return posts;
}
```

**Usage:**
```bash
npx playwriter@latest -s 1 -e "
const result = await extractFeedPosts(page, 10);
console.log(JSON.stringify(result, null, 2));
" --timeout 60000
```

### 2. Navigate to Profile and Extract

```bash
npx playwriter@latest -s 1 -e "
await page.goto('https://x.com/USERNAME', { waitUntil: 'networkidle', timeout: 30000 });
await page.waitForTimeout(2000);
const tweets = await page.locator('[data-testid=\"tweet\"]').allTextContents();
console.log(JSON.stringify(tweets.slice(0, 20), null, 2));
"
```

### 3. Handle Infinite Scroll

X loads more content as you scroll. Use this pattern:

```javascript
async function scrollAndExtract(page, maxTweets = 50, scrollCount = 3) {
  const seen = new Set();
  
  for (let i = 0; i < scrollCount; i++) {
    await page.evaluate(() => window.scrollBy(0, 1000));
    await page.waitForTimeout(1500);
    
    const tweets = await page.locator('[data-testid=\"tweet\"]').all();
    for (const tweet of tweets) {
      const link = await tweet.locator('a[href*=\"/status/\"]').first().getAttribute('href');
      if (link && !seen.has(link)) {
        seen.add(link);
      }
    }
  }
  
  return seen.size;
}
```

### 4. Click into Tweet/Thread

```bash
npx playwriter@latest -s 1 -e "
// Navigate to tweet
await page.goto('https://x.com/USERNAME/status/TWEET_ID', { waitUntil: 'networkidle' });
await page.waitForTimeout(2000);

// Extract main tweet
const tweet = await page.locator('[data-testid=\"tweet\"]').first();
const text = await tweet.locator('[data-testid=\"tweetText\"]').textContent();
const metrics = await tweet.locator('[role=\"group\"]').textContent();

// Extract replies
const replies = await page.locator('[data-testid=\"cell\"]').allTextContents();

console.log(JSON.stringify({ text, metrics, replyCount: replies.length }, null, 2));
"
```

### 5. Follow Links to Quoted Articles

```javascript
async function extractQuotedContent(page) {
  const quotedLinks = await page.locator('[data-testid=\"tweet\"] a[href*=\"x.com\"]').all();
  
  for (const link of quotedLinks) {
    const href = await link.getAttribute('href');
    if (href && href.includes('/status/')) {
      // Click the quoted tweet link
      await link.click();
      await page.waitForTimeout(2000);
      
      const quotedText = await page.locator('[data-testid=\"tweetText\"]').first().textContent();
      console.log('Quoted:', quotedText);
      
      // Go back
      await page.goBack();
      await page.waitForTimeout(1000);
    }
  }
}
```

### 6. Search X

```bash
npx playwriter@latest -s 1 -e "
await page.goto('https://x.com/search?q=YOUR%20SEARCH%20QUERY&src=typed_query', { waitUntil: 'networkidle' });
await page.waitForTimeout(3000);
const tweets = await page.locator('[data-testid=\"tweet\"]').allTextContents();
console.log(JSON.stringify(tweets.slice(0, 20), null, 2));
"
```

---

## Session Management

### Check Active Sessions

```bash
npx playwriter@latest session list
```

### Create New Session

```bash
npx playwriter@latest session new
```

### Reset Session (if disconnected)

```bash
npx playwriter@latest session reset 1
```

### Delete Session

```bash
npx playwriter@latest session delete 1
```

---

## Error Handling

### Login Wall / Auth Required

If redirected to login:
```
❌ Error: Redirected to x.com/login
```
**Solution:** User must be logged into X in their Chrome browser. Open X manually first.

### Rate Limiting

If requests are throttled:
```
❌ Error: Something went wrong. Limit your requests
```
**Solution:** Add delays between actions (`await page.waitForTimeout(3000)`). Don't extract too many tweets in one go.

### Content Not Loading

If tweet selectors fail:
```
❌ Error: waitForSelector timed out
```
**Solution:** Increase timeout, add `waitUntil: 'networkidle'`, or manually navigate to the page first.

### Session Disconnected

If Playwriter loses connection:
```bash
npx playwriter@latest session reset 1
# Then re-run your command
```

---

## Common Workflows

### Workflow 1: Extract Competitor Posts

```bash
npx playwriter@latest -s 1 -e "
await page.goto('https://x.com/COMPETITOR_HANDLE', { waitUntil: 'networkidle', timeout: 30000 });
await page.waitForTimeout(3000);

const posts = await page.locator('[data-testid=\"tweet\"]').slice(0, 20).map(async t => ({
  text: await t.locator('[data-testid=\"tweetText\"]').textContent(),
  metrics: await t.locator('[role=\"group\"]').textContent()
}));

console.log(JSON.stringify(posts, null, 2));
"
```

### Workflow 2: Monitor Hashtag Feed

```bash
npx playwriter@latest -s 1 -e "
await page.goto('https://x.com/hashtag/YOUR_HASHTAG', { waitUntil: 'networkidle' });
await page.waitForTimeout(3000);

// Scroll to load more
for (let i = 0; i < 3; i++) {
  await page.evaluate(() => window.scrollBy(0, 800));
  await page.waitForTimeout(1500);
}

const tweets = await page.locator('[data-testid=\"tweet\"]').allTextContents();
console.log(JSON.stringify(tweets.slice(0, 30), null, 2));
"
```

### Workflow 3: Get Trending Topics from Sidebar

```bash
npx playwriter@latest -s 1 -e "
await page.goto('https://x.com/home', { waitUntil: 'networkidle' });
await page.waitForTimeout(2000);

const trends = await page.locator('[data-testid=\"trend\"]').allTextContents();
console.log(JSON.stringify(trends.slice(0, 10), null, 2));
"
```

### Workflow 4: Extract Thread Content

```bash
npx playwriter@latest -s 1 -e "
// Navigate to first tweet in thread
await page.goto('https://x.com/USERNAME/status/THREAD_START_ID', { waitUntil: 'networkidle' });
await page.waitForTimeout(2000);

const thread = [];
const replies = await page.locator('[data-testid=\"cell\"]').all();

for (const reply of replies.slice(0, 20)) {
  const text = await reply.locator('[data-testid=\"tweetText\"]').textContent().catch(() => '');
  if (text) thread.push(text);
}

console.log(JSON.stringify(thread, null, 2));
"
```

---

## Timeout Guidelines

| Action | Recommended Timeout |
|--------|---------------------|
| Page navigation | 30,000ms |
| Initial load | 15,000ms |
| Scroll wait | 3,000ms |
| Network idle | 30,000ms |
| Extraction | 60,000ms |

---

## Output Format

Extracted tweets return as JSON:

```json
[
  {
    "text": "Tweet content here...",
    "author": "Author Name @handle",
    "time": "2h",
    "metrics": {
      "reply": "12",
      "like": "234",
      "retweet": "56"
    },
    "id": "1234567890123456789"
  }
]
```

---

## Integration with Other Skills

After extracting X content:

```bash
# Analyze for content patterns
Skill: influencer-pattern-extractor

# Generate social posts
Skill: platform-content-generator

# Extract trending topics
Skill: x-home-buzz
```

---

## Troubleshooting Reference

| Error | Cause | Solution |
|-------|-------|----------|
| Empty response | Page not loaded | Add `waitUntil: 'networkidle'` |
| Selector not found | Dynamic content | Use `waitForSelector` with timeout |
| Login wall | Not authenticated | User must log in first |
| Rate limited | Too many requests | Add delays, reduce extraction size |
| Session lost | Connection dropped | Run `session reset` and reconnect |

---

## See Also

- `.claude/skills/notebooklm-browser-agent/SKILL.md` — Full Playwriter automation guide
- `.claude/skills/x-home-buzz/SKILL.md` — Extract trending from Home feed
- MEMORY.md — "Playwriter for X Content Extraction" section
