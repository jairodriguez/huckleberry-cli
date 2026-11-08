#!/usr/bin/env node
/**
 * Hook Generator for OpenClaw
 * Model stack: Anthropic Haiku (via ANTHROPIC_API_KEY)
 */

const fs = require('fs');
const path = require('path');

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

function parseArgs() {
  const args = process.argv.slice(2);
  const options = {};
  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith('--')) {
      const key = args[i].slice(2);
      const value = args[i + 1];
      if (value && !value.startsWith('--')) {
        options[key] = value;
        i++;
      } else {
        options[key] = true;
      }
    }
  }
  return options;
}

function loadContent(contentPath) {
  if (fs.existsSync(contentPath)) {
    return fs.readFileSync(contentPath, 'utf8');
  }
  return contentPath;
}

function loadICP(brand) {
  if (!brand) return null;
  
  const basePath = '/Users/Shared/clawd/newsletter/brands';
  const paths = [
    `${basePath}/${brand}/content/00-assets/icp-profile.md`,
    `${basePath}/${brand}/content/00-assets/icp-profiles.md`,
    `${basePath}/${brand}/ICP.md`
  ];
  
  for (const p of paths) {
    if (fs.existsSync(p)) {
      const content = fs.readFileSync(p, 'utf8');
      return parseICP(content);
    }
  }
  return null;
}

function parseICP(content) {
  const icp = { primary: '', painPoints: [], goals: [] };
  
  const primaryMatch = content.match(/Primary.*?:\s*([^\n]+)/i);
  if (primaryMatch) icp.primary = primaryMatch[1].trim();
  
  const painSection = content.match(/Pain Points[\s\S]*?(?=###|##|$)/i);
  if (painSection) {
    const bullets = painSection[0].match(/^[-*]\s+(.+)$/gm);
    if (bullets) {
      icp.painPoints = bullets.map(b => b.replace(/^[-*]\s+/, '')).slice(0, 5);
    }
  }
  
  const goalSection = content.match(/Business Goals[\s\S]*?(?=###|##|$)/i);
  if (goalSection) {
    const bullets = goalSection[0].match(/^[-*]\s+(.+)$/gm);
    if (bullets) {
      icp.goals = bullets.map(b => b.replace(/^[-*]\s+/, '')).slice(0, 3);
    }
  }
  
  return icp;
}

function loadPlatformHooks(platform) {
  const dbPath = path.join(__dirname, '../database', `${platform}-hooks.json`);
  if (!fs.existsSync(dbPath)) {
    throw new Error(`Database not found: ${platform}`);
  }
  return JSON.parse(fs.readFileSync(dbPath, 'utf8'));
}

async function callModel(model, prompt) {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'claude-3-haiku-20240307',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 1024
    })
  });
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`API error: ${error}`);
  }
  
  const data = await response.json();
  return data.content[0].text;
}

async function generateHooks(content, platform, count, icp) {
  console.log(`\nGenerating ${count} hooks with Claude Haiku...`);
  
  const db = loadPlatformHooks(platform);
  const examples = db.examples.slice(0, 5).map((ex, i) => 
    `${i+1}. "${ex.hook.substring(0, 70)}..." - ${ex.pattern}`
  ).join('\n');
  
  const icpText = icp ? `TARGET: ${icp.primary}\nPAINS: ${icp.painPoints.slice(0,3).join('; ')}` : '';
  
  const prompt = `Generate ${count} ${platform} hooks.

CONTENT:
${content.substring(0, 1800)}

PROVEN EXAMPLES:
${examples}
${icpText}

Output ONLY valid JSON array. No markdown, no explanation:
[{"hook":"...","pattern":"...","score":85},{"hook":"...","pattern":"...","score":82}...]`;
  
  const result = await callModel('haiku', prompt);
  
  // Try multiple extraction patterns
  let jsonStr = result;
  
  // Remove markdown code blocks
  jsonStr = jsonStr.replace(/```json\s*/gi, '').replace(/```\s*/gi, '');
  
  // Find array
  const arrayMatch = jsonStr.match(/\[[\s\S]*\]/);
  if (arrayMatch) {
    jsonStr = arrayMatch[0];
  }
  
  // Clean up common issues
  jsonStr = jsonStr.trim();
  
  try {
    return JSON.parse(jsonStr);
  } catch (e) {
    console.error('Raw output:', result.substring(0, 500));
    throw new Error(`JSON parse failed: ${e.message}`);
  }
}

function selectTopHooks(hooks, count) {
  console.log(`\nSelecting top ${count}...`);
  
  const scored = hooks.map(h => {
    let score = h.score || h.estimated_score || 70;
    const goodPatterns = ['Shocking', 'Data', 'Before/After', 'Contrarian'];
    if (goodPatterns.some(p => (h.pattern || '').includes(p))) score += 5;
    return { ...h, score };
  });
  
  return scored.sort((a, b) => b.score - a.score).slice(0, count);
}

async function main() {
  const args = parseArgs();
  
  if (!args.content || !args.platform) {
    console.log('Usage: node generate-hooks.js --content <path> --platform <twitter|linkedin> [--brand <brand>] [--count N]');
    process.exit(1);
  }
  
  if (!ANTHROPIC_API_KEY) {
    console.error('Error: ANTHROPIC_API_KEY not set');
    process.exit(1);
  }
  
  let contentPath = args.content;
  let content;
  
  if (contentPath.includes('icp-profile') || contentPath.includes('icp-profiles')) {
    console.log('Note: Using ICP context for sample content...');
    const icp = loadContent(contentPath);
    content = `ZeroClaw: Rust AI assistant. 3.4MB vs 28MB. Starts in 0.38s. 7.8MB RAM vs 1.5GB. 22 providers, 1017 tests. Missing: skills ecosystem. Target: ${icp.substring(0, 400)}`;
  } else {
    content = loadContent(contentPath);
  }
  
  const platform = args.platform;
  const brand = args.brand;
  const count = parseInt(args.count) || 3;
  
  const icp = brand ? loadICP(brand) : null;
  if (icp) {
    console.log(`✓ ICP: ${icp.primary || 'N/A'}`);
    console.log(`  Pains: ${icp.painPoints.length}, Goals: ${icp.goals.length}`);
  }
  
  const hooks = await generateHooks(content, platform, 12, icp);
  const topHooks = selectTopHooks(hooks, count);
  
  console.log('\n' + '='.repeat(50));
  console.log('TOP HOOKS:\n');
  topHooks.forEach((h, i) => {
    console.log(`${i+1}. [${h.score}/100] ${h.pattern}`);
    console.log(`   "${h.hook}"\n`);
  });
  
  const outputPath = `/tmp/hooks-${Date.now()}.json`;
  fs.writeFileSync(outputPath, JSON.stringify(topHooks, null, 2));
  console.log(`Saved: ${outputPath}`);
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
