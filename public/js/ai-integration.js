// ═══════════════════════════════════════════════════════════
// 枢台 · AI 集成（AI Integration）
// 通用多 AI 工具支持：豆包 / ChatGPT / Claude / Kimi / DeepSeek / 通义千问
// 一键发送到 AI · AI 对话导入 · 快捷操作
// ═══════════════════════════════════════════════════════════

// AI 工具配置
export const AI_TOOLS = [
  { id: 'doubao', name: '豆包', url: 'https://www.doubao.com/chat/', color: '#3370ff', icon: 'sparkles' },
  { id: 'chatgpt', name: 'ChatGPT', url: 'https://chat.openai.com/', color: '#10a37f', icon: 'sparkles' },
  { id: 'claude', name: 'Claude', url: 'https://claude.ai/', color: '#d97757', icon: 'sparkles' },
  { id: 'kimi', name: 'Kimi', url: 'https://kimi.moonshot.cn/', color: '#1a1a1a', icon: 'sparkles' },
  { id: 'deepseek', name: 'DeepSeek', url: 'https://chat.deepseek.com/', color: '#4d6bfe', icon: 'sparkles' },
  { id: 'qwen', name: '通义千问', url: 'https://tongyi.aliyun.com/', color: '#6142d6', icon: 'sparkles' },
  { id: 'gemini', name: 'Gemini', url: 'https://gemini.google.com/', color: '#4285f4', icon: 'sparkles' },
  { id: 'perplexity', name: 'Perplexity', url: 'https://www.perplexity.ai/', color: '#20808d', icon: 'sparkles' },
];

// 获取默认 AI 工具（用户可在设置中配置，默认豆包）
export function getDefaultAI() {
  try {
    const saved = localStorage.getItem('shutai-default-ai');
    if (saved) {
      const tool = AI_TOOLS.find(t => t.id === saved);
      if (tool) return tool;
    }
  } catch {}
  return AI_TOOLS[0]; // 默认豆包
}

// 设置默认 AI 工具
export function setDefaultAI(toolId) {
  try {
    localStorage.setItem('shutai-default-ai', toolId);
  } catch {}
}

/**
 * 发送文本到指定 AI 工具
 * @param {string} text - 要发送的文本
 * @param {string} toolId - AI 工具 ID（可选，默认使用用户配置的默认工具）
 * @param {string} prompt - 可选的前置提示词
 */
export function sendToAI(text, toolId = null, prompt = '') {
  const tool = toolId ? AI_TOOLS.find(t => t.id === toolId) : getDefaultAI();
  if (!tool) {
    console.error('未知的 AI 工具:', toolId);
    return;
  }

  const fullText = prompt ? `${prompt}\n\n${text}` : text;

  // 复制到剪贴板
  navigator.clipboard.writeText(fullText).then(() => {
    window.open(tool.url, '_blank');
    showAIToast(`已复制到剪贴板，在 ${tool.name} 中粘贴即可`, 'ok');
  }).catch(() => {
    window.open(tool.url, '_blank');
    showAIToast(`已打开 ${tool.name}，请手动复制内容`, 'err');
  });
}

/**
 * 发送到豆包（向后兼容别名）
 */
export function sendToDoubao(text, prompt = '') {
  sendToAI(text, 'doubao', prompt);
}

/**
 * 发送到 AI 并附带特定提示词
 * @param {string} text - 内容
 * @param {string} type - 类型：summarize/expand/translate/analyze/polish
 * @param {string} toolId - AI 工具 ID（可选）
 */
export function sendToAIWithPrompt(text, type, toolId = null) {
  const prompts = {
    summarize: '请帮我总结以下内容的核心要点：',
    expand: '请基于以下内容进行扩展和深化：',
    translate: '请将以下内容翻译成英文：',
    analyze: '请分析以下内容的优缺点和改进建议：',
    polish: '请帮我润色以下文字，使其更流畅专业：',
    brainstorm: '请基于以下内容进行头脑风暴，给出 5 个创意方向：',
    outline: '请为以下内容生成详细的大纲结构：',
  };
  sendToAI(text, toolId, prompts[type] || '');
}

/**
 * 解析 AI 对话记录
 * 从粘贴的对话文本中提取用户问题和 AI 回答
 */
export function parseAIChat(text) {
  const conversations = [];
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);

  let currentRole = '';
  let currentContent = [];

  lines.forEach(line => {
    if (/^(用户|我|User|Me)[:：]/.test(line)) {
      if (currentRole && currentContent.length) {
        conversations.push({ role: currentRole, content: currentContent.join('\n') });
      }
      currentRole = 'user';
      currentContent = [line.replace(/^(用户|我|User|Me)[:：]\s*/, '')];
    } else if (/^(豆包|ChatGPT|Claude|Kimi|AI|助手|Assistant|GPT)[:：]/.test(line)) {
      if (currentRole && currentContent.length) {
        conversations.push({ role: currentRole, content: currentContent.join('\n') });
      }
      currentRole = 'assistant';
      currentContent = [line.replace(/^(豆包|ChatGPT|Claude|Kimi|AI|助手|Assistant|GPT)[:：]\s*/, '')];
    } else if (currentRole) {
      currentContent.push(line);
    }
  });

  if (currentRole && currentContent.length) {
    conversations.push({ role: currentRole, content: currentContent.join('\n') });
  }

  return conversations;
}

/**
 * 从 AI 对话中提取灵感/待办/知识点
 */
export function extractFromAIChat(text) {
  const results = [];
  const conversations = parseAIChat(text);

  conversations.forEach(conv => {
    if (conv.role === 'assistant') {
      const lines = conv.content.split('\n').map(l => l.trim()).filter(Boolean);
      lines.forEach(line => {
        if (/^(-\s*\[\s*\]|[-*]\s*|^\d+\.\s*)/.test(line) && line.length > 5) {
          results.push({ type: '待办', content: line.replace(/^(-\s*\[\s*\]|[-*]\s*|^\d+\.\s*)/, '').trim() });
        } else if (/^(结论|总结|要点|核心|关键|重点|本质)/.test(line)) {
          results.push({ type: '要点', content: line });
        } else if (line.length > 40 && !/^(好的|是的|对|嗯|啊|当然|没问题)/.test(line)) {
          results.push({ type: '知识', content: line });
        }
      });
    }
  });

  return results;
}

// 显示 AI 相关的 toast
function showAIToast(msg, type = 'ok') {
  if (window.__toast) {
    window.__toast(msg, type);
  } else {
    console.log(`[AI] ${msg}`);
  }
}

// AI 快捷操作配置
export const AI_ACTIONS = [
  { id: 'summarize', label: '总结要点', icon: 'file', prompt: '请帮我总结以下内容的核心要点：' },
  { id: 'expand', label: '扩展深化', icon: 'sparkles', prompt: '请基于以下内容进行扩展和深化：' },
  { id: 'polish', label: '润色文字', icon: 'edit', prompt: '请帮我润色以下文字，使其更流畅专业：' },
  { id: 'translate', label: '翻译成英文', icon: 'globe', prompt: '请将以下内容翻译成英文：' },
  { id: 'analyze', label: '分析建议', icon: 'target', prompt: '请分析以下内容的优缺点和改进建议：' },
  { id: 'brainstorm', label: '头脑风暴', icon: 'lightbulb', prompt: '请基于以下内容进行头脑风暴，给出 5 个创意方向：' },
  { id: 'outline', label: '生成大纲', icon: 'layers', prompt: '请为以下内容生成详细的大纲结构：' },
];

/**
 * 渲染 AI 工具选择器（下拉菜单）
 * @param {HTMLElement} container - 容器元素
 * @param {Function} onSelect - 选择回调 (toolId) => void
 */
export function renderAISelector(container, onSelect) {
  const defaultAI = getDefaultAI();
  container.innerHTML = `
    <div class="ai-selector">
      <button class="ai-selector-btn" id="ai-selector-btn">
        <span class="ai-dot" style="background:${defaultAI.color}"></span>
        <span>${defaultAI.name}</span>
        <span class="ai-caret">▾</span>
      </button>
      <div class="ai-selector-dropdown" id="ai-selector-dropdown" style="display:none">
        ${AI_TOOLS.map(t => `
          <div class="ai-option" data-id="${t.id}">
            <span class="ai-dot" style="background:${t.color}"></span>
            <span>${t.name}</span>
            ${t.id === defaultAI.id ? '<span class="ai-check">✓</span>' : ''}
          </div>
        `).join('')}
      </div>
    </div>
  `;

  const btn = container.querySelector('#ai-selector-btn');
  const dropdown = container.querySelector('#ai-selector-dropdown');

  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    dropdown.style.display = dropdown.style.display === 'none' ? 'block' : 'none';
  });

  container.querySelectorAll('.ai-option').forEach(opt => {
    opt.addEventListener('click', () => {
      const toolId = opt.dataset.id;
      setDefaultAI(toolId);
      dropdown.style.display = 'none';
      if (onSelect) onSelect(toolId);
      // 重新渲染选择器
      renderAISelector(container, onSelect);
    });
  });

  // 点击外部关闭
  document.addEventListener('click', () => {
    dropdown.style.display = 'none';
  }, { once: true });
}
