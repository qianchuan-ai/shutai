// i18n.js - Internationalization support (zh/en)

const translations = {
  zh: {
    // Brand
    'brand.name': '枢台',
    'brand.sign': 'AI 协作工作台 · 管理你跟 AI 的每一次协作',
    'brand.full': '枢台 · 工作台',

    // Nav
    'nav.home': '工作台',
    'nav.home.en': 'HOME',
    'nav.inbox': '资讯吸收',
    'nav.inbox.en': 'INBOX',
    'nav.workflow': '工作流',
    'nav.workflow.en': 'FLOW',
    'nav.skills': 'Skill 库',
    'nav.skills.en': 'SKILL',
    'nav.settings': '设置',
    'nav.settings.en': 'SET',

    // Status
    'status.online': '● 在线',
    'status.offline': '● 离线',

    // Theme
    'theme.pink': '粉色主题',
    'theme.blue': '蓝色主题',
    'theme.dark': '深色主题',
    'theme.label': '主题',

    // Language
    'lang.label': '语言',
    'lang.zh': '中文',
    'lang.en': 'English',

    // FAB
    'fab.title': '灵感速记',
    'fab.placeholder': '随手记一个灵感，回车或点保存…',
    'fab.save': '保存',
    'fab.count': '条',

    // Common
    'common.search': '搜索',
    'common.all': '全部',
    'common.create': '新建',
    'common.edit': '编辑',
    'common.delete': '删除',
    'common.save': '保存',
    'common.cancel': '取消',
    'common.confirm': '确认',
    'common.close': '关闭',
    'common.copy': '复制',
    'common.copied': '已复制',
    'common.use': '使用',
    'common.preview': '预览',
    'common.empty': '暂无数据',
    'common.loading': '加载中…',
    'common.tryExample': '试试示例',
    'common.saveAsInspiration': '保存为灵感',

    // Hub / Home
    'hub.title': '枢台 · AI 提示词工作台',
    'hub.subtitle': '生成提示词 → 复制到任意 AI → 沉淀为模板，下次直接用',
    'hub.heroTitle': '把跟 AI 的协作，变成可复用的流程',
    'hub.promptWorkshop': '提示工坊',
    'hub.promptWorkshop.desc': '输入内容，选一个操作，自动生成提示词并复制',
    'hub.recommendedSkills': '推荐 Skill',
    'hub.recommendedWorkflows': '推荐工作流',
    'hub.viewAll': '查看全部 →',

    // Prompt Workshop
    'pw.title': '提示工坊',
    'pw.content': '内容',
    'pw.selectOperation': '选择操作',
    'pw.operations.summarize': '总结要点',
    'pw.operations.analyze': '深度分析',
    'pw.operations.expand': '扩展创作',
    'pw.operations.polish': '润色优化',
    'pw.operations.translate': '翻译英文',
    'pw.operations.brainstorm': '头脑风暴',
    'pw.generatedPrompt': '生成的提示词',
    'pw.autoCopied': '已自动复制，去任意 AI 工具粘贴即可',
    'pw.reCopy': '重新复制',
    'pw.saveAsSkill': '存为 SKILL',
    'pw.saveAsWorkflow': '存为工作流',
    'pw.saveOutput': '保存输出',
    'pw.advancedCustom': '高级自定义（角色/任务/格式）',
    'pw.history': '历史',
    'pw.quickSelect': '数字键 1-6 快速选择',
    'pw.chars': '字',

    // Skills
    'skills.title': 'Skill 库',
    'skills.subtitle': '可复用的提示词模板 · 支持变量填充，一键生成并复制',
    'skills.newSkill': '新建 SKILL',
    'skills.searchPlaceholder': '搜索 Skill 名称、描述或标签…',
    'skills.use': '使用',
    'skills.preview': '预览',
    'skills.variable': '变量',
    'skills.category': '分类',
    'skills.contentCreation': '内容创作',
    'skills.programming': '编程开发',
    'skills.dataAnalysis': '数据分析',
    'skills.empty': '还没有 Skill，点击右上角新建',

    // Workflows
    'wf.title': '工作流库',
    'wf.subtitle': '可复用的 AI 工作流模板 · 点击卡片展开步骤，每步可生成提示词',
    'wf.newWorkflow': '新建工作流',
    'wf.searchPlaceholder': '搜索工作流名称、描述或标签…',
    'wf.all': '全部',
    'wf.topFramework': '顶层框架',
    'wf.contentSOP': '内容SOP',
    'wf.total': '工作流',
    'wf.totalSteps': '总步骤',
    'wf.completed': '已完成',
    'wf.completionRate': '完成率',
    'wf.multiStep': '多步模板',
    'wf.steps': '步骤',
    'wf.empty': '还没有工作流，点击右上角新建',

    // Inbox
    'inbox.title': '资讯吸收',
    'inbox.subtitle': '收集链接 + 沉淀 AI 输出，统一管理，可再次利用',
    'inbox.all': '全部',
    'inbox.links': '链接',
    'inbox.aiOutput': 'AI 输出',
    'inbox.inspiration': '灵感',
    'inbox.searchPlaceholder': '搜索标题、内容、链接…',
    'inbox.addLink': '添加链接（点击展开）',
    'inbox.empty': '还没有内容',
    'inbox.emptyDesc': '添加链接，或在提示工坊点「保存输出」沉淀 AI 结果，或用右下角 FAB 随手记灵感',

    // Settings
    'settings.title': '设置',
    'settings.subtitle': '个性化你的工作台',
    'settings.appearance': '外观',
    'settings.theme': '主题',
    'settings.language': '语言',
    'settings.data': '数据',
    'settings.export': '导出数据',
    'settings.import': '导入数据',
    'settings.clear': '清空数据',
    'settings.about': '关于',
    'settings.version': '版本',
    'settings.license': '许可证',
    'settings.github': 'GitHub',

    // Dashboard
    'dashboard.title': '仪表盘',
    'dashboard.subtitle': '你的 AI 协作数据概览',
    'dashboard.prompts': '提示词生成',
    'dashboard.skills': 'Skill 数量',
    'dashboard.workflows': '工作流数量',
    'dashboard.inbox': '资讯吸收',
    'dashboard.trend': '使用趋势',

    // Command Palette
    'cp.placeholder': '输入命令或搜索…',
    'cp.noResults': '没有找到匹配的命令',

    // Toast
    'toast.saved': '已保存',
    'toast.copied': '已复制到剪贴板',
    'toast.deleted': '已删除',
    'toast.error': '操作失败',
  },

  en: {
    // Brand
    'brand.name': 'Shutai',
    'brand.sign': 'AI Collaboration Workbench · Manage every AI interaction',
    'brand.full': 'Shutai · Workbench',

    // Nav
    'nav.home': 'Home',
    'nav.home.en': 'HOME',
    'nav.inbox': 'Inbox',
    'nav.inbox.en': 'INBOX',
    'nav.workflow': 'Workflows',
    'nav.workflow.en': 'FLOW',
    'nav.skills': 'Skills',
    'nav.skills.en': 'SKILL',
    'nav.settings': 'Settings',
    'nav.settings.en': 'SET',

    // Status
    'status.online': '● Online',
    'status.offline': '● Offline',

    // Theme
    'theme.pink': 'Pink Theme',
    'theme.blue': 'Blue Theme',
    'theme.dark': 'Dark Theme',
    'theme.label': 'Theme',

    // Language
    'lang.label': 'Language',
    'lang.zh': '中文',
    'lang.en': 'English',

    // FAB
    'fab.title': 'Quick Note',
    'fab.placeholder': 'Jot down an idea, press Enter or Save…',
    'fab.save': 'Save',
    'fab.count': 'items',

    // Common
    'common.search': 'Search',
    'common.all': 'All',
    'common.create': 'New',
    'common.edit': 'Edit',
    'common.delete': 'Delete',
    'common.save': 'Save',
    'common.cancel': 'Cancel',
    'common.confirm': 'Confirm',
    'common.close': 'Close',
    'common.copy': 'Copy',
    'common.copied': 'Copied',
    'common.use': 'Use',
    'common.preview': 'Preview',
    'common.empty': 'No data',
    'common.loading': 'Loading…',
    'common.tryExample': 'Try Example',
    'common.saveAsInspiration': 'Save as Inspiration',

    // Hub / Home
    'hub.title': 'Shutai · AI Prompt Workbench',
    'hub.subtitle': 'Generate prompt → Copy to any AI → Save as template, reuse next time',
    'hub.heroTitle': 'Turn AI collaboration into reusable workflows',
    'hub.promptWorkshop': 'Prompt Workshop',
    'hub.promptWorkshop.desc': 'Input content, choose an operation, auto-generate prompt and copy',
    'hub.recommendedSkills': 'Recommended Skills',
    'hub.recommendedWorkflows': 'Recommended Workflows',
    'hub.viewAll': 'View All →',

    // Prompt Workshop
    'pw.title': 'Prompt Workshop',
    'pw.content': 'Content',
    'pw.selectOperation': 'Select Operation',
    'pw.operations.summarize': 'Summarize',
    'pw.operations.analyze': 'Deep Analysis',
    'pw.operations.expand': 'Expand',
    'pw.operations.polish': 'Polish',
    'pw.operations.translate': 'Translate to EN',
    'pw.operations.brainstorm': 'Brainstorm',
    'pw.generatedPrompt': 'Generated Prompt',
    'pw.autoCopied': 'Auto-copied, paste in any AI tool',
    'pw.reCopy': 'Re-copy',
    'pw.saveAsSkill': 'Save as Skill',
    'pw.saveAsWorkflow': 'Save as Workflow',
    'pw.saveOutput': 'Save Output',
    'pw.advancedCustom': 'Advanced Custom (Role/Task/Format)',
    'pw.history': 'History',
    'pw.quickSelect': 'Keys 1-6 for quick select',
    'pw.chars': 'chars',

    // Skills
    'skills.title': 'Skill Library',
    'skills.subtitle': 'Reusable prompt templates · Variable fill-in, one-click generate and copy',
    'skills.newSkill': 'New Skill',
    'skills.searchPlaceholder': 'Search Skill name, description or tags…',
    'skills.use': 'Use',
    'skills.preview': 'Preview',
    'skills.variable': 'Variable',
    'skills.category': 'Category',
    'skills.contentCreation': 'Content Creation',
    'skills.programming': 'Programming',
    'skills.dataAnalysis': 'Data Analysis',
    'skills.empty': 'No Skills yet, click New in top right',

    // Workflows
    'wf.title': 'Workflow Library',
    'wf.subtitle': 'Reusable AI workflow templates · Click card to expand steps, each step generates prompt',
    'wf.newWorkflow': 'New Workflow',
    'wf.searchPlaceholder': 'Search workflow name, description or tags…',
    'wf.all': 'All',
    'wf.topFramework': 'Top Framework',
    'wf.contentSOP': 'Content SOP',
    'wf.total': 'Workflows',
    'wf.totalSteps': 'Total Steps',
    'wf.completed': 'Completed',
    'wf.completionRate': 'Completion Rate',
    'wf.multiStep': 'Multi-step',
    'wf.steps': 'steps',
    'wf.empty': 'No workflows yet, click New in top right',

    // Inbox
    'inbox.title': 'Inbox',
    'inbox.subtitle': 'Collect links + Settle AI outputs, unified management, reusable',
    'inbox.all': 'All',
    'inbox.links': 'Links',
    'inbox.aiOutput': 'AI Output',
    'inbox.inspiration': 'Inspiration',
    'inbox.searchPlaceholder': 'Search title, content, link…',
    'inbox.addLink': 'Add Link (click to expand)',
    'inbox.empty': 'No content yet',
    'inbox.emptyDesc': 'Add links, or save AI output from Prompt Workshop, or use FAB to jot down inspirations',

    // Settings
    'settings.title': 'Settings',
    'settings.subtitle': 'Personalize your workbench',
    'settings.appearance': 'Appearance',
    'settings.theme': 'Theme',
    'settings.language': 'Language',
    'settings.data': 'Data',
    'settings.export': 'Export Data',
    'settings.import': 'Import Data',
    'settings.clear': 'Clear Data',
    'settings.about': 'About',
    'settings.version': 'Version',
    'settings.license': 'License',
    'settings.github': 'GitHub',

    // Dashboard
    'dashboard.title': 'Dashboard',
    'dashboard.subtitle': 'Your AI collaboration data overview',
    'dashboard.prompts': 'Prompts Generated',
    'dashboard.skills': 'Skills',
    'dashboard.workflows': 'Workflows',
    'dashboard.inbox': 'Inbox Items',
    'dashboard.trend': 'Usage Trend',

    // Command Palette
    'cp.placeholder': 'Type command or search…',
    'cp.noResults': 'No matching commands',

    // Toast
    'toast.saved': 'Saved',
    'toast.copied': 'Copied to clipboard',
    'toast.deleted': 'Deleted',
    'toast.error': 'Operation failed',
  }
};

// Current language
let currentLang = localStorage.getItem('shutai-lang') || 'zh';

// Translation function
function t(key) {
  const dict = translations[currentLang] || translations.zh;
  return dict[key] || key;
}

// Set language
function setLang(lang) {
  if (translations[lang]) {
    currentLang = lang;
    localStorage.setItem('shutai-lang', lang);
    document.documentElement.lang = lang === 'zh' ? 'zh-CN' : 'en';
    // Update all data-i18n elements
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      el.textContent = t(key);
    });
    // Update all data-i18n-placeholder elements
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      const key = el.getAttribute('data-i18n-placeholder');
      el.placeholder = t(key);
    });
    // Update title
    document.title = t('brand.full');
    // Dispatch event for pages to re-render
    window.dispatchEvent(new CustomEvent('langchange', { detail: { lang } }));
  }
}

// Get current language
function getLang() {
  return currentLang;
}

// Initialize i18n
function initI18n() {
  document.documentElement.lang = currentLang === 'zh' ? 'zh-CN' : 'en';
  document.title = t('brand.full');
}

export { t, setLang, getLang, initI18n, translations };
