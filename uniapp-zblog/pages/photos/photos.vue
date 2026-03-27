<template>
  <view class="page">
    <!-- 顶部 -->
    <view class="hero">
      <text class="hero-title">🖼️ 照片墙</text>
      <text class="hero-count">{{ totalCount > 0 ? `共 ${totalCount} 张` : (loading ? '加载中…' : '') }}</text>
    </view>

    <view v-if="loading && !photos.length" class="skeleton-grid">
      <view v-for="i in 9" :key="i" class="skeleton-cell"></view>
    </view>
    <view v-else-if="error" class="error-box"><text>⚠️ {{ error }}</text></view>
    <view v-else-if="!photos.length" class="empty">
      <text class="empty-icon">🖼️</text>
      <text class="empty-text">暂无图片</text>
      <text class="empty-sub">请在 GitHub 创建带 image 标签的 Issue</text>
    </view>

    <!-- 三列等尺寸方形网格 -->
    <scroll-view v-else scroll-y class="wall-scroll">
      <view class="grid">
        <view
          v-for="item in photos" :key="item.id"
          class="grid-cell"
          @click="preview(item)">
          <view v-if="!item.loaded" class="cell-skeleton"></view>
          <image
            class="cell-img"
            :src="thumbUrl(item.src)"
            mode="aspectFill"
            lazy-load
            @load="item.loaded = true"
            @error="item.loaded = true">
          </image>
          <!-- 日期遮罩 -->
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
import { extractImages, formatDate } from '../../utils/helper.js'

export default {
  components: { TabBar, TokenModal },
  data() {
    return { photos: [], loading: true, error: null }
  },
  computed: {
    totalCount() { return this.photos.length },
    allUrls()    { return this.photos.map(p => p.src) },
  },
  onLoad() { this.loadAll() },
  methods: {
    // GitHub user-images CDN 支持 width 参数，加速缩略图加载
    thumbUrl(src) {
      if (src && src.includes('user-images.githubusercontent.com')) {
        return src + (src.includes('?') ? '&' : '?') + 'width=400'
      }
      return src
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
          extractImages(issue.body || '').forEach(src => {
            this.photos.push({ id: id++, src, title: issue.title, date: formatDate(issue.created_at), loaded: false })
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
  padding: 24rpx 28rpx 16rpx;
  display: flex; flex-direction: row; align-items: center; flex-shrink: 0;
}
.hero-title { font-size: 30rpx; font-weight: 700; color: #fff; flex: 1; }
.hero-count { font-size: 24rpx; color: rgba(255,255,255,.5); }

/* 骨架屏网格 */
.skeleton-grid {
  display: flex; flex-wrap: wrap;
  padding: 3rpx;
}
.skeleton-cell {
  width: 33.333%; aspect-ratio: 1;
  padding: 3rpx; box-sizing: border-box;
}
.skeleton-cell::after {
  content: ''; display: block; width: 100%; height: 100%;
  background: #1e293b;
  animation: pulse 1.4s ease-in-out infinite;
}
@keyframes pulse {
  0%, 100% { opacity: 0.5; }
  50%       { opacity: 1; }
}

.empty { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 14rpx; }
.empty-icon { font-size: 80rpx; }
.empty-text { font-size: 32rpx; color: rgba(255,255,255,.8); font-weight: 600; }
.empty-sub  { font-size: 24rpx; color: rgba(255,255,255,.4); }
.error-box  { margin: 40rpx; padding: 30rpx; background: #450a0a; border-radius: 10rpx; }
.error-box text { color: #fca5a5; font-size: 28rpx; }

/* 等尺寸方形三列网格 */
.wall-scroll { flex: 1; height: 0; }
.grid {
  display: flex; flex-wrap: wrap;
  padding: 3rpx;
}
.grid-cell {
  width: 33.333%;
  aspect-ratio: 1;
  padding: 3rpx;
  box-sizing: border-box;
  position: relative;
  background: #1e293b;
}
.cell-skeleton {
  position: absolute; inset: 3rpx;
  background: linear-gradient(110deg, #1e293b 25%, #334155 50%, #1e293b 75%);
  background-size: 300% 100%;
  animation: shimmer 1.4s infinite;
}
@keyframes shimmer {
  0%   { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
.cell-img {
  position: absolute; inset: 3rpx;
  width: calc(100% - 6rpx); height: calc(100% - 6rpx);
}
/* 日期遮罩 */
.cell-date-bar {
  position: absolute; bottom: 3rpx; left: 3rpx; right: 3rpx;
  padding: 20rpx 10rpx 8rpx;
  background: linear-gradient(transparent, rgba(0,0,0,.65));
  border-radius: 0 0 4rpx 4rpx;
}
.cell-date-text {
  font-size: 17rpx; color: rgba(255,255,255,.9);
  font-weight: 500; display: block;
}
</style>
