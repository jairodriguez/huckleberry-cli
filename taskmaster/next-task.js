#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const TASKS_FILE = path.join(__dirname, 'tasks', 'tasks.json');

const PRIORITY_RANK = { high: 0, medium: 1, low: 2 };

function parseArgs(argv) {
  const args = argv.slice(2);
  const getFlag = (name) => {
    const i = args.indexOf(name);
    return i !== -1 && args[i + 1] ? args[i + 1] : null;
  };
  return {
    tag: getFlag('--tag'),
    business: getFlag('--business'),
    inProgress: args.includes('--in-progress'),
  };
}

function resolveTasksFile(business) {
  if (!business) return TASKS_FILE;
  return path.join(ROOT, 'businesses', business, '.taskmaster', 'tasks', 'tasks.json');
}

function depsMet(deps, statusById) {
  return (deps || []).every(depId => {
    const key = typeof depId === 'number' ? depId : Number(depId);
    return statusById[key] === 'done' || statusById[depId] === 'done';
  });
}

function nextPendingSubtask(task) {
  if (!task.subtasks || task.subtasks.length === 0) return null;
  const subStatusById = {};
  for (const st of task.subtasks) {
    const sid = typeof st.id === 'string' ? Number(st.id.split('.')[1]) : st.id;
    subStatusById[sid] = st.status;
    subStatusById[st.id] = st.status;
  }
  const sorted = [...task.subtasks].sort((a, b) => {
    const ra = PRIORITY_RANK[a.priority] ?? 1;
    const rb = PRIORITY_RANK[b.priority] ?? 1;
    return ra - rb;
  });
  for (const st of sorted) {
    if (st.status === 'pending' && depsMet(st.dependencies, subStatusById)) {
      return { id: st.id, title: st.title };
    }
  }
  return null;
}

function main() {
  const { tag, business, inProgress } = parseArgs(process.argv);
  const tasksFile = resolveTasksFile(business);

  if (!fs.existsSync(tasksFile)) {
    console.error('ERROR: tasks.json not found at ' + tasksFile);
    process.exit(1);
  }

  const data = JSON.parse(fs.readFileSync(tasksFile, 'utf8'));
  const allowedStatuses = inProgress ? ['pending', 'in-progress'] : ['pending'];

  const statusById = {};
  for (const tagData of Object.values(data)) {
    if (!tagData.tasks) continue;
    for (const task of tagData.tasks) {
      statusById[task.id] = task.status;
    }
  }

  const candidates = [];
  const tagsToSearch = tag ? [tag] : Object.keys(data);

  for (const tagKey of tagsToSearch) {
    const tagData = data[tagKey];
    if (!tagData || !tagData.tasks) continue;

    for (const task of tagData.tasks) {
      if (!allowedStatuses.includes(task.status)) continue;
      if (!depsMet(task.dependencies, statusById)) continue;

      const hasSubtasks = !!(task.subtasks && task.subtasks.length > 0);
      const sub = hasSubtasks ? nextPendingSubtask(task) : null;

      candidates.push({
        tag: tagKey,
        id: task.id,
        title: task.title,
        priority: task.priority || 'medium',
        status: task.status,
        hasSubtasks,
        nextSubtask: sub,
        description: task.description || '',
        details: task.details || '',
        testStrategy: task.testStrategy || '',
        complexity: task.complexity,
        redZone: task.redZone || false
      });
    }
  }

  candidates.sort((a, b) => {
    const pa = PRIORITY_RANK[a.priority] ?? 3;
    const pb = PRIORITY_RANK[b.priority] ?? 3;
    if (pa !== pb) return pa - pb;
    return (a.id || 0) - (b.id || 0);
  });

  if (candidates.length === 0) {
    console.log('NO_TASKS_READY');
    process.exit(0);
  }

  console.log(JSON.stringify(candidates[0], null, 2));
}

main();
