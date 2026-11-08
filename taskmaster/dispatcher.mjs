#!/usr/bin/env node
// Huckleberry Dispatcher — scans taskmaster, picks next task, spawns worker
// Called by cron every 30 minutes

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const HB_DIR = join(process.env.HOME || process.env.USERPROFILE, ".huckleberry");
const TASK_FILE = join(HB_DIR, "taskmaster", "tasks", "tasks.json");
const STATE_FILE = join(HB_DIR, "dispatcher-state.json");
const LOG_FILE = join(HB_DIR, "dispatcher.log");

const PRIORITY_RANK = { high: 0, medium: 1, low: 2 };

function log(msg) {
  const ts = new Date().toISOString();
  const line = `[${ts}] ${msg}`;
  console.log(line);
  try { writeFileSync(LOG_FILE, line + "\n", { flag: "a" }); } catch {}
}

function loadTasks() {
  if (!existsSync(TASK_FILE)) return { projects: [], tasks: [] };
  return JSON.parse(readFileSync(TASK_FILE, "utf-8"));
}

function saveTasks(data) {
  writeFileSync(TASK_FILE, JSON.stringify(data, null, 2) + "\n");
}

function loadState() {
  if (!existsSync(STATE_FILE)) return { lastPick: null, cycle: 0 };
  return JSON.parse(readFileSync(STATE_FILE, "utf-8"));
}

function saveState(state) {
  writeFileSync(STATE_FILE, JSON.stringify(state, null, 2) + "\n");
}

function depsMet(task, allTasks) {
  if (!task.dependencies || task.dependencies.length === 0) return true;
  const statusById = {};
  for (const t of allTasks) statusById[t.id] = t.status;
  return task.dependencies.every((depId) => statusById[depId] === "done");
}

function isSessionActive(sessionId) {
  if (!sessionId) return false;
  try {
    const out = execSync(`kimaki session list --json 2>/dev/null`, {
      encoding: "utf8",
      timeout: 10000,
    });
    const sessions = JSON.parse(out);
    const s = sessions.find((s) => s.id === sessionId);
    if (!s) return false;
    const status = s.status || s.state || "";
    return ["active", "running", "waiting"].includes(status);
  } catch {
    return false;
  }
}

function pickTask() {
  const data = loadTasks();
  const tasks = data.tasks || [];
  const state = loadState();
  state.cycle++;

  const candidates = tasks.filter(
    (t) =>
      t.status === "pending" &&
      depsMet(t, tasks) &&
      !isSessionActive(t.sessionId)
  );

  if (candidates.length === 0) {
    log("No pending tasks with met dependencies");
    return null;
  }

  // Sort by priority, then by rotation fairness
  candidates.sort((a, b) => {
    const pa = PRIORITY_RANK[a.priority] ?? 1;
    const pb = PRIORITY_RANK[b.priority] ?? 1;
    if (pa !== pb) return pa - pb;
    // Skip last picked task for fairness
    if (a.id === state.lastPick) return 1;
    if (b.id === state.lastPick) return -1;
    return (a.createdAt || "").localeCompare(b.createdAt || "");
  });

  const pick = candidates[0];
  state.lastPick = pick.id;
  saveState(state);
  return pick;
}

async function dispatch(task) {
  log(`Dispatching task #${task.id}: ${task.title} (agent: ${task.agent || "build"})`);

  const channelId = task.channelId || process.env.HUCKLEBERRY_CHANNEL_ID;
  if (!channelId) {
    log(`ERROR: No channelId for task #${task.id}`);
    return;
  }

  const agent = task.agent || "build";
  const prompt = `Task #${task.id}: ${task.title}\n${task.description || ""}`;

  try {
    const out = execSync(
      `kimaki send --channel ${channelId} --prompt '${prompt.replace(/'/g, "'\\''")}' --agent ${agent} 2>/dev/null`,
      { encoding: "utf8", timeout: 30000 }
    );

    // Extract threadId and sessionId from output
    const threadMatch = out.match(/thread[=:]?\s*["']?(\d+)["']?/i);
    const sessionMatch = out.match(/session[=:]?\s*["']?([a-zA-Z0-9_]+)["']?/i);

    // Update task with thread/session info
    const data = loadTasks();
    const t = data.tasks.find((t) => t.id === task.id);
    if (t) {
      t.status = "in-progress";
      if (threadMatch) t.threadId = threadMatch[1];
      if (sessionMatch) t.sessionId = sessionMatch[1];
      saveTasks(data);
    }

    log(`Dispatched task #${task.id} — session: ${sessionMatch?.[1] || "unknown"}`);
  } catch (err) {
    log(`ERROR dispatching task #${task.id}: ${err.message}`);
  }
}

// Main
const task = pickTask();
if (task) {
  dispatch(task);
} else {
  log("No tasks to dispatch");
}
