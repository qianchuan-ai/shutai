// ═══════════════════════════════════════════════════════════
// 枢台 · Command Palette（Cmd+K）+ 键盘快捷键系统
// 集合百家之长：现代工作台标配的命令面板 + 全局快捷键
// ═══════════════════════════════════════════════════════════

import { switchPage, toast } from './main.js';
import { getTodos, getIdeas, getIntake, addTodo, addIdea, getPendingIntakeCount, getHabits, getHabitTotal } from './store.js';
import { ICONS } from './icons.js';
import { t, getLang } from './i18n.js';

// ── 页面导航项 ──────────────────────────────────────────────
const NAV_ITEMS = [
  { key: 'hub', title: '工作台', icon: 'home', shortcut: 'g h' },
  { key: 'inbox', title: '资讯吸收', icon: 'inbox', shortcut: 'g i' },
  { key: 'playbooks', title: '工作流', icon: 'layers', shortcut: 'g f' },
  { key: 'skills', title: 'Skill 库', icon: 'puzzle', shortcut: 'g s' },
  { key: 'capture', title: '灵感捕捉', icon: 'zap', shortcut: 'g c' },
  { key: 'settings', title: '设置', icon: 'settings', shortcut: 'g ,' },
];

// ── 快捷操作 ────────────────────────────────────────────────
const ACTIONS = [
  { id: 'new-todo', title: '新建待办', icon: 'plus', hint: '添加一条今日待办', action: () => focusTodoInput() },
  { id: 'new-idea', title: '新建灵感', icon: 'lightbulb', hint: '打开灵感速记面板', action: () => openFABPanel() },
  { id: 'theme-pink', title: '切换主题：粉色', icon: 'heart', hint: '豆沙粉浅色主题', action: () => applyThemeByName('pink') },
  { id: 'theme-blue', title: '切换主题：蓝色', icon: 'globe', hint: '灰蓝浅色主题', action: () => applyThemeByName('blue') },
  { id: 'theme-dark', title: '切换主题：深色', icon: 'moon', hint: '深色沉浸主题', action: () => applyThemeByName('dark') },
  { id: 'export', title: '导出数据（JSON）', icon: 'download', hint: '导出所有数据为 JSON', action: () => exportData() },
  { id: 'export-md', title: '导出数据（Markdown）', icon: 'file', hint: '导出为 Obsidian 兼容的 Markdown', action: () => exportMarkdown() },
  { id: 'help', title: '快捷键帮助', icon: 'info', hint: '查看所有键盘快捷键', action: () => showShortcutsHelp() },
];

// ── 状态 ────────────────────────────────────────────────────
let paletteEl = null;
let inputEl = null;
let resultsEl = null;
let isOpen = false;
let selectedIndex = 0;
let currentResults = [];
let gPrefixActive = false;
let gPrefixTimer = null;

// ── 初始化 ──────────────────────────────────────────────────
export function initCommandPalette() {
  buildPalette();
  bindGlobalShortcuts();
  console.log('[枢台] Command Palette 已就绪（Cmd/Ctrl+K）');
}

// ── 构建面板 DOM ────────────────────────────────────────────
function buildPalette() {
  const lang = getLang();
  paletteEl = document.createElement('div');
  paletteEl.className = 'cmd-palette';
  paletteEl.id = 'cmd-palette';
  paletteEl.innerHTML = `
    <div class="cmd-overlay"></div>
    <div class="cmd-modal">
      <div class="cmd-input-wrap">
        <span class="cmd-icon">${ICONS.search}</span>
        <input type="text" id="cmd-input" placeholder="${lang === 'zh' ? '输入命令、页面或搜索内容…' : 'Type command, page or search…'}" autocomplete="off" spellcheck="false">
        <span class="cmd-kbd">ESC</span>
      </div>
      <div class="cmd-results" id="cmd-results"></div>
      <div class="cmd-footer">
        <span><kbd>↑</kbd><kbd>↓</kbd> ${lang === 'zh' ? '导航' : 'Navigate'}</span>
        <span><kbd>↵</kbd> ${lang === 'zh' ? '执行' : 'Execute'}</span>
        <span><kbd>esc</kbd> ${lang === 'zh' ? '关闭' : 'Close'}</span>
        <span class="cmd-footer-hint">${lang === 'zh' ? '输入 g 后按页面键快速跳转' : 'Type g then page key to jump'}</span>
      </div>
    </div>
  `;
  document.body.appendChild(paletteEl);

  inputEl = paletteEl.querySelector('#cmd-input');
  resultsEl = paletteEl.querySelector('#cmd-results');

  // 遮罩点击关闭
  paletteEl.querySelector('.cmd-overlay').addEventListener('click', closePalette);

  // 输入搜索
  inputEl.addEventListener('input', () => {
    selectedIndex = 0;
    renderResults(inputEl.value);
  });

  // 键盘导航
  inputEl.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      selectedIndex = Math.min(selectedIndex + 1, currentResults.length - 1);
      updateSelection();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      selectedIndex = Math.max(selectedIndex - 1, 0);
      updateSelection();
    } else if (e.key === 'Enter') {
      e.preventDefault();
      executeSelected();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      closePalette();
    }
  });
}

// ── 打开/关闭 ───────────────────────────────────────────────
export function openPalette() {
  if (!paletteEl) return;
  isOpen = true;
  paletteEl.classList.add('open');
  inputEl.value = '';
  selectedIndex = 0;
  renderResults('');
  setTimeout(() => inputEl.focus(), 50);
}

export function closePalette() {
  if (!paletteEl) return;
  isOpen = false;
  paletteEl.classList.remove('open');
  inputEl.blur();
}

function togglePalette() {
  if (isOpen) closePalette();
  else openPalette();
}

// ── 搜索与结果渲染 ──────────────────────────────────────────
function renderResults(query) {
  const q = query.trim().toLowerCase();
  const groups = [];

  // 1. 页面导航
  const navResults = q
    ? NAV_ITEMS.filter(n => n.title.toLowerCase().includes(q) || n.key.includes(q))
    : NAV_ITEMS;
  if (navResults.length) {
    groups.push({
      label: '页面导航',
      items: navResults.map(n => ({
        type: 'nav',
        icon: n.icon,
        title: n.title,
        hint: n.shortcut,
        action: () => { switchPage(n.key); closePalette(); }
      }))
    });
  }

  // 2. 快捷操作
  const actionResults = q
    ? ACTIONS.filter(a => a.title.toLowerCase().includes(q) || a.hint.toLowerCase().includes(q))
    : ACTIONS;
  if (actionResults.length) {
    groups.push({
      label: '快捷操作',
      items: actionResults.map(a => ({
        type: 'action',
        icon: a.icon,
        title: a.title,
        hint: a.hint,
        action: a.action
      }))
    });
  }

  // 3. 待办（有搜索词时才显示）
  if (q) {
    const todos = getTodos().filter(t => t.text.toLowerCase().includes(q)).slice(0, 5);
    if (todos.length) {
      groups.push({
        label: '待办',
        items: todos.map(t => ({
          type: 'todo',
          icon: t.done ? 'check-circle' : 'list',
          title: t.text,
          hint: t.done ? '已完成' : '待完成',
          action: () => { toast('已在待办列表中', 'ok'); closePalette(); }
        }))
      });
    }

    // 4. 灵感
    const ideas = getIdeas().filter(i => i.text.toLowerCase().includes(q)).slice(0, 5);
    if (ideas.length) {
      groups.push({
        label: '灵感',
        items: ideas.map(i => ({
          type: 'idea',
          icon: 'lightbulb',
          title: i.text.length > 40 ? i.text.slice(0, 40) + '…' : i.text,
          hint: i.absorbed ? '已吸收' : '待吸收',
          action: () => { openFABPanel(); closePalette(); }
        }))
      });
    }

    // 5. 待吸收链接
    const intake = getIntake().filter(i => i.url.toLowerCase().includes(q) || i.domain.includes(q)).slice(0, 5);
    if (intake.length) {
      groups.push({
        label: '资讯链接',
        items: intake.map(i => ({
          type: 'intake',
          icon: 'link',
          title: i.url.length > 50 ? i.url.slice(0, 50) + '…' : i.url,
          hint: i.domain + (i.status === 'pending' ? ' · 待吸收' : ' · 已吸收'),
          action: () => { switchPage('intake'); closePalette(); }
        }))
      });
    }

    // 6. 习惯
    const habits = getHabits().filter(h => h.name.toLowerCase().includes(q)).slice(0, 5);
    if (habits.length) {
      groups.push({
        label: '习惯',
        items: habits.map(h => ({
          type: 'habit',
          icon: h.icon || 'target',
          title: h.name,
          hint: `累计 ${getHabitTotal(h)} 次`,
          action: () => { switchPage('habits'); closePalette(); }
        }))
      });
    }
  }

  // 扁平化结果
  currentResults = [];
  let html = '';
  groups.forEach(group => {
    html += `<div class="cmd-group-label">${group.label}</div>`;
    group.items.forEach(item => {
      const idx = currentResults.length;
      currentResults.push(item);
      html += `
        <div class="cmd-item" data-idx="${idx}">
          <span class="cmd-item-icon">${ICONS[item.icon] || ''}</span>
          <span class="cmd-item-title">${item.title}</span>
          <span class="cmd-item-hint">${item.hint || ''}</span>
        </div>
      `;
    });
  });

  if (!currentResults.length) {
    html = `<div class="cmd-empty">没有找到匹配的结果<br><span style="font-size:11px;color:var(--dim-2)">试试输入页面名、操作名或关键词</span></div>`;
  }

  resultsEl.innerHTML = html;

  // 绑定点击
  resultsEl.querySelectorAll('.cmd-item').forEach(el => {
    el.addEventListener('click', () => {
      selectedIndex = Number(el.dataset.idx);
      executeSelected();
    });
    el.addEventListener('mouseenter', () => {
      selectedIndex = Number(el.dataset.idx);
      updateSelection();
    });
  });

  updateSelection();
}

function updateSelection() {
  resultsEl.querySelectorAll('.cmd-item').forEach((el, i) => {
    el.classList.toggle('selected', i === selectedIndex);
  });
  // 滚动到可见
  const selected = resultsEl.querySelector('.cmd-item.selected');
  if (selected) {
    selected.scrollIntoView({ block: 'nearest' });
  }
}

function executeSelected() {
  const item = currentResults[selectedIndex];
  if (item && item.action) {
    item.action();
  }
}

// ── 全局键盘快捷键 ──────────────────────────────────────────
function bindGlobalShortcuts() {
  document.addEventListener('keydown', (e) => {
    // Cmd/Ctrl+K → 打开命令面板
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      togglePalette();
      return;
    }

    // 面板打开时不处理其他快捷键
    if (isOpen) return;

    // 输入框中不处理单键快捷键
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

    // g 前缀跳转
    if (e.key === 'g' && !gPrefixActive) {
      gPrefixActive = true;
      clearTimeout(gPrefixTimer);
      gPrefixTimer = setTimeout(() => { gPrefixActive = false; }, 1200);
      return;
    }
    if (gPrefixActive) {
      const navMap = { h: 'hub', i: 'inbox', f: 'playbooks', s: 'skills', c: 'capture', ',': 'settings' };
      const target = navMap[e.key.toLowerCase()];
      if (target) {
        e.preventDefault();
        switchPage(target);
        toast(`已跳转：${NAV_ITEMS.find(n => n.key === target)?.title || target}`, 'ok');
      }
      gPrefixActive = false;
      clearTimeout(gPrefixTimer);
      return;
    }

    // 单键快捷键
    switch (e.key.toLowerCase()) {
      case 'n':
        e.preventDefault();
        openFABPanel();
        toast('灵感速记已打开', 'ok');
        break;
      case 't':
        e.preventDefault();
        cycleTheme();
        break;
      case '?':
        e.preventDefault();
        showShortcutsHelp();
        break;
      case '/':
        e.preventDefault();
        openPalette();
        break;
    }
  });
}

// ── 辅助函数 ────────────────────────────────────────────────
function openFABPanel() {
  const fab = document.getElementById('fab');
  const panel = document.getElementById('fab-panel');
  if (fab && panel) {
    panel.classList.add('open');
    const input = document.getElementById('fp-input');
    if (input) setTimeout(() => input.focus(), 50);
  }
}

function focusTodoInput() {
  switchPage('hub');
  setTimeout(() => {
    const input = document.getElementById('todo-input');
    if (input) input.focus();
  }, 100);
}

function applyThemeByName(name) {
  if (name === 'pink') {
    document.documentElement.removeAttribute('data-theme');
  } else {
    document.documentElement.setAttribute('data-theme', name);
  }
  localStorage.setItem('shutai-theme', name);
  document.querySelectorAll('.theme-dot').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.theme === name);
  });
  const colors = { pink: '#f2f2ec', blue: '#eef0f4', dark: '#0a0a14' };
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', colors[name] || colors.pink);
  toast(`主题：${name === 'pink' ? '粉色' : name === 'blue' ? '蓝色' : '深色'}`, 'ok');
}

function cycleTheme() {
  const current = document.documentElement.getAttribute('data-theme') || 'pink';
  const order = ['pink', 'blue', 'dark'];
  const next = order[(order.indexOf(current) + 1) % order.length];
  applyThemeByName(next);
}

function exportData() {
  try {
    const data = {
      exportTime: new Date().toISOString(),
      todos: getTodos(),
      intake: getIntake(),
      ideas: getIdeas(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `shutai-export-${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast('数据已导出', 'ok');
  } catch (e) {
    toast('导出失败', 'err');
  }
  closePalette();
}

function exportMarkdown() {
  try {
    const todos = getTodos();
    const ideas = getIdeas();
    const intake = getIntake();
    const habits = getHabits();
    const today = new Date().toISOString().slice(0, 10);

    let md = `# 枢台 · 数据导出\n\n> 导出时间：${new Date().toLocaleString('zh-CN')}\n\n---\n\n`;

    // 待办
    md += `## ✅ 待办清单\n\n`;
    const undone = todos.filter(t => !t.done);
    const done = todos.filter(t => t.done);
    if (undone.length) {
      md += `### 未完成（${undone.length}）\n\n`;
      undone.forEach(t => { md += `- [ ] ${t.text}\n`; });
      md += '\n';
    }
    if (done.length) {
      md += `### 已完成（${done.length}）\n\n`;
      done.forEach(t => { md += `- [x] ${t.text}\n`; });
      md += '\n';
    }

    // 灵感
    md += `---\n\n## 💡 灵感速记\n\n`;
    if (ideas.length === 0) {
      md += `*暂无灵感*\n\n`;
    } else {
      ideas.forEach((i, idx) => {
        const date = i.createdAt ? i.createdAt.slice(0, 10) : today;
        md += `### ${idx + 1}. ${date}\n\n${i.text}\n\n`;
        if (i.absorbed) md += `> 状态：已吸收\n\n`;
      });
    }

    // 资讯链接
    md += `---\n\n## 📥 资讯吸收\n\n`;
    const pending = intake.filter(i => i.status === 'pending');
    const imported = intake.filter(i => i.status === 'imported');
    if (pending.length) {
      md += `### 待吸收（${pending.length}）\n\n`;
      pending.forEach(i => { md += `- [ ] [${i.domain}](${i.url})\n`; });
      md += '\n';
    }
    if (imported.length) {
      md += `### 已吸收（${imported.length}）\n\n`;
      imported.forEach(i => { md += `- [x] [${i.domain}](${i.url})\n`; });
      md += '\n';
    }

    // 习惯
    md += `---\n\n## 🎯 习惯追踪\n\n`;
    if (habits.length === 0) {
      md += `*暂无习惯*\n\n`;
    } else {
      habits.forEach(h => {
        const total = getHabitTotal(h);
        md += `### ${h.name}\n\n- 累计打卡：${total} 次\n- 记录天数：${Object.keys(h.records || {}).length} 天\n\n`;
        if (h.records && Object.keys(h.records).length) {
          md += `打卡记录：\n\n`;
          Object.keys(h.records).sort().forEach(d => { md += `- ${d}\n`; });
          md += '\n';
        }
      });
    }

    md += `---\n\n*由枢台工作台导出 · https://github.com/yourname/shutai*\n`;

    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `shutai-export-${today}.md`;
    a.click();
    URL.revokeObjectURL(url);
    toast('Markdown 已导出', 'ok');
  } catch (e) {
    console.error(e);
    toast('导出失败', 'err');
  }
  closePalette();
}

function showShortcutsHelp() {
  const help = `
╔══════════════════════════════════╗
║       枢台 · 快捷键帮助           ║
╠══════════════════════════════════╣
║ Cmd/Ctrl+K  打开命令面板          ║
║ /            打开命令面板          ║
║ g + h/i/a/m/k/t/b/s  跳转页面     ║
║ n            新建灵感              ║
║ t            切换主题（循环）       ║
║ ?            显示此帮助            ║
║ Esc          关闭弹窗/面板         ║
╚══════════════════════════════════╝`;
  alert(help);
  closePalette();
}
