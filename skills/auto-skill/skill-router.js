import fs from 'node:fs';
import path from 'node:path';

let _skillIndex = null;
let _skillIndexTime = 0;
const INDEX_TTL_MS = 5 * 60 * 1000;

function discoverSkillDirs(skillsRoot) {
  const dirs = [];
  try {
    for (const entry of fs.readdirSync(skillsRoot, { withFileTypes: true })) {
      if (entry.isDirectory()) {
        const skillFile = path.join(skillsRoot, entry.name, 'SKILL.md');
        if (fs.existsSync(skillFile)) {
          dirs.push({ name: entry.name, path: skillFile });
        }
      }
    }
  } catch {}
  return dirs;
}

function parseSkillMeta(skillPath, dirName) {
  try {
    const content = fs.readFileSync(skillPath, 'utf-8');
    let name = dirName;
    let description = '';
    let triggers = [];
    const fmMatch = content.match(/^---\n([\s\S]*?)\n---/);

    if (fmMatch) {
      const fm = fmMatch[1];
      const nameMatch = fm.match(/^name:\s*(.+)$/m);
      if (nameMatch) name = nameMatch[1].trim();

      const descMatch = fm.match(/^description:\s*([\s\S]*?)(?=\n(?:name|allowed-tools|category|tier|reads|writes|triggers|depends_on):|$)/m);
      if (descMatch) {
        description = descMatch[1].trim().replace(/^>\s*/gm, '').replace(/\n\s+/g, ' ').trim();
      }

      const triggerMatch = fm.match(/triggers:\s*\n((?:\s+- .+\n?)+)/m);
      if (triggerMatch) {
        triggers = triggerMatch[1].split('\n').map(l => l.replace(/^\s+-\s*/, '').trim()).filter(Boolean);
      }
    }

    const bodyWithoutFm = content.replace(/^---[\s\S]*?---\n*/, '');
    if (!description) {
      const lines = bodyWithoutFm.split('\n').filter(l => l.trim() && !l.startsWith('#'));
      description = lines.slice(0, 3).join(' ').replace(/[#*`]/g, '').trim().slice(0, 500);
    }

    if (triggers.length === 0) {
      const actMatch = bodyWithoutFm.match(/(?:Activation|Triggers?):?\s*(.+?)(?:\n|$)/i);
      if (actMatch) {
        const parts = actMatch[1].split(/[,"]/).map(t => t.replace(/[^a-z0-9\s-]/gi, '').trim()).filter(t => t.length > 3 && t.length < 60);
        triggers = parts;
      }
    }

    triggers = triggers.filter(t => !/^(triggers?|activation)$/i.test(t));

    const searchableBlob = `${name} ${triggers.join(' ')} ${description} ${bodyWithoutFm.slice(0, 2000)}`.toLowerCase();

    return { name, description, triggers, path: skillPath, searchableBlob };
  } catch {
    return null;
  }
}

export function buildSkillIndex(projectDir) {
  const now = Date.now();
  if (_skillIndex && (now - _skillIndexTime) < INDEX_TTL_MS) return _skillIndex;

  const seen = new Set();
  const index = [];
  const roots = [
    path.join(projectDir, '.agents', 'skills'),
    path.join(projectDir, '.claude', 'skills'),
  ];
  for (const root of roots) {
    const dirs = discoverSkillDirs(root);
    for (const dir of dirs) {
      if (seen.has(dir.name)) continue;
      seen.add(dir.name);
      const meta = parseSkillMeta(dir.path, dir.name);
      if (meta) index.push(meta);
    }
  }

  _skillIndex = index;
  _skillIndexTime = now;
  return index;
}

function tokenize(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(t => t.length > 2);
}

function extractBigrams(text) {
  const words = tokenize(text);
  const bigrams = new Set();
  for (let i = 0; i < words.length - 1; i++) {
    bigrams.add(`${words[i]} ${words[i + 1]}`);
  }
  return bigrams;
}

function scoreSkillMatch(userText, skill) {
  const lower = userText.toLowerCase();
  const userTokens = new Set(tokenize(userText));
  const userBigrams = extractBigrams(userText);

  let score = 0;

  for (const trigger of skill.triggers) {
    const triggerLower = trigger.toLowerCase();
    if (lower.includes(triggerLower)) {
      score += 0.5;
    } else {
      const triggerTokens = new Set(tokenize(trigger));
      let overlap = 0;
      for (const t of triggerTokens) { if (userTokens.has(t)) overlap++; }
      if (triggerTokens.size > 0 && overlap / triggerTokens.size > 0.5) {
        score += 0.25;
      }
    }
  }

  const nameWords = skill.name.replace(/-/g, ' ').toLowerCase();
  if (lower.includes(nameWords)) {
    score += 0.5;
  } else {
    const nameTokens = new Set(tokenize(skill.name));
    let overlap = 0;
    for (const t of userTokens) { if (nameTokens.has(t)) overlap++; }
    if (nameTokens.size > 0 && overlap / nameTokens.size > 0.5) {
      score += 0.2;
    }
  }

  const descTokens = new Set(tokenize(skill.description));
  let descHits = 0;
  for (const t of userTokens) { if (descTokens.has(t)) descHits++; }
  if (descTokens.size > 0) {
    const containment = descHits / userTokens.size;
    score += containment * 0.4;
  }

  const descBigrams = extractBigrams(skill.description);
  let bigramHits = 0;
  for (const bg of userBigrams) { if (descBigrams.has(bg)) bigramHits++; }
  if (userBigrams.size > 0) {
    score += (bigramHits / userBigrams.size) * 0.3;
  }

  const blobTokens = new Set(tokenize(skill.searchableBlob));
  let blobHits = 0;
  for (const t of userTokens) { if (blobTokens.has(t)) blobHits++; }
  if (userTokens.size > 0 && blobHits / userTokens.size > 0.5) {
    score += 0.05;
  }

  return Math.min(1, score);
}

export function findMatchingSkills(userText, projectDir, threshold = 0.6) {
  const index = buildSkillIndex(projectDir);
  const results = [];
  for (const skill of index) {
    const score = scoreSkillMatch(userText, skill);
    if (score >= threshold) {
      results.push({ name: skill.name, description: skill.description.slice(0, 200), path: skill.path, score });
    }
  }
  results.sort((a, b) => b.score - a.score);
  return results;
}

export function findBestMatch(userText, projectDir, threshold = 0.7) {
  const matches = findMatchingSkills(userText, projectDir, threshold);
  return matches.length > 0 ? matches[0] : null;
}

const TASK_PATTERNS = [
  /^(write|create|generate|build|make|draft|compose|publish|schedule|post|send|design|edit|fix|improve|optimize|audit|review|research|analyze|plan|launch|set up|configure)/i,
  /^(help me|can you|i need|i want|let's|we should|we need to)/i,
  /\b(blog|article|newsletter|email|social|tweet|post|landing page|seo|copy|content|video|image|brand|ad|campaign|launch|pricing|keyword|competitor)\b/i,
];

function looksLikeTaskRequest(text) {
  if (text.length < 10) return false;
  return TASK_PATTERNS.some(p => p.test(text));
}

export function routeSkills(userMessage, projectDir) {
  if (!looksLikeTaskRequest(userMessage)) return null;

  const autoLoadMatches = findMatchingSkills(userMessage, projectDir, 0.8);
  if (autoLoadMatches.length > 0) {
    return {
      action: 'auto-load',
      skills: autoLoadMatches,
      message: `High-confidence skill match. Auto-loading: ${autoLoadMatches.map(s => s.name).join(', ')}`,
    };
  }

  const suggestMatches = findMatchingSkills(userMessage, projectDir, 0.6);
  if (suggestMatches.length > 0 && suggestMatches.length <= 3) {
    return {
      action: 'suggest',
      skills: suggestMatches,
      message: `Relevant skills: ${suggestMatches.map(s => `${s.name} (${(s.score * 100).toFixed(0)}%)`).join(', ')}`,
    };
  }

  return null;
}

export { looksLikeTaskRequest, scoreSkillMatch };
