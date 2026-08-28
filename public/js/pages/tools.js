// ═══════════════════════════════════════════════════════════
// 页面：效率工具
// 工具集合 — 从 data/tools.json 加载，通用框架
// ═══════════════════════════════════════════════════════════

import { getData } from '../api.js';
import { escapeHtml } from '../main.js';

export async function renderTools(container) {
  container.innerHTML = `
    <div class="ph-h"><span class="n">🧰</span>效率工具</div>
    <div class="ph-sub">自研工具 / 插件 / 脚本资产</div>
    <div class="grid" id="tools-grid"><div class="empty">加载中…</div></div>
  `;

  let tools = [];
  try {
    tools = await getData('tools');
  } catch {
    tools = getDefaultTools();
  }

  const grid = container.querySelector('#tools-grid');
  if (tools.length === 0) {
    grid.innerHTML = '<div class="empty"><div class="ico">🧰</div>还没有工具，在 data/tools.json 中添加</div>';
    return;
  }

  grid.innerHTML = tools.map(t => `
    <div class="card">
      <h4>${escapeHtml(t.icon || '🔧')} ${escapeHtml(t.name)} ${t.status ? `<span class="tag ${t.status === '已上线' ? 'g' : t.status === '开发中' ? 'y' : 'b'}">${escapeHtml(t.status)}</span>` : ''}</h4>
      <p>${escapeHtml(t.desc || '')}</p>
      ${t.features ? `
        <div style="margin-top:8px">
          ${t.features.map(f => `<div class="lrow" style="font-size:11.5px"><span class="st do">✓</span><span>${escapeHtml(f)}</span></div>`).join('')}
        </div>
      ` : ''}
      ${t.link ? `<div class="ph">🔗 <a href="${escapeHtml(t.link)}" target="_blank" style="color:var(--brand)">${escapeHtml(t.link)}</a></div>` : ''}
      ${t.path ? `<div class="ph">📁 ${escapeHtml(t.path)}</div>` : ''}
    </div>
  `).join('');
}

function getDefaultTools() {
  return [
    {
      icon: '⚡',
      name: '倍速播放插件',
      status: '已上线',
      desc: '视频 16 倍速播放，超站点原生上限。页面浮层交互，快捷键控制，按域名记忆倍速。',
      features: ['高速自动静音', '字幕增强', '快捷键 ] / v'],
      path: 'plugins/netcourse-speeder/'
    },
    {
      icon: '📝',
      name: '文案提取工具',
      status: '规划中',
      desc: '从视频/音频中提取口播文案，浏览器插件架构，本地隐私处理。',
      features: ['语音转文字', '字幕提取', '本地处理不上传']
    },
    {
      icon: '🧹',
      name: '去水印工具',
      status: '规划中',
      desc: '视频/图片去水印，复用倍速插件的页面浮层 + 本地隐私架构。'
    },
    {
      icon: '🤖',
      name: '自研 Skill / Agent 资产',
      status: '进行中',
      desc: '已沉淀可复用 Skill 资产，按场景归档，逐步 registry 化。',
      features: ['会议纪要转写', '小说转分镜', '公众号抓取', '小红书爆款生成']
    }
  ];
}
