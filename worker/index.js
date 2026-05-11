/**
 * Z-BLOG GitHub API Proxy - Cloudflare Worker
 *
 * 部署步骤：
 * 1. 登录 https://dash.cloudflare.com → Workers & Pages → Create
 * 2. 粘贴此文件全部内容 → 点击 Deploy
 * 3. 进入 Worker 设置 → Variables → 添加环境变量：
 *    GITHUB_TOKEN = 你的 GitHub Personal Access Token
 * 4. 把 Worker 的 URL 填入博客 config.js 的 proxyUrl 字段
 */

const CACHE_TTL = 300; // 缓存 5 分钟

export default {
  async fetch(request, env) {
    // CORS 预检
    if (request.method === 'OPTIONS') {
      return corsResponse(null, 204);
    }

    // 只允许 GET
    if (request.method !== 'GET') {
      return corsResponse('Method Not Allowed', 405);
    }

    const url = new URL(request.url);
    const githubUrl = 'https://api.github.com' + url.pathname + url.search;

    // 读缓存
    const cache = caches.default;
    const cached = await cache.match(githubUrl);
    if (cached) {
      const res = new Response(cached.body, cached);
      res.headers.set('X-Cache', 'HIT');
      res.headers.set('Access-Control-Allow-Origin', '*');
      return res;
    }

    // 请求 GitHub API
    const ghRes = await fetch(githubUrl, {
      headers: {
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'Z-BLOG-Proxy/1.0',
        ...(env.GITHUB_TOKEN ? { 'Authorization': `token ${env.GITHUB_TOKEN}` } : {}),
      },
    });

    const body = await ghRes.text();
    const headers = new Headers({
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'X-Cache': 'MISS',
      'X-RateLimit-Limit':     ghRes.headers.get('X-RateLimit-Limit') || '',
      'X-RateLimit-Remaining': ghRes.headers.get('X-RateLimit-Remaining') || '',
      'X-RateLimit-Reset':     ghRes.headers.get('X-RateLimit-Reset') || '',
    });

    const res = new Response(body, { status: ghRes.status, headers });

    // 只缓存成功的响应
    if (ghRes.ok) {
      const toCache = new Response(body, { status: ghRes.status, headers: new Headers({
        'Content-Type': 'application/json',
        'Cache-Control': `public, max-age=${CACHE_TTL}`,
        'Access-Control-Allow-Origin': '*',
        'X-RateLimit-Limit':     ghRes.headers.get('X-RateLimit-Limit') || '',
        'X-RateLimit-Remaining': ghRes.headers.get('X-RateLimit-Remaining') || '',
        'X-RateLimit-Reset':     ghRes.headers.get('X-RateLimit-Reset') || '',
      })});
      await cache.put(githubUrl, toCache);
    }

    return res;
  },
};

function corsResponse(body, status = 200) {
  return new Response(body, {
    status,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
