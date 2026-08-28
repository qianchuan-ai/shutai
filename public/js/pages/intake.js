// ═══════════════════════════════════════════════════════════
// 页面：资讯吸收
// 统一管理：链接收集 + AI 输出沉淀
// ═══════════════════════════════════════════════════════════

import { subscribe, getIntake, addIntakeLinks, markIntakeImported, deleteIntake, getPendingIntakeCount, getIdeas, deleteIdea } from '../store.js';
import { escapeHtml, toast } from '../main.js';
import { openPromptModal } from '../prompt-builder.js';

let currentFilter = 'all';
let currentSearch = '';

export function renderIntake(container) {
  container.innerHTML = `
    <div class="ph-h"><span class="n">📥</span>资讯吸收</div>
    <div class="ph-sub">收集链接 + 沉淀 AI 输出，统一管理，可再次利用</div>

    <!-- 工具栏 -->
    <div class="intake-toolbar">
      <div class="intake-filters">
        <button class="intake-filter active" data-filter="all">全部</button>
        <button class="intake-filter" data-filter="link">🔗 链接</button>
        <button class="intake-filter" data-filter="output">✨ AI 输出</button>
        <button class="intake-filter" data-filter="idea">💡 灵感</button>
      </div>
      <input type="text" class="intake-search" id="intake-search" placeholder="搜索标题、内容、链接…">
    </div>

    <!-- 链接输入区 -->
    <div class="intake-link-input">
      <details>
        <summary>📎 添加链接（点击展开）</summary>
        <div class="intake-link-form">
          <textarea id="intake-input" placeholder="把看中的资讯链接粘贴到这里，每行一个，可一次贴多个…" rows="2"></textarea>
          <div class="intake-acts">
            <button class="btn brand sm" id="intake-submit">提交链接</button>
            <button class="btn sm" id="intake-copyall">复制全部待导入</button>
            <span class="intake-count" id="intake-count"></span>
          </div>
        </div>
      </details>
    </div>

    <!-- 内容列表 -->
    <div class="intake-list" id="intake-list"></div>
  `;

  const input = container.querySelector('#intake-input');
  const submit = container.querySelector('#intake-submit');
  const copyAll = container.querySelector('#intake-copyall');
  const searchInput = container.querySelector('#intake-search');

  submit.addEventListener('click', async () => {
    const text = input.value.trim();
    if (!text) return;
    const count = await addIntakeLinks(text);
    input.value = '';
    toast(`已添加 ${count} 条链接`, 'ok');
    renderList();
  });

  copyAll.addEventListener('click', async () => {
    const pending = getIntake().filter(i => i.type !== 'output' && i.status === 'pending');
    if (pending.length === 0) { toast('没有待导入的链接'); return; }
    const text = pending.map(i => i.url).join('\n');
    try {
      await navigator.clipboard.writeText(text);
      toast(`已复制 ${pending.length} 条链接`, 'ok');
    } catch {
      toast('复制失败，请手动选择', 'err');
    }
  });

  // 分类筛选
  container.querySelectorAll('.intake-filter').forEach(btn => {
    btn.addEventListener('click', () => {
      container.querySelectorAll('.intake-filter').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentFilter = btn.dataset.filter;
      renderList();
    });
  });

  // 搜索
  searchInput.addEventListener('input', () => {
    currentSearch = searchInput.value.trim().toLowerCase();
    renderList();
  });

  function renderList() {
    const items = getIntake();
    const pending = items.filter(i => i.type !== 'output' && i.status === 'pending');
    container.querySelector('#intake-count').textContent =
      `共 ${items.length} 条 · 待导入 ${pending.length} 条`;

    const list = container.querySelector('#intake-list');
    const ideas = getIdeas();

    // 合并所有数据，统一格式
    let allItems = [];
    items.forEach(i => {
      if (i.type === 'output') {
        allItems.push({ ...i, _type: 'output' });
      } else {
        allItems.push({ ...i, _type: 'link' });
      }
    });
    ideas.forEach(idea => {
      allItems.push({ ...idea, _type: 'idea', id: 'idea-' + idea.id });
    });

    // 按时间排序
    allItems.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    // 筛选
    let filtered = allItems;
    if (currentFilter === 'link') {
      filtered = allItems.filter(i => i._type === 'link');
    } else if (currentFilter === 'output') {
      filtered = allItems.filter(i => i._type === 'output');
    } else if (currentFilter === 'idea') {
      filtered = allItems.filter(i => i._type === 'idea');
    }

    // 搜索
    if (currentSearch) {
      filtered = filtered.filter(i => {
        if (i._type === 'output') {
          return (i.title || '').toLowerCase().includes(currentSearch) ||
                 (i.content || '').toLowerCase().includes(currentSearch) ||
                 (i.category || '').toLowerCase().includes(currentSearch);
        } else if (i._type === 'idea') {
          return (i.text || '').toLowerCase().includes(currentSearch);
        } else {
          return (i.url || '').toLowerCase().includes(currentSearch) ||
                 (i.domain || '').toLowerCase().includes(currentSearch);
        }
      });
    }

    if (filtered.length === 0) {
      if (allItems.length === 0) {
        list.innerHTML = `
          <div class="intake-empty">
            <div class="intake-empty-icon">📥</div>
            <div class="intake-empty-title">还没有内容</div>
            <div class="intake-empty-desc">添加链接，或在提示工坊点「保存输出」沉淀 AI 结果，或用右下角 FAB 随手记灵感</div>
          </div>
        `;
      } else {
        list.innerHTML = `
          <div class="intake-empty">
            <div class="intake-empty-icon">🔍</div>
            <div class="intake-empty-title">没有匹配的内容</div>
            <div class="intake-empty-desc">换个关键词或筛选条件试试</div>
          </div>
        `;
      }
      return;
    }

    list.innerHTML = filtered.map(item => {
      if (item._type === 'output') {
        return renderOutputItem(item);
      } else if (item._type === 'idea') {
        return renderIdeaItem(item);
      } else {
        return renderLinkItem(item);
      }
    }).join('');

    // 绑定事件
    list.querySelectorAll('[data-act]').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const idStr = btn.closest('[data-id]').dataset.id;
        const act = btn.dataset.act;

        // 灵感的事件
        if (idStr.startsWith('idea-')) {
          const ideaId = Number(idStr.replace('idea-', ''));
          if (act === 'del') {
            if (confirm('确定删除？')) {
              await deleteIdea(ideaId);
              toast('已删除', 'ok');
            }
          } else if (act === 'use-idea') {
            const idea = getIdeas().find(i => i.id === ideaId);
            if (idea) {
              openPromptModal(idea.text);
            }
          }
          renderList();
          return;
        }

        const id = Number(idStr);
        if (act === 'import') {
          await markIntakeImported(id);
          toast('已标记为已导入', 'ok');
        } else if (act === 'pending') {
          const item = getIntake().find(i => i.id === id);
          if (item) { item.status = 'pending'; }
          toast('已标记为待导入', 'ok');
        } else if (act === 'del') {
          if (confirm('确定删除？')) {
            await deleteIntake(id);
            toast('已删除', 'ok');
          }
        } else if (act === 'copy-output') {
          const item = getIntake().find(i => i.id === id);
          if (item) {
            try {
              await navigator.clipboard.writeText(item.content);
              toast('已复制内容', 'ok');
            } catch { toast('复制失败', 'err'); }
          }
        } else if (act === 'save-skill') {
          const item = getIntake().find(i => i.id === id);
          if (item && window.__openSaveSkillModal) {
            window.__openSaveSkillModal(item.content, item.title);
          }
        }
        renderList();
      });
    });

    // 展开/收起 AI 输出
    list.querySelectorAll('.intake-output-item').forEach(card => {
      card.addEventListener('click', () => {
        const content = card.querySelector('.intake-output-content');
        if (content) {
          content.classList.toggle('expanded');
        }
      });
    });
  }

  function renderIdeaItem(item) {
    return `
      <div class="intake-item intake-idea-item" data-id="idea-${item.id}">
        <div class="intake-idea-hd">
          <span class="intake-type-tag idea">💡 灵感</span>
          <span class="intake-idea-time">${formatDate(item.createdAt)}</span>
        </div>
        <div class="intake-idea-text">${escapeHtml(item.text || '')}</div>
        <div class="intake-item-acts">
          <button class="mini brand" data-act="use-idea">交给 AI</button>
          <button class="mini del" data-act="del">删</button>
        </div>
      </div>
    `;
  }

  function renderLinkItem(item) {
    return `
      <div class="intake-item intake-link-item" data-id="${item.id}">
        <div class="intake-link-main">
          <span class="intake-type-tag link">🔗 链接</span>
          <span class="st ${item.status === 'pending' ? 'pen' : 'do'}">${item.status === 'pending' ? '待导入' : '已导入'}</span>
          <a class="url" href="${escapeHtml(item.url)}" target="_blank" rel="noopener">${escapeHtml(item.url)}</a>
          <span class="dom">${escapeHtml(item.domain || '')}</span>
        </div>
        <div class="intake-item-acts">
          ${item.status === 'pending'
            ? '<button class="mini" data-act="import">已导入</button>'
            : '<button class="mini" data-act="pending">待导入</button>'}
          <button class="mini del" data-act="del">删</button>
        </div>
      </div>
    `;
  }

  function renderOutputItem(item) {
    const preview = (item.content || '').slice(0, 150);
    return `
      <div class="intake-item intake-output-item" data-id="${item.id}">
        <div class="intake-output-hd">
          <span class="intake-type-tag output">✨ AI 输出</span>
          <span class="intake-output-cat">${escapeHtml(item.category || '其他')}</span>
          <span class="intake-output-title">${escapeHtml(item.title || '未命名')}</span>
          <span class="intake-output-time">${formatDate(item.createdAt)}</span>
        </div>
        <div class="intake-output-content">
          <div class="intake-output-preview">${escapeHtml(preview)}${item.content.length > 150 ? '…' : ''}</div>
          ${item.content.length > 150 ? `<div class="intake-output-full">${escapeHtml(item.content)}</div>` : ''}
        </div>
        <div class="intake-item-acts">
          <button class="mini" data-act="copy-output">复制</button>
          <button class="mini brand" data-act="save-skill">存为 Skill</button>
          <button class="mini del" data-act="del">删</button>
        </div>
      </div>
    `;
  }

  function formatDate(iso) {
    if (!iso) return '';
    const d = new Date(iso);
    return d.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
  }

  renderList();

  // 订阅数据变化
  subscribe(() => renderList());
}
