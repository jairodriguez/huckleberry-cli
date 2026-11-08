#!/usr/bin/env node
import { spawn } from "node:child_process";
import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "../..");

function getApiKey() {
  if (process.env.GEMINI_API_KEY) return process.env.GEMINI_API_KEY;
  const envPath = join(ROOT, ".env");
  if (existsSync(envPath)) {
    const match = readFileSync(envPath, "utf8").match(/^GEMINI_API_KEY=(.+)/m);
    if (match) return match[1].trim();
  }
  return null;
}

function gemini(req) {
  return new Promise((resolve, reject) => {
    const key = getApiKey();
    const env = { ...process.env, GEMINI_API_KEY: key };
    const proc = spawn("gemini", ["-y", "-o", "json", req], { env, cwd: ROOT });
    let stdout = "", stderr = "";
    proc.stdout.on("data", d => stdout += d);
    proc.stderr.on("data", d => stderr += d);
    proc.on("close", code => {
      if (code !== 0) return reject(new Error(stderr || `exit ${code}`));
      try {
        const parsed = JSON.parse(stdout);
        resolve({
          response: parsed.response || stdout,
          stats: parsed.stats || {},
          files: parsed.stats?.files || {}
        });
      } catch {
        resolve({ response: stdout, stats: {}, files: {} });
      }
    });
  });
}

const TOOLS = [
  {
    name: "gemini_codegen",
    description: "Generate TypeScript/JavaScript code using the free Gemini API. Use for: new file creation, boilerplate, component scaffolding, test scaffolding, data structure definitions. Do NOT use for: code review, debugging, analysis, research, planning.",
    inputSchema: {
      type: "object",
      properties: {
        prompt: { type: "string", description: "Detailed code generation prompt describing exactly what to create" }
      },
      required: ["prompt"]
    }
  },
  {
    name: "gemini_prompt",
    description: "Run any prompt through the free Gemini API without writing files. Use for: data extraction, classification, tagging, JSON transformation, regex generation, schema inference, summarization, format conversion (CSV->JSON, markdown->HTML), simple Q&A. Saves paid model tokens.",
    inputSchema: {
      type: "object",
      properties: {
        prompt: { type: "string", description: "The prompt to send to Gemini" },
        systemPrompt: { type: "string", description: "Optional system instruction to set context/behavior" }
      },
      required: ["prompt"]
    }
  }
];

function send(id, result) {
  process.stdout.write(JSON.stringify({ jsonrpc: "2.0", id, ...result }) + "\n");
}

process.stdin.on("data", async (chunk) => {
  for (const line of chunk.toString().split("\n").filter(Boolean)) {
    try {
      const msg = JSON.parse(line);
      const { method, id, params } = msg;

      if (method === "initialize") {
        send(id, {
          result: {
            protocolVersion: "2024-11-05",
            capabilities: { tools: {} }
          }
        });
      } else if (method === "notifications/initialized") {
        // ignore
      } else if (method === "tools/list") {
        send(id, { result: { tools: TOOLS } });
      } else if (method === "tools/call") {
        const name = params?.name;
        const args = params?.arguments || {};
        const key = getApiKey();
        if (!key) {
          send(id, { error: { code: -32000, message: "GEMINI_API_KEY not found" } });
          continue;
        }

        const tool = TOOLS.find(t => t.name === name);
        if (!tool) {
          send(id, { error: { code: -32601, message: `Unknown tool: ${name}` } });
          continue;
        }

        try {
          let fullPrompt = args.prompt || "";
          if (args.systemPrompt) {
            fullPrompt = `[System Instructions]\n${args.systemPrompt}\n\n[Task]\n${fullPrompt}`;
          }
          const result = await gemini(fullPrompt);
          const tokens = result.stats?.tokens?.total;
          const model = result.stats?.models && Object.keys(result.stats.models).join(", ");
          const meta = [tokens ? `Tokens: ${tokens}` : null, model ? `Model: ${model}` : null].filter(Boolean).join(" | ");

          send(id, {
            result: {
              content: [
                { type: "text", text: result.response },
                { type: "text", text: meta || "Done." }
              ]
            }
          });
        } catch (err) {
          send(id, { error: { code: -32000, message: err.message } });
        }
      }
    } catch (e) {
      // not JSON, ignore
    }
  }
});

process.stdin.on("end", () => process.exit(0));
