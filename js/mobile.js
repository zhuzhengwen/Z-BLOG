/**
 * Z-BLOG Mobile PWA App
 * 底部导航 + 文章详情滑入 + 无限滚动
 */

class MobileApp {
  constructor() {
    this.api = new GitHubAPI(CONFIG);
    this.categories = CONFIG.categories;
    this.currentTab = 'home';
    this.homeCategory = null;  // 当前选中的分类筛选
    this.homePage = 1;
    this.homeHasMore = true;
    this.homeLoading = false;
    this._init();
  }

  // ── 初始化 ─────────────────────────────────────────────
  async _init() {
    initMarked();
    this._buildCategoryChips();
    this._buildCategoryGrid();
    this._bindNav();
    this._bindSearch();
    this._bindDetail();
    this._bindLightbox();
    this._bindAbout();
    this._switchTab('home');
    this._loadHomeFirst();
  }

  // ── 构建分类 Chips ─────────────────────────────────────
  _buildCategoryChips() {
    const el = document.getElementById('homeChips');
    if (!el) return;
    el.innerHTML = `
      <button class="m-chip active" data-cat="">全部</button>
      ${this.categories.map(c =>
        `<button class="m-chip" data-cat="${c.label}">${c.icon} ${c.name}</button>`
      ).join('')}`;
    el.querySelectorAll('.m-chip').forEach(btn => {
      btn.addEventListener('click', () => {
        el.querySelectorAll('.m-chip').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.homeCategory = btn.dataset.cat || null;
        this.homePage = 1;
        this.homeHasMore = true;
        document.getElementById('homeList').innerHTML = renderSkeletons(4);
        document.getElementById('loadMoreBtn').style.display = 'none';
        this._loadHomePosts(true);
      });
    });
  }

  // ── 构建分类网格 ───────────────────────────────────────
  _buildCategoryGrid() {
    const el = document.getElementById('catGrid');
    if (!el) return;
    el.innerHTML = this.categories.map(c => `
      <div class="m-cat-card" onclick="mApp.openCategory('${c.label}')">
        <div class="m-cat-card__icon">${c.icon}</div>
        <div class="m-cat-card__name">${c.name}</div>
        <div class="m-cat-card__desc">${c.desc || ''}</div>
      </div>`).join('');
  }

  // ── 底部导航切换 ───────────────────────────────────────
  _bindNav() {
    document.querySelectorAll('.m-nav__item').forEach(item => {
      item.addEventListener('click', () => this._switchTab(item.dataset.tab));
    });
  }

  _switchTab(tab) {
    this.currentTab = tab;
    document.querySelectorAll('.m-page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.m-nav__item').forEach(n => n.classList.remove('active'));
    const page = document.getElementById(`page-${tab}`);
    const nav = document.querySelector(`.m-nav__item[data-tab="${tab}"]`);
    if (page) page.classList.add('active');
    if (nav) nav.classList.add('active');
  }

  // ── 加载首页（首次/刷新）──────────────────────────────
  async _loadHomeFirst() {
    const listEl = document.getElementById('homeList');
    listEl.innerHTML = renderSkeletons(4);
    this.homePage = 1;
    this.homeHasMore = true;
    await this._loadHomePosts(true);
  }

  // ── 加载帖子（追加或替换）────────────────────────────
  async _loadHomePosts(replace = false) {
    if (this.homeLoading) return;
    this.homeLoading = true;
    const listEl = document.getElementById('homeList');
    const moreBtn = document.getElementById('loadMoreBtn');

    try {
      const issues = await this.api.getIssues({
        page: this.homePage,
        perPage: CONFIG.postsPerPage,
        label: this.homeCategory,
      });

      this.homeHasMore = issues.length >= CONFIG.postsPerPage;

      const html = issues.map(i => this._renderMobileCard(i)).join('');
      if (replace) {
        listEl.innerHTML = issues.length ? html : renderEmpty('暂无内容');
      } else {
        listEl.insertAdjacentHTML('beforeend', html);
      }

      // 绑定点击
      listEl.querySelectorAll('.m-post-card[data-number]').forEach(card => {
        if (card._bound) return;
        card._bound = true;
        card.addEventListener('click', () => this.openPost(parseInt(card.dataset.number)));
      });

      if (moreBtn) {
        moreBtn.style.display = issues.length ? 'block' : 'none';
        moreBtn.disabled = !this.homeHasMore;
        moreBtn.textContent = this.homeHasMore ? '加载更多' : '没有更多了';
      }
    } catch (e) {
      const errHtml = `<div class="error-msg">⚠️ ${e.message}</div>`;
      if (replace) listEl.innerHTML = errHtml;
      else listEl.insertAdjacentHTML('beforeend', errHtml);
    } finally {
      this.homeLoading = false;
    }
  }

  loadMore() {
    if (!this.homeHasMore || this.homeLoading) return;
    this.homePage++;
    this._loadHomePosts(false);
  }

  // ── 渲染手机端卡片 ─────────────────────────────────────
  _renderMobileCard(issue) {
    const cat = getCategoryFromLabels(issue.labels, this.categories);
    const tags = getTagsFromLabels(issue.labels, this.categories);
    const cover = extractCover(issue.body);
    const excerpt = extractExcerpt(issue.body, 100);
    const isImgPost = cat && cat.label === 'image';

    return `
    <div class="m-post-card" data-number="${issue.number}">
      ${cover && isImgPost ? `<div class="m-post-card__cover"><img src="${cover}" alt="" loading="lazy"></div>` : ''}
      <div class="m-post-card__body">
        <div class="m-post-card__top">
          ${cat ? `<span class="badge" style="background:${cat.color}18;color:${cat.color};border-color:${cat.color}40">${cat.icon} ${cat.name}</span>` : ''}
          <span class="m-post-card__date">${formatDate(issue.created_at)}</span>
        </div>
        <h2 class="m-post-card__title">${escapeHtml(issue.title)}</h2>
        ${excerpt && !isImgPost ? `<p class="m-post-card__excerpt">${escapeHtml(excerpt)}</p>` : ''}
        <div class="m-post-card__footer">
          <div class="m-post-card__tags">${tags.slice(0, 2).map(t => `<span class="tag">${t.name}</span>`).join('')}</div>
          <span class="m-post-card__stats">💬 ${issue.comments}</span>
        </div>
      </div>
    </div>`;
  }

  // ── 打开文章详情 ───────────────────────────────────────
  async openPost(number) {
    const detail = document.getElementById('mDetail');
    const content = document.getElementById('mDetailContent');
    const barTitle = document.getElementById('mDetailBarTitle');
    const ghBtn = document.getElementById('mDetailGhBtn');

    content.innerHTML = renderSkeletons(2);
    barTitle.textContent = '加载中…';
    detail.classList.add('open');
    document.body.style.overflow = 'hidden';
    detail.scrollTop = 0;

    try {
      const issue = await this.api.getIssue(number);
      barTitle.textContent = issue.title;
      if (ghBtn) ghBtn.onclick = () => window.open(issue.html_url, '_blank');

      const cat = getCategoryFromLabels(issue.labels, this.categories);
      const tags = getTagsFromLabels(issue.labels, this.categories);
      const isImagePost = cat && cat.label === 'image';
      const isLinkPost = cat && cat.label === 'link';

      let bodyContent = '';
      if (isImagePost) {
        const imgs = extractImages(issue.body || '');
        bodyContent = renderImageGallery(imgs) + renderMarkdown(issue.body);
      } else if (isLinkPost) {
        bodyContent = renderLinkCards(issue.body || '') + renderMarkdown(issue.body);
      } else {
        bodyContent = renderMarkdown(issue.body || '');
      }

      content.innerHTML = `
        <div class="m-detail__header">
          <div class="m-detail__badges">
            ${cat ? `<span class="badge" style="background:${cat.color}18;color:${cat.color};border-color:${cat.color}40">${cat.icon} ${cat.name}</span>` : ''}
            ${tags.map(t => `<span class="tag">${t.name}</span>`).join('')}
          </div>
          <h1 class="m-detail__title">${escapeHtml(issue.title)}</h1>
          <div class="m-detail__meta">
            <img class="m-detail__avatar" src="${issue.user.avatar_url}&s=48" alt="">
            <span>${issue.user.login}</span>
            <span>·</span>
            <time>${formatDate(issue.created_at)}</time>
            <span>·</span>
            <span>💬 ${issue.comments}</span>
          </div>
        </div>
        <div class="m-detail__content markdown-body">${bodyContent}</div>
        <div style="padding:20px 16px;text-align:center">
          <a href="${issue.html_url}" target="_blank" rel="noopener"
             style="display:inline-block;padding:11px 24px;border:1.5px solid var(--primary);border-radius:8px;color:var(--primary);font-size:.875rem;font-weight:500">
            💬 在 GitHub 参与讨论 (${issue.comments})
          </a>
        </div>`;

      if (typeof hljs !== 'undefined') {
        content.querySelectorAll('pre code').forEach(el => hljs.highlightElement(el));
      }
    } catch (e) {
      content.innerHTML = `<div class="error-msg" style="margin:16px">⚠️ ${e.message}</div>`;
    }
  }

  closePost() {
    const detail = document.getElementById('mDetail');
    detail.classList.remove('open');
    document.body.style.overflow = '';
  }

  // ── 分类页点击卡片 ─────────────────────────────────────
  openCategory(label) {
    const chip = document.querySelector(`#homeChips .m-chip[data-cat="${label}"]`);
    this._switchTab('home');
    if (chip) chip.click();
    else {
      this.homeCategory = label;
      this.homePage = 1;
      this.homeHasMore = true;
      this._loadHomeFirst();
    }
  }

  // ── 搜索 ───────────────────────────────────────────────
  _bindSearch() {
    const input = document.getElementById('mSearchInput');
    const btn = document.getElementById('mSearchBtn');
    if (!input || !btn) return;
    const go = async () => {
      const q = input.value.trim();
      if (!q) return;
      const resultEl = document.getElementById('mSearchResult');
      resultEl.innerHTML = renderSkeletons(3);
      try {
        const { items } = await this.api.searchIssues(q);
        if (!items.length) { resultEl.innerHTML = renderEmpty(`未找到 "${escapeHtml(q)}" 相关内容`); return; }
        resultEl.innerHTML = items.map(i => this._renderMobileCard(i)).join('');
        resultEl.querySelectorAll('.m-post-card').forEach(card => {
          card.addEventListener('click', () => this.openPost(parseInt(card.dataset.number)));
        });
      } catch (e) {
        resultEl.innerHTML = `<div class="error-msg" style="margin:12px">⚠️ ${e.message}</div>`;
      }
    };
    btn.addEventListener('click', go);
    input.addEventListener('keydown', e => { if (e.key === 'Enter') { go(); input.blur(); } });
  }

  // ── 关于页 ─────────────────────────────────────────────
  _bindAbout() {
    this._loadAbout();
    this._startRuntime();
  }

  _startRuntime() {
    const el = document.getElementById('mRuntime');
    if (!el) return;
    const start = new Date(CONFIG.siteStartDate || '2026-03-26');
    const tick = () => {
      const s = Math.floor((Date.now() - start) / 1000);
      const d = Math.floor(s / 86400), h = Math.floor((s % 86400) / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
      el.textContent = `运行 ${d} 天 ${h} 时 ${m} 分 ${sec} 秒`;
    };
    tick(); setInterval(tick, 1000);
  }

  async _loadAbout() {
    const el = document.getElementById('aboutContent');
    if (!el) return;
    try {
      const repo = await this.api.getRepoInfo();
      el.innerHTML = `
        <img class="m-about__avatar" src="${repo.owner.avatar_url}&s=160" alt="">
        <p class="m-about__name">${CONFIG.siteTitle}</p>
        <p class="m-about__desc">${repo.description || CONFIG.siteDesc}</p>
        <div class="m-about__stats">
          <div class="m-about__stat">
            <div class="m-about__stat-num">⭐ ${repo.stargazers_count}</div>
            <div class="m-about__stat-label">Stars</div>
          </div>
          <div class="m-about__stat">
            <div class="m-about__stat-num">🍴 ${repo.forks_count}</div>
            <div class="m-about__stat-label">Forks</div>
          </div>
          <div class="m-about__stat">
            <div class="m-about__stat-num">👀 ${repo.watchers_count}</div>
            <div class="m-about__stat-label">Watchers</div>
          </div>
        </div>
        <div class="m-about__links">
          <a class="m-about__link" href="${repo.html_url}" target="_blank">
            <span class="m-about__link-icon">📦</span>
            <span class="m-about__link-text">GitHub 仓库</span>
            <span class="m-about__link-arrow">›</span>
          </a>
          <a class="m-about__link" href="${repo.html_url}/issues/new" target="_blank">
            <span class="m-about__link-icon">✏️</span>
            <span class="m-about__link-text">发布新文章</span>
            <span class="m-about__link-arrow">›</span>
          </a>
          <a class="m-about__link" href="photos.html">
            <span class="m-about__link-icon">🖼️</span>
            <span class="m-about__link-text">照片墙</span>
            <span class="m-about__link-arrow">›</span>
          </a>
          <a class="m-about__link" href="index.html">
            <span class="m-about__link-icon">🖥️</span>
            <span class="m-about__link-text">切换桌面版</span>
            <span class="m-about__link-arrow">›</span>
          </a>
        </div>
        <div style="margin-top:20px;padding:14px 16px;background:var(--surface-2);border-radius:10px;text-align:center;font-size:.8rem;color:var(--text-muted)">
          <p id="mRuntime" style="margin-bottom:4px"></p>
          <p>
            访客 <span id="busuanzi_value_site_uv">-</span> 人 ·
            浏览 <span id="busuanzi_value_site_pv">-</span> 次
          </p>
        </div>`;
    } catch (e) {
      el.innerHTML = `
        <p class="m-about__name">${CONFIG.siteTitle}</p>
        <p class="m-about__desc">${CONFIG.siteDesc}</p>
        <div class="m-about__links">
          <a class="m-about__link" href="https://github.com/${CONFIG.owner}/${CONFIG.repo}/issues/new" target="_blank">
            <span class="m-about__link-icon">✏️</span>
            <span class="m-about__link-text">发布新文章</span>
            <span class="m-about__link-arrow">›</span>
          </a>
        </div>`;
    }
  }

  // ── 详情页绑定 ─────────────────────────────────────────
  _bindDetail() {
    const back = document.getElementById('mDetailBack');
    if (back) back.addEventListener('click', () => this.closePost());
    // 滑动返回（右划）
    const detail = document.getElementById('mDetail');
    if (!detail) return;
    let startX = 0;
    detail.addEventListener('touchstart', e => { startX = e.touches[0].clientX; }, { passive: true });
    detail.addEventListener('touchend', e => {
      if (e.changedTouches[0].clientX - startX > 80 && detail.scrollTop === 0) this.closePost();
    }, { passive: true });
  }

  // ── 灯箱 ───────────────────────────────────────────────
  _bindLightbox() {
    const lb = document.getElementById('lightbox');
    if (!lb) return;
    lb.addEventListener('click', e => {
      if (e.target === lb || e.target.classList.contains('lightbox__close')) closeLightbox();
    });
  }
}

// ── 启动 ───────────────────────────────────────────────────
let mApp;
document.addEventListener('DOMContentLoaded', () => {
  if (!CONFIG.owner || CONFIG.owner === 'your-username') {
    document.querySelector('.m-page#page-home').innerHTML = `
      <div class="error-msg" style="margin:20px;padding:28px;text-align:center">
        <p style="font-size:2rem;margin-bottom:10px">⚙️</p>
        <p><strong>请先配置 config.js</strong></p>
        <p style="margin-top:8px;font-size:.8rem">设置 owner 和 repo 后刷新</p>
      </div>`;
    return;
  }
  mApp = new MobileApp();
});

// ── Toast ─────────────────────────────────────────────────
function showToast(msg, duration = 2500) {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  t.classList.add('toast--show');
  setTimeout(() => t.classList.remove('toast--show'), duration);
}
