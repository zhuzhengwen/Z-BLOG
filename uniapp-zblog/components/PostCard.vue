<template>
  <view class="card" @click="$emit('click')">
    <view class="card__body">
      <!-- 分类标签 + 日期 -->
      <view class="card__top">
        <view v-if="cat" class="badge"
          :style="{ background: cat.color + '18', color: cat.color, borderColor: cat.color + '50' }">
          {{ cat.icon }} {{ cat.name }}
        </view>
        <text class="card__date">{{ date }}</text>
      </view>

      <!-- 标题 -->
      <text class="card__title">{{ issue.title }}</text>

      <!-- 摘要 -->
      <text v-if="excerpt" class="card__excerpt">{{ excerpt }}</text>

      <!-- 底部：标签 + 评论数 -->
      <view class="card__footer">
        <view class="card__tags">
          <view v-for="tag in tags.slice(0,2)" :key="tag.name" class="tag">{{ tag.name }}</view>
        </view>
        <text class="card__stats">💬 {{ issue.comments }}</text>
      </view>
    </view>

    <!-- 右侧方形缩略图 -->
    <view v-if="thumb" class="card__thumb">
      <view v-if="thumb === '__video__'" class="card__thumb-video">
        <text class="thumb-play">▶</text>
      </view>
      <image v-else :src="thumb" mode="aspectFill" lazy-load class="card__thumb-img"></image>
    </view>
  </view>
</template>

<script>
import { getCategoryFromLabels, getTagsFromLabels, formatDate, extractThumb, extractExcerpt } from '../utils/helper.js'

export default {
  name: 'PostCard',
  props: {
    issue: { type: Object, required: true }
  },
  computed: {
    cat()         { return getCategoryFromLabels(this.issue.labels) },
    tags()        { return getTagsFromLabels(this.issue.labels) },
    date()        { return formatDate(this.issue.created_at) },
    thumb()       { return extractThumb(this.issue.body || '', this.cat) },
    excerpt()     { return extractExcerpt(this.issue.body, 70) },
    isVideoPost() { return this.cat && this.cat.label === 'video' },
  }
}
</script>

<style lang="scss" scoped>
.card {
  background: #fff; border-radius: 10px; overflow: hidden;
  box-shadow: 0 1px 4px rgba(0,0,0,.07); margin-bottom: 12px;
  display: flex; flex-direction: row; align-items: stretch;
  active-opacity: 0.9;
}
.card__body {
  flex: 1; min-width: 0; padding: 20rpx 24rpx;
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
  font-size: 32rpx; font-weight: 700; color: #1e293b; line-height: 1.45; display: block;
  overflow: hidden;
  /* #ifndef APP-NVUE */
  display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;
  /* #endif */
}
.card__excerpt {
  font-size: 27rpx; color: #64748b; line-height: 1.55; margin-top: 10rpx; flex: 1; display: block;
  /* #ifndef APP-NVUE */
  display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
  /* #endif */
}
.card__footer {
  display: flex; flex-direction: row; align-items: center;
  margin-top: 14rpx; padding-top: 12rpx; border-top: 1rpx solid #e2e8f0;
}
.card__tags { display: flex; flex-direction: row; gap: 8rpx; flex: 1; }
.tag { font-size: 20rpx; color: #64748b; background: #f1f5f9; padding: 3rpx 12rpx; border-radius: 99rpx; }
.card__stats { font-size: 22rpx; color: #94a3b8; }

/* 右侧方形缩略图 */
.card__thumb {
  width: 160rpx; height: 160rpx; flex-shrink: 0;
  align-self: center; margin: 16rpx 16rpx 16rpx 0;
  border-radius: 10rpx; overflow: hidden; background: #f1f5f9;
}
.card__thumb-img { width: 100%; height: 100%; }
.card__thumb-video {
  width: 100%; height: 100%; background: #1e293b;
  display: flex; align-items: center; justify-content: center;
}
.thumb-play { font-size: 48rpx; color: rgba(255,255,255,.8); }
</style>
