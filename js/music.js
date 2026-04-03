/**
 * PC 端音乐播放器
 *
 * ── 方式一：GitHub Issues（推荐）─────────────────────────────
 * 创建 Issue，打上 "music" Label，即自动加入歌单：
 *   标题：歌曲名  或  歌曲名 - 歌手名
 *   正文：第一行写 MP3 直链，可追加：
 *         artist: 歌手名
 *         cover:  https://封面图.jpg
 *
 * ── 方式二：本地静态歌单（兜底）──────────────────────────────
 * 在 STATIC_PLAYLIST 中填写即可
 */

// 静态歌单（GitHub 加载失败时使用）
const STATIC_PLAYLIST = [
  // { title: '歌曲名', artist: '歌手名', url: 'https://xxx.mp3', cover: '' },
]

// 运行时歌单
const PLAYLIST = [...STATIC_PLAYLIST]

// ── Issue body 解析 ───────────────────────────────────────────
function parseTrackFromIssue(issue) {
  const rawTitle = (issue.title || '').trim()
  const body     = (issue.body  || '').trim()
  let title  = rawTitle
  let artist = ''
  if (rawTitle.includes(' - ')) {
    const i = rawTitle.indexOf(' - ')
    title  = rawTitle.slice(0, i).trim()
    artist = rawTitle.slice(i + 3).trim()
  }
  let url = '', cover = ''
  for (const raw of body.split('\n')) {
    const line = raw.trim()
    if (!line) continue
    if      (line.toLowerCase().startsWith('artist:')) artist = line.slice(7).trim()
    else if (line.toLowerCase().startsWith('cover:'))  cover  = line.slice(6).trim()
    else if (line.toLowerCase().startsWith('url:'))    url    = line.slice(4).trim()
    else if (!url && line.startsWith('http'))          url    = line
  }
  return { title, artist, url, cover }
}

// ── 从 GitHub Issues 加载歌单 ─────────────────────────────────
async function loadPlaylistFromGitHub() {
  try {
    const owner   = CONFIG.owner
    const repo    = CONFIG.repo
    const token   = localStorage.getItem('zblog_user_token') || CONFIG.token || ''
    const headers = { Accept: 'application/vnd.github.v3+json' }
    if (token) headers.Authorization = `token ${token}`

    const res    = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/issues?labels=music&state=open&per_page=100`,
      { headers }
    )
    if (!res.ok) return
    const issues = await res.json()
    if (!Array.isArray(issues) || !issues.length) return

    const tracks = issues.map(parseTrackFromIssue).filter(t => t.url)
    if (!tracks.length) return

    PLAYLIST.splice(0, PLAYLIST.length, ...tracks)
  } catch (e) {
    console.warn('[music] GitHub 加载失败，使用本地歌单', e)
  }
}

;(function () {
  // 先异步加载 GitHub 歌单，加载完成后再初始化播放器
  loadPlaylistFromGitHub().then(initPlayer)
})()

function initPlayer() {
  if (!PLAYLIST.length || !PLAYLIST.some(t => t.url)) return

  // ── 状态 ─────────────────────────────────────────────────────
  let audio        = new Audio()
  let currentIdx   = 0
  let isPlaying    = false
  let isExpanded   = false

  audio.preload = 'metadata'

  function loadTrack(idx) {
    const track = PLAYLIST[idx]
    if (!track || !track.url) return
    currentIdx = idx
    audio.src  = track.url
    updateUI()
  }

  function play()   { audio.play().catch(() => {}) }
  function pause()  { audio.pause() }
  function toggle() { isPlaying ? pause() : play() }
  function next()   { loadTrack((currentIdx + 1) % PLAYLIST.length); play() }
  function prev()   { loadTrack((currentIdx - 1 + PLAYLIST.length) % PLAYLIST.length); play() }

  audio.addEventListener('play',   () => { isPlaying = true;  updatePlayBtn() })
  audio.addEventListener('pause',  () => { isPlaying = false; updatePlayBtn() })
  audio.addEventListener('ended',  () => next())
  audio.addEventListener('timeupdate', updateProgress)

  // ── 注入 HTML ─────────────────────────────────────────────────
  let isCollapsed = false

  function injectPlayer() {
    const el = document.createElement('div')
    el.id = 'music-player'
    el.innerHTML = `
      <!-- 收起态 CD -->
      <div class="mp-cd" id="mpCd" style="display:none" onclick="musicExpand()" title="展开播放器">
        <div class="mp-cd__outer" id="mpCdDisc">
          <div class="mp-cd__groove mp-cd__groove--1"></div>
          <div class="mp-cd__groove mp-cd__groove--2">♪</div>
          <div class="mp-cd__center"></div>
        </div>
        <div class="mp-cd__dot" id="mpCdDot" style="display:none"></div>
      </div>

      <!-- 展开态 -->
      <div class="mp-expanded" id="mpExpanded">
        <div class="mp-bar">
          <div class="mp-disc" id="mpDisc">
            <div class="mp-disc-inner">
              <img id="mpCover" src="" alt="" style="display:none">
              <span class="mp-note" id="mpNote">♪</span>
            </div>
          </div>
          <div class="mp-info">
            <div class="mp-title-wrap"><span class="mp-title" id="mpTitle">-</span></div>
            <span class="mp-artist" id="mpArtist">-</span>
          </div>
          <div class="mp-progress-wrap">
            <div class="mp-progress" id="mpProgress">
              <div class="mp-progress-fill" id="mpFill"></div>
            </div>
          </div>
          <div class="mp-controls">
            <button class="mp-btn" onclick="musicPrev()" title="上一首">⏮</button>
            <button class="mp-btn mp-btn--main" id="mpPlayBtn" onclick="musicToggle()">▶</button>
            <button class="mp-btn" onclick="musicNext()" title="下一首">⏭</button>
            <button class="mp-btn mp-btn--list" id="mpListBtn" onclick="musicToggleList()" title="播放列表">☰</button>
            <button class="mp-btn" onclick="musicCollapse()" title="收起">⊙</button>
          </div>
        </div>
        <div class="mp-list" id="mpList" style="display:none">
          ${PLAYLIST.map((t, i) => `
            <div class="mp-list-item" id="mpItem${i}" onclick="musicPlay(${i})">
              <span class="mp-list-num" id="mpNum${i}">${i + 1}</span>
              <div class="mp-list-info">
                <span class="mp-list-title">${t.title || '未知歌曲'}</span>
                <span class="mp-list-artist">${t.artist || ''}</span>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `
    document.body.appendChild(el)

    // 进度条点击跳转
    document.getElementById('mpProgress').addEventListener('click', function (e) {
      if (!audio.duration) return
      const r = this.getBoundingClientRect()
      audio.currentTime = ((e.clientX - r.left) / r.width) * audio.duration
    })
  }

  function updateUI() {
    const track = PLAYLIST[currentIdx] || {}
    const title = document.getElementById('mpTitle')
    const artist = document.getElementById('mpArtist')
    const cover = document.getElementById('mpCover')
    const note  = document.getElementById('mpNote')
    if (title)  title.textContent  = track.title  || '未知歌曲'
    if (artist) artist.textContent = track.artist || '未知歌手'
    if (cover && note) {
      if (track.cover) { cover.src = track.cover; cover.style.display = 'block'; note.style.display = 'none' }
      else             { cover.style.display = 'none'; note.style.display = 'block' }
    }
    // 高亮列表项 + 播放指示
    PLAYLIST.forEach((_, i) => {
      const item = document.getElementById(`mpItem${i}`)
      const num  = document.getElementById(`mpNum${i}`)
      if (!item) return
      const active = i === currentIdx
      item.classList.toggle('mp-list-item--active', active)
      if (num) {
        num.innerHTML = active
          ? `<span class="mp-bars"><span></span><span></span><span></span></span>`
          : String(i + 1)
      }
    })
    // 自动滚动到当前歌曲
    const activeEl = document.getElementById(`mpItem${currentIdx}`)
    if (activeEl) activeEl.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }

  function updatePlayBtn() {
    const btn      = document.getElementById('mpPlayBtn')
    const disc     = document.getElementById('mpDisc')
    const cdDisc   = document.getElementById('mpCdDisc')
    const cdDot    = document.getElementById('mpCdDot')
    if (btn)    btn.textContent = isPlaying ? '⏸' : '▶'
    if (disc)   disc.classList.toggle('mp-disc--spin', isPlaying)
    if (cdDisc) cdDisc.classList.toggle('mp-cd__outer--spin', isPlaying)
    if (cdDot)  cdDot.style.display = isPlaying ? 'block' : 'none'
  }

  window.musicCollapse = function () {
    isCollapsed = true
    const cd  = document.getElementById('mpCd')
    const exp = document.getElementById('mpExpanded')
    if (cd)  cd.style.display  = 'flex'
    if (exp) exp.style.display = 'none'
    // 同步 CD 封面
    const track = PLAYLIST[currentIdx] || {}
    const cdCover = document.getElementById('mpCdCover')
    const cdNote  = document.getElementById('mpCdNote')
    if (cdCover && cdNote) {
      if (track.cover) { cdCover.src = track.cover; cdCover.style.display = 'block'; cdNote.style.display = 'none' }
      else             { cdCover.style.display = 'none'; cdNote.style.display = 'inline' }
    }
    updatePlayBtn()
  }

  window.musicExpand = function () {
    isCollapsed = false
    const cd  = document.getElementById('mpCd')
    const exp = document.getElementById('mpExpanded')
    if (cd)  cd.style.display  = 'none'
    if (exp) exp.style.display = 'block'
    updatePlayBtn()
  }

  function updateProgress() {
    const fill = document.getElementById('mpFill')
    if (fill && audio.duration) {
      fill.style.width = (audio.currentTime / audio.duration * 100) + '%'
    }
  }

  // ── 全局函数（HTML onclick 调用） ─────────────────────────────
  window.musicToggle     = toggle
  window.musicNext       = next
  window.musicPrev       = prev
  window.musicPlay       = function (i) { loadTrack(i); play() }
  window.musicToggleList = function () {
    isExpanded = !isExpanded
    const list = document.getElementById('mpList')
    const btn  = document.getElementById('mpListBtn')
    if (list) list.style.display = isExpanded ? 'block' : 'none'
    if (btn)  btn.classList.toggle('mp-btn--active', isExpanded)
  }

  // ── 样式 ─────────────────────────────────────────────────────
  const style = document.createElement('style')
  style.textContent = `
#music-player {
  position: fixed; right: 24px; bottom: 24px; z-index: 1500;
  font-family: -apple-system, 'PingFang SC', sans-serif;
}
/* 收起态 CD */
.mp-cd {
  width: 72px; height: 72px; cursor: pointer;
  position: relative; display: flex; align-items: center; justify-content: center;
}
/* 外层光晕 */
.mp-cd::before {
  content: ''; position: absolute; inset: -6px; border-radius: 50%;
  background: radial-gradient(circle, rgba(99,102,241,.2) 0%, transparent 70%);
  opacity: 0; transition: opacity .4s;
}
.mp-cd:hover::before { opacity: 1; }
/* 碟片 */
.mp-cd__outer {
  width: 72px; height: 72px; border-radius: 50%;
  position: relative; overflow: hidden;
  background:
    radial-gradient(circle at 40% 34%,
      #ffffff 0%, #f0f4f8 12%, #cdd5de 30%,
      #9aaab8 52%, #607080 72%, #3a4a58 88%, #202c38 100%);
  box-shadow:
    0 10px 32px rgba(0,0,0,.5),
    0 3px 10px rgba(0,0,0,.3),
    inset 0 3px 7px rgba(255,255,255,.6),
    inset 0 -3px 5px rgba(0,0,0,.4);
}
.mp-cd__outer--spin { animation: mp-spin 5s linear infinite; }
/* 彩虹折射 */
.mp-cd__outer::before {
  content: ''; position: absolute; inset: 0; border-radius: 50%;
  background: conic-gradient(
    from 20deg,
    rgba(255,50,80,.42) 0deg, rgba(255,140,0,.40) 45deg,
    rgba(220,240,0,.36) 90deg, rgba(40,220,80,.38) 135deg,
    rgba(30,160,255,.42) 185deg, rgba(120,40,255,.42) 235deg,
    rgba(255,20,180,.40) 285deg, rgba(255,50,80,.42) 360deg
  );
  mix-blend-mode: screen;
}
/* 刻槽 + 高光 */
.mp-cd__outer::after {
  content: ''; position: absolute; inset: 0; border-radius: 50%;
  background:
    radial-gradient(ellipse 55% 40% at 30% 22%, rgba(255,255,255,.6) 0%, rgba(255,255,255,.12) 40%, transparent 62%),
    radial-gradient(circle, transparent 24.5%, rgba(0,0,0,.08) 25.5%, transparent 26.5%),
    radial-gradient(circle, transparent 31%,   rgba(0,0,0,.08) 32%,   transparent 33%),
    radial-gradient(circle, transparent 37.5%, rgba(0,0,0,.08) 38.5%, transparent 39.5%),
    radial-gradient(circle, transparent 44%,   rgba(0,0,0,.08) 45%,   transparent 46%),
    radial-gradient(circle, transparent 50.5%, rgba(0,0,0,.08) 51.5%, transparent 52.5%),
    radial-gradient(circle, transparent 57%,   rgba(0,0,0,.08) 58%,   transparent 59%),
    radial-gradient(circle, transparent 63.5%, rgba(0,0,0,.08) 64.5%, transparent 65.5%),
    radial-gradient(circle, transparent 70%,   rgba(0,0,0,.08) 71%,   transparent 72%);
}
/* hub 圆 */
.mp-cd__groove {
  position: absolute; top: 50%; left: 50%;
  transform: translate(-50%,-50%);
  border-radius: 50%; z-index: 2;
}
.mp-cd__groove--1 {
  width: 24px; height: 24px;
  background: radial-gradient(circle at 38% 32%, #ffffff, #e8eef4 35%, #b8c8d8 65%, #8a9eb0);
  box-shadow: 0 1px 4px rgba(0,0,0,.35), inset 0 1px 3px rgba(255,255,255,.8);
}
.mp-cd__groove--2 {
  width: 14px; height: 14px;
  background: radial-gradient(circle at 35% 30%, #2a3a48, #0f1923 55%, #060e14);
  box-shadow: inset 0 2px 4px rgba(0,0,0,.9);
  display: flex; align-items: center; justify-content: center;
  font-size: 7px; color: rgba(200,220,255,.4);
}
/* 高光层（已移入::after，此处只保留结构） */
.mp-cd__center { display: none; }
.mp-cd__dot {
  position: absolute; top: 4px; right: 4px;
  width: 14px; height: 14px; border-radius: 50%;
  background: radial-gradient(circle at 38% 35%, #86efac, #22c55e 50%, #15803d);
  border: 2px solid rgba(255,255,255,.95);
  box-shadow: 0 2px 8px rgba(34,197,94,.65), 0 0 0 3px rgba(34,197,94,.2);
  animation: mp-pulse 2s ease-in-out infinite; z-index: 3;
}
@keyframes mp-pulse {
  0%,100% { box-shadow: 0 2px 8px rgba(34,197,94,.65), 0 0 0 3px rgba(34,197,94,.2); }
  50%     { box-shadow: 0 2px 12px rgba(34,197,94,.85), 0 0 0 6px rgba(34,197,94,.1); }
}
/* 展开态宽度 */
.mp-expanded { width: 320px; }
.mp-bar {
  display: flex; align-items: center; gap: 10px;
  background: rgba(255,255,255,0.82);
  backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255,255,255,0.9);
  border-radius: 18px;
  padding: 10px 14px;
  box-shadow: 0 8px 32px rgba(0,0,0,.12), 0 2px 8px rgba(0,0,0,.06);
}
.mp-disc {
  width: 42px; height: 42px; flex-shrink: 0; border-radius: 50%;
  background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
  border: 2px solid rgba(255,255,255,.5);
  display: flex; align-items: center; justify-content: center;
  overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,.2);
  cursor: pointer;
}
.mp-disc--spin { animation: mp-spin 6s linear infinite; }
@keyframes mp-spin { to { transform: rotate(360deg); } }
.mp-disc-inner { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; position: relative; }
#mpCover { width: 42px; height: 42px; border-radius: 50%; object-fit: cover; position: absolute; }
.mp-note { font-size: 18px; color: rgba(255,255,255,.8); }
.mp-info { flex: 1; min-width: 0; }
.mp-title-wrap { overflow: hidden; }
.mp-title { font-size: 13px; font-weight: 600; color: #1e293b; white-space: nowrap; display: inline-block; }
.mp-artist { font-size: 11px; color: #64748b; white-space: nowrap; }
.mp-progress-wrap { position: absolute; bottom: 0; left: 18px; right: 18px; }
.mp-bar { position: relative; padding-bottom: 14px; }
.mp-progress {
  position: absolute; bottom: 6px; left: 14px; right: 14px;
  height: 3px; background: rgba(0,0,0,.08); border-radius: 2px; cursor: pointer;
}
.mp-progress-fill { height: 100%; background: var(--primary, #2563eb); border-radius: 2px; transition: width .2s; }
.mp-controls { display: flex; align-items: center; gap: 4px; flex-shrink: 0; }
.mp-btn {
  width: 30px; height: 30px; border-radius: 50%; border: none; cursor: pointer;
  background: transparent; color: #475569; font-size: 14px;
  display: flex; align-items: center; justify-content: center;
  transition: background .15s;
}
.mp-btn:hover { background: rgba(0,0,0,.06); }
.mp-btn--main {
  width: 36px; height: 36px;
  background: #1e293b; color: #fff;
  box-shadow: 0 2px 8px rgba(0,0,0,.2);
  font-size: 13px;
}
.mp-btn--main:hover { background: #334155; }
.mp-btn--active { color: var(--primary, #2563eb) !important; }
.mp-list {
  background: rgba(255,255,255,0.92);
  backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255,255,255,.9);
  border-radius: 14px; margin-top: 8px;
  box-shadow: 0 8px 32px rgba(0,0,0,.12);
  max-height: 220px; overflow-y: auto;
  padding: 6px 0;
}
.mp-list::-webkit-scrollbar { width: 4px; }
.mp-list::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 2px; }
.mp-list-item {
  display: flex; align-items: center; gap: 10px;
  padding: 9px 16px; cursor: pointer; transition: background .12s;
}
.mp-list-item:hover { background: rgba(0,0,0,.04); }
.mp-list-item--active { color: var(--primary, #2563eb) !important; background: rgba(37,99,235,.05) !important; }
.mp-list-item--active .mp-list-title { color: var(--primary, #2563eb); font-weight: 600; }
.mp-list-num { font-size: 11px; color: #94a3b8; width: 18px; text-align: center; flex-shrink:0; }
.mp-list-info { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px; }
.mp-list-title { font-size: 13px; color: #1e293b; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.mp-list-artist { font-size: 11px; color: #94a3b8; white-space: nowrap; }
/* 播放中跳动柱子 */
.mp-bars { display: inline-flex; align-items: flex-end; gap: 2px; height: 14px; }
.mp-bars span { display: block; width: 3px; border-radius: 2px; background: var(--primary,#2563eb); animation: mp-bar .6s ease-in-out infinite alternate; }
.mp-bars span:nth-child(1){ height:6px; animation-delay:0s; }
.mp-bars span:nth-child(2){ height:12px; animation-delay:.2s; }
.mp-bars span:nth-child(3){ height:9px; animation-delay:.4s; }
@keyframes mp-bar { from{transform:scaleY(.3)} to{transform:scaleY(1)} }
  `
  document.head.appendChild(style)

  // ── 初始化 ────────────────────────────────────────────────────
  // DOMContentLoaded 可能已触发（GitHub 是异步请求），需兼容两种情况
  function doInit() {
    injectPlayer()
    loadTrack(0)
    play()
    musicCollapse()
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', doInit)
  } else {
    doInit()
  }
}
