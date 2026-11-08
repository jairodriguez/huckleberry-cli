/**
 * pi-adapter — routes a task to the Pi coding-agent CLI (earendil-works/pi).
 *
 * WHY: Pi ships a markedly smaller cold-start prompt than opencode (benchmark
 * discussion #6646: Pi ~2.8k first-turn input tokens vs opencode ~12.4k, ~5 tools
 * vs ~12). For many short cold sessions that 4x overhead gap dominates cost. For
 * long cached sessions opencode can be cheaper per turn, so harness selection is
 * workload-dependent — this adapter makes that choice available.
 *
 * Install: npm install -g @earendil-works/pi-coding-agent   (binary: `pi`)
 * Model selection: pass task.model as `provider/id` (e.g. deepseek/deepseek-v4.1-flash).
 * Auth: Pi reads provider creds from its own config/`pi auth`; OPENROUTER_API_KEY is
 * honoured via `--api-key` override when provided through task.env.
 */
import { spawn, execFile } from "node:child_process";
import { promisify } from "node:util";
import { tmpdir, homedir } from "node:os";
import { mkdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import { HarnessAdapter, baseResult, nowIso } from "./types.js";
import { loadHarnessEnv } from "./deepseek.js";

const execFileAsync = promisify(execFile);

/** Resolve the OpenRouter key: huckleberry .env wins over ambient env. */
function openRouterKey() {
  const env = { ...process.env, ...loadHarnessEnv() };
  return env.OPENROUTER_API_KEY || "";
}

const NEUTRAL_CWD = join(tmpdir(), "huckleberry-harness-pi");
function neutralCwd() {
  try { mkdirSync(NEUTRAL_CWD, { recursive: true }); } catch { /* exists */ }
  return NEUTRAL_CWD;
}

function piBin() {
  const extra = [
    join(homedir(), ".npm-global", "bin"),
    join(homedir(), ".local", "bin"),
    "/usr/local/bin",
    "/opt/homebrew/bin",
    join(homedir(), ".bun", "bin"),
  ];
  for (const d of extra) {
    const p = join(d, "pi");
    if (existsSync(p)) return p;
  }
  return "pi";
}

const DEFAULT_TIMEOUT_MS = 900000;

/**
 * Model id default. pi requires a provider-qualified id; we default to the
 * OpenRouter route so a single OpenRouter key drives all adapters consistently.
 */
function piDefaultModel() {
  const env = process.env;
  if (env.PI_MODEL) return env.PI_MODEL;
  if (env.DEEPSEEK_MODEL && env.DEEPSEEK_MODEL.includes("/")) return env.DEEPSEEK_MODEL;
  return "openrouter/deepseek/deepseek-v4.1-flash";
}

function runPi(args, cwd, timeoutMs, env) {
  return new Promise((resolve, reject) => {
    const child = spawn(piBin(), args, {
      cwd,
      env: { ...process.env, ...(env || {}) },
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
    child.on("error", (e) => { clearTimeout(timer); reject(e); });
  });
}

export class PiAdapter extends HarnessAdapter {
  constructor(opts = {}) {
    super({ id: "pi", label: "Pi coding agent (lean cold-start)", ...opts });
    this.checkpoints = new Map();
  }

  capabilities() {
    return {
      streaming: false,
      checkpoint: true,   // snapshot for re-run
      cancel: true,
      files: true,        // Pi is a coding agent with filesystem tools
      tools: true,
      modelChoice: true,  // --model provider/id
      costPerMTokIn: 0,   // local engine — cost is the routed model's, not Pi's
      costPerMTokOut: 0,
    };
  }

  async status() {
    try {
      const { stdout } = await execFileAsync(piBin(), ["--version"], { timeout: 20000 });
      return { ready: true, detail: `pi ${stdout.trim()}` };
    } catch (e) {
      return { ready: false, reason: "pi not installed", detail: "npm install -g @earendil-works/pi-coding-agent" };
    }
  }

  /**
   * @param {import("./types.js").TaskRequest} task
   * @returns {Promise<import("./types.js").TaskResult>}
   */
  async submit(task) {
    const started = Date.now();
    const out = baseResult({ ...task, adapterId: this.id });
    // Print mode: non-interactive, single-shot. --print emits only the answer.
    // Pi resolves models as `provider/id`; our default pins the OpenRouter route.
    const args = ["--print"];
    const model = task.model || piDefaultModel();
    args.push("--model", model);
    const key = task.env?.OPENROUTER_API_KEY || openRouterKey();
    if (key) args.push("--api-key", key);
    args.push(task.prompt);

    try {
      const { stdout, stderr } = await runPi(args, task.cwd || neutralCwd(), task.timeoutMs || DEFAULT_TIMEOUT_MS, task.env);
      out.output = stdout.trim();
      out.status = "ok";
      if (stderr?.trim()) out.stderr = stderr.trim();
      const usage = parsePiUsage(stderr + "\n" + stdout);
      if (usage) out.usage = usage;
    } catch (e) {
      out.status = "error";
      out.error = e.message;
      out.output = (e.stdout || "").trim();
    }
    out.durationMs = Date.now() - started;
    out.startedAt = nowIso();
    this.checkpoints.set(task.id, { task, output: out.output, startedAt: out.startedAt });
    out.checkpointId = task.id;
    return out;
  }

  async cancel(_taskId) { return false; }

  async checkpoint(taskId) { return this.checkpoints.has(taskId) ? taskId : null; }

  async resume(checkpointId) {
    const cp = this.checkpoints.get(checkpointId);
    if (!cp) throw new Error(`pi: no checkpoint ${checkpointId}`);
    return this.submit(cp.task);
  }

  async downloadFiles(_taskId) { return []; }
}

/**
 * Best-effort token parse from pi output (varies by version). Null when absent.
 * @param {string} text
 */
function parsePiUsage(text) {
  const m = text.match(/input[^\d]*(\d+)[^\d]*output[^\d]*(\d+)/i) || text.match(/(\d+)\s*(?:in|input)[^\d]*(\d+)\s*(?:out|output)/i);
  if (m) return { input: Number(m[1]), output: Number(m[2]) };
  return null;
}
