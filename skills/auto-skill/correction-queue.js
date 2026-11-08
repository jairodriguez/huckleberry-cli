import fs from 'node:fs';
import path from 'node:path';

const QUEUE_FILE = 'memory/skill-queue.md';
const INDEX_FILE = 'memory/skill-index.json';

function ensureQueueFile(projectDir) {
  const queuePath = path.join(projectDir, QUEUE_FILE);
  if (!fs.existsSync(queuePath)) {
    const header = `# Skill Queue
# Auto-managed by auto-skill system. Do not edit manually.
# Status values: pending, pending-approval, processing, done, rejected

`;
    fs.mkdirSync(path.dirname(queuePath), { recursive: true });
    fs.writeFileSync(queuePath, header, 'utf-8');
  }
  return queuePath;
}

export function queueCorrection(projectDir, correctionText, context = '') {
  const queuePath = ensureQueueFile(projectDir);
  const now = new Date().toISOString();
  const entry = `
## Correction — ${now}
- **status:** pending
- **type:** correction
- **text:** ${correctionText.replace(/\n/g, ' ').slice(0, 500)}
- **context:** ${context.replace(/\n/g, ' ').slice(0, 300) || 'none'}
- **queued:** ${now}

`;
  fs.appendFileSync(queuePath, entry, 'utf-8');
  return true;
}

export function queueRepetition(projectDir, pattern, count, context = '') {
  const queuePath = ensureQueueFile(projectDir);
  const now = new Date().toISOString();
  const entry = `
## Repetition — ${now}
- **status:** pending-approval
- **type:** repetition
- **pattern:** ${pattern.replace(/\n/g, ' ').slice(0, 500)}
- **count:** ${count}
- **context:** ${context.replace(/\n/g, ' ').slice(0, 300) || 'none'}
- **queued:** ${now}

`;
  fs.appendFileSync(queuePath, entry, 'utf-8');
  return true;
}

export function readQueue(projectDir) {
  const queuePath = path.join(projectDir, QUEUE_FILE);
  if (!fs.existsSync(queuePath)) return [];
  const content = fs.readFileSync(queuePath, 'utf-8');
  const entries = [];
  const sections = content.split(/^## /m).filter(Boolean);
  for (const section of sections) {
    if (section.startsWith('#') || section.startsWith('Skill Queue')) continue;
    const lines = section.split('\n');
    const header = lines[0];
    const props = {};
    for (const line of lines.slice(1)) {
      const match = line.match(/^- \*\*(\w+):\*\*\s*(.+)/);
      if (match) props[match[1]] = match[2].trim();
    }
    if (props.status && props.status !== 'done' && props.status !== 'rejected') {
      entries.push({
        header,
        ...props,
        rawSection: section,
      });
    }
  }
  return entries;
}

export function markQueueEntryDone(projectDir, header) {
  const queuePath = path.join(projectDir, QUEUE_FILE);
  if (!fs.existsSync(queuePath)) return false;
  let content = fs.readFileSync(queuePath, 'utf-8');
  const escapedHeader = header.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(- \\*\\*status:\\*\\*\\s*)(pending|pending-approval|processing)(\\n.*${escapedHeader.slice(0, 30)})`, 's');
  content = content.replace(
    new RegExp(`## ${escapedHeader.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'g'),
    `## ${header}`
  );
  const entryRegex = new RegExp(
    `## ${escapedHeader}[^#]*?- \\*\\*status:\\*\\*\\s*\\w+`,
    's'
  );
  content = content.replace(
    entryRegex,
    (match) => match.replace(/- \*\*status:\*\*\s*\w+/, `- **status:** done`)
  );
  fs.writeFileSync(queuePath, content, 'utf-8');
  return true;
}

export { QUEUE_FILE, INDEX_FILE };
