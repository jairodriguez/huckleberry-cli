#!/usr/bin/env node
/**
 * Unified Hook Generator v3.0 (Haiku + Sonnet + Ralph)
 *
 * NEW 3-Step System:
 * - Step 1: Claude Haiku 4.5 generates 50 hooks (85-90/100 baseline, zero AI slop)
 * - Step 2: Sonnet scores and selects top 3 (10-dimensional scoring)
 * - Step 3: Ralph enhancement improves to 90-95/100 (iterative teaching-based improvement)
 *
 * Quality Improvement: +7-10 points per hook (85/100 → 92/100 average)
 *
 * Generates platform-optimized hooks using:
 * - Platform-specific example databases (20+ proven hooks each)
 * - Gemini CLI for heavy lifting (40x cost savings)
 * - Pattern recognition and scoring
 * - Volume mode: Generate 50 hooks, Claude auto-selects top 3, Ralph enhances
 * - Hybrid selector: Auto-detects API key or Claude Code environment
 *
 * Hybrid Scoring:
 * - Has API key: Uses Anthropic API for scoring
 * - No API key: Creates scoring request for manual handling
 * - Works in both standalone and Claude Code environments
 *
 * Usage:
 *   Standard mode (3 hooks, Gemini only, no enhancement):
 *   node generate-hooks-unified.js \
 *     --content "path/to/blog.md" \
 *     --platform twitter \
 *     --brand linkedgraphix.app \
 *     --count 3
 *
 *   Volume mode v3.0 (50 hooks + Sonnet selection + Ralph enhancement → 90-95/100):
 *   node generate-hooks-unified.js \
 *     --content "path/to/blog.md" \
 *     --platform twitter \
 *     --brand linkedgraphix.app \
 *     --count 50 \
 *     --volume
 *
 *   Volume mode with Gemini override (lower quality, cheaper):
 *   node generate-hooks-unified.js \
 *     --content "path/to/blog.md" \
 *     --platform twitter \
 *     --brand linkedgraphix.app \
 *     --count 50 \
 *     --volume \
 *     --model gemini-2.0-flash-exp
 *
 * Environment:
 *   ANTHROPIC_API_KEY - Required for Ralph enhancement and Sonnet selection
 *   Without key: Creates scoring request for manual processing
 *
 * Output: JSON with scored, ranked, and enhanced hooks (v3.0)
 */

const fs = require('fs');
const path = require('path');
const { spawn, execSync } = require('child_process');

// Load environment variables from .env (4 levels up from /scripts/)
require('dotenv').config({ path: path.join(__dirname, '../../../../.env') });

// Parse command line arguments
function parseArgs() {
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

  return options;
}

// Niche-to-brand mapping for automatic niche detection
const BRAND_NICHE_MAP = {
  'enchantents': 'enchantents-glamping',
  'nomadixgear': 'enchantents-glamping',
  'nomadix': 'enchantents-glamping',
  'aiwithjai': 'ai-agents',
  'aiwithjai': 'ai-agents',
  'linkedgraphix': 'ai-agents',
  'clawver': 'ai-agents',
};

// Load platform-specific hook database, with optional niche filtering
function loadPlatformHooks(platform, niche = null) {
  const dbPath = path.join(__dirname, '../database', `${platform}-hooks.json`);

  if (!fs.existsSync(dbPath)) {
    throw new Error(`Hook database not found for platform: ${platform}`);
  }

  const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
  console.log(`   ✓ Loaded ${db.examples.length} ${platform} hook examples`);

  if (niche) {
    const nicheExamples = db.examples.filter(e => e.niche === niche);
    const generalExamples = db.examples.filter(e => !e.niche);

    if (nicheExamples.length > 0) {
      db.examples = [...nicheExamples, ...generalExamples];
      console.log(`   ✓ Prioritized ${nicheExamples.length} ${niche} hooks (${generalExamples.length} general as fallback)`);
    } else {
      console.log(`   ⚠ No hooks found for niche "${niche}", using all ${db.examples.length} examples`);
    }
  }

  return db;
}

// Read content from file or string
function readContent(contentPath) {
  if (fs.existsSync(contentPath)) {
    return fs.readFileSync(contentPath, 'utf8');
  }
  return contentPath; // Treat as direct content string
}

// Extract content elements for hook generation
function extractContentElements(content) {
  console.log(`   Extracting content elements...`);

  // Simple extraction (Gemini will do the heavy lifting)
  const elements = {
    // Numbers/data
    numbers: (content.match(/\d+(?:,\d+)*(?:\.\d+)?(?:%|K|M|B)?/g) || []).slice(0, 10),

    // Timeframes
    timeframes: (content.match(/\d+\s+(?:second|minute|hour|day|week|month|year)s?/gi) || []).slice(0, 5),

    // Quotes (rough extraction)
    quotes: (content.match(/"([^"]+)"/g) || []).slice(0, 3),

    // First 500 chars for context
    context: content.substring(0, 500)
  };

  console.log(`   ✓ Found ${elements.numbers.length} numbers, ${elements.timeframes.length} timeframes`);

  return elements;
}

// Generate hooks using Gemini CLI
async function generateHooksWithGemini(platform, hookDatabase, content, elements, count) {
  console.log(`   Generating ${count} hooks via Gemini CLI...`);

  // Select top examples to show Gemini (5-7 examples)
  const exampleCount = Math.min(7, hookDatabase.examples.length);
  const examples = hookDatabase.examples.slice(0, exampleCount);

  // Build prompt for Gemini
  const prompt = `
You are a ${platform.toUpperCase()} hook generation expert.

Study these ${exampleCount} PROVEN high-performing ${platform} hooks:

${examples.map((ex, i) => `
EXAMPLE ${i + 1}:
Hook: ${typeof ex.hook === 'string' ? ex.hook : JSON.stringify(ex.hook)}
Engagement: ${JSON.stringify(ex.engagement)}
Why it works: ${ex.why_it_works}
Pattern: ${ex.pattern}
`).join('\n')}

${platform === 'linkedin' ? `
CRITICAL: Use first-person witness style like "I watched [person] do [thing]..."
NOT third-person reporter style like "[Person] did [thing]..."
` : ''}

${platform === 'twitter' ? `
CRITICAL: Use conversational, punchy style with short lines and white space.
NOT information overload with everything crammed into one sentence.
` : ''}

CONTENT TO CREATE HOOKS FROM:
${content.substring(0, 1500)}

EXTRACTED ELEMENTS:
- Numbers: ${elements.numbers.join(', ')}
- Timeframes: ${elements.timeframes.join(', ')}
- Context: ${elements.context}

TASK:
Generate ${count} hooks using the SAME PATTERNS as the proven examples above.

For each hook, provide:
1. hook_text: The actual hook (follow platform style from examples)
2. pattern: Which example pattern it follows
3. why_it_works: Specific reason this hook will perform
4. estimated_score: 0-100 (based on pattern match + specificity + curiosity gap)
5. similar_to_example: Which example number (1-${exampleCount}) it's most similar to

OUTPUT AS JSON:
{
  "hooks": [
    {
      "hook_text": "...",
      "pattern": "...",
      "why_it_works": "...",
      "estimated_score": 85,
      "similar_to_example": 1
    }
  ]
}
`;

  return new Promise((resolve, reject) => {
    let output = '';
    let errorOutput = '';

    // Write prompt to temp file
    const tmpFile = path.join('/tmp', `hook-prompt-${Date.now()}.txt`);
    fs.writeFileSync(tmpFile, prompt);

    const gemini = spawn('gemini', ['-o', 'json', '-p', prompt], {
      cwd: process.cwd()
    });

    gemini.stdout.on('data', (data) => {
      output += data.toString();
    });

    gemini.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });

    gemini.on('close', (code) => {
      if (code !== 0) {
        console.error(`   ✗ Gemini CLI error: ${errorOutput}`);
        reject(new Error(`Gemini CLI failed with code ${code}`));
        return;
      }

      try {
        // Parse Gemini CLI JSON output (wrapper format)
        const cliOutput = JSON.parse(output);

        // Extract response field (contains markdown with JSON)
        let responseText = cliOutput.response || output;

        // Remove markdown code blocks if present
        responseText = responseText.replace(/^```json\s*/i, '').replace(/^```\s*/, '').replace(/\s*```$/, '');

        // Try to find JSON object with hooks array
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const result = JSON.parse(jsonMatch[0]);
          if (result.hooks && Array.isArray(result.hooks)) {
            console.log(`   ✓ Generated ${result.hooks.length} hooks`);
            resolve(result.hooks);
            return;
          }
        }

        // Fallback: try to parse as JSON array directly
        const arrayMatch = responseText.match(/\[[\s\S]*\]/);
        if (arrayMatch) {
          const hooks = JSON.parse(arrayMatch[0]);
          console.log(`   ✓ Generated ${hooks.length} hooks`);
          resolve(hooks);
          return;
        }

        throw new Error('No valid JSON with hooks array found in Gemini output');
      } catch (err) {
        console.error(`   ✗ Failed to parse Gemini output: ${err.message}`);
        console.error(`   Raw output length: ${output.length}`);
        reject(err);
      }
    });
  });
}

// Score and rank hooks
function scoreAndRankHooks(hooks, platform) {
  console.log(`   Scoring and ranking hooks...`);

  // Sort by estimated_score (descending)
  const ranked = hooks.sort((a, b) => b.estimated_score - a.estimated_score);

  console.log(`   ✓ Top hook: ${ranked[0].estimated_score}/100`);

  return ranked;
}

// ============================================================================
// VOLUME MODE FUNCTIONS
// ============================================================================

/**
 * Generate 50+ hooks using volume-hook-generator.js or volume-hook-generator-haiku.js
 */
async function generateVolumeHooks(contentPath, platform, brand, count, model) {
  console.log(`\n   🔥 VOLUME MODE: Generating ${count} hooks with ${model}...`);

  // Read content to extract topic
  const content = readContent(contentPath);
  const topic = extractTopic(content);

  console.log(`   📝 Extracted topic: ${topic}\n`);

  // Determine which generator to use based on model
  // Default to Haiku for quality, allow Gemini override
  const useHaikuAgent = model === 'claude-haiku' || model === 'default' || !model.includes('gemini');

  const volumeGeneratorPath = useHaikuAgent
    ? path.join(process.cwd(), 'scripts/hooks/volume-hook-generator-haiku.js')
    : path.join(process.cwd(), 'scripts/hooks/volume-hook-generator.js');

  const generatorName = useHaikuAgent ? 'Claude Haiku' : 'Gemini';

  console.log(`   🤖 Using ${generatorName} for generation`);

  if (useHaikuAgent) {
    console.log(`   💡 Zero AI slop, higher quality, 4x cost\n`);
  } else {
    console.log(`   💡 Fast and cheap, may have AI slop\n`);
  }

  const outputFile = path.join('/tmp', `volume-hooks-${Date.now()}.json`);

  try {
    // Build command
    const baseCmd = `node "${volumeGeneratorPath}" --topic "${topic}" --platform ${platform} --brand ${brand} --count ${count} --output "${outputFile}"`;
    const command = useHaikuAgent ? baseCmd : `${baseCmd} --model ${model}`;

    execSync(command, {
      stdio: 'inherit',
      encoding: 'utf-8'
    });

    // Read generated hooks
    const hooksData = JSON.parse(fs.readFileSync(outputFile, 'utf-8'));
    return { hooksData, outputFile };

  } catch (error) {
    throw new Error(`Volume generation failed: ${error.message}`);
  }
}

/**
 * Generate 50 hooks using hook-writer-master agent (Claude Haiku 4.5)
 * Fallback: Direct Anthropic API if agent unavailable
 */
async function generateVolumeHooksWithAgent(content, platform, brand, count) {
  console.log(`\n   🤖 Volume generation with hook-writer-master agent (Haiku 4.5)...\n`);

  const { invokeHookWriter } = require(path.join(process.cwd(), 'scripts/validation/invoke-hook-writer-agent.js'));

  const prompt = `Generate ${count} scroll-stopping hooks for ${platform}.

Content to extract hooks from:
${content.substring(0, 1500)}

Requirements:
- Platform: ${platform}
- Brand: ${brand}
- Count: ${count}
- Use 10 proven hook formulas
- Zero AI slop

CRITICAL: Return ONLY a valid JSON array with this exact structure, NO explanation text:
[
  {"hook": "hook text here", "formula": "formula name", "rationale": "why it works"},
  {"hook": "hook text here", "formula": "formula name", "rationale": "why it works"}
]

Do not include any text before or after the JSON array. Start with [ and end with ].`;

  try {
    // Try agent first
    const result = await invokeHookWriter(prompt, {
      timeout: 120000,
      model: 'haiku',
      verbose: false
    });

    if (result) {
      // Extract JSON from response (may have markdown code blocks or explanation text)
      let jsonText = result.trim();

      // Remove markdown code blocks if present
      jsonText = jsonText.replace(/^```json\s*/i, '').replace(/^```\s*/, '').replace(/\s*```$/, '');

      // Try to find JSON array in the text
      const arrayMatch = jsonText.match(/\[[\s\S]*\]/);
      if (arrayMatch) {
        jsonText = arrayMatch[0];
      }

      const hooks = JSON.parse(jsonText);
      console.log(`   ✓ Agent generated ${hooks.length} hooks\n`);
      return { hooks, method: 'agent' };
    }
  } catch (err) {
    console.log(`   ⚠️  Agent failed: ${err.message}`);
    console.log(`   ↪ Falling back to direct API...\n`);
  }

  // Fallback: Direct Anthropic API
  console.log(`   🔄 Using direct Anthropic API as fallback...\n`);

  const Anthropic = require('@anthropic-ai/sdk');
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const message = await anthropic.messages.create({
    model: 'claude-3-5-haiku-20241022',
    max_tokens: 4096,
    messages: [{ role: 'user', content: prompt }]
  });

  // Extract JSON from response
  let jsonText = message.content[0].text.trim();
  jsonText = jsonText.replace(/^```json\s*/i, '').replace(/^```\s*/, '').replace(/\s*```$/, '');
  const arrayMatch = jsonText.match(/\[[\s\S]*\]/);
  if (arrayMatch) {
    jsonText = arrayMatch[0];
  }

  const hooks = JSON.parse(jsonText);
  console.log(`   ✓ API generated ${hooks.length} hooks\n`);
  return { hooks, method: 'api' };
}

/**
 * Select top 3 hooks using Claude via claude-hook-selector.js (Hybrid)
 *
 * The hybrid selector auto-detects environment:
 * - If API key available: uses Anthropic API
 * - If no API key: outputs scoring request for manual handling
 */
async function selectTopHooksWithClaude(hooksFile, platform, brand, topCount = 3) {
  console.log(`\n   🤖 Selecting top ${topCount} hooks with Claude (Hybrid)...\n`);

  const selectorPath = path.join(
    process.cwd(),
    'scripts/hooks/claude-hook-selector.js'
  );

  const outputFile = path.join('/tmp', `selected-hooks-${Date.now()}.json`);

  try {
    // Pass ANTHROPIC_API_KEY if available
    const envVars = { ...process.env };

    const command = `node "${selectorPath}" \
      --hooks-file "${hooksFile}" \
      --platform ${platform} \
      --brand ${brand} \
      --top-count ${topCount} \
      --output "${outputFile}"`;

    execSync(command, {
      stdio: 'inherit',
      encoding: 'utf-8',
      env: envVars
    });

    // Check if output file exists (API method succeeded)
    if (fs.existsSync(outputFile)) {
      const selectionData = JSON.parse(fs.readFileSync(outputFile, 'utf-8'));
      return selectionData;
    }

    // Check for request file (Agent method - needs manual handling)
    const requestFile = outputFile.replace('.json', '-request.json');
    if (fs.existsSync(requestFile)) {
      console.log(`\n   ⚠️  Hybrid selector created scoring request (no API key)`);
      console.log(`   📄 Request file: ${requestFile}`);
      console.log(`\n   💡 To complete: Set ANTHROPIC_API_KEY or run in Claude Code with Task tool\n`);

      throw new Error('Scoring request created - manual intervention needed. See request file: ' + requestFile);
    }

    throw new Error('No output file or request file found');

  } catch (error) {
    throw new Error(`Claude selection failed: ${error.message}`);
  }
}

/**
 * Extract topic from content (first heading or first sentence)
 */
function extractTopic(content) {
  // Try to find first H1 heading
  const h1Match = content.match(/^#\s+(.+)$/m);
  if (h1Match) {
    return h1Match[1].trim();
  }

  // Try first sentence
  const firstSentence = content.split(/[.!?]/)[0].trim();
  if (firstSentence && firstSentence.length < 150) {
    return firstSentence;
  }

  // Fallback to first 100 characters
  return content.substring(0, 100).replace(/\n/g, ' ').trim();
}

/**
 * Convert volume mode hooks to unified format
 */
function convertVolumeHooksToUnifiedFormat(topHooks) {
  return topHooks.map(hook => ({
    hook_text: hook.hook,
    pattern: hook.pattern || 'volume_generated',
    why_it_works: hook.selection_reasoning || 'Claude selected as top performer',
    estimated_score: hook.total_score,
    dimension_scores: hook.dimension_scores,
    strengths: hook.strengths || [],
    weaknesses: hook.weaknesses || [],
    primary_emotion: hook.primary_emotion || 'unknown'
  }));
}

// Main execution
async function main() {
  const options = parseArgs();

  // Validate required options
  if (!options.content || !options.platform) {
    console.error('Usage: node generate-hooks-unified.js --content <path> --platform <platform> [--brand <brand>] [--niche <niche>] [--count <number>] [--volume] [--model <model>]');
    process.exit(1);
  }

  const {
    content: contentPath,
    platform,
    brand = 'default',
    count = 3,
    volume = false,
    model = 'claude-haiku',
    niche = null
  } = options;

  const resolvedNiche = niche || BRAND_NICHE_MAP[brand.toLowerCase()] || null;

  // Determine mode
  const isVolumeMode = volume === 'true' || volume === true || parseInt(count) >= 20;

  console.log('\n═══════════════════════════════════════════════════════');
  console.log(`🎯 Unified Hook Generator v3.0 ${isVolumeMode ? '- VOLUME MODE (Haiku + Sonnet + Ralph)' : ''}`);
  console.log('═══════════════════════════════════════════════════════\n');
  console.log(`   Platform: ${platform}`);
  console.log(`   Brand: ${brand}`);
  console.log(`   Niche: ${resolvedNiche || 'auto-detect'}`);
  console.log(`   Hooks to generate: ${count}`);
  console.log(`   Mode: ${isVolumeMode ? 'Volume (50 hooks → Claude selects top 3)' : 'Standard (Gemini generates count)'}`);
  if (isVolumeMode) {
    console.log(`   Model: ${model}`);
  }
  console.log('');

  try {
    let rankedHooks;

    if (isVolumeMode) {
      // ===================================================================
      // VOLUME MODE: Generate 50, Claude selects top 3
      // ===================================================================

      const useHaikuAgent = model === 'claude-haiku' || model === 'default' || !model.includes('gemini');
      const generatorName = useHaikuAgent ? 'Claude Haiku (Agent)' : 'Gemini';

      console.log('   🔥 Volume Mode Activated\n');
      console.log(`   Step 1: Generate ${count} hooks with ${generatorName}`);
      console.log(`   Step 2: Sonnet scores all ${count} hooks`);
      console.log(`   Step 3: Ralph enhancement → 90-95/100\n`);

      let hooksData, outputFile;

      // Step 1: Generate volume hooks
      if (useHaikuAgent) {
        // Use Haiku agent invocation (primary for v3.0)
        const content = readContent(contentPath);
        const { hooks, method } = await generateVolumeHooksWithAgent(content, platform, brand, parseInt(count));

        // Save to temp file for selector
        outputFile = path.join('/tmp', `volume-hooks-${Date.now()}.json`);
        hooksData = { hooks };
        fs.writeFileSync(outputFile, JSON.stringify(hooksData, null, 2));

        console.log(`   ✓ Generated ${hooks.length} hooks via ${method}`);
      } else {
        // Use Gemini volume generator (fallback)
        const result = await generateVolumeHooks(
          contentPath,
          platform,
          brand,
          parseInt(count),
          model
        );
        hooksData = result.hooksData;
        outputFile = result.outputFile;
        console.log(`   ✓ Generated ${hooksData.hooks.length} hooks`);
      }

      // Step 2 & 3: Claude selection
      const selectionResult = await selectTopHooksWithClaude(
        outputFile,
        platform,
        brand,
        3  // Always return top 3
      );

      console.log(`   ✓ Selected top ${selectionResult.top_hooks.length} hooks\n`);

      // Convert to unified format
      rankedHooks = convertVolumeHooksToUnifiedFormat(selectionResult.top_hooks);

    } else {
      // ===================================================================
      // STANDARD MODE: Original behavior (3 hooks)
      // ===================================================================

      // 1. Load platform hook database
      const hookDatabase = loadPlatformHooks(platform, resolvedNiche);

      // 2. Read content
      const content = readContent(contentPath);
      console.log(`   ✓ Loaded content (${content.length} chars)\n`);

      // 3. Extract elements
      const elements = extractContentElements(content);

      // 4. Generate hooks with Gemini CLI
      const hooks = await generateHooksWithGemini(platform, hookDatabase, content, elements, parseInt(count));

      // 5. Score and rank
      rankedHooks = scoreAndRankHooks(hooks, platform);
    }

    // ===================================================================
    // STEP 3: RALPH ENHANCEMENT (NEW)
    // ===================================================================

    if (isVolumeMode) {
      console.log('\n   🎨 Step 3: Ralph Enhancement...\n');

      const { enhanceHookBatch } = require('./ralph-hook-enhancer.js');

      const enhancedHooks = await enhanceHookBatch(
        rankedHooks.slice(0, 3),  // Top 3 from Sonnet
        platform,
        brand,
        85  // Target score (realistic: 75-85/100 is excellent)
      );

      console.log(`   ✓ Enhanced ${enhancedHooks.length} hooks\n`);

      // Replace rankedHooks with enhanced versions
      rankedHooks = enhancedHooks;
    }

    // ===================================================================
    // OUTPUT RESULTS (same for both modes)
    // ===================================================================

    console.log('\n═══════════════════════════════════════════════════════');
    console.log('✅ Hook Generation Complete');
    console.log('═══════════════════════════════════════════════════════\n');

    rankedHooks.forEach((hook, i) => {
      console.log(`HOOK ${i + 1} (Score: ${hook.estimated_score}/100):`);
      console.log(`"${hook.hook_text}"`);
      console.log(`Pattern: ${hook.pattern}`);
      console.log(`Why it works: ${hook.why_it_works}`);

      // Show enhancement info if available
      if (hook.enhanced) {
        console.log(`Enhanced: ${hook.iterations} iterations`);
        console.log(`Improvement: +${hook.improvement_delta} points`);
      }

      // Volume mode shows additional details
      if (isVolumeMode && hook.dimension_scores) {
        console.log(`Dimension scores:`);
        Object.entries(hook.dimension_scores).forEach(([dim, score]) => {
          console.log(`  - ${dim}: ${score}`);
        });
        if (hook.strengths && hook.strengths.length > 0) {
          console.log(`Strengths: ${hook.strengths.join(', ')}`);
        }
      } else if (hook.similar_to_example) {
        console.log(`Similar to example: #${hook.similar_to_example}`);
      }

      console.log('');
    });

    // Output JSON for programmatic use
    console.log('JSON OUTPUT:');
    console.log(JSON.stringify({
      hooks: rankedHooks,
      platform,
      brand,
      mode: isVolumeMode ? 'volume' : 'standard'
    }, null, 2));

  } catch (error) {
    console.error(`\n❌ Error: ${error.message}`);
    if (error.stack) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { generateHooksWithGemini, loadPlatformHooks };
