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
          <view v-for="tag in tags" :key="tag.name" class="tag">{{ tag.name }}</view>
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

            <!-- App 端：直链 video，外链用行内点击 -->
            <!-- #ifndef H5 -->
            <view v-if="v.type === 'direct'" class="video-wrap">
              <video :src="v.url" controls class="video-player" :show-fullscreen-btn="true"></video>
            </view>
            <view v-else class="video-link-row" @click="openVideoInBrowser(v.url)">
              <view class="video-link-thumb">
                <image v-if="v.thumb" :src="v.thumb" mode="aspectFill" class="video-link-img"></image>
                <view v-else class="video-link-placeholder">
                  <text class="play-icon">▶</text>
                </view>
              </view>
              <view class="video-link-info">
                <text class="video-link-type">{{ v.type === 'youtube' ? 'YouTube 视频' : 'Bilibili 视频' }}</text>
                <text class="video-link-hint">点击在浏览器中播放</text>
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
    isVideoPost() { return this.cat && this.cat.label === 'video' },
    renderedHtml(){ return this.issue ? simpleMarkdown(this.issue.body || '') : '' },
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
.tag    { font-size: 22rpx; color: #64748b; background: #f1f5f9; padding: 4rpx 14rpx; border-radius: 99rpx; }
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

/* App 端外链视频 */
.video-link-row {
  display: flex; flex-direction: row; align-items: stretch;
  background: #1e293b; border-radius: 12rpx; overflow: hidden;
}
.video-link-thumb { width: 200rpx; flex-shrink: 0; }
.video-link-img   { width: 100%; height: 100%; }
.video-link-placeholder {
  width: 100%; height: 140rpx; background: #334155;
  display: flex; align-items: center; justify-content: center;
}
.play-icon { font-size: 52rpx; color: rgba(255,255,255,.6); }
.video-link-info  { flex: 1; padding: 24rpx; display: flex; flex-direction: column; justify-content: center; gap: 10rpx; }
.video-link-type  { font-size: 28rpx; color: #fff; font-weight: 600; }
.video-link-hint  { font-size: 22rpx; color: rgba(255,255,255,.5); }

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
