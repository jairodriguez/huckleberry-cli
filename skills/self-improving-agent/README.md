# Self-Improving Agent Skill

An autonomous learning system that detects expertise gaps, conducts deep research via YouTube + NotebookLM, generates mindmaps, formulates intelligent questions, and persists learned expertise to Inkstone for future agent sessions.

## Overview

This skill transforms any agent into a self-improving expert. When an agent encounters a topic it doesn't know well, it automatically:

1. **Detects the expertise gap** — recognizes when it lacks genuine expertise
2. **Researches deeply** — pulls from YouTube + curated NLM sources  
3. **Synthesizes intelligence** — generates mindmaps, extracts patterns
4. **Questions intelligently** — formulates 15+ expert-level NLM queries
5. **Persists permanently** — saves to Inkstone with full traceability
6. **Reuses instantly** — future sessions recall the mastered knowledge

## Quick Start

```bash
# Check if agent has expertise on a topic
self-improving-agent check "Google Ads conversion tracking"

# Full mastery pipeline (research + persist)
self-improving-agent master "Rust async patterns" --depth=deep

# Quick research scan
self-improving-agent research "WebRTC" --depth=quick

# Show all mastered topics for an agent
self-improving-agent expertise --agent=clawd

# Find the best agent for a topic
self-improving-agent find-expert "vector databases"
```

## Commands

| Command | Description |
|---------|-------------|
| `check <topic>` | Check if agent has expertise on topic |
| `research <topic>` | Quick research scan (existing sources only) |
| `master <topic>` | Full mastery pipeline — research + persist to Inkstone |
| `status [topic]` | Show expertise status for topic or all topics |
| `expertise` | List all mastered topics for agent |
| `find-expert <topic>` | Find best agent for topic across all agents |

## Options

| Option | Description | Default |
|--------|-------------|---------|
| `--agent <name>` | Agent name | `clawd` |
| `--depth <level>` | Research depth: quick\|standard\|deep | `deep` |
| `--format <type>` | Output format: json\|markdown | `json` |

## Architecture

```
User Query → Expertise Gap Detection → YouTube Research → NLM Curation → 
Mindmap Generation → Intelligent Questions → Inkstone Persistence → 
Expertise Registry Update → Expert Answer
```

### Phase 1: Expertise Gap Detection
- Checks agent's Inkstone namespace for existing knowledge
- Queries expertise registry for confidence scores
- Triggers research if confidence < 0.7

### Phase 2: YouTube Deep Research
- Searches YouTube for top 10-20 videos on topic
- Extracts transcripts, key points, expert interviews
- Identifies thought leaders and contrarian views

### Phase 3: NLM Curation (with source pruning)
- Deep research finds related web pages + documents automatically — **but pulls irrelevant stuff**, so curation runs at two stages:
- **Import-time:** `--cited-only` — only sources NLM cited in its research summary get imported
- **Post-import:** every source scored (domain reputation + topic-title overlap + spam patterns), below-threshold sources deleted, floor of 5 sources protected
- Auditable curation reports in `memory/curation-reports/`
- Generates mindmap from the **curated** source set

### Phase 4: Intelligent Question Formulation
Generates 15+ questions across 8 categories:
- **Foundational** — First principles
- **Expert Patterns** — Top 1% practices
- **Contrarian** — Common wisdom that's wrong
- **Implementation** — Production code walkthroughs
- **Failure Modes** — Common production failures
- **Evolution** — Recent changes and future trends
- **Integration** — Real integration with our stack
- **Metrics** — Success measurement frameworks

### Phase 5: Inkstone Persistence
Saves to agent-specific namespaces:
```
/business/aiwithjai/agents/{agent}/expertise/{topic}/
├── mindmap/          # Structured mindmap
├── qa/               # Expert Q&A pairs (15+)
├── sources/          # Source metadata & bibliography
├── patterns/         # Implementation patterns
├── contrarian/       # Contrarian viewpoints
└── metrics/          # Evaluation frameworks
```

### Phase 6: Expertise Registry
Global registry at `memory/agent-expertise-registry.json` tracks:
- Per-agent topic mastery with confidence scores
- Cross-agent expertise discovery
- Source counts and notebook references
- Last researched timestamps

## Auto-Detection Integration

Agents can automatically detect expertise gaps in user queries:

```python
from scripts.auto_detect import AutoExpertiseDetector

detector = AutoExpertiseDetector("clawd", auto_research=True)
analysis = detector.analyze_query("How do I set up a vector database for RAG?")
# Returns: topics detected, gaps found, recommendations

# Or auto-trigger research
result = detector.auto_research_if_needed(user_query)
```

## Integration with Existing Skills

### Required Skills (auto-loaded)
- `notebooklm` — canonical NLM operations
- `nlm-cli` — batch, cross-notebook, pipeline commands
- `youtube-summarize` — video content extraction
- `inkstone-admin` — advanced memory operations
- `agent-reach` — YouTube search (free transcripts)

### Complementary Skills
- `nlm-hub-spoke` — hub/spoke articles from mindmaps
- `nlm-grounded-writer` — mega-prompt writing with brand context
- `self-improve` — outcome journaling for learning loop
- `routine-capture` — turn successful runs into skills

## Configuration

### Environment Variables
```bash
GEMINI_API_KEY=xxx                    # For youtube-summarize
NOTEBOLLM_COOKIES_PATH=~/.notebooklm  # For notebooklm auth
SELF_IMPROVING_AGENT_DEPTH=deep       # quick|standard|deep
SELF_IMPROVING_AGENT_MAX_VIDEOS=20
SELF_IMPROVING_AGENT_MAX_SOURCES=50
SELF_IMPROVING_AGENT_CONFIDENCE_THRESHOLD=0.7
```

## Example Usage

### Agent Encounters Unknown Topic
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

### Proactive Mastery Building
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

### Cross-Agent Expertise Sharing
```
Agent A masters "WebRTC for real-time collaboration"
→ Saved to /business/aiwithjai/agents/A/expertise/webrtc
→ Registry updated: Agent A confidence 0.94

Agent B needs WebRTC knowledge
→ Checks registry → finds Agent A mastery
→ Loads Agent A's Inkstone namespace
→ Instantly has expert-level knowledge without re-research
```

## Quality Gates

### Research Quality Checks
- **YouTube**: ≥ 5 videos from distinct channels
- **Web**: ≥ 10 articles from authoritative domains
- **PDF/Papers**: ≥ 3 technical papers/reports
- **Mindmap**: Depth ≥ 3 levels, ≥ 20 leaf nodes
- **Questions**: ≥ 15 questions covering all 8 categories
- **Answers**: Each ≥ 300 words with citations

### Persistence Verification
```bash
# After save, verify retrieval
inkstone_search(query="topic", namespace="agent/expertise/topic")
# Must return: mindmap + ≥ 10 Q&A pairs + sources
```

## Monitoring

Track in `memory/self-improving-agent.log`:
- Topics researched per agent per week
- Average confidence improvement (pre/post research)
- Reuse rate (how often saved expertise is recalled)
- Time saved vs manual research
- User satisfaction with expert answers

## Files Structure

```
.claude/skills/self-improving-agent/
├── SKILL.md                      # This documentation
├── scripts/
│   ├── __init__.py               # Package exports
│   ├── self_improving_agent.py   # Core pipeline implementation
│   ├── self-improving-agent      # CLI wrapper (executable)
│   ├── nlm_curation.py           # Deep research + source scoring/pruning
│   ├── auto_detect.py            # Auto-detection integration
│   ├── init_expertise_registry.py # Registry initialization
│   ├── test_self_improving.py    # Test suite
│   └── test_curation_scorer.py   # Curation scorer unit test
```

## Testing

```bash
# Run full test suite
cd scripts && python3 test_self_improving.py

# Test individual components
python3 -c "from auto_detect import AutoExpertiseDetector; d=AutoExpertiseDetector('clawd'); print(d.analyze_query('How to optimize PostgreSQL?'))"
```

## License

MIT — Part of the OpenClaw skill ecosystem.