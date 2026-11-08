/**
 * opencode-adapter — DEFAULT harness. Wraps the existing `opencode run` behavior.
 *
 * CRITICAL: this adapter must be a NO-OP for existing installs. It invokes the
 * same `opencode run "<prompt>"` command the CLI already used for `cro`/`review`,
 * with the same default (no explicit model/agent unless the task sets one). No new
 * env vars are required; if opencode is absent the adapter reports not-ready and
 * the CLI falls back exactly as before.
 */
import { spawn, execFile } from "node:child_process";
import { promisify } from "node:util";
import { tmpdir, homedir } from "node:os";
import { mkdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import { HarnessAdapter, baseResult, nowIso } from "./types.js";

const execFileAsync = promisify(execFile);

/** Neutral working directory so opencode does not load a host repo's context. */
const NEUTRAL_CWD = join(tmpdir(), "huckleberry-harness");
function neutralCwd() {
  try { mkdirSync(NEUTRAL_CWD, { recursive: true }); } catch { /* exists */ }
  return NEUTRAL_CWD;
}

/**
 * Resolve the opencode binary against PATH plus common install dirs, so the
 * adapter works from processes (cron, sandbox runners) that lack the shell PATH.
 */
function opencodeBin() {
  const extra = [
    join(homedir(), ".opencode", "bin"),
    "/usr/local/bin",
    "/opt/homebrew/bin",
    join(homedir(), ".bun", "bin"),
  ];
  for (const d of extra) {
    const p = join(d, "opencode");
    if (existsSync(p)) return p;
  }
  return "opencode"; // fall back to PATH lookup
}

const DEFAULT_TIMEOUT_MS = 900000; // 15 min — opencode cold boot + agent work

function runOpenCode(args, cwd, timeoutMs) {
  return new Promise((resolve, reject) => {
    const child = spawn(opencodeBin(), args, {
      cwd,
      env: { ...process.env, PATH: process.env.PATH + ":" + join(homedir(), ".opencode", "bin") },
      stdio: ["ignore", "pipe", "pipe"],
    });
    let stdout = "", stderr = "";
    child.stdout.on("data", d => { stdout += d; });
    child.stderr.on("data", d => { stderr += d; });
    const timer = setTimeout(() => {
      child.kill("SIGKILL");
      reject(Object.assign(new Error("timeout"), { stdout, stderr, code: "ETIMEDOUT" }));
    }, timeoutMs);
    child.on("close", (code, signal) => {
      clearTimeout(timer);
      if (code === 0) resolve({ stdout, stderr });
      else reject(Object.assign(new Error(`exit ${code}${signal ? ` (${signal})` : ""}`), { stdout, stderr, code, signal }));
    });
    child.on("error", (e) => {
      clearTimeout(timer);
      reject(e);
    });
  });
}

export class OpenCodeAdapter extends HarnessAdapter {
  constructor(opts = {}) {
    super({ id: "opencode", label: "opencode CLI (local, default)", ...opts });
    /** @type {Map<string, {task:Object, output:string, startedAt:string}>} */
    this.checkpoints = new Map();
  }

  capabilities() {
    return {
      streaming: false,      // opencode run prints at the end; we capture stdout
      checkpoint: true,      // we snapshot the task for re-run
      cancel: true,
      files: true,
      tools: true,           // full agent with tool/filesystem access
      modelChoice: true,     // via --model / named agent
      costPerMTokIn: 0,      // local engine — no per-token charge (uses the user's provider)
      costPerMTokOut: 0,
    };
  }

  async status() {
    try {
      const { stdout } = await execFileAsync(opencodeBin(), ["--version"], { timeout: 20000 });
      return { ready: true, detail: `opencode ${stdout.trim()}` };
    } catch (e) {
      return { ready: false, reason: "opencode not on PATH", detail: "npm install -g opencode" };
    }
  }

  /**
   * @param {import("./types.js").TaskRequest} task
   * @returns {Promise<import("./types.js").TaskResult>}
   */
  async submit(task) {
    const started = Date.now();
    const out = baseResult({ ...task, adapterId: this.id });
    // Run from a NEUTRAL cwd by default: running opencode inside the clawd workspace
    // loads its full AGENTS.md + 200+ skills and can exceed any sane timeout. The
    // harness task carries its own prompt; it doesn't need the caller's repo context.
    const runCwd = task.cwd || neutralCwd();
    const args = ["run"];
    // Harness tasks are execution tasks — use build agent (not plan) to get output.
    if (!task.agent) args.push("--agent", "build");
    if (task.agent) args.push("--agent", task.agent);
    if (task.model) args.push("--model", task.model);
    args.push(task.prompt);

    try {
      const { stdout, stderr } = await runOpenCode(args, runCwd, task.timeoutMs || DEFAULT_TIMEOUT_MS);
      out.output = stdout.trim();
      out.status = "ok";
      // opencode prints MCP boot noise to stderr; keep it as a diagnostic, not an error
      if (stderr?.trim()) out.stderr = stderr.trim();
      // opencode merges usage into stderr on some versions; parse if present
      const usage = parseOpenCodeUsage(stdout + "\n" + stderr);
      if (usage) out.usage = usage;
    } catch (e) {
      out.status = "error";
      out.error = e.message;
      out.output = (e.stdout || "").trim();
    }
    out.durationMs = Date.now() - started;
    out.startedAt = nowIso();
    // checkpoint snapshot (enables resume = re-run)
    this.checkpoints.set(task.id, { task, output: out.output, startedAt: out.startedAt });
    out.checkpointId = task.id;
    return out;
  }

  async cancel(_taskId) {
    // spawn() children can't be signalled from here without keeping handles;
    // the runOpenCode timeout already caps run time.
    return false;
  }

  async checkpoint(taskId) {
    return this.checkpoints.has(taskId) ? taskId : null;
  }

  async resume(checkpointId) {
    const cp = this.checkpoints.get(checkpointId);
    if (!cp) throw new Error(`opencode: no checkpoint ${checkpointId}`);
    return this.submit(cp.task); // local engine: resume == re-run
  }

  async downloadFiles(taskId) {
    const cp = this.checkpoints.get(taskId);
    if (!cp) return [];
    // opencode writes files itself; we report the cwd the task ran in as the search root
    return [];
  }
}

/**
 * Best-effort parse of token usage from opencode output. Returns null when absent
 * (older versions print nothing) — callers treat 0 usage as "unavailable".
 * @param {string} text
 */
function parseOpenCodeUsage(text) {
  const m = text.match(/tokens?:?\s*(\d+)\s*(?:in|input)[^\d]*(\d+)\s*(?:out|output)/i);
  if (m) return { input: Number(m[1]), output: Number(m[2]) };
  return null;
}
