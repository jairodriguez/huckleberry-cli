#!/usr/bin/env node
/**
 * deepseek adapter wire-format test — no API key, no network.
 *
 * Stubs global fetch with a captured DeepSeek chat-completions response, then
 * asserts: request shape (URL, model, messages, auth header), response parsing,
 * token extraction, and cost math. Proves the adapter is correct independent of
 * whether a key is present. A live call is only needed to confirm the account.
 *
 * Usage: node tests/deepseek-wire.test.js
 * Exit 0 = all assertions pass.
 */
import assert from "node:assert";
import { DeepSeekAdapter } from "../src/harness/deepseek-adapter.js";
import { computeCost, DEEPSEEK_MODELS, isPeakNow } from "../src/harness/deepseek.js";

let passed = 0, failed = 0;
function t(name, fn) {
  try { fn(); console.log(`  ✓ ${name}`); passed++; }
  catch (e) { console.log(`  ✗ ${name} — ${e.message}`); failed++; }
}

// ---- captured fixture (shape matches api.deepseek.com /chat/completions) ----
const fixtureResponse = {
  id: "chatcmpl-test",
  object: "chat.completion",
  model: "deepseek-flash",
  choices: [{ index: 0, message: { role: "assistant", content: "Booking confirmed for your event." }, finish_reason: "stop" }],
  usage: {
    prompt_tokens: 1200,
    completion_tokens: 300,
    total_tokens: 1500,
    prompt_cache_hit_tokens: 200,
    prompt_cache_miss_tokens: 1000,
  },
};

function stubFetch(record) {
  return async (url, opts) => {
    record.url = url;
    record.method = opts.method;
    record.headers = opts.headers;
    record.body = JSON.parse(opts.body);
    return { ok: true, status: 200, json: async () => fixtureResponse, text: async () => JSON.stringify(fixtureResponse) };
  };
}

console.log("\n  DeepSeek adapter — wire-format test\n");

await (async () => {
  const adapter = new DeepSeekAdapter({ apiKey: "sk-test-not-real", provider: "deepseek" });
  const rec = {};
  globalThis.fetch = stubFetch(rec);

  const result = await adapter.submit({
    id: "wire-1",
    prompt: "Draft a reply",
    system: "You are a catering ops agent.",
    model: "deepseek-flash",
    maxTokens: 512,
  });

  t("request hits /chat/completions", () => assert.ok(rec.url.endsWith("/chat/completions"), rec.url));
  t("uses POST", () => assert.strictEqual(rec.method, "POST"));
  t("sends bearer auth", () => assert.match(rec.headers.Authorization, /^Bearer sk-test/));
  t("model forwarded", () => assert.strictEqual(rec.body.model, "deepseek-flash"));
  t("system + user messages present", () => {
    assert.strictEqual(rec.body.messages[0].role, "system");
    assert.strictEqual(rec.body.messages[1].role, "user");
  });
  t("stream disabled", () => assert.strictEqual(rec.body.stream, false));
  t("output parsed from choices", () => assert.match(result.output, /Booking confirmed/));
  t("usage input mapped", () => assert.strictEqual(result.usage.input, 1200));
  t("usage output mapped", () => assert.strictEqual(result.usage.output, 300));
  t("cache-hit mapped", () => assert.strictEqual(result.usage.cacheHit, 200));
  t("status ok", () => assert.strictEqual(result.status, "ok"));
  t("cost computed > 0", () => assert.ok(result.costUsd > 0, `cost=${result.costUsd}`));

  // cost math must match the adapter's own peak/off-peak resolution
  t("cost math matches adapter (peak/off-peak aware)", () => {
    const expected = computeCost({ model: "deepseek-flash", usage: fixtureResponse.usage }, !isPeakNow(), "deepseek");
    assert.strictEqual(result.costUsd, expected);
    // peak: 200*0.006 + 1000*0.30 + 300*1.20 per 1M = 0.000661 ; off-peak is exactly half
    const peak = computeCost({ model: "deepseek-flash", usage: fixtureResponse.usage }, false, "deepseek");
    const off = computeCost({ model: "deepseek-flash", usage: fixtureResponse.usage }, true, "deepseek");
    assert.strictEqual(peak, 0.000661, `peak expected 0.000661 got ${peak}`);
    assert.strictEqual(off, 0.000331, `off-peak expected 0.000331 got ${off}`);
  });

  // missing key path
  const noKey = new DeepSeekAdapter({ apiKey: "", provider: "deepseek" });
  const r2 = await noKey.submit({ id: "wire-2", prompt: "x" });
  t("no key → error status", () => assert.strictEqual(r2.status, "error"));
  t("no key → actionable error", () => assert.match(r2.error, /DEEPSEEK_API_KEY/));

  // status() probe with stub
  globalThis.fetch = async () => ({ ok: true, status: 200, json: async () => ({ data: [{ id: "deepseek-flash" }] }) });
  const st = await adapter.status();
  t("status ready with key + probe", () => assert.strictEqual(st.ready, true));

  globalThis.fetch = async () => ({ ok: false, status: 401, text: async () => "unauthorized" });
  const st2 = await adapter.status();
  t("status not-ready on 401", () => assert.strictEqual(st2.ready, false));

  console.log(`\n  ${passed} passed, ${failed} failed\n`);
  process.exit(failed === 0 ? 0 : 1);
})();
