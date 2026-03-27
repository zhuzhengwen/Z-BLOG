/**
 * 生成 TabBar 简约线条图标
 * 运行：node gen-tab-icons.js
 */
const sharp = require('sharp')
const path  = require('path')

const NORMAL = '#9fafc0'
const ACTIVE = '#1e293b'
const SIZE   = 96  // 2x 渲染，实际显示 48rpx

const icons = {
  home: (c) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
    <polyline points="4,22 24,6 44,22" fill="none" stroke="${c}" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M8 22v18a2 2 0 002 2h8V30h12v12h8a2 2 0 002-2V22" fill="none" stroke="${c}" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`,

  photos: (c) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
    <rect x="4" y="8" width="40" height="32" rx="4" fill="none" stroke="${c}" stroke-width="3.2"/>
    <circle cx="16" cy="19" r="4" fill="none" stroke="${c}" stroke-width="2.8"/>
    <path d="M4 34 17 21l9 9 6-6 12 10" fill="none" stroke="${c}" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`,

  category: (c) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
    <rect x="4"  y="4"  width="17" height="17" rx="3" fill="none" stroke="${c}" stroke-width="3.2"/>
    <rect x="27" y="4"  width="17" height="17" rx="3" fill="none" stroke="${c}" stroke-width="3.2"/>
    <rect x="27" y="27" width="17" height="17" rx="3" fill="none" stroke="${c}" stroke-width="3.2"/>
    <rect x="4"  y="27" width="17" height="17" rx="3" fill="none" stroke="${c}" stroke-width="3.2"/>
  </svg>`,

  profile: (c) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
    <circle cx="24" cy="15" r="9" fill="none" stroke="${c}" stroke-width="3.2"/>
    <path d="M5 44c0-10.493 8.507-19 19-19s19 8.507 19 19" fill="none" stroke="${c}" stroke-width="3.2" stroke-linecap="round"/>
  </svg>`,
}

async function generate() {
  const tasks = []
  for (const [name, fn] of Object.entries(icons)) {
    for (const [state, color] of [['normal', NORMAL], ['active', ACTIVE]]) {
      const svg  = Buffer.from(fn(color))
      const file = path.join(__dirname, `tab-${name}-${state}.png`)
      tasks.push(
        sharp(svg).resize(SIZE, SIZE).png().toFile(file)
          .then(() => console.log(`✓ tab-${name}-${state}.png`))
      )
    }
  }
  await Promise.all(tasks)
  console.log('All tab icons generated!')
}

generate().catch(console.error)
