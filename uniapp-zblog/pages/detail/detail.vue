<template>
  <view class="page">
    <view v-if="loading" class="loading-wrap">
      <view class="spinner"></view>
      <text class="loading-text">加载中…</text>
    </view>

    <view v-else-if="error" class="error-box">
      <text>⚠️ {{ error }}</text>
    </view>

    <scroll-view v-else-if="issue" scroll-y class="detail-scroll">
      <view class="detail-inner">

        <!-- 标签 -->
        <view class="badges">
          <view v-if="cat" class="badge"
            :style="{ background: cat.color+'18', color: cat.color, borderColor: cat.color+'50' }">
            {{ cat.icon }} {{ cat.name }}
          </view>
          <view v-for="tag in tags" :key="tag.name" class="tag"
            :style="tag.color ? { background: '#' + tag.color + '22', color: '#' + tag.color, borderColor: '#' + tag.color + '66' } : {}">{{ tag.name }}</view>
        </view>

        <!-- 标题 -->
        <text class="title">{{ issue.title }}</text>

        <!-- 元信息 -->
        <view class="meta">
          <image class="avatar" :src="issue.user.avatar_url + '&s=60'" mode="aspectFill"></image>
          <text class="meta-author">{{ issue.user.login }}</text>
          <text class="meta-sep">·</text>
          <text class="meta-date">{{ fullDate }}</text>
          <text class="meta-sep">·</text>
          <text class="meta-comment">💬 {{ issue.comments }}</text>
        </view>

        <view class="divider"></view>

        <!-- 视频分类：嵌入播放器 -->
        <view v-if="isVideoPost && videos.length" class="video-section">
          <view v-for="(v, i) in videos" :key="i" class="video-item">

            <!-- H5 端：直接嵌入 -->
            <!-- #ifdef H5 -->
            <view v-if="v.type === 'direct'" class="video-wrap">
              <video :src="v.url" controls class="video-player" playsinline></video>
            </view>
            <view v-else-if="v.type === 'youtube'" class="video-wrap ratio-16-9">
              <iframe :src="'https://www.youtube.com/embed/'+v.id"
                frameborder="0" allowfullscreen class="video-iframe"></iframe>
            </view>
            <view v-else-if="v.type === 'bilibili'" class="video-wrap ratio-16-9">
              <iframe
                :src="'https://player.bilibili.com/player.html?'+(v.id.startsWith('BV')?'bvid='+v.id:'aid='+v.id.slice(2))+'&autoplay=0&high_quality=1'"
                frameborder="0" allowfullscreen scrolling="no" class="video-iframe"></iframe>
            </view>
            <!-- #endif -->

            <!-- App 端：直链 video，外链用预览卡片 -->
            <!-- #ifndef H5 -->
            <view v-if="v.type === 'direct'" class="video-wrap">
              <video :src="v.url" controls class="video-player" :show-fullscreen-btn="true"></video>
            </view>
            <view v-else class="video-preview-card" :class="'vpc--'+v.type" @click="openVideoInBrowser(v.url)">
              <!-- 缩略图区域 -->
              <view class="vpc-thumb">
                <image v-if="v.thumb" :src="v.thumb" mode="aspectFill" lazy-load class="vpc-thumb-img"></image>
                <view v-else class="vpc-thumb-placeholder"></view>
                <!-- 居中播放按钮 -->
                <view class="vpc-play-overlay">
                  <view class="vpc-play-btn">
                    <text class="vpc-play-icon">▶</text>
                  </view>
                </view>
                <!-- 平台标识 -->
                <view class="vpc-platform-badge">
                  <text class="vpc-platform-text">{{ v.type === 'youtube' ? 'YouTube' : 'Bilibili' }}</text>
                </view>
              </view>
              <!-- 底部提示 -->
              <view class="vpc-footer">
                <text class="vpc-hint">点击在浏览器中播放</text>
                <text class="vpc-arrow">›</text>
              </view>
            </view>
            <!-- #endif -->

          </view>
        </view>

        <!-- 图片照片墙 -->
        <view v-if="isImagePost && images.length" class="img-gallery">
          <view v-for="(src, i) in images" :key="i" class="img-item" @click="previewImage(i)">
            <image :src="src" mode="widthFix" lazy-load></image>
          </view>
        </view>

        <!-- Markdown 内容 -->
        <!-- #ifdef H5 -->
        <view class="markdown-body" v-html="renderedHtml"></view>
        <!-- #endif -->
        <!-- #ifndef H5 -->
        <rich-text :nodes="renderedHtml" class="markdown-body"></rich-text>
        <!-- #endif -->

        <!-- 底部操作 -->
        <view class="action-bar">
          <view class="action-btn" @click="openInBrowser">
            <text>🌐 在浏览器中打开</text>
          </view>
          <view class="action-btn action-btn--primary" @click="openGitHub">
            <text style="color:#fff">💬 GitHub 评论 ({{ issue.comments }})</text>
          </view>
        </view>

      </view>
    </scroll-view>
  </view>
</template>

<script>
import api from '../../utils/api.js'
import { getCategoryFromLabels, getTagsFromLabels, formatFullDate, extractImages, extractVideos, simpleMarkdown } from '../../utils/helper.js'

export default {
  data() {
    return { issue: null, loading: true, error: null }
  },
  computed: {
    cat()         { return this.issue ? getCategoryFromLabels(this.issue.labels) : null },
    tags()        { return this.issue ? getTagsFromLabels(this.issue.labels) : [] },
    fullDate()    { return this.issue ? formatFullDate(this.issue.created_at) : '' },
    images()      { return this.issue ? extractImages(this.issue.body || '') : [] },
    videos()      { return this.issue ? extractVideos(this.issue.body || '') : [] },
    isImagePost() { return this.cat && this.cat.label === 'image' },
    isVideoPost() { return this.cat && this.cat.label === 'think' },
    renderedHtml() {
      if (!this.issue) return ''
      let body = this.issue.body || ''
      // 图片类文章：剥离已在图片墙展示的图片 markdown，避免重复显示
      if (this.isImagePost) {
        body = body
          .replace(/!\[[^\]]*\]\(https?:\/\/[^)]+\)/g, '')
          .replace(/\n{3,}/g, '\n\n').trim()
      }
      // 视频类文章：从正文中剥离已经在预览卡展示的视频链接，避免重复显示为链接
      if (this.isVideoPost || this.videos.length) {
        body = body
          .replace(/https?:\/\/(?:www\.)?youtube\.com\/watch[^\s\n\])]*/g, '')
          .replace(/https?:\/\/youtu\.be\/[^\s\n\]))]*/g, '')
          .replace(/https?:\/\/(?:www\.)?bilibili\.com\/video\/[^\s\n\]))]*/g, '')
          .replace(/https?:\/\/[^\s\n\])]+\.(?:mp4|webm|mov|ogg)(?:\?[^\s\n\])]*)?/gi, '')
          .replace(/\n{3,}/g, '\n\n').trim()
      }
      return simpleMarkdown(body)
    },
  },
  onLoad(options) {
    const { number, title } = options
    if (title) uni.setNavigationBarTitle({ title: decodeURIComponent(title) })
    this.loadIssue(number)
  },
  methods: {
    async loadIssue(number) {
      try {
        this.issue = await api.getIssue(number)
        uni.setNavigationBarTitle({ title: this.issue.title })
      } catch (e) {
        this.error = e.message
      } finally {
        this.loading = false
      }
    },
    previewImage(index) {
      uni.previewImage({ urls: this.images, current: this.images[index] })
    },
    openGitHub() {
      // #ifdef H5
      window.open(this.issue.html_url, '_blank')
      // #endif
      // #ifdef APP-PLUS
      plus.runtime.openURL(this.issue.html_url)
      // #endif
    },
    openInBrowser() {
      // #ifdef H5
      window.open(this.issue.html_url, '_blank')
      // #endif
      // #ifdef APP-PLUS
      plus.runtime.openURL(this.issue.html_url)
      // #endif
    },
    openVideoInBrowser(url) {
      // #ifdef H5
      window.open(url, '_blank')
      // #endif
      // #ifdef APP-PLUS
      plus.runtime.openURL(url)
      // #endif
    },
  }
}
</script>

<style lang="scss" scoped>
.page { height: 100vh; background: #fff; }
.detail-scroll { height: 100vh; }
.detail-inner  { padding: 28rpx 28rpx 80rpx; }

/* 加载 */
.loading-wrap {
  display: flex; flex-direction: column; align-items: center;
  justify-content: center; height: 60vh; gap: 20rpx;
}
.spinner {
  width: 56rpx; height: 56rpx; border: 4rpx solid #e2e8f0;
  border-top-color: #2563eb; border-radius: 50%;
  animation: spin .8s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }
.loading-text { font-size: 26rpx; color: #94a3b8; }
.error-box { margin: 40rpx; padding: 30rpx; background: #fef2f2; border-radius: 10rpx; }
.error-box text { color: #b91c1c; font-size: 28rpx; }

/* 头部 */
.badges { display: flex; flex-direction: row; gap: 10rpx; flex-wrap: wrap; margin-bottom: 20rpx; }
.badge  { font-size: 22rpx; font-weight: 600; padding: 4rpx 16rpx; border-radius: 99rpx; border: 1rpx solid; }
.tag    { font-size: 22rpx; color: #64748b; background: #f1f5f9; padding: 4rpx 14rpx; border-radius: 99rpx; border: 1rpx solid #e2e8f0; display: flex; align-items: center; }
.title  { font-size: 40rpx; font-weight: 800; color: #1e293b; line-height: 1.3; display: block; margin-bottom: 20rpx; }
.meta   { display: flex; flex-direction: row; align-items: center; flex-wrap: wrap; gap: 10rpx; }
.avatar { width: 44rpx; height: 44rpx; border-radius: 50%; }
.meta-author { font-size: 24rpx; color: #1e293b; font-weight: 500; }
.meta-sep, .meta-date, .meta-comment { font-size: 24rpx; color: #94a3b8; }
.divider { height: 1rpx; background: #e2e8f0; margin: 30rpx 0; }

/* 视频播放区 */
.video-section { margin-bottom: 30rpx; display: flex; flex-direction: column; gap: 20rpx; }
.video-wrap    { border-radius: 12rpx; overflow: hidden; background: #000; }
.video-player  { width: 100%; height: 420rpx; display: block; }
/* H5 比例容器 */
.ratio-16-9 {
  position: relative; padding-bottom: 56.25%; height: 0;
}
.video-iframe  {
  width: 100%; height: 420rpx; border: none; display: block;
  /* #ifdef H5 */
  position: absolute; top: 0; left: 0; width: 100%; height: 100%;
  /* #endif */
}

/* App 端视频预览卡片 */
.video-preview-card {
  border-radius: 14rpx; overflow: hidden;
  background: #1e293b;
}
.vpc--youtube  { background: #0f0f0f; }
.vpc--bilibili { background: #1a0a12; }

.vpc-thumb {
  width: 100%; padding-bottom: 56.25%; /* 16:9 */
  position: relative; overflow: hidden;
}
.vpc-thumb-img {
  position: absolute; inset: 0; width: 100%; height: 100%;
}
.vpc-thumb-placeholder {
  position: absolute; inset: 0;
  background: linear-gradient(135deg, #fb7299, #ec4899);
}
.vpc--youtube .vpc-thumb-placeholder {
  background: linear-gradient(135deg, #ff4444, #cc0000);
}
.vpc-play-overlay {
  position: absolute; inset: 0; background: rgba(0,0,0,.35);
  display: flex; align-items: center; justify-content: center;
}
.vpc-play-btn {
  width: 100rpx; height: 100rpx; border-radius: 50%;
  background: rgba(255,255,255,.92);
  display: flex; align-items: center; justify-content: center;
  box-shadow: 0 4rpx 24rpx rgba(0,0,0,.4);
}
.vpc-play-icon { font-size: 40rpx; color: #1e293b; margin-left: 8rpx; }
.vpc-platform-badge {
  position: absolute; top: 16rpx; left: 16rpx;
  background: rgba(0,0,0,.6); border-radius: 8rpx;
  padding: 6rpx 16rpx;
}
.vpc-platform-text { font-size: 22rpx; color: #fff; font-weight: 700; }
.vpc-footer {
  padding: 20rpx 24rpx;
  display: flex; flex-direction: row; align-items: center;
}
.vpc-hint  { flex: 1; font-size: 26rpx; color: rgba(255,255,255,.65); }
.vpc-arrow { font-size: 40rpx; color: rgba(255,255,255,.4); }

/* 图片画廊 */
.img-gallery { margin-bottom: 30rpx; }
.img-item { border-radius: 10rpx; overflow: hidden; margin-bottom: 12rpx; }
.img-item image { width: 100%; display: block; }

/* Markdown */
.markdown-body { font-size: 29rpx; line-height: 1.8; color: #1e293b; }

/* 底部操作 */
.action-bar { margin-top: 50rpx; display: flex; flex-direction: column; gap: 16rpx; }
.action-btn {
  padding: 26rpx; border-radius: 10rpx;
  background: #f1f5f9; text-align: center;
}
.action-btn text { font-size: 28rpx; color: #2563eb; font-weight: 500; }
.action-btn--primary { background: #2563eb; }
</style>
