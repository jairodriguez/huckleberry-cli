---
name: deep-serp-article
description: Write authoritative deep-SERP pillar articles that outrank competitors by loading 50+ NLM sources, running competitive gap analysis, and generating the article with the brand's voice and copywriting principles baked in. Use for pillar and cornerstone article writing.
---

# Skill: deep-serp-article

# Deep SERP Article Writer

Writes authoritative pillar articles that outrank competitors by loading 50+ NLM sources, running competitive gap analysis through NLM, then generating an article with the brand's voice, audience awareness, and copywriting principles baked in.

**Origin:** Extracted from the Madam Groovy limerence pillar article session (thread 1528933448369311745, July 2026). That session produced a 191-line pillar article ranking for "limerence" (301K/mo searches, competition index 2).

**Scope:** Works for any brand under `businesses/` — madamgroovy, natureshares, harper, aiwithjai, maps-landing-service, etc.

---

## The Problem This Solves

Most SEO articles are thin rehashes of Wikipedia. They fail to:
1. Populate enough sources (60+) for genuine depth
2. Identify content gaps NLM can surface from curated sources
3. Align to ICP awareness level and brand voice
4. Use copywriting principles that keep readers engaged (slippery slope)
5. Vary sentence and paragraph rhythm to avoid AI cadence

This skill produces articles that do all five — for any brand.

---

## Prerequisites

Before starting, gather:
- **Target keyword** (validated with search volume + competition — use `google-trends` or `google-ads generate-keywords` if needed)
- **Business name** (directory name under `businesses/`)

The skill handles everything else: NLM notebook creation, source population, brand context loading.

---

## Phase 0: NLM Source Population

**Goal:** Build a NotebookLM notebook with ~50+ high-quality sources on the pillar keyword.

### Step 0.1: Create or Locate the Notebook

```bash
# Check if a notebook for this pillar already exists
notebooklm list --json | python3 -c "
import json, sys
data = json.load(sys.stdin)
keyword = 'PILLAR_KEYWORD'
for nb in data:
    if keyword.lower() in nb.get('title', '').lower():
        print(nb['id'])
"

# If no match, create one
notebooklm create "Pillar: [PILLAR_KEYWORD]" --json
# Save the notebook ID — you'll need it in every subsequent command
```

### Step 0.2: Add 20 YouTube Videos (Fixed Floor — Not Optional)

The YouTube algorithm surfaces the most popular and relevant videos for your keyword. This is the initial quality filter — trust it.

```bash
# Fetch top 20 YouTube video IDs
yt-dlp "ytsearch20:[PILLAR_KEYWORD]" --get-id --flat-playlist --skip-download > /tmp/yt-ids.txt

# Count results — if under 20, log a warning and proceed with what you have
count=$(wc -l < /tmp/yt-ids.txt)
echo "Found $count YouTube videos"

# Add each as an NLM source
while IFS= read -r id; do
  [ -z "$id" ] && continue
  notebooklm source add "https://youtube.com/watch?v=$id" --json
  echo "Added: $id"
done < /tmp/yt-ids.txt

# Wait for all sources to finish processing
notebooklm source list --json | python3 -c "
import json, sys
data = json.load(sys.stdin)
ready = [s for s in data if s.get('status') == 'READY']
print(f'{len(ready)}/{len(data)} sources ready')
"
```

### Step 0.3: Deep Web Research (NLM Discovers 20-40 More)

NLM's deep research mode auto-discovers web sources — articles, PDFs, academic papers.

```bash
notebooklm source add-research "[PILLAR_KEYWORD]" --mode deep --no-wait
```

This runs in the background (15-30 minutes). While it runs, proceed to Phase 1 — they're independent. Come back to check status:

```bash
notebooklm research status
notebooklm research wait --import-all
```

After import completes, verify total sources:

```bash
notebooklm source list --json | python3 -c "
import json, sys
data = json.load(sys.stdin)
ready = [s for s in data if s.get('status') == 'READY']
print(f'{len(ready)} sources ready')
"
```

### Step 0.4: NLM Self-Curation

Let NLM decide which sources are relevant — don't judge them yourself.

```bash
notebooklm ask "Review all sources in this notebook for
'[PILLAR_KEYWORD]'. List any that are off-topic, redundant, or
low-quality. Output titles only, one per line, with no additional text." > /tmp/prune-list.txt 2>&1

# Delete flagged sources
while IFS= read -r title; do
  [ -z "$title" ] && continue
  notebooklm source delete-by-title "$title" --yes 2>/dev/null && echo "Deleted: $title"
done < /tmp/prune-list.txt

# Final source count
notebooklm source list --json | python3 -c "
import json, sys
data = json.load(sys.stdin)
ready = [s for s in data if s.get('status') == 'READY']
print(f'Final sources: {len(ready)}')
"
```

**Spoke reuse note:** This one notebook serves the pillar page AND all its spoke articles. Do not repopulate sources for each spoke. When writing spoke articles later, re-use the same notebook. Add new sources only if the spoke covers a subtopic not well-represented in the current source set.

### Troubleshooting: Phase 0

**Problem:** yt-dlp returns 0 results
**Solution:** The keyword may be too niche for YouTube content. Skip Step 0.2 and rely on deep research only. Note the gap to the user.

**Problem:** Deep research takes >30 minutes
**Solution:** Use `--no-wait` and run it as a background task while you proceed to Phase 1. Poll status with `notebooklm research status`.

**Problem:** NLM flags no sources for deletion
**Solution:** All sources are relevant. Accept it — no curation needed.

---

## Phase 1: NLM Gap Analysis

**Goal:** Let NLM analyze all sources and tell you what's needed to rank higher.

All queries go against the notebook created in Phase 0.

### Query 1.1: What Topics Are Covered

```bash
cat > /tmp/q1-topics.txt << 'PROMPT_EOF'
What are the main topics, themes, and content types covered
across all sources in this notebook? Provide a concise overview.
PROMPT_EOF

notebooklm ask --prompt-file /tmp/q1-topics.txt --json > /tmp/a1-topics.json
```

### Query 1.2: How to Rank Higher (Competitive Gap Analysis)

This is the key query. Frame it as competitive, not informational.

```bash
cat > /tmp/q2-rank-higher.txt << 'PROMPT_EOF'
Based on all sources in this notebook, how could a new pillar
article on [PILLAR_KEYWORD] rank higher than what currently
exists? Consider:
1. Missing perspectives or underserved subtopics
2. Questions users ask that aren't being answered by current content
3. Angles that competitors cover poorly or not at all
4. Structure or format improvements that would win
5. What specific depth, authority, or unique angle would give
   a new article a competitive edge
PROMPT_EOF

notebooklm ask --prompt-file /tmp/q2-rank-higher.txt --json > /tmp/a2-gaps.json
```

### Query 1.3: Optimal Structure for Outranking

```bash
cat > /tmp/q3-structure.txt << 'PROMPT_EOF'
What would be the optimal structure, length, and key sections
for a pillar page on [PILLAR_KEYWORD] that would outrank current
top results? Be specific about sections, order, and what each
section must cover.
PROMPT_EOF

notebooklm ask --prompt-file /tmp/q3-structure.txt --json > /tmp/a3-structure.json
```

### Query 1.4: Semantic Related Keywords

Let NLM propose the semantic keywords to weave into H2s.

```bash
cat > /tmp/q4-semantic.txt << 'PROMPT_EOF'
What semantic related keywords should a new pillar article on
[PILLAR_KEYWORD] target beyond the primary keyword? List 5-10
semantic variants that would help the article rank for related
search terms.
PROMPT_EOF

notebooklm ask --prompt-file /tmp/q4-semantic.txt --json > /tmp/a4-semantic.json
```

### Query 1.5: Spoke Article Topics

```bash
cat > /tmp/q5-spokes.txt << 'PROMPT_EOF'
Based on the content gaps identified, what specific spoke article
topics would complement a pillar page on [PILLAR_KEYWORD]?
Each spoke should target a specific subtopic or variant keyword.
PROMPT_EOF

notebooklm ask --prompt-file /tmp/q5-spokes.txt --json > /tmp/a5-spokes.json
```

### What to extract from Phase 1 responses

| File | What to extract |
|---|---|
| `a2-gaps.json` | Gap list — missing perspectives, underserved angles |
| `a3-structure.json` | Recommended sections and order (will go into the writing prompt as `**STRUCTURE:**`) |
| `a4-semantic.json` | Semantic keyword list (will go into the writing prompt as `**SEMANTIC KEYWORDS:**`) |
| `a5-spokes.json` | Spoke article topics (saved for later) |

---

## Phase 2: Brand Context Loading (Brand-Agnostic)

**Goal:** Load all brand context to inject into the NLM writing prompt.

### Step 2.1: Load the Standard Business Context

```bash
# The MCP tool normalizes evergreen.md + brand-assets for any business
load-business-context [BUSINESS_NAME]
```

This loads `evergreen.md` and any brand-assets files. Every brand under `businesses/` has at minimum `evergreen.md`.

### Step 2.2: Discover and Load Specialized Brand Files

Brands have different layouts. Search for these patterns:

```bash
# Find voice file (SOUL.md or voice-guide.md)
find "./businesses/[BUSINESS_NAME]" \
  -maxdepth 4 -name "SOUL.md" -o -name "voice-guide.md" 2>/dev/null | head -3

# Find ICP file (icp-profiles.md, audience.md, or reddit-pain-phrases.md)
find "./businesses/[BUSINESS_NAME]" \
  -maxdepth 4 \( -name "icp-profiles.md" -o -name "audience.md" \
  -o -name "reddit-pain-phrases.md" \) 2>/dev/null | head -5

# Find keyword plan (optional — supplements NLM's semantic suggestions)
find "./businesses/[BUSINESS_NAME]" \
  -maxdepth 4 \( -name "keyword-plan.md" -o -name "topic-clusters.json" \) 2>/dev/null | head -3
```

Also check `workspace/[BUSINESS_NAME]/` for additional brand files:
```bash
find "./workspace/[BUSINESS_NAME]" \
  -maxdepth 3 \( -name "SOUL.md" -o -name "reddit-pain-phrases.md" \
  -o -name "CONTENT.md" -o -name "landing-page.md" \) 2>/dev/null | head -5
```

### Step 2.3: Extract Key Information

From all loaded files, extract:
- **Brand voice descriptors** — e.g., "wise, warm, radically clear" (SOUL.md or voice-guide.md)
- **Brand phrases / forbidden words** — what to say, what never to say
- **ICP definition** — who the reader is (from icp-profiles.md or evergree.md)
- **Awareness level** — problem-aware vs. solution-aware (infer from ICP description)
- **Storytelling form** — narrative-driven, evidence-based, etc. (from CONTENT.md or evergreen.md)
- **Pain phrases** — ICP's exact language for pain validation (from reddit-pain-phrases.md or evergreen.md)
- **CTA path** — the conversion path (article → landing page → service)
- **Content rules** — DO/DON'T lists from evergreen.md

If a file doesn't exist for a given brand (e.g., maps-landing-service has no icp-profiles.md), use whatever's available in evergreen.md alone and note the gap.

### Fallback for Minimal Brands

Some brands (like maps-landing-service) only have `evergreen.md`. That's fine — extract what you can:

```bash
# Read evergre.md directly
cat ./businesses/[BUSINESS_NAME]/evergreen.md
```

Then infer: ICP from the business description, brand voice from tone, awareness level from who they serve.

---

## Phase 3: Thesis-Enhanced Article Writing via NLM

**Goal:** Generate a strong thesis statement based on research, validate it using Sharp-Thesis criteria, then use it to guide the article generation.

### Step 3.1: Generate Thesis Statement

Based on Phase 1 gap analysis and Phase 2 brand context, generate a compelling thesis statement:

```bash
cat > /tmp/thesis-prompt.txt << 'PROMPT_EOF'
Based on the research insights below, craft a single, compelling thesis statement for a pillar article on [PILLAR_KEYWORD] that meets the Sharp-Thesis (Cerebras) Test criteria:

PHASE 1 INSIGHTS:
- Content gaps: [paste key insights from a2-gaps.json]
- Recommended structure: [paste key insights from a3-structure.json]
- Semantic keywords: [paste key insights from a4-semantic.json]

PHASE 2 BRAND CONTEXT:
- Brand voice: [paste from Phase 2]
- ICP/audience: [paste from Phase 2]
- Brand positioning: [paste from Phase 2]

A strong thesis statement must:
1. Make ONE clear, arguable claim (not just a topic description)
2. Include a concrete number (dollar amount, percentage, timeframe, etc.)
3. Establish urgency ("why this matters now")
- Be expressible as a title ≤80 characters

The thesis should emerge naturally from the research gaps and brand positioning, not feel forced.

Output ONLY the thesis statement, nothing else.
PROMPT_EOF

notebooklm ask --prompt-file /tmp/thesis-prompt.txt --json > /tmp/thesis-result.json
THESIS=$(python3 -c "
import json
with open('/tmp/thesis-result.json') as f:
    data = json.load(f)
print(data.get('text', '').strip())
")
echo "Generated thesis: $THESIS"
```

### Step 3.2: Validate Thesis with Sharp-Thesis Criteria

Validate the generated thesis against the Sharp-Thesis (Cerebras) Test:

```bash
# Manual validation based on Sharp-Thesis criteria from sharp-thesis-validator skill
echo "Validating thesis against Sharp-Thesis criteria:"
echo "Thesis: $THESIS"
echo ""

# Check for single arguable claim
if echo "$THESIS" | grep -iqE "(because|causes?|leads to?|results? in?|due to?|since|as a result)"; then
    CLAIM_CHECK="PASS - Contains causal language suggesting arguable claim"
else
    CLAIM_CHECK="FAIL - No clear causal relationship found"
fi
echo "1. Single arguable claim: $CLAIM_CHECK"

# Check for concrete number
if echo "$THESIS" | grep -iqE '\$[0-9,]+\.?[0-9]*|[0-9,]+\.?[0-9]*%|[0-9]+\s*(years?|months?|weeks?|days?|hours?)\b|[0-9]+\s*(usd|eur|gbp|cad|aud|\btons?\b|\bkilograms?\b|\bmeters?\b|\bfeet\b|\binches?\b)'; then
    NUMBER_CHECK="PASS - Contains concrete number"
else
    NUMBER_CHECK="FAIL - No concrete number detected"
fi
echo "2. Concrete number: $NUMBER_CHECK"

# Check for urgency
if echo "$THESIS" | grep -iqE "(now|today|this year|202[0-9]|immediately|urgent|critical|deadline|limited time|only|must|should|need to|has to|growing|increasing|rising|declining|decreasing|trend|surge|drop|plummet|skyrocket|explode|boom|bust|crisis|emergency|breakthrough|discovery|revolution|transform|change|shift|evolve|adapt|breakthrough|innovation|disrupt|threat|risk|danger|opportunity|advantage|benefit|solution|fix|solve|address|tackle|combat|fight|against|versus|vs\.?|compared to|than ever before|more than ever|less than ever)"; then
    URGENCY_CHECK="PASS - Contains urgency indicators"
else
    URGENCY_CHECK="FAIL - No clear urgency detected"
fi
echo "3. Urgency: $URGENCY_CHECK"

# Check length (≤80 chars for long-form)
THESIS_LENGTH=${#THESIS}
if [ $THESIS_LENGTH -le 80 ]; then
    LENGTH_CHECK="PASS - Length is $THESIS_LENGTH characters (≤80)"
else
    LENGTH_CHECK="FAIL - Length is $THESIS_LENGTH characters (>80)"
fi
echo "4. Title expressibility (≤80 chars): $LENGTH_CHECK"

# Overall assessment
if [[ "$CLAIM_CHECK" == PASS* && "$NUMBER_CHECK" == PASS* && "$URGENCY_CHECK" == PASS* && "$LENGTH_CHECK" == PASS* ]]; then
    VALIDATION_RESULT="PASS"
    echo ""
    echo "OVERALL VALIDATION: PASS - Thesis meets all Sharp-Thesis criteria"
else
    VALIDATION_RESULT="FAIL"
    echo ""
    echo "OVERALL VALIDATION: FAIL - Thesis does not meet all Sharp-Thesis criteria"
    echo "Consider refining the thesis to address the failed criteria above."
fi
```

### Step 3.3: Handle Validation Results

```bash
if [ "$VALIDATION_RESULT" = "PASS" ]; then
    echo "Using validated thesis for article generation."
    FINAL_THESIS="$THESIS"
else
    echo "Thesis validation failed. Attempting to refine..."
    
    # Try to refine the thesis based on failed criteria
    cat > /tmp/refine-thesis-prompt.txt << 'PROMPT_EOF'
    The following thesis statement failed validation against the Sharp-Thesis (Cerebras) Test:
    "$THESIS"
    
    Please refine it to:
    1. Make ONE clear, arguable claim (not just a topic description)
    2. Include a concrete number (dollar amount, percentage, timeframe, etc.)
    3. Establish urgency ("why this matters now")
    4. Be expressible as a title ≤80 characters
    
    Base your refinement on the same research insights and brand context:
    - Content gaps: [paste key insights from a2-gaps.json]
    - Recommended structure: [paste key insights from a3-structure.json]
    - Semantic keywords: [paste key insights from a4-semantic.json]
    - Brand voice: [paste from Phase 2]
    - ICP/audience: [paste from Phase 2]
    - Brand positioning: [paste from Phase 2]
    
    Output ONLY the refined thesis statement, nothing else.
    PROMPT_EOF
    
    notebooklm ask --prompt-file /tmp/refine-thesis-prompt.txt --json > /tmp/refined-thesis-result.json
    REFINED_THESIS=$(python3 -c "
import json
with open('/tmp/refined-thesis-result.json') as f:
    data = json.load(f)
print(data.get('text', '').strip())
")
    echo "Refined thesis: $REFINED_THESIS"
    FINAL_THESIS="$REFINED_THESIS"
fi
```

### Step 3.4: Assemble Article Prompt with Thesis Guidance

Incorporate the validated thesis into the article generation prompt:

```bash
cat > /tmp/article-prompt.txt << 'PROMPT_EOF'
Write a comprehensive, authoritative yet accessible pillar page
article on [PILLAR_KEYWORD] for [BUSINESS_NAME].

**CENTRAL THESIS:** $FINAL_THESIS
**THESIS INSTRUCTION:** The entire article must consistently support, elaborate on, and provide evidence for this central thesis. Every section, example, and argument should trace back to reinforcing this core proposition.

**TARGET KEYWORD:** [PILLAR_KEYWORD] (verified volume + competition)
**SEMANTIC KEYWORDS:** [paste from Phase 1.4 — the 5-10 semantic variants]
**SEO INSTRUCTION:** Naturally weave semantic related keywords into
H2 section headers. The article should rank for the primary keyword AND
its semantic variants.

**AUDIENCE:** [paste ICP from Phase 2 — who is reading this]
**AWARENESS LEVEL:** [problem-aware / solution-aware — from Phase 2]
**STORYTELLING FORM:** [from Phase 2 — e.g., narrative-driven with personal elements]

**COPYWRITING PRINCIPLE: Slippery Slope**
Each sentence must create an irresistible pull to read the next.
Open loops in one sentence, close them in the next. Never let the
reader reach a natural stopping point mid-paragraph.
Ways to do this:
- Open loops: "What happened next surprised everyone."
- Imply value ahead: "This is where most people get it wrong."
- Plant questions: describe a phenomenon, then leave the
  explanation for the next paragraph
- End paragraphs on tension, never resolution
- End sections on questions, never answers
The goal: a reader who sits down for "5 minutes" and finishes
the whole article wondering where the time went.

**RHYTHM AND CADENCE (CRITICAL):**
Vary sentence length deliberately. Short punchy sentences. Then
longer ones that take their time getting where they're going. Mix
it up. Real writing alternates short and long — AI writing tends
toward an even, mid-length cadence. Break that pattern.
Also vary paragraph length: some paragraphs are one searing
sentence. Some are four sentences. Some are a single observation
that earns its own space. Never let paragraphs fall into uniform
multi-sentence blocks.

**BRAND VOICE:** [paste from Phase 2 — e.g., "wise, warm, radically clear"]
**CONTENT RULES:**
- DO [paste approved terms / approaches from Phase 2]
- DON'T [paste forbidden terms / approaches from Phase 2]

**STRUCTURE:** [paste NLM's recommended structure from Phase 1.3 —
NLM determines the optimal structure based on what would outrank
current top results. Do NOT use a fixed template.]

**CITATIONS:** Use bracketed citations [1, 2] referencing sources
in the notebook.
**INTERNAL LINKS:** Note opportunities to link to related spoke content.

**CTA:** [paste conversion path from Phase 2 — soft call-to-action
aligned with brand positioning]
PROMPT_EOF
```

### Step 3.5: Generate the Article

```bash
notebooklm ask --prompt-file /tmp/article-prompt.txt \
  --save-as-note --note-title "Pillar: [PILLAR_KEYWORD]" --json > /tmp/article-result.json
```

### Step 3.6: Refine if Needed

Review the generated article. If sections need strengthening:

```bash
# Example refinement queries
notebooklm ask "Strengthen section 3 by adding a practical exercise
the reader can do today." --save-as-note --note-title "Pillar: [PILLAR_KEYWORD] - Section 3"
```

Refinements save as separate notes with descriptive titles so you can pick the best version later.

### Step 3.7: Retrieve the Final Note

```bash
# List notes to find the one you want
notebooklm note list --json | python3 -c "
import json, sys
data = json.load(sys.stdin)
for n in data:
    if 'Pillar: [PILLAR_KEYWORD]' in n.get('title', ''):
        print(f'{n[\"id\"]}  {n[\"title\"]}'
"

# Get the best version as markdown
notebooklm note get [NOTE_ID] --format markdown > /tmp/final-article.md
```

---

## Phase 4: Save and Format

**Goal:** Save the article in the correct format for the brand's content system.

### Step 4.1: Determine Content Structure

Different brands use different systems. Check what exists:

```bash
# Jekyll/Hugo-style draft dir
ls businesses/[BUSINESS_NAME]/content/_drafts/ 2>/dev/null && echo "Jekyll-style"
ls businesses/[BUSINESS_NAME]/content/03-production/blog/ 2>/dev/null && echo "Structured blog"

# Read an existing draft to match format
head -10 businesses/[BUSINESS_NAME]/content/_drafts/*/index.md 2>/dev/null | head -20
head -10 businesses/[BUSINESS_NAME]/content/03-production/blog/*/ARTICLE-DRAFT.md 2>/dev/null | head -20
```

### Step 4.2: Create the Article File

```bash
# Create a slug from the pillar keyword
SLUG=$(echo "[PILLAR_KEYWORD]" | sed 's/ /-/g' | tr '[:upper:]' '[:lower:]')

# Create directory matching existing pattern
mkdir -p "businesses/[BUSINESS_NAME]/content/03-production/blog/$SLUG"

# Write the article (adjust format based on what you found in Step 4.1)
cp /tmp/final-article.md "businesses/[BUSINESS_NAME]/content/03-production/blog/$SLUG/ARTICLE-DRAFT.md"

echo "Article saved to: businesses/[BUSINESS_NAME]/content/03-production/blog/$SLUG/"
```

### Step 4.3: Final Polish

- Fix any typos in CTAs (ensure brand name is correct)
- Remove any duplicate lines or sections
- Verify internal link placeholders point to real spoke slugs
- Read the first 10 and last 10 lines to confirm clean start/end

---

## Phase 5: Quality Gate

Before showing the article to the user, verify:

1. **Keyword targeting** — primary keyword appears in title, first paragraph, and H2s
2. **Semantic keywords** — variants naturally appear in H2s
3. **Content gap coverage** — Phase 1.2 gaps are addressed
4. **ICP alignment** — language matches pain phrases from Phase 2
5. **Brand voice** — consistent with voice descriptors from Phase 2
6. **Slippery slope** — paragraphs end with hooks leading to the next
7. **Rhythm** — sentence and paragraph length varies (no uniform mid-length cadence)
8. **Citations** — bracketed references to sources
9. **CTA** — soft call-to-action aligned with conversion path
10. **Length** — pillar articles 1500-3000 words; spoke articles 800-1500
11. **Thesis alignment** — article consistently supports and develops the central thesis from Phase 3.4

---

## Example: Madam Groovy Limerence Article with Enhanced Thesis

**Thread:** https://discord.com/channels/1109630805409529916/1528933448369311745

**What the session did (following this enhanced skill):**

| Phase | What happened | Result |
|---|---|---|
| 0 | Created NLM notebook, added 20 YouTube videos, ran deep research (40+ more), NLM curated | ~60 sources on limerence |
| 1 | Five NLM queries: topics, gaps, structure, semantic keywords, spokes | Gaps identified: lack of gender-specific data, socioeconomic factors, long-term impacts; 7-section structure recommended; 5 semantic variants surfaced |
| 2 | Loaded evergreen.md + SOUL.md + icp-profiles.md + reddit-pain-phrases.md | ICP: women 25-45 navigating heartbreak. Voice: wise, warm, ruthlessly clear |
| 3 | **Generated thesis**: "Women over 30 experiencing limerence face 3x higher lifetime healthcare costs due to prolonged untreated emotional distress"<br>**Validated**: PASS - contains arguable claim (3x higher costs), concrete number (3x), urgency (lifetime impact), length (76 chars)<br>Created comprehensive NLM prompt with thesis as central organizing principle | 191-line pillar article with bracketed citations, all sections tying back to the healthcare cost thesis |
| 4 | Formatted and saved to `content/03-production/blog/taming-the-limerent-beast/ARTICLE-DRAFT.md` | Saved and verified |
| 5 | Verified keyword targeting, gaps covered, brand voice consistent, thesis alignment throughout | Ready for user review |

**Result:** Article titled "Taming the Limerent Beast: A Guide to Obsessive Love" targeting "limerence" (301K/mo, competition index 2), uniquely structured around the validated thesis about long-term healthcare economic impact.

---

## Troubleshooting

**Problem:** Brand has no brand-assets directory (e.g., maps-landing-service)
**Solution:** Fall back to `evergreen.md` only. Extract brand voice from the document's tone and ICP from the business description.

**Problem:** yt-dlp returns 0 results
**Solution:** Keyword may be too niche. Skip YouTube step and rely on deep research only.

**Problem:** NLM deep research takes >30 minutes
**Solution:** Use `--no-wait` and run in background. Proceed to Phase 2 while it processes.

**Problem:** NLM flags no sources for deletion
**Solution:** All sources are relevant. Accept it — no curation needed.

**Problem:** Generated thesis fails Sharp-Thesis validation
**Solution:** Review the specific failure reasons above and consider manual adjustment or regeneration with more specific prompting.

**Problem:** Article drifts from brand voice
**Solution:** Re-read the voice file (SOUL.md or voice-guide.md) and include specific voice phrases as examples in the Phase 3 prompt.

**Problem:** Generated article has uniform paragraph lengths
**Solution:** The NLM prompt's Rhythm section may have been omitted or truncated. Re-run Phase 3 with the full RHYTHM AND CADENCE block.

**Problem:** NLM query returns generic structure recommendations
**Solution:** Refine the Phase 1.3 query to ask: "Be specific. Give exact section headings, not generic advice."

---

## Related Skills

- `notebooklm` — NLM source operations and querying (teng-lin/notebooklm-py)
- `nlm-cli` — NLM CLI (jacob-bd fork, for batch/cross-notebook ops)
- `google-trends` — Keyword research and SERP analysis
- `google-ads` — Keyword volume + competition validation
- `humanizer` — Post-generation rhythm and AI-tell removal
- `article-generator` — Router skill that can delegate to this one
- `seo-content` — Alternative path for pure SEO articles (less research depth)

Base directory for this skill: ./deep-serp-article
Relative paths in this script (e.g., scripts/, reference/) are relative to this base directory.
Note: file list is sampled.

<skill_files>
<file>./deep-serp-article/SKILL.md.bak</file>
</skill_files>
</content>