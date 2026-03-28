/**
 * 照片墙逻辑
 * - 加载所有 image 标签的 Issues
 * - 年份 + 月份双层筛选 + 关键词搜索
 * - 方形九宫格展示，骨架加载，增强版灯箱
 */

const api = new GitHubAPI(CONFIG);
let allPhotos     = [];   // { src, title, date, fullDate, issueUrl, issueNum, year, month }
let filtered      = [];
let selectedYear  = null;
let selectedMonth = null;
let lbIndex       = 0;

// ── 通用图片压缩代理 ────────────────────────────────────────
function compressImg(url, width = 400, quality = 80) {
  if (!url || url.startsWith('data:')) return url;
  if (url.includes('user-images.githubusercontent.com')) {
    return url + (url.includes('?') ? '&' : '?') + `width=${width}`;
  }
  return `https://wsrv.nl/?url=${encodeURIComponent(url)}&w=${width}&q=${quality}&output=webp`;
}
function thumbUrl(src) { return compressImg(src, 400); }

// ── 启动 ───────────────────────────────────────────────────
async function init() {
  setSiteRuntime();
  await loadAllPhotos();
  bindFilter();
  bindKeyboard();
}

// ── 加载所有图片 ────────────────────────────────────────────
async function loadAllPhotos() {
  const wall = document.getElementById('photoWall');
  try {
    let page = 1, issues = [];
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

    issues.forEach(issue => {
      const d = new Date(issue.created_at);
      extractImages(issue.body || '').forEach(src => {
        allPhotos.push({
          src,
          title:    issue.title,
          date:     formatDate(issue.created_at),
          fullDate: formatFullDate(issue.created_at),
          issueUrl: issue.html_url,
          issueNum: issue.number,
          year:     d.getFullYear(),
          month:    d.getMonth() + 1,
        });
      });
    });

    filtered = [...allPhotos];
    buildFilterBar();
    updateCount();
    renderWall();
  } catch (e) {
    wall.innerHTML = `<div class="error-msg">⚠️ ${e.message}</div>`;
  }
}

// ── 构建年份/月份筛选条 ─────────────────────────────────────
function buildFilterBar() {
  const bar = document.getElementById('albumBar');
  if (!bar) return;

  // 年份（降序）
  const years = [...new Set(allPhotos.map(p => p.year))].sort((a, b) => b - a);

  // 当前年下的月份
  const months = selectedYear
    ? [...new Set(allPhotos.filter(p => p.year === selectedYear).map(p => p.month))].sort((a, b) => a - b)
    : [];

  const yearChips = `
    <button class="album-chip ${!selectedYear ? 'album-chip--active' : ''}" onclick="selectYear(null)">
      全部年份
    </button>
    ${years.map(y => `
      <button class="album-chip ${selectedYear === y ? 'album-chip--active' : ''}" onclick="selectYear(${y})">
        ${y} 年
      </button>`).join('')}
  `;

  const monthRow = months.length > 1 ? `
    <div class="month-bar">
      <button class="album-chip album-chip--sm ${!selectedMonth ? 'album-chip--active' : ''}"
        onclick="selectMonth(null)">全部月份</button>
      ${months.map(m => `
        <button class="album-chip album-chip--sm ${selectedMonth === m ? 'album-chip--active' : ''}"
          onclick="selectMonth(${m})">${m} 月</button>`).join('')}
    </div>` : '';

  bar.innerHTML = `<div class="year-bar">${yearChips}</div>${monthRow}`;
}

function selectYear(y) {
  selectedYear  = y;
  selectedMonth = null;
  buildFilterBar();
  applyFilter();
}

function selectMonth(m) {
  selectedMonth = m;
  buildFilterBar();
  applyFilter();
}

// ── 筛选（年 + 月 + 关键词）──────────────────────────────
function applyFilter() {
  const el = document.getElementById('filterInput') || document.getElementById('searchInput');
  const q  = el ? el.value.trim().toLowerCase() : '';

  filtered = allPhotos.filter(p => {
    if (selectedYear  && p.year  !== selectedYear)  return false;
    if (selectedMonth && p.month !== selectedMonth) return false;
    if (q && !p.title.toLowerCase().includes(q))   return false;
    return true;
  });
  updateCount();
  renderWall();
}

function updateCount() {
  const el = document.getElementById('photoCount');
  if (!el) return;
  const total = allPhotos.length;
  const cur   = filtered.length;
  el.textContent = cur < total
    ? `${cur} / ${total} 张图片`
    : `共 ${total} 张图片`;
}

// ── 渲染九宫格 ─────────────────────────────────────────────
function renderWall() {
  const wall = document.getElementById('photoWall');
  if (!filtered.length) {
    wall.innerHTML = renderEmpty('没有找到匹配的图片');
    return;
  }
  wall.innerHTML = filtered.map((p, i) => `
    <div class="pw-cell" onclick="openLb(${i})" title="${escapeHtml(p.title)}">
      <div class="pw-skeleton"></div>
      <img class="pw-img" src="${thumbUrl(p.src)}" alt="${escapeHtml(p.title)}"
        loading="lazy"
        onload="this.classList.add('loaded')"
        onerror="this.parentElement.style.display='none'">
      <div class="pw-title-bar"><span class="pw-title">${escapeHtml(p.title)}</span></div>
      <div class="pw-date-bar"><span class="pw-date">${p.date}</span></div>
    </div>`).join('');
}

// ── 关键词绑定 ─────────────────────────────────────────────
function bindFilter() {
  [document.getElementById('filterInput'), document.getElementById('searchInput')]
    .forEach(el => { if (el) el.addEventListener('input', applyFilter); });
}

// ── 灯箱 ───────────────────────────────────────────────────
function openLb(index) {
  lbIndex = index; showLb();
  document.getElementById('photoLightbox').classList.add('open');
  document.body.style.overflow = 'hidden';
}
function showLb() {
  const p = filtered[lbIndex]; if (!p) return;
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
function lbPrev() { lbIndex = (lbIndex - 1 + filtered.length) % filtered.length; showLb(); }
function lbNext() { lbIndex = (lbIndex + 1) % filtered.length; showLb(); }

function bindKeyboard() {
  document.addEventListener('keydown', e => {
    const lb = document.getElementById('photoLightbox');
    if (!lb.classList.contains('open')) return;
    if (e.key === 'ArrowLeft')  lbPrev();
    if (e.key === 'ArrowRight') lbNext();
    if (e.key === 'Escape')     closeLb();
  });
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
          m = Math.floor((s % 3600) / 60), sec = s % 60;
    el.textContent = `运行 ${d} 天 ${h} 时 ${m} 分 ${sec} 秒`;
  };
  tick(); setInterval(tick, 1000);
}

document.addEventListener('DOMContentLoaded', init);
