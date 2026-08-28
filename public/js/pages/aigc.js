// ═══════════════════════════════════════════════════════════
// 页面：AIGC 创作
// 通用项目进度管理 — 项目卡片从 data/aigc-projects.json 加载
// ═══════════════════════════════════════════════════════════

import { getData } from '../api.js';
import { escapeHtml } from '../main.js';

export async function renderAIGC(container) {
  container.innerHTML = `
    <div class="ph-h"><span class="n">🎬</span>AIGC 创作</div>
    <div class="ph-sub">项目管理 · 进度追踪 · 提示词资产</div>
    <div class="grid" id="aigc-grid">
      <div class="empty">加载中…</div>
    </div>
  `;

  let projects = [];
  try {
    projects = await getData('aigc-projects');
  } catch {
    projects = getDefaultProjects();
  }

  const grid = container.querySelector('#aigc-grid');
  if (projects.length === 0) {
    grid.innerHTML = '<div class="empty"><div class="ico">🎬</div>还没有 AIGC 项目，在 data/aigc-projects.json 中添加</div>';
    return;
  }

  grid.innerHTML = projects.map(p => `
    <div class="card clickable">
      <h4>${escapeHtml(p.icon || '🎬')} ${escapeHtml(p.name)} ${p.status ? `<span class="tag ${p.status === '进行中' ? 'y' : p.status === '已完成' ? 'g' : 'b'}">${escapeHtml(p.status)}</span>` : ''}</h4>
      <p>${escapeHtml(p.desc || '')}</p>
      ${p.progress != null ? `
        <div class="bar"><i style="width:${p.progress}%"></i></div>
        <div class="bar-lbl">进度 ${p.progress}% · ${escapeHtml(p.phase || '')}</div>
      ` : ''}
      ${p.tags ? `<div class="meth-tags" style="margin-top:10px">${p.tags.map(t => `<span class="meth-tag">${escapeHtml(t)}</span>`).join('')}</div>` : ''}
      ${p.link ? `<div class="ph">🔗 ${escapeHtml(p.link)}</div>` : ''}
    </div>
  `).join('');
}

function getDefaultProjects() {
  return [
    { icon: '🎬', name: 'AI 漫剧', status: '进行中', progress: 35, phase: '分镜草稿', desc: '小说转分镜 → AI 生图 → 合成漫剧。', tags: ['漫剧', '分镜', '生图'] },
    { icon: '🎵', name: 'AIMV', status: '规划中', progress: 10, phase: '调研阶段', desc: 'AI 音乐视频：文生视频 + 节拍对齐。', tags: ['MV', '视频'] },
    { icon: '🗣️', name: '数字人口播', status: '进行中', progress: 20, phase: '模板沉淀', desc: '数字人自动口播，模板化生产。', tags: ['数字人', '口播'] },
    { icon: '📖', name: '条漫', status: '规划中', progress: 15, phase: '试拆一话', desc: '小说/网文 → 分镜面板，复用分镜能力。', tags: ['条漫', '分镜'] }
  ];
}
