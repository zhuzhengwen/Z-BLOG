/**
 * GitHub API 封装
 * 支持缓存、分页、标签过滤、搜索
 */
class GitHubAPI {
  constructor({ owner, repo, token, cacheDuration }) {
    this.owner = owner;
    this.repo = repo;
    // 优先用 localStorage 中用户自己设置的 token
    this.token = localStorage.getItem('zblog_user_token') || token || '';
    this.baseUrl = `https://api.github.com/repos/${owner}/${repo}`;
    this.cacheDuration = cacheDuration || 5 * 60 * 1000;
    this._cache = {};
  }

  // 更新 token（存入 localStorage 并立即生效）
  setToken(token) {
    this.token = token;
    if (token) localStorage.setItem('zblog_user_token', token);
    else localStorage.removeItem('zblog_user_token');
  }

  getToken() { return this.token; }

  // ── 缓存 ──────────────────────────────────────────────────
  _cacheKey(url) { return `zblog_${url}`; }

  _getCache(url) {
    try {
      const raw = localStorage.getItem(this._cacheKey(url));
      if (!raw) return null;
      const { data, ts } = JSON.parse(raw);
      if (Date.now() - ts > this.cacheDuration) { localStorage.removeItem(this._cacheKey(url)); return null; }
      return data;
    } catch { return null; }
  }

  _setCache(url, data) {
    try { localStorage.setItem(this._cacheKey(url), JSON.stringify({ data, ts: Date.now() })); } catch {}
  }

  // ── HTTP 请求 ─────────────────────────────────────────────
  async _request(url, params = {}) {
    const qs = new URLSearchParams(params).toString();
    const full = qs ? `${url}?${qs}` : url;

    const cached = this._getCache(full);
    if (cached) return cached;

    const headers = { 'Accept': 'application/vnd.github.v3+json' };
    if (this.token) headers['Authorization'] = `token ${this.token}`;

    const res = await fetch(full, { headers });

    if (res.status === 403) {
      const reset = res.headers.get('X-RateLimit-Reset');
      const resetTime = reset ? new Date(reset * 1000).toLocaleTimeString() : '稍后';
      // 自动弹出 token 设置对话框
      if (typeof showTokenDialog === 'function') showTokenDialog(resetTime);
      throw new Error(`GitHub API 频率限制，请于 ${resetTime} 后重试`);
    }
    if (!res.ok) throw new Error(`GitHub API 错误: ${res.status} ${res.statusText}`);

    const data = await res.json();
    this._setCache(full, data);
    return data;
  }

  // ── 获取帖子列表（过滤 PR）──────────────────────────────────
  async getIssues({ page = 1, perPage = 10, label = null, state = 'open' } = {}) {
    const params = { state, page, per_page: perPage, sort: 'created', direction: 'desc' };
    if (label) params.labels = label;
    const data = await this._request(`${this.baseUrl}/issues`, params);
    return data.filter(i => !i.pull_request);
  }

  // ── 获取单篇帖子 ──────────────────────────────────────────
  async getIssue(number) {
    return this._request(`${this.baseUrl}/issues/${number}`);
  }

  // ── 获取所有 Labels ───────────────────────────────────────
  async getLabels() {
    return this._request(`${this.baseUrl}/labels`, { per_page: 100 });
  }

  // ── 获取仓库信息 ──────────────────────────────────────────
  async getRepoInfo() {
    return this._request(this.baseUrl);
  }

  // ── 获取用户信息（头像、昵称、简介、地区等）────────────────
  async getUser() {
    return this._request(`https://api.github.com/users/${this.owner}`);
  }

  // ── 搜索帖子 ─────────────────────────────────────────────
  async searchIssues(query, page = 1, perPage = 10) {
    const q = `${query} repo:${this.owner}/${this.repo} is:issue is:open`;
    const data = await this._request('https://api.github.com/search/issues', { q, page, per_page: perPage, sort: 'created' });
    return { items: (data.items || []).filter(i => !i.pull_request), total: data.total_count };
  }

  // ── 获取帖子评论 ─────────────────────────────────────────
  async getComments(number) {
    return this._request(`${this.baseUrl}/issues/${number}/comments`);
  }

  // ── 清除所有缓存 ──────────────────────────────────────────
  clearCache() {
    const keys = Object.keys(localStorage).filter(k => k.startsWith('zblog_'));
    keys.forEach(k => localStorage.removeItem(k));
  }
}
