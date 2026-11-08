#!/usr/bin/env node

/**
 * Topical Authority Orchestrator
 *
 * Coordinates all 12 topical authority scripts using Gemini CLI for token efficiency.
 * Delegates script execution to Gemini CLI, tracks progress, validates outputs.
 *
 * Usage:
 *   node .claude/skills/topical-authority/scripts/orchestrator.js --brand ai.withjai --phase all
 *   node .claude/skills/topical-authority/scripts/orchestrator.js --brand ai.withjai --phase discover
 *   node .claude/skills/topical-authority/scripts/orchestrator.js --brand ai.withjai --phase cluster
 *   node .claude/skills/topical-authority/scripts/orchestrator.js --brand ai.withjai --phase analyze
 *
 * Phases:
 *   discover - Forum discovery (scripts 1-5)
 *   cluster  - SERP clustering (scripts 6-8)
 *   analyze  - Gap analysis + linking (scripts 9-12)
 *   all      - Run complete workflow
 *
 * Token Optimization:
 *   All script execution delegated to Gemini CLI = 95%+ token savings
 */

const { spawnSync } = require('child_process');
const { fs, path, fromConfig, parseArgs, ensureDir } = require('../../../../scripts/utils/_utils');

const MODEL = process.env.GEMINI_MODEL || 'gemini-2.0-flash-exp';

const PHASES = {
  discover: {
    name: 'Forum Discovery & Keyword Extraction',
    scripts: [
      { id: 1, file: 'scripts/seo/scrape-reddit-pain-points.js', args: '--brand {brand}' },
      { id: 2, file: 'scripts/seo/scrape-quora-questions.js', args: '--brand {brand} --topics "{topics}"' },
      { id: 3, file: 'scripts/seo/extract-paa-questions.js', args: '--brand {brand} --seed-keywords "{seedKeywords}"' },
      { id: 4, file: 'scripts/seo/analyze-competitor-coverage.js', args: '--brand {brand}' },
      { id: 5, file: 'scripts/seo/extract-keywords-from-forums.js', args: '--brand {brand} --target {target}' }
    ],
    outputs: [
      'brands/{brand}/content/02-strategy/forum-data/reddit-pain-points.json',
      'brands/{brand}/content/02-strategy/forum-data/quora-questions.json',
      'brands/{brand}/content/02-strategy/forum-data/paa-questions.json',
      'brands/{brand}/content/02-strategy/forum-data/competitor-coverage.json',
      'brands/{brand}/content/02-strategy/keyword-universe.json'
    ]
  },
  cluster: {
    name: 'SERP Clustering & Hub Architecture',
    scripts: [
      { id: 6, file: 'scripts/seo/fetch-serp-urls.js', args: '--brand {brand} --limit {limit}' },
      { id: 7, file: 'scripts/seo/gemini-serp-clustering.js', args: '--brand {brand} --threshold {threshold}' },
      { id: 8, file: 'scripts/seo/build-clusters-from-serp.js', args: '--brand {brand} --min-cluster-size {minClusterSize}' }
    ],
    outputs: [
      'brands/{brand}/content/02-strategy/serp-data/serp-urls.json',
      'brands/{brand}/content/02-strategy/serp-data/keyword-clusters.json',
      'brands/{brand}/content/02-strategy/hub-architecture.json'
    ]
  },
  analyze: {
    name: 'Gap Analysis & Internal Linking',
    scripts: [
      { id: 9, file: 'scripts/seo/identify-content-gaps.js', args: '--brand {brand} --min-volume {minVolume}' },
      { id: 10, file: 'scripts/seo/identify-research-gaps.js', args: '--brand {brand} --min-priority {minPriority}' },
      { id: 11, file: 'scripts/seo/audit-internal-links.js', args: '--brand {brand} --min-links {minLinks}' },
      { id: 12, file: 'scripts/seo/weave-internal-links.js', args: '--brand {brand} {autoInsert}' }
    ],
    outputs: [
      'brands/{brand}/content/02-strategy/content-gaps.json',
      'brands/{brand}/content/02-strategy/research-gaps.json',
      'brands/{brand}/content/02-strategy/internal-links-graph.json',
      'brands/{brand}/content/02-strategy/link-suggestions.md'
    ]
  }
};

function main() {
  const args = parseArgs();
  const { brand } = fromConfig(args.brand);

  if (!brand) {
    console.error('❌ Brand not specified. Use --brand {brand}');
    process.exit(1);
  }

  const phase = args.phase || 'all';
  const validPhases = ['discover', 'cluster', 'analyze', 'all'];

  if (!validPhases.includes(phase)) {
    console.error(`❌ Invalid phase: ${phase}`);
    console.error(`   Valid phases: ${validPhases.join(', ')}`);
    process.exit(1);
  }

  // Collect parameters
  const params = {
    brand,
    topics: args.topics || getDefaultTopics(brand),
    seedKeywords: args['seed-keywords'] || getDefaultSeedKeywords(brand),
    target: args.target ? Number(args.target) : 1000,
    limit: args.limit ? Number(args.limit) : 100,
    threshold: args.threshold ? Number(args.threshold) : 0.7,
    minClusterSize: args['min-cluster-size'] ? Number(args['min-cluster-size']) : 3,
    minVolume: args['min-volume'] ? Number(args['min-volume']) : 100,
    minPriority: args['min-priority'] ? Number(args['min-priority']) : 2,
    minLinks: args['min-links'] ? Number(args['min-links']) : 3,
    autoInsert: args['auto-insert'] ? '--auto-insert' : ''
  };

  console.log('🎯 Topical Authority Orchestrator');
  console.log('════════════════════════════════════════════════════════════');
  console.log(`Brand: ${brand}`);
  console.log(`Phase: ${phase}`);
  console.log(`Model: ${MODEL}`);
  console.log('════════════════════════════════════════════════════════════\n');

  const phasesToRun = phase === 'all'
    ? ['discover', 'cluster', 'analyze']
    : [phase];

  const startTime = Date.now();
  const results = {};

  phasesToRun.forEach((phaseName, idx) => {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`Phase ${idx + 1}/${phasesToRun.length}: ${PHASES[phaseName].name}`);
    console.log('='.repeat(60));

    const result = runPhaseWithGemini(phaseName, params);
    results[phaseName] = result;

    if (!result.success) {
      console.error(`\n❌ Phase "${phaseName}" failed. Stopping workflow.`);
      process.exit(1);
    }
  });

  const duration = ((Date.now() - startTime) / 1000).toFixed(1);

  console.log('\n' + '='.repeat(60));
  console.log('✅ Topical Authority Workflow Complete');
  console.log('='.repeat(60));
  console.log(`Duration: ${duration}s`);
  console.log(`\nPhase Results:`);

  Object.entries(results).forEach(([phaseName, result]) => {
    console.log(`  • ${PHASES[phaseName].name}: ${result.success ? '✅' : '❌'}`);
    if (result.summary) {
      console.log(`    ${result.summary}`);
    }
  });

  console.log(`\n📊 Outputs saved to: brands/${brand}/content/02-strategy/`);
  console.log(`\n💡 Next steps:`);

  if (phase === 'all' || phase === 'analyze') {
    console.log(`   1. Review research gaps: brands/${brand}/content/02-strategy/research-gaps.json`);
    console.log(`   2. Review content opportunities: brands/${brand}/content/02-strategy/content-gaps.json`);
    console.log(`   3. Review link suggestions: brands/${brand}/content/02-strategy/link-suggestions.md`);
    console.log(`   4. Start content creation for GOLDEN opportunities`);
  } else if (phase === 'discover') {
    console.log(`   Run SERP clustering: node .claude/skills/topical-authority/scripts/orchestrator.js --brand ${brand} --phase cluster`);
  } else if (phase === 'cluster') {
    console.log(`   Run gap analysis: node .claude/skills/topical-authority/scripts/orchestrator.js --brand ${brand} --phase analyze`);
  }
}

function runPhaseWithGemini(phaseName, params) {
  const phase = PHASES[phaseName];

  console.log(`\n🤖 Delegating to Gemini CLI for execution...`);
  console.log(`   Scripts to run: ${phase.scripts.length}`);

  const prompt = buildGeminiPrompt(phaseName, phase, params);

  const proc = spawnSync('gemini', ['-m', MODEL, '-p', prompt], {
    encoding: 'utf8',
    maxBuffer: 10 * 1024 * 1024, // 10MB
    timeout: 600000 // 10 minutes
  });

  if (proc.error || proc.status !== 0) {
    console.error(`\n❌ Gemini CLI error:`);
    console.error(proc.stderr || proc.error?.message);
    return { success: false, error: proc.stderr || proc.error?.message };
  }

  const output = proc.stdout;
  console.log(`\n📋 Gemini CLI Output:`);
  console.log(output);

  // Validate outputs exist
  const validationResult = validatePhaseOutputs(phaseName, params.brand);

  if (!validationResult.success) {
    console.error(`\n❌ Output validation failed:`);
    console.error(`   Missing: ${validationResult.missing.join(', ')}`);
    return { success: false, error: 'Output validation failed', ...validationResult };
  }

  console.log(`\n✅ Phase "${phaseName}" completed successfully`);
  console.log(`   Outputs: ${validationResult.found.length}/${validationResult.expected.length}`);

  return {
    success: true,
    outputs: validationResult.found,
    summary: extractSummary(output)
  };
}

function buildGeminiPrompt(phaseName, phase, params) {
  const lines = [];

  lines.push(`You are a topical authority automation assistant. Execute the following scripts sequentially and report results.`);
  lines.push(``);
  lines.push(`**Phase**: ${phase.name}`);
  lines.push(`**Brand**: ${params.brand}`);
  lines.push(``);
  lines.push(`**Scripts to Execute**:`);
  lines.push(``);

  phase.scripts.forEach((script, idx) => {
    const cmd = `node ${script.file} ${interpolateArgs(script.args, params)}`;
    lines.push(`${idx + 1}. Script: ${script.file}`);
    lines.push(`   Command: ${cmd}`);
    lines.push(``);
  });

  lines.push(`**Instructions**:`);
  lines.push(`1. Execute each script in order using the Node.js runtime`);
  lines.push(`2. Wait for each script to complete before starting the next`);
  lines.push(`3. Capture stdout and stderr from each execution`);
  lines.push(`4. If a script fails, stop and report the error`);
  lines.push(`5. After all scripts succeed, report:`);
  lines.push(`   - Total execution time`);
  lines.push(`   - Summary statistics from each script`);
  lines.push(`   - Any warnings or errors encountered`);
  lines.push(`   - List of output files created`);
  lines.push(``);
  lines.push(`**Expected Outputs**:`);
  phase.outputs.forEach(output => {
    lines.push(`- ${interpolateArgs(output, params)}`);
  });
  lines.push(``);
  lines.push(`**Important**:`);
  lines.push(`- Use absolute paths from project root`);
  lines.push(`- Ensure all output directories exist (scripts create them)`);
  lines.push(`- Report success/failure for each script`);
  lines.push(`- Include key metrics in summary (e.g., keywords found, clusters created, etc.)`);
  lines.push(``);
  lines.push(`Begin execution now. Report progress as you go.`);

  return lines.join('\n');
}

function interpolateArgs(template, params) {
  let result = template;

  Object.entries(params).forEach(([key, value]) => {
    result = result.replace(new RegExp(`\\{${key}\\}`, 'g'), value);
  });

  return result;
}

function validatePhaseOutputs(phaseName, brand) {
  const phase = PHASES[phaseName];
  const expected = phase.outputs.map(output =>
    output.replace('{brand}', brand)
  );

  const found = [];
  const missing = [];

  expected.forEach(filePath => {
    const fullPath = path.join(process.cwd(), filePath);
    if (fs.existsSync(fullPath)) {
      found.push(filePath);
    } else {
      missing.push(filePath);
    }
  });

  return {
    success: missing.length === 0,
    expected: expected.length,
    found,
    missing
  };
}

function extractSummary(output) {
  // Extract key metrics from Gemini output
  const lines = output.split('\n');

  // Look for summary lines (lines with numbers and metrics)
  const summaryLines = lines.filter(line =>
    /✅|keywords|clusters|opportunities|gaps|health score/i.test(line)
  );

  return summaryLines.slice(0, 5).join(' | ') || 'Completed';
}

function getDefaultTopics(brand) {
  // Load from ICP profiles if available
  const icpFile = path.join(process.cwd(), 'brands', brand, 'content', '00-assets', 'icp-profiles.md');

  if (fs.existsSync(icpFile)) {
    const content = fs.readFileSync(icpFile, 'utf8');

    // Extract topics from ICP (simple heuristic)
    const topics = [];
    if (/automation/i.test(content)) topics.push('automation');
    if (/marketing/i.test(content)) topics.push('marketing');
    if (/content/i.test(content)) topics.push('content marketing');
    if (/ai/i.test(content)) topics.push('ai');
    if (/productivity/i.test(content)) topics.push('productivity');

    if (topics.length > 0) return topics.join(',');
  }

  // Fallback defaults by brand
  const defaults = {
    'ai.withjai': 'ai automation,content marketing,productivity tools',
    'enchantents': 'luxury glamping,eco-tourism,boutique hospitality',
    'xelite-one': 'executive coaching,leadership development,business strategy',
    'voxcoach.online': 'public speaking,voice coaching,communication skills'
  };

  return defaults[brand] || 'business,marketing,productivity';
}

function getDefaultSeedKeywords(brand) {
  // Load from business profile if available
  const profileFile = path.join(process.cwd(), 'brands', brand, 'content', '00-assets', 'business-profile.md');

  if (fs.existsSync(profileFile)) {
    const content = fs.readFileSync(profileFile, 'utf8');

    // Extract primary offering
    const offeringMatch = content.match(/Primary Offering[:\s]+([^\n]+)/i);
    if (offeringMatch) return offeringMatch[1].trim();
  }

  // Fallback defaults
  const defaults = {
    'ai.withjai': 'ai content automation,automated newsletter,content workflow',
    'enchantents': 'luxury glamping,glamping business,eco-luxury tourism',
    'xelite-one': 'executive coaching,leadership coaching,business coaching',
    'voxcoach.online': 'voice training,public speaking coaching,communication skills'
  };

  return defaults[brand] || 'business automation,productivity,marketing';
}

if (require.main === module) {
  try {
    main();
  } catch (err) {
    console.error('❌ Orchestrator failed:', err.message);
    console.error(err.stack);
    process.exit(1);
  }
}

module.exports = { runPhaseWithGemini, validatePhaseOutputs };
