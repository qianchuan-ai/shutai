// ═══════════════════════════════════════════════════════════
// 页面：灵感捕捉（Capture）
// 快速捕捉 + 豆包对话导入 + 一键发送到豆包
// ═══════════════════════════════════════════════════════════

import { subscribe, getIdeas, addIdea, deleteIdea, markIdeaAbsorbed } from '../store.js';
import { toast, escapeHtml } from '../main.js';
import { ICONS } from '../icons.js';
import { openPromptModal } from '../prompt-builder.js';
import { extractFromAIChat } from '../ai-integration.js';
import { t, getLang } from '../i18n.js';

export function renderCapture(container) {
  const lang = getLang();
  container.innerHTML = `
    <div class="ph-h"><span class="n">${ICONS.zap}</span>${lang === 'zh' ? '灵感捕捉' : 'Capture'}</div>
    <div class="ph-sub">${lang === 'zh' ? '快速捕捉灵感 · 导入 AI 对话 · 一键发送到 AI 继续创作' : 'Quick capture · Import AI chat · Send to AI for creation'}</div>

    <!-- 快速捕捉 -->
    <div class="card full" style="margin-bottom:16px">
      <h4 style="margin-bottom:12px">${ICONS.edit} ${lang === 'zh' ? '快速捕捉' : 'Quick Capture'}</h4>
      <div style="display:flex;gap:10px;flex-wrap:wrap">
        <textarea id="capture-input" placeholder="${lang === 'zh' ? '随手记一个灵感，或粘贴 AI 对话内容…' : 'Jot down an idea, or paste AI chat content…'}" style="flex:1;min-height:60px;resize:vertical"></textarea>
      </div>
      <div style="display:flex;gap:8px;margin-top:10px;flex-wrap:wrap;align-items:center">
        <button class="btn brand" id="capture-save" style="margin-top:0">${ICONS.save} ${lang === 'zh' ? '保存灵感' : 'Save Idea'}</button>
        <button class="btn" id="capture-parse" style="margin-top:0">${ICONS.sparkles} ${lang === 'zh' ? '解析 AI 对话' : 'Parse AI Chat'}</button>
        <button class="btn brand" id="capture-send" style="margin-top:0">${ICONS.sparkles} ${t('hub.promptWorkshop')}</button>
        <span class="capture-count" id="capture-count" style="margin-left:auto;font-size:12px;color:var(--dim)">${lang === 'zh' ? '共 0 条' : 'Total 0'}</span>
      </div>
    </div>

    <!-- 筛选 -->
    <div style="display:flex;gap:8px;margin-bottom:12px;flex-wrap:wrap;align-items:center">
      <div class="capture-filters" id="capture-filters">
        <button class="cfilter on" data-filter="all">${t('common.all')}</button>
        <button class="cfilter" data-filter="pending">${lang === 'zh' ? '待吸收' : 'Pending'}</button>
        <button class="cfilter" data-filter="absorbed">${lang === 'zh' ? '已吸收' : 'Absorbed'}</button>
      </div>
      <input id="capture-search" placeholder="${lang === 'zh' ? '搜索灵感…' : 'Search ideas…'}" style="width:200px;margin-left:auto">
    </div>

    <!-- 灵感列表 -->
    <div class="capture-list" id="capture-list"></div>
  `;

  let currentFilter = 'all';
  let searchQuery = '';

  // 保存灵感
  container.querySelector('#capture-save').addEventListener('click', async () => {
    const input = container.querySelector('#capture-input');
    const text = input.value.trim();
    if (!text) { toast('请输入内容', 'err'); return; }
    await addIdea(text);
    input.value = '';
    toast('灵感已保存', 'ok');
  });

  // 解析 AI 对话
  container.querySelector('#capture-parse').addEventListener('click', () => {
    const input = container.querySelector('#capture-input');
    const text = input.value.trim();
    if (!text) { toast('请先粘贴 AI 对话内容', 'err'); return; }
    const parsed = extractFromAIChat(text);
    if (parsed.length === 0) {
      toast('未识别到可提取的内容，已作为单条灵感保存', 'ok');
      addIdea(text);
      input.value = '';
      return;
    }
    parsed.forEach(async (p, i) => {
      await addIdea(`[${p.type}] ${p.content}`);
      if (i === parsed.length - 1) {
        toast(`已提取 ${parsed.length} 条内容`, 'ok');
        input.value = '';
      }
    });
  });

  // 复制为提示词
  container.querySelector('#capture-send').addEventListener('click', () => {
    const input = container.querySelector('#capture-input');
    const text = input.value.trim();
    if (!text) { toast('请输入内容', 'err'); return; }
    openPromptModal(text);
  });

  // 筛选
  container.querySelectorAll('.cfilter').forEach(btn => {
    btn.addEventListener('click', () => {
      container.querySelectorAll('.cfilter').forEach(b => b.classList.remove('on'));
      btn.classList.add('on');
      currentFilter = btn.dataset.filter;
      render();
    });
  });

  // 搜索
  container.querySelector('#capture-search').addEventListener('input', (e) => {
    searchQuery = e.target.value.toLowerCase();
    render();
  });

  function render() {
    const ideas = getIdeas();
    let filtered = ideas;
    if (currentFilter === 'pending') filtered = ideas.filter(i => !i.absorbed);
    if (currentFilter === 'absorbed') filtered = ideas.filter(i => i.absorbed);
    if (searchQuery) filtered = filtered.filter(i => i.text.toLowerCase().includes(searchQuery));

    container.querySelector('#capture-count').textContent = `共 ${ideas.length} 条`;

    const list = container.querySelector('#capture-list');
    if (filtered.length === 0) {
      list.innerHTML = '<div class="empty" style="padding:32px">还没有灵感，随手记一条吧</div>';
      return;
    }

    list.innerHTML = filtered.map(i => {
      const date = i.createdAt ? new Date(i.createdAt).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }) : '';
      return `
        <div class="capture-item ${i.absorbed ? 'absorbed' : ''}" data-id="${i.id}">
          <div class="capture-item-hd">
            <span class="capture-tag ${i.absorbed ? 'ok' : 'pen'}">${i.absorbed ? '已吸收' : '待吸收'}</span>
            <span class="capture-date">${date}</span>
          </div>
          <div class="capture-text">${escapeHtml(i.text)}</div>
          <div class="capture-acts">
            <button class="mini" data-act="send">${ICONS.sparkles} 复制提示词</button>
            <button class="mini" data-act="absorb">${i.absorbed ? '取消吸收' : '标记吸收'}</button>
            <button class="mini del" data-act="del">删除</button>
          </div>
        </div>
      `;
    }).join('');

    // 绑定操作
    list.querySelectorAll('.capture-item').forEach(item => {
      const id = Number(item.dataset.id);
      item.querySelector('[data-act="send"]').addEventListener('click', () => {
        const idea = getIdeas().find(i => i.id === id);
        if (idea) openPromptModal(idea.text);
      });
      item.querySelector('[data-act="absorb"]').addEventListener('click', async () => {
        const idea = getIdeas().find(i => i.id === id);
        if (idea) {
          if (idea.absorbed) {
            idea.absorbed = false;
            await markIdeaAbsorbed(id);
            toast('已取消吸收', 'ok');
          } else {
            await markIdeaAbsorbed(id);
            toast('已标记吸收', 'ok');
          }
        }
      });
      item.querySelector('[data-act="del"]').addEventListener('click', async () => {
        await deleteIdea(id);
        toast('已删除', 'ok');
      });
    });
  }

  render();
  subscribe(render);
}
