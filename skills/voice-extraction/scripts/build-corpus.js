#!/usr/bin/env node

/**
 * build-corpus.js — Normalize and combine text sources into a single corpus
 *
 * Usage:
 *   node build-corpus.js <input1> [input2] ... [--output <file>] [--max-words <n>]
 *   cat raw.txt | node build-corpus.js --stdin --output corpus.txt
 *
 * Strips YAML frontmatter, normalizes whitespace, removes source markers,
 * and outputs clean text ready for voice analysis.
 */

const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
const inputs = [];
let output = null;
let maxWords = 0;
let useStdin = false;

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--output' || args[i] === '-o') {
    output = args[++i];
  } else if (args[i] === '--max-words') {
    maxWords = parseInt(args[++i]);
  } else if (args[i] === '--stdin') {
    useStdin = true;
  } else {
    inputs.push(args[i]);
  }
}

function stripFrontmatter(text) {
  if (text.startsWith('---')) {
    const end = text.indexOf('\n---', 3);
    if (end > 0) {
      return text.substring(end + 4).trimStart();
    }
  }
  return text;
}

function normalize(text) {
  return text
    .replace(/\r\n/g, '\n')           // normalize line endings
    .replace(/\n{4,}/g, '\n\n\n')     // collapse excessive blank lines
    .replace(/^\[source:.*\]$/gm, '') // remove source markers
    .replace(/^---$/gm, '')           // remove separator lines
    .trim();
}

function readInput(filepath) {
  const raw = fs.readFileSync(filepath, 'utf8');
  return stripFrontmatter(raw);
}

// Collect all text
let chunks = [];

if (useStdin) {
  const stdin = fs.readFileSync(0, 'utf8');
  chunks.push(normalize(stripFrontmatter(stdin)));
}

for (const input of inputs) {
  if (fs.existsSync(input)) {
    const stat = fs.statSync(input);
    if (stat.isDirectory()) {
      // Recursively read .md and .txt files
      const files = fs.readdirSync(input).filter(f =>
        /\.(md|txt|json)$/i.test(f)
      );
      for (const f of files) {
        chunks.push(`[from: ${f}]\n${normalize(readInput(path.join(input, f)))}`);
      }
    } else {
      chunks.push(normalize(readInput(input)));
    }
  } else {
    console.error(`Warning: ${input} not found, skipping`);
  }
}

let corpus = chunks.filter(c => c.length > 50).join('\n\n---\n\n');

// Word count and capping
const words = corpus.split(/\s+/);
const wordCount = words.length;

if (maxWords > 0 && wordCount > maxWords) {
  corpus = words.slice(0, maxWords).join(' ');
  console.error(`Capped corpus at ${maxWords} words (was ${wordCount})`);
}

// Stats
const sentences = corpus.split(/[.!?]+/).filter(s => s.trim().length > 0);
const avgSentenceLength = sentences.length > 0
  ? Math.round(corpus.split(/\s+/).length / sentences.length)
  : 0;

const stats = `
=== CORPUS STATS ===
Words: ${wordCount}
Sentences: ${sentences.length}
Avg sentence length: ${avgSentenceLength} words
Sources: ${inputs.length + (useStdin ? 1 : 0)}
===================
`;

// Output
if (output) {
  fs.writeFileSync(output, corpus);
  console.error(stats.trim());
  console.error(`Written to: ${output}`);
} else {
  process.stderr.write(stats);
  process.stdout.write(corpus);
}
