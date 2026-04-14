# Z-BLOG

> 基于 GitHub Issues 驱动的个人博客系统，无需服务器，零成本部署。

PC 端通过 GitHub Pages 静态托管，移动端基于 UniApp 构建，支持 H5 访问与 Android APK 打包。所有文章内容均存储在 GitHub Issues 中，创建 Issue 即发布文章。

**在线预览**：[zhuzhengwen.github.io/Z-BLOG](https://zhuzhengwen.github.io/Z-BLOG)

---

## 功能特性

### PC 端 / H5
- 原生 JS 单页应用（SPA），Hash 路由，无需构建工具
- 文章列表、分类筛选、全文搜索
- Markdown 渲染 + 代码高亮（highlight.js，自动跟随主题）
- **思考分类**：Ant Design 风格时间线展示，支持年份 / 月份筛选
- 侧边栏展示 GitHub 个人信息（头像、简介、Stars / Forks）
- 照片墙（`#/photos`）：年月筛选、灯箱预览
- 链接收藏（`#/category/link`）：卡片式图标展示
- 背景音乐播放器：支持歌单、上一曲 / 下一曲、CD 浮钮收起态
- 暗黑模式：一键切换，跟随系统偏好，刷新不闪烁
- 主题色选择器：12 套预设色 + 自定义拾色器，设置持久化
- 完全响应式，适配手机 H5 访问，侧滑菜单
- 网站备案信息（ICP / 公安网备）显示在 footer
- 站点运行时长 & 不蒜子访客统计
- 卡片圆角 + 阴影 + 鼠标悬浮优雅动效

### 移动端（UniApp App）
- 支持编译为 H5 和 Android APK
- 启动动画页（Logo 弹入 + 文字渐现）
- 首页左侧抽屉导航 + 底部 Tab 栏（首页 / 照片墙 / 分类 / 我的）
- **思考分类**：时间线样式，年份 / 月份筛选胶囊栏，彩色子标签
- 背景音乐播放器：CD 浮钮 + 迷你播放条，支持歌单面板
- 下拉刷新 + 上拉无限加载
- 个人主页展示 GitHub 账号信息、文章分类统计

### 内容管理
- GitHub Issues 作为文章数据库，无需后端
- Issue Label 对应文章分类，支持自定义颜色
- 每篇文章可附加多个主题标签（非分类 Label），列表页和详情页均显示
- API 无 Token 限额 60 次/小时，足够个人博客日常使用

---

## 目录结构

```
Z-BLOG/
├── index.html              # PC 端主页（SPA）
├── config.js               # 博客配置文件（必改）
├── css/
│   └── style.css           # PC 端样式
├── js/
│   ├── api.js              # GitHub API 封装（含缓存）
│   ├── render.js           # 渲染函数（卡片、详情、时间线）
│   ├── app.js              # PC 端主逻辑（路由、列表、搜索、音乐）
│   ├── music.js            # 背景音乐播放器逻辑
│   └── photos.js           # 照片墙逻辑
├── .github/
│   └── workflows/
│       └── deploy.yml      # GitHub Actions 自动部署
└── uniapp-zblog/           # UniApp 移动端项目
    ├── config.js           # 移动端配置（与根目录 config.js 同步修改）
    ├── pages/
    │   ├── splash/         # 启动动画页
    │   ├── index/          # 首页（文章列表 + 思考时间线 + 抽屉菜单）
    │   ├── detail/         # 文章详情页
    │   ├── photos/         # 照片墙
    │   ├── category/       # 分类 / 链接 / 标签页
    │   └── profile/        # 我的（个人信息）
    ├── components/
    │   ├── PostCard.vue    # 文章卡片组件
    │   ├── TabBar.vue      # 底部导航组件
    │   └── MusicPlayer.vue # 背景音乐播放器组件
    └── utils/
        ├── api.js          # GitHub API 封装（UniApp 版）
        ├── music.js        # 音乐播放状态管理
        ├── theme.js        # 主题色工具
        └── helper.js       # 工具函数（时间、缩略图等）
```

---

## 快速开始

### 第一步：Fork 本仓库

点击右上角 **Fork** 按钮，将仓库复制到自己的 GitHub 账号下。

### 第二步：修改配置文件

编辑根目录 `config.js`：

```js
const CONFIG = {
  owner: 'your-username',   // GitHub 用户名（必填）
  repo:  'Z-BLOG',          // 仓库名称（必填）

  siteTitle:  '我的博客',
  siteDesc:   '基于 GitHub Issues 的个人博客',
  siteAuthor: '你的名字',
  siteAvatar: '',           // 头像 URL，留空则使用 GitHub 头像

  postsPerPage: 10,

  categories: [
    { label: 'article', name: '文章',  icon: '📝', color: '#28a745', desc: '长篇文章与教程' },
    { label: 'image',   name: '图片',  icon: '🖼️', color: '#0969da', desc: '图片与摄影作品' },
    { label: 'think',   name: '思考',  icon: '💡', color: '#d73a49', desc: '思考与随想' },
    { label: 'note',    name: '笔记',  icon: '📌', color: '#6f42c1', desc: '随记与短笔记' },
    { label: 'link',    name: '链接',  icon: '🔗', color: '#e36209', desc: '收藏的链接' },
    { label: 'music',   name: '音乐',  icon: '🎵', color: '#ec4899', desc: '背景音乐歌单' },
  ],

  beian: {
    icp:        '',   // 如：粤ICP备12345678号（留空则不显示）
    police:     '',   // 如：粤公网安备 44010602012345号
    policeCode: '',   // 纯数字，用于生成官方跳转链接
  },

  cacheDuration: 5 * 60 * 1000,  // API 缓存时长（毫秒）
};
```

> 同步修改 `uniapp-zblog/config.js`，内容保持一致。

### 第三步：在 GitHub 仓库创建 Labels

进入仓库 → **Issues** → **Labels** → 新建以下标签：

| Label 名称 | 颜色       | 说明       |
|-----------|------------|----------|
| `article` | `#28a745`  | 文章       |
| `image`   | `#0969da`  | 图片 / 照片  |
| `think`   | `#d73a49`  | 思考 / 随想  |
| `note`    | `#6f42c1`  | 笔记       |
| `link`    | `#e36209`  | 链接收藏    |
| `music`   | `#ec4899`  | 音乐歌单    |

> Label 颜色会自动同步到博客标签展示色。

### 第四步：开启 GitHub Pages

1. 进入仓库 → **Settings** → **Pages**
2. Source 选择 **GitHub Actions**
3. 推送代码到 `main` 分支，Actions 自动部署

部署完成后访问：`https://your-username.github.io/Z-BLOG`

---

## 发布文章

1. 进入 GitHub 仓库 → **Issues** → **New issue**
2. 填写标题和正文（支持 Markdown）
3. 右侧 **Labels** 选择分类标签
4. 点击 **Submit new issue** 即发布

### 各分类发布技巧

**思考（`think`）**
- 普通 Markdown 内容
- 博客自动以时间线样式展示，支持年 / 月筛选

**图片（`image`）**
- 正文粘贴图片或 `![描述](图片URL)`
- 照片墙自动提取每篇 Issue 中的全部图片

**链接（`link`）**
- 正文中粘贴 URL，分类页以图标卡片展示

**音乐（`music`）**
- 正文格式：
  ```
  歌曲名 - 歌手
  [音频直链URL]
  [封面图URL]（可选）
  ```
- 博客底部背景音乐播放器自动加载歌单

---

## 外观定制

### 暗黑模式
点击导航栏右上角 **月亮 / 太阳图标** 切换亮暗模式，偏好保存至 `localStorage`，未手动设置时跟随系统。

### 主题色
点击导航栏右上角 **彩色圆环图标** 打开主题色面板：
- 12 套预设色（蓝 / 靛 / 紫 / 品 / 粉 / 玫 / 橙 / 琥珀 / 绿 / 青 / 湖 / 天蓝）
- 自定义拾色器
- 一键重置为默认蓝 `#2563eb`

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
4. 等待打包完成后下载 APK 安装

---

## 技术栈

| 端        | 技术                                         |
|----------|--------------------------------------------|
| PC / H5  | 原生 HTML / CSS / JavaScript（无框架，无构建工具）    |
| 移动端      | UniApp + Vue 2                             |
| 内容存储     | GitHub Issues                              |
| 数据接口     | GitHub REST API v3                         |
| 部署       | GitHub Actions + GitHub Pages              |
| Markdown  | marked.js                                  |
| 代码高亮     | highlight.js（亮 / 暗双主题自动切换）                |
| 访客统计     | 不蒜子                                        |
| 图片代理压缩   | wsrv.nl                                    |

---

## 参考与致谢

- 灵感来源：[Gmeek](https://github.com/Meekdai/Gmeek)
- GitHub Issues API：[官方文档](https://docs.github.com/en/rest/issues)
- UniApp：[官方文档](https://uniapp.dcloud.net.cn/)

---

## License

[MIT](LICENSE) © 2026 Z-BLOG
