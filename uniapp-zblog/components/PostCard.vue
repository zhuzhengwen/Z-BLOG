<template>
  <view class="moment" @click="$emit('click')">

    <!-- 左侧头像 -->
    <image class="moment__avatar" :src="issue.user.avatar_url" mode="aspectFill" lazy-load />

    <!-- 右侧主体 -->
    <view class="moment__main">

      <!-- 名称 -->
      <text class="moment__name">{{ issue.user.login }}</text>

      <!-- 标题（主内容文字） -->
      <text class="moment__title">{{ issue.title }}</text>

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
      </view>

      <!-- GitHub 标签 -->
      <view v-if="issue.labels && issue.labels.length" class="moment__badges">
        <view
          v-for="label in issue.labels"
          :key="label.id"
          class="gh-label"
          :style="ghLabelStyle(label)">
          {{ label.name }}
        </view>
      </view>

      <!-- 底部：日期 + 评论数 -->
      <view class="moment__footer">
        <text class="moment__date">{{ date }}</text>
        <text class="moment__comments">💬 {{ issue.comments }}</text>
      </view>

    </view>
  </view>
</template>

<script>
import {
  formatDate, extractImages, extractExcerpt, extractVideos, compressImg as _compress,
} from '../utils/helper.js'

export default {
  name: 'PostCard',
  props: {
    issue: { type: Object, required: true }
  },
  computed: {
    date()    { return formatDate(this.issue.created_at) },
    excerpt() { return extractExcerpt(this.issue.body, 100) },

    // 图片列表：优先取正文图片；视频帖取缩略图
    mediaList() {
      const imgs = extractImages(this.issue.body || '')
      if (imgs.length) return imgs.slice(0, 9)
      const videos = extractVideos(this.issue.body || '')
      if (videos.length && videos[0].thumb) return [videos[0].thumb]
      return []
    },

    // 九宫格布局 class
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
    ghLabelStyle(label) {
      const c = '#' + label.color
      return { background: c + '22', color: c, borderColor: c + '55' }
    },
  }
}
</script>

<style lang="scss" scoped>
/* ── 朋友圈条目 ─────────────────────────────────────────── */
.moment {
  display: flex; flex-direction: row;
  padding: 24rpx 28rpx 20rpx;
  background: #fff;
  border-bottom: 1rpx solid #f0f0f0;
}

/* 头像 */
.moment__avatar {
  width: 80rpx; height: 80rpx;
  border-radius: 10rpx; flex-shrink: 0;
  margin-right: 20rpx; background: #e2e8f0;
}

/* 右侧主体 */
.moment__main {
  flex: 1; min-width: 0;
  display: flex; flex-direction: column;
}

/* 名称 */
.moment__name {
  font-size: 28rpx; font-weight: 700; color: #576b95;
  margin-bottom: 8rpx; line-height: 1.2;
}

/* 标题 */
.moment__title {
  font-size: 30rpx; color: #1e1e1e; line-height: 1.55;
  /* #ifndef APP-NVUE */
  word-break: break-word;
  /* #endif */
}

/* 摘要 */
.moment__excerpt {
  font-size: 27rpx; color: #555; line-height: 1.55;
  margin-top: 6rpx;
  /* #ifndef APP-NVUE */
  display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden;
  /* #endif */
}

/* ── 图片网格 ────────────────────────────────────────────── */
.moment__grid {
  margin-top: 14rpx;
  display: flex; flex-direction: row; flex-wrap: wrap; gap: 6rpx;
}

/* 单图：较大的矩形 */
.grid--one .moment__grid-img {
  width: 300rpx; height: 240rpx; border-radius: 6rpx;
}
/* 2张：两列 */
.grid--two .moment__grid-img {
  width: 186rpx; height: 186rpx; border-radius: 6rpx;
}
/* 3张：三列 */
.grid--three .moment__grid-img {
  width: 186rpx; height: 186rpx; border-radius: 6rpx;
}
/* 4张：两列两行 */
.grid--four .moment__grid-img {
  width: 186rpx; height: 186rpx; border-radius: 6rpx;
}
/* 5-9张：三列 */
.grid--many .moment__grid-img {
  width: 186rpx; height: 186rpx; border-radius: 6rpx;
}

/* ── GitHub 标签 ─────────────────────────────────────────── */
.moment__badges {
  display: flex; flex-direction: row; flex-wrap: wrap;
  gap: 8rpx; margin-top: 14rpx;
}
.gh-label {
  font-size: 22rpx; font-weight: 600;
  padding: 4rpx 14rpx; border-radius: 99rpx;
  border-width: 1rpx; border-style: solid;
}

/* ── 底部 ────────────────────────────────────────────────── */
.moment__footer {
  display: flex; flex-direction: row;
  align-items: center; justify-content: space-between;
  margin-top: 14rpx;
}
.moment__date     { font-size: 24rpx; color: #aaa; }
.moment__comments { font-size: 24rpx; color: #aaa; }
</style>
