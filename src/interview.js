import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";
import { createInterface } from "node:readline";

const HOME = homedir();
const HB_DIR = join(HOME, ".huckleberry");

function ask(rl, question) {
  return new Promise((resolve) => {
    rl.question(`  ${question} `, (answer) => resolve(answer.trim()));
  });
}

export async function runInterview() {
  console.log(`\n  ╔════════════════════════════════════════════════════════════╗`);
  console.log(`  ║           HUCKLEBERRY — First Run Setup                    ║`);
  console.log(`  ╚════════════════════════════════════════════════════════════╝`);
  console.log(`\n  I'll ask a few questions to set up your AI system.\n`);

  const rl = createInterface({ input: process.stdin, output: process.stdout });
  const answers = {};

  answers.name = await ask(rl, "What's your name?");
  answers.role = await ask(rl, "What's your role/title?");
  answers.timezone = await ask(rl, "Timezone (e.g., America/Mexico_City, UTC-5)?");
  answers.business = await ask(rl, "Your business name?");
  answers.description = await ask(rl, "What does your business do? (one sentence)");
  answers.website = await ask(rl, "Website? (optional)");

  console.log(`\n  Communication style:`);
  answers.tone = (await ask(rl, "Direct (d) or detailed (e)? [d/E]")).toLowerCase() === "d" ? "direct" : "detailed";
  answers.proactive = (await ask(rl, "Proactive (p) or wait (r)? [p/R]")).toLowerCase() === "p" ? "proactive" : "reactive";

  console.log(`\n  Help areas (comma-separated): outreach, content, research, social, seo, marketing, ops, all`);
  answers.priorities = await ask(rl, ">");

  console.log(`\n  Optional keys (press Enter to skip — you can add them later in ~/.huckleberry/.env):`);
  answers.typesafeKey = await ask(rl, "TypeSafe Jev API key (typesafe.ai)?");
  answers.discordToken = await ask(rl, "Discord bot token?");
  rl.close();

  writeFileSync(join(HB_DIR, "USER.md"), [
    "# USER.md — User Profile", "",
    `**Name:** ${answers.name}`,
    `**Role:** ${answers.role}`,
    `**Timezone:** ${answers.timezone}`,
    `**Business:** ${answers.business}`,
    `**Website:** ${answers.website || "N/A"}`,
    "", "## Communication Preferences",
    `**Tone:** ${answers.tone}`,
    `**Style:** ${answers.proactive}`,
    ``, `*Generated: ${new Date().toISOString().split("T")[0]}*`, "",
  ].join("\n"), "utf-8");

  writeFileSync(join(HB_DIR, "evergreen.md"), [
    "# Evergreen: " + answers.business,
    `> **Last updated**: ${new Date().toISOString().split("T")[0]}`,
    "", "## What Is This Business?",
    answers.description,
    answers.website || "", "",
    "## Current State",
    "### What's Working", "- [ ]",
    "### What Needs Work", `- ${answers.priorities}`, "",
    "## Notes", "_Add decisions and context here._", "",
  ].join("\n"), "utf-8");

  for (const p of [
    { path: "SOUL.md", replacements: { "[USER_NAME]": answers.name, "[USER_BUSINESS]": answers.business } },
    { path: "IDENTITY.md", replacements: { "[USER_NAME]": answers.name, "[USER_BUSINESS]": answers.business, "[USER_TIMEZONE]": answers.timezone } },
  ]) {
    const f = join(HB_DIR, p.path);
    if (existsSync(f)) {
      let c = readFileSync(f, "utf-8");
      for (const [k, v] of Object.entries(p.replacements)) {
        c = c.replace(new RegExp(k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g"), v || "");
      }
      writeFileSync(f, c, "utf-8");
    }
  }

  // Write provided keys into ~/.huckleberry/.env (never overwrite existing values)
  const envFile = join(HB_DIR, ".env");
  let env = existsSync(envFile) ? readFileSync(envFile, "utf-8") : "DISCORD_BOT_TOKEN=\nTYPESAFE_API_KEY=\n";
  const setIfEmpty = (key, val) => {
    if (!val) return;
    const re = new RegExp(`^${key}=.*$`, "m");
    env = re.test(env) ? env.replace(re, `${key}=${val}`) : `${env}${key}=${val}\n`;
  };
  setIfEmpty("TYPESAFE_API_KEY", answers.typesafeKey);
  setIfEmpty("DISCORD_BOT_TOKEN", answers.discordToken);
  writeFileSync(envFile, env, "utf-8");

  // Patch the Jev MCP env in ~/.opencode/opencode.json so judgment tools work out of the box
  if (answers.typesafeKey) {
    const ocFile = join(HOME, ".opencode", "opencode.json");
    if (existsSync(ocFile)) {
      try {
        const cfg = JSON.parse(readFileSync(ocFile, "utf-8"));
        if (cfg.mcp?.jev?.environment) cfg.mcp.jev.environment.TYPESAFE_API_KEY = answers.typesafeKey;
        writeFileSync(ocFile, JSON.stringify(cfg, null, 2));
      } catch { /* leave config untouched if invalid */ }
    }
  }

  console.log(`\n  ✓ USER.md, evergreen.md, SOUL.md, IDENTITY.md generated`);
  if (answers.typesafeKey) console.log(`  ✓ Jev judgment layer configured`);
  if (answers.discordToken) console.log(`  ✓ Discord token saved to ~/.huckleberry/.env (see ~/.huckleberry/wiki/discord.md to finish wiring)`);
  console.log(`  Next: type 'opencode' to start with your COS.\n`);
}
