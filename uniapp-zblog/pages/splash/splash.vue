<template>
  <view class="splash">

    <!-- 背景粒子（装饰光点） -->
    <view class="particle p1"></view>
    <view class="particle p2"></view>
    <view class="particle p3"></view>
    <view class="particle p4"></view>
    <view class="particle p5"></view>

    <!-- 中心内容 -->
    <view class="center" :class="{ 'center--in': entered }">

      <!-- Logo 图标 -->
      <view class="logo-wrap" :class="{ 'logo-wrap--in': entered }">
        <view class="logo-bg">
          <text class="logo-z">Z</text>
          <!-- 铅笔装饰 -->
          <view class="logo-pen"></view>
        </view>
        <!-- 光圈 -->
        <view class="logo-ring" :class="{ 'logo-ring--pulse': entered }"></view>
      </view>

      <!-- 标题 -->
      <view class="title-wrap" :class="{ 'title-wrap--in': titleIn }">
        <text class="title-main">{{ siteTitle }}</text>
        <text class="title-sub">基于 GitHub Issues 的个人博客</text>
      </view>

      <!-- 加载指示器 -->
      <view class="dots" :class="{ 'dots--in': dotsIn }">
        <view class="dot dot1"></view>
        <view class="dot dot2"></view>
        <view class="dot dot3"></view>
      </view>

    </view>

    <!-- 底部版权 -->
    <view class="footer" :class="{ 'footer--in': dotsIn }">
      <text class="footer-text">Powered by GitHub Issues</text>
    </view>

  </view>
</template>

<script>
import CONFIG from '../../config.js'

export default {
  data() {
    return {
      siteTitle: CONFIG.siteTitle || 'Z-BLOG',
      entered:   false,
      titleIn:   false,
      dotsIn:    false,
    }
  },
  onLoad() {
    // 依次触发各阶段动画
    setTimeout(() => { this.entered  = true  }, 100)
    setTimeout(() => { this.titleIn  = true  }, 420)
    setTimeout(() => { this.dotsIn   = true  }, 700)
    // 动画结束后跳转首页
    setTimeout(() => {
      uni.reLaunch({ url: '/pages/index/index' })
    }, 2400)
  }
}
</script>

<style lang="scss" scoped>
/* ── 整体背景 ───────────────────────────────────────────── */
.splash {
  height: 100vh;
  background: linear-gradient(160deg, #0f172a 0%, #1e3a8a 45%, #1d4ed8 100%);
  display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  overflow: hidden; position: relative;
}

/* ── 粒子光点 ───────────────────────────────────────────── */
.particle {
  position: absolute; border-radius: 50%;
  background: rgba(255,255,255,0.12);
  animation: float 6s ease-in-out infinite;
}
.p1 { width: 180rpx; height: 180rpx; top: 8%;  left: 8%;  animation-delay: 0s;    animation-duration: 7s; }
.p2 { width: 100rpx; height: 100rpx; top: 15%; right: 12%; animation-delay: 1.2s; animation-duration: 5s; }
.p3 { width: 240rpx; height: 240rpx; top: 60%; right: 5%;  animation-delay: 0.6s; animation-duration: 8s; }
.p4 { width: 80rpx;  height: 80rpx;  bottom: 20%; left: 10%; animation-delay: 2s; animation-duration: 6s; }
.p5 { width: 140rpx; height: 140rpx; bottom: 8%;  right: 20%; animation-delay: 0.3s; animation-duration: 7.5s; }

@keyframes float {
  0%, 100% { transform: translateY(0) scale(1); opacity: 0.12; }
  50%       { transform: translateY(-40rpx) scale(1.08); opacity: 0.22; }
}

/* ── 中心内容 ───────────────────────────────────────────── */
.center {
  display: flex; flex-direction: column; align-items: center;
  opacity: 0; transform: translateY(40rpx);
  /* #ifdef H5 */
  transition: opacity .5s ease, transform .5s ease;
  /* #endif */
}
.center--in { opacity: 1; transform: translateY(0); }

/* ── Logo ───────────────────────────────────────────────── */
.logo-wrap {
  position: relative;
  margin-bottom: 56rpx;
  transform: scale(0.6);
  opacity: 0;
  /* #ifdef H5 */
  transition: transform .5s cubic-bezier(.34,1.56,.64,1), opacity .4s ease;
  /* #endif */
}
.logo-wrap--in { transform: scale(1); opacity: 1; }

.logo-bg {
  width: 200rpx; height: 200rpx;
  border-radius: 52rpx;
  background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%);
  box-shadow:
    0 0 0 6rpx rgba(59,130,246,0.3),
    0 24rpx 60rpx rgba(0,0,0,0.4),
    inset 0 2rpx 0 rgba(255,255,255,0.2);
  display: flex; align-items: center; justify-content: center;
  position: relative; overflow: hidden;
}

/* 内部光泽 */
.logo-bg::before {
  content: '';
  position: absolute; top: 0; left: 0; right: 0; height: 50%;
  background: linear-gradient(to bottom, rgba(255,255,255,0.15), transparent);
  border-radius: 52rpx 52rpx 0 0;
}

.logo-z {
  font-size: 110rpx; font-weight: 900;
  color: #ffffff;
  text-shadow: 0 4rpx 16rpx rgba(0,0,0,0.3);
  line-height: 1;
  position: relative; z-index: 1;
  font-family: Georgia, serif;
}

/* 笔装饰 */
.logo-pen {
  position: absolute; bottom: 20rpx; right: 22rpx;
  width: 12rpx; height: 46rpx;
  background: linear-gradient(to bottom, #f8fafc, #e2e8f0);
  border-radius: 3rpx 3rpx 0 0;
  transform: rotate(-30deg);
  opacity: 0.7;
}
.logo-pen::after {
  content: '';
  position: absolute; bottom: -10rpx; left: 50%;
  transform: translateX(-50%);
  width: 0; height: 0;
  border-left: 6rpx solid transparent;
  border-right: 6rpx solid transparent;
  border-top: 10rpx solid #fbbf24;
}

/* 光圈波动 */
.logo-ring {
  position: absolute; top: 50%; left: 50%;
  transform: translate(-50%, -50%) scale(1);
  width: 200rpx; height: 200rpx;
  border-radius: 50%;
  border: 3rpx solid rgba(59,130,246,0.5);
  opacity: 0;
}
.logo-ring--pulse {
  animation: ring-pulse 2s ease-out infinite;
}
@keyframes ring-pulse {
  0%   { transform: translate(-50%,-50%) scale(1);   opacity: 0.7; }
  100% { transform: translate(-50%,-50%) scale(1.8); opacity: 0; }
}

/* ── 标题文字 ────────────────────────────────────────────── */
.title-wrap {
  display: flex; flex-direction: column; align-items: center; gap: 14rpx;
  opacity: 0; transform: translateY(20rpx);
  /* #ifdef H5 */
  transition: opacity .45s ease, transform .45s ease;
  /* #endif */
}
.title-wrap--in { opacity: 1; transform: translateY(0); }

.title-main {
  font-size: 64rpx; font-weight: 900; color: #ffffff;
  letter-spacing: 6rpx;
  text-shadow: 0 4rpx 20rpx rgba(0,0,0,0.3);
  font-family: Georgia, serif;
}
.title-sub {
  font-size: 24rpx; color: rgba(255,255,255,0.6);
  letter-spacing: 1rpx;
}

/* ── 加载点 ──────────────────────────────────────────────── */
.dots {
  display: flex; flex-direction: row; gap: 18rpx;
  margin-top: 60rpx;
  opacity: 0;
  /* #ifdef H5 */
  transition: opacity .4s ease;
  /* #endif */
}
.dots--in { opacity: 1; }

.dot {
  width: 16rpx; height: 16rpx; border-radius: 50%;
  background: rgba(255,255,255,0.5);
  animation: dot-bounce 1.4s ease-in-out infinite;
}
.dot1 { animation-delay: 0s; }
.dot2 { animation-delay: .2s; }
.dot3 { animation-delay: .4s; }

@keyframes dot-bounce {
  0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
  40%            { transform: scale(1.2); opacity: 1;   background: rgba(255,255,255,0.9); }
}

/* ── 底部 ────────────────────────────────────────────────── */
.footer {
  position: absolute; bottom: 80rpx;
  opacity: 0;
  /* #ifdef H5 */
  transition: opacity .6s ease;
  /* #endif */
}
.footer--in { opacity: 1; }
.footer-text { font-size: 22rpx; color: rgba(255,255,255,0.35); letter-spacing: 1rpx; }
</style>
