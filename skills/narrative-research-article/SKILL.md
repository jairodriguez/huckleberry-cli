---
name: narrative-research-article
description: |
  Write Medium-style narrative articles that read like a human wrote them.
  Uses NotebookLM for deep research intelligence, applies a thesis-driven
  7-section narrative architecture (cinematic cold open, bridge, escalation,
  circular close), and chains to the humanizer skill to strip AI cadence.
  Use when: writing a longform narrative article, Medium-style essay,
  research-driven storytelling piece, or any article where the WRITING
  matters as much as the information. Triggers on "narrative article",
  "medium style article", "research essay", "longform piece", "write like
  this article", or when you need to produce article-quality writing from
  NLM research rather than SEO content blocks.
depends-on:
  - nlm-cli
  - humanizer
---

# Narrative Research Article

Writes longform articles with narrative depth using NLM-sourced intelligence and a thesis-driven 7-section architecture. Every paragraph serves one job: prove the thesis.

**Origin:** Extracted from structural analysis of Ricky Lanusse's "The Future of Energy is Buried Under the Sea" (The New Climate, Medium, July 2026). See `references/lanusse-patterns.md` for the full pattern extraction.

---

## Awareness Gate (MANDATORY)

Before any copy work, determine the target audience's awareness level:

1. **Can you determine awareness level from the prompt/context?**
   - For SEO: keyword intent maps to awareness level
     - Informational ("how to fix X") → Problem-aware
     - Comparative ("X vs Y") → Solution-aware
     - Branded ("your product") → Product-aware
     - Transactional ("buy X") → Most-aware
   - For social: content topic + audience → awareness level
   - For email: subscriber stage → awareness level

2. **If YES** → Proceed with awareness-matched strategy
   - Load `references/awareness-level-guide.md`
   - Select copy framework based on awareness level

3. **If NO** → ASK THE USER before proceeding:
   "What awareness level is your target audience at?"
   - Unaware — doesn't know they have a problem
   - Problem-aware — knows the problem, doesn't know solutions exist
   - Solution-aware — knows solutions exist, doesn't know your product
   - Product-aware — knows your product, not convinced it's right
   - Most-aware — ready to buy, just needs the offer

---

## The Problem This Solves

Most AI-generated articles are structured information dumps. They have H2 headers, bullet lists, and a conclusion that says "In conclusion, X is important." They read like SEO content blocks, not writing.

This skill produces articles that read like a skilled human wrote them. The structure is invisible. The voice is direct. The data is embedded in narrative, not listed. Every section escalates a single argument toward a resonant close.

The difference: SEO articles deliver information. Narrative articles deliver an experience that happens to be informative.

---

## Prerequisites

Before starting, gather:
- **Topic** (the subject area)
- **Thesis** (the big idea you are proving) or let the skill discover one from research
- **Business name** (optional, for brand context loading)
- **Reference article URL** (optional, to extract voice patterns from a writer you want to emulate)

---

## Phase -1: Thesis Formation (MANDATORY: Before Any Research)

A narrative article without a thesis is a wandering information dump. The 7-section architecture only works when every section serves a single argument.

### Mode A: Thesis Provided

If the user provides both topic and thesis, lock it in and proceed to Phase 0.

Validate the thesis against these criteria:
- **Single arguable claim**: not "X is important" but "X does Y because Z"
- **Has tension**: there is a paradox, contradiction, or counterintuitive truth at its core
- **Expressible as a turnaround**: "The future of energy is not buried under the sea. It is buried in our willingness to trust each other."

If the thesis is vague ("AI is transforming healthcare"), sharpen it:
- Ask: what is the counterintuitive version? What does everyone get wrong about this?
- Ask: what is the concrete proof? What single example makes this undeniable?
- Ask: what is the deeper layer? (Lanusse: cables to infrastructure to trust)

### Mode B: Thesis Discovery via NLM

If the user provides only a topic, use NLM to surface candidate theses:

```bash
nlm notebook create "Thesis Research: [TOPIC]"
nlm source add <notebook_id> --url "https://en.wikipedia.org/wiki/[TOPIC]"
nlm research start <notebook_id> --query "[TOPIC]" --depth deep --no-wait
nlm research wait --import-all

nlm notebook query <notebook_id> "What are the biggest unresolved tensions, paradoxes, or counterintuitive truths about [TOPIC]? Focus on disagreements between experts, surprising data points that contradict common assumptions, and hidden infrastructure or invisible systems that make everything work but nobody talks about. List 5 specific tensions with brief explanations."
```

From the NLM response, extract 3 candidate theses and present them to the user. Each candidate needs:
- The thesis statement (one sentence)
- Evidence: key data points from NLM
- Tension: the paradox at its core

User picks one. Lock it in. Proceed to Phase 0.

### Thesis Contract

Once locked, the thesis drives every subsequent decision:
- Every NLM query is framed to find thesis-serving evidence
- Every section in the 7-section architecture proves a facet of the thesis
- The cold open scene embodies the thesis in miniature
- The circular close restates the thesis through the opening metaphor, now weighted with everything in between

Write the thesis at the top of your working file. Refer back to it before writing each section.

---

## Phase 0: NLM Source Population

**Goal:** Build a NotebookLM notebook with 30+ high-quality sources on the topic.

### Step 0.1: Create or Locate the Notebook

```bash
# Check if a notebook already exists for this topic
nlm notebook list 2>&1 | python3 -c "
import json, sys
data = json.load(sys.stdin)
for nb in data:
    if 'TOPIC'.lower() in nb.get('title', '').lower():
        print(f'{nb[\"id\"]} | {nb[\"source_count\"]} sources | {nb[\"title\"]}')
"

# If no match, create one
nlm notebook create "Narrative: [TOPIC]"
```

### Step 0.2: Add Sources (Target 30+)

Sources should be thesis-serving. For each source, ask: does this help prove the thesis?

**YouTube videos (10-15):**
```bash
yt-dlp "ytsearch15:[TOPIC]" --get-id --flat-playlist --skip-download > /tmp/yt-ids.txt

while IFS= read -r id; do
  [ -z "$id" ] && continue
  nlm source add <notebook_id> --url "https://youtube.com/watch?v=$id"
  echo "Added: $id"
done < /tmp/yt-ids.txt
```

**Web articles and primary sources (10-15):**
```bash
nlm source add <notebook_id> --url "https://example.com/article"
nlm source add <notebook_id> --file "research.pdf"
```

**Deep research (10+ more):**
```bash
nlm research start <notebook_id> --query "[TOPIC] [THESIS-RELEVANT ANGLE]" --depth deep --no-wait
```

Wait for indexing (30-60 seconds after adding, longer for research mode):
```bash
nlm source list --json 2>&1 | python3 -c "
import json, sys
data = json.load(sys.stdin)
ready = [s for s in data if s.get('status') == 'READY']
print(f'{len(ready)}/{len(data)} sources ready')
"
```

### Step 0.3: Self-Curation (Optional)

```bash
nlm notebook query <notebook_id> "Review all sources for relevance to this thesis: [THESIS]. List any off-topic or redundant sources by title."
```

Delete flagged sources. Final count should be 30+.

---

## Phase 1: Intelligence Extraction

**Goal:** Query NLM to extract thesis-serving intelligence. Each query targets a specific narrative element.

Run these 6 queries. Save each response as JSON. These become the raw material for the 7-section architecture.

### Query 1: Named Concepts (for the Technical Layer)

```bash
nlm notebook query <notebook_id> "What are the key named concepts, mechanisms, or frameworks in [TOPIC] that a general reader could visualize? For each, explain it in one sentence using a concrete analogy or physical metaphor. I need concepts like 'the duck curve' or 'Moore's law': named ideas with visual shapes."
```

### Query 2: Specific Data Points (for the Data Layer)

```bash
nlm notebook query <notebook_id> "List every specific number, statistic, date, and quantitative claim about [TOPIC] from the sources. For each: the raw number, its source (institution name), the year, and what it means in plain language. Format: NUMBER | SOURCE | YEAR | MEANING."
```

### Query 3: Cost-Benefit Comparisons (for the Data Layer)

```bash
nlm notebook query <notebook_id> "What are the strongest cost-benefit or cost-of-inaction comparisons in [TOPIC]? I need asymmetric pairs where the cost of doing something is dwarfed by the cost of not doing it. Include specific dollar figures or scale comparisons."
```

### Query 4: Historical Precedents (for the Cold Open)

```bash
nlm notebook query <notebook_id> "What historical events, eras, or precedents relate to [TOPIC] that would make a vivid opening scene? I need specific moments with sensory details: what did it look, sound, feel like to be there? Think Roman roads, Apollo missions, transatlantic cables: moments where infrastructure or invisible systems changed everything."
```

### Query 5: Human Conflict and Politics (for the Geopolitical Layer)

```bash
nlm notebook query <notebook_id> "Who benefits from the current state of [TOPIC]? Who is threatened? What are the political conflicts, power struggles, or geopolitical tensions? Include named countries, companies, or individuals and what they stand to gain or lose."
```

### Query 6: The Deeper Truth (for the Elevation and Close)

```bash
nlm notebook query <notebook_id> "What is the deepest truth about [TOPIC] that most people miss? If you had to state the thesis of this entire field in one sentence, what would it be? What paradox lies at the heart of [TOPIC] that nobody talks about?"
```

### Intelligence Map

| Query Output | Narrative Element | Section It Serves |
|---|---|---|
| Named concepts | Mechanisms with visual shapes | Section 4: Technical Layer |
| Data points | Numbers with named sources | Section 5: Data Layer |
| Cost-benefit pairs | Asymmetric comparisons | Section 5: Data Layer |
| Historical precedents | Vivid scenes | Section 1: Cold Open + Section 7: Close |
| Human conflict | Stakes and power dynamics | Section 6: Geopolitical Layer |
| Deeper truth | Thesis synthesis | Section 6: Elevation + Section 7: Close |

---

## Phase 2: Article Generation (7-Section Architecture)

**Goal:** Write the article using the thesis-driven structure.

Read `references/lanusse-patterns.md` before writing. It contains the full pattern extraction with examples.

### Voice Rules (Apply Throughout: Non-Negotiable)

1. **Two-sentence rhythm.** Most paragraphs: sentence 1 sets context, sentence 2 delivers the turn. Vary with one-sentence "hammer" paragraphs for emphasis.

2. **No hedging.** "The math is not close." Not "the math seems to suggest." Commit to your claims.

3. **Concrete before abstract.** Every principle gets grounded in a tangible detail first. Never state a rule without showing the thing it applies to.

4. **Named sources only.** Never write "studies show" or "experts say." Always: institution name + year + number. "The California ISO documented this in 2013."

5. **Standalone hammer sentences.** Use 3-5 word standalone paragraphs for emphasis: "Nobody cares." "The cable is the thing." "The math is not close."

6. **No section headers in the body.** Sections are separated by horizontal rules (`---`). No "## The Problem" or "## Key Findings." The content carries the structure. The reader should never feel they are reading a list.

7. **Emotional micro-bursts.** In analytical sections, insert brief human beats. Not sentimentality. A moment of connection that prevents whitepaper feel. "It is heavy in the way that makes you think of your 6-year-old back home."

8. **Recurring motifs.** Pick 1-2 key phrases that echo across sections. "The thing." "The road." "The cable." These build cumulative emphasis.

9. **One rhetorical question maximum.** Use it at the 70% mark as a section pivot. Never as opener or closer.

10. **No bullet lists in the article body.** This is prose, not a briefing. If you need to enumerate, use flowing sentences with semicolons and commas.

### The 7 Sections

Write each section in order. After completing each, verify it serves the thesis.

#### Section 1: Cinematic Cold Open (100-150 words)

Drop the reader INTO a scene. No thesis, no definition, no context. Sensory details: what does it look, sound, feel, smell like?

**Source material:** Historical precedents from Query 4.

**Rules:**
- Use second person ("you") to place the reader inside the scene
- Include at least 3 sensory details (sound, touch, smell, weight, temperature)
- End on a detail that creates tension or curiosity
- Do NOT explain what this has to do with the topic yet

#### Section 2: The Bridge (1 paragraph)

Pivot from the scene to the topic. One paragraph. State the thesis explicitly as a paradox or lesson.

**Formula:** "This is the [paradox/lesson/truth] at the heart of [TOPIC]: [THESIS]."

**Rules:**
- Exactly one paragraph
- The transition should feel inevitable, not forced
- State the thesis directly

#### Section 3: The Concrete Example (200-400 words)

Name the specific thing the article is about. What is it? Where is it? What does it do?

**Rules:**
- Start with the most basic description possible
- Build from "it does not look like much" to "it represents something extraordinary"
- Include at least one "the thing you cannot see" detail (invisible infrastructure)
- End with a standalone declarative that names the core insight

#### Section 4: The Technical Layer (300-500 words)

Explain the underlying mechanism. Use a named concept. Make it visual.

**Source material:** Named concepts from Query 1.

**Rules:**
- Introduce the named concept with its common name
- Explain WHY it is named that (the visual shape, the counterintuitive result)
- Use the Specificity Stack: raw number, comparison, emotional grounding
- End with: "The only thing that does not work is the [politics/economics/human nature]."

#### Section 5: The Data Layer (300-500 words)

Numbers with named sources. Cost-benefit comparisons. Let asymmetry speak.

**Source material:** Data from Query 2 + cost-benefit from Query 3.

**Rules:**
- Every number gets the Specificity Stack: NUMBER, COMPARISON, GROUNDING
- Pair every cost with the cost of inaction
- Follow the asymmetry with a one-sentence hammer
- Include geographic or scale comparisons
- Name every institution and date

#### Section 6: The Geopolitical / Human Layer (300-500 words)

Who benefits? Who is threatened? What is the conflict? Then zoom out to the deeper truth.

**Source material:** Conflict from Query 5 + deeper truth from Query 6.

**Rules:**
- Name specific countries, companies, or individuals
- Describe the power dynamics, not just the facts
- Include at least one threat or vulnerability (sabotage, fragility, conflict)
- Transition from geopolitics to the deeper theme
- State the thesis's deepest layer here
- Use the rhetorical question pivot if you have not already

#### Section 7: The Circular Close (150-250 words)

Return to the opening metaphor. But now it carries the weight of everything explained.

**Source material:** Deeper truth from Query 6, restated through the opening scene.

**Rules:**
- Echo the opening imagery explicitly
- Restate the thesis through the metaphor, not directly
- The metaphor should feel ENRICHED by everything in between
- End with 2-3 standalone hammer sentences
- Final line should be the motif phrase, now carrying full meaning

### Section Assembly

After writing all 7 sections:
1. Join them with `---` dividers between sections
2. Read the full article start to finish
3. Check the circular frame: does the close genuinely echo the open?
4. Check the motif: does the recurring phrase appear at least 3 times across sections?
5. Verify thesis service: can you point to how each section proves the thesis?
6. Check for AI cadence: any uniform paragraph lengths? Any "furthermore" or "moreover"? Fix them.

---

## Phase 3: Humanizer Pass (MANDATORY: Final Step)

Load the `humanizer` skill and pass the complete draft through it. This is non-negotiable. The 7-section architecture produces structural patterns that can still read as AI-generated if the sentence-level cadence is off.

### How to Chain

1. Save the draft to a file: `/tmp/nra-draft-[slug].md`
2. Load the humanizer skill: use the `skill` tool with name `humanizer`
3. Pass the draft text to the humanizer process
4. The humanizer will identify AI tells, rewrite preserving all information and structure, vary sentence rhythm, and remove hedging and filler
5. Review the humanized output against the voice rules above

### Voice Calibration

If a reference article URL was provided, use it as the voice calibration sample for the humanizer. The humanizer will match sentence length patterns, word choice level, and paragraph habits from the reference. This ensures the output sounds like the writer you are emulating.

### Post-Humanizer Checklist

After humanizing, verify:
- No em dashes remain (replace with periods, commas, colons, or parentheses)
- No AI vocabulary: "delve," "crucial," "tapestry," "vibrant," "underscore," "landscape" (abstract)
- No "studies show" or "experts say" (all sources named)
- Sentence lengths vary (short punchy plus longer flowing)
- The 7-section structure is intact (humanizer should not collapse sections)
- The thesis is still clearly argued
- The circular frame still works
- No bullet lists appeared (humanizer should not add them)

If the humanizer broke the structure or weakened the thesis, re-run Phase 2 for the affected sections and humanize again.

---

## Output

Save the final article as:
- Markdown: `/tmp/nra-final-[slug].md`
- If brand context loaded: also save to `businesses/[BUSINESS]/content/drafts/[slug].md`

Present to the user with: word count, thesis (restated), sources used count, whether humanizer pass completed.

---

## Brand Context Loading (Optional)

If a business name is provided, load brand context before Phase 2:

Use the `load-business-context` MCP tool with the business name, or read the business `evergreen.md` directly.

Extract from brand files:
- **Brand voice descriptors**: tone, vocabulary level, formality
- **ICP**: who is the reader (affects cold open scene choice and technical depth)
- **CTA path**: where the article points (if applicable)
- **Content rules**: DO/DON'T lists from evergreen.md

Apply brand voice to the Phase 2 writing. The narrative architecture stays the same. Only the voice and ICP targeting change.

If no brand is provided, write in the default Lanusse voice: direct, declarative, unsentimental, no hedging.

---

## Reference Article Analysis (Optional)

If the user provides a reference article URL to emulate its style:

1. Fetch the article using `webfetch` or `ctx_fetch_and_index`
2. Extract structural patterns using the same analysis framework in `references/lanusse-patterns.md`
3. Use the extracted patterns INSTEAD of the default Lanusse patterns for Phase 2
4. Use the article text as the voice calibration sample for Phase 3

This allows emulating any writer's style, not just Lanusse's.

---

## Troubleshooting

**NLM query returns generic answers:** Make the query more specific. Instead of "What are the key concepts?", ask "What named mechanisms can a general reader visualize? Give me analogies with physical shapes."

**Cold open does not connect to the topic:** The connection does not need to be obvious in the cold open. The Bridge paragraph (Section 2) makes the connection explicit. Trust the reader to hold the tension.

**Article reads like an essay, not a narrative:** You are probably explaining instead of showing. Rewrite key paragraphs as scenes. Use sensory details. Replace "the system was complex" with a concrete moment that demonstrates complexity.

**Humanizer flattened the voice:** The humanizer removed personality along with AI tells. Re-run Phase 2 for affected sections, then humanize with a voice calibration sample provided.

**Sections feel disconnected:** Check the motif. Pick a recurring phrase and thread it through all 7 sections. Also verify each section's last sentence creates tension that pulls into the next section.

**Thesis got lost in the middle sections:** Before writing Sections 3-5, write the thesis at the top of your working file. After each section, ask: "How did this section prove the thesis?" If it did not, cut or rewrite.

---

## Related Skills

- `nlm-cli`: NLM CLI for source population and querying
- `humanizer`: Post-generation AI-tell removal (chained in Phase 3)
- `deep-serp-article`: Alternative for SEO-focused pillar articles (more structured, less narrative)
- `article-generator`: Router skill for general article generation
- `seo-content`: Alternative for keyword-driven SEO articles
