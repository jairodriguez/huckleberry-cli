import { existsSync, readFileSync, writeFileSync, mkdirSync, readdirSync, statSync, copyFileSync, cpSync, rmSync } from "node:fs";
import { join, dirname } from "node:path";
import { homedir } from "node:os";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";
import { runInterview } from "./interview.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const PACKAGE_ROOT = ROOT;
// Sandbox support: HUCKLEBERRY_HOME redirects the state root so tests never touch
// a real install. HUCKLEBERRY_TEST=1 implies sandbox mode and suppresses launchd.
const SANDBOX = process.env.HUCKLEBERRY_TEST === "1" || !!process.env.HUCKLEBERRY_HOME;
const HOME = process.env.HUCKLEBERRY_HOME || homedir();
const HB = join(HOME, ".huckleberry");
const SKILLS_TARGET = join(HOME, ".claude", "skills");

const PKG = JSON.parse(readFileSync(join(PACKAGE_ROOT, "package.json"), "utf-8"));
const VERSION = PKG.version;
const PKG_NAME = PKG.name;

const commands = {
  install,
  update,
  harness,
  golden,
  "install-pack": installPack,
  packs: () => listPacks(),
  doctor,
  cro,
  review,
  interview: runInterview,
  help,
  version: () => console.log(`${PKG_NAME} v${VERSION}`),
};

export async function run(args) {
  const cmd = args[0];
  if (!cmd || cmd === "--help" || cmd === "-h") return help();
  const fn = commands[cmd];
  if (!fn) { console.error(`Unknown command: ${cmd}\nRun 'huckleberry help' for usage.`); process.exit(1); }
  try { await fn(args.slice(1)); }
  catch (err) { console.error(`[ERROR] ${err.message}`); process.exit(1); }
}

function help() {
  console.log(`
  ${PKG_NAME} v${VERSION} — your own AI operations department

  Usage: huckleberry <command>

  Commands:
    install          Full first-time install (stack + core skills)
    install-pack <p> Deploy a skill pack (or "all")
    packs            List available skill packs
    doctor           Health check — run when anything feels broken
    harness list|set|test   List/switch execution harnesses (opencode, deepseek, pi)
    golden run       Run golden-set tasks through a harness (telemetry recorded)
    cro <url>        CRO audit of a landing page (agent-powered)
    review           Weekly self-improvement review (proposals only)
    interview        First-run personalization (name, business, tone)
    update           Update to the latest version
    help             This message

  Docs: https://huckleberry.ai
`);
}

// ---------- install ----------

async function install() {
  console.log(`\n  Installing Huckleberry v${VERSION}...\n`);
  const steps = [
    ["Creating ~/.huckleberry...", () => {
      mkdirSync(HB, { recursive: true });
      for (const d of ["logs", "memory", "agents", "scripts", "taskmaster", "kanban", "mcp"]) mkdirSync(join(HB, d), { recursive: true });
    }],
    ["Copying templates (identity, protocols, wiki)...", () => {
      for (const f of ["AGENTS.md", "SOUL.md", "IDENTITY.md", "COS_PROTOCOLS.md", "EXECUTIVE-MODE.md", "HEARTBEAT.md", "TOOLS.md", "MEMORY.md", "ORG.md", "evergreen.md", "business-context-gate.md"]) {
        const src = join(PACKAGE_ROOT, "templates", f);
        if (existsSync(src)) copyFileSync(src, join(HB, f));
      }
      copyDirSync(join(PACKAGE_ROOT, "wiki"), join(HB, "wiki"));
      copyDirSync(join(PACKAGE_ROOT, "agents"), join(HB, "agents"));
      copyDirSync(join(PACKAGE_ROOT, "taskmaster"), join(HB, "taskmaster"));
      copyDirSync(join(PACKAGE_ROOT, "kanban"), join(HB, "kanban"));
      copyDirSync(join(PACKAGE_ROOT, "scripts"), join(HB, "scripts"));
    }],
    ["Deploying skill packs (core + doctor)...", () => {
      deployPack("core");
      deployPack("doctor");
      const count = readdirSync(SKILLS_TARGET).filter((n) => existsSync(join(SKILLS_TARGET, n, "SKILL.md"))).length;
      console.log(`    ${count} skills available in ~/.claude/skills`);
    }],
    ["Setting up ~/.opencode/...", () => {
      const oc = join(HOME, ".opencode");
      mkdirSync(join(oc, "plugin"), { recursive: true });
      copyDirSync(join(PACKAGE_ROOT, "plugins"), join(oc, "plugin"));
      writeConfig(oc);
    }],
    ["Installing Inkstone memory system...", () => {
      const d = join(HB, "mcp", "inkstone");
      mkdirSync(d, { recursive: true });
      writeFileSync(join(d, "package.json"), JSON.stringify({ name: "huckleberry-inkstone-host", private: true, type: "module" }, null, 2));
      execSync("npm install @jairodri/huckleberry-inkstone --no-fund --no-audit 2>/dev/null", { cwd: d, stdio: "pipe", timeout: 120000 });
      console.log(`    Inkstone installed to ${d}`);
    }],
    ["Installing Jev judgment layer...", () => {
      const d = join(HB, "mcp", "jev-mcp");
      mkdirSync(d, { recursive: true });
      writeFileSync(join(d, "package.json"), JSON.stringify({ name: "huckleberry-jev-host", private: true, type: "module" }, null, 2));
      execSync("npm install @jkudish/jev-mcp --no-fund --no-audit 2>/dev/null", { cwd: d, stdio: "pipe", timeout: 120000 });
      console.log(`    Jev installed to ${d}`);
    }],
    ["Setting up kanban workflows...", () => {
      const d = join(HB, "kanban");
      try { execSync("npm install --no-fund --no-audit 2>/dev/null", { cwd: d, stdio: "pipe", timeout: 120000 }); }
      catch { console.log("    Kanban deps skipped (run: cd ~/.huckleberry/kanban && npm install)"); }
    }],
    ["Writing environment template...", () => {
      const env = join(HB, ".env");
      if (!existsSync(env)) {
        writeFileSync(env, [
          "# Huckleberry environment — fill in what you use. Never commit this file.",
          "# Discord bot token (wiki/discord.md has the setup walkthrough)",
          "DISCORD_BOT_TOKEN=",
          "# TypeSafe Jev API key (https://typesafe.ai) — enables judgment tools",
          "TYPESAFE_API_KEY=",
          "# Optional: Discord webhook for doctor alerts + self-improvement reports",
          "DOCTOR_WEBHOOK_URL=",
          "# Optional: channel id where Hermes posts repair reports",
          "DOCTOR_CHANNEL_ID=",
          "# Optional: DeepSeek API key (https://platform.deepseek.com) — enables the deepseek harness",
          "DEEPSEEK_API_KEY=",
          "# Optional: default execution harness override (opencode | deepseek); harness.json wins if set",
          "HUCKLEBERRY_HARNESS=",
          "",
        ].join("\n"));
      }
    }],
  ];

  steps.forEach(([label, fn], i) => {
    console.log(`  [${i + 1}/${steps.length}] ${label}`);
    fn();
  });

  // Background services (platform-specific, non-fatal)
  try {
    if (SANDBOX) throw new Error("sandbox mode — services skipped");
    if (process.platform === "darwin") {
      const env = { ...process.env };
      // Safety: loading launchd services is host-global (ignores HOME). Only load when
      // installing into the real user home AND not explicitly suppressed.
      if (HOME !== join(homedir(), "") || env.HUCKLEBERRY_TEST === "1") {
        env.HUCKLEBERRY_NO_LOAD = "1";
        env.HUCKLEBERRY_TEST_HOME = HOME;
      }
      execSync(`bash "${join(HB, "scripts", "install-services.sh")}" 2>&1`, { env, stdio: "pipe", timeout: 60000 });
      console.log("  Background services installed (launchd). Hermes + doctor watchdog are watching.");
    } else if (process.platform === "win32") {
      execSync(`powershell -ExecutionPolicy Bypass -File "${join(HB, "scripts", "install-services.ps1")}" 2>&1`, { stdio: "pipe", timeout: 60000 });
      console.log("  Background services installed (Task Scheduler).");
    }
  } catch { console.log("  Background services skipped (run manually from ~/.huckleberry/scripts/)"); }

  console.log(`
  ✓ Huckleberry v${VERSION} installed to ${HB}
  ✓ Skills deployed to ${SKILLS_TARGET}
  ✓ Config: ${join(HOME, ".opencode", "opencode.json")}

  Next steps:
    1. npm install -g opencode kimaki   (if not installed)
    2. huckleberry interview            (personalize: name, business, tone)
    3. Add your keys to ~/.huckleberry/.env  (Discord token, Jev key)
    4. huckleberry doctor               (verify everything)
    5. More skills anytime: huckleberry packs && huckleberry install-pack <name>

  Docs: https://huckleberry.ai
`);
}

function writeConfig(ocDir) {
  const dst = join(ocDir, "opencode.json");
  const tpl = readFileSync(join(PACKAGE_ROOT, "templates", "opencode.json"), "utf-8");
  const profile = process.platform === "win32" ? process.env.USERPROFILE : HOME;
  let content = tpl.replaceAll("{{USERPROFILE}}", profile.replace(/\\/g, "\\\\"));
  if (existsSync(dst)) {
    // merge: keep user's existing config, fill in missing top-level keys
    try {
      const existing = JSON.parse(readFileSync(dst, "utf-8"));
      const fresh = JSON.parse(content);
      const merged = { ...fresh, ...existing };
      for (const k of Object.keys(fresh)) if (existing[k] === undefined) merged[k] = fresh[k];
      content = JSON.stringify(merged, null, 2);
    } catch { console.log("    Existing opencode.json not valid JSON — template written alongside as opencode.json.huckleberry"); writeFileSync(join(ocDir, "opencode.json.huckleberry"), content); return; }
  }
  writeFileSync(dst, content);
}

// ---------- skill packs ----------

function loadManifest() {
  return JSON.parse(readFileSync(join(PACKAGE_ROOT, "skills", "manifest.json"), "utf-8"));
}

function listPacks() {
  const m = loadManifest();
  console.log("\n  Available skill packs:\n");
  for (const [name, skills] of Object.entries(m.packs)) {
    console.log(`  ${name.padEnd(16)} ${skills.length} skills — huckleberry install-pack ${name}`);
  }
  console.log(`\n  Install everything: huckleberry install-pack all\n`);
}

function deployPack(packName) {
  const m = loadManifest();
  const names = packName === "all" ? Object.keys(m.packs) : [packName];
  let deployed = 0;
  for (const name of names) {
    const skills = m.packs[name];
    if (!skills) { console.error(`Unknown pack: ${name}\nAvailable: ${Object.keys(m.packs).join(", ")}, all`); process.exit(1); }
    for (const skill of skills) {
      const src = join(PACKAGE_ROOT, "skills", skill);
      if (!existsSync(src)) continue;
      cpSync(src, join(SKILLS_TARGET, skill), { recursive: true });
      deployed++;
    }
  }
  if (packName !== "core" && packName !== "doctor") console.log(`    Deployed ${deployed} skills (${packName})`);
  return deployed;
}

async function installPack(args) {
  const packName = args[0];
  if (!packName || packName === "list") return listPacks();
  mkdirSync(SKILLS_TARGET, { recursive: true });
  const n = deployPack(packName);
  console.log(`\n  ✓ Pack "${packName}" deployed (${n} skills → ~/.claude/skills)\n  Restart opencode sessions to pick them up.\n`);
}

// ---------- doctor ----------

function check(name, fn) {
  try { const r = fn(); console.log(`  ✓ ${name}${r ? ` — ${r}` : ""}`); return true; }
  catch (e) { console.log(`  ✗ ${name} — ${e.message}`); return false; }
}

async function doctor() {
  console.log(`\n  Huckleberry Doctor v${VERSION}\n`);
  let bad = 0;
  const C = (n, f) => { if (!check(n, f)) bad++; };

  C("node", () => execSync("node --version", { stdio: "pipe" }).toString().trim());
  C("npm", () => execSync("npm --version", { stdio: "pipe" }).toString().trim());
  C("opencode", () => execSync("opencode --version", { stdio: "pipe" }).toString().trim());
  C("kimaki", () => execSync("kimaki --version", { stdio: "pipe" }).toString().trim());
  C("~/.huckleberry", () => { if (!existsSync(HB)) throw new Error("not installed — run: huckleberry install"); });
  C("opencode config", () => { JSON.parse(readFileSync(join(HOME, ".opencode", "opencode.json"), "utf-8")); });
  C("Inkstone MCP", () => { const p = join(HB, "mcp/inkstone/node_modules/@jairodri/huckleberry-inkstone/dist/mcp/server.js"); if (!existsSync(p)) throw new Error("missing — cd ~/.huckleberry/mcp/inkstone && npm install"); });
  C("Jev MCP", () => { const p = join(HB, "mcp/jev-mcp/node_modules/@jkudish/jev-mcp/dist/index.js"); if (!existsSync(p)) throw new Error("missing — cd ~/.huckleberry/mcp/jev-mcp && npm install"); });
  C("skills", () => { const n = readdirSync(SKILLS_TARGET).filter((s) => existsSync(join(SKILLS_TARGET, s, "SKILL.md"))).length; if (n < 10) throw new Error(`only ${n} skills — huckleberry install-pack all`); return `${n} skills`; });
  C(".env keys", () => {
    const env = join(HB, ".env");
    if (!existsSync(env)) throw new Error("missing — run: huckleberry install");
    const keys = readFileSync(env, "utf-8").split("\n").filter((l) => /^[A-Z_]+=/.test(l) && !l.endsWith("=")).map((l) => l.split("=")[0]);
    if (!keys.length) throw new Error("no keys set yet (~/.huckleberry/.env) — add DISCORD_BOT_TOKEN / TYPESAFE_API_KEY");
    return `set: ${keys.join(", ")}`;
  });
  C("disk", () => {
    const out = execSync(`df -k "${HOME}" | tail -1`, { shell: "/bin/bash", stdio: "pipe" }).toString().trim().split(/\s+/);
    const freeMb = Math.round(parseInt(out[out.length - 4] || "0", 10) / 1024);
    if (freeMb < 2048) throw new Error(`only ${freeMb}MB free`);
    return `${freeMb}MB free`;
  });

  console.log("");
  if (bad === 0) {
    console.log("  ✓ All checks passing. Your system is healthy.\n");
    return;
  }
  console.log(`  ${bad} check(s) failing.`);
  console.log("  Auto-fix: say \"fix it\" to your Hermes agent, or run:");
  console.log(`    opencode run --agent hermes "huckleberry doctor shows failures — diagnose and repair per ~/.huckleberry/agents/hermes/hermes-fixer.md"\n`);
}

// ---------- harness ----------

async function harness(args) {
  const { describeAdapters, loadDefault, saveDefault, get } = await import("./harness/registry.js");
  const sub = args[0] || "list";

  if (sub === "list") {
    const { rows, defaultId } = await describeAdapters(HOME);
    console.log(`\n  Execution harnesses (default: ${defaultId || "opencode"})\n`);
    for (const r of rows) {
      const flag = r.isDefault ? " ← default" : "";
      const state = r.ready ? "✓ ready" : `✗ ${r.reason}`;
      console.log(`  ${r.id.padEnd(10)} ${state}${flag}`);
      console.log(`  ${"".padEnd(10)} ${r.label}${r.detail ? ` — ${r.detail}` : ""}`);
      const c = r.caps;
      console.log(`  ${"".padEnd(10)} tools:${c.tools ? "yes" : "no"} files:${c.files ? "yes" : "no"} checkpoint:${c.checkpoint ? "yes" : "no"} streaming:${c.streaming ? "yes" : "no"} · ~$${c.costPerMTokIn}/M in · ~$${c.costPerMTokOut}/M out`);
      if (!r.ready && r.detail) console.log(`  ${"".padEnd(10)} fix: ${r.detail}`);
      console.log("");
    }
    console.log(`  Switch default: huckleberry harness set <name>`);
    return;
  }

  if (sub === "set") {
    const id = args[1];
    if (!id) { console.error("Usage: huckleberry harness set <opencode|deepseek>"); process.exit(1); }
    if (!get(id)) { console.error(`Unknown harness: ${id} — run 'huckleberry harness list'`); process.exit(1); }
    saveDefault(id, HOME);
    console.log(`\n  ✓ Default harness set to "${id}" — persisted to ${join(HB, "harness.json")}\n`);
    return;
  }

  if (sub === "test") {
    const id = args[1];
    if (!id || !get(id)) { console.error(`Usage: huckleberry harness test <${"opencode|deepseek"}>`); process.exit(1); }
    const a = get(id);
    const st = await a.status();
    const c = a.capabilities();
    console.log(`\n  ${id}: ${st.ready ? "✓ ready" : `✗ ${st.reason}`}${st.detail ? ` — ${st.detail}` : ""}`);
    console.log(`  caps: ${JSON.stringify(c)}`);
    console.log(`  interface: ${typeof a.submit === "function" && typeof a.stream === "function" && typeof a.checkpoint === "function" && typeof a.resume === "function" && typeof a.cancel === "function" && typeof a.downloadFiles === "function" ? "✓ full HarnessAdapter surface" : "✗ missing methods"}\n`);
    process.exit(st.ready ? 0 : 4);
  }

  console.error(`Unknown harness subcommand: ${sub} (use list | set | test)`);
  process.exit(1);
}

// ---------- golden ----------

async function golden(args) {
  const sub = args[0] || "run";
  if (sub !== "run") { console.error("Usage: huckleberry golden run --adapter <opencode|deepseek> [--filter id] [--limit N] [--verbose]"); process.exit(1); }
  const runner = join(PACKAGE_ROOT, "tests", "golden", "runner.js");
  if (!existsSync(runner)) { console.error("Golden set not found — tests/golden/ missing"); process.exit(1); }
  const { spawnSync } = await import("node:child_process");
  const rest = args.slice(1);
  const res = spawnSync(process.execPath, [runner, ...rest], { stdio: "inherit", env: { ...process.env, HUCKLEBERRY_HOME: process.env.HUCKLEBERRY_HOME || HOME } });
  process.exit(res.status ?? 1);
}

// ---------- cro ----------

async function cro(args) {
  const url = args.find((a) => !a.startsWith("-"));
  if (!url) { console.error("Usage: huckleberry cro <url>\nExample: huckleberry cro https://mysite.com/pricing"); process.exit(1); }
  if (!commandExists("opencode")) { console.error("opencode not installed — npm install -g opencode"); process.exit(1); }
  console.log(`\n  Running CRO audit of ${url} (agent-powered, may take a few minutes)...\n`);
  execSync(
    `opencode run "Run the page-cro skill audit on ${url}. Score the page, list the top conversion problems in priority order, and give concrete fixes for each. Keep it actionable."`,
    { stdio: "inherit" }
  );
}

// ---------- review ----------

async function review() {
  if (!commandExists("opencode")) { console.error("opencode not installed — npm install -g opencode"); process.exit(1); }
  const dir = join(HB, "logs", "self-improve");
  mkdirSync(dir, { recursive: true });
  const report = join(dir, `${new Date().toISOString().split("T")[0]}.md`);
  console.log(`\n  Weekly self-improvement review (proposals only — nothing is auto-changed)...\n`);
  execSync(
    `opencode run "Weekly self-improvement review. 1. Review recent failures/corrections in Inkstone (memory_failures, memory_search). 2. Read ${join(HB, "MEMORY.md")} and ${join(HB, "evergreen.md")}. 3. Propose 2-3 CONCRETE improvements (skill to adjust, repeated mistake to prevent, workflow to automate) with evidence and expected benefit. Do NOT apply changes — proposals only. Write the report to ${report}."`,
    { stdio: "inherit" }
  );
  console.log(`\n  Report: ${report}\n`);
}

function commandExists(cmd) {
  try { execSync(`command -v ${cmd}`, { shell: "/bin/bash", stdio: "pipe" }); return true; }
  catch { return false; }
}

// ---------- update ----------

async function update() {
  console.log("\n  Updating Huckleberry...\n");
  try { execSync(`npm install -g ${PKG_NAME}@latest`, { stdio: "inherit" }); }
  catch { console.error(`  ⚠ Update failed. Try: npm install -g ${PKG_NAME}@latest\n`); }
  try {
    const d = join(HB, "mcp", "inkstone");
    if (existsSync(d)) execSync("npm update @jairodri/huckleberry-inkstone 2>/dev/null", { cwd: d, stdio: "pipe", timeout: 60000 });
  } catch { console.error("  ⚠ Inkstone update failed. Run: cd ~/.huckleberry/mcp/inkstone && npm update"); }
  console.log("");
}

// ---------- helpers ----------

function copyDirSync(src, dst) {
  if (!existsSync(src)) return;
  mkdirSync(dst, { recursive: true });
  for (const entry of readdirSync(src)) {
    if (entry === ".git" || entry === "node_modules" || entry === "lint-report.txt") continue;
    const s = join(src, entry), d = join(dst, entry);
    if (statSync(s).isDirectory()) copyDirSync(s, d); else copyFileSync(s, d);
  }
}
