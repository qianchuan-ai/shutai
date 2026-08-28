// ═══════════════════════════════════════════════════════════
// 枢台 — AI 协作工作台
// 导航渲染 / 页面调度 / 初始化
// ═══════════════════════════════════════════════════════════

import { getConfig } from './api.js';
import { initStore, subscribe, addIdea, deleteIdea, getIdeas, markIdeaAbsorbed } from './store.js';
import { ICONS } from './icons.js';
import { initCommandPalette } from './command-palette.js';
import { openPromptModal } from './prompt-builder.js';

// ── 页面模块注册（6 个核心模块，聚焦 AI 副驾驶）──────────
import { renderHub } from './pages/hub.js';
import { renderIntake } from './pages/intake.js';
import { renderMethodology } from './pages/methodology.js';
import { renderSkills } from './pages/skills.js';
import { renderCapture } from './pages/capture.js';
import { renderSettings } from './pages/settings.js';

const PAGES = {
  hub: { title: '工作台', icon: 'home', num: 'HOME', render: renderHub },
  inbox: { title: '资讯吸收', icon: 'inbox', num: 'INBOX', render: renderIntake },
  playbooks: { title: '工作流', icon: 'layers', num: 'FLOW', render: renderMethodology },
  skills: { title: 'Skill 库', icon: 'puzzle', num: 'SKILL', render: renderSkills },
  settings: { title: '设置', icon: 'settings', num: 'SET', render: renderSettings },
};

let currentPage = 'hub';

// ── 导航渲染 ───────────────────────────────────────────────
function renderNav() {
  const nav = document.getElementById('nav');
  nav.innerHTML = Object.entries(PAGES).map(([key, p]) => `
    <a data-page="${key}" class="${key === currentPage ? 'on' : ''}">
      <span class="ico">${ICONS[p.icon] || p.icon}</span>${p.title}<span class="num">${p.num}</span>
    </a>
  `).join('');

  nav.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => switchPage(a.dataset.page));
  });
}

// ── 页面切换 ───────────────────────────────────────────────
export function switchPage(pageKey) {
  if (!PAGES[pageKey]) return;
  currentPage = pageKey;

  // 更新导航高亮
  document.querySelectorAll('#nav a').forEach(a => {
    a.classList.toggle('on', a.dataset.page === pageKey);
  });

  // 渲染页面
  const main = document.getElementById('main');
  main.innerHTML = '';
  const container = document.createElement('div');
  container.className = 'page active';
  container.id = `page-${pageKey}`;
  main.appendChild(container);

  PAGES[pageKey].render(container);

  // 更新 URL hash
  history.replaceState(null, '', `#${pageKey}`);
}

// 暴露给子页面使用
window.__switchPage = switchPage;
window.__toast = toast;

// ── Toast 提示 ─────────────────────────────────────────────
export function toast(msg, type = '') {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.className = `toast show ${type}`;
  setTimeout(() => { el.className = 'toast'; }, 2000);
}

// ── FAB 灵感速记 ───────────────────────────────────────────
function initFAB() {
  const fab = document.getElementById('fab');
  const panel = document.getElementById('fab-panel');
  const close = document.getElementById('fp-close');
  const input = document.getElementById('fp-input');
  const save = document.getElementById('fp-save');
  const list = document.getElementById('fp-list');
  const stat = document.getElementById('fp-stat');

  fab.addEventListener('click', () => {
    panel.classList.toggle('open');
    if (panel.classList.contains('open')) {
      input.focus();
      renderIdeaList();
    }
  });
  close.addEventListener('click', () => panel.classList.remove('open'));

  async function saveIdea() {
    const text = input.value.trim();
    if (!text) return;
    await addIdea(text);
    input.value = '';
    renderIdeaList();
    toast('灵感已保存', 'ok');
  }
  save.addEventListener('click', saveIdea);
  input.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); saveIdea(); }
  });

  function renderIdeaList() {
    const ideas = getIdeas();
    stat.textContent = `${ideas.length} 条`;
    if (ideas.length === 0) {
      list.innerHTML = '<div class="empty" style="padding:16px">还没有灵感，随手记一条吧</div>';
      return;
    }
    list.innerHTML = ideas.map(i => `
      <div class="idea-row" data-id="${i.id}">
        <div class="it">${escapeHtml(i.text)}<div class="id">${formatTime(i.createdAt)}</div></div>
        <button class="mini absorb" data-act="absorb" title="交给AI吸收">吸收</button>
        <button class="mini del" data-act="del" title="删除">删</button>
      </div>
    `).join('');

    list.querySelectorAll('.idea-row').forEach(row => {
      const id = Number(row.dataset.id);
      row.querySelector('[data-act="del"]').addEventListener('click', async () => {
        await deleteIdea(id);
        renderIdeaList();
      });
      row.querySelector('[data-act="absorb"]').addEventListener('click', async () => {
        await markIdeaAbsorbed(id);
        renderIdeaList();
        toast('已送入吸收队列', 'ok');
      });
    });
  }

  // 状态变化时刷新列表（如果面板打开）
  subscribe(() => { if (panel.classList.contains('open')) renderIdeaList(); });
}

// ── 主题切换 ───────────────────────────────────────────────
const THEMES = ['pink', 'blue', 'dark'];

function applyTheme(theme) {
  if (!THEMES.includes(theme)) theme = 'pink';
  if (theme === 'pink') {
    document.documentElement.removeAttribute('data-theme');
  } else {
    document.documentElement.setAttribute('data-theme', theme);
  }
  document.querySelectorAll('.theme-dot').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.theme === theme);
  });
  // 更新 meta theme-color
  const colors = { pink: '#f2f2ec', blue: '#eef0f4', dark: '#0a0a14' };
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', colors[theme] || colors.pink);
}

function initTheme() {
  const saved = localStorage.getItem('shutai-theme') || 'pink';
  applyTheme(saved);
  document.querySelectorAll('.theme-dot').forEach(btn => {
    btn.addEventListener('click', () => {
      const theme = btn.dataset.theme;
      applyTheme(theme);
      localStorage.setItem('shutai-theme', theme);
    });
  });
}

// ── 工具函数 ───────────────────────────────────────────────
export function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// 快捷键帮助弹窗
function showShortcutsHelp() {
  const existing = document.getElementById('shortcuts-help-modal');
  if (existing) { existing.remove(); return; }

  const modal = document.createElement('div');
  modal.id = 'shortcuts-help-modal';
  modal.className = 'prompt-modal-overlay';
  modal.innerHTML = `
    <div class="prompt-modal" style="max-width:480px">
      <div class="pm-hd">
        <h3>⌨️ 键盘快捷键</h3>
        <button class="pm-close" id="sh-close">×</button>
      </div>
      <div class="pm-body">
        <div class="shortcuts-grid" style="padding:0">
          <div class="sc-row"><kbd>Cmd</kbd>+<kbd>Shift</kbd>+<kbd>P</kbd><span>打开提示工坊</span></div>
          <div class="sc-row"><kbd>1</kbd>-<kbd>6</kbd><span>提示工坊中快速选择操作</span></div>
          <div class="sc-row"><kbd>?</kbd><span>显示/隐藏快捷键帮助</span></div>
          <div class="sc-row"><kbd>Esc</kbd><span>关闭弹窗</span></div>
        </div>
        <div class="about-desc" style="margin-top:16px;font-size:12px;text-align:center">
          Windows 用户将 Cmd 替换为 Ctrl
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(modal);

  const close = () => modal.remove();
  modal.querySelector('#sh-close').addEventListener('click', close);
  modal.addEventListener('click', e => { if (e.target === modal) close(); });
  const escHandler = (e) => { if (e.key === 'Escape') { close(); document.removeEventListener('keydown', escHandler); } };
  document.addEventListener('keydown', escHandler);
}

// 全局搜索
async function showGlobalSearch() {
  const existing = document.getElementById('global-search-modal');
  if (existing) { existing.remove(); return; }

  const modal = document.createElement('div');
  modal.id = 'global-search-modal';
  modal.className = 'prompt-modal-overlay';
  modal.innerHTML = `
    <div class="prompt-modal gs-modal" style="max-width:560px">
      <div class="gs-hd">
        <span class="gs-icon">🔍</span>
        <input type="text" class="gs-input" id="gs-input" placeholder="搜索 Skill、工作流…（按 Esc 关闭）" autofocus>
      </div>
      <div class="gs-results" id="gs-results">
        <div class="gs-empty">输入关键词搜索，或从下方常用模板选择</div>
        <div class="gs-section-title">常用 Skill</div>
        <div class="gs-list" id="gs-skills"></div>
        <div class="gs-section-title">常用工作流</div>
        <div class="gs-list" id="gs-workflows"></div>
      </div>
    </div>
  `;
  document.body.appendChild(modal);

  const input = modal.querySelector('#gs-input');
  const results = modal.querySelector('#gs-results');

  // 加载数据
  let skills = [], workflows = [];
  try {
    const { getData } = await import('./api.js');
    skills = await getData('skills');
    workflows = await getData('methodology');
  } catch {}

  // 渲染常用
  function renderDefault() {
    const skillsEl = modal.querySelector('#gs-skills');
    const wfEl = modal.querySelector('#gs-workflows');
    skillsEl.innerHTML = skills.slice(0, 4).map(s => `
      <div class="gs-item" data-type="skill" data-name="${escapeHtml(s.name)}">
        <span class="gs-item-icon">🧩</span>
        <span class="gs-item-name">${escapeHtml(s.name)}</span>
        <span class="gs-item-type">单步</span>
      </div>
    `).join('') || '<div class="gs-none">暂无</div>';
    wfEl.innerHTML = workflows.slice(0, 3).map(w => `
      <div class="gs-item" data-type="workflow" data-name="${escapeHtml(w.title)}">
        <span class="gs-item-icon">📚</span>
        <span class="gs-item-name">${escapeHtml(w.title)}</span>
        <span class="gs-item-type">多步</span>
      </div>
    `).join('') || '<div class="gs-none">暂无</div>';
    bindItems();
  }

  function renderSearch(q) {
    const ql = q.toLowerCase();
    const matchedSkills = skills.filter(s =>
      (s.name || '').toLowerCase().includes(ql) ||
      (s.desc || '').toLowerCase().includes(ql)
    );
    const matchedWf = workflows.filter(w =>
      (w.title || '').toLowerCase().includes(ql) ||
      (w.desc || '').toLowerCase().includes(ql)
    );

    if (matchedSkills.length === 0 && matchedWf.length === 0) {
      results.innerHTML = '<div class="gs-empty">没有匹配的结果</div>';
      return;
    }

    let html = '';
    if (matchedSkills.length > 0) {
      html += '<div class="gs-section-title">Skill</div><div class="gs-list">';
      html += matchedSkills.map(s => `
        <div class="gs-item" data-type="skill" data-name="${escapeHtml(s.name)}">
          <span class="gs-item-icon">🧩</span>
          <span class="gs-item-name">${escapeHtml(s.name)}</span>
          <span class="gs-item-desc">${escapeHtml((s.desc || '').slice(0, 40))}</span>
          <span class="gs-item-type">单步</span>
        </div>
      `).join('');
      html += '</div>';
    }
    if (matchedWf.length > 0) {
      html += '<div class="gs-section-title">工作流</div><div class="gs-list">';
      html += matchedWf.map(w => `
        <div class="gs-item" data-type="workflow" data-name="${escapeHtml(w.title)}">
          <span class="gs-item-icon">📚</span>
          <span class="gs-item-name">${escapeHtml(w.title)}</span>
          <span class="gs-item-desc">${escapeHtml((w.desc || '').slice(0, 40))}</span>
          <span class="gs-item-type">多步</span>
        </div>
      `).join('');
      html += '</div>';
    }
    results.innerHTML = html;
    bindItems();
  }

  function bindItems() {
    results.querySelectorAll('.gs-item').forEach(item => {
      item.addEventListener('click', async () => {
        const type = item.dataset.type;
        const name = item.dataset.name;
        if (type === 'skill') {
          const skill = skills.find(s => s.name === name);
          if (skill && window.__openSkillModal) {
            window.__openSkillModal(skill);
          }
        } else if (type === 'workflow') {
          const wf = workflows.find(w => w.title === name);
          if (wf && window.__openWorkflowModal) {
            window.__openWorkflowModal(wf);
          }
        }
        close();
      });
    });
  }

  input.addEventListener('input', () => {
    const q = input.value.trim();
    if (q) {
      renderSearch(q);
    } else {
      results.innerHTML = `
        <div class="gs-empty">输入关键词搜索，或从下方常用模板选择</div>
        <div class="gs-section-title">常用 Skill</div>
        <div class="gs-list" id="gs-skills"></div>
        <div class="gs-section-title">常用工作流</div>
        <div class="gs-list" id="gs-workflows"></div>
      `;
      renderDefault();
    }
  });

  renderDefault();

  const close = () => modal.remove();
  modal.addEventListener('click', e => { if (e.target === modal) close(); });
  const escHandler = (e) => { if (e.key === 'Escape') { close(); document.removeEventListener('keydown', escHandler); } };
  document.addEventListener('keydown', escHandler);

  setTimeout(() => input.focus(), 50);
}

function formatTime(iso) {
  try {
    const d = new Date(iso);
    return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  } catch { return ''; }
}

// ── 初始化 ─────────────────────────────────────────────────
async function init() {
  // 加载配置
  try {
    const config = await getConfig();
    if (config.title) document.getElementById('brand-name').textContent = config.title;
    if (config.brand) document.getElementById('brand-sign').textContent = config.brand;
    document.title = config.title || '枢台 · 工作台';
  } catch (e) {
    console.warn('[枢台] 配置加载失败，使用默认值');
  }

  // 初始化状态
  await initStore();

  // 初始化主题
  initTheme();

  // 初始化 Command Palette + 键盘快捷键
  initCommandPalette();

  // 全局快捷键：Cmd/Ctrl + Shift + P 打开提示工坊
  document.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === 'p') {
      e.preventDefault();
      openPromptModal('');
    }
    // ? 键打开快捷键帮助
    if (e.key === '?' && !e.ctrlKey && !e.metaKey && !e.altKey) {
      const tag = document.activeElement.tagName;
      if (tag !== 'INPUT' && tag !== 'TEXTAREA') {
        e.preventDefault();
        showShortcutsHelp();
      }
    }
    // / 键打开全局搜索
    if (e.key === '/' && !e.ctrlKey && !e.metaKey && !e.altKey) {
      const tag = document.activeElement.tagName;
      if (tag !== 'INPUT' && tag !== 'TEXTAREA') {
        e.preventDefault();
        showGlobalSearch();
      }
    }
  });

  // 渲染导航
  renderNav();

  // 初始化 FAB
  initFAB();

  // 从 URL hash 恢复页面
  const hash = location.hash.replace('#', '');
  if (hash && PAGES[hash]) {
    switchPage(hash);
  } else {
    switchPage('hub');
  }

  console.log('[枢台] 初始化完成 ✓');

  // Onboarding 引导（新用户第一次打开）
  if (!localStorage.getItem('shutai_onboarding_done')) {
    setTimeout(() => showOnboarding(), 500);
  }
}

// Onboarding 引导
function showOnboarding() {
  const steps = [
    {
      icon: '👋',
      title: '欢迎使用枢台',
      desc: '枢台是 AI 提示词工作台，帮你把跟 AI 的协作变成可复用的流程。',
    },
    {
      icon: '✨',
      title: '提示工坊：一键生成提示词',
      desc: '输入内容，选一个操作（总结/分析/扩展/润色/翻译/头脑风暴），自动生成高质量提示词并复制。按 Cmd+Shift+P 随时打开。',
    },
    {
      icon: '🧩',
      title: '沉淀模板：下次直接用',
      desc: '好用的提示词存为 Skill（单步模板），复杂任务存为工作流（多步模板）。首页「最近使用」快速访问，按 / 键全局搜索。',
    },
  ];

  let currentStep = 0;
  const modal = document.createElement('div');
  modal.id = 'onboarding-modal';
  modal.className = 'prompt-modal-overlay';

  function render() {
    const step = steps[currentStep];
    modal.innerHTML = `
      <div class="prompt-modal onboarding-modal" style="max-width:440px">
        <div class="pm-hd" style="justify-content:center">
          <h3 style="text-align:center">${step.icon} ${step.title}</h3>
        </div>
        <div class="pm-body" style="text-align:center;padding:20px 24px">
          <p style="font-size:14px;color:var(--dim);line-height:1.7;margin:0">${step.desc}</p>
          <div class="onboarding-dots">
            ${steps.map((_, i) => `<span class="ob-dot ${i === currentStep ? 'active' : ''}"></span>`).join('')}
          </div>
        </div>
        <div class="pm-footer" style="justify-content:space-between">
          <button class="btn" id="ob-skip">跳过</button>
          <div style="display:flex;gap:8px">
            ${currentStep > 0 ? '<button class="btn" id="ob-prev">上一步</button>' : ''}
            <button class="btn brand" id="ob-next">${currentStep === steps.length - 1 ? '开始使用' : '下一步'}</button>
          </div>
        </div>
      </div>
    `;

    modal.querySelector('#ob-skip').addEventListener('click', finish);
    const prevBtn = modal.querySelector('#ob-prev');
    if (prevBtn) prevBtn.addEventListener('click', () => { currentStep--; render(); });
    modal.querySelector('#ob-next').addEventListener('click', () => {
      if (currentStep === steps.length - 1) {
        finish();
      } else {
        currentStep++;
        render();
      }
    });
  }

  function finish() {
    localStorage.setItem('shutai_onboarding_done', '1');
    modal.remove();
  }

  document.body.appendChild(modal);
  render();
}

// 暴露给设置页面调用
window.__showOnboarding = showOnboarding;

init();
