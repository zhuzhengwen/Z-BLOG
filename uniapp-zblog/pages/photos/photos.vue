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
        <input
          class="search-input"
          v-model="keyword"
          placeholder="搜索相册…"
          @input="onSearch" />
        <text v-if="keyword" class="search-clear" @click="keyword = ''">✕</text>
      </view>
    </view>

    <!-- 相册 Tabs（横向滚动） -->
    <scroll-view v-if="albums.length > 1" scroll-x class="album-scroll">
      <view class="album-bar">
        <view
          class="album-chip"
          :class="{ 'album-chip--active': selectedAlbum === null }"
          @click="selectAlbum(null)">
          <text class="album-chip__label">全部</text>
          <text class="album-chip__count">{{ allPhotos.length }}</text>
        </view>
        <view
          v-for="a in albums"
          :key="a.issueNum"
          class="album-chip"
          :class="{ 'album-chip--active': selectedAlbum === a.issueNum }"
          @click="selectAlbum(a.issueNum)">
          <text class="album-chip__label">{{ a.title }}</text>
          <text class="album-chip__count">{{ a.count }}</text>
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
            @error="item.loaded = true" />
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
      selectedAlbum: null,
      keyword:       '',
      loading:       true,
      error:         null,
    }
  },
  computed: {
    // 唯一相册列表
    albums() {
      const map = {}
      this.allPhotos.forEach(p => {
        if (!map[p.issueNum]) map[p.issueNum] = { issueNum: p.issueNum, title: p.title, count: 0 }
        map[p.issueNum].count++
      })
      return Object.values(map)
    },

    // 过滤后的照片
    photos() {
      const kw = this.keyword.trim().toLowerCase()
      return this.allPhotos.filter(p => {
        const matchAlbum   = this.selectedAlbum === null || p.issueNum === this.selectedAlbum
        const matchKeyword = !kw || p.title.toLowerCase().includes(kw)
        return matchAlbum && matchKeyword
      })
    },

    countLabel() {
      if (this.loading && !this.allPhotos.length) return '加载中…'
      if (this.selectedAlbum !== null || this.keyword) {
        return `${this.photos.length} / ${this.allPhotos.length} 张`
      }
      return `共 ${this.allPhotos.length} 张`
    },

    allUrls() { return this.photos.map(p => p.src) },
  },
  onLoad() { this.loadAll() },
  methods: {
    thumbUrl(src) { return compressImg(src, 400) },

    selectAlbum(num) { this.selectedAlbum = num },
    onSearch() {},   // v-model 已实时响应，保留供 confirm 调用

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
            this.allPhotos.push({
              id: id++,
              src,
              title:    issue.title,
              date:     formatDate(issue.created_at),
              issueNum: issue.number,
              loaded:   false,
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

/* 顶部 */
.hero {
  padding: 24rpx 28rpx 12rpx;
  display: flex; flex-direction: row; align-items: center; flex-shrink: 0;
}
.hero-title { font-size: 30rpx; font-weight: 700; color: #fff; flex: 1; }
.hero-count { font-size: 24rpx; color: rgba(255,255,255,.5); }

/* 搜索框 */
.search-bar {
  padding: 0 20rpx 14rpx; flex-shrink: 0;
}
.search-wrap {
  display: flex; flex-direction: row; align-items: center;
  background: rgba(255,255,255,.1); border-radius: 12rpx;
  padding: 12rpx 20rpx; gap: 12rpx;
}
.search-icon  { font-size: 26rpx; color: rgba(255,255,255,.5); }
.search-input { flex: 1; font-size: 26rpx; color: #fff; }
.search-clear { font-size: 24rpx; color: rgba(255,255,255,.4); padding: 4rpx; }

/* 相册横向 Tabs */
.album-scroll { flex-shrink: 0; }
.album-bar {
  display: flex; flex-direction: row;
  padding: 0 20rpx 16rpx; gap: 12rpx;
  white-space: nowrap;
}
.album-chip {
  display: flex; flex-direction: row; align-items: center; gap: 6rpx;
  padding: 10rpx 22rpx; border-radius: 99rpx; flex-shrink: 0;
  background: rgba(255,255,255,.1);
}
.album-chip--active {
  background: #3b82f6;
}
.album-chip__label { font-size: 26rpx; color: rgba(255,255,255,.85); font-weight: 500; }
.album-chip__count {
  font-size: 22rpx; color: rgba(255,255,255,.55);
  background: rgba(255,255,255,.12);
  padding: 2rpx 10rpx; border-radius: 99rpx;
}
.album-chip--active .album-chip__count {
  background: rgba(255,255,255,.25); color: #fff;
}

/* 骨架 */
.skeleton-grid { display: flex; flex-wrap: wrap; padding: 3rpx; }
.skeleton-cell {
  width: 33.333%; aspect-ratio: 1;
  padding: 3rpx; box-sizing: border-box;
}
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
