<template>
  <view class="tabbar">
    <view
      v-for="item in tabs" :key="item.page"
      class="tabbar__item"
      :class="{ 'tabbar__item--active': current === item.key }"
      @click="go(item)">
      <image
        class="tabbar__icon-img"
        :src="current === item.key ? item.iconActive : item.iconNormal"
        mode="aspectFit">
      </image>
      <text
        class="tabbar__label"
        :style="current === item.key ? { color: themeColor, fontWeight: '700' } : {}">
        {{ item.label }}
      </text>
      <view
        v-if="current === item.key"
        class="tabbar__dot"
        :style="{ background: themeColor }">
      </view>
    </view>
  </view>
</template>

<script>
import { getThemeColor } from '../utils/theme.js'

export default {
  name: 'TabBar',
  props: {
    current: { type: String, default: 'index' }
  },
  data() {
    return {
      themeColor: getThemeColor(),
      tabs: [
        { key: 'index',    label: '首页',  iconNormal: '/static/icons/tab-home-normal.png',     iconActive: '/static/icons/tab-home-active.png',     page: '/pages/index/index' },
        { key: 'photos',   label: '照片墙', iconNormal: '/static/icons/tab-photos-normal.png',   iconActive: '/static/icons/tab-photos-active.png',   page: '/pages/photos/photos' },
        { key: 'category', label: '分类',  iconNormal: '/static/icons/tab-category-normal.png', iconActive: '/static/icons/tab-category-active.png', page: '/pages/category/category' },
        { key: 'profile',  label: '我的',  iconNormal: '/static/icons/tab-profile-normal.png',  iconActive: '/static/icons/tab-profile-active.png',  page: '/pages/profile/profile' },
      ]
    }
  },
  mounted() {
    uni.$on('themeChanged', color => { this.themeColor = color })
  },
  beforeDestroy() {
    uni.$off('themeChanged')
  },
  methods: {
    go(item) {
      if (this.current === item.key) return
      uni.redirectTo({ url: item.page })
    }
  }
}
</script>

<style lang="scss" scoped>
.tabbar {
  position: fixed;
  left: 0; right: 0; bottom: 0;
  height: 120rpx;
  padding-bottom: env(safe-area-inset-bottom);
  background: #fff;
  border-top: 1rpx solid #e2e8f0;
  display: flex; flex-direction: row; align-items: stretch;
  box-shadow: 0 -2rpx 12rpx rgba(0,0,0,.06);
  z-index: 999;
}
.tabbar__item {
  flex: 1; display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  gap: 6rpx; position: relative;
}
.tabbar__icon-img { width: 48rpx; height: 48rpx; }
.tabbar__label { font-size: 20rpx; color: #94a3b8; font-weight: 500; }
.tabbar__dot {
  position: absolute; bottom: 8rpx; left: 50%;
  transform: translateX(-50%);
  width: 8rpx; height: 8rpx; border-radius: 50%;
}
</style>
