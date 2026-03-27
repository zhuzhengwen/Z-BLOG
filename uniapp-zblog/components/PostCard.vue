<template>
  <view class="card" @click="$emit('click')">

    <!-- 顶部封面（有图/视频时显示） -->
    <view v-if="thumb" class="card__cover">

      <!-- 视频封面 -->
      <view v-if="isVideoPost" class="card__cover-video" :class="'cover--' + videoCoverType">
        <!-- YouTube 有缩略图时作背景 -->
        <image
          v-if="thumb !== '__video__'"
          :src="thumb"
          mode="aspectFill"
          lazy-load
          class="cover-bg-img">
        </image>
        <!-- 遮罩 + 播放按钮 -->
        <view class="cover-overlay">
          <view class="cover-play-btn">
            <text class="cover-play-icon">▶</text>
          </view>
          <text class="cover-platform">{{ videoPlatformLabel }}</text>
        </view>
      </view>

      <!-- 图片封面 -->
      <image
        v-else
        :src="thumb"
        mode="aspectFill"
        lazy-load
        class="card__cover-img">
      </image>

    </view>

    <!-- 卡片内容 -->
    <view class="card__body">
      <!-- 分类标签 + 日期 -->
      <view class="card__top">
        <view v-if="cat" class="badge"
          :style="{ background: cat.color+'18', color: cat.color, borderColor: cat.color+'50' }">
          {{ cat.icon }} {{ cat.name }}
        </view>
        <text class="card__date">{{ date }}</text>
      </view>

      <!-- 标题 -->
      <text class="card__title">{{ issue.title }}</text>

      <!-- 无封面时才显示摘要（避免过高） -->
      <text v-if="excerpt && !thumb" class="card__excerpt">{{ excerpt }}</text>

      <!-- 底部：标签 + 评论数 -->
      <view class="card__footer">
        <view class="card__tags">
          <view v-for="tag in tags.slice(0,2)" :key="tag.name" class="tag">{{ tag.name }}</view>
        </view>
        <text class="card__stats">💬 {{ issue.comments }}</text>
      </view>
    </view>

  </view>
</template>

<script>
import {
  getCategoryFromLabels, getTagsFromLabels, formatDate,
  extractThumb, extractExcerpt, extractVideos,
} from '../utils/helper.js'

export default {
  name: 'PostCard',
  props: {
    issue: { type: Object, required: true }
  },
  computed: {
    cat()    { return getCategoryFromLabels(this.issue.labels) },
    tags()   { return getTagsFromLabels(this.issue.labels) },
    date()   { return formatDate(this.issue.created_at) },
    thumb()  { return extractThumb(this.issue.body || '', this.cat) },
    excerpt(){ return extractExcerpt(this.issue.body, 80) },
    isVideoPost() { return this.cat && this.cat.label === 'video' },

    videoCoverType() {
      const videos = extractVideos(this.issue.body || '')
      if (!videos.length) return 'direct'
      return videos[0].type  // 'youtube' | 'bilibili' | 'direct'
    },

    videoPlatformLabel() {
      const map = { youtube: 'YouTube', bilibili: 'Bilibili', direct: '视频' }
      return map[this.videoCoverType] || '视频'
    },
  }
}
</script>

<style lang="scss" scoped>
.card {
  background: #fff; border-radius: 14rpx; overflow: hidden;
  box-shadow: 0 2rpx 10rpx rgba(0,0,0,.07); margin-bottom: 16rpx;
}

/* ── 顶部封面 ──────────────────────────────────────────── */
.card__cover {
  width: 100%; height: 200rpx; overflow: hidden; position: relative;
  background: #f1f5f9;
}
.card__cover-img { width: 100%; height: 100%; }

/* 视频封面 */
.card__cover-video {
  width: 100%; height: 100%; position: relative;
  display: flex; align-items: center; justify-content: center;
}
/* YouTube：深灰遮罩 + 缩略图 */
.cover--youtube  { background: #1a1a1a; }
/* Bilibili：粉红渐变 */
.cover--bilibili { background: linear-gradient(135deg, #f9a8d4, #fb7299 60%, #ec4899); }
/* 直链视频：深蓝 */
.cover--direct   { background: linear-gradient(135deg, #1e3a5f, #1e293b); }

.cover-bg-img {
  position: absolute; inset: 0; width: 100%; height: 100%;
}
.cover-overlay {
  position: absolute; inset: 0;
  background: rgba(0,0,0,.38);
  display: flex; flex-direction: column;
  align-items: center; justify-content: center; gap: 12rpx;
}
.cover-play-btn {
  width: 80rpx; height: 80rpx; border-radius: 50%;
  background: rgba(255,255,255,.92);
  display: flex; align-items: center; justify-content: center;
  box-shadow: 0 4rpx 20rpx rgba(0,0,0,.3);
}
.cover-play-icon { font-size: 32rpx; color: #1e293b; margin-left: 6rpx; }
.cover-platform  {
  font-size: 22rpx; color: rgba(255,255,255,.9);
  background: rgba(0,0,0,.4); padding: 4rpx 18rpx;
  border-radius: 99rpx; font-weight: 600;
}

/* ── 卡片内容 ──────────────────────────────────────────── */
.card__body {
  padding: 20rpx 24rpx 18rpx;
  display: flex; flex-direction: column;
}
.card__top {
  display: flex; flex-direction: row; align-items: center; margin-bottom: 12rpx;
}
.badge {
  font-size: 22rpx; font-weight: 600;
  padding: 4rpx 14rpx; border-radius: 99rpx;
  border-width: 1rpx; border-style: solid;
}
.card__date { font-size: 22rpx; color: #64748b; margin-left: auto; white-space: nowrap; }
.card__title {
  font-size: 32rpx; font-weight: 700; color: #1e293b; line-height: 1.45;
  /* #ifndef APP-NVUE */
  display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
  /* #endif */
}
.card__excerpt {
  font-size: 27rpx; color: #64748b; line-height: 1.55; margin-top: 10rpx;
  /* #ifndef APP-NVUE */
  display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
  /* #endif */
}
.card__footer {
  display: flex; flex-direction: row; align-items: center;
  margin-top: 16rpx; padding-top: 12rpx; border-top: 1rpx solid #f1f5f9;
}
.card__tags { display: flex; flex-direction: row; gap: 8rpx; flex: 1; }
.tag { font-size: 20rpx; color: #64748b; background: #f1f5f9; padding: 3rpx 12rpx; border-radius: 99rpx; }
.card__stats { font-size: 22rpx; color: #94a3b8; }
</style>
