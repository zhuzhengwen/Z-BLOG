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
    // 清理旧版遗留在 localStorage 里的 API 缓存
    try {
      Object.keys(localStorage).forEach(k => { if (k.startsWith('zblog_https')) localStorage.removeItem(k); });
    } catch {}
  }

  // 更新 token（存入 localStorage 并立即生效）
  setToken(token) {
    this.token = token;
    try {
      if (token) localStorage.setItem('zblog_user_token', token);
      else localStorage.removeItem('zblog_user_token');
    } catch {}
  }

  getToken() { return this.token; }

  // ── 缓存（内存，避免 localStorage 被大量 JSON 占满导致 Token 丢失）──
  _getCache(url) {
    const entry = this._cache[url];
    if (!entry) return null;
    if (Date.now() - entry.ts > this.cacheDuration) { delete this._cache[url]; return null; }
    return entry.data;
  }

  _setCache(url, data) {
    this._cache[url] = { data, ts: Date.now() };
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

  // ── 获取文章总数（搜索 API，带缓存）────────────────────────
  async getTotalCount(label = null) {
    const labelPart = label ? label.split(',').map(l => `label:"${l}"`).join(' ') : '';
    const q = `repo:${this.owner}/${this.repo} is:issue is:open ${labelPart}`.trim();
    const cacheKey = `total_count:${q}`;
    const cached = this._getCache(cacheKey);
    if (cached !== null) return cached;
    try {
      const data = await this._request('https://api.github.com/search/issues', { q, per_page: 1 });
      const count = data.total_count || 0;
      this._setCache(cacheKey, count);
      return count;
    } catch { return null; }
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
