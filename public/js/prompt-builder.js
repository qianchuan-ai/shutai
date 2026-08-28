// ═══════════════════════════════════════════════════════════
// 枢台 · 提示工坊（Prompt Studio）
// 统一弹窗：内容输入 + 6 个操作 + 结果预览，同屏完成
// 支持数字键快捷选择、复制反馈、切换操作
// ═══════════════════════════════════════════════════════════

import { setData, getData } from './api.js';
import { addIntakeOutput } from './store.js';

// 历史记录
const HISTORY_KEY = 'shutai_prompt_history';
function addHistory(actionName, content, prompt) {
  try {
    const history = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
    history.unshift({ actionName, content: content.slice(0, 100), prompt, ts: Date.now() });
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(0, 20)));
  } catch {}
}
function getHistory() {
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
  } catch { return []; }
}

// ── 6 个预设操作 ────────────────────────────────────────────
export const QUICK_ACTIONS = [
  {
    id: 'summarize', name: '总结要点', key: '1', icon: 'file', color: '#5a8fb0',
    build: (c) => `你是一位资深内容编辑，擅长提炼核心观点。

请对以下内容进行总结，提炼出最核心的要点：

---
${c}
---

输出要求：
- 格式：分点列出，3-5 个要点
- 语言：中文，简洁有力
- 每个要点不超过 30 字

请直接输出要点，不要多余解释。`
  },
  {
    id: 'analyze', name: '深度分析', key: '2', icon: 'target', color: '#c4507a',
    build: (c) => `你是一位战略顾问，擅长多角度深度分析。

请对以下内容进行深度分析，从优点、缺点、风险、机会四个维度展开：

---
${c}
---

输出要求：
- 格式：Markdown 表格，四列（维度/分析/具体表现/建议）
- 语言：中文，专业客观
- 每个维度至少 2 条具体分析

请直接输出分析结果，不要多余解释。`
  },
  {
    id: 'expand', name: '扩展创作', key: '3', icon: 'sparkles', color: '#6a9a6a',
    build: (c) => `你是一位资深内容创作者，擅长深化扩展和细节补充。

请基于以下内容进行扩展创作，补充细节、案例和论据，让内容更丰满：

---
${c}
---

输出要求：
- 格式：段落式文章，有清晰的逻辑结构
- 语言：中文，流畅自然
- 补充至少 2 个具体案例或数据支撑
- 字数：原文的 2-3 倍

请直接输出扩展后的内容，不要多余解释。`
  },
  {
    id: 'polish', name: '润色优化', key: '4', icon: 'edit', color: '#8a6aa0',
    build: (c) => `你是一位文字编辑，擅长润色和表达优化。

请对以下文字进行润色优化，提升流畅度、专业度和可读性：

---
${c}
---

输出要求：
- 格式：段落式，保持原文结构
- 语言：中文，简洁专业
- 保留原文核心意思，只优化表达
- 不要改变原文的观点和立场

请直接输出润色后的内容，不要多余解释。`
  },
  {
    id: 'translate', name: '翻译英文', key: '5', icon: 'globe', color: '#b59a4a',
    build: (c) => `你是一位专业中英翻译，擅长地道的英文表达。

请将以下内容翻译成英文，保持原意和语气风格：

---
${c}
---

输出要求：
- 格式：保持原文结构
- 语言：地道英文，符合英语母语者表达习惯
- 专业术语准确
- 不要逐字翻译，要意译

请直接输出翻译结果，不要多余解释。`
  },
  {
    id: 'brainstorm', name: '头脑风暴', key: '6', icon: 'lightbulb', color: '#c45050',
    build: (c) => `你是一位创意总监，擅长头脑风暴和发散思维。

请基于以下内容进行头脑风暴，给出 5 个不同的创意方向：

---
${c}
---

输出要求：
- 格式：分点列出，每个方向包含标题+简短说明
- 语言：中文，有启发性
- 5 个方向要有明显差异，不要重复
- 每个方向说明不超过 50 字

请直接输出创意方向，不要多余解释。`
  },
];

// ── 高级自定义 ──────────────────────────────────────────────
const ROLES = [
  { id: 'product', name: '产品经理' }, { id: 'writer', name: '内容创作者' },
  { id: 'analyst', name: '数据分析师' }, { id: 'developer', name: '全栈开发者' },
  { id: 'designer', name: 'UI/UX 设计师' }, { id: 'marketer', name: '营销策划' },
  { id: 'consultant', name: '战略顾问' }, { id: 'editor', name: '文字编辑' },
];
const FORMATS = [
  { id: 'list', name: '要点列表' }, { id: 'paragraph', name: '段落文章' },
  { id: 'table', name: '表格' }, { id: 'markdown', name: 'Markdown' },
];

export function buildCustomPrompt(content, config = {}) {
  const { role = 'consultant', task = '分析', format = 'list' } = config;
  const r = ROLES.find(x => x.id === role) || ROLES[0];
  const f = FORMATS.find(x => x.id === format) || FORMATS[0];
  return `你是一位${r.name}。

请对以下内容进行「${task}」：

---
${content}
---

输出要求：
- 格式：${f.name}
- 语言：中文
- 风格：专业、简洁、可落地

请直接输出结果，不要多余的解释。`;
}

export function copyText(text) {
  return navigator.clipboard.writeText(text);
}

// ── 提示工坊弹窗 ─────────────────────────────────────────────
let modalEl = null;
let currentContent = '';
let activeActionId = null;

export function openPromptModal(initialContent = '', autoAction = null) {
  if (modalEl) closePromptModal();
  currentContent = initialContent;
  activeActionId = null;

  modalEl = document.createElement('div');
  modalEl.className = 'prompt-modal-overlay';
  modalEl.innerHTML = `
    <div class="prompt-modal pm-studio">
      <div class="pm-hd">
        <h3>✨ 提示工坊</h3>
        <div class="pm-hd-right">
          <button class="pm-history-btn" id="pm-history-btn" title="历史记录">🕐 历史</button>
          <span class="pm-kbd-hint">数字键 1-6 快速选择</span>
          <button class="pm-close" id="pm-close">×</button>
        </div>
      </div>
      <div class="pm-body">
        <!-- 历史记录面板 -->
        <div class="pm-history-panel" id="pm-history-panel" style="display:none">
          <div class="pm-history-hd">
            <label>历史记录（最近 20 条）</label>
            <button class="pm-history-clear" id="pm-history-clear">清空</button>
          </div>
          <div class="pm-history-list" id="pm-history-list"></div>
        </div>

        <!-- 内容输入 -->
        <div class="pm-section pm-input-section">
          <label>内容 <span class="pm-hint" id="pm-count">0 字</span></label>
          <textarea id="pm-content" class="pm-content-input" placeholder="在此输入或粘贴要处理的内容…" rows="3">${escapeHtml(initialContent)}</textarea>
        </div>

        <!-- 6 个操作按钮 -->
        <div class="pm-section">
          <label>选择操作</label>
          <div class="pm-actions-grid">
            ${QUICK_ACTIONS.map((a, i) => `
              <button class="pm-action-btn" data-action="${a.id}" style="--action-color: ${a.color}">
                <span class="pa-key">${a.key}</span>
                <span class="pa-icon">${getIconSvg(a.icon)}</span>
                <span class="pa-name">${a.name}</span>
              </button>
            `).join('')}
          </div>
        </div>

        <!-- 结果预览 -->
        <div class="pm-section pm-result-section" id="pm-result-section" style="display:none">
          <div class="pm-result-hd">
            <label>生成的提示词</label>
            <span class="pm-copied-badge" id="pm-copied-badge" style="display:none">✓ 已复制到剪贴板</span>
          </div>
          <textarea id="pm-result" class="pm-result-textarea" readonly></textarea>
          <div class="pm-result-actions">
            <button class="btn sm" id="pm-copy-again">📋 重新复制</button>
            <button class="btn sm" id="pm-save-skill">💾 存为 Skill</button>
            <button class="btn sm" id="pm-save-workflow">📚 存为工作流</button>
            <button class="btn sm" id="pm-save-output">📥 保存输出</button>
            <span class="pm-result-hint">已自动复制，去任意 AI 工具粘贴即可</span>
          </div>
        </div>

        <!-- 高级自定义 -->
        <div class="pm-advanced">
          <button class="pm-adv-toggle" id="pm-adv-toggle">高级自定义（角色/任务/格式）▾</button>
          <div class="pm-adv-body" id="pm-adv-body" style="display:none">
            <div class="pm-adv-grid">
              <div class="pm-adv-item">
                <label>角色</label>
                <select id="pm-role" class="pm-select">
                  ${ROLES.map(r => `<option value="${r.id}">${r.name}</option>`).join('')}
                </select>
              </div>
              <div class="pm-adv-item">
                <label>任务</label>
                <input id="pm-task" class="pm-input" placeholder="如：分析、总结、扩展…" value="分析">
              </div>
              <div class="pm-adv-item">
                <label>格式</label>
                <select id="pm-format" class="pm-select">
                  ${FORMATS.map(f => `<option value="${f.id}">${f.name}</option>`).join('')}
                </select>
              </div>
            </div>
            <button class="btn brand pm-adv-generate" id="pm-adv-generate">生成并复制</button>
          </div>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(modalEl);

  const contentInput = modalEl.querySelector('#pm-content');
  const countEl = modalEl.querySelector('#pm-count');

  // 字数统计
  const updateCount = () => {
    currentContent = contentInput.value;
    countEl.textContent = `${currentContent.length} 字`;
  };
  contentInput.addEventListener('input', updateCount);
  updateCount();

  // 自动聚焦输入框（如果没有预填内容）
  if (!initialContent) {
    setTimeout(() => contentInput.focus(), 100);
  }

  // 关闭
  modalEl.querySelector('#pm-close').addEventListener('click', closePromptModal);
  modalEl.addEventListener('click', (e) => {
    if (e.target === modalEl) closePromptModal();
  });

  // 6 个操作按钮
  modalEl.querySelectorAll('.pm-action-btn').forEach(btn => {
    btn.addEventListener('click', () => executeAction(btn.dataset.action));
  });

  // 历史记录
  const historyPanel = modalEl.querySelector('#pm-history-panel');
  const historyBtn = modalEl.querySelector('#pm-history-btn');
  historyBtn.addEventListener('click', () => {
    if (historyPanel.style.display === 'none') {
      renderHistory();
      historyPanel.style.display = 'block';
      historyBtn.classList.add('active');
    } else {
      historyPanel.style.display = 'none';
      historyBtn.classList.remove('active');
    }
  });

  modalEl.querySelector('#pm-history-clear').addEventListener('click', () => {
    if (confirm('确定清空历史记录？')) {
      localStorage.removeItem(HISTORY_KEY);
      renderHistory();
    }
  });

  function renderHistory() {
    const history = getHistory();
    const list = modalEl.querySelector('#pm-history-list');
    if (history.length === 0) {
      list.innerHTML = '<div class="pm-history-empty">还没有历史记录</div>';
      return;
    }
    list.innerHTML = history.map((h, i) => `
      <div class="pm-history-item" data-idx="${i}">
        <div class="pm-hi-hd">
          <span class="pm-hi-action">${escapeHtml(h.actionName)}</span>
          <span class="pm-hi-time">${new Date(h.ts).toLocaleString('zh-CN', {month:'short', day:'numeric', hour:'2-digit', minute:'2-digit'})}</span>
        </div>
        <div class="pm-hi-content">${escapeHtml(h.content)}</div>
        <div class="pm-hi-acts">
          <button class="pm-hi-btn" data-act="copy">复制</button>
          <button class="pm-hi-btn" data-act="use">使用</button>
        </div>
      </div>
    `).join('');

    list.querySelectorAll('.pm-history-item').forEach(item => {
      const idx = Number(item.dataset.idx);
      item.querySelector('[data-act="copy"]').addEventListener('click', async () => {
        try {
          await copyText(history[idx].prompt);
          if (window.__toast) window.__toast('已复制', 'ok');
        } catch {}
      });
      item.querySelector('[data-act="use"]').addEventListener('click', () => {
        modalEl.querySelector('#pm-content').value = history[idx].content;
        modalEl.querySelector('#pm-count').textContent = `${history[idx].content.length} 字`;
        historyPanel.style.display = 'none';
        historyBtn.classList.remove('active');
        if (window.__toast) window.__toast('已填充内容，选一个操作', 'ok');
      });
    });
  }

  // 重新复制
  modalEl.querySelector('#pm-copy-again').addEventListener('click', async () => {
    const result = modalEl.querySelector('#pm-result').value;
    if (result) {
      try {
        await copyText(result);
        showCopiedFeedback();
      } catch {}
    }
  });

  // 保存为 Skill
  modalEl.querySelector('#pm-save-skill').addEventListener('click', () => {
    const prompt = modalEl.querySelector('#pm-result').value;
    if (!prompt) return;
    openSaveSkillModal(prompt);
  });

  // 存为工作流
  modalEl.querySelector('#pm-save-workflow').addEventListener('click', () => {
    const prompt = modalEl.querySelector('#pm-result').value;
    if (!prompt) return;
    openSaveWorkflowModal(prompt);
  });

  // 保存输出
  modalEl.querySelector('#pm-save-output').addEventListener('click', () => {
    openSaveOutputModal();
  });

  // 高级自定义
  modalEl.querySelector('#pm-adv-toggle').addEventListener('click', () => {
    const body = modalEl.querySelector('#pm-adv-body');
    const toggle = modalEl.querySelector('#pm-adv-toggle');
    if (body.style.display === 'none') {
      body.style.display = 'block';
      toggle.textContent = '高级自定义（角色/任务/格式）▴';
    } else {
      body.style.display = 'none';
      toggle.textContent = '高级自定义（角色/任务/格式）▾';
    }
  });

  modalEl.querySelector('#pm-adv-generate').addEventListener('click', async () => {
    const config = {
      role: modalEl.querySelector('#pm-role').value,
      task: modalEl.querySelector('#pm-task').value || '分析',
      format: modalEl.querySelector('#pm-format').value,
    };
    const prompt = buildCustomPrompt(currentContent, config);
    showResult(prompt);
    try {
      await copyText(prompt);
      showCopiedFeedback();
    } catch {}
  });

  // 键盘快捷键
  const keyHandler = (e) => {
    if (e.key === 'Escape') {
      closePromptModal();
      document.removeEventListener('keydown', keyHandler);
      return;
    }
    // 数字键 1-6 快速选择操作（输入框聚焦时也生效）
    if (e.key >= '1' && e.key <= '6' && !e.ctrlKey && !e.metaKey && !e.altKey) {
      // 如果输入框聚焦且有选中文字，不拦截
      if (document.activeElement === contentInput && window.getSelection().toString()) return;
      const idx = parseInt(e.key) - 1;
      if (QUICK_ACTIONS[idx]) {
        e.preventDefault();
        executeAction(QUICK_ACTIONS[idx].id);
      }
    }
  };
  document.addEventListener('keydown', keyHandler);
  modalEl._keyHandler = keyHandler;

  // 自动执行指定操作（如果有内容）
  if (autoAction && currentContent.trim()) {
    setTimeout(() => executeAction(autoAction), 100);
  }
}

// 执行操作
function executeAction(actionId) {
  if (!currentContent.trim()) {
    if (window.__toast) window.__toast('请先输入内容', 'err');
    modalEl.querySelector('#pm-content').focus();
    return;
  }

  const action = QUICK_ACTIONS.find(a => a.id === actionId);
  if (!action) return;

  activeActionId = actionId;
  const prompt = action.build(currentContent);

  // 高亮选中的按钮
  modalEl.querySelectorAll('.pm-action-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.action === actionId);
  });

  showResult(prompt);

  // 记录历史
  addHistory(action.name, currentContent, prompt);

  // 自动复制
  copyText(prompt).then(() => {
    showCopiedFeedback();
    if (window.__toast) window.__toast(`「${action.name}」提示词已复制`, 'ok');
  }).catch(() => {
    if (window.__toast) window.__toast('提示词已生成，请手动复制', 'err');
  });
}

// 显示结果
function showResult(prompt) {
  const section = modalEl.querySelector('#pm-result-section');
  const textarea = modalEl.querySelector('#pm-result');
  section.style.display = 'block';
  textarea.value = prompt;
  // 滚动到结果区域
  setTimeout(() => {
    section.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, 50);
}

// 复制成功反馈
function showCopiedFeedback() {
  if (!modalEl) return;
  const badge = modalEl.querySelector('#pm-copied-badge');
  badge.style.display = 'inline-block';
  setTimeout(() => { badge.style.display = 'none'; }, 2500);
}

export function closePromptModal() {
  if (modalEl) {
    if (modalEl._keyHandler) {
      document.removeEventListener('keydown', modalEl._keyHandler);
    }
    modalEl.remove();
    modalEl = null;
    activeActionId = null;
  }
}

// HTML 转义
function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// 内置图标 SVG
function getIconSvg(name) {
  const icons = {
    file: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6"/></svg>',
    target: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1" fill="currentColor" stroke="none"/></svg>',
    sparkles: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5z"/><path d="M19 14l.8 2.2L22 17l-2.2.8L19 20l-.8-2.2L16 17l2.2-.8z"/></svg>',
    edit: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.12 2.12 0 013 3L12 15l-4 1 1-4z"/></svg>',
    globe: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M3 12h18"/><path d="M12 3a14 14 0 010 18 14 14 0 010-18z"/></svg>',
    lightbulb: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18h6"/><path d="M10 22h4"/><path d="M12 2a7 7 0 00-4 12c1 1 1 2 1 3h6c0-1 0-2 1-3a7 7 0 00-4-12z"/></svg>',
  };
  return icons[name] || icons.file;
}

// ── 保存为 Skill 弹窗 ──────────────────────────────────────
function openSaveSkillModal(prompt) {
  // 从提示词模板自动提取变量
  const varMatches = prompt.match(/\{\{\s*([^}\s]+)\s*\}\}/g) || [];
  const variables = [...new Set(varMatches.map(m => m.replace(/[{}]/g, '').trim()))];

  const modal = document.createElement('div');
  modal.className = 'prompt-modal-overlay';
  modal.innerHTML = `
    <div class="prompt-modal pm-form">
      <div class="pm-hd">
        <h3>💾 保存为 Skill</h3>
        <button class="pm-close" id="ss-close">×</button>
      </div>
      <div class="pm-body">
        <div class="form-row">
          <label>名称 *</label>
          <input type="text" id="ss-name" placeholder="例如：内容总结专家">
        </div>
        <div class="form-row">
          <label>描述（一句话说明）</label>
          <input type="text" id="ss-desc" placeholder="例如：快速总结长文核心要点">
        </div>
        <div class="form-row">
          <label>提示词模板（自动提取变量：${variables.length ? variables.map(v => `{{${v}}}`).join(' ') : '无'}）</label>
          <textarea id="ss-prompt" rows="6" readonly>${escapeHtml(prompt)}</textarea>
        </div>
      </div>
      <div class="pm-footer">
        <button class="btn" id="ss-cancel">取消</button>
        <button class="btn brand" id="ss-save">保存</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);

  const close = () => modal.remove();
  modal.querySelector('#ss-close').addEventListener('click', close);
  modal.querySelector('#ss-cancel').addEventListener('click', close);
  modal.addEventListener('click', e => { if (e.target === modal) close(); });

  modal.querySelector('#ss-save').addEventListener('click', async () => {
    const name = modal.querySelector('#ss-name').value.trim();
    if (!name) { if (window.__toast) window.__toast('请输入名称', 'err'); return; }
    const desc = modal.querySelector('#ss-desc').value.trim();

    try {
      const skills = await getData('skills');
      skills.push({
        name, desc, prompt, variables,
        category: '通用', icon: 'sparkles', tags: []
      });
      await setData('skills', skills);
      if (window.__toast) window.__toast('已保存为 Skill', 'ok');
      close();
    } catch {
      if (window.__toast) window.__toast('保存失败', 'err');
    }
  });

  const escHandler = (e) => { if (e.key === 'Escape') { close(); document.removeEventListener('keydown', escHandler); } };
  document.addEventListener('keydown', escHandler);
}

// ── 保存输出弹窗 ────────────────────────────────────────────
function openSaveOutputModal() {
  const modal = document.createElement('div');
  modal.className = 'prompt-modal-overlay';
  modal.innerHTML = `
    <div class="prompt-modal pm-form">
      <div class="pm-hd">
        <h3>📥 保存 AI 输出</h3>
        <button class="pm-close" id="so-close">×</button>
      </div>
      <div class="pm-body">
        <div class="form-row">
          <label>标题</label>
          <input type="text" id="so-title" placeholder="例如：文章总结结果">
        </div>
        <div class="form-row">
          <label>AI 输出内容 *</label>
          <textarea id="so-content" rows="8" placeholder="粘贴 AI 返回的内容…"></textarea>
        </div>
        <div class="form-row">
          <label>分类</label>
          <select id="so-category">
            <option value="总结">总结</option>
            <option value="分析">分析</option>
            <option value="创作">创作</option>
            <option value="翻译">翻译</option>
            <option value="其他">其他</option>
          </select>
        </div>
      </div>
      <div class="pm-footer">
        <button class="btn" id="so-cancel">取消</button>
        <button class="btn brand" id="so-save">保存</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);

  const close = () => modal.remove();
  modal.querySelector('#so-close').addEventListener('click', close);
  modal.querySelector('#so-cancel').addEventListener('click', close);
  modal.addEventListener('click', e => { if (e.target === modal) close(); });

  modal.querySelector('#so-save').addEventListener('click', async () => {
    const content = modal.querySelector('#so-content').value.trim();
    if (!content) { if (window.__toast) window.__toast('请输入内容', 'err'); return; }
    const title = modal.querySelector('#so-title').value.trim() || content.slice(0, 30);
    const category = modal.querySelector('#so-category').value;

    try {
      await addIntakeOutput(title, content, category);
      if (window.__toast) window.__toast('已保存到资讯吸收', 'ok');
      close();
    } catch {
      if (window.__toast) window.__toast('保存失败', 'err');
    }
  });

  const escHandler = (e) => { if (e.key === 'Escape') { close(); document.removeEventListener('keydown', escHandler); } };
  document.addEventListener('keydown', escHandler);
}

// ── 存为工作流弹窗 ──────────────────────────────────────────
function openSaveWorkflowModal(prompt) {
  const modal = document.createElement('div');
  modal.className = 'prompt-modal-overlay';
  modal.innerHTML = `
    <div class="prompt-modal pm-form">
      <div class="pm-hd">
        <h3>📚 存为工作流</h3>
        <button class="pm-close" id="sw-close">×</button>
      </div>
      <div class="pm-body">
        <div class="form-row">
          <label>工作流名称 *</label>
          <input type="text" id="sw-name" placeholder="例如：内容创作工作流">
        </div>
        <div class="form-row">
          <label>描述（一句话说明）</label>
          <input type="text" id="sw-desc" placeholder="例如：从选题到发布的流程">
        </div>
        <div class="form-row">
          <label>第一步（当前提示词）</label>
          <div style="padding:10px 12px;background:var(--surface-2);border-radius:var(--r-xs);font-size:12px;color:var(--dim);max-height:120px;overflow:auto;white-space:pre-wrap">${escapeHtml(prompt.slice(0, 200))}${prompt.length > 200 ? '…' : ''}</div>
          <div style="font-size:11px;color:var(--dim-2);margin-top:6px">保存后可在「工作流」页面添加更多步骤</div>
        </div>
      </div>
      <div class="pm-footer">
        <button class="btn" id="sw-cancel">取消</button>
        <button class="btn brand" id="sw-save">保存</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);

  const close = () => modal.remove();
  modal.querySelector('#sw-close').addEventListener('click', close);
  modal.querySelector('#sw-cancel').addEventListener('click', close);
  modal.addEventListener('click', e => { if (e.target === modal) close(); });

  modal.querySelector('#sw-save').addEventListener('click', async () => {
    const name = modal.querySelector('#sw-name').value.trim();
    if (!name) { if (window.__toast) window.__toast('请输入名称', 'err'); return; }
    const desc = modal.querySelector('#sw-desc').value.trim();

    try {
      const workflows = await getData('methodology');
      workflows.push({
        title: name,
        desc,
        level: '通用',
        icon: 'layers',
        tags: [],
        steps: [
          { title: '步骤 1', desc: prompt }
        ]
      });
      await setData('methodology', workflows);
      if (window.__toast) window.__toast('已存为工作流，可在工作流页面编辑', 'ok');
      close();
    } catch {
      if (window.__toast) window.__toast('保存失败', 'err');
    }
  });

  const escHandler = (e) => { if (e.key === 'Escape') { close(); document.removeEventListener('keydown', escHandler); } };
  document.addEventListener('keydown', escHandler);
}
