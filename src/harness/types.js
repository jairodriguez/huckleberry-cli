/**
 * HarnessAdapter — the contract every execution harness implements.
 *
 * A "harness" is the thing that actually runs an agent task: the default is the
 * local `opencode` CLI (existing behavior); alternatives route the same task to a
 * different engine (e.g. the DeepSeek API) so cost/capability can be traded off
 * per task. The interface is deliberately plain JSDoc so the repo stays build-free.
 *
 * Implementations live alongside this file (`opencode-adapter.js`,
 * `deepseek-adapter.js`) and are registered in `registry.js`.
 *
 * @typedef {Object} TaskRequest
 * @property {string} id            Stable task id (e.g. golden task id).
 * @property {string} prompt        The instruction to run.
 * @property {string} [cwd]         Working directory the task should operate in.
 * @property {string} [agent]       Named agent for engines that support it (opencode).
 * @property {string} [model]       Model id override.
 * @property {number} [maxTokens]   Output token cap.
 * @property {string} [system]      Optional system prompt.
 * @property {Record<string,string>} [meta] Free-form task metadata (tenant, client…).
 *
 * @typedef {Object} TaskResult
 * @property {string}  taskId          Which task ran.
 * @property {string}  adapterId       Which harness produced it.
 * @property {"ok"|"error"|"cancelled"} status
 * @property {string}  output          Final text output.
 * @property {string}  [error]         Error message when status!=="ok".
 * @property {string}  [stderr]        Diagnostic stderr (non-fatal engine log noise).
 * @property {TokenUsage} usage
 * @property {number}  costUsd         Estimated cost in USD.
 * @property {number}  durationMs
 * @property {string}  startedAt       ISO timestamp.
 * @property {string}  [checkpointId]  Resume handle when supported.
 * @property {string[]} [files]        Files produced by the task.
 *
 * @typedef {Object} TokenUsage
 * @property {number} input
 * @property {number} output
 * @property {number} [cacheHit]      Input tokens served from cache.
 * @property {number} [cacheMiss]     Input tokens billed at full rate.
 *
 * @typedef {Object} Capabilities
 * @property {boolean} streaming      Yields incremental output.
 * @property {boolean} checkpoint     Can snapshot/resume a run.
 * @property {boolean} cancel         Can abort an in-flight run.
 * @property {boolean} files          Can return produced files.
 * @property {boolean} tools          Runs tools / filesystem access.
 * @property {boolean} modelChoice    Supports per-call model selection.
 * @property {number}  costPerMTokIn  Rough blended input price (USD / 1M tok).
 * @property {number}  costPerMTokOut Rough blended output price (USD / 1M tok).
 *
 * @typedef {Object} AdapterStatus
 * @property {boolean} ready
 * @property {string}  [reason]       Why not ready (e.g. missing credential).
 * @property {string}  [detail]
 */

/**
 * Marker base class. Adapters may extend it or merely satisfy the shape.
 * Every method documented here is REQUIRED unless marked optional.
 */
export class HarnessAdapter {
  /** @param {Object} [opts] */
  constructor(opts = {}) {
    this.id = opts.id || "unnamed";
    this.label = opts.label || this.id;
  }

  /** @returns {Capabilities} */
  capabilities() {
    throw new Error(`${this.id}: capabilities() not implemented`);
  }

  /** @returns {Promise<AdapterStatus>} readiness probe (creds, binaries, network) */
  async status() {
    throw new Error(`${this.id}: status() not implemented`);
  }

  /**
   * Run a task to completion. REQUIRED.
   * @param {TaskRequest} task
   * @returns {Promise<TaskResult>}
   */
  async submit(_task) {
    throw new Error(`${this.id}: submit() not implemented`);
  }

  /**
   * Incremental output. OPTIONAL — callers fall back to submit() output.
   * @param {TaskRequest} task
   * @returns {AsyncIterable<string>}
   */
  async *stream(_task) {
    throw new Error(`${this.id}: stream() not implemented`);
  }

  /**
   * Snapshot an in-flight task so it can resume later. OPTIONAL.
   * @param {string} _taskId
   * @returns {Promise<string|null>} checkpoint id, or null if unsupported
   */
  async checkpoint(_taskId) {
    return null;
  }

  /**
   * Resume from a checkpoint id. OPTIONAL.
   * @param {string} _checkpointId
   * @returns {Promise<TaskResult>}
   */
  async resume(_checkpointId) {
    throw new Error(`${this.id}: resume() not implemented`);
  }

  /**
   * Cancel an in-flight task. OPTIONAL.
   * @param {string} _taskId
   * @returns {Promise<boolean>} true if a run was cancelled
   */
  async cancel(_taskId) {
    return false;
  }

  /**
   * Return files produced by a task. OPTIONAL.
   * @param {string} _taskId
   * @returns {Promise<string[]>} absolute paths
   */
  async downloadFiles(_taskId) {
    return [];
  }
}

/** @returns {string} ISO timestamp helper */
export function nowIso() {
  return new Date().toISOString();
}

/**
 * Round a USD cost to 6 decimal places (sub-cent precision, stable JSON output).
 * @param {number} n
 * @returns {number}
 */
export function roundCost(n) {
  return Math.round((Number.isFinite(n) ? n : 0) * 1e6) / 1e6;
}

/**
 * Build a zeroed TaskResult with sane defaults, so adapters only fill what differs.
 * @param {TaskRequest & {adapterId: string}} t
 * @returns {TaskResult}
 */
export function baseResult(t) {
  return {
    taskId: t.id,
    adapterId: t.adapterId,
    status: "ok",
    output: "",
    usage: { input: 0, output: 0 },
    costUsd: 0,
    durationMs: 0,
    startedAt: nowIso(),
    files: [],
  };
}
