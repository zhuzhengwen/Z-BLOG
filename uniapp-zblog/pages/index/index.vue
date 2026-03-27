<template>
  <view class="page">

    <!-- 顶部搜索栏 -->
    <view class="search-bar">
      <view class="search-wrap">
        <text class="search-icon">🔍</text>
        <input
          class="search-input"
          v-model="searchKeyword"
          placeholder="搜索文章…"
          confirm-type="search"
          @confirm="doSearch" />
        <text v-if="searchKeyword" class="search-clear" @click="clearSearch">✕</text>
      </view>
    </view>

    <!-- 分类筛选栏（可折叠） -->
    <view class="chips-section">
      <scroll-view v-if="chipsVisible" class="chips-bar" scroll-x :show-scrollbar="false">
        <view class="chips-inner">
          <view class="chip" :class="{ 'chip--active': !currentCat }" @click="switchCat(null)">
            🏠 全部
          </view>
          <view
            v-for="c in categories" :key="c.label"
            class="chip"
            :class="{ 'chip--active': currentCat === c.label }"
            @click="switchCat(c.label)">
            {{ c.icon }} {{ c.name }}
          </view>
        </view>
      </scroll-view>
      <view class="chips-toggle" @click="chipsVisible = !chipsVisible">
        <text class="chips-toggle__text">{{ chipsVisible ? '收起 ▲' : '展开分类 ▼' }}</text>
      </view>
    </view>

    <!-- 搜索结果模式 -->
    <scroll-view v-if="searchMode" scroll-y class="list-scroll">
      <view class="list-inner">
        <view class="search-header">
          <text class="search-header__title">🔍 "{{ lastKeyword }}"</text>
          <text class="search-header__close" @click="clearSearch">✕ 返回</text>
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

    <!-- 正常列表模式 -->
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

    <!-- 自定义底部导航 -->
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
      posts:         [],
      hasMore:       true,
      page:          1,
      currentCat:    null,
      loading:       false,
      loadingMore:   false,
      refreshing:    false,
      error:         null,
      categories:    CONFIG.categories,
      chipsVisible:  true,
      searchKeyword: '',
      lastKeyword:   '',
      searchMode:    false,
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
      this.searchKeyword = ''
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
      this.lastKeyword = q
      this.searchMode  = true
      this.loading     = true
      this.posts       = []
      try {
        const { items } = await api.searchIssues(q)
        this.posts = items
      } catch (e) {
        this.error = e.message
      } finally {
        this.loading = false
      }
    },

    clearSearch() {
      this.searchKeyword = ''
      this.lastKeyword   = ''
      this.searchMode    = false
      this.page          = 1
      this.posts         = []
      this.hasMore       = true
      this.loadPosts()
    },
  }
}
</script>

<style lang="scss" scoped>
.page { display: flex; flex-direction: column; height: 100vh; background: #f8fafc; }

/* 搜索栏 */
.search-bar {
  background: #2563eb; padding: 20rpx 24rpx 16rpx; flex-shrink: 0;
}
.search-wrap {
  display: flex; flex-direction: row; align-items: center;
  background: rgba(255,255,255,.2); border-radius: 12rpx;
  padding: 14rpx 20rpx; gap: 12rpx;
}
.search-icon { font-size: 28rpx; color: #fff; }
.search-input { flex: 1; font-size: 28rpx; color: #fff; }
.search-clear { font-size: 26rpx; color: rgba(255,255,255,.8); padding: 0 4rpx; }

/* 分类筛选区 */
.chips-section { background: #fff; border-bottom: 1rpx solid #e2e8f0; flex-shrink: 0; }
.chips-bar { white-space: nowrap; }
.chips-inner { display: inline-flex; flex-direction: row; gap: 12rpx; padding: 16rpx 24rpx 12rpx; }
.chip {
  display: inline-flex; align-items: center;
  padding: 10rpx 26rpx; border-radius: 99rpx;
  font-size: 26rpx; color: #64748b;
  background: #f1f5f9; white-space: nowrap; border: 2rpx solid transparent;
}
.chip--active { background: rgba(37,99,235,.1); color: #2563eb; border-color: rgba(37,99,235,.4); }
.chips-toggle { padding: 6rpx 0 10rpx; text-align: center; }
.chips-toggle__text { font-size: 22rpx; color: #94a3b8; }

/* 列表 */
.list-scroll { flex: 1; }
.list-inner  { padding: 16rpx 20rpx 160rpx; }

/* 搜索结果头 */
.search-header {
  display: flex; flex-direction: row; align-items: center;
  padding: 14rpx 4rpx 18rpx; gap: 12rpx;
}
.search-header__title { flex: 1; font-size: 26rpx; color: #1e293b; font-weight: 600; }
.search-header__close { font-size: 24rpx; color: #2563eb; padding: 8rpx 4rpx; }

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
.empty { text-align: center; padding: 80rpx 40rpx; display: flex; flex-direction: column; align-items: center; gap: 16rpx; }
.empty-icon { font-size: 80rpx; }
.empty-text { font-size: 28rpx; color: #94a3b8; }
.error-box  { background: #fef2f2; border-radius: 10rpx; padding: 28rpx; margin: 20rpx 0; }
.error-box text { color: #b91c1c; font-size: 28rpx; }

.load-footer { padding: 30rpx 0 20rpx; text-align: center; }
.load-text   { font-size: 26rpx; color: #94a3b8; }
</style>
