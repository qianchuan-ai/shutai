// ═══════════════════════════════════════════════════════════
// 页面：数据仪表盘
// 统计卡片 + 纯 SVG 图表（零依赖）+ 趋势分析
// ═══════════════════════════════════════════════════════════

import { subscribe, getTodos, getIdeas, getIntake, getHabits, getHabitStreak, getHabitTotal, getTodayStr } from '../store.js';
import { ICONS } from '../icons.js';

export function renderDashboard(container) {
  container.innerHTML = `
    <div class="ph-h"><span class="n">${ICONS.grid}</span>数据仪表盘</div>
    <div class="ph-sub">你的工作台数据全景 · 纯 SVG 可视化，零外部依赖</div>

    <!-- 核心指标卡片 -->
    <div class="dash-stats" id="dash-stats"></div>

    <!-- 图表区域 -->
    <div class="dash-grid">
      <!-- 待办完成率环形图 -->
      <div class="card">
        <h4>${ICONS['check-circle']} 待办完成率</h4>
        <div class="dash-chart" id="todo-ring"></div>
      </div>
      <!-- 最近7天打卡柱状图 -->
      <div class="card">
        <h4>${ICONS.zap} 最近 7 天打卡</h4>
        <div class="dash-chart" id="checkin-bar"></div>
      </div>
      <!-- 灵感趋势折线图 -->
      <div class="card">
        <h4>${ICONS.lightbulb} 灵感积累趋势</h4>
        <div class="dash-chart" id="idea-line"></div>
      </div>
      <!-- 习惯完成率条形图 -->
      <div class="card">
        <h4>${ICONS.target} 习惯完成率（近7天）</h4>
        <div class="dash-chart" id="habit-bar"></div>
      </div>
    </div>

    <!-- 数据明细 -->
    <div class="card full" style="margin-top:16px">
      <h4>${ICONS.database} 数据明细</h4>
      <div class="dash-detail" id="dash-detail"></div>
    </div>
  `;

  function render() {
    const todos = getTodos();
    const ideas = getIdeas();
    const intake = getIntake();
    const habits = getHabits();
    const today = getTodayStr();

    const doneTodos = todos.filter(t => t.done).length;
    const todoRate = todos.length > 0 ? Math.round(doneTodos / todos.length * 100) : 0;
    const pendingIntake = intake.filter(i => i.status === 'pending').length;
    const totalChecks = habits.reduce((sum, h) => sum + getHabitTotal(h), 0);
    const doneToday = habits.filter(h => h.records[today]).length;

    // 统计卡片
    container.querySelector('#dash-stats').innerHTML = `
      <div class="hs"><div class="n">${todos.length}</div><div class="l">总待办</div><div class="sub">${doneTodos} 已完成</div></div>
      <div class="hs"><div class="n">${ideas.length}</div><div class="l">灵感总数</div><div class="sub">${ideas.filter(i=>i.absorbed).length} 已吸收</div></div>
      <div class="hs"><div class="n">${intake.length}</div><div class="l">资讯链接</div><div class="sub">${pendingIntake} 待吸收</div></div>
      <div class="hs"><div class="n">${habits.length}</div><div class="l">习惯数</div><div class="sub">${doneToday} 今日已打卡</div></div>
      <div class="hs"><div class="n">${totalChecks}</div><div class="l">累计打卡</div></div>
      <div class="hs"><div class="n">${todoRate}%</div><div class="l">待办完成率</div></div>
    `;

    // 待办环形图
    container.querySelector('#todo-ring').innerHTML = renderRingChart(todoRate, doneTodos, todos.length);

    // 7天打卡柱状图
    container.querySelector('#checkin-bar').innerHTML = renderCheckinBar(habits);

    // 灵感趋势折线图
    container.querySelector('#idea-line').innerHTML = renderIdeaLine(ideas);

    // 习惯完成率条形图
    container.querySelector('#habit-bar').innerHTML = renderHabitBar(habits);

    // 数据明细
    container.querySelector('#dash-detail').innerHTML = `
      <div class="detail-row"><span>待办完成率</span><span class="detail-val">${doneTodos}/${todos.length} (${todoRate}%)</span></div>
      <div class="detail-row"><span>灵感吸收率</span><span class="detail-val">${ideas.filter(i=>i.absorbed).length}/${ideas.length} (${ideas.length>0?Math.round(ideas.filter(i=>i.absorbed).length/ideas.length*100):0}%)</span></div>
      <div class="detail-row"><span>资讯吸收率</span><span class="detail-val">${intake.filter(i=>i.status==='imported').length}/${intake.length} (${intake.length>0?Math.round(intake.filter(i=>i.status==='imported').length/intake.length*100):0}%)</span></div>
      <div class="detail-row"><span>今日习惯完成率</span><span class="detail-val">${doneToday}/${habits.length} (${habits.length>0?Math.round(doneToday/habits.length*100):0}%)</span></div>
      <div class="detail-row"><span>最长连续打卡</span><span class="detail-val">${Math.max(...habits.map(h=>getHabitStreak(h)),0)} 天</span></div>
    `;
  }

  render();
  subscribe(render);
}

// ── 环形图 ──────────────────────────────────────────────────
function renderRingChart(percent, done, total) {
  const size = 160;
  const stroke = 14;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (percent / 100) * c;
  return `
    <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" style="display:block;margin:0 auto">
      <circle cx="${size/2}" cy="${size/2}" r="${r}" fill="none" stroke="var(--surface-3)" stroke-width="${stroke}"/>
      <circle cx="${size/2}" cy="${size/2}" r="${r}" fill="none" stroke="var(--brand)" stroke-width="${stroke}"
        stroke-dasharray="${c}" stroke-dashoffset="${offset}" stroke-linecap="square"
        transform="rotate(-90 ${size/2} ${size/2})" style="transition:stroke-dashoffset .5s ease"/>
      <text x="${size/2}" y="${size/2 - 4}" text-anchor="middle" fill="var(--ink)" font-size="28" font-weight="800">${percent}%</text>
      <text x="${size/2}" y="${size/2 + 18}" text-anchor="middle" fill="var(--dim)" font-size="11">${done}/${total} 已完成</text>
    </svg>
  `;
}

// ── 7天打卡柱状图 ───────────────────────────────────────────
function renderCheckinBar(habits) {
  const days = 7;
  const today = new Date();
  const data = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const ds = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    const count = habits.filter(h => h.records[ds]).length;
    data.push({ label: `${d.getMonth()+1}/${d.getDate()}`, count, total: habits.length });
  }
  const max = Math.max(...data.map(d => d.total), 1);
  const w = 280, h = 140, pad = 24;
  const barW = (w - pad * 2) / days * 0.6;
  const gap = (w - pad * 2) / days * 0.4;
  let bars = '';
  data.forEach((d, i) => {
    const x = pad + i * (barW + gap) + gap / 2;
    const barH = (d.count / max) * (h - pad * 2);
    const y = h - pad - barH;
    const rate = d.total > 0 ? Math.round(d.count / d.total * 100) : 0;
    bars += `<rect x="${x}" y="${y}" width="${barW}" height="${barH}" fill="var(--brand)" rx="1"/>`;
    bars += `<text x="${x + barW/2}" y="${h - 6}" text-anchor="middle" fill="var(--dim)" font-size="9">${d.label}</text>`;
    if (d.count > 0) bars += `<text x="${x + barW/2}" y="${y - 4}" text-anchor="middle" fill="var(--ink-2)" font-size="9" font-weight="700">${d.count}</text>`;
  });
  return `<svg width="100%" viewBox="0 0 ${w} ${h}" style="display:block">${bars}</svg>`;
}

// ── 灵感趋势折线图 ──────────────────────────────────────────
function renderIdeaLine(ideas) {
  const days = 14;
  const today = new Date();
  const data = [];
  let cumulative = 0;
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const ds = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    const dayIdeas = ideas.filter(idea => idea.createdAt && idea.createdAt.startsWith(ds)).length;
    cumulative += dayIdeas;
    data.push({ label: `${d.getMonth()+1}/${d.getDate()}`, value: cumulative, daily: dayIdeas });
  }
  const max = Math.max(...data.map(d => d.value), 1);
  const w = 280, h = 140, pad = 24;
  const stepX = (w - pad * 2) / (days - 1);
  let points = '';
  let dots = '';
  let labels = '';
  data.forEach((d, i) => {
    const x = pad + i * stepX;
    const y = h - pad - (d.value / max) * (h - pad * 2);
    points += `${i === 0 ? 'M' : 'L'}${x},${y} `;
    if (i % 2 === 0 || i === days - 1) {
      dots += `<circle cx="${x}" cy="${y}" r="3" fill="var(--neon-blue)"/>`;
      labels += `<text x="${x}" y="${h - 6}" text-anchor="middle" fill="var(--dim)" font-size="9">${d.label}</text>`;
    }
  });
  // 渐变填充
  const areaPath = points + `L${pad + (days-1)*stepX},${h-pad} L${pad},${h-pad} Z`;
  return `<svg width="100%" viewBox="0 0 ${w} ${h}" style="display:block">
    <defs><linearGradient id="ideaGrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="var(--neon-blue)" stop-opacity="0.3"/>
      <stop offset="100%" stop-color="var(--neon-blue)" stop-opacity="0"/>
    </linearGradient></defs>
    <path d="${areaPath}" fill="url(#ideaGrad)"/>
    <path d="${points}" fill="none" stroke="var(--neon-blue)" stroke-width="2" stroke-linejoin="round"/>
    ${dots}${labels}
    <text x="${w-pad}" y="${pad-4}" text-anchor="end" fill="var(--ink-2)" font-size="10" font-weight="700">累计 ${data[data.length-1].value}</text>
  </svg>`;
}

// ── 习惯完成率条形图（横向）────────────────────────────────
function renderHabitBar(habits) {
  if (habits.length === 0) {
    return '<div class="empty" style="padding:20px">暂无习惯数据</div>';
  }
  const today = new Date();
  const rows = habits.map(h => {
    let done7 = 0;
    for (let i = 0; i < 7; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const ds = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
      if (h.records[ds]) done7++;
    }
    return { name: h.name, rate: Math.round(done7 / 7 * 100), done7 };
  }).sort((a, b) => b.rate - a.rate);

  const maxRows = 6;
  const display = rows.slice(0, maxRows);
  const rowH = 22;
  const h = display.length * rowH + 10;
  const w = 280;
  const labelW = 60;
  const barW = w - labelW - 40;

  let html = '';
  display.forEach((r, i) => {
    const y = i * rowH + 5;
    const fill = r.rate >= 70 ? 'var(--ok)' : r.rate >= 40 ? 'var(--exp)' : 'var(--dim-2)';
    html += `<text x="0" y="${y+14}" fill="var(--ink-2)" font-size="10" font-weight="600">${r.name.length>4?r.name.slice(0,4)+'…':r.name}</text>`;
    html += `<rect x="${labelW}" y="${y+4}" width="${barW}" height="12" fill="var(--surface-3)" rx="1"/>`;
    html += `<rect x="${labelW}" y="${y+4}" width="${barW * r.rate / 100}" height="12" fill="${fill}" rx="1"/>`;
    html += `<text x="${labelW + barW + 4}" y="${y+14}" fill="var(--dim)" font-size="9">${r.rate}%</text>`;
  });

  return `<svg width="100%" viewBox="0 0 ${w} ${h}" style="display:block">${html}</svg>`;
}
