<template>
  <view v-if="visible" class="token-mask" @click.self="close">
    <view class="token-modal">
      <text class="token-modal__title">⚙️ 设置 GitHub Token</text>
      <text v-if="rateLimitMsg" class="token-modal__warn">{{ rateLimitMsg }}</text>
      <text class="token-modal__desc">
        Token 仅保存在本机，不会上传。设置后 API 限额从 60次/小时 提升至 5000次/小时。
      </text>
      <input
        class="token-modal__input"
        v-model="tokenInput"
        placeholder="ghp_xxxxxxxxxxxxxxxx"
        :password="true"
        placeholder-style="color:#94a3b8" />
      <text class="token-modal__tip">
        GitHub → Settings → Developer settings → Personal access tokens → 勾选 <text style="color:#dc2626;font-weight:700">public_repo</text> 权限后生成
      </text>
      <view class="token-modal__btns">
        <view class="token-btn token-btn--cancel" @click="close">
          <text>取消</text>
        </view>
        <view class="token-btn token-btn--clear" @click="clearToken">
          <text>清除</text>
        </view>
        <view class="token-btn token-btn--save" @click="saveToken">
          <text>{{ saving ? '验证中…' : '保存' }}</text>
        </view>
      </view>
      <text v-if="statusMsg" class="token-modal__status" :style="{ color: statusColor }">{{ statusMsg }}</text>
    </view>
  </view>
</template>

<script>
import api from '../utils/api.js'

export default {
  name: 'TokenModal',
  data() {
    return {
      visible:       false,
      tokenInput:    '',
      rateLimitMsg:  '',
      statusMsg:     '',
      statusColor:   '#64748b',
      saving:        false,
    }
  },
  mounted() {
    uni.$on('showTokenModal', (msg) => {
      this.tokenInput   = api.getToken() || ''
      this.statusMsg    = ''
      this.rateLimitMsg = msg || ''
      this.visible      = true
    })
  },
  beforeDestroy() {
    uni.$off('showTokenModal')
  },
  methods: {
    close() {
      if (this.saving) return
      this.visible      = false
      this.rateLimitMsg = ''
    },
    clearToken() {
      api.setToken('')
      this.tokenInput = ''
      this.statusMsg  = '✅ Token 已清除，恢复匿名模式（60次/小时）'
      this.statusColor = '#64748b'
      setTimeout(() => this.close(), 1500)
    },
    async saveToken() {
      const token = this.tokenInput.trim()
      if (!token) { this.clearToken(); return }
      this.saving    = true
      this.statusMsg = '验证中…'
      this.statusColor = '#64748b'
      try {
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
          // 检查 token 是否有 public_repo 权限
          const scopes = (res.header['x-oauth-scopes'] || res.header['X-OAuth-Scopes'] || '').split(',').map(s => s.trim())
          const hasWrite = scopes.includes('public_repo') || scopes.includes('repo')
          api.setToken(token)
          if (hasWrite) {
            this.statusMsg   = `✅ 验证成功！@${res.data.login}（含写入权限）`
            this.statusColor = '#16a34a'
            setTimeout(() => this.close(), 1500)
          } else {
            this.statusMsg   = `⚠️ Token 已保存，但缺少 public_repo 权限，无法发布文章或上传图片。\n请重新生成并勾选 public_repo。`
            this.statusColor = '#d97706'
          }
        } else {
          this.statusMsg  = '❌ Token 无效，请检查是否填写正确'
          this.statusColor = '#dc2626'
        }
      } catch {
        this.statusMsg  = '❌ 网络错误，请重试'
        this.statusColor = '#dc2626'
      } finally {
        this.saving = false
      }
    },
  },
}
</script>

<style lang="scss" scoped>
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
.token-modal__title { font-size: 34rpx; font-weight: 800; color: #1e293b; }
.token-modal__warn  {
  font-size: 24rpx; color: #854d0e; background: #fef9c3;
  border-radius: 8rpx; padding: 14rpx 18rpx; line-height: 1.6;
}
.token-modal__desc  { font-size: 24rpx; color: #64748b; line-height: 1.7; }
.token-modal__input {
  border: 2rpx solid #e2e8f0; border-radius: 12rpx;
  padding: 22rpx 24rpx; font-size: 26rpx; color: #1e293b;
  background: #f8fafc;
}
.token-modal__tip   { font-size: 22rpx; color: #94a3b8; line-height: 1.6; }
.token-modal__btns  {
  display: flex; flex-direction: row; gap: 16rpx; justify-content: flex-end;
}
.token-btn {
  padding: 18rpx 32rpx; border-radius: 12rpx;
  display: flex; align-items: center; justify-content: center;
}
.token-btn text          { font-size: 28rpx; font-weight: 600; }
.token-btn--cancel,
.token-btn--clear        { background: #f1f5f9; }
.token-btn--cancel text  { color: #475569; }
.token-btn--clear text   { color: #94a3b8; }
.token-btn--save         { background: #2563eb; }
.token-btn--save text    { color: #fff; }
.token-modal__status     { font-size: 24rpx; text-align: center; }
</style>
