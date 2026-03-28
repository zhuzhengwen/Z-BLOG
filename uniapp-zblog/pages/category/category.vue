<template>
  <view class="page">
    <scroll-view scroll-y style="flex:1">
      <view class="grid">
        <view class="grid-row" v-for="(row, i) in categoryRows" :key="i">
          <view
            v-for="c in row" :key="c.label"
            class="cat-card"
            :style="{ borderColor: c.color + '40' }"
            @click="openCategory(c)">
            <view class="cat-icon-badge" :style="{ background: c.color + '18', borderColor: c.color + '40' }">
              <text class="cat-icon-text" :style="{ color: c.color }">{{ c.icon }}</text>
            </view>
            <text class="cat-name">{{ c.name }}</text>
            <text class="cat-desc">{{ c.desc || '' }}</text>
            <view class="cat-arrow" :style="{ background: c.color + '15' }">
              <text :style="{ color: c.color }">→</text>
            </view>
          </view>
        </view>
      </view>

      <view class="about-section">
        <view class="about-card">
          <text class="about-title">使用说明</text>
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
    <tab-bar current="category"></tab-bar>
    <token-modal></token-modal>
  </view>
</template>

<script>
import TabBar     from '../../components/TabBar.vue'
import TokenModal from '../../components/TokenModal.vue'
import CONFIG from '../../config.js'
import { getRuntimeStr } from '../../utils/helper.js'

export default {
  components: { TabBar, TokenModal },
  data() {
    return {
      categories: CONFIG.categories.map(c => ({ ...c, desc: this.getDesc(c.label) })),
      runtimeStr: getRuntimeStr(),
    }
  },
  computed: {
    categoryRows() {
      const rows = []
      for (let i = 0; i < this.categories.length; i += 2) {
        rows.push(this.categories.slice(i, i + 2))
      }
      return rows
    }
  },
  onShow() {
    this.runtimeStr = getRuntimeStr()
    this._timer = setInterval(() => { this.runtimeStr = getRuntimeStr() }, 1000)
  },
  onHide() { clearInterval(this._timer) },
  methods: {
    getDesc(label) {
      return { article: '长篇文章与教程', image: '图片与摄影作品', video: '视频内容分享', note: '随记与短笔记', link: '收藏的链接' }[label] || ''
    },
    openCategory(cat) {
      uni.redirectTo({ url: '/pages/index/index' })
      setTimeout(() => uni.$emit('switchCategory', cat.label), 300)
    }
  }
}
</script>

<style lang="scss" scoped>
.page { background: #f8fafc; height: 100vh; display: flex; flex-direction: column; }

.grid { padding: 16rpx 20rpx; }
.grid-row {
  display: flex; flex-direction: row;
  margin-bottom: 16rpx;
}
.cat-card {
  flex: 1;
  background: #fff; border-radius: 14rpx;
  padding: 30rpx 24rpx; border: 1.5rpx solid;
  box-shadow: 0 1rpx 6rpx rgba(0,0,0,.05);
  display: flex; flex-direction: column; align-items: center; gap: 10rpx; position: relative;
}
.cat-card:first-child { margin-right: 8rpx; }
.cat-card:last-child  { margin-left: 8rpx; }
.cat-icon-badge {
  width: 88rpx; height: 88rpx; border-radius: 50%;
  border: 1.5rpx solid; display: flex; align-items: center; justify-content: center;
}
.cat-icon-text { font-size: 34rpx; font-weight: 700; }
.cat-name { font-size: 30rpx; font-weight: 700; color: #1e293b; }
.cat-desc { font-size: 22rpx; color: #94a3b8; text-align: center; }
.cat-arrow {
  margin-top: 6rpx; width: 52rpx; height: 52rpx;
  border-radius: 50%; display: flex; align-items: center; justify-content: center;
  text { font-size: 28rpx; font-weight: 700; }
}

.about-section { padding: 0 20rpx 20rpx; display: flex; flex-direction: column; gap: 16rpx; }
.about-card { background: #fff; border-radius: 14rpx; padding: 28rpx; box-shadow: 0 1rpx 6rpx rgba(0,0,0,.05); display: flex; flex-direction: column; gap: 12rpx; }
.about-title { font-size: 28rpx; font-weight: 700; color: #1e293b; margin-bottom: 4rpx; }
.about-item  { font-size: 26rpx; color: #64748b; line-height: 1.6; }
.runtime-card { background: #fff; border-radius: 14rpx; padding: 24rpx 28rpx; text-align: center; box-shadow: 0 1rpx 6rpx rgba(0,0,0,.05); }
.runtime-text { font-size: 24rpx; color: #94a3b8; }
</style>
