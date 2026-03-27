/**
 * Z-BLOG Desktop App
 * Hash 路由 SPA：#/  #/post/123  #/category/article  #/search?q=xxx
 */

class App {
  constructor() {
    this.api = new GitHubAPI(CONFIG);
    this.categories = CONFIG.categories;
    this.page = 1;
    this.currentCategory = null;
    this.lastIssuesCount = 0;
    this._init();
  }

  // ── 初始化 ─────────────────────────────────────────────
  async _init() {
    initMarked();
    this._bindNav();
    this._bindSearch();
    this._bindLightbox();
    window.addEventListener('hashchange', () => this._route());
    await this._loadSidebar();
    this._route();
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
      this.currentCategory = parts[1];
      this._showList(parts[1]);
      this._setActiveNav(parts[1]);
    } else if (parts[0] === 'search') {
      const params = new URLSearchParams(query);
      this._showSearch(params.get('q') || '');
    } else {
      this.page = 1;
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
    document.querySelectorAll('.cat-list__item').forEach(el => {
      el.classList.toggle('active', el.dataset.cat === key);
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
    // 仓库信息
    try {
      const repo = await this.api.getRepoInfo();
      const el = document.getElementById('sidebarRepo');
      if (el) {
        el.innerHTML = `
          <img class="sidebar-card__avatar" src="${repo.owner.avatar_url}&s=128" alt="${repo.owner.login}">
          <p class="sidebar-card__name">${CONFIG.siteTitle}</p>
          <p class="sidebar-card__desc">${repo.description || CONFIG.siteDesc}</p>
          <a class="sidebar-card__link" href="${repo.html_url}" target="_blank">⭐ ${repo.stargazers_count} Stars · 🍴 ${repo.forks_count} Forks</a>`;
      }
    } catch {}

    // 分类列表
    const catEl = document.getElementById('sidebarCats');
    if (catEl) {
      catEl.innerHTML = this.categories.map(c => `
        <li><button class="cat-list__item" data-cat="${c.label}" onclick="location.hash='#/category/${c.label}'">
          <span class="cat-list__icon">${c.icon}</span>
          <span class="cat-list__name">${c.name}</span>
        </button></li>`).join('');
    }
  }

  // ── 显示列表页 ─────────────────────────────────────────
  async _showList(category) {
    const main = document.getElementById('main');
    const cat = category ? this.categories.find(c => c.label === category) : null;
    main.innerHTML = `
      <div class="section-header">
        <h1 class="section-header__title">
          ${cat ? `${cat.icon} ${cat.name}` : '📚 全部文章'}
        </h1>
        <span class="section-header__sub" id="postCount"></span>
      </div>
      <div class="post-list" id="postList">${renderSkeletons(5)}</div>
      <div id="pagination"></div>`;

    try {
      const issues = await this.api.getIssues({
        page: this.page,
        perPage: CONFIG.postsPerPage,
        label: category || null,
      });
      this.lastIssuesCount = issues.length;

      const listEl = document.getElementById('postList');
      if (!issues.length) {
        listEl.innerHTML = renderEmpty('暂无文章，赶快去 GitHub 创建 Issue 吧！');
        return;
      }

      listEl.innerHTML = issues.map(i => renderPostCard(i, this.categories)).join('');
      listEl.querySelectorAll('.post-card').forEach(card => {
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
