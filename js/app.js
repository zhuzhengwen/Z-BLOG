/**
 * Z-BLOG Desktop App — Yilia Style
 * Hash 路由 SPA：#/  #/post/123  #/category/article  #/tag/xxx  #/search?q=xxx
 */

class App {
  constructor() {
    this.api = new GitHubAPI(CONFIG);
    this.categories = CONFIG.categories;
    this.page = 1;
    this.currentCategory = null;
    this.lastIssuesCount = 0;
    this.repoTags = [];
    this.activeTag = null;
    this._init();
  }

  // ── 初始化 ─────────────────────────────────────────────
  async _init() {
    initMarked();
    this._initSidebar();
    this._bindSearch();
    this._bindLightbox();
    window.addEventListener('hashchange', () => this._route());
    await Promise.all([this._loadProfile(), this._loadTags()]);
    this._route();
  }

  // ── 初始化侧栏导航 ───────────────────────────────────
  _initSidebar() {
    const nav = document.getElementById('sidebarNav');
    if (!nav) return;

    // 更新站点标题
    const titleEl = document.getElementById('siteTitle');
    if (titleEl) { titleEl.textContent = CONFIG.siteTitle; document.title = CONFIG.siteTitle; }
    const descEl = document.getElementById('siteDesc');
    if (descEl) descEl.textContent = CONFIG.siteDesc || '';

    // 插入分类导航
    this.categories.forEach(c => {
      const a = document.createElement('a');
      a.className = 'yilia-nav__item';
      a.dataset.cat = c.label;
      a.href = `#/category/${c.label}`;
      a.innerHTML = `<span class="yilia-nav__icon">${c.icon}</span>${c.name}`;
      nav.appendChild(a);
    });

    // 绑定导航点击
    nav.addEventListener('click', (e) => {
      const item = e.target.closest('.yilia-nav__item');
      if (!item) return;
      e.preventDefault();
      const cat = item.dataset.cat;
      if (cat === 'music') {
        // 音乐分类：和其他分类一样展示 issue 列表
        location.hash = `#/category/music`;
      } else {
        location.hash = cat === 'all' ? '#/' : `#/category/${cat}`;
      }
    });
  }

  // ── 加载用户头像等信息 ───────────────────────────────
  async _loadProfile() {
    try {
      const [user, repo] = await Promise.all([
        this.api.getUser(),
        this.api.getRepoInfo(),
      ]);

      const avatar = document.getElementById('sidebarAvatar');
      const avatarLink = document.getElementById('sidebarAvatarLink');
      if (avatar) avatar.src = user.avatar_url;
      if (avatarLink) avatarLink.href = user.html_url;

      const titleEl = document.getElementById('siteTitle');
      if (titleEl) titleEl.textContent = CONFIG.siteTitle || user.name || user.login;

      const descEl = document.getElementById('siteDesc');
      if (descEl) descEl.textContent = user.bio || CONFIG.siteDesc || '';
    } catch {}
  }

  // ── 加载主题标签 ─────────────────────────────────────
  async _loadTags() {
    try {
      const catLabels = new Set(this.categories.map(c => c.label));
      const tagMap = {};

      let page = 1;
      while (page <= 3) {
        const issues = await this.api.getIssues({ page, perPage: 100 });
        for (const issue of issues) {
          for (const label of (issue.labels || [])) {
            if (!catLabels.has(label.name)) {
              if (!tagMap[label.name]) {
                tagMap[label.name] = { name: label.name, color: label.color || '64748b', count: 0 };
              }
              tagMap[label.name].count++;
            }
          }
        }
        if (issues.length < 100) break;
        page++;
      }

      this.repoTags = Object.values(tagMap)
        .filter(t => t.count > 0)
        .sort((a, b) => b.count - a.count);

      // 在侧栏分类导航后插入标签
      this._renderSidebarTags();
    } catch {}
  }

  _renderSidebarTags() {
    if (!this.repoTags.length) return;
    const nav = document.getElementById('sidebarNav');
    if (!nav) return;

    // 分隔线
    const sep = document.createElement('div');
    sep.style.cssText = 'height:1px;background:rgba(255,255,255,.08);margin:8px 0;';
    nav.appendChild(sep);

    // 标签导航项
    this.repoTags.forEach(t => {
      const a = document.createElement('a');
      a.className = 'yilia-nav__item';
      a.dataset.tag = t.name;
      a.href = `#/tag/${encodeURIComponent(t.name)}`;
      const color = '#' + t.color;
      a.innerHTML = `
        <span class="yilia-nav__dot" style="background:${color}"></span>
        ${escapeHtml(t.name)}
        <span class="yilia-nav__count">${t.count}</span>`;
      a.addEventListener('click', (e) => {
        e.preventDefault();
        this._selectTag(t.name);
      });
      nav.appendChild(a);
    });

    // 如果当前在链接页，也填充标签
    this._renderTagsSection();
  }

  // ── 路由 ───────────────────────────────────────────────
  _route() {
    const hash = location.hash || '#/';
    const [path, query] = hash.slice(1).split('?');
    const parts = path.split('/').filter(Boolean);

    if (parts[0] === 'post' && parts[1]) {
      this._showPost(parseInt(parts[1]));
    } else if (parts[0] === 'category' && parts[1]) {
      this.page = 1;
      this.activeTag = null;
      this.currentCategory = parts[1];
      this._showList(parts[1]);
      this._setActiveNav(parts[1]);
    } else if (parts[0] === 'tag' && parts[1]) {
      this.page = 1;
      this.currentCategory = null;
      this.activeTag = decodeURIComponent(parts[1]);
      this._showList(null);
      this._setActiveNav(null);
    } else if (parts[0] === 'search') {
      const params = new URLSearchParams(query);
      this._showSearch(params.get('q') || '');
    } else {
      this.page = 1;
      this.activeTag = null;
      this.currentCategory = null;
      this._showList(null);
      this._setActiveNav('all');
    }
  }

  // ── 导航高亮 ───────────────────────────────────────────
  _setActiveNav(key) {
    document.querySelectorAll('.yilia-nav__item').forEach(el => {
      const isCat = el.dataset.cat !== undefined;
      const isTag = el.dataset.tag !== undefined;
      if (isCat) {
        el.classList.toggle('active', el.dataset.cat === key);
      } else if (isTag) {
        el.classList.toggle('active', el.dataset.tag === this.activeTag);
      }
    });
  }

  // ── 绑定搜索 ───────────────────────────────────────────
  _bindSearch() {
    const input = document.getElementById('searchInput');
    if (!input) return;
    input.addEventListener('keydown', e => {
      if (e.key === 'Enter') {
        const q = input.value.trim();
        if (q) location.hash = `#/search?q=${encodeURIComponent(q)}`;
      }
    });
  }

  // ── 绑定灯箱 ───────────────────────────────────────────
  _bindLightbox() {
    const lb = document.getElementById('lightbox');
    if (!lb) return;
    lb.addEventListener('click', e => {
      if (e.target === lb || e.target.classList.contains('lightbox__close')) closeLightbox();
    });
  }

  // ── 显示列表页 ─────────────────────────────────────────
  async _showList(category) {
    if (category === 'link') { await this._showLinks(); return; }

    const main = document.getElementById('main');
    const cat = category ? this.categories.find(c => c.label === category) : null;
    const tagIndicatorHtml = this.activeTag ? `
      <div class="tag-active-bar">
        <span class="tag-active-bar__label">🏷️ ${escapeHtml(this.activeTag)}</span>
        <button class="tag-active-bar__clear" onclick="app._selectTag(null)">✕ 清除筛选</button>
      </div>` : '';

    main.innerHTML = `
      <div class="section-header">
        <h1 class="section-header__title">
          ${this.activeTag ? `🏷️ ${escapeHtml(this.activeTag)}` : (cat ? `${cat.icon} ${cat.name}` : '📚 全部文章')}
        </h1>
        <span class="section-header__sub" id="postCount"></span>
      </div>
      ${tagIndicatorHtml}
      <div class="post-list" id="postList">${renderSkeletons(5)}</div>
      <div id="pagination"></div>`;

    try {
      let label = category || null;
      if (this.activeTag) label = label ? `${label},${this.activeTag}` : this.activeTag;

      const issues = await this.api.getIssues({
        page: this.page,
        perPage: CONFIG.postsPerPage,
        label,
      });
      this.lastIssuesCount = issues.length;

      const listEl = document.getElementById('postList');
      if (!issues.length) {
        listEl.innerHTML = renderEmpty('暂无文章，赶快去 GitHub 创建 Issue 吧！');
        return;
      }

      listEl.innerHTML = issues.map(i => renderPostCard(i, this.categories)).join('');
      listEl.querySelectorAll('.moment-card').forEach(card => {
        card.addEventListener('click', () => {
          location.hash = `#/post/${card.dataset.number}`;
        });
      });

      document.getElementById('postCount').textContent = `第 ${this.page} 页`;
      document.getElementById('pagination').innerHTML =
        renderPagination(this.page, issues.length >= CONFIG.postsPerPage);
    } catch (e) {
      document.getElementById('postList').innerHTML = `<div class="error-msg">⚠️ ${e.message}</div>`;
    }
  }

  _selectTag(tag) {
    if (this.activeTag === tag) return;
    this.activeTag = tag;
    this.currentCategory = null;
    this.page = 1;
    location.hash = tag ? `#/tag/${encodeURIComponent(tag)}` : '#/';
    window.scrollTo(0, 0);
  }

  // ── 显示收藏链接页（含主题标签）──────────────────────
  async _showLinks() {
    const COLORS = ['#3b82f6','#8b5cf6','#06b6d4','#10b981','#f59e0b','#ef4444','#ec4899','#6366f1','#14b8a6','#f97316'];
    const main = document.getElementById('main');
    main.innerHTML = `
      <div class="section-header">
        <h1 class="section-header__title">🔗 收藏链接</h1>
        <span class="section-header__sub" id="linkCount"></span>
      </div>
      <div id="linksList" class="links-grid-pc">${renderSkeletons(3)}</div>
      <div id="tagsSection" style="margin-top:32px"></div>`;

    try {
      let allIssues = [], page = 1;
      while (true) {
        const batch = await this.api.getIssues({ page, perPage: 100, label: 'link' });
        allIssues = allIssues.concat(batch);
        if (batch.length < 100) break;
        page++;
      }

      const el = document.getElementById('linksList');
      if (!allIssues.length) {
        el.innerHTML = renderEmpty('暂无收藏链接');
      } else {
        document.getElementById('linkCount').textContent = `共 ${allIssues.length} 个`;
        el.innerHTML = allIssues.map((issue, idx) => {
          const body = (issue.body || '').trim();
          const urlM = body.match(/(https?:\/\/|www\.)[^\s<>"'\]]+/);
          let url = urlM ? urlM[0] : '';
          if (url.startsWith('www.')) url = 'https://' + url;
          if (!url) url = issue.html_url;
          const color = COLORS[idx % COLORS.length];
          const letter = escapeHtml(issue.title.charAt(0).toUpperCase());
          return `<a class="lk" href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer">
            <span class="lk__ico" style="background:${color}">${letter}</span>
            <span class="lk__name">${escapeHtml(issue.title)}</span>
          </a>`;
        }).join('');
      }
    } catch (e) {
      const el = document.getElementById('linksList');
      if (el) el.innerHTML = `<div class="error-msg">⚠️ ${e.message}</div>`;
    }

    this._renderTagsSection();
  }

  _renderTagsSection() {
    const sec = document.getElementById('tagsSection');
    if (!sec) return;
    if (!this.repoTags || !this.repoTags.length) { sec.innerHTML = ''; return; }

    sec.innerHTML = `
      <div class="section-header" style="margin-bottom:14px">
        <h2 class="section-header__title" style="font-size:1.1rem">🏷️ 主题标签</h2>
        <span class="section-header__sub">${this.repoTags.length} 个</span>
      </div>
      <div class="tags-grid-pc">
        ${this.repoTags.map(t => {
          const color = '#' + t.color;
          const count = t.count >= 100 ? '99+' : t.count;
          return `<button class="tag-pc" onclick="app._selectTag('${escapeHtml(t.name)}')"
            style="--tc:${color}">
            <span class="tag-pc__dot" style="background:${color}"></span>
            <span class="tag-pc__name">${escapeHtml(t.name)}</span>
            <span class="tag-pc__count">${count}</span>
          </button>`;
        }).join('')}
      </div>`;
  }

  // ── 显示文章详情 ───────────────────────────────────────
  async _showPost(number) {
    const main = document.getElementById('main');
    main.innerHTML = `
      <button class="back-btn" onclick="history.back()">← 返回列表</button>
      <div id="postContent">${renderSkeletons(1)}</div>`;

    try {
      const issue = await this.api.getIssue(number);
      document.getElementById('postContent').innerHTML = renderPostDetail(issue, this.categories);
      if (typeof hljs !== 'undefined') {
        document.querySelectorAll('pre code').forEach(el => hljs.highlightElement(el));
      }
      document.title = `${issue.title} - ${CONFIG.siteTitle}`;
    } catch (e) {
      document.getElementById('postContent').innerHTML = `<div class="error-msg">⚠️ ${e.message}</div>`;
    }
  }

  // ── 显示搜索结果 ───────────────────────────────────────
  async _showSearch(query) {
    if (!query) { location.hash = '#/'; return; }
    const main = document.getElementById('main');
    main.innerHTML = `
      <div class="section-header">
        <h1 class="section-header__title">🔍 搜索：${escapeHtml(query)}</h1>
      </div>
      <div class="post-list" id="postList">${renderSkeletons(4)}</div>`;

    try {
      const { items, total } = await this.api.searchIssues(query);
      const listEl = document.getElementById('postList');
      if (!items.length) {
        listEl.innerHTML = renderEmpty(`未找到 "${escapeHtml(query)}" 相关内容`);
        return;
      }
      listEl.innerHTML = items.map(i => renderPostCard(i, this.categories)).join('');
      listEl.querySelectorAll('.moment-card').forEach(card => {
        card.addEventListener('click', () => location.hash = `#/post/${card.dataset.number}`);
      });
    } catch (e) {
      document.getElementById('postList').innerHTML = `<div class="error-msg">⚠️ ${e.message}</div>`;
    }
  }

  // ── 翻页 ───────────────────────────────────────────────
  prevPage() {
    if (this.page <= 1) return;
    this.page--;
    this._showList(this.currentCategory);
    window.scrollTo(0, 0);
  }

  nextPage() {
    if (this.lastIssuesCount < CONFIG.postsPerPage) return;
    this.page++;
    this._showList(this.currentCategory);
    window.scrollTo(0, 0);
  }
}

// ── 启动 ───────────────────────────────────────────────────
let app;
document.addEventListener('DOMContentLoaded', () => {
  if (!CONFIG.owner || CONFIG.owner === 'your-username') {
    document.getElementById('main').innerHTML = `
      <div class="error-msg" style="padding:32px 28px;text-align:center;font-size:1rem">
        <p style="font-size:2rem;margin-bottom:12px">⚙️</p>
        <p><strong>请先配置 config.js</strong></p>
        <p style="margin-top:8px;font-size:.875rem">设置 <code>owner</code>（GitHub 用户名）和 <code>repo</code>（仓库名）后刷新页面</p>
      </div>`;
    return;
  }
  app = new App();
});

// ── Toast 工具 ─────────────────────────────────────────────
function showToast(msg, duration = 2500) {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  t.classList.add('toast--show');
  setTimeout(() => t.classList.remove('toast--show'), duration);
}
