---
name: voice-brand-alignment
description: Validate content for brand voice consistency and ICP alignment. Detects AI slop and voice drift.
---
name: voice-brand-alignment
description: Validate content for brand voice consistency and ICP alignment using Gemini CLI delegation. Detects AI slop patterns and voice drift.
---

# Voice & Brand Alignment Validation

## Overview

Validates content for brand voice consistency and ICP alignment using **Gemini CLI delegation** for token optimization. Loads AI slop patterns (200+), brand voice guidelines, and ICP language rules in Gemini's context (not Claude's), returning only structured warnings.

**Token Savings**: 12k tokens loaded → 500 tokens returned (95% reduction)

## When to Use This Skill

Use this skill when:
1. **Voice validation needed**: Check content against brand voice patterns
2. **AI slop detection**: Identify AI-generated patterns that need refinement
3. **ICP alignment**: Verify language matches target audience sophistication
4. **Pre-publication check**: Final validation before publishing content
5. **Multi-platform content**: Validate blog, newsletter, social media posts

## Usage

### Direct Script Execution (Recommended)

```bash
node scripts/validation/gemini-voice-validator.js <contentPath> <brand> [checks]
```

**Parameters**:
- `contentPath` - Path to content file to validate
- `brand` - Brand name (ai.withjai, enchantents, xelite-one)
- `checks` - Comma-separated: ai-slop,voice-patterns,icp-alignment (default: all)

**Examples**:
```bash
# Full validation
node scripts/validation/gemini-voice-validator.js businesses/aiwithjai/content/blog/article.md ai.withjai

# AI slop only
node scripts/validation/gemini-voice-validator.js post.md ai.withjai ai-slop
```

### Output Format

```json
{
  "score": 8.5,
  "issues": [
    {
      "severity": "warning",
      "category": "ai-slop",
      "pattern": "excessive-politeness",
      "issue": "Found 'I'd love to hear' in paragraph 3"
    }
  ],
  "summary": "7 issues found: 2 critical, 5 warnings"
}
```

**Severity**: `critical` (blocks), `warning` (review), `info` (optional)

## Token Savings

**Traditional**: 18k tokens loaded → **Gemini CLI**: 600 tokens returned = **97% reduction**

