// ═══════════════════════════════════════════════════════════
// 页面：知识沉淀
// 灵感 → 知识库池 → 方法论 → 个人知识库 流水线
// ═══════════════════════════════════════════════════════════

import { subscribe, getIdeas } from '../store.js';
import { escapeHtml, switchPage } from '../main.js';
import { t, getLang } from '../i18n.js';

export function renderKnowledge(container) {
  const lang = getLang();
  container.innerHTML = `
    <div class="ph-h"><span class="n">📚</span>${lang === 'zh' ? '知识沉淀' : 'Knowledge'}</div>
    <div class="ph-sub">${lang === 'zh' ? '你的知识流水线：灵感进池 → 讨论出方法论 → 同步知识库' : 'Your knowledge pipeline: Ideas → Pool → Methodology → Knowledge Base'}</div>

    <!-- 流水线图 -->
    <div class="card full" style="margin-bottom:16px">
      <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap;justify-content:center;padding:8px 0">
        <div style="text-align:center"><div style="font-size:24px">💡</div><div style="font-size:12px;color:var(--brand);font-weight:700;margin-top:4px">${lang === 'zh' ? '灵感进池' : 'Ideas'}</div></div>
        <div style="color:var(--dim);font-size:18px">→</div>
        <div style="text-align:center"><div style="font-size:24px">🗂️</div><div style="font-size:12px;color:var(--brand);font-weight:700;margin-top:4px">${lang === 'zh' ? '知识库池' : 'Pool'}</div></div>
        <div style="color:var(--dim);font-size:18px">→</div>
        <div style="text-align:center"><div style="font-size:24px">🧠</div><div style="font-size:12px;color:var(--brand);font-weight:700;margin-top:4px">${lang === 'zh' ? '方法论' : 'Methodology'}</div></div>
        <div style="color:var(--dim);font-size:18px">→</div>
        <div style="text-align:center"><div style="font-size:24px">📚</div><div style="font-size:12px;color:var(--brand);font-weight:700;margin-top:4px">${lang === 'zh' ? '知识库' : 'Knowledge Base'}</div></div>
      </div>
    </div>

    <div class="grid">
      <!-- 入口：灵感速记 -->
      <div class="card clickable" id="go-ideas">
        <h4>① 入口 · 灵感速记</h4>
        <p>随手记灵感，自动落盘。一键「交给AI吸收」送入知识库池待研究。</p>
        <div class="ph">右下角 💡 随时呼出 · 已记录 <span id="k-idea-count">0</span> 条</div>
      </div>

      <!-- 知识库池 -->
      <div class="card">
        <h4>② 知识库池 · 待研究</h4>
        <p>灵感在知识池里跟 AI 讨论定型后，形成方法论或深度思考，升入方法论全景。</p>
        <div id="k-pool-list"></div>
      </div>

      <!-- 方法论 -->
      <div class="card clickable" id="go-methodology">
        <h4>③ 方法论 / 深度思考</h4>
        <p>灵感讨论定型后，形成可复用的方法论资产。</p>
        <div class="ph">前往方法论全景 →</div>
      </div>

      <!-- 知识库 -->
      <div class="card">
        <h4>④ 终点 · 个人知识库</h4>
        <p>方法论定型后同步进个人知识库，反哺枢台越来越懂你。</p>
        <div class="ph">可对接 IMA / Notion / Obsidian 等</div>
      </div>
    </div>
  `;

  // 跳转
  container.querySelector('#go-ideas').addEventListener('click', () => {
    document.getElementById('fab').click();
  });
  container.querySelector('#go-methodology').addEventListener('click', () => switchPage('methodology'));

  function render() {
    const ideas = getIdeas();
    container.querySelector('#k-idea-count').textContent = ideas.length;

    // 显示未吸收的灵感作为知识库池待研究
    const pending = ideas.filter(i => !i.absorbed);
    const poolList = container.querySelector('#k-pool-list');
    if (pending.length === 0) {
      poolList.innerHTML = '<div class="empty" style="padding:12px">暂无待研究项</div>';
    } else {
      poolList.innerHTML = pending.slice(0, 5).map(i => `
        <div class="lrow">
          <span class="st pen">待研究</span>
          <span style="flex:1;font-size:12px">${escapeHtml(i.text.slice(0, 50))}${i.text.length > 50 ? '…' : ''}</span>
        </div>
      `).join('');
      if (pending.length > 5) {
        poolList.innerHTML += `<div class="ph" style="margin-top:6px">还有 ${pending.length - 5} 条…</div>`;
      }
    }
  }

  render();
  subscribe(render);
}
