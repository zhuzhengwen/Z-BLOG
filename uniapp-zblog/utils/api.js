/**
 * GitHub API（UniApp 版）
 * 使用 uni.request 替代 fetch，兼容 H5 + App
 */
import CONFIG from '../config.js'

class GitHubAPI {
  constructor() {
    this.owner = CONFIG.owner
    this.repo  = CONFIG.repo
    this.base  = `https://api.github.com/repos/${this.owner}/${this.repo}`
    this._cache = {}
  }

  getToken() {
    return uni.getStorageSync('zblog_user_token') || CONFIG.token || ''
  }

  setToken(token) {
    if (token) uni.setStorageSync('zblog_user_token', token)
    else        uni.removeStorageSync('zblog_user_token')
  }

  // ── 缓存 ────────────────────────────────────────────────
  _ck(url) { return 'zblog_uni_' + url }
  _getCache(url) {
    try {
      const raw = uni.getStorageSync(this._ck(url))
      if (!raw) return null
      const { data, ts } = JSON.parse(raw)
      if (Date.now() - ts > CONFIG.cacheDuration) return null
      return data
    } catch { return null }
  }
  _setCache(url, data) {
    try { uni.setStorageSync(this._ck(url), JSON.stringify({ data, ts: Date.now() })) } catch {}
  }

  // ── 请求 ────────────────────────────────────────────────
  _request(url, params = {}) {
    const qs  = Object.keys(params).map(k => `${k}=${encodeURIComponent(params[k])}`).join('&')
    const full = qs ? `${url}?${qs}` : url

    const cached = this._getCache(full)
    if (cached) return Promise.resolve(cached)

    const header = { 'Accept': 'application/vnd.github.v3+json' }
    const token  = this.getToken()
    if (token) header['Authorization'] = `token ${token}`

    return new Promise((resolve, reject) => {
      uni.request({
        url: full,
        header,
        success: (res) => {
          if (res.statusCode === 200) {
            this._setCache(full, res.data)
            resolve(res.data)
          } else if (res.statusCode === 403) {
            uni.$emit('showTokenModal')
            reject(new Error('GitHub API 频率限制，请设置 Token 后重试'))
          } else {
            reject(new Error(`请求失败: ${res.statusCode}`))
          }
        },
        fail: (err) => reject(new Error(err.errMsg || '网络错误'))
      })
    })
  }

  // ── Issues 列表 ──────────────────────────────────────────
  getIssues({ page = 1, perPage = 10, label = null, state = 'open' } = {}) {
    const params = { state, page, per_page: perPage, sort: 'created', direction: 'desc' }
    if (label) params.labels = label
    return this._request(`${this.base}/issues`, params)
      .then(data => Array.isArray(data) ? data.filter(i => !i.pull_request) : [])
  }

  // ── 单篇 Issue ───────────────────────────────────────────
  getIssue(number) {
    return this._request(`${this.base}/issues/${number}`)
  }

  // ── 仓库信息 ─────────────────────────────────────────────
  getRepoInfo() {
    return this._request(this.base)
  }

  // ── 用户信息（头像、昵称、简介、地区等）──────────────────
  getUser() {
    return this._request(`https://api.github.com/users/${this.owner}`)
  }

  // ── 搜索 ─────────────────────────────────────────────────
  searchIssues(query, page = 1) {
    const q = `${query} repo:${this.owner}/${this.repo} is:issue is:open`
    return this._request('https://api.github.com/search/issues', { q, page, per_page: 10 })
      .then(data => ({ items: (data.items || []).filter(i => !i.pull_request), total: data.total_count }))
  }

  // ── 创建 Issue（发布文章）────────────────────────────────
  createIssue({ title, body, labels = [] }) {
    const token = this.getToken()
    if (!token) return Promise.reject(new Error('请先设置 GitHub Token'))
    return new Promise((resolve, reject) => {
      uni.request({
        url: `${this.base}/issues`,
        method: 'POST',
        header: {
          'Accept': 'application/vnd.github.v3+json',
          'Authorization': `token ${token}`,
          'Content-Type': 'application/json',
        },
        data: { title, body, labels },
        success: (res) => {
          if (res.statusCode === 201) {
            this.clearCache()
            resolve(res.data)
          } else if (res.statusCode === 401 || res.statusCode === 403) {
            uni.$emit('showTokenModal')
            reject(new Error('Token 无效或权限不足，请重新设置'))
          } else {
            reject(new Error(`发布失败: ${res.statusCode} ${JSON.stringify(res.data)}`))
          }
        },
        fail: (err) => reject(new Error(err.errMsg || '网络错误'))
      })
    })
  }

  // ── 上传图片到仓库 images/blog/ 目录 ────────────────────────
  uploadImage(base64Content, filename) {
    const token = this.getToken()
    if (!token) return Promise.reject(new Error('请先设置 GitHub Token'))
    const path = `images/blog/${filename}`
    return new Promise((resolve, reject) => {
      uni.request({
        url: `${this.base}/contents/${path}`,
        method: 'PUT',
        header: {
          'Accept': 'application/vnd.github.v3+json',
          'Authorization': `token ${token}`,
          'Content-Type': 'application/json',
        },
        data: {
          message: `upload image ${filename}`,
          content: base64Content,
        },
        success: (res) => {
          if (res.statusCode === 201) {
            resolve(res.data.content.download_url)
          } else if (res.statusCode === 401 || res.statusCode === 403) {
            uni.$emit('showTokenModal')
            reject(new Error('Token 无效或无权限'))
          } else {
            reject(new Error(`上传失败: ${res.statusCode}`))
          }
        },
        fail: (err) => reject(new Error(err.errMsg || '网络错误'))
      })
    })
  }

  // ── 清缓存 ───────────────────────────────────────────────
  clearCache() {
    try {
      const info = uni.getStorageInfoSync()
      info.keys.filter(k => k.startsWith('zblog_uni_')).forEach(k => uni.removeStorageSync(k))
    } catch {}
  }
}

export default new GitHubAPI()
