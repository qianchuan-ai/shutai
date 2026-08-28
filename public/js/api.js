// ═══════════════════════════════════════════════════════════
// 枢台 · API 封装
// ═══════════════════════════════════════════════════════════

const BASE = '';

async function request(url, options = {}) {
  try {
    const res = await fetch(BASE + url, {
      headers: { 'Content-Type': 'application/json' },
      ...options
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (e) {
    console.error('[API] 请求失败:', url, e.message);
    throw e;
  }
}

// ── 配置 ───────────────────────────────────────────────────
export async function getConfig() {
  return request('/api/config');
}

// ── 状态（todos / intake / ideas）──────────────────────────
export async function getState(key) {
  return request(`/api/state/${key}`);
}

export async function setState(key, data) {
  return request(`/api/state/${key}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  });
}

// ── 数据读写（methodology / skills 等）────────────────────
export async function getData(key) {
  return request(`/api/data/${key}`);
}

export async function setData(key, data) {
  return request(`/api/data/${key}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  });
}
