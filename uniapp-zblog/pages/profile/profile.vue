<template>
  <view class="page">
    <scroll-view scroll-y style="flex:1">

      <!-- 头部卡片 -->
      <view class="profile-hero" :style="{ paddingTop: (statusBarHeight + 40) + 'px' }">
        <view class="profile-hero__content">
          <image
            class="profile-avatar"
            :src="avatarUrl"
            mode="aspectFill">
          </image>
          <text class="profile-name">{{ displayName }}</text>
          <text class="profile-handle">@{{ login }}</text>
          <text v-if="bio" class="profile-bio">{{ bio }}</text>
          <view class="profile-stats">
            <view class="stat-item" v-for="s in stats" :key="s.label">
              <text class="stat-num">{{ s.value }}</text>
              <view class="stat-label-row">
                <text class="stat-icon">{{ s.icon }}</text>
                <text class="stat-label">{{ s.label }}</text>
              </view>
            </view>
          </view>
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

      <!-- 关于博客 -->
      <view class="section">
        <view class="section-title">ℹ️ 关于</view>
        <view class="info-card">
          <view class="info-row">
            <text class="info-key">📝 博客名称</text>
            <text class="info-val">{{ config.siteTitle }}</text>
          </view>
          <view class="info-row">
            <text class="info-key">🏠 GitHub</text>
            <text class="info-val link" @click="openGitHub">{{ config.owner }}/{{ config.repo }}</text>
          </view>
          <view class="info-row">
            <text class="info-key">⏱️ 运行时间</text>
            <text class="info-val">{{ runtimeStr }}</text>
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
    <tab-bar current="profile"></tab-bar>
  </view>
</template>

<script>
import TabBar from '../../components/TabBar.vue'
import CONFIG from '../../config.js'
import api    from '../../utils/api.js'
import { getRuntimeStr } from '../../utils/helper.js'

export default {
  components: { TabBar },
  data() {
    return {
      config:          CONFIG,
      avatar:          '',
      login:           CONFIG.owner,
      name:            '',
      bio:             '',
      stars:           0,
      forks:           0,
      catCount:        {},
      runtimeStr:      getRuntimeStr(),
      _timer:          null,
      statusBarHeight: 0,
    }
  },
  computed: {
    displayName() { return this.name || this.login || CONFIG.siteTitle },
    avatarUrl() {
      if (!this.avatar) return 'https://github.com/github.png'
      // 拼时间戳（按天刷新），绕过本地图片缓存，头像改后当天生效
      const day = new Date().toISOString().slice(0, 10).replace(/-/g, '')
      return `${this.avatar}&v=${day}`
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
    this.runtimeStr = getRuntimeStr()
    this._timer = setInterval(() => { this.runtimeStr = getRuntimeStr() }, 1000)
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
        this.stars    = repo.stargazers_count
        this.forks    = repo.forks_count
      } catch (e) {}
    },

    async loadCatCounts() {
      try {
        const counts = {}
        await Promise.all(CONFIG.categories.map(async cat => {
          // 获取第一页来估算数量
          const issues = await api.getIssues({ page: 1, perPage: 100, label: cat.label })
          counts[cat.label] = issues.length
        }))
        this.catCount = counts
      } catch (e) {}
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
.profile-stats { margin-top: 24rpx; }

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
.action-arrow { font-size: 36rpx; color: #94a3b8; }

/* 版权 */
.footer-credit { text-align: center; padding: 30rpx; }
.credit-text   { font-size: 22rpx; color: #94a3b8; }
</style>
