---
name: firecrawl
description: "Web scraping, search, crawling, and browser automation via the Firecrawl CLI. Use this skill whenever the user wants to search the web, find..."
allowed-tools:
  - Bash(firecrawl *)
  - Bash(npx firecrawl *)
---

# Firecrawl CLI

Web scraping, search, and browser automation CLI. Returns clean markdown optimized for LLM context windows.

Run `firecrawl --help` or `firecrawl <command> --help` for full option details.

## Prerequisites

Must be installed and authenticated. Check with `firecrawl --status`.

```
  🔥 firecrawl cli v1.8.0

  ● Authenticated via FIRECRAWL_API_KEY
  Concurrency: 0/100 jobs (parallel scrape limit)
  Credits: 500,000 remaining
```

- **Concurrency**: Max parallel jobs. Run parallel operations up to this limit.
- **Credits**: Remaining API credits. Each scrape/crawl consumes credits.

If not ready, see [rules/install.md](rules/install.md). For output handling guidelines, see [rules/security.md](rules/security.md).

```bash
firecrawl search "query" --scrape --limit 3
```

## Agent-Reach Integration

**Agent-Reach** (skill: `agent-reach`) provides free, zero-API-key alternatives for specific platforms. Use Agent-Reach when:

| Need | Use Agent-Reach Instead | Command |
|------|------------------------|---------|
| Read any web page | Jina Reader (free, no key) | `curl -s "https://r.jina.ai/URL"` |
| YouTube video content | yt-dlp transcripts | `yt-dlp --write-sub --skip-download "URL"` |
| Bilibili video search | bili-cli (no login) | `bili search "query" --type video -n 5` |
| GitHub repo search | gh CLI | `gh search repos "query" --limit 10` |
| V2EX discussions | Public API | `curl "https://www.v2ex.com/api/topics/hot.json"` |
| RSS/Atom feeds | feedparser | Built into agent-reach |
| Semantic web search | Exa via mcporter (free) | `mcporter call 'exa.web_search_exa(query: "...", numResults: 5)'` |

**Rule**: Check `agent-reach doctor --json` first. If the platform shows `ok`, use Agent-Reach commands (free, no credits). Fall back to Firecrawl only when Agent-Reach cannot handle the URL (e.g., complex JS interactions, auth-walled pages, bulk crawling).

## Workflow

Follow this escalation pattern:

1. **Agent-Reach check** - Run `agent-reach doctor --json` to see if platform is supported
2. **Search** - No specific URL yet. Find pages, answer questions, discover sources.
3. **Scrape** - Have a URL. Extract its content directly.
4. **Map + Scrape** - Large site or need a specific subpage. Use `map --search` to find the right URL, then scrape it.
5. **Crawl** - Need bulk content from an entire site section (e.g., all /docs/).
6. **Browser** - Scrape failed because content is behind interaction (pagination, modals, form submissions, multi-step navigation).

| Need                        | Command    | When                                                      |
| --------------------------- | ---------- | --------------------------------------------------------- |
| Find pages on a topic       | `search`   | No specific URL yet                                       |
| Get a page's content        | `scrape`   | Have a URL, page is static or JS-rendered                 |
| Find URLs within a site     | `map`      | Need to locate a specific subpage                         |
| Bulk extract a site section | `crawl`    | Need many pages (e.g., all /docs/)                        |
| AI-powered data extraction  | `agent`    | Need structured data from complex sites                   |
| Interact with a page        | `browser`  | Content requires clicks, form fills, pagination, or login |
| Download a site to files    | `download` | Save an entire site as local files                        |

For detailed command reference, use the individual skill for each command (e.g., `firecrawl-search`, `firecrawl-browser`) or run `firecrawl <command> --help`.

**Scrape vs browser:**

- Use `scrape` first. It handles static pages and JS-rendered SPAs.
- Use `browser` when you need to interact with a page, such as clicking buttons, filling out forms, navigating through a complex site, infinite scroll, or when scrape fails to grab all the content you need.
- Never use browser for web searches - use `search` instead.

**Avoid redundant fetches:**

- `search --scrape` already fetches full page content. Don't re-scrape those URLs.
- Check `.firecrawl/` for existing data before fetching again.

## When NOT to use firecrawl

Firecrawl is the default for *public, text-based web content*. Route elsewhere when the source is auth-walled, audio/video, or when you already have the text and just need it shorter:

| Situation | Use instead | Why |
| --- | --- | --- |
| X / Twitter post, thread, article, or `/bookmarks` | `mktg-x` skill | Twitter serves a degraded logged-out page to unauthenticated clients. `mktg-x` uses stored `MKTG_X_AUTH_TOKEN` to fetch the real content. Firecrawl will return a stub. |
| YouTube / podcast / TikTok / any audio or video URL | `mktg transcribe <url>` | Firecrawl returns the page chrome (title, description), not the spoken content. `mktg transcribe` runs the yt-dlp → ffmpeg → whisper.cpp pipeline and returns the full transcript. |
| Fetched page is too long to ideate on | Chain into `summarize` after the firecrawl call | Firecrawl is the *fetcher*, summarize is the *compressor*. `firecrawl scrape <url> -o page.md && cat page.md \| summarize --tldr` is the canonical pattern — don't re-fetch or ask firecrawl to summarize. |

Escalation rule of thumb: *if a human would need to log in, press play, or skim-and-condense to get value from the source, firecrawl alone is the wrong tool.*

## Output & Organization

Unless the user specifies to return in context, write results to `.firecrawl/` with `-o`. Add `.firecrawl/` to `.gitignore`. Always quote URLs - shell interprets `?` and `&` as special characters.

```bash
firecrawl search "react hooks" -o .firecrawl/search-react-hooks.json --json
firecrawl scrape "<url>" -o .firecrawl/page.md
```

Naming conventions:

```
.firecrawl/search-{query}.json
.firecrawl/search-{query}-scraped.json
.firecrawl/{site}-{path}.md
```

Never read entire output files at once. Use `grep`, `head`, or incremental reads:

```bash
wc -l .firecrawl/file.md && head -50 .firecrawl/file.md
grep -n "keyword" .firecrawl/file.md
```

Single format outputs raw content. Multiple formats (e.g., `--format markdown,links`) output JSON.

## Working with Results

These patterns are useful when working with file-based output (`-o` flag) for complex tasks:

```bash
# Extract URLs from search
jq -r '.data.web[].url' .firecrawl/search.json

# Get titles and URLs
jq -r '.data.web[] | "\(.title): \(.url)"' .firecrawl/search.json
```

## Parallelization

Run independent operations in parallel. Check `firecrawl --status` for concurrency limit:

```bash
firecrawl scrape "<url-1>" -o .firecrawl/1.md &
firecrawl scrape "<url-2>" -o .firecrawl/2.md &
firecrawl scrape "<url-3>" -o .firecrawl/3.md &
wait
```

For browser, launch separate sessions for independent tasks and operate them in parallel via `--session <id>`.

## Credit Usage

```bash
firecrawl credit-usage
firecrawl credit-usage --json --pretty -o .firecrawl/credits.json
```
