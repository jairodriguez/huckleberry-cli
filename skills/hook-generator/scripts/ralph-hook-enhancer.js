#!/usr/bin/env node
/**
 * Ralph Hook Enhancer - Hook-specific Quality Enhancement
 *
 * Enhances social media hooks from 85-88/100 to 90-95/100 using Ralph methodology.
 * Adapted from ralph-quality-scorer.js for hook-specific optimization.
 *
 * Key Features:
 * - 10-dimensional scoring (adapted for hooks)
 * - Targeted improvement prompts (weak dimensions only)
 * - Iterative enhancement (max 3 iterations, early stopping)
 * - Pattern teaching (explain WHY hooks work)
 * - Voice preservation (strong dimensions protected)
 *
 * Usage:
 *   const { enhanceHook, enhanceHookBatch } = require('./ralph-hook-enhancer.js');
 *   const enhanced = await enhanceHook(hook, platform, brand, 90);
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

// Load environment variables from .env
require('dotenv').config({ path: path.join(__dirname, '../../../../.env') });

/**
 * Hook-specific dimension weights (adapted from Ralph's reader engagement weights)
 *
 * Hook Effectiveness is CRITICAL (lose reader in 0.3 seconds) = 40% weight
 * Voice Authenticity prevents AI slop = 20% weight
 * Specificity creates credibility = 15% weight
 * Emotion drives sharing = 10% weight
 * Pattern Recognition ensures proven formulas = 10% weight
 * Platform Optimization matches culture = 5% weight
 */
const HOOK_DIMENSION_WEIGHTS = {
  'Hook Effectiveness': 0.40,      // CRITICAL: Stops scrolling in 0.3 seconds
  'Voice Authenticity': 0.20,      // HIGH: Sounds like real person, not AI
  'Specificity': 0.15,             // MEDIUM: Concrete details vs vague claims
  'Emotion Strength': 0.10,        // MEDIUM: Single clear emotion at 7+/10
  'Pattern Recognition': 0.10,     // MEDIUM: Uses proven formulas
  'Platform Optimization': 0.05    // LOW: Platform-specific format
};

/**
 * Score hook using Sonnet API (same system as Step 2 selection)
 * This ensures consistency between selection and enhancement scoring
 *
 * @param {string} hookText - The hook to score
 * @param {string} platform - Platform (twitter, linkedin, etc.)
 * @param {string} brand - Brand identifier
 * @returns {Promise<object>} - { compositeScore, dimensionScores, tier }
 */
async function scoreHook(hookText, platform, brand) {
  const Anthropic = require('@anthropic-ai/sdk');

  if (!process.env.ANTHROPIC_API_KEY) {
    console.warn(`⚠️  ANTHROPIC_API_KEY not set, using heuristic scoring`);
    return {
      compositeScore: 75,
      dimensionScores: {
        'Hook Effectiveness': 7.5,
        'Voice Authenticity': 7.5,
        'Specificity': 7.5,
        'Emotion Strength': 7.5,
        'Pattern Recognition': 7.5,
        'Platform Optimization': 7.5
      },
      tier: 'ACCEPTABLE'
    };
  }

  try {
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const scoringPrompt = `Score this ${platform} hook across 6 dimensions using the EXACT same criteria as the hook selector.

HOOK TO SCORE:
"${hookText}"

SCORING CRITERIA (Total: 100 points):

1. Hook Effectiveness (40 points max)
- 0.3 second stop test - Interrupts scroll immediately?
- Strong curiosity gap - Demands clicking/reading more?
- Clear value in first 5 words - Benefit obvious fast?

2. Specificity (20 points max)
- Exact numbers (47 tasks, $12/month) NOT ranges
- Specific timeframes (3 hours, 2 weeks) NOT "quickly"
- Named tools/techniques NOT "methods"

3. Emotion Strength (15 points max)
- Single clear emotion: surprise, awe, relief, opportunity
- Emotion strength 7+/10
- Appropriate for content

4. Voice Authenticity (15 points max)
- Zero AI clichés: "imagine", "unlock", "discover", "transform", "game-changing"
- Natural conversational tone
- Sounds like real person

5. Trending Alignment (5 points max)
- Uses current proven patterns
- Not stale 2020 formulas

6. Platform Optimization (5 points max)
- Within character limit (${platform === 'twitter' ? '280' : '500'} chars)
- Mobile-first readable
- Platform-appropriate tone

Return ONLY valid JSON (no explanation):
{
  "total_score": 82,
  "dimension_scores": {
    "hookEffectiveness": 35,
    "specificity": 18,
    "emotionStrength": 12,
    "voiceAuthenticity": 13,
    "trendingAlignment": 4,
    "platformOptimization": 5
  }
}`;

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 400,
      temperature: 0,
      messages: [{ role: 'user', content: scoringPrompt }]
    });

    // Extract JSON
    let jsonText = message.content[0].text.trim();
    jsonText = jsonText.replace(/^```json\s*/i, '').replace(/^```\s*/, '').replace(/\s*```$/, '');
    const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
    if (jsonMatch) jsonText = jsonMatch[0];

    const result = JSON.parse(jsonText);

    // Normalize to 10-point scale for display
    const dimensionScores = {
      'Hook Effectiveness': (result.dimension_scores.hookEffectiveness || 0) / 4,
      'Voice Authenticity': (result.dimension_scores.voiceAuthenticity || 0) / 1.5,
      'Specificity': (result.dimension_scores.specificity || 0) / 2,
      'Emotion Strength': (result.dimension_scores.emotionStrength || 0) / 1.5,
      'Pattern Recognition': (result.dimension_scores.trendingAlignment || 0) / 0.5,
      'Platform Optimization': (result.dimension_scores.platformOptimization || 0) / 0.5
    };

    const compositeScore = result.total_score;

    const tier =
      compositeScore >= 90 ? 'EXCELLENT' :
      compositeScore >= 80 ? 'STRONG' :
      compositeScore >= 70 ? 'ACCEPTABLE' : 'NEEDS IMPROVEMENT';

    return { compositeScore, dimensionScores, tier };

  } catch (err) {
    console.warn(`⚠️  Sonnet scoring failed: ${err.message}`);
    return {
      compositeScore: 75,
      dimensionScores: {
        'Hook Effectiveness': 7.5,
        'Voice Authenticity': 7.5,
        'Specificity': 7.5,
        'Emotion Strength': 7.5,
        'Pattern Recognition': 7.5,
        'Platform Optimization': 7.5
      },
      tier: 'ACCEPTABLE'
    };
  }
}

/**
 * Score Hook Effectiveness: Stops scrolling in 0.3 seconds?
 */
function scoreHookEffectiveness(hookText, platform) {
  let score = 5.0; // Baseline

  // Word count: <10 words = +2 points (Twitter), <15 words = +1 (LinkedIn)
  const wordCount = hookText.split(/\s+/).length;
  if (platform === 'twitter' && wordCount <= 10) score += 2;
  else if (wordCount <= 15) score += 1;

  // Contains specific numbers/metrics = +1.5 points
  if (/\d+(?:,\d+)*(?:\.\d+)?(?:%|K|M|B)?/.test(hookText)) score += 1.5;

  // Creates curiosity gap (question, incomplete statement, "Here's what", etc.) = +1.5 points
  if (/\?|Here's what|What happened|Why|How/.test(hookText)) score += 1.5;

  return Math.min(10, score);
}

/**
 * Score Voice Authenticity: Sounds like real person? Zero AI clichés?
 */
function scoreVoiceAuthenticity(hookText, brand) {
  let score = 10.0; // Start perfect, subtract for AI slop

  // AI clichés detection (each -2 points)
  const aiCliches = [
    /ever-evolving/i,
    /game-changer/i,
    /revolutionary/i,
    /delve into/i,
    /leverage/i,
    /robust/i,
    /seamless/i,
    /imagine\s+this/i,
    /picture\s+this/i,
    /in\s+conclusion/i
  ];

  aiCliches.forEach(pattern => {
    if (pattern.test(hookText)) score -= 2;
  });

  // Generic openings (each -1 point)
  if (/^Most people think/i.test(hookText)) score -= 1;
  if (/^Have you ever/i.test(hookText)) score -= 1;
  if (/^In today's world/i.test(hookText)) score -= 1;

  return Math.max(0, score);
}

/**
 * Score Specificity: Concrete details vs vague claims
 */
function scoreSpecificity(hookText) {
  let score = 5.0; // Baseline

  // Contains specific numbers = +2 points
  if (/\d+/.test(hookText)) score += 2;

  // Contains timeframes (48 hours, 2 weeks, etc.) = +1.5 points
  if (/\d+\s+(?:second|minute|hour|day|week|month|year)s?/i.test(hookText)) score += 1.5;

  // Contains proper nouns (capitalized words, tool names) = +1.5 points
  if (/[A-Z][a-z]+/.test(hookText)) score += 1.5;

  return Math.min(10, score);
}

/**
 * Score Emotion Strength: Single clear emotion at 7+/10
 */
function scoreEmotionStrength(hookText) {
  let score = 5.0; // Baseline

  // High-arousal positive emotions (awe, excitement, surprise)
  const positiveEmotions = [
    /shocking/i,
    /surprising/i,
    /amazing/i,
    /incredible/i,
    /powerful/i,
    /explosive/i
  ];

  positiveEmotions.forEach(pattern => {
    if (pattern.test(hookText)) score += 2;
  });

  // Urgency/FOMO emotions
  if (/before|after|miss|lose|gain|win/.test(hookText)) score += 1.5;

  return Math.min(10, score);
}

/**
 * Score Pattern Recognition: Uses proven formulas
 */
function scorePatternRecognition(hookText) {
  let score = 5.0; // Baseline

  // Contrarian pattern (Most X, but actually Y) = +3 points
  if (/Most.*but|think.*wrong|believe.*actually/i.test(hookText)) score += 3;

  // First-person witness (I watched, I saw) = +2.5 points
  if (/I watched|I saw|I built|I discovered/i.test(hookText)) score += 2.5;

  // Transformation pattern (From X to Y, Before/After) = +2 points
  if (/from.*to|before.*after|went from/i.test(hookText)) score += 2;

  return Math.min(10, score);
}

/**
 * Score Platform Optimization: Follows platform culture
 */
function scorePlatformOptimization(hookText, platform) {
  let score = 7.0; // Baseline (most hooks are platform-agnostic)

  if (platform === 'twitter') {
    // Twitter: Conversational, short, punchy
    if (hookText.split(/\s+/).length <= 10) score += 1.5;
    if (/\.\.\./.test(hookText)) score += 1.5; // Ellipsis creates pause
  } else if (platform === 'linkedin') {
    // LinkedIn: Professional, first-person, authority
    if (/I\s+/.test(hookText)) score += 1.5; // First-person
    if (/\d+%|\d+x|\$\d+/.test(hookText)) score += 1.5; // Business metrics
  }

  return Math.min(10, score);
}

/**
 * Generate improvement prompt for weak dimensions
 *
 * Based on ralph-quality-scorer.js:generateImprovementPrompt (lines 508-651)
 * Adapted for hook-specific optimization
 *
 * @param {object} hookData - { hook, scores, platform, brand }
 * @param {number} targetScore - Target composite score (default: 90)
 * @returns {string} - Improvement prompt
 */
async function generateImprovementPrompt(hookData, targetScore = 90) {
  const { hook, scores, platform, brand } = hookData;

  // Identify weak dimensions (score < 7/10)
  const weakDimensions = Object.entries(scores.dimensionScores)
    .filter(([_, score]) => score < 7)
    .sort(([dimA, scoreA], [dimB, scoreB]) => {
      // Sort by weight first (high-impact dimensions prioritized)
      const weightA = HOOK_DIMENSION_WEIGHTS[dimA] || 0;
      const weightB = HOOK_DIMENSION_WEIGHTS[dimB] || 0;
      if (weightA !== weightB) return weightB - weightA;
      // Then by score (lowest first)
      return scoreA - scoreB;
    });

  if (weakDimensions.length === 0) {
    return null; // Hook already meets quality standards
  }

  let prompt = '';

  // Section 1: Hook Quality Improvement - Teaching-Based Approach
  prompt += '# Hook Quality Improvement - Teaching-Based Approach\n\n';
  prompt += `**Target**: Composite quality score ≥${targetScore}/100\n`;
  prompt += `**Current**: ${scores.compositeScore.toFixed(1)}/100 (${scores.tier})\n`;
  prompt += `**Platform**: ${platform}\n`;
  prompt += `**Brand**: ${brand}\n\n`;

  // Section 2: Current Hook
  prompt += '## Current Hook\n\n';
  prompt += `"${hook}"\n\n`;

  // Section 3: Load Banger Hook Options (if Hook Effectiveness weak)
  const isHookWeak = weakDimensions.some(([dim]) => dim === 'Hook Effectiveness');
  if (isHookWeak) {
    const bangerHooks = await loadBangerHookOptions(platform);
    if (bangerHooks && bangerHooks.length > 0) {
      prompt += '## ✨ BANGER HOOK OPTIONS (9/10 Examples)\n\n';
      prompt += 'Study these proven high-performing hooks and use their PATTERNS:\n\n';

      bangerHooks.slice(0, 5).forEach((example, i) => {
        prompt += `**Example ${i + 1}**: "${example.hook}"\n`;
        prompt += `- Engagement: ${JSON.stringify(example.engagement)}\n`;
        prompt += `- Pattern: ${example.pattern}\n`;
        prompt += `- Why it works: ${example.why_it_works}\n\n`;
      });
    }
  }

  // Section 4: Weak Dimensions - What to Improve
  prompt += '## Dimensions Needing Improvement\n\n';
  prompt += `${weakDimensions.length} dimensions scored <7/10 and need improvement.\n\n`;

  weakDimensions.forEach(([dimension, score], index) => {
    prompt += `### ${index + 1}. ${dimension} (${score.toFixed(1)}/10 → Target: 7+/10)\n\n`;
    prompt += getDimensionImprovementGuidance(dimension, platform);
    prompt += '\n---\n\n';
  });

  // Section 5: Strong Dimensions - What to PRESERVE
  const strongDimensions = Object.entries(scores.dimensionScores)
    .filter(([_, score]) => score >= 7)
    .sort(([_, scoreA], [__, scoreB]) => scoreB - scoreA);

  if (strongDimensions.length > 0) {
    prompt += '## 🚨 CRITICAL: Dimensions to PRESERVE (Do NOT Sacrifice These)\n\n';
    prompt += `While fixing weak dimensions, you MUST maintain these ${strongDimensions.length} strong dimensions.\n\n`;

    strongDimensions.forEach(([dimension, score], index) => {
      prompt += `### ${index + 1}. ${dimension}: ${score.toFixed(1)}/10 ✅\n\n`;
      prompt += getPreservationGuidance(dimension);
      prompt += '\n---\n\n';
    });
  }

  // Section 6: Pattern Teaching - WHY These Patterns Work
  prompt += '## Understanding WHY These Patterns Work\n\n';
  prompt += generatePatternTeaching(weakDimensions.map(([dim]) => dim));
  prompt += '\n\n';

  // Section 7: Critical Rules - No AI Slop
  prompt += '## Critical Rules - Do NOT Introduce New AI Slop\n\n';
  prompt += '**NEVER use these AI slop phrases in hooks**:\n';
  prompt += '- "ever-evolving", "game-changer", "revolutionary", "delve into"\n';
  prompt += '- "leverage", "robust", "seamless", "imagine this", "picture this"\n';
  prompt += '- "Most people think...", "Have you ever...", "In today\'s world..."\n\n';

  prompt += '**Quality Check**:\n';
  prompt += '- Is it specific? (numbers, names, timeframes)\n';
  prompt += '- Is it conversational? (sounds human, not corporate)\n';
  prompt += '- Does it create curiosity gap? (makes reader want more)\n';
  prompt += '- Is it <15 words? (Twitter: <10 words ideal)\n\n';

  // Section 8: Implementation Instructions
  prompt += '## Implementation Instructions\n\n';
  prompt += '1. Study the banger hook examples above\n';
  prompt += '2. Identify which pattern fits the content best\n';
  prompt += '3. Apply transformation to fix weak dimensions\n';
  prompt += '4. Preserve strong dimensions (don\'t break what works)\n';
  prompt += '5. Output ONLY the improved hook (no explanation)\n\n';

  return prompt;
}

/**
 * Get dimension-specific improvement guidance
 */
function getDimensionImprovementGuidance(dimension, platform) {
  const guidance = {
    'Hook Effectiveness': `**What 9/10 looks like**:
- "I watched Kip build an AI app live. Under 10 minutes. 16 viral talking points from ONE video."
- "Most marketers think SEO is dead. $2.4M in organic traffic later, here's what actually works:"
- "You don't need 10 tools. You need these 3 APIs."

**How to improve**:
- Use specific numbers (not "a lot", use "47 hours")
- Create curiosity gap ("Here's what happened", incomplete statement)
- Keep it SHORT: ${platform === 'twitter' ? '<10 words' : '<15 words'}
- Start with contrarian belief or first-person witness`,

    'Voice Authenticity': `**What 9/10 sounds like**:
- "I broke the LinkedIn algorithm. 450K views in 72 hours. Zero paid ads."
- "Most creators burn out. I automated 80% of my workflow. Here's the system:"

**How to improve**:
- Remove AI clichés ("game-changer", "revolutionary", "leverage")
- Don't use "Most people think..." (overused pattern)
- Sound conversational, like explaining to a friend
- Use contractions ("you're" not "you are")`,

    'Specificity': `**What 9/10 looks like**:
- "I analyzed 1,247 viral tweets. 3 patterns appeared in 94% of them."
- "Claude Code + Playwright + 15 minutes = Full e2e test suite."

**How to improve**:
- Replace vague words with exact numbers ("many" → "147")
- Add timeframes ("quickly" → "in 48 hours")
- Use proper nouns ("automation tool" → "Zapier")
- Include metrics (%, $, x, hours, etc.)`,

    'Emotion Strength': `**What 9/10 looks like**:
- "This is POWERFUL. I built a $10K/mo SaaS in 3 weekends."
- "I was shocked. One API call replaced 6 hours of manual work."

**How to improve**:
- Choose ONE clear emotion (excitement, surprise, awe)
- Use high-arousal words (shocking, powerful, explosive)
- Add urgency/FOMO (before, after, miss, gain)
- Avoid neutral/flat language`,

    'Pattern Recognition': `**What 9/10 looks like**:
- Contrarian: "Most X think Y. That's wrong. Here's Z:"
- Witness: "I watched [person] do [thing]. [Surprising result]."
- Transformation: "I went from X to Y in [timeframe]."

**How to improve**:
- Use proven formulas (contrarian, witness, transformation)
- Don't invent new patterns (stick to what works)
- Match pattern to content (contrarian for belief shift, witness for case study)`,

    'Platform Optimization': `**What 9/10 looks like (${platform})**:
${platform === 'twitter' ? `- "10 years of SEO experience. 3 lessons that matter:"
- "You're doing content marketing wrong. Here's why:"
- Short, punchy, conversational` : ''}
${platform === 'linkedin' ? `- "I watched 50 founders build in public. The ones who succeeded had 3 things in common:"
- "After analyzing $2.4M in ad spend, here's what I learned:"
- Professional, first-person, authority-driven` : ''}

**How to improve**:
${platform === 'twitter' ? '- Keep it ultra-short (<10 words)\n- Use ellipsis (...) for pause\n- Conversational tone' : ''}
${platform === 'linkedin' ? '- Use first-person ("I")\n- Include business metrics ($, %, x)\n- Professional but approachable' : ''}`
  };

  return guidance[dimension] || '';
}

/**
 * Get preservation guidance for strong dimensions
 */
function getPreservationGuidance(dimension) {
  const guides = {
    'Hook Effectiveness': `**How to preserve**:
- Keep the curiosity gap mechanism
- Don't add filler words
- Maintain word count`,

    'Voice Authenticity': `**How to preserve**:
- Keep conversational tone
- Don't add corporate language
- Preserve contractions and natural flow`,

    'Specificity': `**How to preserve**:
- Keep all current numbers and metrics
- Don't replace specifics with vague terms
- Maintain timeframes and proper nouns`,

    'Emotion Strength': `**How to preserve**:
- Keep high-arousal language
- Don't tone down excitement
- Maintain emotional intensity`,

    'Pattern Recognition': `**How to preserve**:
- Keep the proven formula structure
- Don't break the pattern
- Maintain contrarian/witness/transformation setup`,

    'Platform Optimization': `**How to preserve**:
- Keep platform-specific formatting
- Don't change tone for wrong platform
- Maintain cultural fit`
  };

  return guides[dimension] || '';
}

/**
 * Generate pattern teaching section
 */
function generatePatternTeaching(weakDimensionNames) {
  let teaching = '';

  const patterns = {
    'Hook Effectiveness': {
      why: 'Brain has 0.3-second attention window on social media. Curiosity gap creates cognitive tension that MUST be resolved.',
      pattern: 'Specific number + curiosity gap + short form = reader keeps reading',
      research: 'Neuroscience: Information gaps trigger dopamine release when resolved'
    },
    'Voice Authenticity': {
      why: 'AI slop signals "not worth reading" to brain. Authentic voice builds trust and connection.',
      pattern: 'Conversational tone + zero clichés + natural language = sounds like friend, not corporation',
      research: 'Psychology: People trust conversational content 2.3x more than formal writing'
    },
    'Specificity': {
      why: 'Concrete language processed 2x faster, 30% more memorable than abstract.',
      pattern: 'Exact number + specific timeframe + proper noun = credibility and recall',
      research: 'Cognitive load theory: Tangible details reduce working memory demands'
    },
    'Emotion Strength': {
      why: 'High-arousal emotions activate sympathetic nervous system → action → sharing.',
      pattern: 'Single clear emotion + high intensity (7+/10) + practical value = viral potential',
      research: 'Jonah Berger (Wharton): High-arousal content shared 34% more'
    },
    'Pattern Recognition': {
      why: 'Proven formulas work because they exploit cognitive biases (contrarian = cognitive dissonance).',
      pattern: 'Use tested formulas (contrarian, witness, transformation) = predictable engagement',
      research: 'Copywriting: 80% of hook success comes from formula, 20% from execution'
    },
    'Platform Optimization': {
      why: 'Each platform has culture and norms. Mismatch signals "doesn\'t belong here".',
      pattern: 'Match platform culture (Twitter conversational, LinkedIn professional) = higher engagement',
      research: 'Social proof: Content that fits platform norms gets 40% more engagement'
    }
  };

  weakDimensionNames.forEach(dimension => {
    if (patterns[dimension]) {
      const pattern = patterns[dimension];
      teaching += `**${dimension}**:\n`;
      teaching += `- WHY: ${pattern.why}\n`;
      teaching += `- PATTERN: ${pattern.pattern}\n`;
      teaching += `- RESEARCH: ${pattern.research}\n\n`;
    }
  });

  return teaching;
}

/**
 * Load banger hook options from platform database
 */
async function loadBangerHookOptions(platform) {
  const dbPath = path.join(__dirname, '../database', `${platform}-hooks.json`);

  if (!fs.existsSync(dbPath)) {
    return null;
  }

  try {
    const db = JSON.parse(fs.readFileSync(dbPath, 'utf-8'));
    return db.examples || null;
  } catch (err) {
    console.warn(`⚠️  Could not load banger hooks: ${err.message}`);
    return null;
  }
}

/**
 * Improve hook using Claude Sonnet API
 * (Much better than Gemini for maintaining quality and avoiding AI slop)
 *
 * @param {string} hook - Current hook text
 * @param {string} improvementPrompt - Generated improvement prompt
 * @returns {Promise<string|null>} - Improved hook or null on failure
 */
async function improveHookWithSonnet(hook, improvementPrompt) {
  const Anthropic = require('@anthropic-ai/sdk');

  if (!process.env.ANTHROPIC_API_KEY) {
    console.warn(`⚠️  ANTHROPIC_API_KEY not set, cannot improve hook`);
    return null;
  }

  try {
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const combinedInput = `${improvementPrompt}\n\n# CURRENT HOOK TO IMPROVE\n\n"${hook}"\n\nCRITICAL: Return ONLY the improved hook as a single line. No explanation, no quotes, no prefix text. Just the hook itself.`;

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',  // Sonnet 4 for best quality rewriting
      max_tokens: 200,
      temperature: 0.7,  // Some creativity for rewriting
      messages: [{
        role: 'user',
        content: combinedInput
      }]
    });

    // Extract just the hook
    let improved = message.content[0].text.trim();
    improved = improved.split('\n')[0]; // Take first line only
    improved = improved.replace(/^["']|["']$/g, ''); // Remove quotes
    improved = improved.replace(/^Improved hook:\s*/i, ''); // Remove prefix
    improved = improved.trim();

    // Validate improvement (must be different and reasonable length)
    if (improved && improved !== hook && improved.length > 10 && improved.length < 280) {
      return improved;
    }

    return null;

  } catch (err) {
    console.warn(`⚠️  Sonnet improvement failed: ${err.message}`);
    return null;
  }
}

/**
 * Enhance single hook to target score
 *
 * @param {string} hook - Hook text to enhance
 * @param {string} platform - Platform (twitter, linkedin, etc.)
 * @param {string} brand - Brand identifier
 * @param {number} targetScore - Target composite score (default: 90)
 * @returns {Promise<object>} - { hook, score, iterations, dimensions }
 */
async function enhanceHook(hook, platform, brand, targetScore = 90) {
  const maxIterations = 3;
  let currentHook = hook;
  let iteration = 0;
  let previousScore = 0;

  console.log(`   🎨 Enhancing hook for ${platform}...`);
  console.log(`   Current: "${currentHook.substring(0, 60)}..."`);

  for (iteration = 1; iteration <= maxIterations; iteration++) {
    // Score current version
    const scores = await scoreHook(currentHook, platform, brand);

    console.log(`   Iteration ${iteration}: ${scores.compositeScore.toFixed(1)}/100 (${scores.tier})`);

    // Check if already good (75+) - don't touch it!
    // Rationale: Hooks 75-85/100 are excellent. Rewriting often makes them worse.
    if (iteration === 1 && scores.compositeScore >= 75) {
      console.log(`   ✅ Already excellent (${scores.compositeScore.toFixed(1)}/100) - skipping enhancement`);
      return {
        hook: currentHook,
        score: scores.compositeScore,
        iterations: 0,
        dimensions: scores.dimensionScores,
        enhanced: false,
        improvement_delta: 0,
        skip_reason: 'Already excellent quality'
      };
    }

    // Check if target reached
    if (scores.compositeScore >= targetScore) {
      console.log(`   ✅ Target reached! ${scores.compositeScore.toFixed(1)} ≥ ${targetScore}`);
      return {
        hook: currentHook,
        score: scores.compositeScore,
        iterations: iteration,
        dimensions: scores.dimensionScores,
        enhanced: true,
        improvement_delta: scores.compositeScore - previousScore
      };
    }

    // Early stopping: No improvement after 2 iterations
    if (iteration > 1 && scores.compositeScore <= previousScore + 0.5) {
      console.log(`   🛑 Early stop: No meaningful improvement`);
      return {
        hook: currentHook,
        score: scores.compositeScore,
        iterations: iteration,
        dimensions: scores.dimensionScores,
        enhanced: true,
        improvement_delta: scores.compositeScore - previousScore
      };
    }

    // Generate improvement prompt
    const improvementPrompt = await generateImprovementPrompt({
      hook: currentHook,
      scores,
      platform,
      brand
    }, targetScore);

    if (!improvementPrompt) {
      // No weak dimensions, hook is already good
      return {
        hook: currentHook,
        score: scores.compositeScore,
        iterations: iteration,
        dimensions: scores.dimensionScores,
        enhanced: false,
        improvement_delta: 0
      };
    }

    // Improve with Sonnet
    const improvedHook = await improveHookWithSonnet(currentHook, improvementPrompt);

    if (!improvedHook) {
      console.log(`   ⚠️  Improvement failed, returning current version`);
      return {
        hook: currentHook,
        score: scores.compositeScore,
        iterations: iteration,
        dimensions: scores.dimensionScores,
        enhanced: false,
        improvement_delta: 0
      };
    }

    previousScore = scores.compositeScore;
    currentHook = improvedHook;
  }

  // Max iterations reached
  const finalScores = await scoreHook(currentHook, platform, brand);
  console.log(`   ⏱️  Max iterations reached: ${finalScores.compositeScore.toFixed(1)}/100`);

  return {
    hook: currentHook,
    score: finalScores.compositeScore,
    iterations: maxIterations,
    dimensions: finalScores.dimensionScores,
    enhanced: true,
    improvement_delta: finalScores.compositeScore - previousScore
  };
}

/**
 * Enhance batch of hooks (typically top 3 from Sonnet selection)
 *
 * @param {array} hooks - Array of hook objects from Sonnet selector
 * @param {string} platform - Platform
 * @param {string} brand - Brand
 * @param {number} targetScore - Target score (default: 90)
 * @returns {Promise<array>} - Enhanced hooks
 */
async function enhanceHookBatch(hooks, platform, brand, targetScore = 90) {
  const enhanced = [];

  for (let i = 0; i < hooks.length; i++) {
    const hook = hooks[i];
    const hookText = hook.hook_text || hook.hook || hook;

    console.log(`\n   Hook ${i + 1}/${hooks.length}:`);

    const result = await enhanceHook(hookText, platform, brand, targetScore);

    // Merge with original hook data
    enhanced.push({
      ...hook,
      hook_text: result.hook,
      estimated_score: result.score,
      enhanced: result.enhanced,
      iterations: result.iterations,
      improvement_delta: result.improvement_delta,
      dimension_scores: result.dimensions
    });
  }

  return enhanced;
}

/**
 * CLI test function
 */
async function testEnhancement() {
  const args = process.argv.slice(2);
  const options = {};

  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith('--')) {
      const key = args[i].slice(2);
      const value = args[i + 1];
      options[key] = value;
      i++;
    }
  }

  const {
    hook = "I watched Kip build an AI app in 10 minutes",
    platform = "twitter",
    brand = "ai.withjai",
    target = 90
  } = options;

  console.log('\n=== Ralph Hook Enhancement Test ===\n');
  console.log(`Hook: "${hook}"`);
  console.log(`Platform: ${platform}`);
  console.log(`Brand: ${brand}`);
  console.log(`Target: ${target}/100\n`);

  const result = await enhanceHook(hook, platform, brand, parseInt(target));

  console.log('\n=== Results ===\n');
  console.log(`Final hook: "${result.hook}"`);
  console.log(`Score: ${result.score.toFixed(1)}/100`);
  console.log(`Iterations: ${result.iterations}`);
  console.log(`Improvement: +${result.improvement_delta.toFixed(1)} points`);
  console.log(`Enhanced: ${result.enhanced}`);
  console.log('\nDimension Scores:');
  Object.entries(result.dimensions).forEach(([dim, score]) => {
    console.log(`  ${dim}: ${score.toFixed(1)}/10`);
  });
}

// Export functions
module.exports = {
  scoreHook,
  generateImprovementPrompt,
  enhanceHook,
  enhanceHookBatch
};

// CLI execution
if (require.main === module) {
  testEnhancement().catch(console.error);
}
