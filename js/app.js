/**
 * Z-BLOG Desktop App
 * Hash 路由 SPA：#/  #/post/123  #/category/article  #/search?q=xxx
 */

// ── 简约 SVG 图标（细描边，currentColor）────────────────────
const _SVG = {
  all:     `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`,
  article: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="8" y1="13" x2="16" y2="13"/><line x1="8" y1="17" x2="12" y2="17"/></svg>`,
  image:   `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>`,
  video:   `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="5" width="14" height="14" rx="2"/><polygon points="16 8 22 5 22 19 16 16"/></svg>`,
  note:    `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4z"/></svg>`,
  link:    `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/></svg>`,
  music:   `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>`,
};
function _catIcon(label) { return _SVG[label] || _SVG.article; }

class App {
  constructor() {
    this.api = new GitHubAPI(CONFIG);
    this.categories = CONFIG.categories;
    this.page = 1;
    this.currentCategory = null;
    this.lastIssuesCount = 0;
    this.repoTags = [];        // 仓库中的主题标签（非分类标签）
    this.activeTag = null;     // 当前激活的标签筛选
    this._init();
  }

  // ── 初始化 ─────────────────────────────────────────────
  async _init() {
    initMarked();
    this._bindNav();
    this._bindSearch();
    this._bindLightbox();
    window.addEventListener('hashchange', () => this._route());
    await Promise.all([this._loadSidebar(), this._loadTags()]);
    this._route();
  }

  async _loadTags() {
    try {
      const catLabels = new Set(this.categories.map(c => c.label));
      const tagMap = {}; // { name -> { name, color, count } }

      // 拉取所有文章，从每篇文章的 labels 提取子标签
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

      // 只保留有文章的标签，按数量降序
      this.repoTags = Object.values(tagMap)
        .filter(t => t.count > 0)
        .sort((a, b) => b.count - a.count);

      this._renderSidebarTags();
    } catch {}
  }

  _renderSidebarTags() {
    // 标签不放侧边栏，而是放在链接页主内容区
    // 如果链接页当前开着，顺手填充标签区块
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
      this._setActiveNav('all');
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
    document.querySelectorAll('.header__nav-item').forEach(el => {
      el.classList.toggle('active', el.dataset.cat === key);
    });
    document.querySelectorAll('.cat-list__item:not([data-tag])').forEach(el => {
      el.classList.toggle('active', el.dataset.cat === key);
    });
    document.querySelectorAll('.cat-list__item[data-tag]').forEach(el => {
      el.classList.toggle('active', el.dataset.tag === this.activeTag);
    });
  }

  // ── 绑定导航点击 ───────────────────────────────────────
  _bindNav() {
    document.querySelectorAll('.header__nav-item').forEach(el => {
      el.addEventListener('click', () => {
        const cat = el.dataset.cat;
        location.hash = cat === 'all' ? '#/' : `#/category/${cat}`;
      });
    });
  }

  // ── 绑定搜索 ───────────────────────────────────────────
  _bindSearch() {
    const input = document.getElementById('searchInput');
    const btn = document.getElementById('searchBtn');
    if (!input || !btn) return;
    const go = () => {
      const q = input.value.trim();
      if (q) location.hash = `#/search?q=${encodeURIComponent(q)}`;
    };
    btn.addEventListener('click', go);
    input.addEventListener('keydown', e => { if (e.key === 'Enter') go(); });
  }

  // ── 绑定灯箱 ───────────────────────────────────────────
  _bindLightbox() {
    const lb = document.getElementById('lightbox');
    if (!lb) return;
    lb.addEventListener('click', e => { if (e.target === lb || e.target.classList.contains('lightbox__close')) closeLightbox(); });
  }

  // ── 加载侧边栏 ─────────────────────────────────────────
  async _loadSidebar() {
    // 用户 + 仓库信息（并发请求）
    try {
      const [user, repo] = await Promise.all([
        this.api.getUser(),
        this.api.getRepoInfo(),
      ]);
      const el = document.getElementById('sidebarRepo');
      if (el) {
        const _locSvg = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>`;
        const _lnkSvg = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/></svg>`;
        const locationHtml = user.location
          ? `<p class="sidebar-card__meta"><span class="sidebar-meta-icon">${_locSvg}</span>${escapeHtml(user.location)}</p>`
          : '';
        const blogHtml = user.blog
          ? `<p class="sidebar-card__meta"><span class="sidebar-meta-icon">${_lnkSvg}</span><a href="${user.blog}" target="_blank" rel="noopener">${escapeHtml(user.blog.replace(/^https?:\/\//, ''))}</a></p>`
          : '';
        el.innerHTML = `
          <a href="${user.html_url}" target="_blank" rel="noopener" class="sidebar-card__avatar-link">
            <img class="sidebar-card__avatar" src="${user.avatar_url}" alt="${user.login}">
          </a>
          <p class="sidebar-card__name">${escapeHtml(user.name || user.login)}</p>
          <p class="sidebar-card__desc">${escapeHtml(user.bio || repo.description || CONFIG.siteDesc || '')}</p>
          <div class="sidebar-card__metas">
            ${locationHtml}
            ${blogHtml}
          </div>
          <a class="sidebar-card__link" href="${repo.html_url}" target="_blank" rel="noopener">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
            ${repo.stargazers_count}
            &nbsp;·&nbsp;
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle"><circle cx="6" cy="6" r="2"/><circle cx="18" cy="6" r="2"/><circle cx="12" cy="18" r="2"/><path d="M6 8v2a4 4 0 004 4h4a4 4 0 004-4V8"/><line x1="12" y1="14" x2="12" y2="16"/></svg>
            ${repo.forks_count}
          </a>`;
      }
    } catch {}

    // 顶部导航栏追加分类按钮（SVG 图标）
    const navEl = document.getElementById('headerNav');
    if (navEl) {
      navEl.insertAdjacentHTML('beforeend',
        this.categories.map(c => `
          <button class="header__nav-item" data-cat="${c.label}"
            onclick="location.hash='#/category/${c.label}'">
            ${_catIcon(c.label)}<span>${c.name}</span>
          </button>`).join('')
      );
      // 补绑事件
      navEl.querySelectorAll('.header__nav-item:not([data-bound])').forEach(el => {
        el.dataset.bound = '1';
        el.addEventListener('click', () => {
          const cat = el.dataset.cat;
          location.hash = cat === 'all' ? '#/' : `#/category/${cat}`;
        });
      });
    }

    // 分类列表（SVG 图标）
    const catEl = document.getElementById('sidebarCats');
    if (catEl) {
      catEl.innerHTML = this.categories.map(c => `
        <li><button class="cat-list__item" data-cat="${c.label}"
          onclick="location.hash='#/category/${c.label}'">
          <span class="cat-list__icon">${_catIcon(c.label)}</span>
          <span class="cat-list__name">${c.name}</span>
        </button></li>`).join('');
    }
  }

  // ── 显示列表页 ─────────────────────────────────────────
  async _showList(category) {
    if (category === 'link')  { await this._showLinks(); return; }

    const main = document.getElementById('main');
    const cat = category ? this.categories.find(c => c.label === category) : null;
    const tagIndicatorHtml = this.activeTag ? `
      <div class="tag-active-bar">
        <span class="tag-active-bar__label"># ${escapeHtml(this.activeTag)}</span>
        <button class="tag-active-bar__clear" onclick="app._selectTag(null)">✕ 清除筛选</button>
      </div>` : '';

    main.innerHTML = `
      <div class="section-header">
        <h1 class="section-header__title">
          ${this.activeTag
            ? `<span class="sh-icon">${_SVG.article}</span>${escapeHtml(this.activeTag)}`
            : (cat
              ? `<span class="sh-icon">${_catIcon(cat.label)}</span>${cat.name}`
              : `<span class="sh-icon">${_SVG.all}</span>全部文章`)}
        </h1>
        <span class="section-header__sub" id="postCount"></span>
      </div>
      ${tagIndicatorHtml}
      <div class="post-list" id="postList">${renderSkeletons(5)}</div>
      <div id="pagination"></div>`;

    try {
      // 组合标签：分类 + 主题标签
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

  // ── 显示收藏链接页（含主题标签） ──────────────────────
  async _showLinks() {
    const COLORS = ['#3b82f6','#8b5cf6','#06b6d4','#10b981','#f59e0b','#ef4444','#ec4899','#6366f1','#14b8a6','#f97316'];
    const main = document.getElementById('main');
    main.innerHTML = `
      <div class="section-header">
        <h1 class="section-header__title">🔗 收藏链接</h1>
        <span class="section-header__sub" id="linkCount"></span>
      </div>
      <div id="linksList" class="links-grid-pc">${renderSkeletons(3)}</div>
      <div id="tagsSection" style="margin-top:28px"></div>`;

    // ── 收藏链接 ──
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

    // ── 主题标签（从已有 repoTags 取，不重复请求）──
    this._renderTagsSection();
  }

  // 在链接页主内容区渲染主题标签区块
  _renderTagsSection() {
    const sec = document.getElementById('tagsSection');
    if (!sec) return;

    // repoTags 还未加载完时稍后重试
    if (!this.repoTags || !this.repoTags.length) {
      sec.innerHTML = '';
      return;
    }

    sec.innerHTML = `
      <div class="section-header" style="margin-bottom:12px">
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
      // 代码高亮
      if (typeof hljs !== 'undefined') {
        document.querySelectorAll('pre code').forEach(el => hljs.highlightElement(el));
      }
      // 更新页面标题
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
      listEl.querySelectorAll('.post-card').forEach(card => {
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
