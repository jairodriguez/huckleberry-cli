#!/usr/bin/env node
// Huckleberry skill sync — copies curated skills from the master library into
// the npm package's skills/ directory, ready to publish.
// Sources, in priority order:
//   1. ~/.claude/skills/<name>
//   2. workspace .claude/skills/<name> (e.g. impeccable)
//   3. kimaki bundled skills (~/.npm/_npx/*/node_modules/kimaki/skills/<name>, e.g. zele)
//   4. in-package huckleberry/skills/<name> (doctor skills — never overwritten)
// Machine-specific paths are rewritten to portable form during copy.
// Run from the huckleberry/ package root: node scripts/sync-skills.mjs [--check]

import { cpSync, existsSync, mkdirSync, readdirSync, statSync, rmSync, writeFileSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { homedir } from "node:os";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const SKILLS_DIR = join(ROOT, "skills");
const MANIFEST = join(SKILLS_DIR, "manifest.json");
const HOME = homedir();
const MASTER = join(HOME, ".claude", "skills");
const WORKSPACE = join(HOME, "clawd", ".claude", "skills");

function kimakiSkillsDir() {
  try {
    const npxRoot = join(HOME, ".npm", "_npx");
    for (const hash of readdirSync(npxRoot)) {
      const p = join(npxRoot, hash, "node_modules", "kimaki", "skills");
      if (existsSync(p)) return p;
    }
  } catch {}
  return null;
}
const KIMAKI_SKILLS = kimakiSkillsDir();

const EXCLUDE = (name) => name === "node_modules" || name === ".git" || name === ".DS_Store" || name.endsWith(".log");
const TEXT_RE = /\.(md|txt|mjs|js|json|sh|yaml|yml)$/;

// Machine-specific → portable rewrites applied to every shipped text file
function portableRewrite(txt) {
  return txt
    .replaceAll("/Users/clawdbot/clawd/", "./")
    .replaceAll("/Users/clawdbot/.claude/skills/", "./")
    .replaceAll("/Users/clawdbot/Library/", "$HOME/Library/")
    .replaceAll("/Users/clawdbot/.config/", "$HOME/.config/")
    .replaceAll("/Users/clawdbot/.claude/", "$HOME/.claude/")
    .replaceAll("/Users/clawdbot/", "~/");
}

const manifest = JSON.parse(readFileSync(MANIFEST, "utf-8"));
const allSkills = [...new Set(Object.values(manifest.packs).flat())];

let copied = 0, keptInPkg = 0, missing = [], lintHits = [];

function findSource(name) {
  for (const dir of [MASTER, WORKSPACE, KIMAKI_SKILLS]) {
    if (!dir) continue;
    const p = join(dir, name);
    if (existsSync(p)) return p;
  }
  const inPkg = join(SKILLS_DIR, name);
  if (existsSync(inPkg)) return inPkg;
  return null;
}

function walkAndRewrite(dir) {
  for (const entry of readdirSync(dir)) {
    if (EXCLUDE(entry)) continue;
    const fp = join(dir, entry);
    if (statSync(fp).isDirectory()) { walkAndRewrite(fp); continue; }
    if (!TEXT_RE.test(entry)) continue;
    const txt = readFileSync(fp, "utf-8");
    const fixed = portableRewrite(txt);
    if (fixed !== txt) writeFileSync(fp, fixed, "utf-8");
    if (/\/Users\/clawdbot/.test(fixed)) lintHits.push(fp.replace(SKILLS_DIR + "/", ""));
  }
}

function copyClean(src, dst) {
  rmSync(dst, { recursive: true, force: true });
  mkdirSync(dirname(dst), { recursive: true });
  cpSync(src, dst, { 
    recursive: true, 
    filter: (s) => {
      const base = s.split("/").pop();
      if (EXCLUDE(base)) return false;
      // Exclude nested node_modules and .git inside skills
      if (s.includes("/node_modules/") || s.includes("/.git/")) return false;
      return true;
    }
  });
  walkAndRewrite(dst);
}

for (const name of allSkills) {
  const src = findSource(name);
  const dst = join(SKILLS_DIR, name);
  if (!src) { missing.push(name); continue; }
  if (src === dst) {
    // in-package skill: still run the portable rewrite on first import
    walkAndRewrite(dst);
    keptInPkg++;
    continue;
  }
  if (process.argv.includes("--check")) {
    const srcMtime = statSync(join(src, "SKILL.md")).mtimeMs;
    const dstSkill = join(dst, "SKILL.md");
    if (!existsSync(dstSkill) || statSync(dstSkill).mtimeMs < srcMtime) console.log(`  STALE  ${name}`);
    continue;
  }
  copyClean(src, dst);
  copied++;
}

writeFileSync(join(SKILLS_DIR, "lint-report.txt"), lintHits.join("\n") + "\n");
console.log(`\n  Synced: ${copied} copied, ${keptInPkg} in-package kept, ${missing.length} missing`);
if (lintHits.length) console.log(`  ⚠ Portability lint: ${lintHits.length} files still contain machine paths (skills/lint-report.txt)`);
else console.log("  Portability lint: clean");
if (missing.length) { console.log(`  Missing sources: ${missing.join(", ")}`); process.exit(1); }
console.log("  OK");
