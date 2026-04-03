<template>
  <view class="page">
    <scroll-view scroll-y style="flex:1">

      <!-- 收藏链接 -->
      <view class="links-section">
        <view class="links-header">
          <text class="links-title">🔗 收藏链接</text>
          <text class="links-count">{{ links.length ? links.length + ' 个' : '' }}</text>
        </view>
        <view v-if="loadingLinks" class="links-grid">
          <view v-for="i in 8" :key="i" class="link-cell">
            <view class="link-skel-icon"></view>
            <view class="link-skel-text"></view>
          </view>
        </view>
        <view v-else-if="!links.length" class="links-empty">
          <text class="links-empty-text">暂无收藏链接</text>
        </view>
        <view v-else class="links-grid">
          <view
            v-for="(link, idx) in links" :key="idx"
            class="link-cell"
            @click="openLink(link.url)"
          >
            <view class="link-cell__icon" :style="{ background: link.color }">
              <text class="link-cell__letter">{{ link.letter }}</text>
            </view>
            <text class="link-cell__title">{{ link.title }}</text>
          </view>
        </view>
      </view>

      <!-- 主题标签（收藏链接下方） -->
      <view v-if="loadingTags || visibleTags.length" class="tags-section">
        <view class="links-header">
          <text class="links-title">🏷️ 主题标签</text>
          <text class="links-count">{{ visibleTags.length ? visibleTags.length + ' 个' : '' }}</text>
        </view>
        <view v-if="loadingTags" class="links-grid">
          <view v-for="i in 4" :key="i" class="link-cell">
            <view class="link-skel-icon"></view>
            <view class="link-skel-text"></view>
          </view>
        </view>
        <view v-else class="links-grid">
          <view
            v-for="t in visibleTags" :key="t.name"
            class="link-cell"
            @click="openTag(t.name)">
            <view class="link-cell__icon" :style="{ background: '#' + (t.color || '64748b') }">
              <text class="link-cell__letter">{{ t.name.charAt(0).toUpperCase() }}</text>
            </view>
            <text class="link-cell__title">{{ t.name }}</text>
            <text class="tag-cell__count">{{ t.count >= 100 ? '99+' : t.count }} 篇</text>
          </view>
        </view>
      </view>

      <view class="about-section">
        <view class="about-card">
          <text class="about-title">📋 使用说明</text>
          <text class="about-item">1. 在 GitHub 创建 Issue 作为文章</text>
          <text class="about-item">2. 给 Issue 添加 Label 进行分类</text>
          <text class="about-item">3. 图片类型支持照片墙展示</text>
          <text class="about-item">4. 支持 Markdown 格式写作</text>
        </view>
        <view class="runtime-card">
          <text class="runtime-text">{{ runtimeStr }}</text>
        </view>
      </view>

      <view style="height:160rpx"></view>
    </scroll-view>

    <!-- 自定义底部导航 -->
    <music-player></music-player>
    <tab-bar current="category"></tab-bar>
    <token-modal></token-modal>
  </view>
</template>

<script>
import TabBar      from '../../components/TabBar.vue'
import TokenModal  from '../../components/TokenModal.vue'
import MusicPlayer from '../../components/MusicPlayer.vue'
import CONFIG from '../../config.js'
import api from '../../utils/api.js'
import { getRuntimeStr } from '../../utils/helper.js'

const COLORS = ['#3b82f6','#8b5cf6','#06b6d4','#10b981','#f59e0b','#ef4444','#ec4899','#6366f1','#14b8a6','#f97316']

export default {
  components: { TabBar, TokenModal, MusicPlayer },
  data() {
    return {
      runtimeStr: getRuntimeStr(),
      links: [],
      loadingLinks: true,
      repoTags: [],
      loadingTags: true,
    }
  },
  computed: {
    visibleTags() { return this.repoTags },
  },
  onLoad() { this.loadLinks(); this.loadTags() },
  onShow() {
    this.runtimeStr = getRuntimeStr()
    this._timer = setInterval(() => { this.runtimeStr = getRuntimeStr() }, 1000)
  },
  onHide() { clearInterval(this._timer) },
  methods: {
    openTag(tagName) {
      const tag = this.visibleTags.find(t => t.name === tagName)
      const color = tag ? '#' + (tag.color || '64748b') : '#64748b'
      uni.redirectTo({
        url: `/pages/index/index?tag=${encodeURIComponent(tagName)}&tagColor=${encodeURIComponent(color)}`
      })
    },
    async loadTags() {
      this.loadingTags = true
      try {
        // 基础分类标签集合（排除在外）
        const catLabels = new Set(CONFIG.categories.map(c => c.label))
        const tagMap = {} // { name -> { name, color, count } }

        // 拉取所有文章（最多 3 页，个人博客足够），从每篇文章的 labels 提取子标签
        let page = 1
        while (page <= 3) {
          const issues = await api.getIssues({ page, perPage: 100 })
          for (const issue of issues) {
            for (const label of (issue.labels || [])) {
              if (!catLabels.has(label.name)) {
                if (!tagMap[label.name]) {
                  tagMap[label.name] = { name: label.name, color: label.color || '64748b', count: 0 }
                }
                tagMap[label.name].count++
              }
            }
          }
          if (issues.length < 100) break
          page++
        }

        // 只保留有文章的标签，按数量降序
        this.repoTags = Object.values(tagMap)
          .filter(t => t.count > 0)
          .sort((a, b) => b.count - a.count)
      } catch {
        this.repoTags = []
      } finally {
        this.loadingTags = false
      }
    },
    async loadLinks() {
      this.loadingLinks = true
      try {
        let page = 1, allIssues = []
        while (true) {
          const batch = await api.getIssues({ page, perPage: 100, label: 'link' })
          allIssues = allIssues.concat(batch)
          if (batch.length < 100) break
          page++
        }
        this.links = allIssues.map((issue, idx) => {
          const body = (issue.body || '').trim()
          const urlM = body.match(/(https?:\/\/|www\.)[^\s<>"'\]]+/)
          let url = urlM ? urlM[0] : ''
          if (url.startsWith('www.')) url = 'https://' + url
          if (!url) url = issue.html_url
          return {
            title: issue.title,
            url,
            letter: issue.title.charAt(0).toUpperCase(),
            color: COLORS[idx % COLORS.length],
          }
        })
      } catch (e) {
        this.links = []
      } finally {
        this.loadingLinks = false
      }
    },
    openLink(url) {
      // #ifdef H5
      window.open(url, '_blank')
      // #endif
      // #ifdef APP-PLUS
      plus.runtime.openURL(url)
      // #endif
      // #ifndef H5 || APP-PLUS
      uni.setClipboardData({ data: url, success: () => uni.showToast({ title: '链接已复制' }) })
      // #endif
    },
  }
}
</script>

<style lang="scss" scoped>
.page { background: #f8fafc; height: 100vh; display: flex; flex-direction: column; }

/* ── 收藏链接 ── */
.links-section {
  margin: 16rpx 20rpx 8rpx;
  background: #fff;
  border-radius: 14rpx;
  overflow: hidden;
  box-shadow: 0 1rpx 6rpx rgba(0,0,0,.05);
}
.links-header {
  display: flex; flex-direction: row; align-items: center;
  padding: 16rpx 20rpx 12rpx;
  border-bottom: 1rpx solid #f1f5f9;
}
.links-title { font-size: 26rpx; font-weight: 700; color: #1e293b; flex: 1; }
.links-count { font-size: 20rpx; color: #94a3b8; }

.link-skel-icon {
  width: 64rpx; height: 64rpx; border-radius: 16rpx;
  background: #f1f5f9; margin-bottom: 8rpx;
  animation: pulse 1.4s ease-in-out infinite;
}
.link-skel-text {
  width: 80rpx; height: 20rpx; border-radius: 6rpx;
  background: #f1f5f9; animation: pulse 1.4s ease-in-out infinite;
}
@keyframes pulse { 0%,100%{opacity:.5} 50%{opacity:1} }

.links-empty { padding: 24rpx; text-align: center; }
.links-empty-text { font-size: 24rpx; color: #94a3b8; }

.links-grid {
  display: flex; flex-direction: row; flex-wrap: wrap;
  padding: 10rpx 12rpx 14rpx;
}
.link-cell {
  width: 25%; /* 一行4个 */
  display: flex; flex-direction: column; align-items: center;
  justify-content: flex-start;
  padding: 12rpx 8rpx;
  box-sizing: border-box;
  text-align: center;
}
.link-cell__icon {
  width: 64rpx; height: 64rpx; border-radius: 16rpx;
  display: flex; align-items: center; justify-content: center;
  margin-bottom: 8rpx;
}
.link-cell__letter { font-size: 28rpx; font-weight: 700; color: #fff; }
.link-cell__title {
  font-size: 20rpx; color: #334155; text-align: center;
  width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}

/* ── 主题标签（复用 links-section 容器样式） ── */
.tags-section {
  margin: 0 20rpx 16rpx;
  background: #fff;
  border-radius: 14rpx;
  overflow: hidden;
  box-shadow: 0 1rpx 6rpx rgba(0,0,0,.05);
}
/* 标签格子下方的文章数 */
.tag-cell__count {
  font-size: 18rpx; color: #94a3b8; margin-top: 4rpx;
  text-align: center; width: 100%;
}

/* ── 关于 ── */
.about-section { padding: 0 20rpx 20rpx; display: flex; flex-direction: column; gap: 16rpx; }
.about-card { background: #fff; border-radius: 14rpx; padding: 28rpx; box-shadow: 0 1rpx 6rpx rgba(0,0,0,.05); display: flex; flex-direction: column; gap: 12rpx; }
.about-title { font-size: 28rpx; font-weight: 700; color: #1e293b; margin-bottom: 4rpx; }
.about-item  { font-size: 26rpx; color: #64748b; line-height: 1.6; }
.runtime-card { background: #fff; border-radius: 14rpx; padding: 24rpx 28rpx; text-align: center; box-shadow: 0 1rpx 6rpx rgba(0,0,0,.05); }
.runtime-text { font-size: 24rpx; color: #94a3b8; }
</style>
