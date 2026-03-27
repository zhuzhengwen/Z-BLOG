# 📝 Z-BLOG

> 基于 GitHub Issues 驱动的个人博客系统，无需服务器，零成本部署。

**PC 端**通过 GitHub Pages 静态托管，**移动端**基于 UniApp 构建，支持 H5 访问与 Android APK 打包。所有文章内容均存储在 GitHub Issues 中，创建 Issue 即发布文章。

---

## ✨ 功能特性

### 内容管理
- 📝 以 GitHub Issues 作为文章数据库，无需后端
- 🏷️ 通过 Issue Label 实现文章分类（文章 / 图片 / 视频 / 笔记 / 链接）
- 🔍 支持全文搜索（调用 GitHub Search API）
- 📄 Markdown 全量渲染，支持代码高亮

### PC 端
- 响应式布局，适配桌面与平板
- 侧边栏展示 GitHub 个人信息（头像、简介、Stars/Forks）
- 🖼️ 照片墙：瀑布流展示所有 image 分类图片，支持灯箱预览
- 🎬 视频内嵌播放：自动识别 YouTube、Bilibili、mp4 直链
- 列表卡片右侧缩略图预览
- 深色模式自动适配（跟随系统）
- 站点运行时间 & 不蒜子访客统计

### 移动端（UniApp）
- 支持编译为 **H5** 和 **Android APK**
- 启动动画页面（Logo 弹入 + 文字渐现 + 加载点）
- 首页左侧抽屉导航，汉堡菜单收起/展开
- 底部自定义 Tab 栏（首页 / 照片墙 / 分类 / 我的）
- 下拉刷新 + 上拉无限加载
- 个人主页展示 GitHub 账号信息
- API 频率限制时自动弹出 Token 设置弹窗

### Token 管理
- Token 仅保存在本地（浏览器 localStorage / App 本地存储），不上传
- 匿名访问：60 次/小时；设置 Token 后：5000 次/小时
- 触发频率限制时自动弹窗引导设置
- PC 端底部 ⚙️ Token 入口；App 端「我的」页面可手动管理

---

## 🗂️ 目录结构

```
Z-BLOG/
├── index.html              # PC 端主页
├── mobile.html             # 移动端 H5 跳转页
├── photos.html             # 照片墙页面
├── config.js               # 博客配置文件（必改）
├── css/
│   └── style.css           # PC 端样式
├── js/
│   ├── api.js              # GitHub API 封装
│   ├── render.js           # 渲染函数（卡片、详情、视频）
│   └── app.js              # PC 端主逻辑（路由、列表、搜索）
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
    ├── utils/
    │   ├── api.js          # GitHub API 封装（UniApp 版）
    │   └── helper.js       # 工具函数（视频解析、缩略图等）
    └── static/
        ├── logo.svg        # App 图标源文件（1024×1024）
        └── icons/          # 各尺寸 PNG 图标（打包 APK 前生成）
```

---

## 🚀 快速开始

### 第一步：Fork 或克隆本仓库

```bash
git clone https://github.com/your-username/Z-BLOG.git
cd Z-BLOG
```

### 第二步：修改配置文件

编辑根目录下的 `config.js`：

```js
const CONFIG = {
  owner: 'your-username',  // 你的 GitHub 用户名
  repo:  'Z-BLOG',         // 仓库名称
  token: '',               // 可选，建议留空（通过浏览器设置）

  siteTitle:  '我的博客',
  siteDesc:   '基于 GitHub Issues 的个人博客',

  postsPerPage: 10,
  cacheDuration: 5 * 60 * 1000,
};
```

> ⚠️ 同步修改 `uniapp-zblog/config.js`，内容保持一致。

### 第三步：在 GitHub 仓库创建 Labels

进入仓库 → **Issues** → **Labels** → 新建以下标签：

| Label 名称 | 说明 |
|-----------|------|
| `article` | 文章 |
| `image`   | 图片 |
| `video`   | 视频 |
| `note`    | 笔记 |
| `link`    | 链接 |

### 第四步：开启 GitHub Pages 自动部署

1. 进入仓库 → **Settings** → **Pages**
2. Source 选择 **GitHub Actions**
3. 推送代码到 `main` 分支，Actions 会自动部署

部署完成后，访问：`https://your-username.github.io/Z-BLOG`

---

## ✍️ 发布文章

1. 进入 GitHub 仓库，点击 **Issues** → **New issue**
2. 填写标题（文章标题）和内容（支持 Markdown）
3. 右侧 **Labels** 选择对应分类（`article` / `image` / `video` / `note` / `link`）
4. 点击 **Submit new issue** 即发布

### 各分类发布技巧

**图片 (`image`)**
- 正文中直接粘贴图片或使用 `![描述](图片URL)`
- 照片墙会自动提取正文中的第一张图片

**视频 (`video`)**
- 粘贴 YouTube 链接：`https://www.youtube.com/watch?v=xxxxx`
- 粘贴 Bilibili 链接：`https://www.bilibili.com/video/BVxxxxx`
- 粘贴 mp4 直链：`https://example.com/video.mp4`
- 系统会自动渲染为内嵌播放器

**链接 (`link`)**
- 正文中粘贴链接，系统会以卡片形式展示

---

## 📱 移动端开发与打包

### 环境要求

- [HBuilderX](https://www.dcloud.io/hbuilderx.html)（推荐最新版）
- Node.js 16+（可选，用于命令行开发）

### 本地运行（H5）

1. 用 HBuilderX 打开 `uniapp-zblog/` 目录
2. 点击「运行」→「运行到浏览器」→「Chrome」

### 打包 Android APK

#### 1. 生成图标

打开 HBuilderX → manifest.json 可视化界面 → **App 图标** → 选择 `static/logo.svg` → 自动生成所有尺寸

#### 2. 云端打包

1. HBuilderX → 发行 → 原生 App 云打包
2. 选择 Android，填写包名（如 `com.yourname.zblog`）
3. 证书可选「公共测试证书」快速打包
4. 等待打包完成，下载 APK

#### 3. 本地打包（可选）

需配置 Android SDK，详见 [UniApp 离线打包文档](https://nativesupport.dcloud.net.cn/AppDocs/README)

---

## ⚙️ GitHub Token 设置

不设置 Token 也可正常使用，但有 **60 次/小时** 的 API 限制。

### PC 端

点击页面底部 **⚙️ Token** → 输入 Token → 保存

### 移动端

「我的」页面 → 设置 → **🔑 设置 GitHub Token**

### 生成 Token

1. GitHub → Settings → Developer settings
2. Personal access tokens → Tokens (classic)
3. Generate new token → 勾选 `public_repo`
4. 复制生成的 Token（以 `ghp_` 开头）

> Token 仅保存在你的本地设备，不会上传到任何服务器。

---

## 🛠️ 自定义配置

### 修改分类

在 `config.js` 的 `categories` 数组中增删分类，同时在 GitHub 仓库创建同名 Label：

```js
categories: [
  { label: 'article', name: '文章', icon: '📝', color: '#28a745', desc: '长篇文章' },
  { label: 'photo',   name: '摄影', icon: '📷', color: '#0969da', desc: '摄影作品' },
  // 按需添加...
],
```

### 修改站点信息

```js
siteTitle:  '你的博客名称',
siteDesc:   '博客描述',
siteStartDate: '2024-01-01',  // 站点创建日期，用于计算运行时间
```

### 自动重新部署

`.github/workflows/deploy.yml` 已配置：
- **推送代码**到 `main`/`master` 分支时触发
- **Issue 变动**（新建、编辑、关闭、打标签等）时自动触发

即：发布或修改文章后，博客会在几十秒内自动更新。

---

## 📦 技术栈

| 端 | 技术 |
|----|------|
| PC 前端 | 原生 HTML / CSS / JavaScript（无框架） |
| 移动端 | UniApp + Vue 2 |
| 内容存储 | GitHub Issues |
| 数据接口 | GitHub REST API v3 |
| 部署 | GitHub Actions + GitHub Pages |
| Markdown 渲染 | marked.js |
| 代码高亮 | highlight.js |
| 访客统计 | 不蒜子 |

---

## 🤝 参考与致谢

- 灵感来源：[Gmeek](https://github.com/Meekdai/Gmeek)
- GitHub Issues API：[官方文档](https://docs.github.com/en/rest/issues)
- UniApp：[官方文档](https://uniapp.dcloud.net.cn/)

---

## 📄 License

[MIT](LICENSE) © 2024 Z-BLOG
