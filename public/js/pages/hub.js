// ═══════════════════════════════════════════════════════════
// 页面：首页（任务工作台）
// 核心输入区 + 6 操作 + 推荐模板 + 快速入口
// ═══════════════════════════════════════════════════════════

import { getData } from '../api.js';
import { escapeHtml, toast } from '../main.js';
import { ICONS } from '../icons.js';
import { openPromptModal, QUICK_ACTIONS } from '../prompt-builder.js';
import { openSkillModal } from './skills.js';
import { getIntake, getIdeas } from '../store.js';
import { addIdea } from '../store.js';

export async function renderHub(container) {
  // 加载推荐模板
  let skills = [];
  let workflows = [];
  try { skills = await getData('skills'); } catch {}
  try { workflows = await getData('methodology'); } catch {}

  // 取前 4 个 Skill 和前 3 个工作流作为推荐
  const recSkills = skills.slice(0, 4);
  const recWorkflows = workflows.slice(0, 3);

  // 最近使用
  const recent = getRecent().slice(0, 4);

  // 使用统计
  const history = JSON.parse(localStorage.getItem('shutai_prompt_history') || '[]');
  const intakeCount = getIntake().length;
  const ideasCount = getIdeas().length;
  const savedCount = intakeCount + ideasCount;

  container.innerHTML = `
    <!-- 顶部：定位 -->
    <div class="hub-hero">
      <div class="hub-brand">枢台 · AI 提示词工作台</div>
      <h1 class="hub-title">把跟 AI 的协作，变成可复用的流程</h1>
      <div class="hub-sub">生成提示词 → 复制到任意 AI → 沉淀为模板，下次直接用</div>
    </div>

    <!-- 使用统计 -->
    <div class="hub-stats">
      <div class="hub-stat"><span class="hub-stat-n">${skills.length}</span><span class="hub-stat-l">Skill</span></div>
      <div class="hub-stat"><span class="hub-stat-n">${workflows.length}</span><span class="hub-stat-l">工作流</span></div>
      <div class="hub-stat"><span class="hub-stat-n">${savedCount}</span><span class="hub-stat-l">收藏</span></div>
      <div class="hub-stat"><span class="hub-stat-n">${history.length}</span><span class="hub-stat-l">生成记录</span></div>
    </div>

    <!-- 核心输入区 -->
    <div class="hub-input-card">
      <div class="hub-input-hd">
        <span class="hub-input-icon">${ICONS.sparkles}</span>
        <span class="hub-input-title">提示工坊</span>
        <span class="hub-input-hint">输入内容，选一个操作，自动生成提示词并复制</span>
      </div>
      <textarea id="hub-input" class="hub-input-textarea" placeholder="例如：粘贴一篇文章，点「总结要点」一键生成提示词" rows="3"></textarea>
      <div class="hub-input-toolbar">
        <button class="hub-tool-btn" id="hub-try-example">✨ 试试示例</button>
        <button class="hub-tool-btn" id="hub-save-idea">💡 保存为灵感</button>
      </div>
      <div class="hub-actions">
        ${QUICK_ACTIONS.map(a => `
          <button class="hub-action-btn" data-action="${a.id}" style="--action-color: ${a.color}">
            <span class="ha-icon">${getIconSvg(a.icon)}</span>
            <span class="ha-name">${a.name}</span>
            <span class="ha-key">${a.key}</span>
          </button>
        `).join('')}
      </div>
      <div class="hub-input-footer">
        <span class="hub-kbd">⌘ + Shift + P</span> 提示工坊 · <span class="hub-kbd">/</span> 全局搜索 · <span class="hub-kbd">?</span> 快捷键
      </div>
    </div>

    <!-- 最近使用 -->
    ${recent.length > 0 ? `
    <div class="hub-section">
      <div class="hub-section-hd">
        <h2 class="hub-section-title">${ICONS.clock || '🕐'} 最近使用</h2>
      </div>
      <div class="hub-rec-grid">
        ${recent.map((r, i) => `
          <div class="hub-rec-card hub-recent-card" data-recent-idx="${i}">
            <div class="hub-rec-icon">${ICONS[r.icon] || (r.type === 'skill' ? ICONS.puzzle : ICONS.layers)}</div>
            <div class="hub-rec-info">
              <div class="hub-rec-name">${escapeHtml(r.name)}</div>
              <div class="hub-rec-desc">${escapeHtml(r.desc || '')}</div>
            </div>
            <span class="hub-rec-type ${r.type}">${r.type === 'skill' ? '单步' : '多步'}</span>
          </div>
        `).join('')}
      </div>
    </div>
    ` : ''}

    <!-- 推荐模板 -->
    <div class="hub-section">
      <div class="hub-section-hd">
        <h2 class="hub-section-title">${ICONS.puzzle} 推荐 Skill 模板</h2>
        <a class="hub-section-more" data-page="skills">查看全部 →</a>
      </div>
      <div class="hub-rec-grid">
        ${recSkills.map((s, i) => `
          <div class="hub-rec-card" data-type="skill" data-idx="${i}">
            <div class="hub-rec-icon">${ICONS[s.icon] || ICONS.puzzle}</div>
            <div class="hub-rec-info">
              <div class="hub-rec-name">${escapeHtml(s.name)}</div>
              <div class="hub-rec-desc">${escapeHtml(s.desc || '')}</div>
            </div>
            ${s.variables && s.variables.length ? `<div class="hub-rec-vars">${s.variables.length} 个变量</div>` : ''}
          </div>
        `).join('')}
      </div>
    </div>

    <div class="hub-section">
      <div class="hub-section-hd">
        <h2 class="hub-section-title">${ICONS.layers} 推荐工作流</h2>
        <a class="hub-section-more" data-page="playbooks">查看全部 →</a>
      </div>
      <div class="hub-rec-grid">
        ${recWorkflows.map((w, i) => `
          <div class="hub-rec-card" data-type="workflow" data-idx="${i}">
            <div class="hub-rec-icon">${ICONS[w.icon] || ICONS.layers}</div>
            <div class="hub-rec-info">
              <div class="hub-rec-name">${escapeHtml(w.title)}</div>
              <div class="hub-rec-desc">${escapeHtml(w.desc || '')}</div>
            </div>
            ${w.steps && w.steps.length ? `<div class="hub-rec-vars">${w.steps.length} 步</div>` : ''}
          </div>
        `).join('')}
      </div>
    </div>
  `;

  // 核心输入区：6 个操作按钮
  const input = container.querySelector('#hub-input');
  container.querySelectorAll('.hub-action-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const content = input.value.trim();
      if (!content) {
        toast('请先输入内容', 'err');
        input.focus();
        return;
      }
      openPromptModal(content, btn.dataset.action);
    });
  });

  // 推荐模板点击
  container.querySelectorAll('.hub-rec-card:not(.hub-recent-card)').forEach(card => {
    card.addEventListener('click', () => {
      const type = card.dataset.type;
      const idx = Number(card.dataset.idx);
      if (type === 'skill') {
        addRecent('skill', recSkills[idx]);
        openSkillModal(recSkills[idx]);
      } else if (type === 'workflow') {
        addRecent('workflow', recWorkflows[idx]);
        openWorkflowModal(recWorkflows[idx]);
      }
    });
  });

  // 最近使用点击
  container.querySelectorAll('.hub-recent-card').forEach(card => {
    card.addEventListener('click', () => {
      const idx = Number(card.dataset.recentIdx);
      const r = recent[idx];
      if (r.type === 'skill') {
        // 从 skills 列表中找到对应的 skill
        const skill = skills.find(s => s.name === r.name);
        if (skill) {
          addRecent('skill', skill);
          openSkillModal(skill);
        }
      } else if (r.type === 'workflow') {
        const wf = workflows.find(w => w.title === r.name);
        if (wf) {
          addRecent('workflow', wf);
          openWorkflowModal(wf);
        }
      }
    });
  });

  // 查看全部
  container.querySelectorAll('.hub-section-more').forEach(a => {
    a.addEventListener('click', () => {
      window.__switchPage(a.dataset.page);
    });
  });

  // 试试示例
  container.querySelector('#hub-try-example').addEventListener('click', () => {
    const example = `人工智能正在改变内容创作的方式。从选题策划到文案撰写，从视频脚本到海报设计，AI 工具已经渗透到内容生产的每一个环节。

对于创作者来说，AI 不是替代品，而是放大器。它可以帮你快速完成初稿、整理素材、优化表达，但最终的创意、判断和风格仍然来自于你。

关键是要找到适合自己的 AI 工作流：什么时候用 AI 生成，什么时候手动调整，如何把 AI 的输出变成自己的风格。这需要不断尝试和迭代。`;
    input.value = example;
    toast('已填充示例内容，选一个操作试试', 'ok');
  });

  // 保存为灵感
  container.querySelector('#hub-save-idea').addEventListener('click', async () => {
    const text = input.value.trim();
    if (!text) { toast('请先输入内容', 'err'); input.focus(); return; }
    await addIdea(text);
    input.value = '';
    toast('已保存到灵感库', 'ok');
  });
}

// 辅助：获取图标 SVG
function getIconSvg(iconName) {
  return ICONS[iconName] || '';
}

// 最近使用记录
const RECENT_KEY = 'shutai_recent';
export function addRecent(type, item) {
  try {
    const recent = JSON.parse(localStorage.getItem(RECENT_KEY) || '[]');
    // 去重
    const filtered = recent.filter(r => !(r.type === type && r.name === item.name));
    filtered.unshift({ type, name: item.name, icon: item.icon, desc: item.desc, ts: Date.now() });
    // 最多保留 8 条
    localStorage.setItem(RECENT_KEY, JSON.stringify(filtered.slice(0, 8)));
  } catch {}
}
function getRecent() {
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY) || '[]');
  } catch { return []; }
}
window.__addRecent = addRecent;

// 工作流详情弹窗
function openWorkflowModal(workflow) {
  const modal = document.createElement('div');
  modal.className = 'prompt-modal-overlay';
  modal.innerHTML = `
    <div class="prompt-modal pm-workflow">
      <div class="pm-hd">
        <h3>📚 ${escapeHtml(workflow.title)}</h3>
        <button class="pm-close" id="wf-close">×</button>
      </div>
      <div class="pm-body">
        ${workflow.desc ? `<div class="pm-workflow-desc">${escapeHtml(workflow.desc)}</div>` : ''}
        <div class="pm-workflow-steps">
          ${(workflow.steps || []).map((step, i) => `
            <div class="pm-wf-step">
              <div class="pm-wf-step-hd">
                <span class="pm-wf-step-num">${i + 1}</span>
                <span class="pm-wf-step-title">${escapeHtml(step.title)}</span>
                <button class="btn sm brand pm-wf-step-gen" data-idx="${i}">✨ 生成提示词</button>
              </div>
              ${step.desc ? `<div class="pm-wf-step-desc">${escapeHtml(step.desc)}</div>` : ''}
            </div>
          `).join('')}
        </div>
        ${workflow.steps && workflow.steps.length > 1 ? `
          <div class="pm-workflow-run-all">
            <button class="btn brand" id="wf-run-all">⚡ 一键执行全部步骤</button>
          </div>
        ` : ''}
      </div>
    </div>
  `;
  document.body.appendChild(modal);

  const close = () => modal.remove();
  modal.querySelector('#wf-close').addEventListener('click', close);
  modal.addEventListener('click', e => { if (e.target === modal) close(); });

  // 每步生成提示词
  modal.querySelectorAll('.pm-wf-step-gen').forEach(btn => {
    btn.addEventListener('click', () => {
      const idx = Number(btn.dataset.idx);
      const step = workflow.steps[idx];
      const content = `${workflow.title} - 步骤${idx + 1}: ${step.title}\n\n${step.desc || ''}`;
      openPromptModal(content);
    });
  });

  // 一键执行全部
  const runAllBtn = modal.querySelector('#wf-run-all');
  if (runAllBtn) {
    runAllBtn.addEventListener('click', () => {
      const allContent = workflow.steps.map((s, i) => `步骤${i + 1}: ${s.title}${s.desc ? '\n' + s.desc : ''}`).join('\n\n---\n\n');
      openPromptModal(`${workflow.title}\n\n${allContent}`);
      close();
    });
  }

  const escHandler = (e) => { if (e.key === 'Escape') { close(); document.removeEventListener('keydown', escHandler); } };
  document.addEventListener('keydown', escHandler);
}
