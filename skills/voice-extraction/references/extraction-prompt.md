# Voice DNA Extraction Prompt

The master analysis prompt. This is the core IP of the skill.
Feed it a corpus of someone's writing and it produces a structured voice-dna.md.

---

## How to Use

1. Collect writing samples into a single corpus (see collect-sources.sh)
2. Paste the corpus below where indicated
3. Run the full prompt through any model with sufficient context (GLM-5.1 200K+, Gemini Flash 1M+, Qwen 1M+)
4. The output IS the voice-dna.md — save it directly

For corpora larger than the context window: split into sections, run extraction on each, then run a synthesis pass combining all section analyses into one voice-dna.md.

---

## The Prompt

```
You are a voice DNA analyst. Your job is to reverse-engineer a person's writing voice from their actual writing and produce a structured voice profile that lets any writer or AI replicate that voice accurately.

Below is a corpus of writing by the author. Analyze it deeply and produce a Voice DNA document following the exact format specified.

=== CORPUS START ===
[CORPUS_GOES_HERE]
=== CORPUS END ===

Analyze the corpus and extract the following. Be SPECIFIC and CONCRETE — quote actual sentences from the corpus as evidence. Generic abstractions like "confident tone" or "professional voice" are useless. If you can't find an example in the text, don't claim it.

## 1. VOICE SIGNATURES (3-5 patterns)

The 3-5 patterns that, if removed, would make the writing sound like someone else entirely. These are the fingerprints.

For each signature:
- Name it (e.g., "Fragment Punches", "Contrast Collisions")
- Describe the mechanical pattern (what the sentence does)
- Give 2-3 verbatim examples from the corpus
- Explain WHY it works (what effect it creates)

## 2. SENTENCE ARCHITECTURE

How this author builds sentences. Extract the actual patterns:

- **Preferred lengths**: What's their default sentence length? When do they go short? When long?
- **Opening moves**: How do they start sentences/paragraphs? (Quote 5 examples)
- **Closing moves**: How do they end? Where does the punch land? (Quote 5 examples)
- **Fragment usage**: Do they use incomplete sentences? How often and why? (Quote examples)
- **List patterns**: Do they list? How? (Comma-separated, line breaks, numbered?)
- **Transitions**: How do they connect ideas? Or do they just jump?

## 3. VOCABULARY MAP

- **Signature terms**: Words/phrases the author coined or uses idiosyncratically (with definitions and example usage)
- **Reach-for words**: Words this author gravitates toward that most people wouldn't (quote with context)
- **Banned words**: Words the author would NEVER use (infer from what they use instead)
- **Profanity gauge**: None / occasional / frequent / signature. If used, how and why?
- **Jargon gauge**: Do they use technical terms? Do they explain them or assume knowledge?

## 4. RHETORICAL DEVICES

Identify which devices this author actually uses (with examples):
- Contrast / juxtaposition
- Repetition / anaphora
- Rhetorical questions
- Direct address ("you")
- Metaphor / analogy
- Hyperbole
- Understatement
- Lists / enumeration
- Rule of three
- Callback / callback humor

Score each device: FREQUENT / OCCASIONAL / RARE / NEVER

## 5. EMOTIONAL PATTERNS

- **How they express conviction**: Do they state beliefs flatly? Argue? Show through story?
- **How they express frustration**: Direct accusation? Dry humor? Philosophical resignation?
- **How they express excitement**: Exclamation points? Pace change? Just... more words?
- **How they connect with the reader**: Peer-to-peer? Authority figure? Friend? Provocateur?
- **Vulnerability level**: Do they share personal details? How deep? What do they hold back?

## 6. DO / DON'T PAIRS

Create 5-8 before/after pairs showing what this author WOULD write vs what they WOULD NOT write. This is the most important section for AI replication.

Format:
> DON'T (generic version): "[generic sentence any AI would write]"
> DO (this author's version): "[how this author would say the same thing]"
> WHY: [1 sentence explaining the difference]

Base these on actual patterns observed in the corpus, not guesses.

## 7. THEMATIC ANCHORS

What subjects, experiences, and references does the author draw from repeatedly?
- Core life contexts (location, occupation, family, projects)
- Recurring metaphors or comparisons
- Philosophical stance (in 2-3 sentences, with supporting quotes)
- What they care about most (ranked, with evidence)

## 8. PLATFORM ADAPTATIONS

How does (or would) this author's voice change across platforms? For each:
- What stays constant (the voice core)
- What adapts (length, format, energy)
- Example opening line for: Twitter/X, LinkedIn, Blog intro, Newsletter opening

## 9. VALIDATION CRITERIA

A checklist for scoring whether content matches this voice:
- MUST HAVE (at least 2): [voice signatures that must be present]
- SHOULD HAVE (at least 1): [secondary patterns]
- KILL FLAGS (any of these = fail): [patterns that would immediately reveal it's NOT this author]

Output the complete Voice DNA document now. Use markdown formatting with clear headers.
```

---

## Synthesis Prompt (for multi-chunk corpora)

When the corpus is too large for one pass, extract from each chunk separately, then synthesize:

```
Below are voice analyses extracted from different sections of one author's writing corpus.
Synthesize them into a single unified Voice DNA document. Resolve any contradictions by
going with the most frequently observed pattern. Merge duplicate findings. Produce the
final document in the standard Voice DNA format.

=== SECTION ANALYSES ===
[PASTE EACH SECTION'S ANALYSIS HERE]
=== END SECTION ANALYSES ===
```

---

## Quick Extraction Prompt (for smaller corpora or time-constrained runs)

```
Analyze the writing voice in this corpus and extract:
1. 5 signature patterns (with examples from the text)
2. Vocabulary the author reaches for + words they avoid
3. 5 DO/DON'T sentence pairs showing their voice vs generic writing
4. Their default sentence rhythm and structure
5. What makes this voice unmistakably theirs (not anyone else's)

=== CORPUS ===
[CORPUS]
=== END ===

Be concrete. Quote the text. Generic descriptors like "confident" or "professional" are banned — show the actual words.
```
