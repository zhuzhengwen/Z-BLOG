/**
 * 照片墙逻辑
 * - 加载所有 image 标签的 Issues
 * - 提取图片并瀑布流展示
 * - 增强版灯箱（前后翻页）
 */

const api = new GitHubAPI(CONFIG);
let allPhotos = [];   // { src, title, date, issueUrl }
let filtered  = [];
let lbIndex   = 0;
let layout    = 'masonry';

// ── 启动 ───────────────────────────────────────────────────
async function init() {
  setSiteRuntime();
  await loadAllPhotos();
  bindFilter();
  bindKeyboard();
}

// ── 加载所有图片（分页拉取所有 image Issues）───────────────
async function loadAllPhotos() {
  const wall = document.getElementById('photoWall');
  wall.innerHTML = `<div class="photos-loading"><div class="photos-loading__spinner"></div><p>正在加载图片…</p></div>`;

  try {
    let page = 1;
    let issues = [];
    // 分页拉取全部 image 类 Issues
    while (true) {
      const batch = await api.getIssues({ page, perPage: 100, label: 'image' });
      issues = issues.concat(batch);
      if (batch.length < 100) break;
      page++;
    }

    if (!issues.length) {
      wall.innerHTML = renderEmpty('暂无图片，请在 GitHub Issues 中创建带 image 标签的帖子');
      document.getElementById('photoCount').textContent = '共 0 张图片';
      return;
    }

    // 提取所有图片
    issues.forEach(issue => {
      const imgs = extractImages(issue.body || '');
      imgs.forEach(src => {
        allPhotos.push({
          src,
          title: issue.title,
          date: formatDate(issue.created_at),
          fullDate: formatFullDate(issue.created_at),
          issueUrl: issue.html_url,
          issueNum: issue.number,
        });
      });
    });

    filtered = [...allPhotos];
    document.getElementById('photoCount').textContent = `共 ${allPhotos.length} 张图片 · ${issues.length} 个相册`;
    renderWall();
  } catch (e) {
    wall.innerHTML = `<div class="error-msg">⚠️ ${e.message}</div>`;
  }
}

// ── 渲染照片墙 ─────────────────────────────────────────────
function renderWall() {
  const wall = document.getElementById('photoWall');
  if (!filtered.length) {
    wall.innerHTML = renderEmpty('没有找到匹配的图片');
    return;
  }

  wall.innerHTML = filtered.map((p, i) => `
    <div class="photo-item" onclick="openLb(${i})" title="${escapeHtml(p.title)}">
      <img src="${p.src}" alt="${escapeHtml(p.title)}" loading="lazy"
           onerror="this.parentElement.style.display='none'">
      <div class="photo-item__overlay">
        <p class="photo-item__title">${escapeHtml(p.title)}</p>
        <p class="photo-item__date">${p.date}</p>
      </div>
    </div>`).join('');
}

// ── 布局切换 ───────────────────────────────────────────────
function setLayout(type) {
  layout = type;
  const wall = document.getElementById('photoWall');
  document.getElementById('btnMasonry').classList.toggle('active', type === 'masonry');
  document.getElementById('btnGrid').classList.toggle('active', type === 'grid');
  wall.className = type === 'grid' ? 'photo-masonry photo-masonry--grid' : 'photo-masonry';
}

// ── 关键词筛选 ─────────────────────────────────────────────
function bindFilter() {
  const input = document.getElementById('filterInput');
  const search = document.getElementById('searchInput');
  const doFilter = (val) => {
    const q = val.trim().toLowerCase();
    filtered = q ? allPhotos.filter(p => p.title.toLowerCase().includes(q)) : [...allPhotos];
    renderWall();
  };
  [input, search].forEach(el => {
    if (el) el.addEventListener('input', e => doFilter(e.target.value));
  });
}

// ── 灯箱 ───────────────────────────────────────────────────
function openLb(index) {
  lbIndex = index;
  showLb();
  document.getElementById('photoLightbox').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function showLb() {
  const p = filtered[lbIndex];
  if (!p) return;
  document.getElementById('lbImg').src = p.src;
  document.getElementById('lbTitle').textContent = p.title;
  document.getElementById('lbMeta').innerHTML =
    `${p.fullDate} · <a href="${p.issueUrl}" target="_blank" rel="noopener" style="color:rgba(255,255,255,.7)">在 GitHub 查看</a>`;
  document.getElementById('lbCounter').textContent = `${lbIndex + 1} / ${filtered.length}`;
}

function closeLb() {
  document.getElementById('photoLightbox').classList.remove('open');
  document.body.style.overflow = '';
}

function lbPrev() {
  lbIndex = (lbIndex - 1 + filtered.length) % filtered.length;
  showLb();
}

function lbNext() {
  lbIndex = (lbIndex + 1) % filtered.length;
  showLb();
}

// ── 键盘控制 ───────────────────────────────────────────────
function bindKeyboard() {
  document.addEventListener('keydown', e => {
    const lb = document.getElementById('photoLightbox');
    if (!lb.classList.contains('open')) return;
    if (e.key === 'ArrowLeft')  { lbPrev(); }
    if (e.key === 'ArrowRight') { lbNext(); }
    if (e.key === 'Escape')     { closeLb(); }
  });
  // 点击背景关闭
  document.getElementById('photoLightbox').addEventListener('click', e => {
    if (e.target === e.currentTarget || e.target.classList.contains('photo-lightbox__img-wrap')) closeLb();
  });
}

// ── 运行时间 ───────────────────────────────────────────────
function setSiteRuntime() {
  const el = document.getElementById('siteRuntime');
  if (!el) return;
  const start = new Date(CONFIG.siteStartDate || '2026-03-26');
  const tick = () => {
    const s = Math.floor((Date.now() - start) / 1000);
    const d = Math.floor(s / 86400), h = Math.floor((s % 86400) / 3600),
          m = Math.floor((s % 3600) / 60),  sec = s % 60;
    el.textContent = `运行 ${d} 天 ${h} 时 ${m} 分 ${sec} 秒`;
  };
  tick(); setInterval(tick, 1000);
}

document.addEventListener('DOMContentLoaded', init);
