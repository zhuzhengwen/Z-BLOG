<template>
  <view v-if="hasMusic">
    <!-- 遮罩（歌单展开时） -->
    <view v-if="showList" class="music-mask" @click="showList = false"></view>

    <!-- 收起态：旋转 CD 浮钮 -->
    <view v-if="collapsed" class="music-cd" :style="cdStyle" @click="collapsed = false">
      <!-- 外层光晕 -->
      <view class="music-cd__glow" :class="{ 'music-cd__glow--active': isPlaying }"></view>
      <!-- 碟片主体 -->
      <view class="music-cd__disc" :class="{ 'music-cd__disc--spin': isPlaying }">
        <!-- 彩虹折射层 -->
        <view class="music-cd__rainbow"></view>
        <!-- 多圈刻槽 -->
        <view class="music-cd__tracks"></view>
        <!-- 高光 -->
        <view class="music-cd__shine"></view>
        <!-- 中心 hub -->
        <view class="music-cd__hub">
          <view class="music-cd__hub-ring"></view>
          <view class="music-cd__hole">
            <image v-if="cover" :src="cover" class="music-cd__hole-cover" mode="aspectFill" />
            <text v-else class="music-cd__hole-note">♫</text>
          </view>
        </view>
      </view>
      <!-- 播放中绿点 -->
      <view v-if="isPlaying" class="music-cd__dot"></view>
    </view>

    <!-- 展开态 -->
    <view v-else class="music-wrap" :style="wrapStyle">

      <!-- 歌单面板 -->
      <view v-if="showList" class="music-list">
        <view class="music-list__header">
          <text class="music-list__title">播放列表</text>
          <text class="music-list__count">共 {{ playlist.length }} 首</text>
          <view class="music-list__close" @click="showList = false">
            <text class="music-list__close-icon">✕</text>
          </view>
        </view>
        <scroll-view class="music-list__scroll" scroll-y :scroll-into-view="activeItemId">
          <view
            v-for="(track, i) in playlist"
            :key="i"
            :id="'music-item-' + i"
            class="music-list__item"
            :class="{ 'music-list__item--active': i === currentIndex }"
            @click="playItem(i)">
            <view class="music-list__item-num">
              <text v-if="i !== currentIndex" class="music-list__num-text">{{ i + 1 }}</text>
              <view v-else class="music-list__playing">
                <view class="music-list__bar" style="animation-delay:0s"></view>
                <view class="music-list__bar" style="animation-delay:.2s"></view>
                <view class="music-list__bar" style="animation-delay:.4s"></view>
              </view>
            </view>
            <view class="music-list__item-info">
              <text class="music-list__item-title">{{ track.title || '未知歌曲' }}</text>
              <text class="music-list__item-artist">{{ track.artist || '' }}</text>
            </view>
          </view>
        </scroll-view>
      </view>

      <!-- 迷你播放条 -->
      <view class="music-bar">
        <!-- 碟片 -->
        <view class="music-bar__disc" :class="{ 'music-bar__disc--spin': isPlaying }">
          <image v-if="cover" :src="cover" class="music-bar__cover" mode="aspectFill" />
          <text v-else class="music-bar__note">♪</text>
        </view>

        <!-- 歌曲信息（点击展开歌单） -->
        <view class="music-bar__info" @click="toggleList">
          <view class="music-bar__title-wrap">
            <text class="music-bar__title" :class="{ 'music-bar__title--scroll': isPlaying }">{{ title }}</text>
          </view>
          <text class="music-bar__artist">{{ artist || '点击查看歌单' }}</text>
        </view>

        <!-- 控制按钮 -->
        <view class="music-bar__controls">

          <!-- 上一曲 -->
          <view class="ctrl-btn" @click="onPrev">
            <text class="ctrl-icon">⏮</text>
          </view>

          <!-- 播放 / 暂停 -->
          <view class="ctrl-btn ctrl-btn--play" @click="onToggle">
            <text class="ctrl-icon ctrl-icon--play">{{ isPlaying ? '⏸' : '▶' }}</text>
          </view>

          <!-- 下一曲 -->
          <view class="ctrl-btn" @click="onNext">
            <text class="ctrl-icon">⏭</text>
          </view>

          <!-- 歌单列表 -->
          <view class="ctrl-btn" @click="toggleList">
            <text class="ctrl-icon" :style="{ color: showList ? '#2563eb' : '#64748b' }">☰</text>
          </view>

          <!-- 收起为 CD -->
          <view class="ctrl-btn" @click="collapsed = true">
            <text class="ctrl-icon">∧</text>
          </view>

        </view>
      </view>
    </view>
  </view>
</template>

<script>
import { musicState, PLAYLIST, togglePlay, nextTrack, prevTrack, playIndex } from '../utils/music.js'

export default {
  name: 'MusicPlayer',
  data() {
    const info = uni.getSystemInfoSync()
    const rpx  = info.screenWidth / 750
    const safe = (info.safeAreaInsets && info.safeAreaInsets.bottom) || 0
    return {
      tabBarPx:  Math.round(120 * rpx + safe),
      showList:  false,
      collapsed: true,   // 默认收起为 CD
    }
  },
  computed: {
    hasMusic()       { return musicState.hasMusic },
    isPlaying()      { return musicState.isPlaying },
    currentIndex()   { return musicState.currentIndex },
    title()          { return musicState.title  || '暂无音乐' },
    artist()         { return musicState.artist || '' },
    cover()          { return musicState.cover  || '' },
    playlist()       { return PLAYLIST },
    expandTrigger()  { return musicState.expandTrigger },
    wrapStyle()      { return { bottom: this.tabBarPx + 'px' } },
    cdStyle()        { return { bottom: (this.tabBarPx + 16) + 'px' } },
    activeItemId()   { return this.showList ? 'music-item-' + this.currentIndex : '' },
  },
  watch: {
    // 监听 expandTrigger：值每次 +1 就展开播放器 + 歌单
    expandTrigger(val) {
      if (val > 0) {
        this.collapsed = false
        this.showList  = true
      }
    },
  },
  methods: {
    onToggle()   { togglePlay() },
    onNext()     { nextTrack()  },
    onPrev()     { prevTrack()  },
    playItem(i)  { playIndex(i) },
    toggleList() { this.showList = !this.showList },
  },
}
</script>

<style lang="scss" scoped>
/* ── 遮罩 ──────────────────────────────── */
.music-mask {
  position: fixed; inset: 0; z-index: 997;
  background: rgba(0,0,0,.3);
}

/* ══════════════════════════════════════════
   收起态 CD 浮钮
══════════════════════════════════════════ */
.music-cd {
  position: fixed; left: 20rpx; z-index: 998;
  width: 100rpx; height: 100rpx;
  display: flex; align-items: center; justify-content: center;
}

/* 外层光晕（播放时发光） */
.music-cd__glow {
  position: absolute; inset: -12rpx; border-radius: 50%;
  background: radial-gradient(circle,
    rgba(168,85,247,.4) 0%, rgba(99,102,241,.2) 40%, transparent 70%);
  opacity: 0; transition: opacity .5s;
  filter: blur(4px);
}
.music-cd__glow--active { opacity: 1; animation: glow-pulse 2.4s ease-in-out infinite; }
@keyframes glow-pulse {
  0%,100% { transform: scale(.95); opacity: .7; }
  50%     { transform: scale(1.08); opacity: 1;  }
}

/* 碟片主体 */
.music-cd__disc {
  width: 100rpx; height: 100rpx; border-radius: 50%;
  position: relative; overflow: hidden;
  /* 珍珠银底层：中心亮、边缘深 */
  background:
    radial-gradient(circle at 40% 34%,
      #ffffff 0%,
      #f0f4f8 12%,
      #cdd5de 30%,
      #9aaab8 52%,
      #607080 72%,
      #3a4a58 88%,
      #202c38 100%);
  box-shadow:
    0 12rpx 40rpx rgba(0,0,0,.5),
    0 4rpx 12rpx rgba(0,0,0,.3),
    inset 0 3rpx 8rpx rgba(255,255,255,.6),
    inset 0 -3rpx 6rpx rgba(0,0,0,.4);
}
.music-cd__disc--spin { animation: cd-spin 5s linear infinite; }
@keyframes cd-spin { to { transform: rotate(360deg); } }

/* 彩虹折射：更鲜艳，限制在中间环形区域 */
.music-cd__rainbow {
  position: absolute; inset: 0; border-radius: 50%;
  background:
    /* 只在 25%~80% 半径范围内显示折射色 */
    radial-gradient(circle, transparent 24%, rgba(0,0,0,0) 24.5%, rgba(0,0,0,0) 80%, rgba(0,0,0,.2) 100%),
    conic-gradient(
      from 20deg,
      rgba(255, 50, 80,  .45) 0deg,
      rgba(255,140,  0,  .42) 45deg,
      rgba(220,240,  0,  .38) 90deg,
      rgba( 40,220, 80,  .40) 135deg,
      rgba( 30,160,255,  .45) 185deg,
      rgba(120, 40,255,  .45) 235deg,
      rgba(255, 20,180,  .42) 285deg,
      rgba(255, 50, 80,  .45) 360deg
    );
  mix-blend-mode: screen;
}

/* 刻槽：稍深，间距均匀 */
.music-cd__tracks {
  position: absolute; inset: 0; border-radius: 50%;
  background:
    radial-gradient(circle, transparent 24.5%, rgba(0,0,0,.09) 25.5%, transparent 26.5%),
    radial-gradient(circle, transparent 31%,   rgba(0,0,0,.08) 32%,   transparent 33%),
    radial-gradient(circle, transparent 37.5%, rgba(0,0,0,.08) 38.5%, transparent 39.5%),
    radial-gradient(circle, transparent 44%,   rgba(0,0,0,.08) 45%,   transparent 46%),
    radial-gradient(circle, transparent 50.5%, rgba(0,0,0,.08) 51.5%, transparent 52.5%),
    radial-gradient(circle, transparent 57%,   rgba(0,0,0,.08) 58%,   transparent 59%),
    radial-gradient(circle, transparent 63.5%, rgba(0,0,0,.08) 64.5%, transparent 65.5%),
    radial-gradient(circle, transparent 70%,   rgba(0,0,0,.08) 71%,   transparent 72%),
    radial-gradient(circle, transparent 76.5%, rgba(0,0,0,.08) 77.5%, transparent 78.5%);
}

/* 高光弧：主光源在左上，副光在右下 */
.music-cd__shine {
  position: absolute; inset: 0; border-radius: 50%;
  background:
    radial-gradient(ellipse 55% 40% at 30% 22%,
      rgba(255,255,255,.65) 0%, rgba(255,255,255,.15) 45%, transparent 65%),
    radial-gradient(ellipse 30% 20% at 72% 76%,
      rgba(255,255,255,.2) 0%, transparent 60%);
}

/* 中心 hub 区域 */
.music-cd__hub {
  position: absolute; inset: 0;
  display: flex; align-items: center; justify-content: center; z-index: 2;
}
.music-cd__hub-ring {
  position: absolute; width: 34rpx; height: 34rpx; border-radius: 50%;
  /* 珍珠白色 hub */
  background: radial-gradient(circle at 38% 32%,
    #ffffff 0%, #e8eef4 35%, #b8c8d8 65%, #8a9eb0 100%);
  box-shadow:
    0 2rpx 6rpx rgba(0,0,0,.35),
    inset 0 1rpx 3rpx rgba(255,255,255,.8),
    inset 0 -1rpx 2rpx rgba(0,0,0,.2);
}
/* 中心孔：深邃的洞，带内壁反光 */
.music-cd__hole {
  width: 20rpx; height: 20rpx; border-radius: 50%;
  background: radial-gradient(circle at 35% 30%,
    #2a3a48 0%, #0f1923 55%, #060e14 100%);
  box-shadow:
    inset 0 2rpx 4rpx rgba(0,0,0,.9),
    inset 0 -1rpx 2rpx rgba(255,255,255,.08);
  display: flex; align-items: center; justify-content: center;
  overflow: hidden; z-index: 1;
}
.music-cd__hole-cover { width: 20rpx; height: 20rpx; border-radius: 50%; }
.music-cd__hole-note  { font-size: 10rpx; color: rgba(200,220,255,.5); }

/* 播放中绿点：改为音符形状的彩色圆点 */
.music-cd__dot {
  position: absolute; top: 5rpx; right: 5rpx;
  width: 20rpx; height: 20rpx; border-radius: 50%;
  background: radial-gradient(circle at 38% 35%, #86efac, #22c55e 50%, #15803d);
  border: 2.5rpx solid rgba(255,255,255,.95);
  box-shadow:
    0 2rpx 8rpx rgba(34,197,94,.6),
    0 0 0 3rpx rgba(34,197,94,.2);
  animation: dot-pulse 2s ease-in-out infinite;
}
@keyframes dot-pulse {
  0%,100% { box-shadow: 0 2rpx 8rpx rgba(34,197,94,.6), 0 0 0 3rpx rgba(34,197,94,.2); }
  50%     { box-shadow: 0 2rpx 12rpx rgba(34,197,94,.8), 0 0 0 6rpx rgba(34,197,94,.1); }
}

/* ══════════════════════════════════════════
   展开态
══════════════════════════════════════════ */
.music-wrap {
  position: fixed;
  left: 16rpx; right: 16rpx;
  z-index: 998;
  display: flex; flex-direction: column; gap: 12rpx;
}

/* ── 歌单面板 ──────────────────────────── */
.music-list {
  background: rgba(255,255,255,0.96);
  backdrop-filter: blur(24px); -webkit-backdrop-filter: blur(24px);
  border: 1rpx solid rgba(255,255,255,0.9);
  border-radius: 24rpx;
  box-shadow: 0 8rpx 40rpx rgba(0,0,0,.16);
  overflow: hidden;
}
.music-list__header {
  display: flex; align-items: center;
  padding: 24rpx 28rpx 16rpx; gap: 12rpx;
}
.music-list__title  { font-size: 28rpx; font-weight: 700; color: #1e293b; flex: 1; }
.music-list__count  { font-size: 22rpx; color: #94a3b8; }
.music-list__close  {
  width: 48rpx; height: 48rpx; border-radius: 50%;
  background: #f1f5f9;
  display: flex; align-items: center; justify-content: center;
}
.music-list__close-icon { font-size: 22rpx; color: #64748b; }
.music-list__scroll { max-height: 520rpx; }

.music-list__item {
  display: flex; align-items: center;
  padding: 18rpx 28rpx; gap: 20rpx;
}
.music-list__item:active         { background: #f1f5f9; }
.music-list__item--active        { background: #eff6ff; }
.music-list__item-num {
  width: 36rpx; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
}
.music-list__num-text { font-size: 22rpx; color: #94a3b8; }
.music-list__playing  {
  display: flex; align-items: flex-end; gap: 3rpx; height: 28rpx;
}
.music-list__bar {
  width: 5rpx; border-radius: 3rpx; background: #2563eb;
  animation: bar-jump .6s ease-in-out infinite alternate;
}
.music-list__bar:nth-child(1) { height: 16rpx; }
.music-list__bar:nth-child(2) { height: 28rpx; }
.music-list__bar:nth-child(3) { height: 20rpx; }
@keyframes bar-jump {
  from { transform: scaleY(.4); }
  to   { transform: scaleY(1); }
}
.music-list__item-info {
  flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 4rpx;
}
.music-list__item-title {
  font-size: 26rpx; font-weight: 500; color: #1e293b;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.music-list__item--active .music-list__item-title { color: #2563eb; font-weight: 600; }
.music-list__item-artist {
  font-size: 20rpx; color: #94a3b8;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}

/* ── 迷你播放条 ────────────────────────── */
.music-bar {
  height: 100rpx; border-radius: 20rpx;
  background: rgba(255,255,255,0.88);
  backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
  border: 1rpx solid rgba(255,255,255,0.9);
  box-shadow: 0 8rpx 32rpx rgba(0,0,0,.12), 0 2rpx 8rpx rgba(0,0,0,.06);
  display: flex; align-items: center;
  padding: 0 12rpx; gap: 10rpx;
}
.music-bar__disc {
  width: 68rpx; height: 68rpx; flex-shrink: 0; border-radius: 50%;
  background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
  border: 3rpx solid rgba(255,255,255,.5);
  display: flex; align-items: center; justify-content: center;
  overflow: hidden; box-shadow: 0 2rpx 8rpx rgba(0,0,0,.2);
}
.music-bar__disc--spin { animation: disc-spin 6s linear infinite; }
@keyframes disc-spin {
  from { transform: rotate(0deg); }
  to   { transform: rotate(360deg); }
}
.music-bar__cover  { width: 68rpx; height: 68rpx; border-radius: 50%; }
.music-bar__note   { font-size: 28rpx; color: rgba(255,255,255,.8); }
.music-bar__info   {
  flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 4rpx;
}
.music-bar__title-wrap { overflow: hidden; }
.music-bar__title {
  font-size: 26rpx; font-weight: 600; color: #1e293b; white-space: nowrap;
}
.music-bar__title--scroll {
  display: inline-block;
  animation: title-scroll 8s linear infinite;
}
@keyframes title-scroll {
  0%,30% { transform: translateX(0); }
  70%    { transform: translateX(-60%); }
  100%   { transform: translateX(0); }
}
.music-bar__artist {
  font-size: 20rpx; color: #64748b;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.music-bar__controls {
  display: flex; align-items: center; gap: 0; flex-shrink: 0;
}

/* ── 控制按钮 ── */
.ctrl-btn {
  width: 54rpx; height: 54rpx; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  opacity: 1;
  &:active { opacity: .5; }
}
.ctrl-btn--play {
  width: 72rpx; height: 72rpx;
  background: linear-gradient(145deg, #1e293b 0%, #334155 100%);
  box-shadow: 0 4rpx 16rpx rgba(0,0,0,.28), 0 1rpx 4rpx rgba(0,0,0,.16);
  margin: 0 6rpx;
  flex-shrink: 0;
}
.ctrl-icon {
  font-size: 34rpx; color: #64748b; line-height: 1;
}
.ctrl-icon--play {
  font-size: 30rpx; color: #fff;
}
</style>
