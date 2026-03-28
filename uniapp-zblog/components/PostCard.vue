<template>
  <view class="moment" @click="$emit('click')">

    <!-- 标题行：标题 + 标签同行，标签靠右 -->
    <view class="moment__title-row">
      <text class="moment__title">{{ issue.title }}</text>
      <view v-if="cat || tags.length" class="moment__badges">
        <view v-if="cat" class="m-badge"
          :style="{ background: cat.color + '18', color: cat.color, borderColor: cat.color + '50' }">
          {{ cat.icon }} {{ cat.name }}
        </view>
        <text v-for="tag in tags.slice(0, 2)" :key="tag.name" class="m-tag">{{ tag.name }}</text>
      </view>
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
    </view>

    <!-- 底部：日期 + 评论数 -->
    <view class="moment__footer">
      <text class="moment__date">{{ date }}</text>
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
    cat()     { return getCategoryFromLabels(this.issue.labels) },
    tags()    { return getTagsFromLabels(this.issue.labels) },
    date()    { return formatDate(this.issue.created_at) },
    excerpt() { return extractExcerpt(this.issue.body, 100) },

    mediaList() {
      const imgs = extractImages(this.issue.body || '')
      if (imgs.length) return imgs.slice(0, 9)
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
  }
}
</script>

<style lang="scss" scoped>
.moment {
  padding: 24rpx 28rpx 20rpx;
  background: #fff;
  border-bottom: 1rpx solid #f0f0f0;
  display: flex; flex-direction: column;
}

/* 标题行 */
.moment__title-row {
  display: flex; flex-direction: row;
  align-items: flex-start; gap: 12rpx;
}
.moment__title {
  flex: 1;
  font-size: 30rpx; font-weight: 700; color: #1e1e1e; line-height: 1.5;
  /* #ifndef APP-NVUE */
  word-break: break-word;
  /* #endif */
}

/* 标签（靠右） */
.moment__badges {
  display: flex; flex-direction: row; flex-wrap: wrap;
  justify-content: flex-end; gap: 8rpx;
  flex-shrink: 0; padding-top: 4rpx;
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

/* ── 底部 ────────────────────────────────────────────────── */
.moment__footer {
  display: flex; flex-direction: row;
  align-items: center; justify-content: space-between;
  margin-top: 14rpx;
}
.moment__date     { font-size: 24rpx; color: #aaa; }
.moment__comments { font-size: 24rpx; color: #aaa; }
</style>
