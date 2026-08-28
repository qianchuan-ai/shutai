// ═══════════════════════════════════════════════════════════
// 页面：自媒体运营
// 通用框架 — 选题库 / 待发内容 / 内容排期 从 data/media.json 加载
// ═══════════════════════════════════════════════════════════

import { getData } from '../api.js';
import { escapeHtml } from '../main.js';

export async function renderMedia(container) {
  container.innerHTML = `
    <div class="ph-h"><span class="n">📣</span>自媒体运营</div>
    <div class="ph-sub">选题运营 · 内容排期 · 多平台管理</div>
    <div id="media-content"><div class="empty">加载中…</div></div>
  `;

  let data = {};
  try {
    data = await getData('media');
  } catch {
    data = getDefaultData();
  }

  const content = container.querySelector('#media-content');

  // 选题库
  const topics = data.topics || [];
  const drafts = data.drafts || [];
  const schedule = data.schedule || [];

  let html = '<div class="grid">';

  // 选题库
  html += `
    <div class="card">
      <h4>💡 选题库 ${topics.length ? `<span class="tag p">${topics.length} 条</span>` : ''}</h4>
      ${topics.length === 0 ? '<p style="padding:8px 0">暂无选题，在 data/media.json 的 topics 中添加</p>' :
        topics.map(t => `
          <div class="lrow">
            <span class="st ${t.status === '进行中' ? 'ing' : t.status === '已完成' ? 'do' : 'pen'}">${escapeHtml(t.status || '待写')}</span>
            <span style="flex:1">${escapeHtml(t.title)}</span>
          </div>
        `).join('')
      }
      ${data.topicNote ? `<p style="margin-top:8px">${escapeHtml(data.topicNote)}</p>` : ''}
    </div>
  `;

  // 待发内容
  html += `
    <div class="card">
      <h4>📝 待发内容 ${drafts.length ? `<span class="tag y">${drafts.length} 条</span>` : ''}</h4>
      ${drafts.length === 0 ? '<p style="padding:8px 0">暂无待发内容</p>' :
        drafts.map(d => `
          <div class="lrow">
            <span class="st ${d.status === '草稿' ? 'pen' : d.status === '已发' ? 'do' : 'ing'}">${escapeHtml(d.status || '草稿')}</span>
            <span style="flex:1">${escapeHtml(d.platform)} · ${escapeHtml(d.title)}</span>
          </div>
        `).join('')
      }
    </div>
  `;

  html += '</div>';

  // 内容排期
  if (schedule.length > 0) {
    html += `
      <div style="margin-top:20px">
        <div class="ph-h" style="font-size:15px"><span class="n" style="width:22px;height:22px;font-size:11px">📅</span>内容排期</div>
        <div class="grid">
    `;
    schedule.forEach(phase => {
      html += `
        <div class="card">
          <h4>${escapeHtml(phase.name)} ${phase.tag ? `<span class="tag ${phase.tagType || 'b'}">${escapeHtml(phase.tag)}</span>` : ''}</h4>
          ${phase.desc ? `<p>${escapeHtml(phase.desc)}</p>` : ''}
          ${phase.items ? phase.items.map(item => `
            <div class="lrow">
              <span class="st ${item.status === '已发' ? 'do' : item.status === '进行中' ? 'ing' : 'pen'}">${escapeHtml(item.status || '待发')}</span>
              <span style="flex:1">${escapeHtml(item.date || '')} ${escapeHtml(item.title)}</span>
            </div>
          `).join('') : ''}
        </div>
      `;
    });
    html += '</div></div>';
  }

  content.innerHTML = html;
}

function getDefaultData() {
  return {
    topics: [
      { title: 'AI 社会热点反共识二创（引流）', status: '进行中' },
      { title: 'Agent / WorkBuddy 实操 howto', status: '进行中' }
    ],
    topicNote: '主阵地：公众号 + 小红书。选题从资讯吸收和灵感速记中提炼。',
    drafts: [
      { platform: '小红书', title: 'Agent 实操笔记 ×1', status: '草稿' },
      { platform: '公众号', title: '枢台定位长文', status: '草稿' }
    ],
    schedule: [
      {
        name: '本周排期',
        tag: 'A/B 双线',
        desc: '隔日交替，对比涨粉力',
        items: [
          { date: '周一', title: '选题 A1 · 反共识科技案例', status: '待发' },
          { date: '周三', title: '选题 B1 · 泛财富逆袭叙事', status: '待发' },
          { date: '周五', title: '选题 A2 · 反共识科技案例', status: '待发' }
        ]
      }
    ]
  };
}
