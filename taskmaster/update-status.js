#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const TASKS_FILE = path.join(__dirname, 'tasks', 'tasks.json');

const VALID_STATUSES = ['pending', 'in-progress', 'done', 'blocked', 'review', 'deferred'];

function parseArgs(argv) {
  const args = argv.slice(2);
  if (args.length < 2) {
    console.error('Usage: update-status.js <id> <status> [--business=name] [--note="reason"]');
    console.error('  id:       "5" (parent) or "5.2" (subtask)');
    console.error('  status:   ' + VALID_STATUSES.join(' | '));
    console.error('  business: nomadixgear-sa | teyoapa | aiwithjai | (omit for root)');
    process.exit(1);
  }

  const id = args[0];
  const status = args[1];
  const businessArg = args.find(a => a.startsWith('--business='));
  const business = businessArg ? businessArg.slice(11) : null;
  const noteArg = args.find(a => a.startsWith('--note='));
  const note = noteArg ? noteArg.slice(7) : null;

  if (!VALID_STATUSES.includes(status)) {
    console.error('Invalid status "' + status + '". Valid: ' + VALID_STATUSES.join(', '));
    process.exit(1);
  }

  return { id, status, business, note };
}

function resolveTasksFile(business) {
  if (!business) return TASKS_FILE;
  return path.join(ROOT, 'businesses', business, '.taskmaster', 'tasks', 'tasks.json');
}

function atomicWrite(filePath, content) {
  const dir = path.dirname(filePath);
  const tmp = path.join(dir, '.tasks-tmp-' + process.pid + '-' + Date.now() + '.json');
  fs.writeFileSync(tmp, content, 'utf8');
  fs.renameSync(tmp, filePath);
}

function appendNote(obj, note) {
  const ts = new Date().toISOString();
  const entry = '[' + ts + '] ' + note;
  obj.details = obj.details ? obj.details + '\n' + entry : entry;
}

function findAndUpdate(data, id, status, note) {
  const isSubtask = id.includes('.');

  if (isSubtask) {
    const parts = id.split('.');
    const parentId = Number(parts[0]);
    const subNum = Number(parts[1]);

    for (const tagData of Object.values(data)) {
      if (!tagData.tasks) continue;
      const parent = tagData.tasks.find(t => t.id === parentId);
      if (!parent || !parent.subtasks) continue;

      const subtask = parent.subtasks.find(st => {
        if (typeof st.id === 'string') {
          return st.id === id || st.id === String(subNum) || Number(st.id.split('.')[1]) === subNum;
        }
        return st.id === subNum;
      });

      if (subtask) {
        subtask.status = status;
        if (note) appendNote(subtask, note);
        return { tag: parent.title, id: id, title: subtask.title };
      }
    }
  } else {
    const numId = Number(id);
    for (const [tagKey, tagData] of Object.entries(data)) {
      if (!tagData.tasks) continue;
      const task = tagData.tasks.find(t => t.id === numId || String(t.id) === String(id));
      if (task) {
        task.status = status;
        if (note) appendNote(task, note);
        return { tag: tagKey, id: id, title: task.title };
      }
    }
  }

  return null;
}

function main() {
  const { id, status, business, note } = parseArgs(process.argv);
  const tasksFile = resolveTasksFile(business);

  if (!fs.existsSync(tasksFile)) {
    console.error('ERROR: tasks.json not found at ' + tasksFile);
    process.exit(1);
  }

  const data = JSON.parse(fs.readFileSync(tasksFile, 'utf8'));
  const result = findAndUpdate(data, id, status, note);

  if (!result) {
    console.error('Task ' + id + ' not found' + (business ? ' in ' + business : ''));
    process.exit(1);
  }

  atomicWrite(tasksFile, JSON.stringify(data, null, 2) + '\n');
  const loc = business || 'root';
  console.log('OK: [' + loc + '/' + result.tag + '] task ' + result.id + ' -> ' + status + (note ? ' (note: ' + note + ')' : ''));
}

main();
