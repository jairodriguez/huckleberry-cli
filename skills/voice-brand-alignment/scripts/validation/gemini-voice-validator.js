#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
const contentPath = args[0];
const brand = args[1] || 'ai.withjai';
const checks = args[2] || 'ai-slop,voice-patterns,icp-alignment';

if (!contentPath || !fs.existsSync(contentPath)) {
  console.error('Usage: node scripts/validation/gemini-voice-validator.js <contentPath> <brand> [checks]');
  process.exit(1);
}

const content = fs.readFileSync(contentPath, 'utf-8');
const checkList = checks.split(',');

const issues = [];

if (checkList.includes('ai-slop')) {
  const slopPatterns = [
    { pattern: /\bI'd love to\b/i, severity: 'warning', label: 'excessive-politeness' },
    { pattern: /\bIn today's digital\s+(age|world|landscape)\b/i, severity: 'critical', label: 'cliche-opening' },
    { pattern: /\bit is important to note\b/i, severity: 'warning', label: 'hedging' },
    { pattern: /\bthis is why\b/i, severity: 'info', label: 'weak-transition' },
    { pattern: /\bwhen it comes to\b/i, severity: 'warning', label: 'wordy-intro' },
    { pattern: /\bin the world of\b/i, severity: 'critical', label: 'cliche-phrase' },
    { pattern: /\bthe key to\b/i, severity: 'info', label: 'weak-opener' },
    { pattern: /\bultimately\b/i, severity: 'info', label: 'filler-word' },
    { pattern: /\bessentially\b/i, severity: 'info', label: 'filler-word' },
    { pattern: /\bbasically\b/i, severity: 'info', label: 'filler-word' },
    { pattern: /\bunlock\s+(your\s+)?(potential|success|growth)\b/i, severity: 'critical', label: 'buzzword' },
    { pattern: /\bgame[-\s]changer\b/i, severity: 'critical', label: 'overused-term' },
    { pattern: /\brevolutioniz(?:e|ing)\b/i, severity: 'critical', label: 'hyperbole' },
    { pattern: /\btransformative\b/i, severity: 'warning', label: 'vague-claim' },
    { pattern: /\bin this article, we will\b/i, severity: 'warning', label: 'robust-intro' },
    { pattern: /\bdive (?:into|deep)\b/i, severity: 'warning', label: 'cliche-phrase' },
    { pattern: /\blet's (?:dive|explore|take a look)\b/i, severity: 'warning', label: 'robust-transition' },
    { pattern: /\bin order to\b/i, severity: 'info', label: 'wordy-phrase' },
    { pattern: /\blook no further\b/i, severity: 'critical', label: 'cliche-cta' },
    { pattern: /\bIf you're (?:looking|searching)\b/i, severity: 'warning', label: 'generic-opener' },
  ];

  const lines = content.split('\n');
  for (let i = 0; i < lines.length; i++) {
    for (const sp of slopPatterns) {
      if (sp.pattern.test(lines[i])) {
        const match = lines[i].match(sp.pattern);
        issues.push({
          severity: sp.severity,
          category: 'ai-slop',
          pattern: sp.label,
          issue: `Found '${match[0]}' in paragraph ${i + 1}`,
          line: i + 1,
        });
      }
    }
  }
}

if (checkList.includes('voice-patterns')) {
  const voiceIssues = [
    { pattern: /\bwe believe\b/i, severity: 'info', label: 'generic-opinion' },
    { pattern: /\bI think\b/i, severity: 'warning', label: 'weak-stance' },
  ];
  const lines = content.split('\n');
  for (let i = 0; i < lines.length; i++) {
    for (const vp of voiceIssues) {
      if (vp.pattern.test(lines[i])) {
        const match = lines[i].match(vp.pattern);
        issues.push({
          severity: vp.severity,
          category: 'voice-patterns',
          pattern: vp.label,
          issue: `Found '${match[0]}' in paragraph ${i + 1}`,
          line: i + 1,
        });
      }
    }
  }
}

const criticalCount = issues.filter(i => i.severity === 'critical').length;
const warningCount = issues.filter(i => i.severity === 'warning').length;

const score = Math.max(0, Math.min(10, 10 - (criticalCount * 1.5) - (warningCount * 0.3)));

const result = {
  score,
  issues,
  summary: `${issues.length} issues found: ${criticalCount} critical, ${warningCount} warnings, ${issues.length - criticalCount - warningCount} info`,
};

console.log(JSON.stringify(result, null, 2));

if (criticalCount > 0) process.exitCode = 1;