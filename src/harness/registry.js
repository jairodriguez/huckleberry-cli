/**
 * registry — adapter registry + selection policy.
 *
 * Selection policy (Phase 1):
 *   1. Explicit `task.preferred` wins if that adapter is ready.
 *   2. Capability-matched: tasks requiring tools/files go to tool-capable adapters.
 *   3. Cost-optimized: among ready adapters that satisfy capabilities, pick the
 *      lowest blended cost per task (local opencode = $0 API cost, so it usually
 *      wins on cost; DeepSeek wins when opencode is unavailable or policy pins it).
 *
 * The persisted default lives in ~/.huckleberry/harness.json ("default": "<id>").
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { OpenCodeAdapter } from "./opencode-adapter.js";
import { DeepSeekAdapter } from "./deepseek-adapter.js";
import { PiAdapter } from "./pi-adapter.js";

/** @type {Map<string, import("./types.js").HarnessAdapter>} */
const adapters = new Map();

export function register(adapter) {
  adapters.set(adapter.id, adapter);
}

/** Built-in adapters, registered once at import. */
register(new OpenCodeAdapter());
register(new DeepSeekAdapter());
register(new PiAdapter());

/** @returns {string[]} registered adapter ids in registration order */
export function listIds() {
  return [...adapters.keys()];
}

export function get(id) {
  return adapters.get(id) || null;
}

/**
 * Read the persisted default adapter id.
 * @param {string} [home] state root (defaults to process HOME / sandbox HOME via caller)
 * @returns {string|null}
 */
export function loadDefault(home) {
  const p = harnessConfigPath(home);
  if (!existsSync(p)) return null;
  try {
    const j = JSON.parse(readFileSync(p, "utf8"));
    return j.default || null;
  } catch { return null; }
}

/**
 * Persist the default adapter id.
 * @param {string} id
 * @param {string} [home]
 */
export function saveDefault(id, home) {
  if (!adapters.has(id)) throw new Error(`unknown adapter: ${id} (available: ${listIds().join(", ")})`);
  const p = harnessConfigPath(home);
  mkdirSync(dirname(p), { recursive: true });
  writeFileSync(p, JSON.stringify({ default: id, updatedAt: new Date().toISOString() }, null, 2));
}

export function harnessConfigPath(home) {
  const h = home || process.env.HUCKLEBERRY_HOME || process.env.HOME || "";
  return join(h, ".huckleberry", "harness.json");
}

/**
 * Selection policy. See module doc for the ordering.
 * @param {import("./types.js").TaskRequest & {preferred?:string}} task
 * @param {string|null} [defaultId] persisted default (harness.json)
 * @returns {Promise<{adapter: import("./types.js").HarnessAdapter, why: string}>}
 */
export async function selectAdapter(task = {}, defaultId = null) {
  const candidates = [];
  // 1. explicit preference
  if (task.preferred && adapters.has(task.preferred)) candidates.push([task.preferred, "explicit task preference"]);
  if (defaultId && adapters.has(defaultId)) candidates.push([defaultId, "persisted default (harness set)"]);
  // fallback order: cost-optimized (deepseek), then lean local agent (pi), then local default
  candidates.push(["deepseek", "cost-optimized fallback"]);
  candidates.push(["pi", "lean cold-start fallback"]);
  candidates.push(["opencode", "local default fallback"]);

  const needTools = task.requireTools === true;
  for (const [id, why] of candidates) {
    const a = adapters.get(id);
    if (!a) continue;
    const caps = a.capabilities();
    if (needTools && !caps.tools) continue; // capability-matched gate
    const st = await a.status();
    if (st.ready) return { adapter: a, why };
  }
  throw new Error("no ready adapter — install opencode or set DEEPSEEK_API_KEY");
}

/**
 * Table row data for `huckleberry harness list`.
 * @param {string} [home]
 */
export async function describeAdapters(home) {
  const defaultId = loadDefault(home);
  const rows = [];
  for (const id of listIds()) {
    const a = adapters.get(id);
    const st = await a.status();
    const caps = a.capabilities();
    rows.push({
      id,
      label: a.label,
      ready: st.ready,
      reason: st.reason || null,
      detail: st.detail || null,
      caps,
      isDefault: id === defaultId,
    });
  }
  return { rows, defaultId };
}
