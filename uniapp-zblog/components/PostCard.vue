<template>
  <view class="moment" @click="$emit('click')">

    <!-- 作者行 -->
    <view class="moment__author">
      <image class="moment__avatar" :src="avatarUrl" mode="aspectFill" />
      <text class="moment__username">{{ username }}</text>
      <text class="moment__date">{{ date }}</text>
    </view>

    <!-- 标题 -->
    <text class="moment__title">{{ issue.title }}</text>

    <!-- 标签（标题下方） -->
    <view v-if="cat || tags.length" class="moment__badges">
      <view v-if="cat" class="m-badge"
        :style="{ background: cat.color + '18', color: cat.color, borderColor: cat.color + '50' }">
        {{ cat.icon }} {{ cat.name }}
      </view>
      <text v-for="tag in tags.slice(0, 3)" :key="tag.name" class="m-tag">{{ tag.name }}</text>
    </view>

    <!-- 摘要（无图时显示） -->
    <text v-if="excerpt && !mediaList.length" class="moment__excerpt">{{ excerpt }}</text>

    <!-- 图片/视频九宫格 -->
    <view v-if="mediaList.length" class="moment__grid" :class="'grid--' + gridClass">
      <image
        v-for="(src, i) in mediaList"
        :key="i"
        :src="compressImg(src, 400)"
        class="moment__grid-img"
        mode="aspectFill"
        lazy-load />
      <!-- 超出9张时最后一格显示剩余数量 -->
      <view v-if="isImagePost && totalImages > 9" class="moment__grid-more" @click.stop="goPhotos">
        <text class="moment__grid-more-text">+{{ totalImages - 9 }}</text>
        <text class="moment__grid-more-sub">查看更多</text>
      </view>
    </view>

    <!-- 图片帖超出9张时的跳转提示 -->
    <view v-if="isImagePost && totalImages > 9" class="moment__photos-link" @click.stop="goPhotos">
      <text class="moment__photos-link-text">共 {{ totalImages }} 张 · 前往照片墙查看全部 →</text>
    </view>

    <!-- 底部：评论数 -->
    <view class="moment__footer">
      <text class="moment__comments">💬 {{ issue.comments }}</text>
    </view>

  </view>
</template>

<script>
import CONFIG from '../config.js'
import {
  getCategoryFromLabels, getTagsFromLabels,
  formatDate, extractImages, extractExcerpt, extractVideos, compressImg as _compress,
} from '../utils/helper.js'

export default {
  name: 'PostCard',
  props: {
    issue: { type: Object, required: true }
  },
  computed: {
    cat()         { return getCategoryFromLabels(this.issue.labels) },
    tags()        { return getTagsFromLabels(this.issue.labels) },
    date()        { return formatDate(this.issue.created_at) },
    excerpt()     { return extractExcerpt(this.issue.body, 100) },
    username()    { return this.issue.user?.login || CONFIG.owner },
    avatarUrl()   {
      const url = this.issue.user?.avatar_url
      return url ? `https://wsrv.nl/?url=${encodeURIComponent(url)}&w=80&h=80&fit=cover&output=webp` : `https://github.com/${CONFIG.owner}.png`
    },
    isImagePost() { return this.cat && this.cat.label === 'image' },

    // 图片帖：全部图片数量
    totalImages() {
      return this.isImagePost ? extractImages(this.issue.body || '').length : 0
    },

    // 展示的媒体列表（最多9张）
    mediaList() {
      if (this.isImagePost) {
        return extractImages(this.issue.body || '').slice(0, 9)
      }
      const imgs = extractImages(this.issue.body || '')
      if (imgs.length) return imgs.slice(0, 1)   // 非图片帖只取封面
      const videos = extractVideos(this.issue.body || '')
      if (videos.length && videos[0].thumb) return [videos[0].thumb]
      return []
    },

    gridClass() {
      const n = this.mediaList.length
      if (n === 1) return 'one'
      if (n === 2) return 'two'
      if (n === 3) return 'three'
      if (n === 4) return 'four'
      return 'many'
    },
  },
  methods: {
    compressImg(src, w) { return _compress(src, w) },
    goPhotos() {
      uni.redirectTo({ url: '/pages/photos/photos' })
    },
  }
}
</script>

<style lang="scss" scoped>
.moment {
  padding: 24rpx 28rpx 20rpx;
  background: rgba(255,255,255,0.72);
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  border-radius: 18rpx;
  border: 1rpx solid rgba(255,255,255,0.85);
  box-shadow: 0 2rpx 20rpx rgba(0,0,0,0.06), 0 1rpx 4rpx rgba(0,0,0,0.04);
  display: flex; flex-direction: column;
}

/* 作者行 */
.moment__author {
  display: flex; flex-direction: row; align-items: center;
  margin-bottom: 12rpx; gap: 10rpx;
}
.moment__avatar {
  width: 44rpx; height: 44rpx; border-radius: 50%;
  flex-shrink: 0; background: #e2e8f0;
}
.moment__username {
  font-size: 24rpx; font-weight: 600; color: #374151; flex: 1;
}
.moment__date { font-size: 22rpx; color: #aaa; flex-shrink: 0; }

/* 标题 */
.moment__title {
  font-size: 30rpx; font-weight: 700; color: #1e1e1e; line-height: 1.5;
  /* #ifndef APP-NVUE */
  word-break: break-word;
  /* #endif */
}

/* 标签行 */
.moment__badges {
  display: flex; flex-direction: row; flex-wrap: wrap;
  gap: 8rpx; margin-top: 10rpx;
}
.m-badge {
  font-size: 22rpx; font-weight: 600;
  padding: 4rpx 14rpx; border-radius: 99rpx;
  border-width: 1rpx; border-style: solid;
}
.m-tag {
  font-size: 22rpx; color: #64748b;
  background: #f1f5f9; padding: 4rpx 14rpx; border-radius: 99rpx;
}

/* 摘要 */
.moment__excerpt {
  font-size: 27rpx; color: #555; line-height: 1.55;
  margin-top: 10rpx;
  /* #ifndef APP-NVUE */
  display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden;
  /* #endif */
}

/* ── 图片网格 ────────────────────────────────────────────── */
.moment__grid {
  margin-top: 14rpx;
  display: flex; flex-direction: row; flex-wrap: wrap; gap: 6rpx;
}
.grid--one .moment__grid-img   { width: 300rpx; height: 240rpx; border-radius: 6rpx; }
.grid--two .moment__grid-img   { width: 186rpx; height: 186rpx; border-radius: 6rpx; }
.grid--three .moment__grid-img { width: 186rpx; height: 186rpx; border-radius: 6rpx; }
.grid--four .moment__grid-img  { width: 186rpx; height: 186rpx; border-radius: 6rpx; }
.grid--many .moment__grid-img  { width: 186rpx; height: 186rpx; border-radius: 6rpx; }

/* "+N 更多" 格 */
.moment__grid-more {
  width: 186rpx; height: 186rpx; border-radius: 6rpx;
  background: rgba(0,0,0,.45);
  display: flex; flex-direction: column;
  align-items: center; justify-content: center;
}
.moment__grid-more-text { font-size: 44rpx; font-weight: 700; color: #fff; }
.moment__grid-more-sub  { font-size: 22rpx; color: rgba(255,255,255,.8); margin-top: 4rpx; }

/* 照片墙跳转提示 */
.moment__photos-link {
  margin-top: 10rpx;
}
.moment__photos-link-text {
  font-size: 24rpx; color: #576b95;
}

/* ── 底部 ────────────────────────────────────────────────── */
.moment__footer {
  display: flex; flex-direction: row;
  align-items: center; justify-content: flex-end;
  margin-top: 14rpx;
}
.moment__comments { font-size: 24rpx; color: #aaa; }
</style>
