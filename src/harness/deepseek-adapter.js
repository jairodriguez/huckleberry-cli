/**
 * deepseek-adapter — routes a task to a DeepSeek model, either:
 *   - direct DeepSeek API (DEEPSEEK_API_KEY), or
 *   - OpenRouter (OPENROUTER_API_KEY) using a deepseek/* route
 *
 * Cost-optimized alternative to the local opencode harness: one stateless chat
 * completion per task with per-task token + cost tracking. No tool use /
 * filesystem access, so registry policy routes tool-dependent tasks to opencode.
 */
import { HarnessAdapter, baseResult, nowIso } from "./types.js";
import {
  chatCompletion, computeCost, isPeakNow, defaultModel, probe,
  resolveProvider, providerKey, DEEPSEEK_MODELS, OPENROUTER_MODELS,
} from "./deepseek.js";

export class DeepSeekAdapter extends HarnessAdapter {
  constructor(opts = {}) {
    super({ id: "deepseek", label: "DeepSeek (cost-optimized)", ...opts });
    this.provider = opts.provider || resolveProvider();
    this.apiKey = opts.apiKey || providerKey(this.provider);
  }

  capabilities() {
    const table = this.provider === "openrouter" ? OPENROUTER_MODELS : DEEPSEEK_MODELS;
    const m = table[defaultModel(this.provider)];
    const costIn = this.provider === "openrouter" ? (m?.input ?? 0.051) : (m?.inPeak ?? 0.30);
    const costOut = this.provider === "openrouter" ? (m?.output ?? 0.567) : (m?.outPeak ?? 1.20);
    return {
      streaming: false,
      checkpoint: false,   // stateless API — nothing to resume
      cancel: true,        // AbortSignal per request
      files: false,        // no filesystem access
      tools: false,        // pure completion, no tool calls in v1
      modelChoice: true,
      provider: this.provider,
      costPerMTokIn: costIn,
      costPerMTokOut: costOut,
    };
  }

  async status() {
    if (!this.apiKey) {
      const envName = this.provider === "openrouter" ? "OPENROUTER_API_KEY" : "DEEPSEEK_API_KEY";
      return { ready: false, reason: `missing ${envName}`, detail: `add ${envName} to ~/.huckleberry/.env` };
    }
    const p = await probe(this.apiKey, this.provider);
    if (!p.ok) return { ready: false, reason: `${this.provider} probe failed: ${p.error}`, detail: "check key/network/credits" };
    return { ready: true, detail: `${this.provider} · ${p.models.length} models · ${defaultModel(this.provider)}` };
  }

  /**
   * @param {import("./types.js").TaskRequest} task
   * @returns {Promise<import("./types.js").TaskResult>}
   */
  async submit(task) {
    const started = Date.now();
    const out = baseResult({ ...task, adapterId: this.id });
    const model = task.model || defaultModel(this.provider);
    if (!this.apiKey) {
      out.status = "error";
      out.error = `${this.provider === "openrouter" ? "OPENROUTER_API_KEY" : "DEEPSEEK_API_KEY"} not set — cannot run deepseek adapter`;
      out.durationMs = Date.now() - started;
      return out;
    }
    try {
      const messages = [];
      if (task.system) messages.push({ role: "system", content: task.system });
      messages.push({ role: "user", content: task.prompt });
      const r = await chatCompletion({
        provider: this.provider,
        apiKey: this.apiKey,
        model,
        messages,
        maxTokens: task.maxTokens || 4096,
        timeoutMs: task.timeoutMs || 180000,
      });
      out.output = r.content;
      out.model = r.model;
      const cacheHit = r.usage.prompt_cache_hit_tokens ?? r.usage.cache_read_input_tokens ?? 0;
      out.usage = {
        input: r.usage.prompt_tokens || 0,
        output: r.usage.completion_tokens || 0,
        cacheHit,
        cacheMiss: r.usage.prompt_cache_miss_tokens ?? Math.max(0, (r.usage.prompt_tokens || 0) - cacheHit),
      };
      out.costUsd = computeCost({ model: r.model, usage: r.usage }, !isPeakNow(), this.provider);
      out.status = out.output ? "ok" : "error";
      if (!out.output) out.error = "empty completion (model returned no content)";
    } catch (e) {
      out.status = "error";
      out.error = e.message;
    }
    out.durationMs = Date.now() - started;
    out.startedAt = nowIso();
    return out;
  }

  async cancel(_taskId) {
    // stateless: each call uses its own AbortSignal; nothing to cancel post-hoc
    return false;
  }
}
