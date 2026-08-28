// 枢台 · 通用工作台 Server
// 零依赖，仅使用 Node 内置模块
// 用法：node server.js  →  http://localhost:8765

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// 全局错误处理，防止未捕获异常导致进程崩溃
process.on('uncaughtException', (err) => {
  console.error('[枢台] 未捕获异常:', err.message);
  console.error(err.stack);
});
process.on('unhandledRejection', (reason) => {
  console.error('[枢台] 未处理的 Promise 拒绝:', reason);
});

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ── 配置加载 ──────────────────────────────────────────────
const CONFIG_PATH = path.join(__dirname, 'config.json');
const EXAMPLE_PATH = path.join(__dirname, 'config.example.json');
if (!fs.existsSync(CONFIG_PATH) && fs.existsSync(EXAMPLE_PATH)) {
  fs.copyFileSync(EXAMPLE_PATH, CONFIG_PATH);
  console.log('[枢台] 已从 config.example.json 生成 config.json');
}
const config = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'));

const PORT = process.env.PORT || config.port || 8765;
const PUBLIC_DIR = path.join(__dirname, 'public');
const DATA_DIR = path.resolve(__dirname, config.dataDir || './data');
const STATE_DIR = path.resolve(__dirname, config.stateDir || './.state');

// 确保目录存在
[DATA_DIR, STATE_DIR].forEach(d => { if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true }); });

// ── MIME 类型 ─────────────────────────────────────────────
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.webmanifest': 'application/manifest+json'
};

// ── 工具函数 ───────────────────────────────────────────────
function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', c => chunks.push(c));
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf-8')));
    req.on('error', reject);
  });
}

function json(res, data, status = 200) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(data));
}

// 安全路径：防止路径穿越
function safeJoin(base, target) {
  // 去掉开头的斜杠，防止 Windows 上 path.resolve 把 /xxx 当作盘符根目录
  const cleanTarget = target.replace(/^[\\/]+/, '');
  const resolved = path.resolve(base, cleanTarget);
  const baseResolved = path.resolve(base);
  if (!resolved.startsWith(baseResolved)) return null;
  return resolved;
}

// 读取 JSON 文件，不存在返回默认值
function readJson(filePath, defaultValue = []) {
  try {
    if (fs.existsSync(filePath)) return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  } catch (e) { console.error('[枢台] 读取失败:', filePath, e.message); }
  return defaultValue;
}

function writeJson(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

// ── 状态文件映射 ───────────────────────────────────────────
const STATE_FILES = {
  todos: 'todos.json',
  intake: 'intake.json',
  ideas: 'ideas.json'
};

// 初始化空状态文件
Object.values(STATE_FILES).forEach(f => {
  const fp = path.join(STATE_DIR, f);
  if (!fs.existsSync(fp)) writeJson(fp, []);
});

// ── Server ─────────────────────────────────────────────────
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  const pathname = decodeURIComponent(url.pathname);

  // CORS（本地开发用）
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  if (req.method === 'OPTIONS') { res.writeHead(204); return res.end(); }

  try {
    // ── API: 配置 ──────────────────────────────────────
    if (pathname === '/api/config' && req.method === 'GET') {
      return json(res, {
        title: config.title || '枢台 · 工作台',
        subtitle: config.subtitle || '',
        brand: config.brand || ''
      });
    }

    // ── API: 状态读写（todos / intake / ideas）──────────
    const stateMatch = pathname.match(/^\/api\/state\/(\w+)$/);
    if (stateMatch) {
      const key = stateMatch[1];
      const filename = STATE_FILES[key];
      if (!filename) return json(res, { error: 'unknown state key' }, 404);
      const filePath = path.join(STATE_DIR, filename);

      if (req.method === 'GET') {
        return json(res, readJson(filePath, []));
      }
      if (req.method === 'PUT' || req.method === 'POST') {
        const body = await readBody(req);
        let data;
        try { data = JSON.parse(body); } catch { return json(res, { error: 'invalid JSON' }, 400); }
        writeJson(filePath, data);
        return json(res, { ok: true, count: Array.isArray(data) ? data.length : 1 });
      }
    }

    // ── API: 数据文件（methodology / skills 等，支持读写）──
    const dataMatch = pathname.match(/^\/api\/data\/(\w+)$/);
    if (dataMatch) {
      const key = dataMatch[1];
      const filePath = safeJoin(DATA_DIR, `${key}.json`);
      if (!filePath) return json(res, { error: 'invalid path' }, 400);

      if (req.method === 'GET') {
        if (!fs.existsSync(filePath)) return json(res, { error: 'not found' }, 404);
        return json(res, readJson(filePath, []));
      }
      // PUT：整体替换（用于新增/编辑/删除后保存）
      if (req.method === 'PUT') {
        const body = await readBody(req);
        let data;
        try { data = JSON.parse(body); } catch { return json(res, { error: 'invalid JSON' }, 400); }
        writeJson(filePath, data);
        return json(res, { ok: true, count: Array.isArray(data) ? data.length : 1 });
      }
    }

    // ── 静态文件托管 ────────────────────────────────────
    if (req.method === 'GET') {
      let relPath = pathname === '/' ? '/index.html' : pathname;
      const filePath = safeJoin(PUBLIC_DIR, relPath);
      if (filePath && fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
        const ext = path.extname(filePath).toLowerCase();
        res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
        return fs.createReadStream(filePath).pipe(res);
      }
      // SPA fallback：不存在的路径返回 index.html
      const indexPath = path.join(PUBLIC_DIR, 'index.html');
      if (fs.existsSync(indexPath)) {
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        return fs.createReadStream(indexPath).pipe(res);
      }
    }

    res.writeHead(404);
    res.end('Not Found');
  } catch (e) {
    console.error('[枢台] 错误:', e);
    json(res, { error: e.message }, 500);
  }
});

server.listen(PORT, () => {
  console.log(`\n  枢台 · 工作台已启动`);
  console.log(`  → http://localhost:${PORT}`);
  console.log(`  → 数据目录: ${DATA_DIR}`);
  console.log(`  → 状态目录: ${STATE_DIR}\n`);
});
