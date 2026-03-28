<template>
  <view class="page">

    <!-- 左侧抽屉遮罩 -->
    <view v-if="drawerOpen" class="drawer-mask" @click="drawerOpen = false"></view>

    <!-- 左侧抽屉 -->
    <view class="drawer" :class="{ 'drawer--open': drawerOpen }">
      <view class="drawer__header" :style="{ paddingTop: (statusBarHeight + 24) + 'px', background: headerGradient }">
        <view class="drawer__header-main">
          <view class="drawer__logo">
            <text class="drawer__logo-icon">📝</text>
          </view>
          <text class="drawer__title">{{ siteTitle }}</text>
        </view>
        <view class="drawer__close" @click="drawerOpen = false">
          <text class="drawer__close-icon">✕</text>
        </view>
      </view>

      <view class="drawer__menu">
        <view
          class="drawer__item"
          :class="{ 'drawer__item--active': !currentCat }"
          @click="selectCat(null)">
          <text class="drawer__item-icon">🏠</text>
          <text class="drawer__item-text" :style="!currentCat ? { color: themeColor, fontWeight: '700' } : {}">全部</text>
          <view v-if="!currentCat" class="drawer__item-dot" :style="{ background: themeColor }"></view>
        </view>

        <view
          v-for="c in categories" :key="c.label"
          class="drawer__item"
          :class="{ 'drawer__item--active': currentCat === c.label }"
          @click="selectCat(c.label)">
          <text class="drawer__item-icon">{{ c.icon }}</text>
          <text class="drawer__item-text" :style="currentCat === c.label ? { color: themeColor, fontWeight: '700' } : {}">{{ c.name }}</text>
          <view v-if="currentCat === c.label" class="drawer__item-dot" :style="{ background: themeColor }"></view>
        </view>
      </view>

      <view class="drawer__footer">
        <text class="drawer__footer-text">基于 GitHub Issues 驱动</text>
      </view>
    </view>

    <!-- 顶部 Header -->
    <view class="header" :style="{ background: headerGradient }">
      <view v-if="!searchExpanded" class="header__main">
        <!-- 左：汉堡菜单 + 当前分类名 -->
        <view class="header__left" @click="drawerOpen = true">
          <view class="hamburger">
            <view class="hamburger__line"></view>
            <view class="hamburger__line hamburger__line--mid" :class="{ 'hamburger__line--shrink': currentCat }"></view>
            <view class="hamburger__line"></view>
          </view>
          <text class="header__cat-name">{{ currentCatName }}</text>
        </view>
        <!-- 右：搜索 -->
        <view class="header__icon-btn" @click="searchExpanded = true">
          <text class="icon">🔍</text>
        </view>
      </view>

      <!-- 搜索展开态 -->
      <view v-else class="header__search">
        <view class="search-wrap">
          <text class="search-icon">🔍</text>
          <input
            class="search-input"
            v-model="searchKeyword"
            placeholder="搜索文章…"
            confirm-type="search"
            :focus="searchExpanded"
            @confirm="doSearch" />
          <text v-if="searchKeyword" class="search-clear" @click="searchKeyword = ''">✕</text>
        </view>
        <text class="search-cancel" :style="{ color: themeColor }" @click="cancelSearch">取消</text>
      </view>
    </view>

    <!-- 搜索结果 -->
    <scroll-view v-if="searchMode" scroll-y class="list-scroll">
      <view class="list-inner">
        <view class="search-result-bar">
          <text class="search-result-kw">"{{ lastKeyword }}" 的结果</text>
          <text class="search-result-back" @click="clearSearch">清除</text>
        </view>
        <view v-if="loading && !posts.length">
          <view v-for="i in 3" :key="i" class="skeleton-card">
            <view style="flex:1;display:flex;flex-direction:column;gap:14rpx;">
              <view class="skeleton sk-short"></view>
              <view class="skeleton sk-full"></view>
            </view>
          </view>
        </view>
        <view v-else-if="!posts.length && !loading" class="empty">
          <text class="empty-icon">🔍</text>
          <text class="empty-text">未找到相关内容</text>
        </view>
        <template v-else>
          <post-card v-for="issue in posts" :key="issue.id" :issue="issue" @click="openDetail(issue)" />
        </template>
      </view>
    </scroll-view>

    <!-- 正常列表 -->
    <scroll-view
      v-else
      class="list-scroll"
      scroll-y
      :lower-threshold="80"
      @scrolltolower="loadMore"
      refresher-enabled
      :refresher-triggered="refreshing"
      @refresherrefresh="onRefresh">

      <view class="list-inner">
        <view v-if="loading && !posts.length">
          <view v-for="i in 5" :key="i" class="skeleton-card">
            <view style="flex:1;display:flex;flex-direction:column;gap:14rpx;">
              <view class="skeleton sk-short"></view>
              <view class="skeleton sk-full"></view>
              <view class="skeleton sk-medium"></view>
            </view>
          </view>
        </view>
        <view v-else-if="error" class="error-box"><text>⚠️ {{ error }}</text></view>
        <view v-else-if="!posts.length && !loading" class="empty">
          <text class="empty-icon">📭</text>
          <text class="empty-text">暂无内容</text>
        </view>
        <template v-else>
          <post-card v-for="issue in posts" :key="issue.id" :issue="issue" @click="openDetail(issue)" />
        </template>
        <view v-if="posts.length" class="load-footer">
          <text v-if="loadingMore" class="load-text">加载中…</text>
          <text v-else-if="!hasMore" class="load-text">— 已经到底了 —</text>
        </view>
      </view>
    </scroll-view>

    <tab-bar current="index"></tab-bar>
    <token-modal></token-modal>
  </view>
</template>

<script>
import PostCard    from '../../components/PostCard.vue'
import TabBar      from '../../components/TabBar.vue'
import TokenModal  from '../../components/TokenModal.vue'
import CONFIG      from '../../config.js'
import api         from '../../utils/api.js'
import { getThemeColor, darkenColor } from '../../utils/theme.js'

export default {
  components: { PostCard, TabBar, TokenModal },
  data() {
    return {
      posts:          [],
      hasMore:        true,
      page:           1,
      currentCat:     null,
      loading:        false,
      loadingMore:    false,
      refreshing:     false,
      error:          null,
      categories:     CONFIG.categories,
      siteTitle:      CONFIG.siteTitle || 'Z-BLOG',
      drawerOpen:      false,
      searchKeyword:   '',
      lastKeyword:     '',
      searchMode:      false,
      searchExpanded:  false,
      statusBarHeight: 0,
      themeColor:      getThemeColor(),
    }
  },
  computed: {
    currentCatName() {
      if (!this.currentCat) return this.siteTitle
      const cat = this.categories.find(c => c.label === this.currentCat)
      return cat ? `${cat.icon} ${cat.name}` : this.siteTitle
    },
    headerGradient() {
      return `linear-gradient(135deg, ${this.themeColor} 0%, ${darkenColor(this.themeColor)} 100%)`
    },
  },
  mounted() {
    uni.$on('themeChanged', color => { this.themeColor = color })
  },
  beforeDestroy() {
    uni.$off('themeChanged')
  },
  onLoad() {
    const info = uni.getSystemInfoSync()
    this.statusBarHeight = info.statusBarHeight || 20
    this.loadPosts()
  },
  onShow() {
    uni.$on('switchCategory', (label) => {
      this.switchCat(label)
      uni.$off('switchCategory')
    })
  },
  onHide() { uni.$off('switchCategory') },
  methods: {
    async loadPosts(append = false) {
      if (!append) { this.loading = true; this.error = null }
      else           this.loadingMore = true
      try {
        const issues = await api.getIssues({ page: this.page, label: this.currentCat })
        this.posts   = append ? [...this.posts, ...issues] : issues
        this.hasMore = issues.length >= CONFIG.postsPerPage
      } catch (e) {
        this.error = e.message
      } finally {
        this.loading = this.loadingMore = this.refreshing = false
      }
    },

    switchCat(label) {
      if (this.currentCat === label && !this.searchMode) return
      this.searchMode = false
      this.currentCat = label
      this.page       = 1
      this.posts      = []
      this.hasMore    = true
      this.loadPosts()
    },

    selectCat(label) {
      this.drawerOpen = false
      this.switchCat(label)
    },

    loadMore() {
      if (!this.hasMore || this.loadingMore || this.loading || this.searchMode) return
      this.page++
      this.loadPosts(true)
    },

    onRefresh() {
      this.refreshing = true
      this.page = 1
      api.clearCache()
      this.loadPosts()
    },

    openDetail(issue) {
      uni.navigateTo({ url: `/pages/detail/detail?number=${issue.number}&title=${encodeURIComponent(issue.title)}` })
    },

    async doSearch() {
      const q = this.searchKeyword.trim()
      if (!q) return
      this.lastKeyword    = q
      this.searchMode     = true
      this.searchExpanded = false
      this.loading        = true
      this.posts          = []
      try {
        const { items } = await api.searchIssues(q)
        this.posts = items
      } catch (e) {
        this.error = e.message
      } finally {
        this.loading = false
      }
    },

    cancelSearch() {
      this.searchKeyword  = ''
      this.searchExpanded = false
    },

    clearSearch() {
      this.searchKeyword  = ''
      this.lastKeyword    = ''
      this.searchMode     = false
      this.searchExpanded = false
      this.page           = 1
      this.posts          = []
      this.hasMore        = true
      this.loadPosts()
    },
  }
}
</script>

<style lang="scss" scoped>
.page { display: flex; flex-direction: column; height: 100vh; background: #f8fafc; }

/* ── 遮罩 ────────────────────────────────────────────────── */
.drawer-mask {
  position: fixed; inset: 0; z-index: 100;
  background: rgba(0,0,0,.4);
  /* #ifdef H5 */
  backdrop-filter: blur(2px);
  /* #endif */
}

/* ── 左侧抽屉 ────────────────────────────────────────────── */
.drawer {
  position: fixed; top: 0; left: 0; bottom: 0; z-index: 101;
  width: 540rpx;
  background: #fff;
  display: flex; flex-direction: column;
  transform: translateX(-100%);
  /* #ifdef H5 */
  transition: transform .3s cubic-bezier(.4,0,.2,1);
  /* #endif */
  box-shadow: 8rpx 0 40rpx rgba(0,0,0,.15);
}
.drawer--open { transform: translateX(0); }

.drawer__header {
  display: flex; flex-direction: row; align-items: center;
  padding-left: 32rpx; padding-right: 28rpx; padding-bottom: 28rpx;
  background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
}
.drawer__header-main {
  flex: 1; display: flex; flex-direction: row; align-items: center; gap: 16rpx;
}
.drawer__logo {
  width: 72rpx; height: 72rpx; border-radius: 18rpx;
  background: rgba(255,255,255,.2);
  display: flex; align-items: center; justify-content: center;
}
.drawer__logo-icon { font-size: 38rpx; }
.drawer__title {
  font-size: 34rpx; font-weight: 800; color: #fff;
  text-shadow: 0 1rpx 4rpx rgba(0,0,0,.15);
}
.drawer__close {
  width: 60rpx; height: 60rpx; border-radius: 50%;
  background: rgba(255,255,255,.2);
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.drawer__close-icon { font-size: 26rpx; color: rgba(255,255,255,.9); }

.drawer__menu {
  flex: 1; padding: 12rpx 0;
  overflow-y: auto;
}
.drawer__item {
  display: flex; flex-direction: row; align-items: center;
  padding: 26rpx 32rpx; gap: 22rpx;
  position: relative;
  /* #ifdef H5 */
  transition: background .15s;
  /* #endif */
}
.drawer__item--active {
  background: linear-gradient(90deg, rgba(37,99,235,.08) 0%, rgba(37,99,235,.02) 100%);
}
.drawer__item-icon {
  font-size: 36rpx; width: 52rpx; text-align: center;
  background: #f8fafc; border-radius: 12rpx; padding: 8rpx 0;
}
.drawer__item--active .drawer__item-icon {
  background: rgba(37,99,235,.1);
}
.drawer__item-text {
  flex: 1; font-size: 30rpx; color: #475569; font-weight: 500;
}
.drawer__item--active .drawer__item-text { color: #2563eb; font-weight: 700; }
.drawer__item-dot {
  width: 10rpx; height: 10rpx; border-radius: 50%; background: #2563eb;
  box-shadow: 0 0 6rpx rgba(37,99,235,.5);
}

.drawer__footer {
  padding: 20rpx 32rpx 32rpx;
  border-top: 1rpx solid #f1f5f9;
}
.drawer__footer-text { font-size: 22rpx; color: #94a3b8; }

/* ── Header ──────────────────────────────────────────────── */
.header {
  background: #fff;
  border-bottom: 1rpx solid #f1f5f9;
  padding: 0 24rpx;
  height: 96rpx;
  display: flex; align-items: center; flex-shrink: 0;
  box-shadow: 0 2rpx 8rpx rgba(0,0,0,.04);
  position: relative; z-index: 10;
}
.header__main {
  flex: 1; display: flex; flex-direction: row;
  align-items: center; justify-content: space-between;
}
.header__left {
  display: flex; flex-direction: row; align-items: center; gap: 16rpx;
  flex: 1;
}

/* 汉堡菜单图标 */
.hamburger {
  width: 44rpx; display: flex; flex-direction: column; gap: 9rpx; padding: 4rpx 0;
}
.hamburger__line {
  height: 4rpx; background: #1e293b; border-radius: 2rpx;
  /* #ifdef H5 */
  transition: width .2s;
  /* #endif */
}
.hamburger__line--mid { width: 70%; }
.hamburger__line--shrink { width: 50%; }

.header__cat-name {
  font-size: 32rpx; font-weight: 700; color: #1e293b;
}
.header__icon-btn {
  width: 72rpx; height: 72rpx; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  background: #f8fafc; flex-shrink: 0;
}
.icon { font-size: 34rpx; }

/* 搜索展开 */
.header__search {
  flex: 1; display: flex; flex-direction: row; align-items: center; gap: 16rpx;
}
.search-wrap {
  flex: 1; display: flex; flex-direction: row; align-items: center;
  background: #f1f5f9; border-radius: 12rpx; padding: 14rpx 20rpx; gap: 10rpx;
}
.search-icon  { font-size: 26rpx; color: #94a3b8; }
.search-input { flex: 1; font-size: 28rpx; color: #1e293b; }
.search-clear { font-size: 24rpx; color: #94a3b8; }
.search-cancel { font-size: 28rpx; color: #2563eb; white-space: nowrap; }

/* ── 列表 ────────────────────────────────────────────────── */
.list-scroll { flex: 1; height: 0; background: #f0f2f5; }
.list-inner  { padding: 16rpx 20rpx 160rpx; display: flex; flex-direction: column; gap: 12rpx; }

.search-result-bar {
  display: flex; flex-direction: row; align-items: center; padding: 16rpx 4rpx 18rpx;
}
.search-result-kw   { flex: 1; font-size: 26rpx; color: #1e293b; font-weight: 600; }
.search-result-back { font-size: 24rpx; color: #94a3b8; padding: 6rpx; }

/* 骨架屏 */
.skeleton-card {
  background: #fff; border-bottom: 1rpx solid #f0f0f0;
  padding: 24rpx 28rpx;
  display: flex; flex-direction: row; gap: 20rpx;
}
.skeleton-card::before {
  content: ''; display: block; width: 80rpx; height: 80rpx;
  border-radius: 10rpx; flex-shrink: 0;
  background: #f1f5f9;
}
.skeleton {
  border-radius: 8rpx; height: 26rpx;
  background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%);
  background-size: 400% 100%; animation: shimmer 1.4s infinite;
}
.sk-full { width: 100%; }
.sk-medium { width: 60%; }
.sk-short { width: 28%; }
@keyframes shimmer { 0%{ background-position: 200% 0; } 100%{ background-position: -200% 0; } }

/* 空/错误 */
.empty {
  text-align: center; padding: 80rpx 40rpx;
  display: flex; flex-direction: column; align-items: center; gap: 16rpx;
}
.empty-icon { font-size: 80rpx; }
.empty-text { font-size: 28rpx; color: #94a3b8; }
.error-box  { background: #fef2f2; border-radius: 10rpx; padding: 28rpx; margin: 20rpx 0; }
.error-box text { color: #b91c1c; font-size: 28rpx; }

.load-footer { padding: 30rpx 0 20rpx; text-align: center; }
.load-text   { font-size: 26rpx; color: #94a3b8; }
</style>
