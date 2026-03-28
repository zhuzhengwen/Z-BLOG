<template>
  <view class="page">

    <!-- 顶部标题栏 -->
    <view class="hero">
      <text class="hero-title">🖼️ 照片墙</text>
      <text class="hero-count">{{ countLabel }}</text>
    </view>

    <!-- 搜索框 -->
    <view class="search-bar">
      <view class="search-wrap">
        <text class="search-icon">🔍</text>
        <input class="search-input" v-model="keyword" placeholder="搜索图片…" />
        <text v-if="keyword" class="search-clear" @click="keyword = ''">✕</text>
      </view>
    </view>

    <!-- 年份 Tabs -->
    <scroll-view v-if="years.length" scroll-x class="filter-scroll">
      <view class="filter-bar">
        <view class="filter-chip" :class="{ 'filter-chip--active': selectedYear === null }"
          @click="selectYear(null)">
          <text class="filter-chip__text">全部</text>
        </view>
        <view v-for="y in years" :key="y"
          class="filter-chip" :class="{ 'filter-chip--active': selectedYear === y }"
          @click="selectYear(y)">
          <text class="filter-chip__text">{{ y }} 年</text>
        </view>
      </view>
    </scroll-view>

    <!-- 月份 Tabs（选年后显示） -->
    <scroll-view v-if="selectedYear && months.length > 1" scroll-x class="filter-scroll filter-scroll--sub">
      <view class="filter-bar">
        <view class="filter-chip filter-chip--sm" :class="{ 'filter-chip--active': selectedMonth === null }"
          @click="selectedMonth = null">
          <text class="filter-chip__text">全部月份</text>
        </view>
        <view v-for="m in months" :key="m"
          class="filter-chip filter-chip--sm" :class="{ 'filter-chip--active': selectedMonth === m }"
          @click="selectedMonth = m">
          <text class="filter-chip__text">{{ m }} 月</text>
        </view>
      </view>
    </scroll-view>

    <!-- 状态 -->
    <view v-if="loading && !allPhotos.length" class="skeleton-grid">
      <view v-for="i in 9" :key="i" class="skeleton-cell"></view>
    </view>
    <view v-else-if="error" class="error-box"><text>⚠️ {{ error }}</text></view>
    <view v-else-if="!photos.length" class="empty">
      <text class="empty-icon">🖼️</text>
      <text class="empty-text">{{ allPhotos.length ? '没有匹配的图片' : '暂无图片' }}</text>
    </view>

    <!-- 三列方形网格 -->
    <scroll-view v-else scroll-y class="wall-scroll">
      <view class="grid">
        <view v-for="item in photos" :key="item.id" class="grid-cell" @click="preview(item)">
          <view v-if="!item.loaded" class="cell-skeleton"></view>
          <image class="cell-img" :src="thumbUrl(item.src)" mode="aspectFill" lazy-load
            @load="item.loaded = true" @error="item.loaded = true" />
          <view class="cell-date-bar">
            <text class="cell-date-text">{{ item.date }}</text>
          </view>
        </view>
      </view>
      <view style="height:160rpx"></view>
    </scroll-view>

    <tab-bar current="photos"></tab-bar>
    <token-modal></token-modal>
  </view>
</template>

<script>
import TabBar     from '../../components/TabBar.vue'
import TokenModal from '../../components/TokenModal.vue'
import api        from '../../utils/api.js'
import { extractImages, formatDate, compressImg } from '../../utils/helper.js'

export default {
  components: { TabBar, TokenModal },
  data() {
    return {
      allPhotos:     [],
      selectedYear:  null,
      selectedMonth: null,
      keyword:       '',
      loading:       true,
      error:         null,
    }
  },
  computed: {
    // 所有年份（降序）
    years() {
      const s = new Set(this.allPhotos.map(p => p.year))
      return [...s].sort((a, b) => b - a)
    },

    // 当前年下的月份（升序）
    months() {
      if (!this.selectedYear) return []
      const s = new Set(this.allPhotos.filter(p => p.year === this.selectedYear).map(p => p.month))
      return [...s].sort((a, b) => a - b)
    },

    photos() {
      const kw = this.keyword.trim().toLowerCase()
      return this.allPhotos.filter(p => {
        if (this.selectedYear  && p.year  !== this.selectedYear)  return false
        if (this.selectedMonth && p.month !== this.selectedMonth) return false
        if (kw && !p.title.toLowerCase().includes(kw))           return false
        return true
      })
    },

    countLabel() {
      if (this.loading && !this.allPhotos.length) return '加载中…'
      const total = this.allPhotos.length
      const cur   = this.photos.length
      return cur < total ? `${cur} / ${total} 张` : `共 ${total} 张`
    },

    allUrls() { return this.photos.map(p => p.src) },
  },
  onLoad() { this.loadAll() },
  methods: {
    thumbUrl(src) { return compressImg(src, 400) },

    selectYear(y) {
      this.selectedYear  = y
      this.selectedMonth = null
    },

    async loadAll() {
      try {
        let page = 1, allIssues = []
        while (true) {
          const batch = await api.getIssues({ page, perPage: 100, label: 'image' })
          allIssues = allIssues.concat(batch)
          if (batch.length < 100) break
          page++
        }
        let id = 0
        allIssues.forEach(issue => {
          const d = new Date(issue.created_at)
          extractImages(issue.body || '').forEach(src => {
            this.allPhotos.push({
              id:    id++,
              src,
              title: issue.title,
              date:  formatDate(issue.created_at),
              year:  d.getFullYear(),
              month: d.getMonth() + 1,
              loaded: false,
            })
          })
        })
      } catch (e) {
        this.error = e.message
      } finally {
        this.loading = false
      }
    },

    preview(item) {
      const idx = this.allUrls.indexOf(item.src)
      uni.previewImage({ urls: this.allUrls, current: this.allUrls[idx] })
    },
  }
}
</script>

<style lang="scss" scoped>
.page { height: 100vh; display: flex; flex-direction: column; background: #0f172a; }

.hero {
  padding: 24rpx 28rpx 12rpx;
  display: flex; flex-direction: row; align-items: center; flex-shrink: 0;
}
.hero-title { font-size: 30rpx; font-weight: 700; color: #fff; flex: 1; }
.hero-count { font-size: 24rpx; color: rgba(255,255,255,.5); }

/* 搜索框 */
.search-bar { padding: 0 20rpx 12rpx; flex-shrink: 0; }
.search-wrap {
  display: flex; flex-direction: row; align-items: center;
  background: rgba(255,255,255,.1); border-radius: 12rpx;
  padding: 12rpx 20rpx; gap: 12rpx;
}
.search-icon  { font-size: 26rpx; color: rgba(255,255,255,.5); }
.search-input { flex: 1; font-size: 26rpx; color: #fff; }
.search-clear { font-size: 24rpx; color: rgba(255,255,255,.4); padding: 4rpx; }

/* 筛选条 */
.filter-scroll { flex-shrink: 0; }
.filter-scroll--sub { opacity: .85; }
.filter-bar {
  display: flex; flex-direction: row;
  padding: 0 20rpx 12rpx; gap: 10rpx; white-space: nowrap;
}
.filter-chip {
  display: flex; align-items: center;
  padding: 10rpx 26rpx; border-radius: 99rpx; flex-shrink: 0;
  background: rgba(255,255,255,.1);
}
.filter-chip--sm { padding: 8rpx 20rpx; }
.filter-chip--active { background: #3b82f6; }
.filter-chip__text { font-size: 26rpx; color: rgba(255,255,255,.85); font-weight: 500; }
.filter-chip--sm .filter-chip__text { font-size: 24rpx; }

/* 骨架 */
.skeleton-grid { display: flex; flex-wrap: wrap; padding: 3rpx; }
.skeleton-cell { width: 33.333%; aspect-ratio: 1; padding: 3rpx; box-sizing: border-box; }
.skeleton-cell::after {
  content: ''; display: block; width: 100%; height: 100%;
  background: #1e293b; animation: pulse 1.4s ease-in-out infinite;
}
@keyframes pulse { 0%, 100% { opacity: .5; } 50% { opacity: 1; } }

/* 空 / 错误 */
.empty { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 14rpx; }
.empty-icon { font-size: 80rpx; }
.empty-text { font-size: 28rpx; color: rgba(255,255,255,.7); }
.error-box  { margin: 40rpx; padding: 30rpx; background: #450a0a; border-radius: 10rpx; }
.error-box text { color: #fca5a5; font-size: 28rpx; }

/* 九宫格 */
.wall-scroll { flex: 1; height: 0; }
.grid { display: flex; flex-wrap: wrap; padding: 3rpx; }
.grid-cell {
  width: 33.333%; aspect-ratio: 1;
  padding: 3rpx; box-sizing: border-box;
  position: relative; background: #1e293b;
}
.cell-skeleton {
  position: absolute; inset: 3rpx;
  background: linear-gradient(110deg, #1e293b 25%, #334155 50%, #1e293b 75%);
  background-size: 300% 100%; animation: shimmer 1.4s infinite;
}
@keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
.cell-img { position: absolute; inset: 3rpx; width: calc(100% - 6rpx); height: calc(100% - 6rpx); }
.cell-date-bar {
  position: absolute; bottom: 3rpx; left: 3rpx; right: 3rpx;
  padding: 20rpx 10rpx 8rpx;
  background: linear-gradient(transparent, rgba(0,0,0,.65));
  border-radius: 0 0 4rpx 4rpx;
}
.cell-date-text { font-size: 17rpx; color: rgba(255,255,255,.9); font-weight: 500; display: block; }
</style>
