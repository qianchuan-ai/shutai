// ═══════════════════════════════════════════════════════════
// 页面：设置（Settings）
// 关于 / 主题 / 数据管理 / 快捷键
// ═══════════════════════════════════════════════════════════

import { ICONS } from '../icons.js';
import { toast } from '../main.js';
import { getIdeas, getIntake } from '../store.js';
import { getData } from '../api.js';

export function renderSettings(container) {
  container.innerHTML = `
    <div class="ph-h"><span class="n">${ICONS.settings}</span>设置</div>
    <div class="ph-sub">枢台 · AI 提示词工作台</div>

    <!-- 关于 -->
    <div class="card full" style="margin-bottom:16px">
      <h4 style="margin-bottom:12px">${ICONS.info} 关于</h4>
      <div class="about-grid">
        <div class="about-item"><span class="about-label">产品</span><span class="about-val">枢台</span></div>
        <div class="about-item"><span class="about-label">定位</span><span class="about-val">AI 提示词工作台</span></div>
        <div class="about-item"><span class="about-label">版本</span><span class="about-val">v2.0.0</span></div>
        <div class="about-item"><span class="about-label">架构</span><span class="about-val">零依赖 · 本地优先</span></div>
        <div class="about-item"><span class="about-label">开源</span><span class="about-val">MIT License</span></div>
      </div>
      <div class="about-desc">
        枢台不是另一个 AI，而是 AI 的提示词工作台。生成提示词 → 复制到任意 AI → 沉淀为模板，下次直接用。支持豆包、ChatGPT、Claude、Kimi、DeepSeek 等主流 AI 工具。
      </div>
      <div style="margin-top:12px">
        <button class="btn sm" id="show-onboarding">👋 重新查看新手引导</button>
      </div>
    </div>

    <!-- 主题 -->
    <div class="card full" style="margin-bottom:16px">
      <h4 style="margin-bottom:12px">${ICONS.palette} 主题</h4>
      <div class="theme-picker">
        <button class="theme-opt on" data-theme="pink">
          <span class="theme-dot" style="background:#c4507a"></span>
          <span>豆沙粉</span>
        </button>
        <button class="theme-opt" data-theme="blue">
          <span class="theme-dot" style="background:#5a8fb0"></span>
          <span>雾霾蓝</span>
        </button>
        <button class="theme-opt" data-theme="dark">
          <span class="theme-dot" style="background:#2a2a3e"></span>
          <span>深空黑</span>
        </button>
      </div>
    </div>

    <!-- 数据管理 -->
    <div class="card full" style="margin-bottom:16px">
      <h4 style="margin-bottom:12px">${ICONS.database} 数据管理</h4>
      <div class="data-stats" id="data-stats"></div>
      <div style="display:flex;gap:8px;margin-top:14px;flex-wrap:wrap">
        <button class="btn" id="export-json" style="margin-top:0">${ICONS.download} 导出备份</button>
        <button class="btn" id="import-json" style="margin-top:0">${ICONS.upload} 导入备份</button>
        <input type="file" id="import-file" accept=".json" style="display:none">
        <button class="btn danger" id="clear-data" style="margin-top:0">${ICONS.trash} 清空所有数据</button>
      </div>
      <div class="about-desc" style="margin-top:10px;font-size:12px">
        数据保存在本地浏览器，建议定期导出备份。导入会合并现有数据，不会覆盖。
      </div>
    </div>

    <!-- 快捷键 -->
    <div class="card full">
      <h4 style="margin-bottom:12px">${ICONS.keyboard} 键盘快捷键</h4>
      <div class="shortcuts-grid">
        <div class="sc-row"><kbd>Cmd</kbd>+<kbd>Shift</kbd>+<kbd>P</kbd><span>打开提示工坊</span></div>
        <div class="sc-row"><kbd>1</kbd>-<kbd>6</kbd><span>提示工坊中快速选择操作</span></div>
        <div class="sc-row"><kbd>Esc</kbd><span>关闭弹窗</span></div>
      </div>
      <div class="about-desc" style="margin-top:10px;font-size:12px">
        Windows 用户将 Cmd 替换为 Ctrl。
      </div>
    </div>
  `;

  // 数据统计
  const ideas = getIdeas();
  const intake = getIntake();
  let skills = [], workflows = [];
  getData('skills').then(d => { skills = d; updateStats(); }).catch(() => {});
  getData('methodology').then(d => { workflows = d; updateStats(); }).catch(() => {});

  function updateStats() {
    const el = container.querySelector('#data-stats');
    if (!el) return;
    el.innerHTML = `
      <div class="ds-item"><span class="ds-n">${skills.length}</span><span class="ds-l">Skill</span></div>
      <div class="ds-item"><span class="ds-n">${workflows.length}</span><span class="ds-l">工作流</span></div>
      <div class="ds-item"><span class="ds-n">${intake.length}</span><span class="ds-l">资讯</span></div>
      <div class="ds-item"><span class="ds-n">${ideas.length}</span><span class="ds-l">灵感</span></div>
    `;
  }
  updateStats();

  // 重新查看新手引导
  container.querySelector('#show-onboarding').addEventListener('click', () => {
    localStorage.removeItem('shutai_onboarding_done');
    if (window.__showOnboarding) {
      window.__showOnboarding();
    } else {
      toast('刷新页面后会显示引导', 'ok');
    }
  });

  // 主题切换
  const savedTheme = localStorage.getItem('shutai-theme') || 'pink';
  container.querySelectorAll('.theme-opt').forEach(btn => {
    btn.classList.toggle('on', btn.dataset.theme === savedTheme);
    btn.addEventListener('click', () => {
      const theme = btn.dataset.theme;
      if (theme === 'pink') {
        document.documentElement.removeAttribute('data-theme');
      } else {
        document.documentElement.setAttribute('data-theme', theme);
      }
      localStorage.setItem('shutai-theme', theme);
      container.querySelectorAll('.theme-opt').forEach(b => b.classList.toggle('on', b === btn));
      toast('主题已切换', 'ok');
    });
  });

  // 导出备份
  container.querySelector('#export-json').addEventListener('click', async () => {
    const allSkills = await getData('skills').catch(() => []);
    const allWorkflows = await getData('methodology').catch(() => []);
    const data = {
      skills: allSkills,
      workflows: allWorkflows,
      intake,
      ideas,
      promptHistory: JSON.parse(localStorage.getItem('shutai_prompt_history') || '[]'),
      recent: JSON.parse(localStorage.getItem('shutai_recent') || '[]'),
      theme: localStorage.getItem('shutai-theme') || 'pink',
      exportedAt: new Date().toISOString(),
      version: '2.0.0'
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `shutai-backup-${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast('备份已导出', 'ok');
  });

  // 导入备份
  const importFile = container.querySelector('#import-file');
  container.querySelector('#import-json').addEventListener('click', () => {
    importFile.click();
  });
  importFile.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      let imported = 0;

      // 合并 Skill
      if (data.skills && Array.isArray(data.skills)) {
        const current = await getData('skills').catch(() => []);
        const merged = [...current];
        data.skills.forEach(s => {
          if (!merged.find(m => m.name === s.name)) {
            merged.push(s);
            imported++;
          }
        });
        await setDataSafe('skills', merged);
      }

      // 合并工作流
      if (data.workflows && Array.isArray(data.workflows)) {
        const current = await getData('methodology').catch(() => []);
        const merged = [...current];
        data.workflows.forEach(w => {
          if (!merged.find(m => m.title === w.title)) {
            merged.push(w);
            imported++;
          }
        });
        await setDataSafe('methodology', merged);
      }

      // 恢复历史和最近使用
      if (data.promptHistory) {
        localStorage.setItem('shutai_prompt_history', JSON.stringify(data.promptHistory));
      }
      if (data.recent) {
        localStorage.setItem('shutai_recent', JSON.stringify(data.recent));
      }
      if (data.theme) {
        localStorage.setItem('shutai-theme', data.theme);
      }

      toast(`导入完成，新增 ${imported} 条`, 'ok');
      setTimeout(() => location.reload(), 1000);
    } catch (err) {
      toast('导入失败：文件格式不正确', 'err');
    }
    importFile.value = '';
  });

  // 清空数据
  container.querySelector('#clear-data').addEventListener('click', () => {
    if (confirm('确定清空所有数据吗？此操作不可恢复！建议先导出备份。')) {
      localStorage.clear();
      toast('数据已清空，刷新后生效', 'ok');
      setTimeout(() => location.reload(), 1000);
    }
  });
}

// 安全的 setData 包装
async function setDataSafe(key, data) {
  try {
    const { setData } = await import('../api.js');
    await setData(key, data);
  } catch {}
}
