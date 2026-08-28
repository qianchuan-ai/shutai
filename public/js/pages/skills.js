// ═══════════════════════════════════════════════════════════
// 页面：Skill 库
// 提示词模板管理 · 搜索/分类/变量填充/一键使用/CRUD
// ═══════════════════════════════════════════════════════════

import { getData, setData } from '../api.js';
import { escapeHtml, toast } from '../main.js';
import { ICONS } from '../icons.js';

const CATEGORY_OPTIONS = ['内容创作', '自媒体', '开发', '数据', '通用', '视频', '图像', '运营'];
const ICON_OPTIONS = ['file', 'film', 'zap', 'tool', 'megaphone', 'target', 'globe', 'lightbulb', 'puzzle', 'layers', 'compass', 'database', 'flag', 'book', 'sparkles'];

let skills = [];

export async function renderSkills(container) {
  container.innerHTML = `
    <div class="crud-hd">
      <div>
        <div class="ph-h"><span class="n">${ICONS.puzzle}</span>Skill 库</div>
        <div class="ph-sub">可复用的提示词模板 · 支持变量填充，一键生成并复制</div>
      </div>
      <button class="btn brand" id="sk-new">${ICONS.plus || '+'} 新建 Skill</button>
    </div>

    <div class="skill-toolbar">
      <div class="skill-search">
        ${ICONS.search || '🔍'}
        <input type="text" id="skill-search" placeholder="搜索 Skill 名称、描述或标签…">
      </div>
    </div>
    <div class="skill-filters" id="skill-filters"></div>
    <div class="skill-grid" id="skill-grid"><div class="empty">加载中…</div></div>
  `;

  try {
    skills = await getData('skills');
  } catch {
    skills = getDefaultSkills();
  }

  let currentCategory = 'all';
  let currentSearch = '';

  // 新建
  container.querySelector('#sk-new').addEventListener('click', () => openSkillForm());

  // 分类
  const categories = [...new Set(skills.map(s => s.category || '其他'))];
  const filters = container.querySelector('#skill-filters');
  filters.innerHTML = `
    <span class="skill-filter on" data-cat="all">全部 ${skills.length}</span>
    ${categories.map(cat => `<span class="skill-filter" data-cat="${escapeHtml(cat)}">${escapeHtml(cat)} ${skills.filter(s => (s.category || '其他') === cat).length}</span>`).join('')}
  `;
  filters.querySelectorAll('.skill-filter').forEach(f => {
    f.addEventListener('click', () => {
      filters.querySelectorAll('.skill-filter').forEach(x => x.classList.remove('on'));
      f.classList.add('on');
      currentCategory = f.dataset.cat;
      renderGrid();
    });
  });

  // 搜索
  container.querySelector('#skill-search').addEventListener('input', e => {
    currentSearch = e.target.value.toLowerCase();
    renderGrid();
  });

  function renderGrid() {
    const grid = container.querySelector('#skill-grid');
    let filtered = skills;
    if (currentCategory !== 'all') {
      filtered = filtered.filter(s => (s.category || '其他') === currentCategory);
    }
    if (currentSearch) {
      filtered = filtered.filter(s =>
        (s.name || '').toLowerCase().includes(currentSearch) ||
        (s.desc || '').toLowerCase().includes(currentSearch) ||
        (s.tags || []).some(t => t.toLowerCase().includes(currentSearch))
      );
    }

    if (filtered.length === 0) {
      if (skills.length === 0) {
        grid.innerHTML = `
          <div class="empty-state">
            <div class="es-icon">🧩</div>
            <div class="es-title">还没有 Skill 模板</div>
            <div class="es-desc">Skill 是可复用的提示词模板，支持变量填充，一键生成并复制</div>
            <button class="btn brand" id="es-new-skill">+ 创建第一个 Skill</button>
          </div>`;
        grid.querySelector('#es-new-skill').addEventListener('click', () => openSkillForm());
      } else {
        grid.innerHTML = '<div class="empty"><div class="ico">🔍</div>没有匹配的 Skill，换个关键词试试</div>';
      }
      return;
    }

    grid.innerHTML = filtered.map((s, idx) => {
      const realIdx = skills.indexOf(s);
      return `
        <div class="sk-card" data-idx="${realIdx}">
          <div class="sk-card-hd">
            <div class="sk-icon">${ICONS[s.icon] || ICONS.puzzle}</div>
            <div class="sk-info">
              <div class="sk-name">${escapeHtml(s.name)}</div>
              <div class="sk-cat"><span class="sk-type-badge">单步模板</span> ${escapeHtml(s.category || '其他')}</div>
            </div>
            <div class="sk-card-acts">
              <button class="sk-card-btn" data-act="edit" title="编辑">${ICONS.edit || '✏️'}</button>
              <button class="sk-card-btn del" data-act="delete" title="删除">${ICONS.trash || '🗑'}</button>
            </div>
          </div>
          <div class="sk-desc">${escapeHtml(s.desc || '')}</div>
          ${s.tags ? `<div class="sk-tags">${s.tags.slice(0, 4).map(t => `<span class="sk-tag">${escapeHtml(t)}</span>`).join('')}</div>` : ''}
          ${s.variables && s.variables.length ? `<div class="sk-vars">变量：${s.variables.map(v => `<span class="sk-var">{{${escapeHtml(v)}}}</span>`).join(' ')}</div>` : ''}
          <div class="sk-acts">
            <button class="btn sm brand" data-act="use">${ICONS.zap || '⚡'} 使用</button>
            <button class="btn sm" data-act="preview">${ICONS.eye || '👁'} 预览</button>
          </div>
        </div>
      `;
    }).join('');

    // 使用/预览
    grid.querySelectorAll('[data-act="use"]').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = Number(btn.closest('.sk-card').dataset.idx);
        openSkillModal(skills[idx]);
      });
    });
    grid.querySelectorAll('[data-act="preview"]').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = Number(btn.closest('.sk-card').dataset.idx);
        openSkillModal(skills[idx], true);
      });
    });

    // 编辑/删除
    grid.querySelectorAll('.sk-card-btn').forEach(btn => {
      btn.addEventListener('click', e => {
        e.stopPropagation();
        const idx = Number(btn.closest('.sk-card').dataset.idx);
        const act = btn.dataset.act;
        if (act === 'edit') openSkillForm(idx);
        if (act === 'delete') deleteSkill(idx);
      });
    });
  }

  renderGrid();
}

// Skill 使用弹窗
export function openSkillModal(skill, previewOnly = false) {
  const variables = skill.variables || [];
  const varValues = {};
  variables.forEach(v => { varValues[v] = ''; });

  const modal = document.createElement('div');
  modal.className = 'prompt-modal-overlay';
  modal.innerHTML = `
    <div class="prompt-modal pm-skill">
      <div class="pm-hd">
        <h3>${previewOnly ? '👁 预览提示词' : '⚡ 使用 Skill'} — ${escapeHtml(skill.name)}</h3>
        <button class="pm-close" id="sk-close">×</button>
      </div>
      <div class="pm-body">
        <div class="pm-section">
          <label>Skill 描述</label>
          <div class="sk-modal-desc">${escapeHtml(skill.desc || '')}</div>
        </div>
        ${variables.length ? `
          <div class="pm-section">
            <label>变量填充</label>
            <div class="sk-var-inputs">
              ${variables.map(v => `
                <div class="sk-var-input">
                  <label>{{${escapeHtml(v)}}}</label>
                  <input type="text" data-var="${escapeHtml(v)}" placeholder="输入 ${escapeHtml(v)}…">
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}
        <div class="pm-section">
          <label>生成的提示词</label>
          <textarea id="sk-result" class="pm-result-textarea" readonly>${escapeHtml(skill.prompt || skill.desc || '')}</textarea>
        </div>
        <div class="pm-result-actions">
          <button class="btn sm brand" id="sk-copy">📋 复制提示词</button>
          <span class="pm-result-hint">复制后去任意 AI 工具粘贴即可</span>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(modal);
  const resultEl = modal.querySelector('#sk-result');

  function updatePrompt() {
    let prompt = skill.prompt || skill.desc || '';
    variables.forEach(v => {
      const input = modal.querySelector(`[data-var="${v}"]`);
      const val = input ? input.value : '';
      prompt = prompt.replace(new RegExp(`{{\\s*${v}\\s*}}`, 'g'), val || `{{${v}}}`);
    });
    resultEl.value = prompt;
  }

  modal.querySelectorAll('[data-var]').forEach(input => {
    input.addEventListener('input', updatePrompt);
  });

  modal.querySelector('#sk-close').addEventListener('click', () => modal.remove());
  modal.addEventListener('click', e => { if (e.target === modal) modal.remove(); });

  modal.querySelector('#sk-copy').addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(resultEl.value);
      toast('提示词已复制', 'ok');
      modal.remove();
    } catch {
      toast('复制失败', 'err');
    }
  });

  const escHandler = (e) => {
    if (e.key === 'Escape') { modal.remove(); document.removeEventListener('keydown', escHandler); }
  };
  document.addEventListener('keydown', escHandler);

  updatePrompt();
}

// 新建/编辑表单
function openSkillForm(editIdx = null) {
  const s = editIdx !== null ? skills[editIdx] : { name: '', desc: '', prompt: '' };
  const isEdit = editIdx !== null;

  const modal = document.createElement('div');
  modal.className = 'prompt-modal-overlay';
  modal.innerHTML = `
    <div class="prompt-modal pm-form">
      <div class="pm-hd">
        <h3>${isEdit ? '编辑 Skill' : '新建 Skill'}</h3>
        <button class="pm-close" id="sk-form-close">×</button>
      </div>
      <div class="pm-body">
        <div class="form-row">
          <label>名称 *</label>
          <input type="text" id="sk-f-name" value="${escapeHtml(s.name)}" placeholder="例如：内容总结专家">
        </div>
        <div class="form-row">
          <label>描述（一句话说明用途）</label>
          <input type="text" id="sk-f-desc" value="${escapeHtml(s.desc || '')}" placeholder="例如：快速总结长文核心要点">
        </div>
        <div class="form-row">
          <label>提示词模板 *</label>
          <textarea id="sk-f-prompt" rows="10" placeholder="完整的提示词模板，用 {{变量名}} 定义变量&#10;&#10;例如：&#10;你是一位资深编辑，请总结以下内容：&#10;{{内容}}&#10;输出 3 个要点。">${escapeHtml(s.prompt || '')}</textarea>
          <div style="font-size:11px;color:var(--dim);margin-top:6px">用 <code style="background:var(--surface-3);padding:1px 5px;border-radius:3px">{{变量名}}</code> 定义变量，使用时会自动弹出填充框</div>
        </div>
      </div>
      <div class="pm-footer">
        <button class="btn" id="sk-form-cancel">取消</button>
        <button class="btn brand" id="sk-form-save">${isEdit ? '保存' : '创建'}</button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  const close = () => modal.remove();
  modal.querySelector('#sk-form-close').addEventListener('click', close);
  modal.querySelector('#sk-form-cancel').addEventListener('click', close);
  modal.addEventListener('click', e => { if (e.target === modal) close(); });

  modal.querySelector('#sk-form-save').addEventListener('click', async () => {
    const name = modal.querySelector('#sk-f-name').value.trim();
    const prompt = modal.querySelector('#sk-f-prompt').value.trim();
    if (!name) { toast('请输入名称', 'err'); return; }
    if (!prompt) { toast('请输入提示词模板', 'err'); return; }

    const desc = modal.querySelector('#sk-f-desc').value.trim();
    // 从提示词模板自动提取变量
    const varMatches = prompt.match(/\{\{\s*([^}\s]+)\s*\}\}/g) || [];
    const variables = [...new Set(varMatches.map(m => m.replace(/[{}]/g, '').trim()))];

    const data = {
      name, desc, prompt, variables,
      category: s.category || '通用',
      icon: s.icon || 'puzzle',
      tags: s.tags || []
    };
    if (isEdit) {
      skills[editIdx] = { ...skills[editIdx], ...data };
    } else {
      skills.push(data);
    }

    try {
      await setData('skills', skills);
      toast(isEdit ? '已保存' : '已创建', 'ok');
      close();
      const evt = new HashChangeEvent('hashchange');
      window.dispatchEvent(evt);
    } catch {
      toast('保存失败', 'err');
    }
  });

  const escHandler = (e) => { if (e.key === 'Escape') { close(); document.removeEventListener('keydown', escHandler); } };
  document.addEventListener('keydown', escHandler);
}

// 删除
async function deleteSkill(idx) {
  const s = skills[idx];
  if (!confirm(`确定删除「${s.name}」？`)) return;
  skills.splice(idx, 1);
  try {
    await setData('skills', skills);
    toast('已删除', 'ok');
    const evt = new HashChangeEvent('hashchange');
    window.dispatchEvent(evt);
  } catch {
    toast('删除失败', 'err');
  }
}

function getDefaultSkills() {
  return [
    { name: '内容总结专家', icon: 'file', category: '内容创作', desc: '快速总结长文/视频脚本的核心要点，输出精炼摘要。', tags: ['总结', '摘要', '内容'], variables: ['内容'], prompt: '你是一位资深内容编辑，擅长提炼核心观点。\n\n请对以下内容进行总结，提炼出最核心的要点：\n\n---\n{{内容}}\n---\n\n输出要求：\n- 格式：分点列出，3-5 个要点\n- 语言：中文，简洁有力\n- 每个要点不超过 30 字\n\n请直接输出要点，不要多余解释。' }
  ];
}
