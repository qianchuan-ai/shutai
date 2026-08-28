// ═══════════════════════════════════════════════════════════
// 枢台 · 状态管理
// 管理 todos / intake / ideas 的本地状态 + 服务端同步
// ═══════════════════════════════════════════════════════════

import { getState, setState, getData } from './api.js';

const store = {
  todos: [],
  intake: [],
  ideas: [],
  habits: [],
  methodologies: [],
  skills: [],
  config: null,
  _listeners: new Set()
};

// 订阅状态变化
export function subscribe(fn) {
  store._listeners.add(fn);
  return () => store._listeners.delete(fn);
}

function notify() {
  store._listeners.forEach(fn => {
    try { fn(store); } catch (e) { console.error('[Store] 监听器错误:', e); }
  });
}

// ── 初始化 ─────────────────────────────────────────────────
export async function initStore() {
  const [todos, intake, ideas, habits, methodologies, skills] = await Promise.all([
    getState('todos').catch(() => []),
    getState('intake').catch(() => []),
    getState('ideas').catch(() => []),
    getState('habits').catch(() => getDefaultHabits()),
    getData('methodology').catch(() => []),
    getData('skills').catch(() => []),
  ]);
  store.todos = todos;
  store.intake = intake;
  store.ideas = ideas;
  store.habits = habits;
  store.methodologies = methodologies;
  store.skills = skills;
  notify();
}

// ── Getters ────────────────────────────────────────────────
export function getTodos() { return store.todos; }
export function getIntake() { return store.intake; }
export function getIdeas() { return store.ideas; }
export function getHabits() { return store.habits; }
export function getMethodologies() { return store.methodologies; }
export function getSkills() { return store.skills; }
export function getStore() { return store; }

// ── Todos ──────────────────────────────────────────────────
export async function addTodo(text) {
  const todo = { id: Date.now(), text, done: false, createdAt: new Date().toISOString() };
  store.todos.unshift(todo);
  notify();
  await setState('todos', store.todos).catch(() => {});
  return todo;
}

export async function toggleTodo(id) {
  const todo = store.todos.find(t => t.id === id);
  if (todo) {
    todo.done = !todo.done;
    notify();
    await setState('todos', store.todos).catch(() => {});
  }
}

export async function deleteTodo(id) {
  store.todos = store.todos.filter(t => t.id !== id);
  notify();
  await setState('todos', store.todos).catch(() => {});
}

// ── Intake（资讯吸收）──────────────────────────────────────
export async function addIntakeLinks(text) {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  const newItems = lines.map(url => ({
    id: Date.now() + Math.random(),
    url,
    domain: extractDomain(url),
    status: 'pending', // pending / imported
    createdAt: new Date().toISOString()
  }));
  store.intake = [...newItems, ...store.intake];
  notify();
  await setState('intake', store.intake).catch(() => {});
  return newItems.length;
}

export async function markIntakeImported(id) {
  const item = store.intake.find(i => i.id === id);
  if (item) {
    item.status = 'imported';
    notify();
    await setState('intake', store.intake).catch(() => {});
  }
}

export async function deleteIntake(id) {
  store.intake = store.intake.filter(i => i.id !== id);
  notify();
  await setState('intake', store.intake).catch(() => {});
}

export function getPendingIntakeCount() {
  return store.intake.filter(i => i.status === 'pending').length;
}

// 添加 AI 输出
export async function addIntakeOutput(title, content, category = '其他') {
  const item = {
    id: Date.now() + Math.random(),
    type: 'output',
    title,
    content,
    category,
    source: '提示工坊',
    createdAt: new Date().toISOString(),
    archived: false
  };
  store.intake = [item, ...store.intake];
  notify();
  await setState('intake', store.intake).catch(() => {});
  return item;
}

// ── Ideas（灵感速记）───────────────────────────────────────
export async function addIdea(text) {
  const idea = {
    id: Date.now(),
    text,
    absorbed: false,
    createdAt: new Date().toISOString()
  };
  store.ideas.unshift(idea);
  notify();
  await setState('ideas', store.ideas).catch(() => {});
  return idea;
}

export async function deleteIdea(id) {
  store.ideas = store.ideas.filter(i => i.id !== id);
  notify();
  await setState('ideas', store.ideas).catch(() => {});
}

export async function markIdeaAbsorbed(id) {
  const idea = store.ideas.find(i => i.id === id);
  if (idea) {
    idea.absorbed = true;
    notify();
    await setState('ideas', store.ideas).catch(() => {});
  }
}

// ── 工具函数 ───────────────────────────────────────────────
function extractDomain(url) {
  try {
    return new URL(url).hostname.replace('www.', '');
  } catch {
    return 'text';
  }
}

// ── Habits（习惯追踪）──────────────────────────────────────
function getDefaultHabits() {
  return [
    { id: 1, name: '喝水', icon: 'water', color: 'blue', records: {} },
    { id: 2, name: '运动', icon: 'heart', color: 'red', records: {} },
    { id: 3, name: '阅读', icon: 'book', color: 'green', records: {} },
    { id: 4, name: '冥想', icon: 'zap', color: 'purple', records: {} },
    { id: 5, name: '早睡', icon: 'moon', color: 'blue', records: {} },
  ];
}

export function getTodayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

export async function toggleHabit(habitId, dateStr) {
  const habit = store.habits.find(h => h.id === habitId);
  if (!habit) return;
  if (!dateStr) dateStr = getTodayStr();
  if (habit.records[dateStr]) {
    delete habit.records[dateStr];
  } else {
    habit.records[dateStr] = true;
  }
  notify();
  await setState('habits', store.habits).catch(() => {});
}

export async function addHabit(name, icon, color) {
  const habit = {
    id: Date.now(),
    name,
    icon: icon || 'star',
    color: color || 'blue',
    records: {}
  };
  store.habits.push(habit);
  notify();
  await setState('habits', store.habits).catch(() => {});
  return habit;
}

export async function deleteHabit(habitId) {
  store.habits = store.habits.filter(h => h.id !== habitId);
  notify();
  await setState('habits', store.habits).catch(() => {});
}

export function getHabitStreak(habit) {
  if (!habit || !habit.records) return 0;
  let streak = 0;
  const d = new Date();
  while (true) {
    const ds = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    if (habit.records[ds]) {
      streak++;
      d.setDate(d.getDate() - 1);
    } else {
      break;
    }
  }
  return streak;
}

export function getHabitTotal(habit) {
  if (!habit || !habit.records) return 0;
  return Object.keys(habit.records).length;
}
