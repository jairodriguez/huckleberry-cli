---
name: x-posting-playwriter
description: >
  Post tweets and threads to X/Twitter via Playwriter (browser automation).
  Use when bird CLI is blocked (error 226) or as primary posting method.
  Handles Draft.js contenteditable, single tweets and multi-tweet threads
  with rate limiting. Triggers on: "post to x", "tweet via playwriter",
  "x thread playwriter", "post tweet browser".
---

# X Posting via Playwriter

Post tweets and threads to X.com using browser automation via Playwriter. Works when bird CLI is blocked by anti-automation detection (error 226).

**Why this exists:** bird CLI uses cookie auth which X flags as automated. Playwriter controls your actual Chrome browser, which X sees as a real user session.

## Key Discovery: Draft.js + keyboard.insertText

X uses Draft.js for its compose editor. Normal Playwright methods fail:
- `locator.click()` on textarea → times out (X blocks programmatic clicks on compose)
- `locator.fill()` → times out
- `keyboard.type()` → Draft.js doesn't register
- `keyboard.press()` per char → Draft.js doesn't register
- `document.execCommand('insertText')` → sometimes works but unreliable
- `navigator.clipboard.writeText()` + paste → X blocks programmatic paste

**What works:**
1. `mouse.click()` with coordinates from `boundingBox()` → bypasses X's click interception
2. `keyboard.insertText()` → triggers Draft.js input handler properly
3. `mouse.click()` on Post button via coordinates → posts successfully

## Prerequisites

- Chrome must be running with the X account logged in
- Playwriter extension must be connected
- Use the correct browser profile (the one logged into X)

```bash
bunx playwriter@latest session new --browser "profile:108142496489660000816"
```

## Posting a Single Tweet

```bash
SESSION=7  # your session id

# Step 1: Navigate to X home
bunx playwriter@latest -s $SESSION -e "$(cat <<'EOF'
state.page = context.pages().find(p => p.url() === 'https://x.com/home')
if (!state.page) {
  state.page = await context.newPage()
  await state.page.goto('https://x.com/home', { waitUntil: 'domcontentloaded' })
}
await state.page.waitForTimeout(5000)
console.log("Ready:", state.page.url())
EOF
)"

# Step 2: Click textarea via coordinates and type
bunx playwriter@latest -s $SESSION -e "$(cat <<'EOF'
const textarea = state.page.locator('[data-testid="tweetTextarea_0"]')
const tbox = await textarea.boundingBox()
await state.page.mouse.click(tbox.x + tbox.width/2, tbox.y + tbox.height/2)
await state.page.waitForTimeout(1000)
await state.page.keyboard.insertText("YOUR TWEET TEXT HERE")
await state.page.waitForTimeout(1000)
const postBtn = state.page.locator('[data-testid="tweetButtonInline"]')
const pbox = await postBtn.boundingBox()
await state.page.mouse.click(pbox.x + pbox.width/2, pbox.y + pbox.height/2)
console.log("Posted!")
await state.page.waitForTimeout(3000)
EOF
)"
```

## Posting a Thread (Multi-Tweet)

Thread = tweet 1, then reply to tweet 1, then reply to reply, etc.

```bash
TWEET1_URL=""  # will be captured after first tweet

# Step 1: Post first tweet (same as single tweet above)
# After posting, capture URL:
bunx playwriter@latest -s $SESSION -e "$(cat <<'EOF'
await state.page.goto('https://x.com/AIwithJai', { waitUntil: 'domcontentloaded' })
await state.page.waitForTimeout(4000)
const articles = await state.page.locator('article').all()
const tweet1 = articles[1] // skip pinned
const timeLink = await tweet1.locator('time').evaluateHandle(el => el.closest('a')?.href)
state.tweet1Url = await timeLink.evaluate(el => el?.href || el)
console.log("Tweet 1 URL:", state.tweet1Url)
EOF
)"

# Step 2: Wait 45 seconds (rate limiting!)
sleep 45

# Step 3: Navigate to tweet, click reply, type, post
bunx playwriter@latest -s $SESSION -e "$(cat <<'EOF'
await state.page.goto(state.tweet1Url, { waitUntil: 'domcontentloaded' })
await state.page.waitForTimeout(4000)
const replyBtn = state.page.locator('[data-testid="reply"]').first()
const rbox = await replyBtn.boundingBox()
await state.page.mouse.click(rbox.x + rbox.width/2, rbox.y + rbox.height/2)
await state.page.waitForTimeout(2000)
const textarea = state.page.locator('[data-testid="tweetTextarea_0"]').first()
const tbox = await textarea.boundingBox()
await state.page.mouse.click(tbox.x + tbox.width/2, tbox.y + tbox.height/2)
await state.page.waitForTimeout(1000)
await state.page.keyboard.insertText("REPLY TEXT HERE")
await state.page.waitForTimeout(1000)
const postBtn = state.page.locator('[data-testid="tweetButton"]').first()
const pbox = await postBtn.boundingBox()
await state.page.mouse.click(pbox.x + pbox.width/2, pbox.y + pbox.height/2)
console.log("Reply posted!")
await state.page.waitForTimeout(4000)
EOF
)"

# Step 4+: Repeat step 3 for each additional reply
# ALWAYS wait 45 seconds between each tweet
# After each reply, reload the page before clicking reply again
```

## Thread Reply Template (reusable)

For replies 2-N in a thread, after the first reply:

```javascript
// Reload to see updated thread
await state.page.reload({ waitUntil: 'domcontentloaded' })
await state.page.waitForTimeout(3000)

// Click first reply button
const replyBtns = await state.page.locator('[data-testid="reply"]').all()
const rbox = await replyBtns[0].boundingBox()
await state.page.mouse.click(rbox.x + rbox.width/2, rbox.y + rbox.height/2)
await state.page.waitForTimeout(2000)

// Click textarea and type
const textarea = state.page.locator('[data-testid="tweetTextarea_0"]').first()
const tbox = await textarea.boundingBox()
await state.page.mouse.click(tbox.x + tbox.width/2, tbox.y + tbox.height/2)
await state.page.waitForTimeout(1000)
await state.page.keyboard.insertText("TWEET TEXT")
await state.page.waitForTimeout(1000)

// Click Post
const postBtn = state.page.locator('[data-testid="tweetButton"]').first()
const pbox = await postBtn.boundingBox()
await state.page.mouse.click(pbox.x + pbox.width/2, pbox.y + pbox.height/2)
console.log("Posted!")
await state.page.waitForTimeout(4000)
```

## Element Selectors

| Element | Selector | Notes |
|---------|----------|-------|
| Compose textarea | `[data-testid="tweetTextarea_0"]` | Contenteditable div, NOT input |
| Post button (home) | `[data-testid="tweetButtonInline"]` | Inline compose on home page |
| Post button (reply) | `[data-testid="tweetButton"]` | Reply compose dialog |
| Reply button | `[data-testid="reply"]` | On each tweet |
| Side nav Post button | `[data-testid="SideNav_NewTweet_Button"]` | Left sidebar |

## Rate Limiting (CRITICAL)

- **45 seconds minimum** between each tweet in a thread
- Use `sleep 45` between playwriter commands
- Max ~5 tweets per thread per session
- If Post button stays disabled after insertText, reload the page and retry
- X may still flag accounts that post too frequently

## Troubleshooting

| Problem | Cause | Fix |
|---------|-------|-----|
| Post button stays disabled | Draft.js didn't register text | Reload page, refocus textarea, use `keyboard.insertText()` |
| Click on textarea times out | X blocks programmatic clicks | Use `mouse.click()` with `boundingBox()` coordinates |
| Text appears but button disabled | Wrong input method used | Must use `keyboard.insertText()`, not `type()` or `fill()` |
| Page closed error | User closed the tab | Reset session: `playwriter session reset N` |
| "Node is not input" error | X uses contenteditable div | Use `textContent()` not `inputValue()` |
| Reply didn't chain properly | Replied to wrong tweet | Reload page between replies, use first reply button |

## Limitations

- No media upload support yet (images, video)
- No emoji picker interaction
- No poll creation
- No scheduled posts via this method (use typefully for scheduling)
- Newlines in tweets not supported (keyboard.insertText treats \n as space)
- For multi-paragraph tweets, use single paragraph with periods for breaks

## When to Use vs Other Methods

| Method | Use When | Reliability |
|--------|----------|-------------|
| bird CLI | Normal posting, not flagged | High (when not blocked) |
| **playwriter** | bird blocked (226), threads | Medium (Draft.js quirks) |
| typefully | Scheduled posts, reliable API | High (needs API key setup) |

*Last updated: 2026-05-09*
