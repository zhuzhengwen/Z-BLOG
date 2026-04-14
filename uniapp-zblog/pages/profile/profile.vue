<template>
  <view class="page">
    <scroll-view scroll-y style="flex:1">

      <!-- 头部卡片 -->
      <view class="profile-hero" :style="{ paddingTop: (statusBarHeight + 40) + 'px', background: heroGradient }">
        <view class="profile-hero__content">
          <image
            class="profile-avatar"
            :src="avatarUrl"
            mode="aspectFill">
          </image>
          <text class="profile-name">{{ displayName }}</text>
          <text v-if="bio" class="profile-bio">{{ bio }}</text>
          <view v-if="location" class="profile-meta-row">
            <text class="profile-meta-icon">📍</text>
            <text class="profile-meta-text">{{ location }}</text>
          </view>
          <view v-if="blog" class="profile-meta-row">
            <text class="profile-meta-icon">🔗</text>
            <text class="profile-meta-text profile-meta-link" @click="openLink(blog)">{{ blogDisplay }}</text>
          </view>
          <text class="profile-stats-text" @click="openGitHub">⭐ {{ stars }} Stars · 🍴 {{ forks }} Forks</text>
        </view>
      </view>

      <!-- 分类统计 -->
      <view class="section">
        <view class="section-title">📊 内容统计</view>
        <view class="cats-grid">
          <view
            v-for="c in config.categories" :key="c.label"
            class="cat-stat"
            :style="{ borderLeftColor: c.color }">
            <text class="cat-stat__icon">{{ c.icon }}</text>
            <view class="cat-stat__info">
              <text class="cat-stat__name">{{ c.name }}</text>
              <text class="cat-stat__count">{{ catCount[c.label] || 0 }} 篇</text>
            </view>
          </view>
        </view>
      </view>

      <!-- 博客运行卡片 -->
      <view class="section">
        <view class="section-title">⏱️ 博客运行</view>
        <view class="runtime-card">
          <view class="runtime-item">
            <text class="runtime-num" :style="{ color: themeColor }">{{ runtimeDays }}</text>
            <text class="runtime-label">天</text>
          </view>
          <view class="runtime-divider"></view>
          <view class="runtime-item">
            <text class="runtime-num" :style="{ color: themeColor }">{{ runtimeHours }}</text>
            <text class="runtime-label">时</text>
          </view>
          <view class="runtime-divider"></view>
          <view class="runtime-item">
            <text class="runtime-num" :style="{ color: themeColor }">{{ runtimeMins }}</text>
            <text class="runtime-label">分</text>
          </view>
          <view class="runtime-divider"></view>
          <view class="runtime-item">
            <text class="runtime-num" :style="{ color: themeColor }">{{ runtimeSecs }}</text>
            <text class="runtime-label">秒</text>
          </view>
        </view>
        <text class="runtime-since">自 {{ config.siteStartDate || '2026-03-26' }} 起持续运行</text>
      </view>

      <!-- 关于博客 -->
      <view class="section">
        <view class="section-title">ℹ️ 关于</view>
        <view class="info-card">
          <view class="info-row">
            <text class="info-key">🏠 GitHub</text>
            <text class="info-val link" @click="openGitHub">{{ config.owner }}/{{ config.repo }}</text>
          </view>
          <view class="info-row">
            <text class="info-key">📝 文章总数</text>
            <text class="info-val">{{ totalArticles }} 篇</text>
          </view>
          <view class="info-row">
            <text class="info-key">🖼️ 图片总数</text>
            <text class="info-val">{{ totalImages }} 张</text>
          </view>
        </view>
      </view>

      <!-- 主题颜色 -->
      <view class="section">
        <view class="section-title">🎨 主题颜色</view>
        <view class="theme-picker">
          <view
            v-for="t in themePresets" :key="t.color"
            class="theme-dot"
            :style="{ background: t.color, boxShadow: themeColor === t.color ? '0 0 0 4rpx rgba(255,255,255,.9), 0 0 0 7rpx ' + t.color : 'none' }"
            @click="applyTheme(t.color)">
            <text v-if="themeColor === t.color" class="theme-dot__check">✓</text>
          </view>
        </view>
      </view>

      <!-- 操作 -->
      <view class="section">
        <view class="section-title">⚙️ 设置</view>
        <view class="action-list">
          <view class="action-item" @click="clearCache">
            <text class="action-icon">🗑️</text>
            <text class="action-text">清除缓存</text>
            <text class="action-arrow">›</text>
          </view>
          <view class="action-item" @click="openGitHub">
            <text class="action-icon">📂</text>
            <text class="action-text">查看 GitHub 仓库</text>
            <text class="action-arrow">›</text>
          </view>
          <view class="action-item" @click="goPhotos">
            <text class="action-icon">🖼️</text>
            <text class="action-text">照片墙</text>
            <text class="action-arrow">›</text>
          </view>
        </view>
      </view>

      <!-- 版权 -->
      <view class="footer-credit">
        <text class="credit-text">Powered by GitHub Issues · Z-BLOG</text>
      </view>

      <view style="height:160rpx"></view>
    </scroll-view>

    <!-- 自定义底部导航 -->
    <music-player></music-player>
    <tab-bar current="profile"></tab-bar>
  </view>
</template>

<script>
import TabBar      from '../../components/TabBar.vue'
import MusicPlayer from '../../components/MusicPlayer.vue'
import CONFIG from '../../config.js'
import api    from '../../utils/api.js'
import { THEME_PRESETS, getThemeColor, saveThemeColor, darkenColor } from '../../utils/theme.js'
import { extractImages } from '../../utils/helper.js'

export default {
  components: { TabBar, MusicPlayer },
  data() {
    return {
      config:          CONFIG,
      avatar:          '',
      login:           CONFIG.owner,
      name:            '',
      bio:             '',
      location:        '',
      blog:            '',
      stars:           0,
      forks:           0,
      catCount:        {},
      totalImages:     0,
      runtimeDays:     0,
      runtimeHours:    0,
      runtimeMins:     0,
      runtimeSecs:     0,
      _timer:          null,
      statusBarHeight: 0,
      themeColor:      getThemeColor(),
      themePresets:    THEME_PRESETS,
    }
  },
  computed: {
    heroGradient() {
      return `linear-gradient(135deg, ${this.themeColor} 0%, ${darkenColor(this.themeColor)} 100%)`
    },
    displayName()   { return this.name || this.login || CONFIG.siteTitle },
    totalArticles() { return Object.values(this.catCount).reduce((a, b) => a + b, 0) },
    blogDisplay() {
      return (this.blog || '').replace(/^https?:\/\//, '').replace(/\/$/, '')
    },
    avatarUrl() {
      // 按天变化的版本号，绕过本地图片缓存
      const day = new Date().toISOString().slice(0, 10).replace(/-/g, '')
      if (this.avatar) return `${this.avatar}&v=${day}`
      // API 未返回时直接用 GitHub 头像 CDN（始终是当前用户头像，无需登录）
      return `https://github.com/${CONFIG.owner}.png?v=${day}`
    },
    stats() {
      return [
        { icon: '⭐', label: 'Stars', value: this.stars },
        { icon: '🍴', label: 'Forks', value: this.forks },
        { icon: '📝', label: '文章', value: Object.values(this.catCount).reduce((a, b) => a + b, 0) },
      ]
    }
  },
  onLoad() {
    this.statusBarHeight = uni.getSystemInfoSync().statusBarHeight || 20
    this.loadProfile()
    this.loadCatCounts()
  },
  onShow() {
    this._tickRuntime()
    this._timer = setInterval(() => this._tickRuntime(), 1000)
  },
  onHide() { clearInterval(this._timer) },
  methods: {
    async loadProfile() {
      try {
        const [user, repo] = await Promise.all([api.getUser(), api.getRepoInfo()])
        this.avatar   = user.avatar_url
        this.login    = user.login
        this.name     = user.name || user.login
        this.bio      = user.bio || repo.description || CONFIG.siteDesc || ''
        this.location = user.location || ''
        this.blog     = user.blog || ''
        this.stars    = repo.stargazers_count
        this.forks    = repo.forks_count
      } catch (e) {}
    },

    async loadCatCounts() {
      try {
        const counts = {}
        let imgTotal = 0
        await Promise.all(CONFIG.categories.map(async cat => {
          const issues = await api.getIssues({ page: 1, perPage: 100, label: cat.label })
          counts[cat.label] = issues.length
          if (cat.label === 'image') {
            issues.forEach(issue => {
              imgTotal += extractImages(issue.body || '').length
            })
          }
        }))
        this.catCount = counts
        this.totalImages = imgTotal
      } catch (e) {}
    },

    _tickRuntime() {
      const start = new Date(CONFIG.siteStartDate || '2026-03-26')
      const s = Math.floor((Date.now() - start) / 1000)
      this.runtimeDays  = Math.floor(s / 86400)
      this.runtimeHours = Math.floor((s % 86400) / 3600)
      this.runtimeMins  = Math.floor((s % 3600) / 60)
      this.runtimeSecs  = s % 60
    },


    clearCache() {
      api.clearCache()
      uni.showToast({ title: '缓存已清除', icon: 'success' })
    },

    openLink(url) {
      if (!url) return
      const full = /^https?:\/\//.test(url) ? url : `https://${url}`
      // #ifdef H5
      window.open(full, '_blank')
      // #endif
      // #ifdef APP-PLUS
      plus.runtime.openURL(full)
      // #endif
    },

    openGitHub() {
      this.openLink(`https://github.com/${CONFIG.owner}/${CONFIG.repo}`)
    },

    goPhotos() {
      uni.redirectTo({ url: '/pages/photos/photos' })
    },

    applyTheme(color) {
      this.themeColor = color
      saveThemeColor(color)
    },
  }
}
</script>

<style lang="scss" scoped>
.page { height: 100vh; display: flex; flex-direction: column; background: #f8fafc; }

/* 头部 */
.profile-hero {
  background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
  padding-left: 30rpx; padding-right: 30rpx; padding-bottom: 48rpx;
  display: flex; flex-direction: column; align-items: center;
  position: relative;
}
.profile-avatar {
  width: 140rpx; height: 140rpx; border-radius: 50%;
  border: 6rpx solid rgba(255,255,255,.4);
  margin-bottom: 20rpx;
}
.profile-hero__content { display: flex; flex-direction: column; align-items: center; }
.profile-name   { font-size: 38rpx; font-weight: 800; color: #fff; margin-bottom: 6rpx; }
.profile-handle { font-size: 24rpx; color: rgba(255,255,255,.6); margin-bottom: 12rpx; }
.profile-bio    { font-size: 26rpx; color: rgba(255,255,255,.8); text-align: center; line-height: 1.5; margin-bottom: 14rpx; padding: 0 20rpx; }
.profile-stats-text {
  margin-top: 24rpx; font-size: 26rpx; color: rgba(255,255,255,.85);
  background: rgba(255,255,255,.15); border-radius: 40rpx;
  padding: 12rpx 32rpx;
}
.profile-meta-row {
  display: flex; flex-direction: row; align-items: center; gap: 8rpx;
  margin-top: 10rpx;
}
.profile-meta-icon { font-size: 24rpx; }
.profile-meta-text { font-size: 24rpx; color: rgba(255,255,255,.75); }
.profile-meta-link { color: rgba(147,197,253,1); }

/* 统计数字 */
.profile-stats {
  display: flex; flex-direction: row; gap: 0;
  background: rgba(255,255,255,.15); border-radius: 16rpx; overflow: hidden;
  margin-bottom: 0;
}
.stat-item {
  flex: 1; display: flex; flex-direction: column; align-items: center;
  padding: 20rpx 30rpx; border-right: 1rpx solid rgba(255,255,255,.2);
}
.stat-item:last-child { border-right: none; }
.stat-num   { font-size: 34rpx; font-weight: 800; color: #fff; }
.stat-label-row {
  display: flex; flex-direction: row; align-items: center;
  gap: 4rpx; margin-top: 6rpx;
}
.stat-icon  { font-size: 20rpx; line-height: 1; }
.stat-label { font-size: 20rpx; color: rgba(255,255,255,.7); }

/* 通用区块 */
.section { margin: 24rpx 24rpx 0; }
.section-title {
  font-size: 26rpx; font-weight: 700; color: #64748b;
  text-transform: uppercase; letter-spacing: .08em;
  margin-bottom: 16rpx; padding-left: 4rpx;
}

/* 分类统计网格 */
.cats-grid {
  display: flex; flex-direction: column; gap: 10rpx;
}
.cat-stat {
  background: #fff; border-radius: 12rpx; padding: 20rpx 24rpx;
  border-left: 6rpx solid; display: flex; flex-direction: row; align-items: center; gap: 20rpx;
  box-shadow: 0 1rpx 4rpx rgba(0,0,0,.05);
}
.cat-stat__icon { font-size: 40rpx; }
.cat-stat__info { flex: 1; display: flex; flex-direction: column; gap: 4rpx; }
.cat-stat__name { font-size: 28rpx; font-weight: 600; color: #1e293b; }
.cat-stat__count{ font-size: 24rpx; color: #94a3b8; }

/* 信息卡片 */
.info-card {
  background: #fff; border-radius: 14rpx; overflow: hidden;
  box-shadow: 0 1rpx 4rpx rgba(0,0,0,.05);
}
.info-row {
  display: flex; flex-direction: row; align-items: center;
  padding: 24rpx 28rpx; border-bottom: 1rpx solid #f1f5f9;
}
.info-row:last-child { border-bottom: none; }
.info-key { font-size: 26rpx; color: #64748b; width: 200rpx; flex-shrink: 0; }
.info-val { font-size: 26rpx; color: #1e293b; flex: 1; }
.info-val.link { color: #2563eb; }

/* 操作列表 */
.action-list {
  background: #fff; border-radius: 14rpx; overflow: hidden;
  box-shadow: 0 1rpx 4rpx rgba(0,0,0,.05);
}
.action-item {
  display: flex; flex-direction: row; align-items: center;
  padding: 26rpx 28rpx; gap: 18rpx;
  border-bottom: 1rpx solid #f1f5f9;
}
.action-item:last-child { border-bottom: none; }
.action-icon { font-size: 36rpx; }
.action-text { flex: 1; font-size: 28rpx; color: #1e293b; }
.action-tag   { font-size: 22rpx; color: #94a3b8; margin-right: 4rpx; }
.action-arrow { font-size: 36rpx; color: #94a3b8; }

/* 运行时间卡片 */
.runtime-card {
  background: #fff; border-radius: 14rpx;
  display: flex; flex-direction: row; align-items: center;
  box-shadow: 0 1rpx 4rpx rgba(0,0,0,.05);
  overflow: hidden;
}
.runtime-item {
  flex: 1; display: flex; flex-direction: column; align-items: center;
  padding: 24rpx 8rpx;
}
.runtime-num {
  font-size: 40rpx; font-weight: 800; color: #2563eb; line-height: 1.1;
  font-variant-numeric: tabular-nums;
}
.runtime-label {
  font-size: 22rpx; color: #94a3b8; margin-top: 6rpx;
}
.runtime-divider {
  width: 1rpx; height: 60rpx; background: #f1f5f9; flex-shrink: 0;
}
.runtime-since {
  font-size: 22rpx; color: #94a3b8; text-align: center;
  display: block; margin-top: 14rpx;
}

/* 主题色选择器 */
.theme-picker {
  display: flex; flex-direction: row; flex-wrap: wrap; gap: 20rpx;
  padding: 8rpx 0;
}
.theme-dot {
  width: 60rpx; height: 60rpx; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  border: 5rpx solid transparent;
  box-sizing: border-box;
}
.theme-dot__check { font-size: 28rpx; color: #fff; font-weight: 700; }

/* 版权 */
.footer-credit { text-align: center; padding: 30rpx; }
.credit-text   { font-size: 22rpx; color: #94a3b8; }
</style>
