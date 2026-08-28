// ═══════════════════════════════════════════════════════════
// 页面：资讯吸收
// 统一管理：链接收集 + AI 输出沉淀
// ═══════════════════════════════════════════════════════════

import { subscribe, getIntake, addIntakeLinks, markIntakeImported, deleteIntake, getPendingIntakeCount, getIdeas, deleteIdea } from '../store.js';
import { escapeHtml, toast } from '../main.js';
import { openPromptModal } from '../prompt-builder.js';
import { t, getLang } from '../i18n.js';

let currentFilter = 'all';
let currentSearch = '';

export function renderIntake(container) {
  const lang = getLang();
  container.innerHTML = `
    <div class="ph-h"><span class="n">📥</span>${t('inbox.title')}</div>
    <div class="ph-sub">${t('inbox.subtitle')}</div>

    <!-- 工具栏 -->
    <div class="intake-toolbar">
      <div class="intake-filters">
        <button class="intake-filter active" data-filter="all">${t('inbox.all')}</button>
        <button class="intake-filter" data-filter="link">🔗 ${t('inbox.links')}</button>
        <button class="intake-filter" data-filter="output">✨ ${t('inbox.aiOutput')}</button>
        <button class="intake-filter" data-filter="idea">💡 ${t('inbox.inspiration')}</button>
      </div>
      <input type="text" class="intake-search" id="intake-search" placeholder="${t('inbox.searchPlaceholder')}">
    </div>

    <!-- 链接输入区 -->
    <div class="intake-link-input">
      <details>
        <summary>📎 ${t('inbox.addLink')}</summary>
        <div class="intake-link-form">
          <textarea id="intake-input" placeholder="${lang === 'zh' ? '把看中的资讯链接粘贴到这里，每行一个，可一次贴多个…' : 'Paste article links here, one per line…'}" rows="2"></textarea>
          <div class="intake-acts">
            <button class="btn brand sm" id="intake-submit">${lang === 'zh' ? '提交链接' : 'Submit'}</button>
            <button class="btn sm" id="intake-copyall">${lang === 'zh' ? '复制全部待导入' : 'Copy All Pending'}</button>
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
    toast(lang === 'zh' ? `已添加 ${count} 条链接` : `Added ${count} links`, 'ok');
    renderList();
  });

  copyAll.addEventListener('click', async () => {
    const pending = getIntake().filter(i => i.type !== 'output' && i.status === 'pending');
    if (pending.length === 0) { toast(lang === 'zh' ? '没有待导入的链接' : 'No pending links'); return; }
    const text = pending.map(i => i.url).join('\n');
    try {
      await navigator.clipboard.writeText(text);
      toast(lang === 'zh' ? `已复制 ${pending.length} 条链接` : `Copied ${pending.length} links`, 'ok');
    } catch {
      toast(lang === 'zh' ? '复制失败，请手动选择' : 'Copy failed, please select manually', 'err');
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
      lang === 'zh' ? `共 ${items.length} 条 · 待导入 ${pending.length} 条` : `Total ${items.length} · Pending ${pending.length}`;

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
            <div class="intake-empty-title">${t('inbox.empty')}</div>
            <div class="intake-empty-desc">${t('inbox.emptyDesc')}</div>
          </div>
        `;
      } else {
        list.innerHTML = `
          <div class="intake-empty">
            <div class="intake-empty-icon">🔍</div>
            <div class="intake-empty-title">${lang === 'zh' ? '没有匹配的内容' : 'No matching content'}</div>
            <div class="intake-empty-desc">${lang === 'zh' ? '换个关键词或筛选条件试试' : 'Try different keywords or filters'}</div>
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
            if (confirm(lang === 'zh' ? '确定删除？' : 'Delete?')) {
              await deleteIdea(ideaId);
              toast(t('toast.deleted'), 'ok');
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
          toast(lang === 'zh' ? '已标记为已导入' : 'Marked as imported', 'ok');
        } else if (act === 'pending') {
          const item = getIntake().find(i => i.id === id);
          if (item) { item.status = 'pending'; }
          toast(lang === 'zh' ? '已标记为待导入' : 'Marked as pending', 'ok');
        } else if (act === 'del') {
          if (confirm(lang === 'zh' ? '确定删除？' : 'Delete?')) {
            await deleteIntake(id);
            toast(t('toast.deleted'), 'ok');
          }
        } else if (act === 'copy-output') {
          const item = getIntake().find(i => i.id === id);
          if (item) {
            try {
              await navigator.clipboard.writeText(item.content);
              toast(t('toast.copied'), 'ok');
            } catch { toast(lang === 'zh' ? '复制失败' : 'Copy failed', 'err'); }
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
          <span class="intake-type-tag idea">💡 ${t('inbox.inspiration')}</span>
          <span class="intake-idea-time">${formatDate(item.createdAt)}</span>
        </div>
        <div class="intake-idea-text">${escapeHtml(item.text || '')}</div>
        <div class="intake-item-acts">
          <button class="mini brand" data-act="use-idea">${lang === 'zh' ? '交给 AI' : 'Send to AI'}</button>
          <button class="mini del" data-act="del">${lang === 'zh' ? '删' : '×'}</button>
        </div>
      </div>
    `;
  }

  function renderLinkItem(item) {
    return `
      <div class="intake-item intake-link-item" data-id="${item.id}">
        <div class="intake-link-main">
          <span class="intake-type-tag link">🔗 ${t('inbox.links')}</span>
          <span class="st ${item.status === 'pending' ? 'pen' : 'do'}">${item.status === 'pending' ? (lang === 'zh' ? '待导入' : 'Pending') : (lang === 'zh' ? '已导入' : 'Imported')}</span>
          <a class="url" href="${escapeHtml(item.url)}" target="_blank" rel="noopener">${escapeHtml(item.url)}</a>
          <span class="dom">${escapeHtml(item.domain || '')}</span>
        </div>
        <div class="intake-item-acts">
          ${item.status === 'pending'
            ? `<button class="mini" data-act="import">${lang === 'zh' ? '已导入' : 'Imported'}</button>`
            : `<button class="mini" data-act="pending">${lang === 'zh' ? '待导入' : 'Pending'}</button>`}
          <button class="mini del" data-act="del">${lang === 'zh' ? '删' : '×'}</button>
        </div>
      </div>
    `;
  }

  function renderOutputItem(item) {
    const preview = (item.content || '').slice(0, 150);
    return `
      <div class="intake-item intake-output-item" data-id="${item.id}">
        <div class="intake-output-hd">
          <span class="intake-type-tag output">✨ ${t('inbox.aiOutput')}</span>
          <span class="intake-output-cat">${escapeHtml(item.category || (lang === 'zh' ? '其他' : 'Other'))}</span>
          <span class="intake-output-title">${escapeHtml(item.title || (lang === 'zh' ? '未命名' : 'Untitled'))}</span>
          <span class="intake-output-time">${formatDate(item.createdAt)}</span>
        </div>
        <div class="intake-output-content">
          <div class="intake-output-preview">${escapeHtml(preview)}${item.content.length > 150 ? '…' : ''}</div>
          ${item.content.length > 150 ? `<div class="intake-output-full">${escapeHtml(item.content)}</div>` : ''}
        </div>
        <div class="intake-item-acts">
          <button class="mini" data-act="copy-output">${t('common.copy')}</button>
          <button class="mini brand" data-act="save-skill">${lang === 'zh' ? '存为 Skill' : 'Save as Skill'}</button>
          <button class="mini del" data-act="del">${lang === 'zh' ? '删' : '×'}</button>
        </div>
      </div>
    `;
  }

  function formatDate(iso) {
    if (!iso) return '';
    const d = new Date(iso);
    return d.toLocaleDateString(lang === 'zh' ? 'zh-CN' : 'en-US', { month: 'short', day: 'numeric' });
  }

  renderList();

  // 订阅数据变化
  subscribe(() => renderList());
}
