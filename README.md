# Z-BLOG

> 基于 GitHub Issues 驱动的个人博客系统，无需服务器，零成本部署。

PC 端通过 GitHub Pages 静态托管，移动端基于 UniApp 构建，支持 H5 访问与 Android APK 打包。所有文章内容均存储在 GitHub Issues 中，创建 Issue 即发布文章。

---

## 功能特性

### PC 端
- 原生 JS 单页应用（SPA），Hash 路由，无需构建工具
- 文章列表、分类筛选、全文搜索
- Markdown 渲染 + 代码高亮（highlight.js，自动跟随主题）
- 视频内嵌播放：自动识别 YouTube、Bilibili、mp4 直链
- 侧边栏展示 GitHub 个人信息（头像、简介、Stars / Forks）
- 照片墙：集成在主 SPA 中（`#/photos`），支持年月筛选、灯箱预览
- 暗黑模式：右上角一键切换，跟随系统偏好，刷新不闪烁
- 主题色选择器：12 套预设色 + 自定义拾色器，设置持久化
- 网站备案信息（ICP / 公安网备）显示在 footer，源码控制不可篡改
- 站点运行时长 & 不蒜子访客 / 浏览统计

### 移动端（UniApp）
- 支持编译为 H5 和 Android APK
- 启动动画页（Logo 弹入 + 文字渐现）
- 首页左侧抽屉导航 + 底部 Tab 栏（首页 / 照片墙 / 分类 / 我的）
- 下拉刷新 + 上拉无限加载
- 个人主页展示 GitHub 账号信息

### 内容管理
- GitHub Issues 作为文章数据库，无需后端
- Issue Label 对应文章分类，支持自定义颜色
- 每篇文章可附加多个主题标签（非分类 Label），列表页和详情页均显示
- 触发 API 频率限制时自动弹窗引导设置 Token

---

## 目录结构

```
Z-BLOG/
├── index.html              # PC 端主页（含照片墙 SPA）
├── config.js               # 博客配置文件（必改）
├── css/
│   └── style.css           # PC 端样式
├── js/
│   ├── api.js              # GitHub API 封装
│   ├── render.js           # 渲染函数（卡片、详情、视频）
│   ├── app.js              # PC 端主逻辑（路由、列表、搜索、照片墙、主题）
│   └── photos.js           # 照片墙独立逻辑（备用参考）
├── .github/
│   └── workflows/
│       └── deploy.yml      # GitHub Actions 自动部署
└── uniapp-zblog/           # UniApp 移动端项目
    ├── config.js           # 移动端配置（与根目录 config.js 同步修改）
    ├── pages/
    │   ├── splash/         # 启动动画页
    │   ├── index/          # 首页（文章列表 + 抽屉菜单）
    │   ├── detail/         # 文章详情页
    │   ├── photos/         # 照片墙
    │   ├── category/       # 分类页
    │   └── profile/        # 我的（个人信息 + 设置）
    ├── components/
    │   ├── PostCard.vue    # 文章卡片组件
    │   ├── TabBar.vue      # 底部导航组件
    │   └── TokenModal.vue  # Token 设置弹窗组件
    └── utils/
        ├── api.js          # GitHub API 封装（UniApp 版）
        └── helper.js       # 工具函数（视频解析、缩略图等）
```

---

## 快速开始

### 第一步：Fork 或克隆本仓库

```bash
git clone https://github.com/your-username/Z-BLOG.git
cd Z-BLOG
```

### 第二步：修改配置文件

编辑根目录 `config.js`，填写必要信息：

```js
const CONFIG = {
  // ===== 必填 =====
  owner: 'your-username',   // GitHub 用户名
  repo:  'Z-BLOG',          // 仓库名称

  // ===== 博客信息 =====
  siteTitle:  '我的博客',
  siteDesc:   '基于 GitHub Issues 的个人博客',
  siteAuthor: '你的名字',
  siteAvatar: '',           // 头像 URL，留空则使用 GitHub 头像

  // ===== 分页 =====
  postsPerPage: 10,

  // ===== 分类（需在 GitHub 仓库中创建同名 Label）=====
  categories: [
    { label: 'article', name: '文章', color: '#28a745', desc: '长篇文章与教程' },
    { label: 'image',   name: '图片', color: '#0969da', desc: '图片与摄影作品' },
    { label: 'video',   name: '视频', color: '#d73a49', desc: '视频内容' },
    { label: 'note',    name: '笔记', color: '#6f42c1', desc: '随记与短笔记' },
    { label: 'link',    name: '链接', color: '#e36209', desc: '收藏的链接' },
    { label: 'music',   name: '音乐', color: '#ec4899', desc: '音乐歌单' },
  ],

  // ===== 备案信息（留空则不显示）=====
  beian: {
    icp:        '',   // 如：粤ICP备12345678号
    police:     '',   // 如：粤公网安备 44010602012345号
    policeCode: '',   // 如：44010602012345（纯数字，用于生成官方跳转链接）
  },

  // ===== 缓存时长（毫秒）=====
  cacheDuration: 5 * 60 * 1000,
};
```

> 同步修改 `uniapp-zblog/config.js`，内容保持一致。

### 第三步：在 GitHub 仓库创建 Labels

进入仓库 → **Issues** → **Labels** → 新建以下标签（名称与 `config.js` 中 `label` 字段一致）：

| Label 名称 | 颜色建议   | 说明     |
|-----------|-----------|--------|
| `article` | `#28a745` | 文章     |
| `image`   | `#0969da` | 图片/照片 |
| `video`   | `#d73a49` | 视频     |
| `note`    | `#6f42c1` | 笔记     |
| `link`    | `#e36209` | 链接收藏  |
| `music`   | `#ec4899` | 音乐歌单  |

> Label 颜色会自动同步到博客标签显示色。

### 第四步：开启 GitHub Pages 自动部署

1. 进入仓库 → **Settings** → **Pages**
2. Source 选择 **GitHub Actions**
3. 推送代码到 `main` 分支，Actions 会自动部署

部署完成后访问：`https://your-username.github.io/Z-BLOG`

---

## 发布文章

1. 进入 GitHub 仓库 → **Issues** → **New issue**
2. 填写标题（文章标题）和内容（支持 Markdown）
3. 右侧 **Labels** 选择对应分类
4. 点击 **Submit new issue** 即发布

> 修改或关闭 Issue 后，博客会通过 GitHub Actions 在几十秒内自动更新。

### 各分类发布技巧

**图片（`image`）**
- 正文直接粘贴图片或 `![描述](图片URL)`
- 照片墙（`#/photos`）自动提取每篇 issue 中的全部图片

**视频（`video`）**
- YouTube：粘贴 `https://www.youtube.com/watch?v=xxxxx`
- Bilibili：粘贴 `https://www.bilibili.com/video/BVxxxxx`
- 直链 mp4：粘贴 `https://example.com/video.mp4`
- 系统自动渲染为内嵌播放器

**链接（`link`）**
- 正文中粘贴 URL，页面以卡片形式展示

---

## 外观定制

### 暗黑模式

点击导航栏右上角 **月亮/太阳图标** 手动切换亮/暗模式。

- 优先使用手动设置，未设置时跟随系统偏好
- 偏好保存至 `localStorage`，刷新页面不闪烁
- 暗黑配色参考 IntelliJ IDEA Darcula 主题

### 主题色

点击导航栏右上角 **彩色圆环图标** 打开主题色面板：

- 12 套预设色（蓝 / 靛 / 紫 / 品 / 粉 / 玫 / 橙 / 琥珀 / 绿 / 青 / 湖 / 天蓝）
- 自定义拾色器：支持选择任意颜色
- 重置：一键恢复默认蓝 `#2563eb`
- 颜色设置持久化到 `localStorage`

---

## 备案信息

在 `config.js` 的 `beian` 字段填写备案号：

```js
beian: {
  icp:        '粤ICP备12345678号',
  police:     '粤公网安备 44010602012345号',
  policeCode: '44010602012345',
},
```

- 填写后自动在 footer 底部显示，附带官方跳转链接
- 留空则对应项不显示
- 备案信息存储在源码中，访客无法修改

---

## GitHub Token 设置

不设置 Token 也可正常使用，但 API 限制为 **60 次/小时**，设置后提升至 **5000 次/小时**。

**PC 端**：点击页面底部 **Token** 链接 → 输入保存

**移动端**：「我的」页面 → 设置 → 设置 GitHub Token

**生成 Token**：
1. GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Generate new token → 勾选 `public_repo`
3. 复制生成的 Token（以 `ghp_` 开头）

> Token 仅保存在本地设备（localStorage / App 本地存储），不上传至任何服务器。

---

## 移动端开发与打包

### 环境要求

- [HBuilderX](https://www.dcloud.io/hbuilderx.html)（推荐最新版）

### 本地运行（H5）

1. 用 HBuilderX 打开 `uniapp-zblog/` 目录
2. 「运行」→「运行到浏览器」→「Chrome」

### 打包 Android APK

1. HBuilderX → **发行** → **原生 App 云打包**
2. 选择 Android，填写包名（如 `com.yourname.zblog`）
3. 证书可选「公共测试证书」快速出包
4. 等待打包完成，下载 APK 安装

---

## 技术栈

| 端       | 技术                                       |
|---------|------------------------------------------|
| PC 前端   | 原生 HTML / CSS / JavaScript（无框架，无构建工具）  |
| 移动端     | UniApp + Vue 2                           |
| 内容存储    | GitHub Issues                            |
| 数据接口    | GitHub REST API v3                       |
| 部署      | GitHub Actions + GitHub Pages            |
| Markdown | marked.js                                |
| 代码高亮    | highlight.js（亮/暗双主题自动切换）                |
| 访客统计    | 不蒜子                                      |
| 图片压缩代理  | wsrv.nl                                  |

---

## 参考与致谢

- 灵感来源：[Gmeek](https://github.com/Meekdai/Gmeek)
- GitHub Issues API：[官方文档](https://docs.github.com/en/rest/issues)
- UniApp：[官方文档](https://uniapp.dcloud.net.cn/)

---

## License

[MIT](LICENSE) © 2025 Z-BLOG
