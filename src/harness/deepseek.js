/**
 * DeepSeek client — OpenAI-compatible, two providers:
 *   - direct:  https://api.deepseek.com   (needs DEEPSEEK_API_KEY)
 *   - openrouter: https://openrouter.ai/api/v1 (needs OPENROUTER_API_KEY)
 *
 * Direct DeepSeek pricing (per 1M tokens, verified api-docs.deepseek.com 2026-11-04):
 *   deepseek-flash:  in $0.15 off-peak / $0.30 peak (cache hit: $0.003/$0.006) · out $0.60/$1.20
 *   deepseek-v4-pro: in $0.66 off-peak / $1.32 peak (cache hit: $0.022/$0.044) · out $1.98/$3.96
 * Off-peak = all hours except 01:00-04:00 & 06:00-10:00 UTC Mon-Fri (excluding CN holidays).
 *
 * OpenRouter pricing differs per model route and is fetched live where possible;
 * the table below is a fallback snapshot (verified via /models 2026-11-06, $/1M tok).
 */
import { writeFileSync, mkdirSync, readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { homedir } from "node:os";

/**
 * Load key=value pairs from ~/.huckleberry/.env into a flat object. The harness
 * runs as a subprocess that does not inherit a user's shell env, so credentials
 * written by `huckleberry install` must be read from the state file.
 * @returns {Record<string,string>}
 */
export function loadHarnessEnv() {
  const out = {};
  const root = process.env.HUCKLEBERRY_HOME || homedir();
  const envPath = join(root, ".huckleberry", ".env");
  if (!existsSync(envPath)) return out;
  try {
    for (const line of readFileSync(envPath, "utf8").split("\n")) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m && m[2]) out[m[1]] = m[2].replace(/^["']|["']$/g, "").trim();
    }
  } catch { /* unreadable — treat as empty */ }
  return out;
}

/**
 * Merged env for credential resolution. Precedence: ~/.huckleberry/.env WINS over
 * ambient process env for credential keys. Rationale: the install's own .env is the
 * documented place keys are set, and an unrelated ambient OPENROUTER_API_KEY (e.g.
 * from a workspace .env with an expired key) must not silently break the harness.
 * Per-task overrides are passed explicitly via TaskRequest.env.
 */
function envWithFile() {
  return { ...process.env, ...loadHarnessEnv() };
}

export const DEEPSEEK_BASE_URL = process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com";
export const OPENROUTER_BASE_URL = process.env.OPENROUTER_BASE_URL || "https://openrouter.ai/api/v1";

export const DEEPSEEK_MODELS = {
  "deepseek-flash": {
    inPeak: 0.30, inOffPeak: 0.15, inCacheHitPeak: 0.006, inCacheHitOffPeak: 0.003,
    outPeak: 1.20, outOffPeak: 0.60,
  },
  "deepseek-v4-pro": {
    inPeak: 1.32, inOffPeak: 0.66, inCacheHitPeak: 0.044, inCacheHitOffPeak: 0.022,
    outPeak: 3.96, outOffPeak: 1.98,
  },
};

/**
 * OpenRouter route pricing ($/1M tok). Snapshot 2026-11-06; used when the live
 * /models lookup has not run. `input`/`output` are list prices, cache reads billed lower.
 */
export const OPENROUTER_MODELS = {
  "deepseek/deepseek-v4.1-flash": { input: 0.051, output: 0.567, cacheRead: 0.0102 },
  "deepseek/deepseek-v4.1-flash-1017": { input: 0.15, output: 0.60, cacheRead: 0.03 },
  "deepseek/deepseek-v4-pro": { input: 0.88, output: 1.76, cacheRead: 0.176 },
  "deepseek/deepseek-v4-pro-0813": { input: 0.1165, output: 4.66, cacheRead: 0.0233 },
  "deepseek/deepseek-v3.2": { input: 0.26, output: 0.38, cacheRead: 0.052 },
};

/** Resolve the active provider from env (process env + ~/.huckleberry/.env). Defaults to direct DeepSeek. */
export function resolveProvider(env = envWithFile()) {
  const explicit = (env.HUCKLEBERRY_DEEPSEEK_PROVIDER || "").toLowerCase();
  if (explicit === "openrouter" || explicit === "deepseek") return explicit;
  if (env.DEEPSEEK_API_KEY) return "deepseek";
  if (env.OPENROUTER_API_KEY) return "openrouter";
  return "deepseek";
}

export function providerKey(provider = resolveProvider()) {
  const env = envWithFile();
  return provider === "openrouter"
    ? (env.OPENROUTER_API_KEY || "")
    : (env.DEEPSEEK_API_KEY || "");
}

export function providerBaseUrl(provider = resolveProvider()) {
  return provider === "openrouter" ? OPENROUTER_BASE_URL : DEEPSEEK_BASE_URL;
}

export function defaultModel(provider = resolveProvider()) {
  const env = envWithFile();
  if (provider === "openrouter") return env.DEEPSEEK_MODEL || "deepseek/deepseek-v4.1-flash";
  return env.DEEPSEEK_MODEL || "deepseek-flash";
}

/** Peak windows: 01:00-04:00 and 06:00-10:00 UTC, Mon-Fri. */
export function isPeakNow(date = new Date()) {
  const d = date.getUTCDay();
  const h = date.getUTCHours();
  if (d === 0 || d === 6) return false; // weekends always off-peak
  return (h >= 1 && h < 4) || (h >= 6 && h < 10);
}

/**
 * Compute USD cost from token usage.
 * - direct provider: peak rates unless offPeak=true
 * - openrouter provider: list prices from OPENROUTER_MODELS (input/output + cache read)
 * @param {{model:string, usage:Object}} r
 * @param {boolean} [offPeak]
 * @param {string} [provider]
 * @returns {number} cost in USD (6dp)
 */
export function computeCost(r, offPeak = !isPeakNow(), provider = resolveProvider()) {
  if (provider === "openrouter") {
    const p = OPENROUTER_MODELS[r.model] || OPENROUTER_MODELS[defaultModel("openrouter")] || { input: 0.051, output: 0.567, cacheRead: 0.01 };
    const hit = r.usage.prompt_cache_hit_tokens || r.usage.cache_read_input_tokens || 0;
    const miss = r.usage.prompt_cache_miss_tokens ?? Math.max(0, (r.usage.prompt_tokens || 0) - hit);
    const cost = (hit / 1e6) * p.cacheRead + (miss / 1e6) * p.input + ((r.usage.completion_tokens || 0) / 1e6) * p.output;
    return Math.round(cost * 1e6) / 1e6;
  }
  const p = DEEPSEEK_MODELS[r.model] || DEEPSEEK_MODELS[defaultModel("deepseek")];
  const hit = r.usage.prompt_cache_hit_tokens || 0;
  const miss = r.usage.prompt_cache_miss_tokens ?? Math.max(0, (r.usage.prompt_tokens || 0) - hit);
  const inRate = offPeak ? p.inOffPeak : p.inPeak;
  const hitRate = offPeak ? p.inCacheHitOffPeak : p.inCacheHitPeak;
  const outRate = offPeak ? p.outOffPeak : p.outPeak;
  const cost = (hit / 1e6) * hitRate + (miss / 1e6) * inRate + ((r.usage.completion_tokens || 0) / 1e6) * outRate;
  return Math.round(cost * 1e6) / 1e6;
}

/**
 * Minimal OpenAI-compatible chat completions call. Works against DeepSeek direct
 * and OpenRouter (same wire shape). OpenRouter additionally accepts attribution headers.
 * @param {Object} opts
 * @param {string} [opts.apiKey]   defaults to provider key from env
 * @param {string} [opts.provider] "deepseek" | "openrouter"
 * @param {Array<{role:string, content:string}>} opts.messages
 * @param {string} [opts.model]
 * @param {number} [opts.maxTokens]
 * @param {number} [opts.temperature]
 * @param {number} [opts.timeoutMs] default 120000
 * @param {string} [opts.baseUrl]
 * @returns {Promise<{content:string, usage:Object, model:string, raw:Object}>}
 */
export async function chatCompletion(opts) {
  const provider = opts.provider || resolveProvider();
  const model = opts.model || defaultModel(provider);
  const apiKey = opts.apiKey || providerKey(provider);
  const baseUrl = opts.baseUrl || providerBaseUrl(provider);
  const headers = { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` };
  if (provider === "openrouter") {
    headers["HTTP-Referer"] = "https://huckleberry.ai";
    headers["X-Title"] = "Huckleberry Harness";
  }
  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      model,
      messages: opts.messages,
      // Some routes require an explicit cap; default keeps replies bounded.
      max_tokens: opts.maxTokens || 4096,
      ...(opts.temperature !== undefined ? { temperature: opts.temperature } : {}),
      stream: false,
    }),
    signal: AbortSignal.timeout(opts.timeoutMs || 120000),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    const err = new Error(`${provider} API ${res.status}: ${body.slice(0, 400)}`);
    err.status = res.status;
    throw err;
  }
  const json = await res.json();
  const msg = json.choices?.[0]?.message || {};
  // Some reasoning models put the answer in `content`, others only in `reasoning`.
  const content = msg.content || msg.reasoning || "";
  return {
    content,
    usage: json.usage || {},
    model: json.model || model,
    raw: json,
  };
}

/**
 * Wire-format smoke test: cheap GET /models probe against the active provider.
 * @param {string} [apiKey]
 * @param {string} [provider]
 * @returns {Promise<{ok:boolean, models?:string[], error?:string, provider?:string}>}
 */
export async function probe(apiKey, provider = resolveProvider()) {
  const key = apiKey || providerKey(provider);
  const baseUrl = providerBaseUrl(provider);
  try {
    const res = await fetch(`${baseUrl}/models`, {
      headers: { Authorization: `Bearer ${key}` },
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      return { ok: false, error: `HTTP ${res.status}${body ? `: ${body.slice(0, 120)}` : ""}`, provider };
    }
    const json = await res.json();
    return { ok: true, models: (json.data || []).map(m => m.id), provider };
  } catch (e) {
    return { ok: false, error: e.message, provider };
  }
}

/**
 * Save a captured API exchange as a fixture (for wire-format tests without API calls).
 * @param {string} dir output dir
 * @param {string} name fixture name
 * @param {Object} obj the response JSON (never includes the key)
 */
export function saveFixture(dir, name, obj) {
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, `${name}.json`), JSON.stringify(obj, null, 2));
}
