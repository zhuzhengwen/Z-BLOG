/**
 * 音乐播放器 - 歌单配置与播放控制
 *
 * ── 方式一：GitHub Issues（推荐） ─────────────────────────────
 * 创建 Issue，打上 "music" Label，即自动加入歌单：
 *   标题：歌曲名  或  歌曲名 - 歌手名
 *   正文：第一行写 MP3 直链，可追加：
 *         artist: 歌手名
 *         cover:  https://封面图.jpg
 *
 * ── 方式二：本地静态歌单（兜底） ──────────────────────────────
 * 在下方 STATIC_PLAYLIST 数组中填写即可
 */

// 静态歌单（GitHub Issues 加载失败时使用）
const STATIC_PLAYLIST = [
  {
    title:  '起风了',
    artist: '买辣椒也用券',
    url:    'https://music.163.com/song/media/outer/url?id=1330348068.mp3',
    cover:  '',
  },
  {
    title:  '起风了1',
    artist: '买辣椒也用券',
    url:    'https://music.163.com/song/media/outer/url?id=1330348068.mp3',
    cover:  '',
  },
  {
    title:  '起风了',
    artist: '买辣椒也用券',
    url:    'https://music.163.com/song/media/outer/url?id=1330348068.mp3',
    cover:  '',
  },
  {
    title:  '起风了',
    artist: '买辣椒也用券',
    url:    'https://music.163.com/song/media/outer/url?id=1330348068.mp3',
    cover:  '',
  },
  {
    title:  '起风了',
    artist: '买辣椒也用券',
    url:    'https://music.163.com/song/media/outer/url?id=1330348068.mp3',
    cover:  '',
  },
]

// 运行时歌单（由 loadPlaylistFromAPI 填充，否则用 STATIC_PLAYLIST）
export const PLAYLIST = [...STATIC_PLAYLIST]

// ── 响应式状态（Vue.observable） ──────────────────────────────
import Vue from 'vue'

export const musicState = Vue.observable({
  isPlaying:    false,
  currentIndex: 0,
  title:        '',
  artist:       '',
  cover:        '',
  hasMusic:     PLAYLIST.some(t => t.url),
  expandTrigger: 0,   // 每次 +1 触发 MusicPlayer 展开，避免事件时序问题
})

// ── Issue body 解析 ───────────────────────────────────────────
function parseTrackFromIssue(issue) {
  const rawTitle = (issue.title || '').trim()
  const body     = (issue.body  || '').trim()

  // 标题支持 "歌曲名 - 歌手名" 格式
  let title  = rawTitle
  let artist = ''
  if (rawTitle.includes(' - ')) {
    const idx = rawTitle.indexOf(' - ')
    title  = rawTitle.slice(0, idx).trim()
    artist = rawTitle.slice(idx + 3).trim()
  }

  // 解析 body
  let url   = ''
  let cover = ''

  for (const raw of body.split('\n')) {
    const line = raw.trim()
    if (!line) continue

    if (line.toLowerCase().startsWith('artist:')) {
      artist = line.slice(7).trim()
    } else if (line.toLowerCase().startsWith('cover:')) {
      cover = line.slice(6).trim()
    } else if (line.toLowerCase().startsWith('url:')) {
      url = line.slice(4).trim()
    } else if (!url && line.startsWith('http')) {
      // 第一个 http 开头的行视为音频地址
      url = line
    }
  }

  return { title, artist, url, cover }
}

// ── 从 GitHub Issues 加载歌单 ─────────────────────────────────
export async function loadPlaylistFromAPI(api) {
  try {
    const issues = await api.getIssues({ label: 'music', perPage: 100 })
    if (!Array.isArray(issues) || !issues.length) return

    const tracks = issues
      .map(parseTrackFromIssue)
      .filter(t => t.url)

    if (!tracks.length) return

    // 用 GitHub 歌单替换运行时歌单
    PLAYLIST.splice(0, PLAYLIST.length, ...tracks)
    musicState.hasMusic     = true
    musicState.currentIndex = 0
  } catch (e) {
    console.warn('[music] GitHub 加载失败，使用本地歌单', e)
  }
}

// ── 单例 AudioContext ─────────────────────────────────────────
let _audio = null

function getAudio() {
  if (_audio) return _audio
  _audio = uni.createInnerAudioContext()
  _audio.onPlay(()  => { musicState.isPlaying = true  })
  _audio.onPause(() => { musicState.isPlaying = false })
  _audio.onStop(()  => { musicState.isPlaying = false })
  _audio.onEnded(() => {
    playIndex((musicState.currentIndex + 1) % PLAYLIST.length)
  })
  _audio.onError(e => console.warn('[music]', e))
  return _audio
}

function _loadTrack(idx) {
  const track = PLAYLIST[idx]
  if (!track || !track.url) return false
  musicState.currentIndex = idx
  musicState.title  = track.title  || '未知歌曲'
  musicState.artist = track.artist || ''
  musicState.cover  = track.cover  || ''
  getAudio().src = track.url
  return true
}

// ── 公开播放控制 ──────────────────────────────────────────────
export function playIndex(idx) {
  if (!_loadTrack(idx)) return
  getAudio().play()
}

export function togglePlay() {
  if (!musicState.hasMusic) return
  const audio = getAudio()
  if (musicState.isPlaying) {
    audio.pause()
  } else {
    if (!audio.src) _loadTrack(musicState.currentIndex)
    audio.play()
  }
}

export function nextTrack() {
  playIndex((musicState.currentIndex + 1) % PLAYLIST.length)
}

export function prevTrack() {
  playIndex((musicState.currentIndex - 1 + PLAYLIST.length) % PLAYLIST.length)
}

/** App.vue onLaunch 中调用 */
export function initMusic() {
  if (!musicState.hasMusic) return
  if (musicState.isPlaying) return
  if (!getAudio().src) _loadTrack(0)
  getAudio().play()
}
