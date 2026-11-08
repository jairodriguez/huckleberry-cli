#!/usr/bin/env node
/**
 * golden runner — executes golden tasks through a harness adapter with
 * machine-checkable pass criteria + telemetry.
 *
 * Usage:
 *   node tests/golden/runner.js --adapter opencode [--filter agc-01] [--limit N] [--outDir DIR]
 *   node bin/huckleberry.js golden run --adapter opencode   (same thing via CLI)
 *
 * Sandbox: set HUCKLEBERRY_HOME to redirect state; HUCKLEBERRY_TEST=1 suppresses
 * service loading. DeepSeek calls require DEEPSEEK_API_KEY (budget: ≤50 calls).
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { Telemetry } from "../../src/harness/telemetry.js";
import { get, listIds, loadDefault } from "../../src/harness/registry.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const GOLDEN_DIR = __dirname;

// ---------- prompt + checks (must be above main) ----------

function buildSystem(manifest) {
  return `You are an operations agent for ${manifest.client}. Follow the client's controls: approvals before automation; never assume venue availability; never commit deposits/contracts/refunds without owner approval; human takeover for complaints and time-sensitive issues. Be concrete and complete. Output plain text (markdown allowed).`;
}

function buildPrompt(t) {
  return `${t.input}\n\nContext: ${t.context}\n\nDeliverable: ${t.expectedArtifacts.join("; ")}`;
}

/**
 * Machine-checkable pass criteria evaluation.
 * Numeric matching is format-tolerant: "$2,467.50" and "2467.50" both satisfy a
 * "2467.50" requirement, since models format currency inconsistently.
 * @returns {{pass:boolean, failures:string[]}}
 */
function checkTask(t, result) {
  const failures = [];
  if (result.status !== "ok") return { pass: false, failures: [`adapter status: ${result.status} — ${result.error || "no error given"}`] };
  const c = t.passCriteria || {};
  const out = result.output || "";
  const norm = normalize(out); // lowercase, strip thousands separators, unify currency spacing
  if (c.minLength && out.length < c.minLength) failures.push(`output ${out.length} chars < min ${c.minLength}`);
  for (const s of c.mustContainAll || []) if (!norm.includes(normalize(s))) failures.push(`missing required string: "${s}"`);
  if (c.mustContainAny && !(c.mustContainAny).some(s => norm.includes(normalize(s)))) failures.push(`missing any of: ${(c.mustContainAny).join(" | ")}`);
  for (const s of c.mustNotContain || []) if (norm.includes(normalize(s))) failures.push(`forbidden string present: "${s}"`);
  if (c.hashtagCount) {
    const tags = (out.match(/#\w+/g) || []).length;
    if (tags < c.hashtagCount) failures.push(`hashtags ${tags} < required ${c.hashtagCount}`);
  }
  if (c.checkFn && typeof CHECKS[c.checkFn] === "function") {
    const r = CHECKS[c.checkFn](out);
    if (r !== true) failures.push(`checkFn ${c.checkFn}: ${r}`);
  }
  return { pass: failures.length === 0, failures };
}

/** Normalize text for tolerant matching: lowercase, drop commas in numbers, collapse spaces. */
function normalize(s) {
  return String(s)
    .toLowerCase()
    .replace(/(\d),(\d{3})(?!\d)/g, "$1$2")   // 2,467.50 -> 2467.50
    .replace(/\s+/g, " ");
}

const CHECKS = {
  referencesHeadCount(t) { return /120|head ?count|guests/i.test(t) ? true : "no headcount reference"; },
  isDraftTone(t) { return /draft|pending|approval|review/i.test(t) ? true : "not draft/approval framed"; },
  gstMathExact(t) {
    const n = normalize(t);
    const ok = n.includes("117.50") && n.includes("2467.50");
    return ok ? true : "GST math wrong: expect $117.50 GST and $2,467.50 total";
  },
  hasTempSafety(t) { return /60\s*°? ?C|135\s*°? ?F|danger zone/i.test(t) ? true : "no food-safety temp"; },
  hasBothLanguages(t) {
    const es = /hola|gracias| event|fecha|lugar|personas/i.test(t);
    const en = /hello|thank|date|venue|people|guests/i.test(t);
    return es && en ? true : "reply must contain both Spanish and English text";
  },
  hasApprovalLine(t) { return /APPROVAL REQUIRED/.test(t) ? true : "missing exact 'APPROVAL REQUIRED' line"; },
  emailShaped(t) { return /subject|hi jordan|hello jordan|dear jordan/i.test(t) ? true : "not email-shaped (no greeting/subject)"; },
  threeCategories(t) {
    const n = (t.match(/^\s*(?:\d+\.|\-|\*)\s/gm) || []).length;
    return n >= 3 ? true : `needs ≥3 list items, found ${n}`;
  },
  numberedNextActions(t) {
    const m = t.match(/NEXT ACTIONS([\s\S]*)$/i);
    if (!m) return "missing NEXT ACTIONS section";
    const n = (m[1].match(/^\s*\d+\./gm) || []).length;
    return n >= 1 && n <= 4 ? true : `NEXT ACTIONS must have 1-4 numbered items, found ${n}`;
  },
  escalationShaped(t) { return /policy|rule/i.test(t) ? true : "missing one-line policy"; },
};

// ---------- CLI ----------
const args = process.argv.slice(2);
function argVal(name, dflt) {
  const i = args.indexOf(name);
  return i >= 0 && args[i + 1] ? args[i + 1] : dflt;
}
const adapterId = argVal("--adapter", null);
const filter = argVal("--filter", null);
const limit = Number(argVal("--limit", "0")) || 0;
const outDir = resolve(argVal("--outDir", join(GOLDEN_DIR, "..", "baseline")));
const verbose = args.includes("--verbose");

// ---------- main ----------
async function main() {
  if (!adapterId || !listIds().includes(adapterId)) {
    console.error(`Usage: runner.js --adapter <${listIds().join("|")}> [--filter <taskId>] [--limit N] [--outDir DIR]`);
    process.exit(2);
  }

  const adapter = get(adapterId);
  const st = await adapter.status();
  if (!st.ready) {
    console.error(`Adapter "${adapterId}" not ready: ${st.reason || "unknown"}${st.detail ? ` (${st.detail})` : ""}`);
    process.exit(3);
  }

  // ---------- load tasks ----------
  const manifest = JSON.parse(readFileSync(join(GOLDEN_DIR, "manifest.json"), "utf8"));
  let tasks = manifest.tasks;
  if (filter) tasks = tasks.filter(t => t.id.includes(filter) || t.name.toLowerCase().includes(filter.toLowerCase()));
  if (limit > 0) tasks = tasks.slice(0, limit);

  console.log(`\n  Golden run: ${tasks.length} task(s) via ${adapterId}${filter ? ` (filter: ${filter})` : ""}\n`);

  // ---------- run ----------
  const runId = `${new Date().toISOString().replace(/[:.]/g, "-")}-${adapterId}`;
  const telemetry = new Telemetry(join(outDir, `telemetry-${runId}.jsonl`), runId);
  mkdirSync(outDir, { recursive: true });

  const results = [];
  for (const t of tasks) {
    process.stdout.write(`  ▶ ${t.id} … `);
    const started = Date.now();
    let result;
    try {
      result = await adapter.submit({
        id: t.id,
        prompt: buildPrompt(t),
        system: buildSystem(manifest),
        meta: { client: manifest.client, dept: t.dept },
        timeoutMs: 900000,
      });
    } catch (e) {
      result = { taskId: t.id, adapterId, status: "error", output: "", error: e.message, usage: { input: 0, output: 0 }, costUsd: 0, durationMs: Date.now() - started, startedAt: new Date().toISOString(), files: [] };
    }
    const check = checkTask(t, result);
    telemetry.record({
      taskId: t.id, adapterId, model: result.model || null, status: result.status,
      usage: result.usage, costUsd: result.costUsd, durationMs: result.durationMs,
      error: result.status !== "ok" ? result.error : (check.pass ? undefined : `CHECK FAILED: ${check.failures.join("; ")}`),
    });
    results.push({ id: t.id, name: t.name, status: result.status, pass: check.pass, failures: check.failures, costUsd: result.costUsd, usage: result.usage, durationMs: result.durationMs, outputLen: (result.output || "").length, output: result.output || "" });
    console.log(`${result.status === "ok" && check.pass ? "PASS" : "FAIL"} (${result.durationMs}ms, $${result.costUsd}${check.pass ? "" : ` — ${check.failures.join("; ")}`})`);
    if (verbose && result.output) console.log(`    └ output ${result.output.length} chars: ${result.output.slice(0, 200).replace(/\n/g, " ")}…`);
  }

  const checksPassed = results.filter(r => r.pass).length;
  const summary = telemetry.writeSummary();
  summary.checksPassed = checksPassed;
  summary.checksTotal = results.length;
  const full = {
    runId, adapterId, adapterStatus: st,
    persistedDefault: loadDefault(process.env.HUCKLEBERRY_HOME || process.env.HOME),
    manifestVersion: manifest.version,
    results,
    summary,
  };
  const reportPath = join(outDir, `run-${runId}.json`);
  writeFileSync(reportPath, JSON.stringify(full, null, 2));

  console.log(`\n  Summary: ${checksPassed}/${results.length} checks pass · adapter-ok ${summary.ok}/${summary.tasks} · in ${summary.tokensIn} tok · out ${summary.tokensOut} tok · $${summary.costUsd}`);
  console.log(`  Telemetry: ${summary.telemetryFile}`);
  console.log(`  Report:    ${reportPath}\n`);
  process.exit(checksPassed === results.length ? 0 : 1);
}

main().catch(e => { console.error(e); process.exit(1); });