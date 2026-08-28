// ═══════════════════════════════════════════════════════════
// 页面：习惯追踪
// 每日打卡 + 连续天数 + 热力图 + 自定义习惯
// ═══════════════════════════════════════════════════════════

import { subscribe, getHabits, toggleHabit, addHabit, deleteHabit, getHabitStreak, getHabitTotal, getTodayStr } from '../store.js';
import { toast } from '../main.js';
import { ICONS } from '../icons.js';
import { t, getLang } from '../i18n.js';

const HABIT_COLORS = {
  blue: { bg: 'rgba(90,143,176,0.15)', border: '#5a8fb0', text: '#5a8fb0' },
  red: { bg: 'rgba(196,80,80,0.15)', border: '#c45050', text: '#c45050' },
  green: { bg: 'rgba(106,154,106,0.15)', border: '#6a9a6a', text: '#6a9a6a' },
  purple: { bg: 'rgba(138,106,160,0.15)', border: '#8a6aa0', text: '#8a6aa0' },
  yellow: { bg: 'rgba(181,154,74,0.15)', border: '#b59a4a', text: '#b59a4a' },
};

const HABIT_ICONS = ['water', 'heart', 'book', 'zap', 'moon', 'star', 'target', 'coffee', 'music', 'code'];

export function renderHabits(container) {
  const lang = getLang();
  container.innerHTML = `
    <div class="ph-h"><span class="n">${ICONS.target}</span>${lang === 'zh' ? '习惯追踪' : 'Habits'}</div>
    <div class="ph-sub">${lang === 'zh' ? '每日打卡，连续天数，养成好习惯 · 点击今日格子切换完成状态' : 'Daily check-in, streak tracking, build good habits · Click today cell to toggle'}</div>

    <!-- 统计卡片 -->
    <div class="habits-stats" id="habits-stats"></div>

    <!-- 习惯列表 -->
    <div class="habits-list" id="habits-list"></div>

    <!-- 添加习惯 -->
    <div class="card full" style="margin-top:16px">
      <h4 style="margin-bottom:12px">${ICONS.plus} 添加新习惯</h4>
      <div style="display:flex;gap:10px;flex-wrap:wrap;align-items:center">
        <input id="habit-name-input" placeholder="习惯名称，如：早起、写日记…" style="flex:1;min-width:200px">
        <select id="habit-icon-select" style="width:120px">
          ${HABIT_ICONS.map(ic => `<option value="${ic}">${ic}</option>`).join('')}
        </select>
        <select id="habit-color-select" style="width:100px">
          <option value="blue">蓝色</option>
          <option value="red">红色</option>
          <option value="green">绿色</option>
          <option value="purple">紫色</option>
          <option value="yellow">黄色</option>
        </select>
        <button class="btn brand" id="habit-add-btn" style="margin-top:0">添加</button>
      </div>
    </div>
  `;

  // 绑定添加
  container.querySelector('#habit-add-btn').addEventListener('click', () => {
    const name = container.querySelector('#habit-name-input').value.trim();
    const icon = container.querySelector('#habit-icon-select').value;
    const color = container.querySelector('#habit-color-select').value;
    if (!name) { toast('请输入习惯名称', 'err'); return; }
    addHabit(name, icon, color);
    container.querySelector('#habit-name-input').value = '';
    toast('习惯已添加', 'ok');
  });

  function render() {
    const habits = getHabits();
    const today = getTodayStr();
    const doneToday = habits.filter(h => h.records[today]).length;
    const totalChecks = habits.reduce((sum, h) => sum + getHabitTotal(h), 0);
    const rate = habits.length > 0 ? Math.round(doneToday / habits.length * 100) : 0;

    // 统计
    container.querySelector('#habits-stats').innerHTML = `
      <div class="hs"><div class="n">${habits.length}</div><div class="l">习惯总数</div></div>
      <div class="hs"><div class="n">${doneToday}/${habits.length}</div><div class="l">今日完成</div><div class="sub">完成率 ${rate}%</div></div>
      <div class="hs"><div class="n">${totalChecks}</div><div class="l">累计打卡</div></div>
      <div class="hs"><div class="n">${Math.max(...habits.map(h => getHabitStreak(h)), 0)}</div><div class="l">最长连续</div><div class="sub">天</div></div>
    `;

    // 习惯列表
    const list = container.querySelector('#habits-list');
    if (habits.length === 0) {
      list.innerHTML = '<div class="empty" style="padding:32px">还没有习惯，添加一个开始吧</div>';
      return;
    }
    list.innerHTML = habits.map(h => {
      const color = HABIT_COLORS[h.color] || HABIT_COLORS.blue;
      const streak = getHabitStreak(h);
      const total = getHabitTotal(h);
      const isDoneToday = h.records[today];
      const heatmap = generateHeatmap(h);
      return `
        <div class="habit-card" style="border-color:${color.border}33">
          <div class="habit-card-hd">
            <div class="habit-icon" style="background:${color.bg};color:${color.text};border-color:${color.border}">
              ${ICONS[h.icon] || ICONS.star}
            </div>
            <div class="habit-info">
              <div class="habit-name">${h.name}</div>
              <div class="habit-meta">
                <span class="habit-streak" style="color:${color.text}">🔥 ${streak} 天连续</span>
                <span class="habit-total">累计 ${total} 次</span>
              </div>
            </div>
            <button class="habit-check ${isDoneToday ? 'done' : ''}" data-id="${h.id}" style="${isDoneToday ? `background:${color.bg};border-color:${color.border};color:${color.text}` : ''}">
              ${isDoneToday ? ICONS['check-circle'] : ICONS.circle || '○'}
              <span>${isDoneToday ? '已完成' : '打卡'}</span>
            </button>
            <button class="mini del" data-del="${h.id}" title="删除习惯">删</button>
          </div>
          <div class="habit-heatmap">${heatmap}</div>
        </div>
      `;
    }).join('');

    // 绑定打卡
    list.querySelectorAll('.habit-check').forEach(btn => {
      btn.addEventListener('click', () => toggleHabit(Number(btn.dataset.id)));
    });
    // 绑定删除
    list.querySelectorAll('[data-del]').forEach(btn => {
      btn.addEventListener('click', () => {
        if (confirm('确定删除这个习惯吗？历史记录也会删除。')) {
          deleteHabit(Number(btn.dataset.del));
          toast('习惯已删除', 'ok');
        }
      });
    });
  }

  render();
  subscribe(render);
}

// 生成最近 12 周的热力图
function generateHeatmap(habit) {
  const weeks = 12;
  const today = new Date();
  const cells = [];
  // 从 12 周前开始
  const start = new Date(today);
  start.setDate(start.getDate() - (weeks * 7 - 1));
  // 对齐到周一
  const day = start.getDay() || 7;
  start.setDate(start.getDate() - (day - 1));

  for (let w = 0; w < weeks; w++) {
    let weekHtml = '<div class="hm-week">';
    for (let d = 0; d < 7; d++) {
      const date = new Date(start);
      date.setDate(start.getDate() + w * 7 + d);
      const ds = `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
      const isFuture = date > today;
      const isDone = habit.records[ds];
      let level = 0;
      if (isDone) level = 4;
      else if (!isFuture) level = 1;
      const title = `${ds}${isDone ? ' ✓ 已打卡' : isFuture ? '' : ' 未打卡'}`;
      weekHtml += `<div class="hm-cell lvl-${level}" title="${title}"></div>`;
    }
    weekHtml += '</div>';
    cells.push(weekHtml);
  }
  return `<div class="hm-container">${cells.join('')}</div>`;
}
