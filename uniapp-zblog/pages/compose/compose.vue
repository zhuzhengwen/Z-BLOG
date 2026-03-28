<template>
  <view class="page">

    <!-- 顶部导航 -->
    <view class="nav" :style="{ paddingTop: statusBarHeight + 'px' }">
      <view class="nav__inner">
        <view class="nav__btn" @click="goBack">
          <text class="nav__btn-text">取消</text>
        </view>
        <text class="nav__title">写文章</text>
        <view class="nav__btn nav__btn--primary" :class="{ 'nav__btn--disabled': submitting || !canSubmit }" @click="submit">
          <text class="nav__btn-text">{{ submitting ? '发布中…' : '发布' }}</text>
        </view>
      </view>
    </view>

    <scroll-view scroll-y class="body">

      <!-- 标题 -->
      <view class="field">
        <input
          class="title-input"
          v-model="title"
          placeholder="文章标题（必填）"
          placeholder-class="placeholder"
          maxlength="200"
          :disabled="submitting" />
      </view>

      <view class="divider"></view>

      <!-- 分类选择 -->
      <view class="field field--row">
        <text class="field__label">分类</text>
        <picker :value="catIndex" :range="catNames" @change="onCatChange">
          <view class="picker-val">
            <text class="picker-val__text">{{ catNames[catIndex] }}</text>
            <text class="picker-val__arrow">›</text>
          </view>
        </picker>
      </view>

      <view class="divider"></view>

      <!-- Tab: 编辑 / 预览 -->
      <view class="tabs">
        <view class="tab" :class="{ 'tab--active': tab === 'edit' }" @click="tab = 'edit'">
          <text>编辑</text>
        </view>
        <view class="tab" :class="{ 'tab--active': tab === 'preview' }" @click="tab = 'preview'">
          <text>预览</text>
        </view>
      </view>

      <!-- 正文编辑 -->
      <view v-if="tab === 'edit'" class="field">
        <textarea
          class="body-input"
          v-model="body"
          placeholder="支持 Markdown 格式…&#10;&#10;**加粗** *斜体* `代码`&#10;## 标题&#10;- 列表项"
          placeholder-class="placeholder"
          :disabled="submitting"
          :auto-height="false"
          fixed
          @input="onBodyInput" />
        <view class="word-count">
          <text>{{ body.length }} 字</text>
        </view>
      </view>

      <!-- 已上传图片预览条 -->
      <view v-if="tab === 'edit' && uploadedImages.length" class="img-strip">
        <view v-for="(img, i) in uploadedImages" :key="i" class="img-strip__item">
          <image :src="img.local" mode="aspectFill" class="img-strip__thumb"></image>
          <view v-if="img.uploading" class="img-strip__mask">
            <text class="img-strip__progress">{{ img.progress }}%</text>
          </view>
          <view v-else-if="img.error" class="img-strip__mask img-strip__mask--error">
            <text class="img-strip__err">✕</text>
          </view>
          <view v-else class="img-strip__done">
            <text>✓</text>
          </view>
        </view>
      </view>

      <!-- Markdown 预览 -->
      <view v-else class="preview">
        <view v-if="!body" class="preview__empty">
          <text>暂无内容可预览</text>
        </view>
        <rich-text v-else :nodes="previewHtml" class="preview__content"></rich-text>
      </view>

      <!-- Markdown 快捷工具栏 -->
      <view v-if="tab === 'edit'" class="toolbar">
        <view class="toolbar__item" @click="insert('**', '**', '粗体')"><text>B</text></view>
        <view class="toolbar__item toolbar__item--italic" @click="insert('*', '*', '斜体')"><text>I</text></view>
        <view class="toolbar__item" @click="insert('`', '`', '代码')"><text>&lt;/&gt;</text></view>
        <view class="toolbar__item" @click="insertLine('## ')"><text>H</text></view>
        <view class="toolbar__item" @click="insertLine('- ')"><text>•</text></view>
        <view class="toolbar__item" @click="insertLine('> ')"><text>"</text></view>
        <view class="toolbar__item" @click="insert('[', '](url)', '链接文字')"><text>🔗</text></view>
        <view class="toolbar__item toolbar__item--img" @click="pickImage"><text>📷</text></view>
        <view class="toolbar__item toolbar__item--divider"></view>
        <view class="toolbar__item" @click="insertLine('---')"><text>—</text></view>
      </view>

    </scroll-view>

    <!-- 无 Token 提示 -->
    <view v-if="!hasToken" class="no-token-tip">
      <text class="no-token-tip__text">⚠️ 请先在「我的」页面设置 GitHub Token 才能发布文章</text>
      <view class="no-token-tip__btn" @click="goProfile">
        <text>去设置</text>
      </view>
    </view>

    <token-modal></token-modal>
  </view>
</template>

<script>
import TokenModal from '../../components/TokenModal.vue'
import api from '../../utils/api.js'
import CONFIG from '../../config.js'

function simpleMarkdown(md) {
  if (!md) return ''
  return md
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/^#{3}\s+(.+)$/gm, '<h3>$1</h3>')
    .replace(/^#{2}\s+(.+)$/gm, '<h2>$1</h2>')
    .replace(/^#{1}\s+(.+)$/gm, '<h1>$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`(.+?)`/g, '<code>$1</code>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" style="max-width:100%">')
    .replace(/^-\s+(.+)$/gm, '<li>$1</li>')
    .replace(/^>\s+(.+)$/gm, '<blockquote>$1</blockquote>')
    .replace(/^---$/gm, '<hr>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/^(?!<[hlibu]|<block|<hr)(.+)$/gm, '$1')
    .replace(/(<li>.*<\/li>)/gs, '<ul>$1</ul>')
}

export default {
  components: { TokenModal },
  data() {
    return {
      statusBarHeight: 0,
      tab: 'edit',
      title: '',
      body: '',
      catIndex: 0,
      categories: CONFIG.categories,
      submitting: false,
      uploadedImages: [],  // { local, url, uploading, progress, error }
    }
  },
  computed: {
    hasToken() {
      return !!uni.getStorageSync('zblog_user_token')
    },
    catNames() {
      return this.categories.map(c => c.icon + ' ' + c.name)
    },
    canSubmit() {
      return this.title.trim().length > 0 && this.hasToken
    },
    previewHtml() {
      return simpleMarkdown(this.body)
    }
  },
  onLoad() {
    const info = uni.getSystemInfoSync()
    this.statusBarHeight = info.statusBarHeight || 0
  },
  methods: {
    goBack() {
      if (this.title || this.body) {
        uni.showModal({
          title: '放弃编辑？',
          content: '内容将不会保存',
          confirmText: '放弃',
          cancelText: '继续编辑',
          success: (res) => { if (res.confirm) uni.navigateBack() }
        })
      } else {
        uni.navigateBack()
      }
    },
    goProfile() {
      uni.switchTab({ url: '/pages/profile/profile' })
    },
    onCatChange(e) {
      this.catIndex = e.detail.value
    },
    onBodyInput(e) {
      this.body = e.detail.value
    },
    // 选择并上传图片
    pickImage() {
      uni.chooseImage({
        count: 9,
        sizeType: ['compressed'],
        sourceType: ['album', 'camera'],
        success: (res) => {
          res.tempFilePaths.forEach(path => this.uploadOne(path))
        },
        fail: () => {}
      })
    },

    // 用 splice 更新数组项，确保 Vue2 响应式触发
    _setImg(idx, patch) {
      const item = Object.assign({}, this.uploadedImages[idx], patch)
      this.uploadedImages.splice(idx, 1, item)
    },

    uploadOne(localPath) {
      const idx = this.uploadedImages.length
      this.uploadedImages.push({ local: localPath, url: '', uploading: true, progress: 0, error: false })

      uni.getFileSystemManager().readFile({
        filePath: localPath,
        encoding: 'base64',
        success: async (r) => {
          this._setImg(idx, { progress: 30 })
          const ext = localPath.split('.').pop().split('?')[0].toLowerCase() || 'jpg'
          const filename = `${Date.now()}_${idx}.${ext}`
          try {
            this._setImg(idx, { progress: 60 })
            const url = await api.uploadImage(r.data, filename)
            this._setImg(idx, { url, uploading: false, progress: 100 })
            this.body += (this.body && !this.body.endsWith('\n') ? '\n' : '') + `![图片](${url})\n`
            uni.showToast({ title: '上传成功', icon: 'success', duration: 1500 })
          } catch (e) {
            this._setImg(idx, { uploading: false, error: true })
            uni.showToast({ title: e.message || '上传失败', icon: 'none', duration: 3000 })
          }
        },
        fail: () => {
          this._setImg(idx, { uploading: false, error: true })
          uni.showToast({ title: '读取图片失败', icon: 'none' })
        }
      })
    },

    // 插入包裹符号
    insert(before, after, placeholder) {
      const pos = this.body.length
      this.body += `${before}${placeholder}${after}`
    },
    // 插入行前缀
    insertLine(prefix) {
      this.body += (this.body && !this.body.endsWith('\n') ? '\n' : '') + prefix
    },
    async submit() {
      if (!this.canSubmit || this.submitting) return
      const title = this.title.trim()
      if (!title) {
        uni.showToast({ title: '请输入标题', icon: 'none' }); return
      }
      if (!this.hasToken) {
        uni.$emit('showTokenModal'); return
      }
      this.submitting = true
      try {
        const cat = this.categories[this.catIndex]
        const issue = await api.createIssue({
          title,
          body: this.body,
          labels: [cat.label],
        })
        uni.showToast({ title: '发布成功！', icon: 'success', duration: 2000 })
        setTimeout(() => {
          uni.navigateBack()
          // 通知首页刷新
          uni.$emit('refreshPosts')
        }, 1500)
      } catch (e) {
        uni.showToast({ title: e.message || '发布失败', icon: 'none', duration: 3000 })
      } finally {
        this.submitting = false
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.page {
  background: #fff;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

/* ── 顶部导航 ── */
.nav {
  background: #fff;
  border-bottom: 1rpx solid #f1f5f9;
  position: sticky;
  top: 0;
  z-index: 10;
}
.nav__inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 28rpx;
  height: 88rpx;
}
.nav__title {
  font-size: 32rpx;
  font-weight: 600;
  color: #1e293b;
}
.nav__btn {
  padding: 12rpx 24rpx;
  border-radius: 40rpx;
}
.nav__btn-text {
  font-size: 28rpx;
  color: #64748b;
}
.nav__btn--primary {
  background: #2563eb;
  .nav__btn-text { color: #fff; font-weight: 600; }
}
.nav__btn--disabled {
  background: #cbd5e1;
  .nav__btn-text { color: #fff; }
}

/* ── 主体 ── */
.body {
  flex: 1;
  height: 0;
}

.field {
  padding: 24rpx 28rpx;
}
.field--row {
  display: flex;
  align-items: center;
  padding: 20rpx 28rpx;
}
.field__label {
  font-size: 28rpx;
  color: #64748b;
  width: 80rpx;
  flex-shrink: 0;
}
.divider {
  height: 1rpx;
  background: #f1f5f9;
  margin: 0 28rpx;
}

/* ── 标题输入 ── */
.title-input {
  font-size: 36rpx;
  font-weight: 600;
  color: #1e293b;
  width: 100%;
  line-height: 1.4;
}

/* ── 分类选择器 ── */
.picker-val {
  display: flex;
  align-items: center;
  gap: 8rpx;
}
.picker-val__text {
  font-size: 28rpx;
  color: #1e293b;
}
.picker-val__arrow {
  font-size: 36rpx;
  color: #94a3b8;
  line-height: 1;
}

/* ── Tab ── */
.tabs {
  display: flex;
  border-bottom: 1rpx solid #f1f5f9;
  padding: 0 28rpx;
}
.tab {
  padding: 20rpx 32rpx 16rpx;
  font-size: 28rpx;
  color: #94a3b8;
  border-bottom: 3rpx solid transparent;
  margin-bottom: -1rpx;
  text { font-size: 28rpx; }
}
.tab--active {
  color: #2563eb;
  border-bottom-color: #2563eb;
  font-weight: 600;
}

/* ── 正文 textarea ── */
.body-input {
  width: 100%;
  min-height: 700rpx;
  font-size: 28rpx;
  color: #334155;
  line-height: 1.8;
}
.word-count {
  text-align: right;
  padding-top: 12rpx;
  text { font-size: 22rpx; color: #cbd5e1; }
}

/* ── 预览 ── */
.preview {
  min-height: 600rpx;
  padding: 24rpx 28rpx;
}
.preview__empty {
  text-align: center;
  padding: 80rpx 0;
  text { font-size: 28rpx; color: #cbd5e1; }
}
.preview__content {
  font-size: 28rpx;
  color: #334155;
  line-height: 1.9;
}

/* ── Markdown 工具栏 ── */
.toolbar {
  position: sticky;
  bottom: 0;
  background: #f8fafc;
  border-top: 1rpx solid #e2e8f0;
  display: flex;
  align-items: center;
  padding: 0 12rpx;
  height: 88rpx;
  gap: 4rpx;
}
.toolbar__item {
  width: 72rpx;
  height: 64rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8rpx;
  text { font-size: 26rpx; color: #475569; font-weight: 600; }
  &:active { background: #e2e8f0; }
}
.toolbar__item--italic text { font-style: italic; }
.toolbar__item--divider {
  width: 1rpx;
  background: #e2e8f0;
  height: 40rpx;
  margin: 0 8rpx;
}

/* ── 已上传图片预览条 ── */
.img-strip {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  gap: 12rpx;
  padding: 0 28rpx 20rpx;
}
.img-strip__item {
  width: 160rpx; height: 160rpx;
  border-radius: 12rpx;
  overflow: hidden;
  position: relative;
  background: #f1f5f9;
}
.img-strip__thumb {
  width: 100%; height: 100%;
}
.img-strip__mask {
  position: absolute; inset: 0;
  background: rgba(0,0,0,.45);
  display: flex; align-items: center; justify-content: center;
}
.img-strip__mask--error { background: rgba(220,38,38,.55); }
.img-strip__progress {
  font-size: 26rpx; color: #fff; font-weight: 700;
}
.img-strip__err { font-size: 36rpx; color: #fff; }
.img-strip__done {
  position: absolute; bottom: 8rpx; right: 8rpx;
  background: #22c55e; border-radius: 50%;
  width: 36rpx; height: 36rpx;
  display: flex; align-items: center; justify-content: center;
  text { font-size: 22rpx; color: #fff; }
}

/* ── placeholder ── */
.placeholder { color: #cbd5e1; }

/* ── 无 Token 提示 ── */
.no-token-tip {
  position: fixed;
  bottom: 0; left: 0; right: 0;
  background: #fffbeb;
  border-top: 1rpx solid #fcd34d;
  padding: 24rpx 28rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16rpx;
}
.no-token-tip__text {
  font-size: 24rpx;
  color: #92400e;
  flex: 1;
  line-height: 1.5;
}
.no-token-tip__btn {
  background: #f59e0b;
  border-radius: 30rpx;
  padding: 10rpx 28rpx;
  text { font-size: 24rpx; color: #fff; font-weight: 600; }
}
</style>
