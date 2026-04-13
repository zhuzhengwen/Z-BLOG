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
    this.repoTags = [];        // 仓库中的主题标签（非分类标签）
    this.activeTag = null;     // 当前激活的标签筛选
    this._init();
  }

  // ── 初始化 ─────────────────────────────────────────────
  async _init() {
    initMarked();
    this._initTheme();
    this._initColor();
    this._renderBeian();
    this._bindNav();
    this._bindSearch();
    this._bindMobileMenu();
    this._bindLightbox();
    window.addEventListener('hashchange', () => this._route());
    document.addEventListener('click', e => this._onDocClick(e));
    await Promise.all([this._loadSidebar(), this._loadTags()]);
    this._route();
  }

  // ── 主题切换 ───────────────────────────────────────────
  _initTheme() {
    const saved = localStorage.getItem('zblog-theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const isDark = saved === 'dark' || (!saved && prefersDark);
    this._applyTheme(isDark ? 'dark' : 'light');
  }

  _applyTheme(theme) {
    const html = document.documentElement;
    const hljsLight = document.getElementById('hljsLight');
    const hljsDark  = document.getElementById('hljsDark');
    if (theme === 'dark') {
      html.setAttribute('data-theme', 'dark');
      if (hljsLight) hljsLight.disabled = true;
      if (hljsDark)  hljsDark.disabled  = false;
    } else {
      html.setAttribute('data-theme', 'light');
      if (hljsLight) hljsLight.disabled = false;
      if (hljsDark)  hljsDark.disabled  = true;
    }
  }

  _toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    this._applyTheme(next);
    localStorage.setItem('zblog-theme', next);
  }

  // ── 备案信息 ────────────────────────────────────────────
  _renderBeian() {
    const el = document.getElementById('footerBeian');
    if (!el) return;
    const b = CONFIG.beian || {};
    const items = [];

    // ICP 备案
    if (b.icp) {
      items.push(`
        <a class="beian-item" href="https://beian.miit.gov.cn/" target="_blank" rel="noopener">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>
          </svg>
          ${b.icp}
        </a>`);
    }

    // 公安网备案
    if (b.police) {
      const link = b.policeCode
        ? `http://www.beian.gov.cn/portal/registerSystemInfo?recordcode=${b.policeCode}`
        : 'http://www.beian.gov.cn/';
      items.push(`
        <a class="beian-item" href="${link}" target="_blank" rel="noopener">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          </svg>
          ${b.police}
        </a>`);
    }

    el.innerHTML = items.join('');
  }

  // ── 主题色 ─────────────────────────────────────────────
  _PRESETS = [
    '#2563eb','#4f46e5','#7c3aed','#9333ea',
    '#ec4899','#f43f5e','#f97316','#f59e0b',
    '#10b981','#14b8a6','#06b6d4','#0ea5e9',
  ];
  _DEFAULT_COLOR = '#2563eb';

  _initColor() {
    const saved = localStorage.getItem('zblog-color') || this._DEFAULT_COLOR;
    this._buildSwatches();
    this._applyColor(saved, false);
    // 自定义拾色器事件
    const input = document.getElementById('colorCustom');
    if (input) input.addEventListener('input', e => this._applyColor(e.target.value, true));
  }

  _buildSwatches() {
    const el = document.getElementById('colorSwatches');
    if (!el) return;
    el.innerHTML = this._PRESETS.map(c =>
      `<button class="color-swatch" style="background:${c}" data-color="${c}" onclick="app._applyColor('${c}',true)" title="${c}"></button>`
    ).join('');
  }

  _applyColor(hex, save = true) {
    // 生成 hover 色（加深 15%）
    const darken = (h, amt) => {
      const n = parseInt(h.replace('#',''), 16);
      const r = Math.max(0, (n >> 16) - amt);
      const g = Math.max(0, ((n >> 8) & 0xff) - amt);
      const b = Math.max(0, (n & 0xff) - amt);
      return `#${[r,g,b].map(v=>v.toString(16).padStart(2,'0')).join('')}`;
    };
    document.documentElement.style.setProperty('--primary', hex);
    document.documentElement.style.setProperty('--primary-hover', darken(hex, 25));
    document.documentElement.style.setProperty('--text-link', hex);
    // 更新按钮环颜色（ring 本身用 CSS var，此处只需刷 active 态）
    document.querySelectorAll('.color-swatch').forEach(s => {
      s.classList.toggle('active', s.dataset.color === hex);
    });
    // 同步拾色器
    const input = document.getElementById('colorCustom');
    if (input) input.value = hex;
    if (save) localStorage.setItem('zblog-color', hex);
  }

  _resetColor() {
    this._applyColor(this._DEFAULT_COLOR, true);
  }

  _toggleColorPicker() {
    const popup = document.getElementById('colorPickerPopup');
    if (!popup) return;
    popup.classList.toggle('open');
  }

  _onDocClick(e) {
    const popup = document.getElementById('colorPickerPopup');
    const btn   = document.getElementById('colorPickerBtn');
    if (!popup || !popup.classList.contains('open')) return;
    if (!popup.contains(e.target) && !btn.contains(e.target)) {
      popup.classList.remove('open');
    }
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
    } else if (parts[0] === 'photos') {
      this._showPhotos();
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
    document.querySelectorAll('.mobile-nav-item').forEach(el => {
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

  // ── 移动端菜单 ─────────────────────────────────────────
  _bindMobileMenu() {
    // 点击页面其他区域关闭
    document.addEventListener('click', e => {
      const panel = document.getElementById('mobileNavPanel');
      const btn   = document.getElementById('mobileMenuBtn');
      if (!panel || !panel.classList.contains('open')) return;
      if (!panel.contains(e.target) && btn && !btn.contains(e.target)) {
        this._closeMobileMenu();
      }
    });
    // 路由变化时自动关闭
    window.addEventListener('hashchange', () => this._closeMobileMenu());
  }

  _toggleMobileMenu() {
    const panel = document.getElementById('mobileNavPanel');
    const btn   = document.getElementById('mobileMenuBtn');
    if (!panel) return;
    const isOpen = panel.classList.toggle('open');
    if (btn) btn.classList.toggle('open', isOpen);
    if (isOpen) {
      const input = document.getElementById('mobileSearchInput');
      if (input) setTimeout(() => input.focus(), 300);
    }
  }

  _closeMobileMenu() {
    const panel = document.getElementById('mobileNavPanel');
    const btn   = document.getElementById('mobileMenuBtn');
    if (panel) panel.classList.remove('open');
    if (btn)   btn.classList.remove('open');
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
        const locationHtml = user.location
          ? `<p class="sidebar-card__meta"><span class="sidebar-meta-icon"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg></span>${escapeHtml(user.location)}</p>`
          : '';
        const blogHtml = user.blog
          ? `<p class="sidebar-card__meta"><span class="sidebar-meta-icon"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/></svg></span><a href="${user.blog}" target="_blank" rel="noopener">${escapeHtml(user.blog.replace(/^https?:\/\//, ''))}</a></p>`
          : '';
        el.innerHTML = `
          <a href="${user.html_url}" target="_blank" rel="noopener" class="sidebar-card__avatar-link">
            <img class="sidebar-card__avatar" src="${user.avatar_url}" alt="${user.login}">
          </a>
          <p class="sidebar-card__name">${escapeHtml(user.name || user.login)}</p>
          ${(user.bio || repo.description || CONFIG.siteDesc) ? `<p class="sidebar-card__desc">${escapeHtml(user.bio || repo.description || CONFIG.siteDesc)}</p>` : ''}
          <div class="sidebar-card__metas">
            ${locationHtml}
            ${blogHtml}
          </div>
          <div class="sidebar-card__stats">
            <a class="sidebar-stat" href="${repo.html_url}/stargazers" target="_blank" rel="noopener">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
              <span>${repo.stargazers_count}</span>
            </a>
            <a class="sidebar-stat" href="${repo.html_url}/network/members" target="_blank" rel="noopener">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="6" cy="6" r="2"/><circle cx="18" cy="6" r="2"/><circle cx="12" cy="18" r="2"/><path d="M6 8v2a4 4 0 004 4h4a4 4 0 004-4V8"/><line x1="12" y1="14" x2="12" y2="16"/></svg>
              <span>${repo.forks_count}</span>
            </a>
          </div>
          <a class="sidebar-card__github-btn" href="${repo.html_url}" target="_blank" rel="noopener">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/></svg>
            GitHub
          </a>`;
      }
    } catch {}

    // 分类列表
    const catEl = document.getElementById('sidebarCats');
    const SIDEBAR_ICONS = {
      article: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z"/><path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z"/></svg>`,
      image:   `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>`,
      think:   `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 006 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/></svg>`,
      note:    `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2"/><rect x="8" y="2" width="8" height="4" rx="1"/></svg>`,
      link:    `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>`,
      music:   `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>`,
    };
    if (catEl) {
      catEl.innerHTML = this.categories.map(c => `
        <li><button class="cat-list__item" data-cat="${c.label}"
          onclick="location.hash='#/category/${c.label}'">
          <span class="cat-list__icon">${SIDEBAR_ICONS[c.label] || ''}</span>
          <span class="cat-list__name">${c.name}</span>
        </button></li>`).join('');
    }

    // ── 顶部导航图标（只插入一次）──
    const headerNav = document.getElementById('headerNav');
    if (headerNav && !headerNav.dataset.built) {
      headerNav.dataset.built = '1';
      this.categories.forEach(c => {
        const btn = document.createElement('button');
        btn.className = 'header__nav-item';
        btn.dataset.cat = c.label;
        btn.innerHTML = `${SIDEBAR_ICONS[c.label] || ''}<span>${c.name}</span>`;
        btn.addEventListener('click', () => {
          location.hash = `#/category/${c.label}`;
        });
        headerNav.appendChild(btn);
      });
    }

    // ── 手机端导航图标（只插入一次）──
    const mobileNav = document.getElementById('mobileNavLinks');
    if (mobileNav && !mobileNav.dataset.built) {
      mobileNav.dataset.built = '1';
      this.categories.forEach(c => {
        const btn = document.createElement('button');
        btn.className = 'mobile-nav-item';
        btn.dataset.cat = c.label;
        btn.innerHTML = `${SIDEBAR_ICONS[c.label] || ''} ${c.name}`;
        btn.onclick = () => { location.hash = `#/category/${c.label}`; this._closeMobileMenu(); };
        mobileNav.appendChild(btn);
      });
    }
  }

  // ── 显示列表页 ─────────────────────────────────────────
  async _showList(category) {
    if (category === 'link')  { await this._showLinks();   return; }
    if (category === 'think') { await this._showTimeline(); return; }

    const main = document.getElementById('main');
    const cat = category ? this.categories.find(c => c.label === category) : null;
    const tagSvg = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>`;
    const tagIndicatorHtml = this.activeTag ? `
      <div class="tag-active-bar">
        <span class="tag-active-bar__label">${tagSvg} ${escapeHtml(this.activeTag)}</span>
        <button class="tag-active-bar__clear" onclick="app._selectTag(null)">✕ 清除筛选</button>
      </div>` : '';

    main.innerHTML = `
      <div class="section-header">
        <h1 class="section-header__title">
          ${this.activeTag ? `${tagSvg} ${escapeHtml(this.activeTag)}` : (cat ? cat.name : '全部文章')}
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

  // ── 思考时间线 ─────────────────────────────────────────
  async _showTimeline() {
    const cat   = this.categories.find(c => c.label === 'think');
    const color = cat ? cat.color : '#d73a49';
    const lbSvg = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-2px"><path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 006 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/></svg>`;
    const main  = document.getElementById('main');

    main.innerHTML = `
      <div class="section-header">
        <h1 class="section-header__title">${lbSvg} ${cat ? cat.name : '思考'}</h1>
        <span class="section-header__sub" id="tlCount">加载中…</span>
      </div>
      <div class="timeline-list" id="timelineList" style="--tl-color:${color}">
        ${Array(5).fill('<div class="tl-skeleton"></div>').join('')}
      </div>`;

    try {
      let all = [], page = 1;
      while (page <= 5) {
        const batch = await this.api.getIssues({ page, perPage: 100, label: 'think' });
        all = all.concat(batch);
        if (batch.length < 100) break;
        page++;
      }

      const tlEl    = document.getElementById('timelineList');
      const countEl = document.getElementById('tlCount');
      if (!all.length) {
        tlEl.innerHTML = renderEmpty('暂无思考，去 GitHub 创建 Issue 开始记录吧！');
        if (countEl) countEl.textContent = '';
        return;
      }
      if (countEl) countEl.textContent = `共 ${all.length} 条`;
      tlEl.innerHTML = renderTimeline(all, this.categories);

      // ── 年/月 筛选栏 ──────────────────────────────────
      const ymMap = {};
      all.forEach(issue => {
        const d = new Date(issue.created_at);
        const y = String(d.getFullYear());
        const m = String(d.getMonth() + 1);
        if (!ymMap[y]) ymMap[y] = new Set();
        ymMap[y].add(m);
      });
      const years = Object.keys(ymMap).sort((a, b) => b - a);

      const filterEl = document.createElement('div');
      filterEl.className = 'tl-filter';
      filterEl.innerHTML = `
        <div class="tl-filter__years" id="tlYears">
          <button class="tl-filter__pill active" data-year="all">全部</button>
          ${years.map(y => `<button class="tl-filter__pill" data-year="${y}">${y}</button>`).join('')}
        </div>
        <div class="tl-filter__months" id="tlMonths"></div>`;
      tlEl.parentElement.insertBefore(filterEl, tlEl);

      let curYear = 'all', curMonth = 'all';
      const applyTlFilter = () => {
        tlEl.querySelectorAll('.tl-item').forEach(el => {
          const showY = curYear === 'all' || el.dataset.year === curYear;
          const showM = curMonth === 'all' || el.dataset.month === curMonth;
          el.style.display = (showY && showM) ? '' : 'none';
        });
      };

      filterEl.querySelector('#tlYears').addEventListener('click', e => {
        const btn = e.target.closest('.tl-filter__pill[data-year]');
        if (!btn) return;
        filterEl.querySelectorAll('#tlYears .tl-filter__pill').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        curYear = btn.dataset.year;
        curMonth = 'all';
        const monthsEl = filterEl.querySelector('#tlMonths');
        if (curYear === 'all') {
          monthsEl.innerHTML = '';
        } else {
          const months = [...ymMap[curYear]].sort((a, b) => a - b);
          monthsEl.innerHTML = `
            <button class="tl-filter__pill tl-filter__pill--sm active" data-month="all">全部</button>
            ${months.map(m => `<button class="tl-filter__pill tl-filter__pill--sm" data-month="${m}">${m}月</button>`).join('')}`;
          monthsEl.onclick = e2 => {
            const mb = e2.target.closest('.tl-filter__pill[data-month]');
            if (!mb) return;
            monthsEl.querySelectorAll('.tl-filter__pill').forEach(b => b.classList.remove('active'));
            mb.classList.add('active');
            curMonth = mb.dataset.month;
            applyTlFilter();
          };
        }
        applyTlFilter();
      });

      tlEl.querySelectorAll('.tl-item').forEach(el => {
        el.addEventListener('click', () => { location.hash = `#/post/${el.dataset.number}`; });
      });
    } catch (e) {
      const tlEl = document.getElementById('timelineList');
      if (tlEl) tlEl.innerHTML = `<div class="error-msg">⚠️ ${e.message}</div>`;
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

  // ── 照片墙 ───────────────────────────────────────────
  async _showPhotos() {
    const main = document.getElementById('main');
    main.innerHTML = `
      <div class="section-header">
        <h1 class="section-header__title"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-2px"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg> 照片墙</h1>
        <span class="section-header__sub" id="photoCount">加载中…</span>
      </div>
      <div class="album-bar" id="albumBar"></div>
      <div class="pw-grid" id="photoWall">
        ${Array(12).fill('<div class="pw-cell"><div class="pw-skeleton"></div></div>').join('')}
      </div>`;

    this._allPhotos = [];
    this._filteredPhotos = [];
    this._selectedYear = null;
    this._selectedMonth = null;
    this._lbIndex = 0;

    try {
      let page = 1, issues = [];
      while (true) {
        const batch = await this.api.getIssues({ page, perPage: 100, label: 'image' });
        issues = issues.concat(batch);
        if (batch.length < 100) break;
        page++;
      }

      issues.forEach(issue => {
        const d = new Date(issue.created_at);
        extractImages(issue.body || '').forEach(src => {
          this._allPhotos.push({
            src, title: issue.title,
            date: formatDate(issue.created_at),
            fullDate: formatFullDate(issue.created_at),
            issueUrl: issue.html_url,
            year: d.getFullYear(), month: d.getMonth() + 1,
          });
        });
      });

      this._filteredPhotos = [...this._allPhotos];
      this._buildAlbumBar();
      this._updatePhotoCount();
      this._renderPhotoWall();
    } catch (e) {
      document.getElementById('photoWall').innerHTML = renderEmpty('加载失败：' + e.message);
    }
  }

  _buildAlbumBar() {
    const bar = document.getElementById('albumBar');
    if (!bar) return;
    const years = [...new Set(this._allPhotos.map(p => p.year))].sort((a, b) => b - a);
    const months = this._selectedYear
      ? [...new Set(this._allPhotos.filter(p => p.year === this._selectedYear).map(p => p.month))].sort((a, b) => a - b)
      : [];

    const yearChips = `
      <button class="album-chip ${!this._selectedYear ? 'album-chip--active' : ''}" onclick="app._selectYear(null)">全部</button>
      ${years.map(y => `<button class="album-chip ${this._selectedYear === y ? 'album-chip--active' : ''}" onclick="app._selectYear(${y})">${y}</button>`).join('')}`;

    const monthRow = months.length > 1 ? `
      <div class="month-bar">
        <button class="album-chip album-chip--sm ${!this._selectedMonth ? 'album-chip--active' : ''}" onclick="app._selectMonth(null)">全部</button>
        ${months.map(m => `<button class="album-chip album-chip--sm ${this._selectedMonth === m ? 'album-chip--active' : ''}" onclick="app._selectMonth(${m})">${m}月</button>`).join('')}
      </div>` : '';

    bar.innerHTML = `<div class="year-bar">${yearChips}</div>${monthRow}`;
  }

  _selectYear(y) { this._selectedYear = y; this._selectedMonth = null; this._buildAlbumBar(); this._applyPhotoFilter(); }
  _selectMonth(m) { this._selectedMonth = m; this._buildAlbumBar(); this._applyPhotoFilter(); }

  _applyPhotoFilter() {
    this._filteredPhotos = this._allPhotos.filter(p => {
      if (this._selectedYear && p.year !== this._selectedYear) return false;
      if (this._selectedMonth && p.month !== this._selectedMonth) return false;
      return true;
    });
    this._updatePhotoCount();
    this._renderPhotoWall();
  }

  _updatePhotoCount() {
    const el = document.getElementById('photoCount');
    if (!el) return;
    const t = this._allPhotos.length, c = this._filteredPhotos.length;
    el.textContent = c < t ? `${c} / ${t} 张` : `共 ${t} 张`;
  }

  _renderPhotoWall() {
    const wall = document.getElementById('photoWall');
    if (!this._filteredPhotos.length) { wall.innerHTML = renderEmpty('暂无图片'); return; }
    wall.innerHTML = this._filteredPhotos.map((p, i) => `
      <div class="pw-cell" onclick="app._openLb(${i})" title="${escapeHtml(p.title)}">
        <div class="pw-skeleton"></div>
        <img class="pw-img" src="${compressImg(p.src, 400)}" alt="${escapeHtml(p.title)}"
          loading="lazy" onload="this.classList.add('loaded')" onerror="this.parentElement.style.display='none'">
        <div class="pw-title-bar"><span class="pw-title">${escapeHtml(p.title)}</span></div>
        <div class="pw-date-bar"><span class="pw-date">${p.date}</span></div>
      </div>`).join('');
  }

  _openLb(i) {
    this._lbIndex = i; this._showLb();
    document.getElementById('photoLightbox').classList.add('open');
    document.body.style.overflow = 'hidden';
  }
  _showLb() {
    const p = this._filteredPhotos[this._lbIndex]; if (!p) return;
    document.getElementById('lbImg').src = p.src;
    document.getElementById('lbTitle').textContent = p.title;
    document.getElementById('lbMeta').innerHTML = `${p.fullDate} · <a href="${p.issueUrl}" target="_blank">GitHub</a>`;
    document.getElementById('lbCounter').textContent = `${this._lbIndex + 1} / ${this._filteredPhotos.length}`;
  }
  _closeLb() { document.getElementById('photoLightbox').classList.remove('open'); document.body.style.overflow = ''; }
  _lbPrev() { this._lbIndex = (this._lbIndex - 1 + this._filteredPhotos.length) % this._filteredPhotos.length; this._showLb(); }
  _lbNext() { this._lbIndex = (this._lbIndex + 1) % this._filteredPhotos.length; this._showLb(); }

  // ── 显示收藏链接页（含主题标签） ──────────────────────
  async _showLinks() {
    const COLORS = ['#3b82f6','#8b5cf6','#06b6d4','#10b981','#f59e0b','#ef4444','#ec4899','#6366f1','#14b8a6','#f97316'];
    const main = document.getElementById('main');
    main.innerHTML = `
      <div class="section-header">
        <h1 class="section-header__title"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-2px"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/></svg> 收藏链接</h1>
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
        <h2 class="section-header__title" style="font-size:1.1rem"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-2px"><path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg> 主题标签</h2>
        <span class="section-header__sub">${this.repoTags.length} 个</span>
      </div>
      <div class="tags-grid-pc">
        ${this.repoTags.map(t => {
          const color = '#' + t.color;
          const count = t.count >= 100 ? '99+' : t.count;
          return `<button class="tag-pc" onclick="app._selectTag('${escapeHtml(t.name)}')"
            style="--tc:${color}">
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
        <h1 class="section-header__title"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-2px"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg> 搜索：${escapeHtml(query)}</h1>
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
