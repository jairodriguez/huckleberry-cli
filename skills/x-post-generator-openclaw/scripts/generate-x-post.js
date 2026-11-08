#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const BRAND_ROOTS = [
  './businesses',
];

function parseArgs() {
  const args = process.argv.slice(2);
  const opts = {};
  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith('--')) {
      const key = args[i].slice(2);
      const val = args[i + 1];
      if (val && !val.startsWith('--')) {
        opts[key] = val;
        i++;
      } else {
        opts[key] = true;
      }
    }
  }
  return opts;
}

function findFile(dir, candidates) {
  for (const name of candidates) {
    const p = path.join(dir, name);
    if (fs.existsSync(p)) return p;
  }
  for (const sub of fs.readdirSync(dir, { withFileTypes: true }).filter(d => d.isDirectory())) {
    const found = findFile(path.join(dir, sub.name), candidates);
    if (found) return found;
  }
  return null;
}

function resolveBrandDir(root, brand) {
  const direct = path.join(root, brand);
  if (fs.existsSync(direct)) return direct;
  for (const entry of fs.readdirSync(root, { withFileTypes: true }).filter(d => d.isDirectory())) {
    const candidate = path.join(entry.path || root, entry.name, brand);
    if (fs.existsSync(candidate)) return candidate;
  }
  return null;
}

function loadBrand(brand) {
  if (!brand) return null;
  for (const root of BRAND_ROOTS) {
    if (!fs.existsSync(root)) continue;
    const brandDir = resolveBrandDir(root, brand);
    if (!brandDir) continue;

    const result = { name: brand, dir: brandDir, voice: null, icp: null, pains: [], positioning: [], offer: null, evergreen: null };

    // Load voice-dna.md (priority), then voice-profile.md
    const voiceFile = findFile(brandDir, ['voice-dna.md', 'voice-profile.md', 'voice-guide.md']);
    if (voiceFile) {
      const content = fs.readFileSync(voiceFile, 'utf8');
      // Extract practical rules, NOT journaling patterns
      // We want: banned words, terminology, rhythm rules — NOT "staccato self-flagellation" or "cosmic whiplash" as primary modes
      const voiceRules = [];

      // Extract banned words
      const bannedSection = content.match(/Banned Words[\s\S]*?(?=\n##|\n###|$)/i);
      if (bannedSection) {
        const bannedWords = [...bannedSection[0].matchAll(/[-*]\s+(.+)/g)].map(m => m[1].trim()).slice(0, 10);
        if (bannedWords.length > 0) voiceRules.push(`Banned words: ${bannedWords.join(', ')}`);
      }

      // Extract core phrases (terminology)
      const phrasesSection = content.match(/Core Phases[\s\S]*?(?=\n###|$)/i) || content.match(/Must Use[\s\S]*?(?=\n###|$)/i);
      if (phrasesSection) {
        const phrases = [...phrasesSection[0].matchAll(/\|\s*"([^"]+)"/g)].map(m => m[1]).slice(0, 5);
        if (phrases.length > 0) voiceRules.push(`Natural vocabulary: ${phrases.join(', ')}`);
      }

      // Extract contrast pairs (use sparingly)
      const contrastSection = content.match(/Contrast Pairs[\s\S]*?(?=\n##|\n###|$)/i);
      if (contrastSection) {
        const pairs = [...contrastSection[0].matchAll(/-\s+(.+)/g)].map(m => m[1].trim()).slice(0, 4);
        if (pairs.length > 0) voiceRules.push(`Contrast pairs (use ONE per thread max): ${pairs.join('; ')}`);
      }

      // Build a practical voice summary
      voiceRules.push('Tone: direct, no hedging, conversational. Sound like a person explaining something to a peer over coffee.');
      voiceRules.push('Rhythm: vary sentence length. Short punchy lines for emphasis. Normal sentences for explanation. Avoid ALL-staccato fragments.');
      voiceRules.push('Use ONE physical detail or metaphor per thread as seasoning. Not every sentence needs a physical anchor.');

      result.voice = voiceRules.join('\n');
    }

    // Load evergreen.md from brand dir OR company root (walk up)
    let evergreenFile = findFile(brandDir, ['evergreen.md']);
    if (!evergreenFile) {
      // Walk up to find company-level evergreen.md
      let currentDir = brandDir;
      for (let i = 0; i < 4; i++) {
        const parent = path.dirname(currentDir);
        if (parent === currentDir) break;
        const candidate = path.join(parent, 'evergreen.md');
        if (fs.existsSync(candidate)) {
          evergreenFile = candidate;
          break;
        }
        currentDir = parent;
      }
    }
    if (evergreenFile) {
      const content = fs.readFileSync(evergreenFile, 'utf8');
      result.evergreen = content.slice(0, 5000);
      
      // Extract ICP - look for specific ICP description patterns
      const icpPatterns = [
        /Overwhelmed Operator[\s\S]*?(?=\n##|\n###|$)/i,
        /ICP[:\s]*([^\n]+)/i,
        /Primary.*?:\s*([^\n]+)/i,
        /Target Verticals[\s\S]*?(?=\n##|\n###|$)/i,
        /law firm.*?marketing agency.*?real estate/i,
      ];
      for (const pattern of icpPatterns) {
        const match = content.match(pattern);
        if (match) {
          result.icp = match[0].slice(0, 300).trim();
          break;
        }
      }
      
      // Extract pain points - look for Pain Pill / pain points sections
      const painPatterns = [
        /Pain Pill Positioning[\s\S]*?(?=\n##|\n###|$)/i,
        /pain points?[\s\S]*?(?=\n##|\n###|$)/i,
        /drowning in[\s\S]*?(?=\n##|\n###|$)/i,
        /20\+ AI tabs[\s\S]*?(?=\n##|\n###|$)/i,
        /zero systems in production[\s\S]*?(?=\n##|\n###|$)/i,
        /tool guilt[\s\S]*?(?=\n##|\n###|$)/i,
        /course fatigue[\s\S]*?(?=\n##|\n###|$)/i,
        /wiring part isn't[\s\S]*?(?=\n##|\n###|$)/i,
      ];
      for (const pattern of painPatterns) {
        const match = content.match(pattern);
        if (match) {
          const extracted = [...match[0].matchAll(/^[-*]\s+(.+)$/gm)].map(m => m[1]);
          if (extracted.length > 0) {
            result.pains = extracted.slice(0, 5);
            break;
          }
          // Also extract inline pain descriptions
          const inline = match[0].match(/([^.]*?(?:tab|tool|wiring|system|production|guilt|fatigue|bleed|delay|wire)[^.]*\.)/gi);
          if (inline) {
            result.pains = inline.slice(0, 5);
            break;
          }
        }
      }
      
      // If no pains found, use defaults from evergreen knowledge
      if (result.pains.length === 0) {
        result.pains = [
          '20+ AI tabs open with zero systems in production',
          'Tool guilt and course fatigue from buying 6+ tools that dont integrate',
          'The coding part is solved, the wiring part isnt - drowning in integrations',
          'Every week of delay costs real money - dollar bleed is measurable',
          'Needs order of operations, not more tools'
        ];
      }
      
      // Extract positioning angles
      const posPatterns = [
        /Positioning Angle[\s\S]*?(?=\n##|\n###|$)/gi,
        /Intelligence Multiplier[\s\S]*?(?=\n##|\n###|$)/i,
        /Order of Operations[\s\S]*?(?=\n##|\n###|$)/i,
        /Automate the Tedious[\s\S]*?(?=\n##|\n###|$)/i,
        /Pain Pill Positioning[\s\S]*?(?=\n##|\n###|$)/i,
        /Hacker-Farmer Identity[\s\S]*?(?=\n##|\n###|$)/i,
      ];
      for (const pattern of posPatterns) {
        const matches = content.match(pattern);
        if (matches && matches.length > 0) {
          result.positioning = matches.slice(0, 3).map(p => p.slice(0, 400));
          break;
        }
      }
      
      // Extract offer info
      const offerPatterns = [
        /Offer Stack[\s\S]*?(?=\n##|\n###|$)/i,
        /Tier 1:.*?Tier 2:.*?Tier 3:[\s\S]*?(?=\n##|\n###|$)/i,
        /\$1,500\/month[\s\S]*?\$5,000\/month/i,
        /Concierge.*?Build.*?Managed/i,
      ];
      for (const pattern of offerPatterns) {
        const match = content.match(pattern);
        if (match) {
          result.offer = match[0].slice(0, 500);
          break;
        }
      }
    }

    // Fallback: try icp-profile.md, audience.md if evergreen didn't give us ICP
    if (!result.icp) {
      const icpFile = findFile(brandDir, ['icp-profile.md', 'icp-profiles.md', 'audience.md']);
      if (icpFile) {
        const content = fs.readFileSync(icpFile, 'utf8');
        const primary = content.match(/Primary.*?:\s*([^\n]+)/i)?.[1]?.trim() || null;
        const pains = content.match(/Pain Points[\s\S]*?(?=###|##|$)/i);
        if (pains) {
          result.pains = [...pains[0].matchAll(/^[-*]\s+(.+)$/gm)].map(m => m[1]).slice(0, 3);
        }
        result.icp = primary;
      }
    }

    return result;
  }
  return null;
}

function loadHooks(brand) {
  const dbPath = path.join(__dirname, '..', 'database', 'twitter-hooks.json');
  if (!fs.existsSync(dbPath)) return [];
  try {
    const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
    const examples = (db.examples || []).slice(0, 8);
    return examples.map(e => ({
      hook: e.hook,
      pattern: e.pattern,
      score: e.engagement?.weightedScore || 0,
      why: e.why_it_works,
    }));
  } catch (_) {
    return [];
  }
}

function callGemini(prompt, timeoutMs = 30000) {
  const result = spawnSync('gemini', ['-m', 'gemini-2.5-flash-lite', '-o', 'text', '-p', prompt], {
    encoding: 'utf-8',
    maxBuffer: 10 * 1024 * 1024,
    timeout: timeoutMs
  });
  if (result.status !== 0) {
    const stderr = result.stderr || '';
    if (/quota|exhausted/i.test(stderr)) {
      throw new Error('QUOTA_EXHAUSTED: Gemini API quota exhausted');
    }
    if (result.signal === 'SIGTERM') {
      throw new Error('TIMEOUT: Gemini CLI timed out');
    }
    throw new Error(`Gemini CLI failed: ${stderr || 'exit ' + result.status}`);
  }
  return result.stdout.trim().replace(/^```(?:text|markdown)?\s*/i, '').replace(/\s*```$/, '');
}

function humanizeRegex(text) {
  if (!text) return '';
  return text
    .replace(/Additionally,?\s*/gi, '')
    .replace(/Furthermore,?\s*/gi, '')
    .replace(/Moreover,?\s*/gi, '')
    .replace(/In today's\s+\w+,?\s*/gi, '')
    .replace(/\bcrucial\b/gi, 'key')
    .replace(/\bpivotal\b/gi, 'important')
    .replace(/\blandscape\b/g, 'space')
    .replace(/\bdelve\b/gi, 'dig')
    .replace(/\bleverage\b/gi, 'use')
    .replace(/\bsynergy\b/gi, 'fit')
    .replace(/\brobust\b/gi, 'solid')
    .replace(/Most people think/gi, 'Some think')
    .replace(/Imagine if/gi, 'Consider')
    .replace(/—/g, ' - ')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/ +/g, ' ')
    .trim();
}

function selfScore(post, hook, brand) {
  const prompt = `Score this X post on a 0-100 scale. Be harsh.

POST:
${post}

HOOK USED: "${hook}"
BRAND: ${brand || 'none'}

Score each dimension 0-100:
- hook_strength: Does the opening stop the scroll?
- voice_authenticity: Does it sound human, not AI?
- specificity: Concrete details vs vague claims?
- value_density: Useful info per character?
- algorithm_fit: 2026 X algo friendly (no links, reply-bait CTA)?

Return ONLY valid JSON:
{"hook_strength":N,"voice_authenticity":N,"specificity":N,"value_density":N,"algorithm_fit":N,"total":N,"verdict":"PASS|REWRITE","reason":"one sentence"}`;

  try {
    const raw = callGemini(prompt, 15000);
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (jsonMatch) return JSON.parse(jsonMatch[0]);
  } catch (err) {
    console.log(`  Self-scoring failed (${err.message}), using heuristic...`);
  }
  
  // Heuristic fallback scoring
  const isThread = post.includes('---');
  const posts = isThread ? post.split('---').map(p => p.trim()) : [post];
  const firstPost = posts[0];
  const hasLink = /https?:\/\//.test(post);
  const hasEmDash = /—/.test(post);
  const hasAiVocab = /additionally|furthermore|moreover|crucial|pivotal|landscape|delve|leverage|synergy|robust|seamless|game.changer|innovative|utilize/gi.test(post);
  const hasRuleOfThree = /\w+,\s+\w+,\s+and\s+\w+/.test(post) || /\w+,\s+\w+,\s+\w+\./.test(post);
  const hasFirstPerson = /\b(I|my|me)\b/i.test(post);
  const hasNumbers = /\d+(?:,\d+)*(?:\.\d+)?(?:%|K|M|B|x)?/.test(post);
  const hasSpecifics = /(law firm|real estate|marketing agency|34 units|27 drafts|3 weeks|8.75M|AI Employee|Concierge|calculator)/i.test(post);
  const hasPhysicalAnchor = /(mud|rain|coffee|boots|cloud forest|keyboard|desk|farm|harvest|dirt|code)/i.test(post);
  const hasWhiplash = /(mud|rain|coffee|boots|desk|farm|dirt)[^.]*?(orchestrat|wire|system|agent|AI|model|code)/i.test(post);
  const endsWithQuestion = /\?$/.test(post.trim());
  
  let hookStrength = 50;
  let voiceAuth = 50;
  let specificity = 50;
  let valueDensity = 50;
  let algoFit = 50;
  
  // Hook strength
  if (firstPost.length < 100 && firstPost.length > 20) hookStrength += 10;
  if (/20 tabs|zero systems|AI purgatory|dollar bleed/i.test(firstPost)) hookStrength += 15;
  if (hasAiVocab) hookStrength -= 10;
  if (hasRuleOfThree) hookStrength -= 5;
  
  // Voice authenticity
  if (hasFirstPerson) voiceAuth += 10;
  if (hasPhysicalAnchor) voiceAuth += 10;
  if (hasWhiplash) voiceAuth += 15;
  if (hasEmDash) voiceAuth -= 20;
  if (hasAiVocab) voiceAuth -= 15;
  if (hasRuleOfThree) voiceAuth -= 10;
  
  // Specificity
  if (hasNumbers) specificity += 15;
  if (hasSpecifics) specificity += 15;
  if (/your|their|our/.test(post) && !/you|your|their|our/.test(firstPost)) specificity -= 5;
  
  // Value density
  if (post.length > 200 && posts.length >= 4) valueDensity += 10;
  if (hasSpecifics) valueDensity += 10;
  if (hasAiVocab) valueDensity -= 10;
  if (hasRuleOfThree) valueDensity -= 5;
  
  // Algorithm fit
  if (!hasLink) algoFit += 15;
  if (hasEmDash) algoFit -= 10;
  if (endsWithQuestion || /reply|⬇️/.test(post)) algoFit += 10;
  if (hasRuleOfThree) algoFit -= 5;
  
  const dims = {hook_strength: hookStrength, voice_authenticity: voiceAuth, specificity, value_density: valueDensity, algorithm_fit: algoFit};
  for (const k of Object.keys(dims)) {
    dims[k] = Math.max(0, Math.min(100, dims[k]));
  }
  
  const total = Math.round(Object.values(dims).reduce((a,b) => a+b, 0) / 5);
  const verdict = total >= 70 ? 'PASS' : 'REWRITE';
  const reason = verdict === 'PASS' ? 'Heuristic pass' : 'Heuristic fail - needs work';
  
  return { ...dims, total, verdict, reason };
}

function buildPrompt(opts, brand, provenHooks) {
  const isThread = opts.thread || opts.format === 'thread';
  const ctaOptions = {
    engagement: ["What's your experience?", "What did I miss?", "Ever tried this?"],
    'blog-traffic': ["DM for the full post", "Reply for the link"],
    authority: ["Save this for later", "Bookmark this"],
  };
  const cta = (ctaOptions[opts.objective || 'engagement'] || ctaOptions.engagement)[0];

  const targetAudience = brand?.icp || 'Overwhelmed Operator — law firm / marketing agency / real estate agency owner ($300K-$3M), 1-15 employees, low-medium technical, 20+ AI tabs open with zero systems in production, drowning in tool guilt and course fatigue, needs order of operations not more tools';
  const pains = brand?.pains?.join(', ') || '20+ AI tabs open, zero systems in production, tool guilt, course fatigue, no order of operations, wiring not solved';
  const voice = brand?.voice || null;
  const positioning = brand?.positioning?.join('\n') || "Angle 1: Intelligence Multiplier (AI amplifies, doesn't replace). Angle 2: Order of Operations (stop buying tools, start deploying systems). Angle 3: Automate the Tedious to Inhabit the Miraculous (mission). Angle 4: Pain Pill Positioning (every headline must pass the pain pill test — what does this save them from?). Angle 5: Hacker-Farmer Identity (generalist who refuses to be a slave, buy back the forest, fuck-you money).";
  const offer = brand?.evergreen ? 'AI Employee 3-tier: Concierge $1.5K/mo → Build $999+$2K/mo → Managed $5K/mo. Calculator at /calc/ measures dollar bleed.' : '';

  let prompt = `You are writing an X/Twitter thread that delivers REAL VALUE to the reader. Not poetry. Not a brand voice exercise. A thread someone reads and thinks "I learned something" or "I need to save this."

VALUE FIRST. The reader must gain a concrete insight, framework, or perspective they didn't have before. If a post doesn't teach the reader something, cut it.

Write ${isThread ? 'a THREAD of 3-6 posts. ONLY as many posts as the insight requires. Never pad. A 3-post thread that nails the insight beats a 7-post thread with filler. Every post must earn its place.' : 'a single post'}.

FORMATTING: Use blank lines between thoughts for readability. People scroll fast on X. Make it scannable. No walls of text. No haiku-style one-word-per-line fragments unless it's a deliberate punch.

HOOK: "${opts.hook}"
TOPIC: ${opts.topic}
AUDIENCE (ICP): ${targetAudience}
CORE PAIN POINTS: ${pains}
POSITIONING ANGLES (must align with one):
${positioning}
OBJECTIVE: ${opts.objective || 'engagement'}`;

  if (voice) {
    prompt += `\n\nVOICE RULES (apply as seasoning, NOT as the main structure. Reader value comes first):\n${voice}`;
  }

  if (provenHooks.length > 0) {
    prompt += '\n\nPROVEN PATTERNS THAT WORK (study the style, don\'t copy):';
    for (const h of provenHooks.slice(0, 4)) {
      prompt += `\n- [${h.pattern}] "${h.hook.slice(0, 120)}..." (${h.score} engagement) — ${h.why}`;
    }
  }

  if (isThread) {
    prompt += `

THREAD STRUCTURE (value-driven):
- Post 1: The hook (sharp, specific, must standalone)
- Post 2-N: Deliver the insight. Each post adds NEW information the reader didn't have before.
  Use examples, numbers, comparisons, contrarian takes. Explain WHY, not just WHAT.
- Final post: Land the takeaway. What should the reader do or think differently now?
- End when the value is delivered. Don't add filler posts.

Separate each post with "---"`;
  } else {
    prompt += `

SINGLE POST STRUCTURE:
- Open with the hook (tighten if needed)
- 1-2 sentences expanding the insight with a specific detail
- End with the CTA
- Keep under 280 characters`;
  }

  prompt += `

HARD RULES (voice-dna.md enforced):
- NO external URLs (30-60% reach penalty) — calculator link goes in REPLY tweet only
- NO "Additionally", "Furthermore", "Moreover", "crucial", "pivotal", "landscape", "delve", "leverage", "synergy", "robust", "seamless", "game-changer", "innovative", "utilize"
- NO em dashes (—) — use periods, semicolons, or short dashes
- NO "Most people think", "Imagine if", "Picture this", "Let's dive in"
- NO rule-of-three lists
- NO generic predictions ("When X, Y follows", "The shift is clear")
- NO marketing clichés ("ride the wave", "canary in the coal mine", "governance wall got a door")
- NO CTA posts ("Link in reply", "What's your experience", "Save this")
- NO pricing dumps or offer pitches — the thread delivers insight, not a sales pitch
- NO padding — if a post doesn't add unique value, it shouldn't exist
- First-person "I" where natural — confessional tone
- Specific numbers over vague claims (34 units, $8.75M MXN, 27 drafts, 3 weeks → hours)
- Short punchy lines with white space — staccato fragments allowed
- Use line breaks for rhythm, not walls of text
- Physical anchor before abstract claim (Rule 5: mud on boots → orchestration layer evaporated)
- Whiplash pivot: start grounded, end cosmic with NO transition words (Rule 3)
- End with unanswered question you genuinely wrestle with (Rule 4)
- Contrast pairs: Physical vs Digital, Farm vs Tech, Dirt vs Code, Freedom vs Wage slavery
- Sound like a person talking, not a blog post
- ${opts.objective === 'blog-traffic' ? 'Tease, don\'t reveal everything. DM for link.' : 'Reveal 90-95% of value. Be generous.'}

Return ONLY the post text. No explanations, no labels, no meta-commentary.`;

  return prompt;
}

function main() {
  const args = parseArgs();
  if (!args.hook || !args.topic) {
    console.log('Usage: node generate-x-post.js --hook "..." --topic "..." [--brand name] [--objective engagement|blog-traffic|authority] [--format single|thread] [--thread]');
    process.exit(1);
  }

  const brand = loadBrand(args.brand);
  const provenHooks = loadHooks(args.brand);

  console.log(`Brand: ${brand?.name || 'none'}`);
  console.log(`ICP: ${brand?.icp || 'generic'}`);
  console.log(`Voice: ${brand?.voice ? 'loaded' : 'none'}`);
  console.log(`Proven hooks: ${provenHooks.length}`);
  console.log(`Format: ${args.thread || args.format === 'thread' ? 'thread' : 'single'}`);

  const prompt = buildPrompt(args, brand, provenHooks);

  console.log('\nGenerating...');
  let raw;
  try {
    raw = callGemini(prompt);
  } catch (err) {
    console.error('Generation failed:', err.message);
    process.exit(1);
  }

  const post = humanizeRegex(raw);
  if (!post || post.length === 0) {
    console.error('Empty post generated');
    process.exit(1);
  }

  console.log('\n' + '='.repeat(50));
  console.log('DRAFT POST:\n');
  console.log(post);
  console.log('\n' + '-'.repeat(50));

  const isThread = args.thread || args.format === 'thread';
  if (!isThread) {
    console.log(`Characters: ${post.length}/280`);
  } else {
    const parts = post.split('---');
    console.log(`Thread posts: ${parts.length}`);
    parts.forEach((p, i) => console.log(`  Post ${i + 1}: ${p.trim().length} chars`));
  }

  console.log('\nSelf-scoring...');
  const score = selfScore(post, args.hook, args.brand);
  console.log(`Score: ${score.total}/100`);
  console.log(`Verdict: ${score.verdict}`);
  if (score.reason) console.log(`Reason: ${score.reason}`);
  if (score.hook_strength) console.log(`  hook_strength: ${score.hook_strength}`);
  if (score.voice_authenticity) console.log(`  voice_authenticity: ${score.voice_authenticity}`);
  if (score.specificity) console.log(`  specificity: ${score.specificity}`);
  if (score.value_density) console.log(`  value_density: ${score.value_density}`);
  if (score.algorithm_fit) console.log(`  algorithm_fit: ${score.algorithm_fit}`);
  console.log('='.repeat(50));

  const out = `/tmp/xpost-${Date.now()}.txt`;
  const metaOut = out.replace('.txt', '.json');
  fs.writeFileSync(out, post);
  fs.writeFileSync(metaOut, JSON.stringify({ post, hook: args.hook, topic: args.topic, brand: args.brand, format: isThread ? 'thread' : 'single', score }, null, 2));
  console.log(`\nPost saved: ${out}`);
  console.log(`Meta saved: ${metaOut}`);

  if (score.verdict === 'REWRITE') {
    console.log('\n⚠ Self-score below threshold. Agent should run humanizer + quality-gate before presenting.');
    process.exit(2);
  }
}

main();
