<template>
  <view class="tabbar">
    <view
      v-for="item in tabs" :key="item.page"
      class="tabbar__item"
      :class="{ 'tabbar__item--active': current === item.key }"
      @click="go(item)">
      <text class="tabbar__icon">{{ item.icon }}</text>
      <text class="tabbar__label">{{ item.label }}</text>
      <!-- 活跃指示点 -->
      <view v-if="current === item.key" class="tabbar__dot"></view>
    </view>
  </view>
</template>

<script>
export default {
  name: 'TabBar',
  props: {
    current: { type: String, default: 'index' }
  },
  data() {
    return {
      tabs: [
        { key: 'index',    label: '首页',   icon: '🏠', page: '/pages/index/index' },
        { key: 'photos',   label: '照片墙', icon: '🖼️', page: '/pages/photos/photos' },
        { key: 'category', label: '分类',   icon: '📋', page: '/pages/category/category' },
        { key: 'profile',  label: '我的',   icon: '👤', page: '/pages/profile/profile' },
      ]
    }
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
  display: flex;
  flex-direction: row;
  align-items: stretch;
  box-shadow: 0 -2rpx 12rpx rgba(0,0,0,.06);
  z-index: 999;
}

.tabbar__item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4rpx;
  position: relative;
  transition: all .15s;
}

.tabbar__icon {
  font-size: 42rpx;
  line-height: 1;
  filter: grayscale(60%);
  transition: filter .15s, transform .15s;
}

.tabbar__label {
  font-size: 20rpx;
  color: #94a3b8;
  font-weight: 500;
  transition: color .15s;
}

/* 激活状态 */
.tabbar__item--active .tabbar__icon {
  filter: none;
  transform: translateY(-2rpx);
}
.tabbar__item--active .tabbar__label {
  color: #2563eb;
  font-weight: 700;
}

/* 活跃指示点 */
.tabbar__dot {
  position: absolute;
  bottom: 8rpx;
  left: 50%;
  transform: translateX(-50%);
  width: 8rpx;
  height: 8rpx;
  border-radius: 50%;
  background: #2563eb;
}
</style>
