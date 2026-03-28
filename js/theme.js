/**
 * PC 端主题颜色管理
 * - 预设颜色 + localStorage 持久化
 * - 覆盖 CSS 变量 --primary / --primary-hover / --text-link
 */

const THEME_KEY = 'zblog_theme_color'
const DEFAULT   = '#2563eb'

const PRESETS = [
  { name: '深蓝', color: '#2563eb' },
  { name: '紫色', color: '#7c3aed' },
  { name: '青色', color: '#0891b2' },
  { name: '绿色', color: '#16a34a' },
  { name: '橙色', color: '#ea580c' },
  { name: '玫红', color: '#e11d48' },
  { name: '深灰', color: '#334155' },
  { name: '棕色', color: '#92400e' },
]

function darken(hex, pct = 15) {
  const num = parseInt(hex.slice(1), 16)
  const r = Math.max(0, (num >> 16)        - Math.round(2.55 * pct))
  const g = Math.max(0, ((num >> 8) & 0xff) - Math.round(2.55 * pct))
  const b = Math.max(0, (num & 0xff)        - Math.round(2.55 * pct))
  return '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('')
}

function applyColor(color) {
  const root = document.documentElement
  root.style.setProperty('--primary',       color)
  root.style.setProperty('--primary-hover', darken(color))
  root.style.setProperty('--text-link',     color)
}

function getColor() {
  return localStorage.getItem(THEME_KEY) || DEFAULT
}

function saveColor(color) {
  localStorage.setItem(THEME_KEY, color)
  applyColor(color)
}

// ── 渲染色板弹出面板 ─────────────────────────────────────────
function renderPicker() {
  const current = getColor()
  const dots = PRESETS.map(p => `
    <button
      class="theme-dot${p.color === current ? ' theme-dot--active' : ''}"
      style="background:${p.color}"
      title="${p.name}"
      onclick="window.__zblogTheme.pick('${p.color}')">
    </button>`).join('')

  return `<div class="theme-panel">
    <span class="theme-panel__label">🎨 主题颜色</span>
    <div class="theme-dots">${dots}</div>
  </div>`
}

function pick(color) {
  saveColor(color)
  // 更新选中态
  document.querySelectorAll('.theme-dot').forEach(el => {
    el.classList.toggle('theme-dot--active', el.style.background === color || el.style.backgroundColor === color)
  })
}

// ── 注入 DOM ─────────────────────────────────────────────────
function init() {
  applyColor(getColor())

  const container = document.createElement('div')
  container.innerHTML = renderPicker()
  // 插入 footer 内部
  const footer = document.querySelector('.footer .container')
  if (footer) {
    footer.insertAdjacentElement('beforeend', container.firstElementChild)
  }
}

window.__zblogTheme = { pick, getColor }
document.addEventListener('DOMContentLoaded', init)
