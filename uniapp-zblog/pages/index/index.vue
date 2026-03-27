<template>
  <view class="page">

    <!-- 顶部 Header -->
    <view class="header">
      <view v-if="!searchExpanded" class="header__main">
        <text class="header__title">{{ siteTitle }}</text>
        <view class="header__actions">
          <view class="header__icon-btn" @click="searchExpanded = true">
            <text class="icon">🔍</text>
          </view>
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
            @confirm="doSearch"
          />
          <text v-if="searchKeyword" class="search-clear" @click="searchKeyword = ''">✕</text>
        </view>
        <text class="search-cancel" @click="cancelSearch">取消</text>
      </view>
    </view>

    <!-- 分类 Tab 栏 -->
    <view class="tabs-bar">
      <scroll-view class="tabs-scroll" scroll-x :show-scrollbar="false">
        <view class="tabs-inner">
          <view
            class="tab"
            :class="{ 'tab--active': !currentCat }"
            @click="switchCat(null)">
            <text class="tab__text">全部</text>
            <view v-if="!currentCat" class="tab__line"></view>
          </view>
          <view
            v-for="c in categories" :key="c.label"
            class="tab"
            :class="{ 'tab--active': currentCat === c.label }"
            @click="switchCat(c.label)">
            <text class="tab__text">{{ c.icon }} {{ c.name }}</text>
            <view v-if="currentCat === c.label" class="tab__line"></view>
          </view>
        </view>
      </scroll-view>
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
            <view class="skeleton sk-short"></view>
            <view class="skeleton sk-full"></view>
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
            <view class="skeleton sk-short"></view>
            <view class="skeleton sk-full"></view>
            <view class="skeleton sk-medium"></view>
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
  </view>
</template>

<script>
import PostCard from '../../components/PostCard.vue'
import TabBar   from '../../components/TabBar.vue'
import CONFIG   from '../../config.js'
import api      from '../../utils/api.js'

export default {
  components: { PostCard, TabBar },
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
      searchKeyword:  '',
      lastKeyword:    '',
      searchMode:     false,
      searchExpanded: false,
    }
  },
  onLoad() { this.loadPosts() },
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
      this.searchMode    = false
      this.currentCat    = label
      this.page          = 1
      this.posts         = []
      this.hasMore       = true
      this.loadPosts()
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

/* ── Header ─────────────────────────────────────────────── */
.header {
  background: #fff;
  border-bottom: 1rpx solid #f1f5f9;
  padding: 0 28rpx;
  height: 96rpx;
  display: flex;
  align-items: center;
  flex-shrink: 0;
  box-shadow: 0 2rpx 8rpx rgba(0,0,0,.04);
}
.header__main {
  flex: 1; display: flex; flex-direction: row;
  align-items: center; justify-content: space-between;
}
.header__title {
  font-size: 36rpx; font-weight: 800; color: #1e293b; letter-spacing: -0.5rpx;
}
.header__actions { display: flex; flex-direction: row; gap: 4rpx; }
.header__icon-btn {
  width: 72rpx; height: 72rpx; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  background: #f8fafc;
}
.icon { font-size: 36rpx; }

/* 搜索展开 */
.header__search {
  flex: 1; display: flex; flex-direction: row; align-items: center; gap: 16rpx;
}
.search-wrap {
  flex: 1; display: flex; flex-direction: row; align-items: center;
  background: #f1f5f9; border-radius: 12rpx;
  padding: 14rpx 20rpx; gap: 10rpx;
}
.search-icon { font-size: 26rpx; color: #94a3b8; }
.search-input { flex: 1; font-size: 28rpx; color: #1e293b; }
.search-clear { font-size: 24rpx; color: #94a3b8; padding: 0 2rpx; }
.search-cancel { font-size: 28rpx; color: #2563eb; white-space: nowrap; padding: 8rpx 0; }

/* ── 分类 Tab 栏 ─────────────────────────────────────────── */
.tabs-bar {
  background: #fff;
  border-bottom: 1rpx solid #e2e8f0;
  flex-shrink: 0;
}
.tabs-scroll { white-space: nowrap; }
.tabs-inner {
  display: inline-flex; flex-direction: row;
  padding: 0 20rpx;
}
.tab {
  display: inline-flex; flex-direction: column;
  align-items: center; padding: 24rpx 24rpx 0;
  position: relative; min-width: 80rpx;
}
.tab__text {
  font-size: 28rpx; color: #94a3b8; white-space: nowrap;
  padding-bottom: 22rpx; font-weight: 500;
}
.tab--active .tab__text { color: #2563eb; font-weight: 700; }
.tab__line {
  position: absolute; bottom: 0; left: 16rpx; right: 16rpx;
  height: 4rpx; background: #2563eb; border-radius: 2rpx;
}

/* ── 列表 ────────────────────────────────────────────────── */
.list-scroll { flex: 1; }
.list-inner  { padding: 16rpx 20rpx 160rpx; }

/* 搜索结果条 */
.search-result-bar {
  display: flex; flex-direction: row; align-items: center;
  padding: 16rpx 4rpx 18rpx;
}
.search-result-kw   { flex: 1; font-size: 26rpx; color: #1e293b; font-weight: 600; }
.search-result-back { font-size: 24rpx; color: #94a3b8; padding: 6rpx; }

/* 骨架屏 */
.skeleton-card {
  background: #fff; border-radius: 10rpx;
  padding: 28rpx; margin-bottom: 12rpx;
  display: flex; flex-direction: column; gap: 18rpx;
}
.skeleton {
  border-radius: 8rpx; height: 26rpx;
  background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%);
  background-size: 400% 100%; animation: shimmer 1.4s infinite;
}
.sk-full { width: 100%; }
.sk-medium { width: 60%; }
.sk-short { width: 28%; }
@keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }

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
