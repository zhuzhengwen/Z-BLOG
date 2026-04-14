<template>
  <view class="page">

    <!-- 左侧抽屉遮罩 -->
    <view v-if="drawerOpen" class="drawer-mask" @click="drawerOpen = false"></view>

    <!-- 左侧抽屉 -->
    <view class="drawer" :class="{ 'drawer--open': drawerOpen }">
      <view class="drawer__header" :style="{ paddingTop: (statusBarHeight + 24) + 'px', background: headerGradient }">
        <view class="drawer__header-main">
          <view class="drawer__logo">
            <text class="drawer__logo-icon">📝</text>
          </view>
          <text class="drawer__title">{{ siteTitle }}</text>
        </view>
        <view class="drawer__close" @click="drawerOpen = false">
          <text class="drawer__close-icon">✕</text>
        </view>
      </view>

      <view class="drawer__menu">
        <view
          class="drawer__item"
          :class="{ 'drawer__item--active': !currentCat }"
          @click="selectCat(null)">
          <text class="drawer__item-icon">🏠</text>
          <text class="drawer__item-text" :style="!currentCat ? { color: themeColor, fontWeight: '700' } : {}">全部</text>
          <view v-if="!currentCat" class="drawer__item-dot" :style="{ background: themeColor }"></view>
        </view>

        <view
          v-for="c in categories" :key="c.label"
          class="drawer__item"
          :class="{ 'drawer__item--active': currentCat === c.label }"
          @click="selectCat(c.label)">
          <text class="drawer__item-icon">{{ c.icon }}</text>
          <text class="drawer__item-text" :style="currentCat === c.label ? { color: themeColor, fontWeight: '700' } : {}">{{ c.name }}</text>
          <view v-if="currentCat === c.label" class="drawer__item-dot" :style="{ background: themeColor }"></view>
        </view>
      </view>

      <view class="drawer__footer">
        <text class="drawer__footer-text">基于 GitHub Issues 驱动</text>
      </view>
    </view>

    <!-- 顶部 Header -->
    <view class="header" :style="{ background: headerGradient }">
      <view v-if="!searchExpanded" class="header__main">
        <!-- 左：汉堡菜单 + 当前分类名 -->
        <view class="header__left" @click="drawerOpen = true">
          <view class="hamburger">
            <view class="hamburger__line"></view>
            <view class="hamburger__line hamburger__line--mid" :class="{ 'hamburger__line--shrink': currentCat }"></view>
            <view class="hamburger__line"></view>
          </view>
          <text class="header__cat-name">{{ currentCatName }}</text>
        </view>
        <!-- 右：搜索 -->
        <view class="header__icon-btn" @click="searchExpanded = true">
          <text class="icon">🔍</text>
        </view>
      </view>

      <!-- 搜索展开态 -->
      <view v-else class="header__search">
        <view class="search-wrap">
          <text class="search-icon">🔍</text>
          <input
            class="search-input"
            v-model="searchKeyword"
            placeholder="搜索文章…"
            confirm-type="search"
            :focus="searchExpanded"
            @confirm="doSearch" />
          <text v-if="searchKeyword" class="search-clear" @click="searchKeyword = ''">✕</text>
        </view>
        <text class="search-cancel" :style="{ color: themeColor }" @click="cancelSearch">取消</text>
      </view>
    </view>

    <!-- 搜索结果 -->
    <scroll-view v-if="searchMode" scroll-y class="list-scroll">
      <view class="list-inner">
        <view class="search-result-bar">
          <text class="search-result-kw">"{{ lastKeyword }}" 的结果</text>
          <text class="search-result-back" @click="clearSearch">清除</text>
        </view>
        <view v-if="loading && !posts.length">
          <view v-for="i in 3" :key="i" class="skeleton-card">
            <view style="flex:1;display:flex;flex-direction:column;gap:14rpx;">
              <view class="skeleton sk-short"></view>
              <view class="skeleton sk-full"></view>
            </view>
          </view>
        </view>
        <view v-else-if="!posts.length && !loading" class="empty">
          <text class="empty-icon">🔍</text>
          <text class="empty-text">未找到相关内容</text>
        </view>
        <template v-else>
          <post-card v-for="issue in posts" :key="issue.id" :issue="issue" @click="openDetail(issue)" />
        </template>
      </view>
    </scroll-view>

    <!-- 激活标签提示条 -->
    <view v-if="!searchMode && activeTag" class="active-tag-bar"
      :style="activeTagColor ? { background: activeTagColor + '15', borderColor: activeTagColor + '40' } : {}">
      <view class="active-tag-bar__dot" :style="{ background: activeTagColor || '#3b82f6' }"></view>
      <text class="active-tag-bar__label" :style="{ color: activeTagColor || '#1d4ed8' }">{{ activeTag }}</text>
      <text class="active-tag-bar__clear" @click="selectTag(null)">✕ 清除</text>
    </view>

    <!-- 正常列表 -->
    <scroll-view
      v-if="!searchMode"
      class="list-scroll"
      scroll-y
      :lower-threshold="80"
      @scrolltolower="loadMore"
      refresher-enabled
      :refresher-triggered="refreshing"
      @refresherrefresh="onRefresh">

      <view class="list-inner">
        <view v-if="loading && !posts.length">
          <view v-for="i in 5" :key="i" class="skeleton-card">
            <view style="flex:1;display:flex;flex-direction:column;gap:14rpx;">
              <view class="skeleton sk-short"></view>
              <view class="skeleton sk-full"></view>
              <view class="skeleton sk-medium"></view>
            </view>
          </view>
        </view>
        <view v-else-if="error" class="error-box"><text>⚠️ {{ error }}</text></view>
        <view v-else-if="!posts.length && !loading" class="empty">
          <text class="empty-icon">📭</text>
          <text class="empty-text">暂无内容</text>
        </view>
        <!-- 思考分类：时间线样式（含年月筛选） -->
        <template v-else-if="isThinkingView">
          <!-- 年月筛选栏 -->
          <view class="tl-filter">
            <scroll-view scroll-x class="tl-filter__scroll">
              <view class="tl-filter__row">
                <view
                  v-for="y in tlYears" :key="y"
                  class="tl-pill"
                  :class="{ 'tl-pill--active': curYear === y }"
                  @click="setYear(y)">
                  <text class="tl-pill__text">{{ y === 'all' ? '全部' : y }}</text>
                </view>
              </view>
            </scroll-view>
            <scroll-view v-if="curYear !== 'all'" scroll-x class="tl-filter__scroll tl-filter__scroll--sm">
              <view class="tl-filter__row">
                <view
                  v-for="m in tlMonths" :key="m"
                  class="tl-pill tl-pill--sm"
                  :class="{ 'tl-pill--active': curMonth === m }"
                  @click="setMonth(m)">
                  <text class="tl-pill__text">{{ m === 'all' ? '全部' : m + '月' }}</text>
                </view>
              </view>
            </scroll-view>
          </view>

          <view class="tl-wrap">
            <view
              v-for="(item, idx) in filteredThinkPosts"
              :key="item.id"
              class="tl-item"
              @click="openDetail(item)">
              <view class="tl-left">
                <view class="tl-dot"></view>
                <view v-if="idx < filteredThinkPosts.length - 1" class="tl-line"></view>
              </view>
              <view class="tl-body">
                <view class="tl-head">
                  <text class="tl-title">{{ item.title }}</text>
                  <text class="tl-date">{{ tlDate(item.created_at) }}</text>
                </view>
                <view v-if="tlTags(item).length" class="tl-tags">
                  <text
                    v-for="tag in tlTags(item)" :key="tag.name"
                    class="tl-tag"
                    :style="{ color: '#' + (tag.color || '64748b'), background: '#' + (tag.color || '64748b') + '18', borderColor: '#' + (tag.color || '64748b') + '50' }">
                    {{ tag.name }}
                  </text>
                </view>
                <text v-if="item.body" class="tl-excerpt">{{ tlExcerpt(item.body) }}</text>
                <view class="tl-footer">
                  <text class="tl-comments">💬 {{ item.comments }}</text>
                </view>
              </view>
            </view>
            <view v-if="!filteredThinkPosts.length" class="tl-empty">
              <text class="tl-empty__text">该时间段暂无内容</text>
            </view>
          </view>
        </template>
        <!-- 普通列表 -->
        <template v-else>
          <post-card v-for="issue in posts" :key="issue.id" :issue="issue" @click="openDetail(issue)" />
        </template>
        <view v-if="posts.length" class="load-footer">
          <text v-if="loadingMore" class="load-text">加载中…</text>
          <text v-else-if="!hasMore" class="load-text">— 已经到底了 —</text>
        </view>
      </view>
    </scroll-view>

    <music-player></music-player>
    <tab-bar current="index"></tab-bar>
  </view>
</template>

<script>
import PostCard    from '../../components/PostCard.vue'
import TabBar      from '../../components/TabBar.vue'
import MusicPlayer from '../../components/MusicPlayer.vue'
import CONFIG      from '../../config.js'
import api         from '../../utils/api.js'
import { getThemeColor, darkenColor } from '../../utils/theme.js'
import { musicState } from '../../utils/music.js'

export default {
  components: { PostCard, TabBar, MusicPlayer },
  data() {
    return {
      posts:          [],
      hasMore:        true,
      page:           1,
      currentCat:     null,
      loading:        false,
      loadingMore:    false,
      refreshing:     false,
      error:          null,
      categories:     CONFIG.categories,
      siteTitle:      CONFIG.siteTitle || 'Z-BLOG',
      drawerOpen:      false,
      searchKeyword:   '',
      lastKeyword:     '',
      searchMode:      false,
      searchExpanded:  false,
      statusBarHeight: 0,
      themeColor:      getThemeColor(),
      activeTag:       null,
      activeTagColor:  null,
      curYear:         'all',
      curMonth:        'all',
    }
  },
  computed: {
    isThinkingView() {
      return this.currentCat === 'think'
    },
    // 时间线年份列表
    tlYears() {
      const years = new Set(this.posts.map(p => new Date(p.created_at).getFullYear()))
      return ['all', ...[...years].sort((a, b) => b - a)]
    },
    // 当前年份的月份列表
    tlMonths() {
      if (this.curYear === 'all') return []
      const months = new Set(
        this.posts
          .filter(p => new Date(p.created_at).getFullYear() == this.curYear)
          .map(p => new Date(p.created_at).getMonth() + 1)
      )
      return ['all', ...[...months].sort((a, b) => a - b)]
    },
    // 按年月筛选后的列表
    filteredThinkPosts() {
      return this.posts.filter(p => {
        const d = new Date(p.created_at)
        if (this.curYear !== 'all' && d.getFullYear() != this.curYear) return false
        if (this.curMonth !== 'all' && (d.getMonth() + 1) != this.curMonth) return false
        return true
      })
    },
    currentCatName() {
      if (!this.currentCat) return this.siteTitle
      const cat = this.categories.find(c => c.label === this.currentCat)
      return cat ? `${cat.icon} ${cat.name}` : this.siteTitle
    },
    headerGradient() {
      return `linear-gradient(135deg, ${this.themeColor} 0%, ${darkenColor(this.themeColor)} 100%)`
    },
  },
  mounted() {
    uni.$on('themeChanged', color => { this.themeColor = color })
  },
  beforeDestroy() {
    uni.$off('themeChanged')
  },
  onLoad(options) {
    const info = uni.getSystemInfoSync()
    this.statusBarHeight = info.statusBarHeight || 20
    if (options && options.tag) {
      this.activeTag = decodeURIComponent(options.tag)
      this.activeTagColor = options.tagColor ? decodeURIComponent(options.tagColor) : null
    }
    this.loadPosts()
  },
  onShow() {
    uni.$on('switchCategory', (label) => {
      this.switchCat(label)
      uni.$off('switchCategory')
    })
    uni.$on('switchToTag', (payload) => {
      if (typeof payload === 'string') {
        this.activeTag = payload
        this.activeTagColor = null
      } else {
        this.activeTag = payload.name
        this.activeTagColor = payload.color || null
      }
      this.currentCat = null
      this.page = 1
      this.posts = []
      this.hasMore = true
      this.loadPosts()
      uni.$off('switchToTag')
    })
  },
  onHide() {
    uni.$off('switchCategory')
    uni.$off('switchToTag')
  },
  methods: {

    async loadPosts(append = false) {
      if (!append) { this.loading = true; this.error = null }
      else           this.loadingMore = true
      try {
        // 组合分类 + 主题标签
        let label = this.currentCat || null
        if (this.activeTag) label = label ? `${label},${this.activeTag}` : this.activeTag

        // 思考分类：一次性全量加载，以支持年月筛选
        if (this.currentCat === 'think' && !append) {
          let allIssues = [], pg = 1
          while (true) {
            const batch = await api.getIssues({ page: pg, perPage: 100, label })
            allIssues = allIssues.concat(batch)
            if (batch.length < 100) break
            pg++
          }
          this.posts   = allIssues
          this.hasMore = false
          return
        }

        const issues = await api.getIssues({ page: this.page, label })
        this.posts   = append ? [...this.posts, ...issues] : issues
        this.hasMore = issues.length >= CONFIG.postsPerPage
      } catch (e) {
        this.error = e.message
      } finally {
        this.loading = this.loadingMore = this.refreshing = false
      }
    },

    selectTag(tag) {
      if (this.activeTag === tag) return
      this.activeTag      = tag
      this.activeTagColor = null
      this.page      = 1
      this.posts     = []
      this.hasMore   = true
      this.loadPosts()
    },

    switchCat(label) {
      if (this.currentCat === label && !this.searchMode && !this.activeTag) return
      this.searchMode     = false
      this.activeTag      = null
      this.activeTagColor = null
      this.currentCat = label
      this.curYear    = 'all'
      this.curMonth   = 'all'
      this.page       = 1
      this.posts      = []
      this.hasMore    = true
      this.loadPosts()
    },

    selectCat(label) {
      this.drawerOpen = false
      this.switchCat(label)
    },

    loadMore() {
      if (!this.hasMore || this.loadingMore || this.loading || this.searchMode) return
      this.page++
      this.loadPosts(true)
    },

    onRefresh() {
      this.refreshing = true
      this.page = 1
      api.clearCache()
      this.loadPosts()
    },

    openDetail(issue) {
      uni.navigateTo({ url: `/pages/detail/detail?number=${issue.number}&title=${encodeURIComponent(issue.title)}` })
    },

    // 时间线辅助
    tlDate(iso) {
      const d = new Date(iso)
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    },
    tlExcerpt(body) {
      if (!body) return ''
      return body.replace(/[#*`>\-_\[\]!~]/g, '').replace(/\n+/g, ' ').trim().slice(0, 80)
    },
    tlTags(item) {
      const catLabels = new Set(CONFIG.categories.map(c => c.label))
      return (item.labels || []).filter(l => !catLabels.has(l.name))
    },
    setYear(y) {
      this.curYear = y
      this.curMonth = 'all'
    },
    setMonth(m) {
      this.curMonth = m
    },

    async doSearch() {
      const q = this.searchKeyword.trim()
      if (!q) return
      this.lastKeyword    = q
      this.searchMode     = true
      this.searchExpanded = false
      this.loading        = true
      this.posts          = []
      try {
        const { items } = await api.searchIssues(q)
        this.posts = items
      } catch (e) {
        this.error = e.message
      } finally {
        this.loading = false
      }
    },

    cancelSearch() {
      this.searchKeyword  = ''
      this.searchExpanded = false
    },

    clearSearch() {
      this.searchKeyword  = ''
      this.lastKeyword    = ''
      this.searchMode     = false
      this.searchExpanded = false
      this.activeTag      = null
      this.activeTagColor = null
      this.page           = 1
      this.posts          = []
      this.hasMore        = true
      this.loadPosts()
    },
  }
}
</script>

<style lang="scss" scoped>
.page {
  display: flex; flex-direction: column; height: 100vh;
  background: linear-gradient(160deg, #dbeafe 0%, #ede9fe 45%, #fce7f3 100%);
}

/* ── 遮罩 ────────────────────────────────────────────────── */
.drawer-mask {
  position: fixed; inset: 0; z-index: 100;
  background: rgba(0,0,0,.4);
  /* #ifdef H5 */
  backdrop-filter: blur(2px);
  /* #endif */
}

/* ── 左侧抽屉 ────────────────────────────────────────────── */
.drawer {
  position: fixed; top: 0; left: 0; bottom: 0; z-index: 101;
  width: 540rpx;
  background: rgba(248,250,252,0.88);
  backdrop-filter: blur(40px);
  -webkit-backdrop-filter: blur(40px);
  border-right: 1rpx solid rgba(255,255,255,0.6);
  display: flex; flex-direction: column;
  transform: translateX(-100%);
  /* #ifdef H5 */
  transition: transform .3s cubic-bezier(.4,0,.2,1);
  /* #endif */
  box-shadow: 8rpx 0 40rpx rgba(0,0,0,.12);
}
.drawer--open { transform: translateX(0); }

.drawer__header {
  display: flex; flex-direction: row; align-items: center;
  padding-left: 32rpx; padding-right: 28rpx; padding-bottom: 28rpx;
  background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
}
.drawer__header-main {
  flex: 1; display: flex; flex-direction: row; align-items: center; gap: 16rpx;
}
.drawer__logo {
  width: 72rpx; height: 72rpx; border-radius: 18rpx;
  background: rgba(255,255,255,.2);
  display: flex; align-items: center; justify-content: center;
}
.drawer__logo-icon { font-size: 38rpx; }
.drawer__title {
  font-size: 34rpx; font-weight: 800; color: #fff;
  text-shadow: 0 1rpx 4rpx rgba(0,0,0,.15);
}
.drawer__close {
  width: 60rpx; height: 60rpx; border-radius: 50%;
  background: rgba(255,255,255,.2);
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.drawer__close-icon { font-size: 26rpx; color: rgba(255,255,255,.9); }

.drawer__menu {
  flex: 1; padding: 12rpx 0;
  overflow-y: auto;
}
.drawer__item {
  display: flex; flex-direction: row; align-items: center;
  padding: 26rpx 32rpx; gap: 22rpx;
  position: relative;
  /* #ifdef H5 */
  transition: background .15s;
  /* #endif */
}
.drawer__item--active {
  background: linear-gradient(90deg, rgba(37,99,235,.08) 0%, rgba(37,99,235,.02) 100%);
}
.drawer__item-icon {
  font-size: 36rpx; width: 52rpx; text-align: center;
  background: #f8fafc; border-radius: 12rpx; padding: 8rpx 0;
}
.drawer__item--active .drawer__item-icon {
  background: rgba(37,99,235,.1);
}
.drawer__item-text {
  flex: 1; font-size: 30rpx; color: #475569; font-weight: 500;
}
.drawer__item--active .drawer__item-text { color: #2563eb; font-weight: 700; }
.drawer__item-dot {
  width: 10rpx; height: 10rpx; border-radius: 50%; background: #2563eb;
  box-shadow: 0 0 6rpx rgba(37,99,235,.5);
}

.drawer__footer {
  padding: 20rpx 32rpx 32rpx;
  border-top: 1rpx solid #f1f5f9;
}
.drawer__footer-text { font-size: 22rpx; color: #94a3b8; }

/* ── Header ──────────────────────────────────────────────── */
.header {
  background: #fff;
  border-bottom: 1rpx solid #f1f5f9;
  padding: 0 24rpx;
  height: 96rpx;
  display: flex; align-items: center; flex-shrink: 0;
  box-shadow: 0 2rpx 8rpx rgba(0,0,0,.04);
  position: relative; z-index: 10;
}
.header__main {
  flex: 1; display: flex; flex-direction: row;
  align-items: center; justify-content: space-between;
}
.header__left {
  display: flex; flex-direction: row; align-items: center; gap: 16rpx;
  flex: 1;
}

/* 汉堡菜单图标 */
.hamburger {
  width: 44rpx; display: flex; flex-direction: column; gap: 9rpx; padding: 4rpx 0;
}
.hamburger__line {
  height: 4rpx; background: #1e293b; border-radius: 2rpx;
  /* #ifdef H5 */
  transition: width .2s;
  /* #endif */
}
.hamburger__line--mid { width: 70%; }
.hamburger__line--shrink { width: 50%; }

.header__cat-name {
  font-size: 32rpx; font-weight: 700; color: #1e293b;
}
.header__icon-btn {
  width: 72rpx; height: 72rpx; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  background: #f8fafc; flex-shrink: 0;
}
.icon { font-size: 34rpx; }

/* 搜索展开 */
.header__search {
  flex: 1; display: flex; flex-direction: row; align-items: center; gap: 16rpx;
}
.search-wrap {
  flex: 1; display: flex; flex-direction: row; align-items: center;
  background: #f1f5f9; border-radius: 12rpx; padding: 14rpx 20rpx; gap: 10rpx;
}
.search-icon  { font-size: 26rpx; color: #94a3b8; }
.search-input { flex: 1; font-size: 28rpx; color: #1e293b; }
.search-clear { font-size: 24rpx; color: #94a3b8; }
.search-cancel { font-size: 28rpx; color: #2563eb; white-space: nowrap; }

/* ── 激活标签提示条 ─────────────────────────────────────── */
.active-tag-bar {
  display: flex; flex-direction: row; align-items: center;
  margin: 0 20rpx 16rpx; padding: 14rpx 20rpx;
  background: #eff6ff; border-radius: 10rpx;
  border: 1.5rpx solid #bfdbfe;
}
.active-tag-bar__dot {
  width: 14rpx; height: 14rpx; border-radius: 50%;
  margin-right: 12rpx; flex-shrink: 0;
}
.active-tag-bar__label { flex: 1; font-size: 26rpx; color: #1d4ed8; font-weight: 600; }
.active-tag-bar__clear { font-size: 24rpx; color: #94a3b8; padding: 4rpx 12rpx; }

/* ── 旧标签筛选条（保留占位防报错）──────────────────────── */
.tag-bar {
  flex-shrink: 0; height: 0; background: transparent;
  /* #ifndef APP-NVUE */
  white-space: nowrap;
  /* #endif */
}
.tag-bar__inner {
  display: flex; flex-direction: row; align-items: center;
  padding: 0 20rpx; gap: 12rpx; height: 76rpx;
}
.tag-chip {
  display: flex; align-items: center; justify-content: center;
  padding: 10rpx 24rpx; border-radius: 99rpx; flex-shrink: 0;
  border-width: 1.5rpx; border-style: solid; border-color: #e2e8f0;
  background: rgba(255,255,255,0.7);
}
.tag-chip__text { font-size: 24rpx; color: #64748b; font-weight: 500; white-space: nowrap; }

/* ── 列表 ────────────────────────────────────────────────── */
.list-scroll { flex: 1; height: 0; background: transparent; }
.list-inner  { padding: 16rpx 20rpx 160rpx; display: flex; flex-direction: column; gap: 12rpx; }

.search-result-bar {
  display: flex; flex-direction: row; align-items: center; padding: 16rpx 4rpx 18rpx;
}
.search-result-kw   { flex: 1; font-size: 26rpx; color: #1e293b; font-weight: 600; }
.search-result-back { font-size: 24rpx; color: #94a3b8; padding: 6rpx; }

/* 骨架屏 */
.skeleton-card {
  background: #fff; border-bottom: 1rpx solid #f0f0f0;
  padding: 24rpx 28rpx;
  display: flex; flex-direction: row; gap: 20rpx;
}
.skeleton-card::before {
  content: ''; display: block; width: 80rpx; height: 80rpx;
  border-radius: 10rpx; flex-shrink: 0;
  background: #f1f5f9;
}
.skeleton {
  border-radius: 8rpx; height: 26rpx;
  background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%);
  background-size: 400% 100%; animation: shimmer 1.4s infinite;
}
.sk-full { width: 100%; }
.sk-medium { width: 60%; }
.sk-short { width: 28%; }
@keyframes shimmer { 0%{ background-position: 200% 0; } 100%{ background-position: -200% 0; } }

/* 空/错误 */
.empty {
  text-align: center; padding: 80rpx 40rpx;
  display: flex; flex-direction: column; align-items: center; gap: 16rpx;
}
.empty-icon { font-size: 80rpx; }
.empty-text { font-size: 28rpx; color: #94a3b8; }
.error-box  { background: #fef2f2; border-radius: 10rpx; padding: 28rpx; margin: 20rpx 0; }
.error-box text { color: #b91c1c; font-size: 28rpx; }

.load-footer { padding: 30rpx 0 20rpx; text-align: center; }
.load-text   { font-size: 26rpx; color: #94a3b8; }

/* ── 思考时间线 ── */

/* 年月筛选栏 */
.tl-filter {
  padding: 16rpx 20rpx 4rpx;
  display: flex; flex-direction: column; gap: 10rpx;
}
.tl-filter__scroll { width: 100%; }
.tl-filter__scroll--sm { margin-top: 4rpx; padding-top: 10rpx; border-top: 1rpx solid #e2e8f0; }
.tl-filter__row {
  display: flex; flex-direction: row; gap: 10rpx;
  padding-bottom: 4rpx;
  /* #ifdef H5 */
  flex-wrap: nowrap;
  /* #endif */
}
.tl-pill {
  display: flex; align-items: center; justify-content: center;
  padding: 0 22rpx; height: 52rpx; border-radius: 99rpx;
  border: 1.5rpx solid #e2e8f0;
  background: rgba(255,255,255,.7);
  flex-shrink: 0;
}
.tl-pill--sm { height: 44rpx; padding: 0 18rpx; }
.tl-pill--active {
  background: #d73a49; border-color: #d73a49;
}
.tl-pill--active .tl-pill__text { color: #fff; font-weight: 700; }
.tl-pill__text { font-size: 24rpx; color: #475569; white-space: nowrap; }
.tl-pill--sm .tl-pill__text { font-size: 22rpx; }

.tl-wrap { padding: 16rpx 20rpx 0; }

.tl-item {
  display: flex; flex-direction: row;
}

.tl-left {
  display: flex; flex-direction: column; align-items: center;
  width: 40rpx; flex-shrink: 0; padding-top: 28rpx;
}
.tl-dot {
  width: 18rpx; height: 18rpx; border-radius: 50%;
  background: rgba(215,58,73,.55);
  border: 3rpx solid #fff;
  box-shadow: 0 0 0 4rpx rgba(215,58,73,.2);
  flex-shrink: 0; z-index: 1;
}
.tl-line {
  width: 2rpx; flex: 1; min-height: 32rpx;
  background: linear-gradient(to bottom, rgba(215,58,73,.25) 0%, #e2e8f0 100%);
  margin-top: 6rpx;
}

.tl-body {
  flex: 1; margin: 0 0 16rpx 16rpx;
  background: #fff;
  border-radius: 14rpx;
  border: 1rpx solid #f1f5f9;
  padding: 20rpx 24rpx;
  box-shadow: 0 2rpx 12rpx rgba(0,0,0,.06);
}
.tl-head {
  display: flex; flex-direction: row; align-items: flex-start;
  justify-content: space-between; gap: 12rpx; margin-bottom: 8rpx;
}
.tl-date {
  font-size: 20rpx; color: #94a3b8; flex-shrink: 0; margin-top: 4rpx;
  white-space: nowrap;
}
.tl-title {
  font-size: 30rpx; font-weight: 700; color: #1e293b;
  line-height: 1.5; flex: 1;
}
.tl-tags {
  display: flex; flex-direction: row; flex-wrap: wrap; gap: 8rpx; margin-bottom: 10rpx;
}
.tl-tag {
  font-size: 20rpx; padding: 2rpx 12rpx; border-radius: 6rpx;
  border: 1rpx solid transparent;
}
.tl-excerpt {
  font-size: 26rpx; color: #64748b; line-height: 1.5;
  display: block; margin-bottom: 10rpx;
  overflow: hidden; text-overflow: ellipsis;
  display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;
}
.tl-footer { display: flex; flex-direction: row; align-items: center; justify-content: flex-end; }
.tl-comments { font-size: 22rpx; color: #94a3b8; }

.tl-empty { padding: 60rpx 0; text-align: center; }
.tl-empty__text { font-size: 28rpx; color: #94a3b8; }

</style>
