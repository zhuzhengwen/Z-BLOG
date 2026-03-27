<template>
  <view class="page">
    <!-- 顶部 -->
    <view class="hero">
      <text class="hero-title">🖼️ 照片墙</text>
      <text class="hero-count">{{ totalCount > 0 ? `共 ${totalCount} 张` : '加载中…' }}</text>
    </view>

    <view v-if="loading" class="loading-wrap">
      <view class="spinner"></view>
      <text class="loading-text">正在加载所有图片…</text>
    </view>
    <view v-else-if="error" class="error-box"><text>⚠️ {{ error }}</text></view>
    <view v-else-if="!photos.length" class="empty">
      <text class="empty-icon">🖼️</text>
      <text class="empty-text">暂无图片</text>
      <text class="empty-sub">请在 GitHub 创建带 image 标签的 Issue</text>
    </view>

    <!-- 三列瀑布流 -->
    <scroll-view v-else scroll-y class="wall-scroll">
      <view class="waterfall">
        <view class="wf-col" v-for="col in 3" :key="col">
          <view
            v-for="item in getCol(col - 1)" :key="item.id"
            class="photo-item"
            @click="preview(item)">
            <image :src="item.src" mode="widthFix" lazy-load class="photo-img"></image>
            <view class="photo-overlay">
              <text class="photo-title">{{ item.title }}</text>
              <text class="photo-date">{{ item.date }}</text>
            </view>
          </view>
        </view>
      </view>
      <view style="height:160rpx"></view>
    </scroll-view>

    <!-- 自定义底部导航 -->
    <tab-bar current="photos"></tab-bar>
    <token-modal></token-modal>
  </view>
</template>

<script>
import TabBar     from '../../components/TabBar.vue'
import TokenModal from '../../components/TokenModal.vue'
import api    from '../../utils/api.js'
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
    getCol(colIndex) {
      return this.photos.filter((_, i) => i % 3 === colIndex)
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
            this.photos.push({ id: id++, src, title: issue.title, date: formatDate(issue.created_at) })
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

.loading-wrap { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 20rpx; }
.spinner { width: 60rpx; height: 60rpx; border: 4rpx solid rgba(255,255,255,.2); border-top-color: #2563eb; border-radius: 50%; animation: spin .8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
.loading-text { font-size: 28rpx; color: rgba(255,255,255,.5); }
.empty { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 14rpx; }
.empty-icon { font-size: 80rpx; }
.empty-text { font-size: 32rpx; color: rgba(255,255,255,.8); font-weight: 600; }
.empty-sub  { font-size: 24rpx; color: rgba(255,255,255,.4); }
.error-box  { margin: 40rpx; padding: 30rpx; background: #450a0a; border-radius: 10rpx; }
.error-box text { color: #fca5a5; font-size: 28rpx; }

/* 三列瀑布流 */
.wall-scroll { flex: 1; }
.waterfall { display: flex; flex-direction: row; padding: 8rpx; gap: 8rpx; }
.wf-col    { flex: 1; display: flex; flex-direction: column; gap: 8rpx; }

.photo-item {
  border-radius: 8rpx; overflow: hidden; position: relative; background: #1e293b;
}
.photo-img { width: 100%; display: block; }
.photo-overlay {
  position: absolute; bottom: 0; left: 0; right: 0;
  background: linear-gradient(transparent, rgba(0,0,0,.75));
  padding: 24rpx 10rpx 10rpx; opacity: 0;
  /* #ifdef H5 */
  transition: opacity .2s;
  /* #endif */
}
/* #ifdef H5 */
.photo-item:hover .photo-overlay { opacity: 1; }
/* #endif */
.photo-title { font-size: 18rpx; color: #fff; font-weight: 600; display: block; overflow: hidden; }
.photo-date  { font-size: 16rpx; color: rgba(255,255,255,.7); display: block; margin-top: 2rpx; }
</style>
