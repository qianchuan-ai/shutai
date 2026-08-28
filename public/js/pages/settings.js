// ═══════════════════════════════════════════════════════════
// 页面：设置（Settings）
// 关于 / 主题 / 数据管理 / 快捷键
// ═══════════════════════════════════════════════════════════

import { ICONS } from '../icons.js';
import { toast } from '../main.js';
import { getIdeas, getIntake } from '../store.js';
import { getData } from '../api.js';
import { t, getLang, setLang } from '../i18n.js';

export function renderSettings(container) {
  const lang = getLang();
  container.innerHTML = `
    <div class="ph-h"><span class="n">${ICONS.settings}</span>${t('settings.title')}</div>
    <div class="ph-sub">${t('hub.title')}</div>

    <!-- 关于 -->
    <div class="card full" style="margin-bottom:16px">
      <h4 style="margin-bottom:12px">${ICONS.info} ${t('settings.about')}</h4>
      <div class="about-grid">
        <div class="about-item"><span class="about-label">${lang === 'zh' ? '产品' : 'Product'}</span><span class="about-val">${t('brand.name')}</span></div>
        <div class="about-item"><span class="about-label">${lang === 'zh' ? '定位' : 'Position'}</span><span class="about-val">${lang === 'zh' ? 'AI 提示词工作台' : 'AI Prompt Workbench'}</span></div>
        <div class="about-item"><span class="about-label">${t('settings.version')}</span><span class="about-val">v2.0.0</span></div>
        <div class="about-item"><span class="about-label">${lang === 'zh' ? '架构' : 'Architecture'}</span><span class="about-val">${lang === 'zh' ? '零依赖 · 本地优先' : 'Zero-dep · Local-first'}</span></div>
        <div class="about-item"><span class="about-label">${lang === 'zh' ? '开源' : 'License'}</span><span class="about-val">${t('settings.license')}</span></div>
      </div>
      <div class="about-desc">
        ${lang === 'zh' ? '枢台不是另一个 AI，而是 AI 的提示词工作台。生成提示词 → 复制到任意 AI → 沉淀为模板，下次直接用。支持豆包、ChatGPT、Claude、Kimi、DeepSeek 等主流 AI 工具。' : 'Shutai is not another AI, it is the prompt workbench for AI. Generate prompts → Copy to any AI → Save as templates, reuse next time. Supports Doubao, ChatGPT, Claude, Kimi, DeepSeek and more.'}
      </div>
      <div style="margin-top:12px">
        <button class="btn sm" id="show-onboarding">👋 ${lang === 'zh' ? '重新查看新手引导' : 'Replay Onboarding'}</button>
      </div>
    </div>

    <!-- 外观 -->
    <div class="card full" style="margin-bottom:16px">
      <h4 style="margin-bottom:12px">${ICONS.palette} ${t('settings.appearance')}</h4>
      <div style="margin-bottom:12px">
        <div style="font-size:12px;color:var(--dim);margin-bottom:8px">${t('settings.theme')}</div>
        <div class="theme-picker">
          <button class="theme-opt on" data-theme="pink">
            <span class="theme-dot" style="background:#c4507a"></span>
            <span>${lang === 'zh' ? '豆沙粉' : 'Pink'}</span>
          </button>
          <button class="theme-opt" data-theme="blue">
            <span class="theme-dot" style="background:#5a8fb0"></span>
            <span>${lang === 'zh' ? '雾霾蓝' : 'Blue'}</span>
          </button>
          <button class="theme-opt" data-theme="dark">
            <span class="theme-dot" style="background:#2a2a3e"></span>
            <span>${lang === 'zh' ? '深空黑' : 'Dark'}</span>
          </button>
        </div>
      </div>
      <div>
        <div style="font-size:12px;color:var(--dim);margin-bottom:8px">${t('settings.language')}</div>
        <div style="display:flex;gap:8px">
          <button class="btn sm ${lang === 'zh' ? 'brand' : ''}" data-lang="zh">中文</button>
          <button class="btn sm ${lang === 'en' ? 'brand' : ''}" data-lang="en">English</button>
        </div>
      </div>
    </div>

    <!-- 数据管理 -->
    <div class="card full" style="margin-bottom:16px">
      <h4 style="margin-bottom:12px">${ICONS.database} ${t('settings.data')}</h4>
      <div class="data-stats" id="data-stats"></div>
      <div style="display:flex;gap:8px;margin-top:14px;flex-wrap:wrap">
        <button class="btn" id="export-json" style="margin-top:0">${ICONS.download} ${t('settings.export')}</button>
        <button class="btn" id="import-json" style="margin-top:0">${ICONS.upload} ${t('settings.import')}</button>
        <input type="file" id="import-file" accept=".json" style="display:none">
        <button class="btn danger" id="clear-data" style="margin-top:0">${ICONS.trash} ${t('settings.clear')}</button>
      </div>
      <div class="about-desc" style="margin-top:10px;font-size:12px">
        ${lang === 'zh' ? '数据保存在本地浏览器，建议定期导出备份。导入会合并现有数据，不会覆盖。' : 'Data is stored locally in your browser. Export backup regularly. Import merges existing data, no overwrite.'}
      </div>
    </div>

    <!-- 快捷键 -->
    <div class="card full">
      <h4 style="margin-bottom:12px">${ICONS.keyboard} ${lang === 'zh' ? '键盘快捷键' : 'Keyboard Shortcuts'}</h4>
      <div class="shortcuts-grid">
        <div class="sc-row"><kbd>Cmd</kbd>+<kbd>Shift</kbd>+<kbd>P</kbd><span>${lang === 'zh' ? '打开提示工坊' : 'Open Prompt Workshop'}</span></div>
        <div class="sc-row"><kbd>1</kbd>-<kbd>6</kbd><span>${lang === 'zh' ? '提示工坊中快速选择操作' : 'Quick select operation in Prompt Workshop'}</span></div>
        <div class="sc-row"><kbd>Esc</kbd><span>${lang === 'zh' ? '关闭弹窗' : 'Close modal'}</span></div>
      </div>
      <div class="about-desc" style="margin-top:10px;font-size:12px">
        ${lang === 'zh' ? 'Windows 用户将 Cmd 替换为 Ctrl。' : 'Windows users: replace Cmd with Ctrl.'}
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
      <div class="ds-item"><span class="ds-n">${skills.length}</span><span class="ds-l">${lang === 'zh' ? 'Skill' : 'Skills'}</span></div>
      <div class="ds-item"><span class="ds-n">${workflows.length}</span><span class="ds-l">${t('wf.total')}</span></div>
      <div class="ds-item"><span class="ds-n">${intake.length}</span><span class="ds-l">${lang === 'zh' ? '资讯' : 'Inbox'}</span></div>
      <div class="ds-item"><span class="ds-n">${ideas.length}</span><span class="ds-l">${t('inbox.inspiration')}</span></div>
    `;
  }
  updateStats();

  // 重新查看新手引导
  container.querySelector('#show-onboarding').addEventListener('click', () => {
    localStorage.removeItem('shutai_onboarding_done');
    if (window.__showOnboarding) {
      window.__showOnboarding();
    } else {
      toast(lang === 'zh' ? '刷新页面后会显示引导' : 'Refresh to show onboarding', 'ok');
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
      toast(lang === 'zh' ? '主题已切换' : 'Theme switched', 'ok');
    });
  });

  // 语言切换
  container.querySelectorAll('[data-lang]').forEach(btn => {
    btn.addEventListener('click', () => {
      const newLang = btn.dataset.lang;
      setLang(newLang);
      toast(lang === 'zh' ? '语言已切换' : 'Language switched', 'ok');
      setTimeout(() => location.reload(), 300);
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
    toast(lang === 'zh' ? '备份已导出' : 'Backup exported', 'ok');
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

      toast(lang === 'zh' ? `导入完成，新增 ${imported} 条` : `Import complete, ${imported} new items`, 'ok');
      setTimeout(() => location.reload(), 1000);
    } catch (err) {
      toast(lang === 'zh' ? '导入失败：文件格式不正确' : 'Import failed: invalid file format', 'err');
    }
    importFile.value = '';
  });

  // 清空数据
  container.querySelector('#clear-data').addEventListener('click', () => {
    if (confirm(lang === 'zh' ? '确定清空所有数据吗？此操作不可恢复！建议先导出备份。' : 'Clear all data? This cannot be undone! Export backup first.')) {
      localStorage.clear();
      toast(lang === 'zh' ? '数据已清空，刷新后生效' : 'Data cleared, refresh to apply', 'ok');
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
