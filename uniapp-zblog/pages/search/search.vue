<template>
  <view class="page">
    <!-- 搜索框 -->
    <view class="search-bar">
      <view class="search-input-wrap">
        <text class="search-icon">🔍</text>
        <input
          class="search-input"
          v-model="keyword"
          placeholder="搜索文章标题…"
          confirm-type="search"
          @confirm="doSearch"
          :focus="true" />
        <text v-if="keyword" class="search-clear" @click="clearSearch">✕</text>
      </view>
      <text class="search-btn" @click="doSearch">搜索</text>
    </view>

    <!-- 搜索提示 -->
    <view v-if="!hasSearched" class="tips">
      <text class="tips-icon">💡</text>
      <text class="tips-text">支持标题关键词搜索</text>
      <text class="tips-sub">调用 GitHub Search API</text>
    </view>

    <!-- 加载 -->
    <view v-else-if="loading" class="loading-wrap">
      <view class="spinner"></view>
      <text class="loading-text">搜索中…</text>
    </view>

    <!-- 结果 -->
    <scroll-view v-else scroll-y class="result-scroll">
      <view class="result-inner">
        <!-- 结果数 -->
        <text v-if="results.length" class="result-count">找到 {{ results.length }} 条结果</text>

        <!-- 空结果 -->
        <view v-if="!results.length && !loading" class="empty">
          <text class="empty-icon">🔍</text>
          <text class="empty-text">未找到 "{{ lastKeyword }}"</text>
          <text class="empty-sub">换个关键词试试</text>
        </view>

        <!-- 列表 -->
        <view
          v-for="issue in results" :key="issue.id"
          class="result-item"
          @click="openDetail(issue)">
          <view class="result-header">
            <view v-if="cat(issue)" class="badge" :style="{ background: cat(issue).color+'18', color: cat(issue).color, borderColor: cat(issue).color+'50' }">
              {{ cat(issue).icon }} {{ cat(issue).name }}
            </view>
            <text class="result-date">{{ formatDate(issue.created_at) }}</text>
          </view>
          <text class="result-title">{{ issue.title }}</text>
          <text class="result-excerpt">{{ excerpt(issue.body) }}</text>
        </view>

        <!-- 错误 -->
        <view v-if="error" class="error-box">
          <text>⚠️ {{ error }}</text>
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script>
import api from '../../utils/api.js'
import { getCategoryFromLabels, formatDate, extractExcerpt } from '../../utils/helper.js'

export default {
  data() {
    return {
      keyword:     '',
      lastKeyword: '',
      results:     [],
      loading:     false,
      hasSearched: false,
      error:       null,
    }
  },
  methods: {
    async doSearch() {
      const q = this.keyword.trim()
      if (!q) return
      this.lastKeyword = q
      this.loading = true
      this.hasSearched = true
      this.error = null
      this.results = []
      try {
        const { items } = await api.searchIssues(q)
        this.results = items
      } catch (e) {
        this.error = e.message
      } finally {
        this.loading = false
      }
    },
    clearSearch() {
      this.keyword = ''
      this.results = []
      this.hasSearched = false
    },
    openDetail(issue) {
      uni.navigateTo({ url: `/pages/detail/detail?number=${issue.number}&title=${encodeURIComponent(issue.title)}` })
    },
    cat(issue)        { return getCategoryFromLabels(issue.labels) },
    formatDate,
    excerpt(body)     { return extractExcerpt(body, 80) },
  }
}
</script>

<style lang="scss" scoped>
.page { background: #f8fafc; height: 100vh; display: flex; flex-direction: column; }

/* 搜索框 */
.search-bar {
  display: flex; flex-direction: row; align-items: center;
  gap: 14rpx; padding: 20rpx 24rpx;
  background: #fff; border-bottom: 1rpx solid #e2e8f0;
}
.search-input-wrap {
  flex: 1; display: flex; flex-direction: row; align-items: center;
  background: #f1f5f9; border-radius: 10rpx;
  padding: 14rpx 18rpx; gap: 10rpx;
}
.search-icon { font-size: 28rpx; }
.search-input {
  flex: 1; font-size: 28rpx; color: #1e293b; background: transparent;
}
.search-clear { font-size: 26rpx; color: #94a3b8; padding: 0 4rpx; }
.search-btn {
  font-size: 28rpx; color: #2563eb; font-weight: 600;
  padding: 14rpx 10rpx; white-space: nowrap;
}

/* 提示 */
.tips {
  flex: 1; display: flex; flex-direction: column;
  align-items: center; justify-content: center; gap: 12rpx;
}
.tips-icon { font-size: 70rpx; }
.tips-text { font-size: 28rpx; color: #64748b; font-weight: 500; }
.tips-sub  { font-size: 24rpx; color: #94a3b8; }

/* 加载 */
.loading-wrap {
  flex: 1; display: flex; flex-direction: column;
  align-items: center; justify-content: center; gap: 20rpx;
}
.spinner {
  width: 56rpx; height: 56rpx; border: 4rpx solid #e2e8f0;
  border-top-color: #2563eb; border-radius: 50%;
  animation: spin .8s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }
.loading-text { font-size: 26rpx; color: #94a3b8; }

/* 结果 */
.result-scroll { flex: 1; }
.result-inner  { padding: 16rpx 24rpx 60rpx; }
.result-count  { font-size: 24rpx; color: #94a3b8; display: block; margin-bottom: 16rpx; }

.result-item {
  background: #fff; border-radius: 10rpx;
  padding: 24rpx; margin-bottom: 14rpx;
  box-shadow: 0 1rpx 4rpx rgba(0,0,0,.06);
}
.result-header {
  display: flex; flex-direction: row; align-items: center;
  gap: 12rpx; margin-bottom: 12rpx;
}
.badge {
  font-size: 22rpx; font-weight: 600;
  padding: 4rpx 14rpx; border-radius: 99rpx; border: 1rpx solid;
}
.result-date { font-size: 22rpx; color: #94a3b8; margin-left: auto; }
.result-title {
  font-size: 30rpx; font-weight: 700; color: #1e293b;
  display: block; margin-bottom: 10rpx;
}
.result-excerpt {
  font-size: 26rpx; color: #64748b; line-height: 1.5; display: block;
  /* #ifndef APP-NVUE */
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  /* #endif */
}

/* 空/错误 */
.empty {
  display: flex; flex-direction: column; align-items: center;
  padding: 60rpx 40rpx; gap: 12rpx;
}
.empty-icon { font-size: 70rpx; }
.empty-text { font-size: 28rpx; color: #64748b; font-weight: 500; }
.empty-sub  { font-size: 24rpx; color: #94a3b8; }
.error-box  { background: #fef2f2; border-radius: 10rpx; padding: 28rpx; }
.error-box text { color: #b91c1c; font-size: 28rpx; }
</style>
