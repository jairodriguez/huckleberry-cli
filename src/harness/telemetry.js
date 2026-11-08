/**
 * Telemetry — per-task token + cost recording as JSON lines.
 *
 * One JSONL file per harness run: tests/baseline/telemetry-<runId>.jsonl
 * Each line: { ts, runId, taskId, adapterId, model, status, usage, costUsd, durationMs }
 * Append-only; a run summary is written next to it on close (see writeSummary).
 */
import { appendFileSync, writeFileSync, mkdirSync, readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";

export class Telemetry {
  /**
   * @param {string} filePath absolute path of the JSONL output
   * @param {string} runId
   */
  constructor(filePath, runId) {
    this.filePath = filePath;
    this.runId = runId;
    this.records = [];
    mkdirSync(dirname(filePath), { recursive: true });
    // header line makes each file self-describing
    appendFileSync(filePath, JSON.stringify({
      ts: new Date().toISOString(),
      runId,
      event: "run-start",
    }) + "\n");
  }

  /**
   * Record one task result.
   * @param {{taskId:string, adapterId:string, model?:string, status:string,
   *          usage:{input:number, output:number, cacheHit?:number, cacheMiss?:number},
   *          costUsd:number, durationMs:number, error?:string}} r
   */
  record(r) {
    const line = {
      ts: new Date().toISOString(),
      runId: this.runId,
      taskId: r.taskId,
      adapterId: r.adapterId,
      model: r.model || null,
      status: r.status,
      usage: {
        input: r.usage?.input || 0,
        output: r.usage?.output || 0,
        cacheHit: r.usage?.cacheHit ?? null,
        cacheMiss: r.usage?.cacheMiss ?? null,
      },
      costUsd: Math.round((r.costUsd || 0) * 1e6) / 1e6,
      durationMs: r.durationMs || 0,
    };
    if (r.error) line.error = r.error;
    this.records.push(line);
    appendFileSync(this.filePath, JSON.stringify(line) + "\n");
  }

  /**
   * Write a run summary JSON alongside the JSONL and return it.
   * @returns {{runId:string, telemetryFile:string, tasks:number, ok:number, failed:number,
   *            tokensIn:number, tokensOut:number, costUsd:number, byAdapter:Object}}
   */
  writeSummary() {
    const byAdapter = {};
    for (const r of this.records) {
      const a = (byAdapter[r.adapterId] ||= { tasks: 0, ok: 0, failed: 0, tokensIn: 0, tokensOut: 0, costUsd: 0 });
      a.tasks++;
      if (r.status === "ok") a.ok++; else a.failed++;
      a.tokensIn += r.usage.input;
      a.tokensOut += r.usage.output;
      a.costUsd = Math.round((a.costUsd + r.costUsd) * 1e6) / 1e6;
    }
    const summary = {
      runId: this.runId,
      finishedAt: new Date().toISOString(),
      telemetryFile: this.filePath,
      tasks: this.records.length,
      ok: this.records.filter(r => r.status === "ok").length,
      failed: this.records.filter(r => r.status !== "ok").length,
      tokensIn: this.records.reduce((s, r) => s + r.usage.input, 0),
      tokensOut: this.records.reduce((s, r) => s + r.usage.output, 0),
      costUsd: Math.round(this.records.reduce((s, r) => s + r.costUsd, 0) * 1e6) / 1e6,
      byAdapter,
    };
    const summaryPath = this.filePath.replace(/\.jsonl$/, "-summary.json");
    writeFileSync(summaryPath, JSON.stringify(summary, null, 2));
    return summary;
  }
}

/**
 * Read back a telemetry JSONL file (used by comparison tooling).
 * @param {string} filePath
 * @returns {Array<Object>}
 */
export function readTelemetry(filePath) {
  if (!existsSync(filePath)) return [];
  return readFileSync(filePath, "utf8")
    .split("\n")
    .filter(l => l.trim())
    .map(l => { try { return JSON.parse(l); } catch { return null; } })
    .filter(Boolean);
}
