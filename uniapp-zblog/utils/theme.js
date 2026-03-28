/**
 * 主题颜色管理
 * 预设颜色 + localStorage 持久化 + 全局事件通知
 */

export const THEME_PRESETS = [
  { name: '深蓝', color: '#2563eb' },
  { name: '紫色', color: '#7c3aed' },
  { name: '青色', color: '#0891b2' },
  { name: '绿色', color: '#16a34a' },
  { name: '橙色', color: '#ea580c' },
  { name: '玫红', color: '#e11d48' },
  { name: '深灰', color: '#334155' },
  { name: '棕色', color: '#92400e' },
]

const KEY = 'zblog_theme_color'
const DEFAULT = '#2563eb'

export function getThemeColor() {
  return uni.getStorageSync(KEY) || DEFAULT
}

export function saveThemeColor(color) {
  uni.setStorageSync(KEY, color)
  uni.$emit('themeChanged', color)
}

/** 根据主色生成稍深的 hover 色（用于渐变第二色）*/
export function darkenColor(hex, percent = 15) {
  const num = parseInt(hex.slice(1), 16)
  const r = Math.max(0, (num >> 16) - Math.round(2.55 * percent))
  const g = Math.max(0, ((num >> 8) & 0xff) - Math.round(2.55 * percent))
  const b = Math.max(0, (num & 0xff) - Math.round(2.55 * percent))
  return '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('')
}
