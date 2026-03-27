import CONFIG from '../config.js'

// ── 日期 ─────────────────────────────────────────────────
export function formatDate(dateStr) {
  const d = new Date(dateStr), now = new Date()
  const diff = (now - d) / 1000
  if (diff < 60)      return '刚刚'
  if (diff < 3600)    return `${Math.floor(diff / 60)} 分钟前`
  if (diff < 86400)   return `${Math.floor(diff / 3600)} 小时前`
  if (diff < 2592000) return `${Math.floor(diff / 86400)} 天前`
  return d.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })
}

export function formatFullDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('zh-CN', {
    year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
  })
}

// ── 分类 ─────────────────────────────────────────────────
export function getCategoryFromLabels(labels) {
  if (!labels) return null
  for (const lbl of labels) {
    const cat = CONFIG.categories.find(c => c.label === lbl.name)
    if (cat) return cat
  }
  return null
}

export function getTagsFromLabels(labels) {
  if (!labels) return []
  const catLabels = new Set(CONFIG.categories.map(c => c.label))
  return labels.filter(l => !catLabels.has(l.name))
}

// ── 文本处理 ──────────────────────────────────────────────
export function extractExcerpt(markdown = '', maxLen = 100) {
  return markdown
    .replace(/!\[.*?\]\(.*?\)/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/#{1,6}\s/g, '')
    .replace(/[*_`~>]/g, '')
    .replace(/\n+/g, ' ')
    .trim()
    .slice(0, maxLen) + (markdown.length > maxLen ? '…' : '')
}

export function extractImages(markdown = '') {
  const re = /!\[.*?\]\((https?:\/\/[^)]+)\)/g
  const imgs = []; let m
  while ((m = re.exec(markdown)) !== null) imgs.push(m[1])
  return imgs
}

export function extractCover(markdown = '') {
  return extractImages(markdown)[0] || null
}

// ── 从 Markdown 提取视频信息 ──────────────────────────────
export function extractVideos(markdown = '') {
  const videos = []; let m

  const ytRe = /https?:\/\/(?:www\.youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/g
  while ((m = ytRe.exec(markdown)) !== null) {
    videos.push({ type: 'youtube', id: m[1], url: m[0], thumb: `https://img.youtube.com/vi/${m[1]}/hqdefault.jpg` })
  }

  const biliRe = /https?:\/\/(?:www\.)?bilibili\.com\/video\/((?:BV|av)[a-zA-Z0-9]+)/g
  while ((m = biliRe.exec(markdown)) !== null) {
    videos.push({ type: 'bilibili', id: m[1], url: m[0], thumb: null })
  }

  const directRe = /https?:\/\/[^\s\)"']+\.(?:mp4|webm|mov|ogg)(?:\?[^\s\)"']*)?/gi
  while ((m = directRe.exec(markdown)) !== null) {
    videos.push({ type: 'direct', url: m[0], thumb: null })
  }

  return videos
}

// ── 获取缩略图（返回 URL 或 '__video__' 占位）────────────
export function extractThumb(markdown = '', category = null) {
  const isVideo = category && category.label === 'video'
  if (isVideo) {
    const videos = extractVideos(markdown)
    if (videos.length) return videos[0].thumb || '__video__'
  }
  const img = extractCover(markdown)
  if (img) return img
  const videos = extractVideos(markdown)
  if (videos.length) return videos[0].thumb || '__video__'
  return null
}

// ── 简单 Markdown → HTML（用于 rich-text）────────────────
export function simpleMarkdown(text = '') {
  if (!text) return ''
  // 顺序很重要：先处理代码块，再处理行内元素
  let html = text
    // 代码块
    .replace(/```[\w]*\n([\s\S]*?)```/g, (_, code) =>
      `<pre style="background:#1e293b;color:#e2e8f0;padding:12px;border-radius:8px;overflow-x:auto;font-size:13px"><code>${code.replace(/</g,'&lt;').replace(/>/g,'&gt;')}</code></pre>`)
    // 行内代码
    .replace(/`([^`]+)`/g, '<code style="background:#f1f5f9;padding:2px 6px;border-radius:4px;font-size:.875em">$1</code>')
    // 标题
    .replace(/^### (.*$)/gm, '<h3 style="font-size:1.1rem;font-weight:700;margin:1.2em 0 .5em">$1</h3>')
    .replace(/^## (.*$)/gm,  '<h2 style="font-size:1.3rem;font-weight:700;margin:1.4em 0 .6em;padding-bottom:.3em;border-bottom:1px solid #e2e8f0">$1</h2>')
    .replace(/^# (.*$)/gm,   '<h1 style="font-size:1.5rem;font-weight:800;margin:1.4em 0 .6em;padding-bottom:.3em;border-bottom:1px solid #e2e8f0">$1</h1>')
    // 加粗斜体
    .replace(/\*\*\*(.*?)\*\*\*/g, '<strong><em>$1</em></strong>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    // 引用
    .replace(/^&gt; (.*$)/gm, '<blockquote style="border-left:3px solid #2563eb;margin:1em 0;padding:.5em 1em;background:#f1f5f9;color:#64748b;border-radius:0 6px 6px 0">$1</blockquote>')
    .replace(/^> (.*$)/gm, '<blockquote style="border-left:3px solid #2563eb;margin:1em 0;padding:.5em 1em;background:#f1f5f9;color:#64748b;border-radius:0 6px 6px 0">$1</blockquote>')
    // 图片
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" style="max-width:100%;border-radius:8px;margin:.8em 0">')
    // 链接
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" style="color:#2563eb">$1</a>')
    // 无序列表
    .replace(/^[*-] (.*$)/gm, '<li style="margin:.3em 0">$1</li>')
    // 有序列表
    .replace(/^\d+\. (.*$)/gm, '<li style="margin:.3em 0">$1</li>')
    // 水平线
    .replace(/^---$/gm, '<hr style="border:none;border-top:1px solid #e2e8f0;margin:1.5em 0">')
    // 段落
    .replace(/\n\n/g, '</p><p style="margin:0 0 1em">')
    .replace(/\n/g, '<br>')

  return `<p style="margin:0 0 1em;line-height:1.8">${html}</p>`
}

// ── 运行时间 ──────────────────────────────────────────────
export function getRuntimeStr() {
  const start = new Date(CONFIG.siteStartDate || '2026-03-26')
  const s = Math.floor((Date.now() - start) / 1000)
  const d = Math.floor(s / 86400), h = Math.floor((s % 86400) / 3600),
        m = Math.floor((s % 3600) / 60), sec = s % 60
  return `运行 ${d} 天 ${h} 时 ${m} 分 ${sec} 秒`
}
