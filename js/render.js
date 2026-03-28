/**
 * 渲染工具集
 * - Markdown 渲染（依赖 marked.js CDN）
 * - 日期格式化
 * - 文章卡片、详情、图片画廊、视频嵌入
 */

// ── 通用图片压缩代理 ────────────────────────────────────────
function compressImg(url, width = 400, quality = 80) {
  if (!url || url.startsWith('data:')) return url;
  if (url.includes('user-images.githubusercontent.com')) {
    return url + (url.includes('?') ? '&' : '?') + `width=${width}`;
  }
  return `https://wsrv.nl/?url=${encodeURIComponent(url)}&w=${width}&q=${quality}&output=webp`;
}

// 配置 marked.js
function initMarked() {
  if (typeof marked === 'undefined') return;
  marked.setOptions({
    breaks: true,
    gfm: true,
    highlight: function (code, lang) {
      if (typeof hljs !== 'undefined' && lang && hljs.getLanguage(lang)) {
        return hljs.highlight(code, { language: lang }).value;
      }
      return typeof hljs !== 'undefined' ? hljs.highlightAuto(code).value : code;
    },
  });
}

// ── 日期 ────────────────────────────────────────────────────
function formatDate(dateStr) {
  const d = new Date(dateStr);
  const now = new Date();
  const diff = (now - d) / 1000;
  if (diff < 60) return '刚刚';
  if (diff < 3600) return `${Math.floor(diff / 60)} 分钟前`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} 小时前`;
  if (diff < 2592000) return `${Math.floor(diff / 86400)} 天前`;
  return d.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' });
}

function formatFullDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('zh-CN', {
    year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
  });
}

// ── 分类 ────────────────────────────────────────────────────
function getCategoryFromLabels(labels, categories) {
  if (!labels || !categories) return null;
  for (const lbl of labels) {
    const cat = categories.find(c => c.label === lbl.name);
    if (cat) return cat;
  }
  return null;
}

function getTagsFromLabels(labels, categories) {
  if (!labels) return [];
  const catLabels = new Set((categories || []).map(c => c.label));
  return labels.filter(l => !catLabels.has(l.name));
}

// ── Markdown 渲染 ────────────────────────────────────────────
function renderMarkdown(text) {
  if (!text) return '';
  if (typeof marked === 'undefined') return `<p>${text.replace(/\n/g, '<br>')}</p>`;
  return marked.parse(text);
}

// ── 从 Markdown 提取摘要 ─────────────────────────────────────
function extractExcerpt(markdown, maxLen = 120) {
  if (!markdown) return '';
  const text = markdown
    .replace(/!\[.*?\]\(.*?\)/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/#{1,6}\s/g, '')
    .replace(/[*_`~>]/g, '')
    .replace(/\n+/g, ' ')
    .trim();
  return text.length > maxLen ? text.slice(0, maxLen) + '…' : text;
}

// ── 从 Markdown 提取图片 URL ──────────────────────────────────
function extractImages(markdown) {
  if (!markdown) return [];
  const re = /!\[.*?\]\((https?:\/\/[^)]+)\)/g;
  const imgs = [];
  let m;
  while ((m = re.exec(markdown)) !== null) imgs.push(m[1]);
  return imgs;
}

// ── 从 Markdown 提取视频信息 ─────────────────────────────────
function extractVideos(markdown) {
  if (!markdown) return [];
  const videos = [];
  let m;

  // YouTube: youtube.com/watch?v=xxx 或 youtu.be/xxx
  const ytRe = /https?:\/\/(?:www\.youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/g;
  while ((m = ytRe.exec(markdown)) !== null) {
    videos.push({ type: 'youtube', id: m[1], url: m[0], thumb: `https://img.youtube.com/vi/${m[1]}/hqdefault.jpg` });
  }

  // Bilibili: bilibili.com/video/BVxxx 或 avxxx
  const biliRe = /https?:\/\/(?:www\.)?bilibili\.com\/video\/((?:BV|av)[a-zA-Z0-9]+)/g;
  while ((m = biliRe.exec(markdown)) !== null) {
    videos.push({ type: 'bilibili', id: m[1], url: m[0], thumb: null });
  }

  // 直链视频：.mp4 .webm .mov .ogg
  const directRe = /https?:\/\/[^\s\)"']+\.(?:mp4|webm|mov|ogg|m3u8)(?:\?[^\s\)"']*)?/gi;
  while ((m = directRe.exec(markdown)) !== null) {
    videos.push({ type: 'direct', url: m[0], thumb: null });
  }

  return videos;
}

// ── 文章封面图（Markdown 中第一张图）────────────────────────
function extractCover(markdown) {
  const imgs = extractImages(markdown);
  return imgs[0] || null;
}

// ── 获取列表缩略图（图片/视频封面）──────────────────────────
function extractThumb(markdown, category) {
  if (!markdown) return null;
  const isVideo = category && category.label === 'video';
  if (isVideo) {
    const videos = extractVideos(markdown);
    if (videos.length) {
      if (videos[0].thumb) return { type: 'image', src: videos[0].thumb };
      return { type: 'video', src: null };
    }
  }
  const img = extractCover(markdown);
  if (img) return { type: 'image', src: img };
  if (!isVideo) {
    const videos = extractVideos(markdown);
    if (videos.length) {
      if (videos[0].thumb) return { type: 'image', src: videos[0].thumb };
      return { type: 'video', src: null };
    }
  }
  return null;
}

// ── 视频嵌入播放器 ────────────────────────────────────────────
function renderVideoEmbed(video) {
  if (video.type === 'youtube') {
    return `<div class="video-embed">
      <iframe src="https://www.youtube.com/embed/${video.id}" frameborder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowfullscreen loading="lazy"></iframe>
    </div>`;
  } else if (video.type === 'bilibili') {
    const bvid = video.id.startsWith('BV') ? video.id : null;
    const avid = video.id.startsWith('av') ? video.id.slice(2) : null;
    const param = bvid ? `bvid=${bvid}` : `aid=${avid}`;
    return `<div class="video-embed">
      <iframe src="https://player.bilibili.com/player.html?${param}&autoplay=0&high_quality=1"
        frameborder="0" allowfullscreen scrolling="no" loading="lazy"></iframe>
    </div>`;
  } else {
    return `<div class="video-embed video-embed--direct">
      <video src="${video.url}" controls preload="metadata" playsinline></video>
    </div>`;
  }
}

// ── 渲染 Markdown 中所有视频嵌入 ─────────────────────────────
function renderVideosFromMarkdown(markdown) {
  if (!markdown) return '';
  const videos = extractVideos(markdown);
  if (!videos.length) return '';
  return `<div class="video-list">${videos.map(renderVideoEmbed).join('')}</div>`;
}

// ── 标签徽章 ─────────────────────────────────────────────────
function renderCategoryBadge(cat) {
  if (!cat) return '';
  return `<span class="badge" style="background:${cat.color}20;color:${cat.color};border-color:${cat.color}40">
    ${cat.icon} ${cat.name}
  </span>`;
}

function renderTagBadge(tag) {
  const color = tag.color ? `#${tag.color}` : '#64748b';
  return `<span class="tag" style="border-color:${color}40;color:${color}">${tag.name}</span>`;
}

// ── 文章卡片（朋友圈风格）────────────────────────────────────
function renderPostCard(issue, categories) {
  const cat     = getCategoryFromLabels(issue.labels, categories);
  const tags    = getTagsFromLabels(issue.labels, categories);
  const imgs    = extractImages(issue.body || '');
  const videos  = extractVideos(issue.body || '');
  const login   = issue.user.login;
  const avatar  = issue.user.avatar_url + '&s=80';

  // 媒体列表：正文图片优先，否则取视频封面
  let mediaList = imgs.slice(0, 9);
  if (!mediaList.length && videos.length && videos[0].thumb) {
    mediaList = [videos[0].thumb];
  }

  // 摘要（无图时显示）
  const excerpt = !mediaList.length ? extractExcerpt(issue.body) : '';

  // 图片九宫格
  let gridHtml = '';
  if (mediaList.length) {
    const n = mediaList.length;
    const cls = n === 1 ? 'one' : n === 2 ? 'two' : n === 3 ? 'three' : n === 4 ? 'four' : 'many';
    gridHtml = `<div class="moment-grid moment-grid--${cls}">
      ${mediaList.map((src, i) => `
        <div class="moment-grid__item" onclick="openLightbox('${src}', ${i})">
          <img src="${compressImg(src, 480)}" alt="" loading="lazy" data-full="${src}">
        </div>`).join('')}
    </div>`;
  }

  // 徽章行
  const badgesHtml = [
    cat ? renderCategoryBadge(cat) : '',
    ...tags.slice(0, 2).map(renderTagBadge),
  ].filter(Boolean).join('');

  return `
  <article class="moment-card" data-number="${issue.number}">
    <img class="moment-card__avatar" src="${avatar}" alt="${escapeHtml(login)}" loading="lazy">
    <div class="moment-card__main">
      <div class="moment-card__name">${escapeHtml(login)}</div>
      <div class="moment-card__title">${escapeHtml(issue.title)}</div>
      ${excerpt ? `<div class="moment-card__excerpt">${escapeHtml(excerpt)}</div>` : ''}
      ${gridHtml}
      ${badgesHtml ? `<div class="moment-card__badges">${badgesHtml}</div>` : ''}
      <div class="moment-card__footer">
        <time class="moment-card__date">${formatDate(issue.created_at)}</time>
        <span class="moment-card__comments">💬 ${issue.comments}</span>
      </div>
    </div>
  </article>`;
}

// ── 图片分类的网格展示 ────────────────────────────────────────
function renderImageGallery(images) {
  if (!images.length) return '';
  return `<div class="image-gallery">
    ${images.map((src, i) => `
      <div class="image-gallery__item" onclick="openLightbox('${src}', ${i})">
        <img src="${compressImg(src, 600)}" loading="lazy" alt="图片 ${i + 1}" data-full="${src}">
      </div>
    `).join('')}
  </div>`;
}

// ── 链接卡片（link 分类）─────────────────────────────────────
function renderLinkCards(markdown) {
  const re = /\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g;
  const links = [];
  let m;
  while ((m = re.exec(markdown)) !== null) links.push({ title: m[1], url: m[2] });
  if (!links.length) return '';
  return `<div class="link-cards">
    ${links.map(l => `
      <a class="link-card" href="${l.url}" target="_blank" rel="noopener noreferrer">
        <span class="link-card__icon">🔗</span>
        <span class="link-card__title">${escapeHtml(l.title)}</span>
        <span class="link-card__host">${new URL(l.url).hostname}</span>
      </a>
    `).join('')}
  </div>`;
}

// ── 帖子详情 ─────────────────────────────────────────────────
function renderPostDetail(issue, categories) {
  const cat = getCategoryFromLabels(issue.labels, categories);
  const tags = getTagsFromLabels(issue.labels, categories);
  const isImagePost = cat && cat.label === 'image';
  const isLinkPost = cat && cat.label === 'link';
  const isVideoPost = cat && cat.label === 'video';

  // 从正文剥离视频链接，避免嵌入播放器下方再出现裸链接
  function stripVideoUrls(text) {
    return (text || '')
      .replace(/https?:\/\/(?:www\.)?youtube\.com\/watch[^\s\n\])"<]*/g, '')
      .replace(/https?:\/\/youtu\.be\/[^\s\n\])"<]*/g, '')
      .replace(/https?:\/\/(?:www\.)?bilibili\.com\/video\/[^\s\n\])"<]*/g, '')
      .replace(/https?:\/\/[^\s\n\])"<]+\.(?:mp4|webm|mov|ogg)(?:\?[^\s\n\])"<]*)?/gi, '')
      .replace(/\n{3,}/g, '\n\n').trim();
  }

  let content = '';
  if (isVideoPost) {
    content = renderVideosFromMarkdown(issue.body) + renderMarkdown(stripVideoUrls(issue.body));
  } else if (isImagePost) {
    const imgs = extractImages(issue.body || '');
    content = renderImageGallery(imgs) + renderMarkdown(issue.body);
  } else if (isLinkPost) {
    content = renderLinkCards(issue.body || '') + renderMarkdown(issue.body);
  } else {
    content = renderMarkdown(issue.body || '');
  }

  return `
  <article class="post-detail">
    <header class="post-detail__header">
      <div class="post-detail__badges">
        ${renderCategoryBadge(cat)}
        ${tags.map(renderTagBadge).join('')}
      </div>
      <h1 class="post-detail__title">${escapeHtml(issue.title)}</h1>
      <div class="post-detail__meta">
        <img class="post-detail__avatar" src="${issue.user.avatar_url}&s=40" alt="${issue.user.login}">
        <span>${issue.user.login}</span>
        <span>·</span>
        <time title="${formatFullDate(issue.created_at)}">${formatDate(issue.created_at)}</time>
        <span>·</span>
        <span>💬 ${issue.comments} 条评论</span>
        <a class="post-detail__github-link" href="${issue.html_url}" target="_blank" rel="noopener">
          在 GitHub 查看
        </a>
      </div>
    </header>
    <div class="post-detail__content markdown-body">
      ${content}
    </div>
    <footer class="post-detail__footer">
      <a class="btn btn--outline" href="${issue.html_url}" target="_blank" rel="noopener">
        💬 在 GitHub 参与讨论 (${issue.comments})
      </a>
    </footer>
  </article>`;
}

// ── 空状态 ────────────────────────────────────────────────────
function renderEmpty(msg = '暂无内容') {
  return `<div class="empty-state"><span class="empty-state__icon">📭</span><p>${msg}</p></div>`;
}

// ── 骨架屏 ────────────────────────────────────────────────────
function renderSkeletons(count = 5) {
  return Array(count).fill(0).map(() => `
    <div class="skeleton-card">
      <div class="skeleton skeleton--line skeleton--short"></div>
      <div class="skeleton skeleton--line"></div>
      <div class="skeleton skeleton--line skeleton--medium"></div>
    </div>`).join('');
}

// ── 分页 ─────────────────────────────────────────────────────
function renderPagination(page, hasNext) {
  return `
  <div class="pagination">
    <button class="btn btn--ghost" onclick="app.prevPage()" ${page <= 1 ? 'disabled' : ''}>← 上一页</button>
    <span class="pagination__page">第 ${page} 页</span>
    <button class="btn btn--ghost" onclick="app.nextPage()" ${!hasNext ? 'disabled' : ''}>下一页 →</button>
  </div>`;
}

// ── 工具函数 ──────────────────────────────────────────────────
function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// ── 灯箱 ─────────────────────────────────────────────────────
function openLightbox(src, index) {
  const lb = document.getElementById('lightbox');
  if (!lb) return;
  lb.querySelector('img').src = src;
  lb.classList.add('lightbox--open');
  document.body.style.overflow = 'hidden';
}

function closeLightbox() {
  const lb = document.getElementById('lightbox');
  if (!lb) return;
  lb.classList.remove('lightbox--open');
  document.body.style.overflow = '';
}
