import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { buildSkillIndex, scoreSkillMatch } from './skill-router.js';

export function findDuplicateSkill(projectDir, candidateName, candidateDescription, threshold = 0.5) {
  const index = buildSkillIndex(projectDir);
  const candidateText = `${candidateName} ${candidateDescription}`;

  let bestMatch = null;
  let bestScore = 0;

  for (const skill of index) {
    const score = scoreSkillMatch(candidateText, skill);
    if (score > bestScore) {
      bestScore = score;
      bestMatch = skill;
    }
  }

  if (bestScore >= threshold && bestMatch) {
    return { skill: bestMatch, score: bestScore, action: 'improve' };
  }
  return { skill: null, score: bestScore, action: 'create' };
}

export function improveSkill(skillPath, correction) {
  if (!fs.existsSync(skillPath)) return false;
  const content = fs.readFileSync(skillPath, 'utf-8');

  if (content.includes('## Anti-Patterns')) {
    const antiPatternEntry = `
| ${correction.replace(/\|/g, '\\|').slice(0, 100)} | Repeated correction from user | See above fix |
`;
    const updated = content.replace(
      /## Anti-Patterns\n/,
      `## Anti-Patterns\n${antiPatternEntry}\n`
    );
    fs.writeFileSync(skillPath, updated, 'utf-8');
  } else {
    const antiPatternSection = `

## Anti-Patterns

| Mistake | Why Wrong | Fix |
|---------|-----------|-----|
| ${correction.replace(/\|/g, '\\|').slice(0, 100)} | Repeated correction from user | See above fix |
`;
    const updated = content + antiPatternSection;
    fs.writeFileSync(skillPath, updated, 'utf-8');
  }
  return true;
}

export function gitCommitSkillChange(projectDir, skillName, message) {
  try {
    const skillPath = findSkillPath(projectDir, skillName);
    if (!skillPath) return false;

    execSync(`git add "${skillPath}"`, { cwd: projectDir, stdio: 'pipe' });

    const changelogPath = path.join(path.dirname(skillPath), 'CHANGELOG.md');
    const now = new Date().toISOString();
    const changelogEntry = `\n## ${now}\n- ${message}\n`;
    if (fs.existsSync(changelogPath)) {
      fs.appendFileSync(changelogPath, changelogEntry, 'utf-8');
    } else {
      fs.writeFileSync(changelogPath, `# Changelog for ${skillName}\n${changelogEntry}`, 'utf-8');
    }

    execSync(`git add "${changelogPath}"`, { cwd: projectDir, stdio: 'pipe' });

    const safeMessage = message.replace(/"/g, '\\"').slice(0, 200);
    execSync(`git commit -m "skill(${skillName}): ${safeMessage}"`, {
      cwd: projectDir,
      stdio: 'pipe',
    });

    return true;
  } catch (e) {
    console.error('[auto-skill] git commit failed:', e.message);
    return false;
  }
}

function findSkillPath(projectDir, skillName) {
  const candidates = [
    path.join(projectDir, '.agents', 'skills', skillName, 'SKILL.md'),
    path.join(projectDir, '.claude', 'skills', skillName, 'SKILL.md'),
  ];
  for (const p of candidates) {
    if (fs.existsSync(p)) return p;
  }
  return null;
}

export { findSkillPath };
