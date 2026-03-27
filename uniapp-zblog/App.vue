<template>
  <view>
    <!-- 全局 Token 设置弹窗 -->
    <view v-if="tokenModalVisible" class="token-mask" @click.self="closeTokenModal">
      <view class="token-modal">
        <text class="token-modal__title">⚙️ 设置 GitHub Token</text>
        <text class="token-modal__desc">
          Token 仅保存在本机，不会上传。{{ rateLimitMsg ? '\n' + rateLimitMsg : '' }}
          设置后 API 限额从 60次/小时 提升至 5000次/小时。
        </text>
        <input
          class="token-modal__input"
          v-model="tokenInput"
          placeholder="ghp_xxxxxxxxxxxxxxxx"
          password
          placeholder-style="color:#94a3b8" />
        <view class="token-modal__tip">
          GitHub → Settings → Developer settings → Personal access tokens → 勾选 public_repo 生成
        </view>
        <view class="token-modal__btns">
          <view class="token-btn token-btn--cancel" @click="closeTokenModal">
            <text>取消</text>
          </view>
          <view class="token-btn token-btn--clear" @click="clearToken">
            <text>清除</text>
          </view>
          <view class="token-btn token-btn--save" @click="saveToken">
            <text>{{ saving ? '验证中…' : '保存' }}</text>
          </view>
        </view>
        <text v-if="tokenStatus" class="token-modal__status" :style="{ color: tokenStatusColor }">{{ tokenStatus }}</text>
      </view>
    </view>
  </view>
</template>

<script>
import api from './utils/api.js'

export default {
  data() {
    return {
      tokenModalVisible: false,
      tokenInput:        '',
      tokenStatus:       '',
      tokenStatusColor:  '#64748b',
      rateLimitMsg:      '',
      saving:            false,
    }
  },
  onLaunch() {
    uni.$on('showTokenModal', (msg) => {
      this.tokenInput   = api.getToken() || ''
      this.tokenStatus  = ''
      this.rateLimitMsg = msg ? String(msg) : '⚠️ 已触发 API 频率限制，设置 Token 后可继续使用。'
      this.tokenModalVisible = true
    })
  },
  onHide() {},
  methods: {
    closeTokenModal() {
      if (this.saving) return
      this.tokenModalVisible = false
      this.rateLimitMsg = ''
    },

    clearToken() {
      api.setToken('')
      this.tokenInput  = ''
      this.tokenStatus = '✅ Token 已清除，恢复匿名模式（60次/小时）'
      this.tokenStatusColor = '#64748b'
      setTimeout(() => this.closeTokenModal(), 1500)
    },

    async saveToken() {
      const token = this.tokenInput.trim()
      if (!token) { this.clearToken(); return }
      this.saving      = true
      this.tokenStatus = '验证中…'
      this.tokenStatusColor = '#64748b'

      try {
        // 用 uni.request 验证 token
        const res = await new Promise((resolve, reject) => {
          uni.request({
            url: 'https://api.github.com/user',
            header: {
              'Authorization': `token ${token}`,
              'Accept': 'application/vnd.github.v3+json',
            },
            success: resolve,
            fail: reject,
          })
        })
        if (res.statusCode === 200) {
          api.setToken(token)
          this.tokenStatus = `✅ 验证成功！已登录为 @${res.data.login}`
          this.tokenStatusColor = '#16a34a'
          setTimeout(() => this.closeTokenModal(), 1500)
        } else {
          this.tokenStatus = '❌ Token 无效，请检查是否填写正确'
          this.tokenStatusColor = '#dc2626'
        }
      } catch {
        this.tokenStatus = '❌ 网络错误，请重试'
        this.tokenStatusColor = '#dc2626'
      } finally {
        this.saving = false
      }
    },
  },
}
</script>

<style>
/* 全局样式 */
page {
  background-color: #f8fafc;
  font-family: -apple-system, 'PingFang SC', 'Hiragino Sans GB', sans-serif;
  color: #1e293b;
  font-size: 15px;
}
::-webkit-scrollbar { display: none; }

/* #ifdef H5 */
:root {
  --primary:    #2563eb;
  --bg:         #f8fafc;
  --surface:    #ffffff;
  --surface-2:  #f1f5f9;
  --border:     #e2e8f0;
  --text:       #1e293b;
  --text-muted: #64748b;
  --radius:     10px;
}
/* #endif */

/* ── Token 弹窗（全局） ─────────────────────────────── */
.token-mask {
  position: fixed; inset: 0; z-index: 9999;
  background: rgba(0,0,0,.55);
  display: flex; align-items: center; justify-content: center;
}
.token-modal {
  width: 680rpx;
  background: #fff; border-radius: 24rpx;
  padding: 48rpx 40rpx 36rpx;
  display: flex; flex-direction: column; gap: 20rpx;
  box-shadow: 0 24rpx 80rpx rgba(0,0,0,.25);
}
.token-modal__title {
  font-size: 34rpx; font-weight: 800; color: #1e293b;
}
.token-modal__desc {
  font-size: 24rpx; color: #64748b; line-height: 1.7;
}
.token-modal__input {
  border: 2rpx solid #e2e8f0; border-radius: 12rpx;
  padding: 22rpx 24rpx; font-size: 26rpx; color: #1e293b;
  background: #f8fafc;
  font-family: monospace;
}
.token-modal__tip {
  font-size: 22rpx; color: #94a3b8; line-height: 1.6;
}
.token-modal__btns {
  display: flex; flex-direction: row; gap: 16rpx; justify-content: flex-end;
}
.token-btn {
  padding: 18rpx 32rpx; border-radius: 12rpx;
  display: flex; align-items: center; justify-content: center;
}
.token-btn text { font-size: 28rpx; font-weight: 600; }
.token-btn--cancel { background: #f1f5f9; }
.token-btn--cancel text { color: #475569; }
.token-btn--clear  { background: #f1f5f9; }
.token-btn--clear text  { color: #94a3b8; }
.token-btn--save   { background: #2563eb; }
.token-btn--save text   { color: #fff; }
.token-modal__status {
  font-size: 24rpx; text-align: center;
}
</style>
