// ═══════════════════════════════════════════════════════════
// 页面：工作流库
// 可复用的 AI 工作流模板 · 搜索/筛选/步骤执行/提示词生成/CRUD
// ═══════════════════════════════════════════════════════════

import { getData, setData } from '../api.js';
import { escapeHtml, toast } from '../main.js';
import { ICONS } from '../icons.js';
import { openPromptModal } from '../prompt-builder.js';
import { t, getLang } from '../i18n.js';

const LEVEL_COLORS = {
  '顶层框架': 'r', '内容SOP': 'p', '战略洞察': 'g', '哲学层': 'y',
  '知识工程': 'y', '数据驱动': 'b', '视频范式': 'b', '选型方法': 'g',
  '运营SOP': 'p', '学习方法': 'y', '通用': 'b'
};

const LEVEL_OPTIONS = ['顶层框架', '内容SOP', '战略洞察', '哲学层', '知识工程', '数据驱动', '视频范式', '选型方法', '运营SOP', '学习方法', '通用'];
const ICON_OPTIONS = ['zap', 'sparkles', 'target', 'compass', 'database', 'layers', 'lightbulb', 'tool', 'file', 'film', 'globe', 'megaphone', 'puzzle', 'flag', 'book'];

// 步骤完成状态（本地存储持久化）
const STEP_STATE_KEY = 'shutai_wf_step_state';
let stepState = {};
try {
  stepState = JSON.parse(localStorage.getItem(STEP_STATE_KEY) || '{}');
} catch {}
function saveStepState() {
  try {
    localStorage.setItem(STEP_STATE_KEY, JSON.stringify(stepState));
  } catch {}
}

let items = [];
let containerEl = null;

export async function renderMethodology(container) {
  containerEl = container;
  const lang = getLang();
  container.innerHTML = `
    <div class="crud-hd">
      <div>
        <div class="ph-h"><span class="n">${ICONS.layers}</span>${t('wf.title')}</div>
        <div class="ph-sub">${t('wf.subtitle')}</div>
      </div>
      <button class="btn brand" id="wf-new">${ICONS.plus || '+'} ${t('wf.newWorkflow')}</button>
    </div>

    <div class="wf-toolbar">
      <div class="wf-search">
        ${ICONS.search || '🔍'}
        <input type="text" id="wf-search" placeholder="${t('wf.searchPlaceholder')}">
      </div>
      <div class="wf-filters" id="wf-filters"></div>
    </div>

    <div class="wf-stats" id="wf-stats"></div>
    <div class="wf-grid" id="wf-grid"><div class="empty">${t('common.loading')}</div></div>
  `;

  try {
    items = await getData('methodology');
  } catch {
    items = getDefaultMethodology();
  }

  let currentLevel = 'all';
  let currentSearch = '';

  // 新建
  container.querySelector('#wf-new').addEventListener('click', () => openWorkflowForm());

  // 分类筛选
  const levels = [...new Set(items.map(i => i.level || '通用'))];
  const filters = container.querySelector('#wf-filters');
  filters.innerHTML = `
    <span class="wf-filter on" data-level="all">${t('wf.all')} ${items.length}</span>
    ${levels.map(lv => `<span class="wf-filter" data-level="${escapeHtml(lv)}">${escapeHtml(lv)} ${items.filter(i => (i.level || '通用') === lv).length}</span>`).join('')}
  `;
  filters.querySelectorAll('.wf-filter').forEach(f => {
    f.addEventListener('click', () => {
      filters.querySelectorAll('.wf-filter').forEach(x => x.classList.remove('on'));
      f.classList.add('on');
      currentLevel = f.dataset.level;
      renderGrid();
    });
  });

  // 搜索
  container.querySelector('#wf-search').addEventListener('input', e => {
    currentSearch = e.target.value.toLowerCase();
    renderGrid();
  });

  function renderGrid() {
    const grid = container.querySelector('#wf-grid');
    let filtered = items;
    if (currentLevel !== 'all') {
      filtered = filtered.filter(i => (i.level || '通用') === currentLevel);
    }
    if (currentSearch) {
      filtered = filtered.filter(i =>
        (i.title || '').toLowerCase().includes(currentSearch) ||
        (i.desc || '').toLowerCase().includes(currentSearch) ||
        (i.tags || []).some(t => t.toLowerCase().includes(currentSearch))
      );
    }

    // 统计
    const totalSteps = filtered.reduce((sum, i) => sum + (i.steps ? i.steps.length : 0), 0);
    const doneSteps = filtered.reduce((sum, i) => {
      if (!i.steps) return sum;
      return sum + i.steps.filter((_, idx) => stepState[`${i.title}-${idx}`]).length;
    }, 0);
    container.querySelector('#wf-stats').innerHTML = `
      <div class="wf-stat"><div class="n">${filtered.length}</div><div class="l">${t('wf.total')}</div></div>
      <div class="wf-stat"><div class="n">${totalSteps}</div><div class="l">${t('wf.totalSteps')}</div></div>
      <div class="wf-stat"><div class="n">${doneSteps}</div><div class="l">${t('wf.completed')}</div></div>
      <div class="wf-stat"><div class="n">${totalSteps > 0 ? Math.round(doneSteps / totalSteps * 100) : 0}%</div><div class="l">${t('wf.completionRate')}</div></div>
    `;

    if (filtered.length === 0) {
      if (items.length === 0) {
        grid.innerHTML = `
          <div class="empty-state">
            <div class="es-icon">📚</div>
            <div class="es-title">${lang === 'zh' ? '还没有工作流' : 'No workflows yet'}</div>
            <div class="es-desc">${lang === 'zh' ? '工作流是多步骤的 AI 任务模板，按步骤执行，每步可生成提示词' : 'Workflows are multi-step AI task templates, execute step by step'}</div>
            <button class="btn brand" id="es-new-workflow">+ ${lang === 'zh' ? '创建第一个工作流' : 'Create first workflow'}</button>
          </div>`;
        grid.querySelector('#es-new-workflow').addEventListener('click', () => openWorkflowForm());
      } else {
        grid.innerHTML = `<div class="empty"><div class="ico">🔍</div>${lang === 'zh' ? '没有匹配的工作流，换个关键词试试' : 'No matching workflows, try different keywords'}</div>`;
      }
      return;
    }

    grid.innerHTML = filtered.map((m, idx) => {
      const realIdx = items.indexOf(m);
      const stepCount = m.steps ? m.steps.length : 0;
      const doneCount = m.steps ? m.steps.filter((_, sidx) => stepState[`${m.title}-${sidx}`]).length : 0;
      const progress = stepCount > 0 ? Math.round(doneCount / stepCount * 100) : 0;
      return `
        <div class="wf-card" data-idx="${realIdx}">
          <div class="wf-card-hd">
            <div class="wf-card-title">
              <span class="wf-ico">${ICONS[m.icon] || escapeHtml(m.icon || '📌')}</span>
              <span class="wf-t">${escapeHtml(m.title)}</span>
            </div>
            <div class="wf-card-acts">
              <button class="wf-card-btn" data-act="edit" title="编辑">${ICONS.edit || '✏️'}</button>
              <button class="wf-card-btn del" data-act="delete" title="删除">${ICONS.trash || '🗑'}</button>
            </div>
          </div>
          <div class="wf-lvl-row">
            <span class="wf-type-badge">多步模板</span>
            <span class="wf-lvl tag ${LEVEL_COLORS[m.level] || 'b'}">${escapeHtml(m.level || '通用')}</span>
          </div>
          <div class="wf-desc">${escapeHtml(m.desc || '')}</div>
          ${m.tags ? `<div class="wf-tags">${m.tags.map(t => `<span class="wf-tag">${escapeHtml(t)}</span>`).join('')}</div>` : ''}
          ${stepCount > 0 ? `
            <div class="wf-progress">
              <div class="wf-progress-bar"><div class="wf-progress-fill" style="width:${progress}%"></div></div>
              <span class="wf-progress-text">${doneCount}/${stepCount} 步骤</span>
            </div>
          ` : ''}
          <div class="wf-detail" data-detail="${realIdx}">
            ${m.steps ? m.steps.map((s, sidx) => {
              const isDone = stepState[`${m.title}-${sidx}`];
              return `
                <div class="wf-step ${isDone ? 'done' : ''}" data-step="${sidx}">
                  <div class="wf-step-hd">
                    <span class="wf-step-num">${sidx + 1}</span>
                    <span class="wf-step-title">${escapeHtml(s.title)}</span>
                    <div class="wf-step-acts">
                      <button class="wf-step-btn" data-act="prompt" title="生成提示词">${ICONS.sparkles || '✨'}</button>
                      <button class="wf-step-btn ${isDone ? 'on' : ''}" data-act="toggle" title="标记完成">${isDone ? '✓' : '○'}</button>
                    </div>
                  </div>
                  ${s.desc ? `<div class="wf-step-desc">${escapeHtml(s.desc)}</div>` : ''}
                </div>
              `;
            }).join('') : ''}
            ${m.fullText ? `<div class="wf-fulltext">${escapeHtml(m.fullText)}</div>` : ''}
            <div class="wf-detail-acts">
              <button class="btn sm" data-act="copy-all">${ICONS.copy || '📋'} 复制全文</button>
              ${m.steps ? `<button class="btn sm brand" data-act="run-all">${ICONS.zap || '⚡'} 一键执行全部</button>` : ''}
            </div>
          </div>
        </div>
      `;
    }).join('');

    // 卡片展开/收起
    grid.querySelectorAll('.wf-card').forEach(card => {
      card.querySelector('.wf-card-hd').addEventListener('click', e => {
        if (e.target.closest('.wf-card-acts') || e.target.closest('.wf-step-acts') || e.target.closest('.wf-detail-acts')) return;
        const idx = card.dataset.idx;
        const detail = card.querySelector(`[data-detail="${idx}"]`);
        detail.classList.toggle('open');
      });
    });

    // 编辑/删除
    grid.querySelectorAll('.wf-card-btn').forEach(btn => {
      btn.addEventListener('click', e => {
        e.stopPropagation();
        const card = btn.closest('.wf-card');
        const idx = Number(card.dataset.idx);
        const act = btn.dataset.act;
        if (act === 'edit') openWorkflowForm(idx);
        if (act === 'delete') deleteWorkflow(idx);
      });
    });

    // 步骤操作
    grid.querySelectorAll('.wf-step').forEach(step => {
      const sidx = Number(step.dataset.step);
      const card = step.closest('.wf-card');
      const m = items[Number(card.dataset.idx)];

      step.querySelector('[data-act="prompt"]').addEventListener('click', e => {
        e.stopPropagation();
        const content = `${m.title} - 步骤${sidx + 1}: ${m.steps[sidx].title}\n\n${m.steps[sidx].desc || ''}`;
        openPromptModal(content);
      });

      step.querySelector('[data-act="toggle"]').addEventListener('click', e => {
        e.stopPropagation();
        const key = `${m.title}-${sidx}`;
        stepState[key] = !stepState[key];
        saveStepState();
        renderGrid();
      });
    });

    // 复制全文
    grid.querySelectorAll('[data-act="copy-all"]').forEach(btn => {
      btn.addEventListener('click', async e => {
        e.stopPropagation();
        const card = btn.closest('.wf-card');
        const m = items[Number(card.dataset.idx)];
        const text = `${m.title}\n\n${m.desc || ''}\n\n${m.steps ? m.steps.map((s, i) => `${i + 1}. ${s.title}${s.desc ? '\n   ' + s.desc : ''}`).join('\n\n') : ''}${m.fullText ? '\n\n' + m.fullText : ''}`;
        try {
          await navigator.clipboard.writeText(text);
          toast('已复制到剪贴板', 'ok');
        } catch {
          toast('复制失败', 'err');
        }
      });
    });

    // 一键执行全部
    grid.querySelectorAll('[data-act="run-all"]').forEach(btn => {
      btn.addEventListener('click', e => {
        e.stopPropagation();
        const card = btn.closest('.wf-card');
        const m = items[Number(card.dataset.idx)];
        const allContent = m.steps.map((s, i) => `步骤${i + 1}: ${s.title}${s.desc ? '\n' + s.desc : ''}`).join('\n\n---\n\n');
        openPromptModal(`${m.title}\n\n${allContent}`);
      });
    });
  }

  renderGrid();
}

// 新建/编辑表单
function openWorkflowForm(editIdx = null) {
  const m = editIdx !== null ? items[editIdx] : { title: '', desc: '', steps: [] };
  const isEdit = editIdx !== null;

  const modal = document.createElement('div');
  modal.className = 'prompt-modal-overlay';
  modal.innerHTML = `
    <div class="prompt-modal pm-form">
      <div class="pm-hd">
        <h3>${isEdit ? '编辑工作流' : '新建工作流'}</h3>
        <button class="pm-close" id="wf-form-close">×</button>
      </div>
      <div class="pm-body">
        <div class="form-row">
          <label>标题 *</label>
          <input type="text" id="wf-f-title" value="${escapeHtml(m.title)}" placeholder="例如：内容创作工作流">
        </div>
        <div class="form-row">
          <label>描述（一句话说明）</label>
          <input type="text" id="wf-f-desc" value="${escapeHtml(m.desc || '')}" placeholder="例如：从选题到发布的5步流程">
        </div>
        <div class="form-row">
          <div class="form-row-hd">
            <label>步骤</label>
            <button class="btn sm" id="wf-add-step">+ 添加步骤</button>
          </div>
          <div id="wf-steps-list"></div>
        </div>
      </div>
      <div class="pm-footer">
        <button class="btn" id="wf-form-cancel">取消</button>
        <button class="btn brand" id="wf-form-save">${isEdit ? '保存' : '创建'}</button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  let steps = JSON.parse(JSON.stringify(m.steps || []));
  const stepsList = modal.querySelector('#wf-steps-list');

  function renderSteps() {
    stepsList.innerHTML = steps.map((s, i) => `
      <div class="form-step" data-idx="${i}">
        <div class="form-step-hd">
          <span class="form-step-num">${i + 1}</span>
          <input type="text" class="form-step-title" value="${escapeHtml(s.title)}" placeholder="步骤标题">
          <button class="form-step-del" data-idx="${i}">×</button>
        </div>
        <textarea class="form-step-desc" rows="2" placeholder="步骤描述（可选）">${escapeHtml(s.desc || '')}</textarea>
      </div>
    `).join('');

    stepsList.querySelectorAll('.form-step').forEach(step => {
      const i = Number(step.dataset.idx);
      step.querySelector('.form-step-title').addEventListener('input', e => { steps[i].title = e.target.value; });
      step.querySelector('.form-step-desc').addEventListener('input', e => { steps[i].desc = e.target.value; });
      step.querySelector('.form-step-del').addEventListener('click', () => {
        steps.splice(i, 1);
        renderSteps();
      });
    });
  }
  renderSteps();

  modal.querySelector('#wf-add-step').addEventListener('click', () => {
    steps.push({ title: '', desc: '' });
    renderSteps();
  });

  // 关闭
  const close = () => modal.remove();
  modal.querySelector('#wf-form-close').addEventListener('click', close);
  modal.querySelector('#wf-form-cancel').addEventListener('click', close);
  modal.addEventListener('click', e => { if (e.target === modal) close(); });

  // 保存
  modal.querySelector('#wf-form-save').addEventListener('click', async () => {
    const title = modal.querySelector('#wf-f-title').value.trim();
    if (!title) { toast('请输入标题', 'err'); return; }
    const desc = modal.querySelector('#wf-f-desc').value.trim();
    const cleanSteps = steps.filter(s => s.title.trim()).map(s => ({ title: s.title.trim(), desc: s.desc.trim() }));

    const data = {
      title, desc, steps: cleanSteps,
      level: m.level || '通用',
      icon: m.icon || 'layers',
      tags: m.tags || []
    };
    if (isEdit) {
      items[editIdx] = { ...items[editIdx], ...data };
    } else {
      items.push(data);
    }

    try {
      await setData('methodology', items);
      toast(isEdit ? '已保存' : '已创建', 'ok');
      close();
      const evt = new HashChangeEvent('hashchange');
      window.dispatchEvent(evt);
    } catch {
      toast('保存失败', 'err');
    }
  });

  // ESC
  const escHandler = (e) => { if (e.key === 'Escape') { close(); document.removeEventListener('keydown', escHandler); } };
  document.addEventListener('keydown', escHandler);
}

// 删除
async function deleteWorkflow(idx) {
  const m = items[idx];
  if (!confirm(`确定删除「${m.title}」？`)) return;
  items.splice(idx, 1);
  try {
    await setData('methodology', items);
    toast('已删除', 'ok');
    const evt = new HashChangeEvent('hashchange');
    window.dispatchEvent(evt);
  } catch {
    toast('删除失败', 'err');
  }
}

function getDefaultMethodology() {
  return [
    { icon: 'zap', title: '差压引擎方法论', level: '顶层框架', desc: '顶层不是「信息差」，是「差的再生产引擎」。三种差（信息差/认知差/执行差）+ 三问检验 + 两阶段配比。', tags: ['顶层设计', '三差叠加', '再生产引擎'], steps: [{ title: '信息差', desc: '大众不知道的新事实、新数据、新案例。' }, { title: '认知差', desc: '对已知信息的反共识解读，元层视角。' }, { title: '执行差', desc: '读者看完能带走的具体动作、工具、清单。' }] },
    { icon: 'sparkles', title: '双飞轮·叙事流 SOP', level: '内容SOP', desc: '借已验证注意力 + 叠元层反共识视角 + 发掘信息差 = 高完播涨粉。5 步流水线。', tags: ['飞轮A引流', '借势冷启动', '元层视角'], steps: [{ title: '借势', desc: '蹭已验证的热点/话题/容器，获取初始注意力。' }, { title: '叠元层', desc: '在热点基础上叠加反共识的元层视角，制造认知差。' }, { title: '挖信息差', desc: '补充大众不知道的细节、数据、案例，夯实信息差。' }, { title: '给执行差', desc: '结尾给出读者能直接用的动作、工具、清单。' }] }
  ];
}
