---
name: self-improving-agent
description: "Autonomous expertise building: when an agent lacks knowledge on a topic, research it deeply via YouTube + NotebookLM deep research with source curation, generate a mindmap, ask expert questions, and persist mastery to Inkstone. USE WHEN: about to say 'I don't know' on a technical/business topic, user says 'become an expert on X' / 'master X' / 'research X deeply', confidence gap detected, unfamiliar domain encountered, need grounded answers on a new subject."
---

# Skill: self-improving-agent

# Self-Improving Agent System

An autonomous learning system that detects expertise gaps, conducts deep research via YouTube + NotebookLM, generates mindmaps, formulates intelligent questions, and persists learned expertise to Inkstone for future agent sessions.

## Core Philosophy

**Every agent becomes a master at any topic it encounters** — no more "I don't know" or generic responses. When an agent hits a knowledge boundary, it:

1. **Detects the gap** — recognizes when it lacks genuine expertise
2. **Researches deeply** — pulls from YouTube + curated NLM sources
3. **Synthesizes intelligence** — generates mindmaps, extracts patterns
4. **Questions intelligently** — formulates expert-level NLM queries
5. **Persists permanently** — saves to Inkstone with full traceability
6. **Reuses instantly** — future sessions recall the mastered knowledge

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    EXPERTISE GAP DETECTED                    │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│  YOUTUBE RESEARCH (youtube-summarize + agent-reach)         │
│  • Find top 10-20 videos on topic                           │
│  • Extract transcripts, key points, expert interviews       │
│  • Identify thought leaders, contrarian views               │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│  NLM CURATED RESEARCH (notebooklm + nlm-cli)                │
│  • Create/load topic-specific notebook                      │
│  • Add YouTube sources + web articles + PDFs                │
│  • Generate mindmap (hub & spoke structure)                 │
│  • Run cross-notebook synthesis                             │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│  INTELLIGENT QUESTION FORMULATION                           │
│  • Gap-analysis questions (what's missing?)                 │
│  • Contrarian questions (what do experts disagree on?)      │
│  • Application questions (how to implement?)                │
│  • Future-projection questions (where is this going?)       │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│  INKSTONE PERSISTENCE (inkstone-admin)                      │
│  • Save mindmap as structured memory                        │
│  • Save expert Q&A pairs                                    │
│  • Save contrarian viewpoints                               │
│  • Save implementation patterns                             │
│  • Link to agent expertise registry                         │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│  AGENT EXPERTISE REGISTRY                                   │
│  • Topic → Agent mastery mapping                            │
│  • Confidence scores per topic                              │
│  • Last researched timestamp                                │
│  • Source traceability                                      │
└─────────────────────────────────────────────────────────────┘
```

## When to Trigger

**AUTOMATIC TRIGGERS (agent detects internally):**
- Query topic not in agent's Inkstone expertise namespace
- Confidence score < 0.7 for topic in expertise registry
- User asks "how do I..." or "what's the best way to..." on unfamiliar topic
- Agent would otherwise say "I don't know" or give generic answer

**MANUAL TRIGGERS (user invocation):**
- `/self-improving-agent research <topic>`
- `/self-improving-agent master <topic>`
- Explicit request: "become an expert on X"

## Core Commands

### 1. Research & Master a Topic

```bash
# Full research pipeline
self-improving-agent master "topic name" [--agent=clawd] [--depth=deep]

# Quick research (existing sources only)
self-improving-agent research "topic name" [--sources=existing]

# Check current expertise level
self-improving-agent status "topic name"
```

### 2. Query Agent Expertise

```bash
# What does this agent know?
self-improving-agent expertise [--agent=clawd] [--topic="*"]

# Find best agent for topic
self-improving-agent find-expert "topic name"
```

### 3. Manage Knowledge

```bash
# Refresh outdated knowledge
self-improving-agent refresh "topic name" [--force]

# List all mastered topics
self-improving-agent topics [--agent=clawd]

# Export knowledge for sharing
self-improving-agent export "topic name" --format=markdown
```

## Implementation Details

### Phase 1: Expertise Gap Detection

```python
# Check Inkstone for existing expertise
namespace = f"/business/aiwithjai/agents/{agent_name}/expertise/{topic_slug}"
existing = inkstone_search(query=topic, namespace=namespace)

# Check expertise registry
registry_key = f"{agent_name}:{topic_slug}"
confidence = get_expertise_confidence(registry_key)

if not existing or confidence < 0.7:
    trigger_research_pipeline(topic, agent_name)
```

### Phase 2: YouTube Deep Research

```bash
# Find top videos (using agent-reach or youtube-search)
agent-reach search "topic" --platform youtube --limit 20

# For each video: extract insights
youtube-summarize "URL" --mode key_points --json
youtube-summarize "URL" --mode transcript
youtube-summarize "URL" --mode ideas
```

### Phase 3: NLM Curation (with source pruning)

NLM deep research finds related web pages + documents automatically, but pulls irrelevant stuff. Two-stage curation fixes this:

**Stage 1 — Import-time (`--cited-only`):** research completes → only sources NLM actually cited in its research summary get imported. Built-in first filter.

**Stage 2 — Post-import scoring (`scripts/nlm_curation.py`):** every imported source scored on:
- **Domain reputation** — authoritative domains (arxiv, official docs, github) up; aggregators (pinterest, quora, tiktok) down
- **Topic-token overlap** — keyword match between topic and source title
- **Spam patterns** — listicle/SEO titles ("Top 10...", "you won't believe...") penalized
- **Floor protection** — never prunes below 5 sources; rescues best scorers if needed

Sources below threshold (default 0.35) are deleted. Every run writes an auditable report to `memory/curation-reports/`.

```bash
# Score + report only (dry-run, default)
python3 scripts/nlm_curation.py curate --topic "vector databases" --notebook <id>

# Score + actually delete below-threshold sources
python3 scripts/nlm_curation.py curate --topic "vector databases" --notebook <id> --execute

# Full: deep research → cited-only import → post-import pruning
python3 scripts/nlm_curation.py research --topic "vector databases" --notebook <id> --mode deep --execute
```

Then:
```bash
# Add our own chosen sources (YouTube provenance: we picked them)
notebooklm source add "https://youtube.com/..." -n <notebook_id> --json

# Generate mindmap from the CURATED source set (note-backed, sync)
notebooklm generate mind-map --kind note-backed -n <notebook_id> --json

# Grounded queries against the curated notebook
notebooklm ask "question" -n <notebook_id> --json
```

### Phase 4: Intelligent Question Formulation

**Question Templates by Category:**

| Category | Template | Purpose |
|----------|----------|---------|
| **Foundational** | "What are the first principles of {topic}?" | Build ground-up understanding |
| **Expert Patterns** | "What do the top 1% of practitioners do differently in {topic}?" | Extract elite practices |
| **Contrarian** | "What common wisdom about {topic} is wrong? What's the evidence?" | Find edge cases |
| **Implementation** | "Walk me through a production implementation of {topic} with error handling" | Practical application |
| **Failure Modes** | "What are the most common ways {topic} fails in production?" | Risk mitigation |
| **Evolution** | "How has {topic} changed in the last 12 months? What's next?" | Future-proofing |
| **Integration** | "How does {topic} integrate with {our_stack}? Show real code." | Contextual application |
| **Metrics** | "What are the key metrics to measure success in {topic}?" | Evaluation framework |

### Phase 5: Inkstone Persistence

```python
# Save mindmap structure
inkstone_write(
    text=mindmap_markdown,
    namespace=f"/business/aiwithjai/agents/{agent}/expertise/{topic}",
    knowledgeType="procedural",
    tags=["mindmap", "mastery", topic],
    confidence=0.95,
    source=f"self-improving-agent:master:{topic}:{timestamp}"
)

# Save each Q&A pair
for q, a in qa_pairs:
    inkstone_write(
        text=f"Q: {q}\n\nA: {a}",
        namespace=f"/business/aiwithjai/agents/{agent}/expertise/{topic}/qa",
        knowledgeType="factual",
        tags=["qa", "expert-answer", topic],
        confidence=0.9,
        source=f"self-improving-agent:qa:{topic}:{timestamp}"
    )

# Update expertise registry
update_expertise_registry(agent, topic, confidence=0.95, notebook_id=notebook_id)
```

### Phase 6: Expertise Registry

**Storage:** `memory/agent-expertise-registry.json`

```json
{
  "clawd": {
    "google-ads": {
      "confidence": 0.95,
      "last_researched": "2026-09-12",
      "notebook_id": "abc-123",
      "topics_mastered": ["campaign structure", "keyword research", "conversion tracking"],
      "source_count": 47
    },
    "remotion": {
      "confidence": 0.88,
      "last_researched": "2026-08-20",
      "notebook_id": "def-456",
      "topics_mastered": ["animation patterns", "rendering optimization", "audio sync"],
      "source_count": 32
    }
  }
}
```

## Integration with Existing Skills

### Required Skills (auto-loaded)
- `notebooklm` — canonical NLM operations
- `nlm-cli` — batch, cross-notebook, pipeline commands
- `youtube-summarize` — video content extraction
- `inkstone-admin` — advanced memory operations
- `agent-reach` — YouTube search (free transcripts alternative)

### Complementary Skills
- `nlm-hub-spoke` — hub/spoke article generation from mindmaps
- `nlm-grounded-writer` — mega-prompt writing with brand context
- `self-improve` — outcome journaling for learning loop
- `routine-capture` — turn successful research runs into skills

## Usage Examples

### Example 1: Agent encounters unknown topic

```
User: "How do I set up a high-frequency trading bot with Rust?"
Agent (internal): No expertise in HFT + Rust. Triggering self-improving-agent...
→ Researches: YouTube (QuantConnect, TradeBot, Quantopian videos)
→ Curates: NLM notebook with 15 sources
→ Mindmap: Architecture, risk management, latency optimization, Rust crates
→ Questions: "What's the minimum viable latency for crypto HFT in Rust?"
→ Persists: Full mastery to Inkstone
→ Answers: Comprehensive technical response with code patterns
```

### Example 2: Proactive mastery building

```
User: "/self-improving-agent master 'AI agent memory systems'"
→ Creates comprehensive expertise in:
  - Vector databases (Pinecone, Weaviate, Qdrant)
  - Embedding strategies (OpenAI, Cohere, local)
  - Retrieval patterns (RAG, GraphRAG, HyDE)
  - Context window optimization
  - Long-term vs working memory architectures
→ Saves to all agent namespaces for cross-agent reuse
```

### Example 3: Cross-agent expertise sharing

```
Agent A masters "WebRTC for real-time collaboration"
→ Saved to /business/aiwithjai/agents/A/expertise/webrtc
→ Registry updated: Agent A confidence 0.94

Agent B needs WebRTC knowledge
→ Checks registry → finds Agent A mastery
→ Loads Agent A's Inkstone namespace
→ Instantly has expert-level knowledge without re-research
```

## Configuration

### Environment Variables

```bash
# Required
GEMINI_API_KEY=xxx                    # For youtube-summarize
NOTEBOLLM_COOKIES_PATH=~/.notebooklm  # For notebooklm auth

# Optional
SELF_IMPROVING_AGENT_DEPTH=deep       # quick|standard|deep
SELF_IMPROVING_AGENT_MAX_VIDEOS=20
SELF_IMPROVING_AGENT_MAX_SOURCES=50
SELF_IMPROVING_AGENT_CONFIDENCE_THRESHOLD=0.7
```

### Inkstone Namespaces

Per-agent expertise stored at:
```
/business/aiwithjai/agents/{agent_name}/expertise/{topic_slug}/
├── mindmap/          # Structured mindmap
├── qa/               # Expert Q&A pairs
├── sources/          # Source metadata
├── patterns/         # Implementation patterns
├── contrarian/       # Contrarian viewpoints
└── metrics/          # Evaluation frameworks
```

Global registry at:
```
/system/agent-expertise-registry/
```

## Verification & Quality Gates

### Research Quality Checks

```bash
# Minimum sources
- YouTube: ≥ 5 videos from distinct channels
- Web: ≥ 10 articles from authoritative domains
- PDF/Papers: ≥ 3 technical papers/reports

# Mindmap quality
- Depth ≥ 3 levels
- ≥ 20 nodes at leaf level
- Cross-references between branches

# Question quality
- ≥ 15 intelligent questions formulated
- Coverage across all 8 question categories
- Each question answered with ≥ 300 words
```

### Persistence Verification

```bash
# After save, verify retrieval
inkstone_search(query="topic", namespace="agent/expertise/topic")
# Must return: mindmap + ≥ 10 Q&A pairs + sources

# Registry consistency
# Agent expertise confidence must match saved content quality
```

## Error Handling & Fallbacks

| Failure Point | Fallback |
|---------------|----------|
| YouTube blocked | Use agent-reach free transcripts |
| NLM auth expired | Use local Inkstone + Gemini File Search |
| Mindmap generation fails | Build manual mindmap from Q&A |
| Inkstone write fails | Queue for retry, save to local JSON |
| Registry corrupted | Rebuild from Inkstone namespaces |

## Monitoring & Analytics

Track in `memory/self-improving-agent.log`:
- Topics researched per agent per week
- Average confidence improvement (pre/post research)
- Reuse rate (how often saved expertise is recalled)
- Time saved vs manual research
- User satisfaction with expert answers

## Quick Start

```bash
# 1. Install dependencies
pip install notebooklm-py[browser]  # if not already
npm install -g @anthropic/claude-code  # for agent integration

# 2. Verify auth
~/clawdbot/clawd/scripts/nlm_auth_preflight.sh
nlm login --check

# 3. Test the pipeline
self-improving-agent master "test topic" --depth=quick

# 4. Verify expertise saved
self-improving-agent status "test topic"
self-improving-agent expertise --agent=clawd
```

## Advanced: Batch Mastery

```bash
# Master multiple related topics
self-improving-agent batch-master \
  "Rust async patterns" \
  "Tokio runtime internals" \
  "Async-graphQL in Rust" \
  --shared-notebook="Rust Async Mastery"

# This creates ONE notebook with all topics,
# cross-linked mindmap, shared Q&A context
```

---

**Remember:** The goal is not just to answer the current question — it's to permanently upgrade the agent's intelligence so every future session benefits from this research. The knowledge compounds across all agents, all sessions, all time.