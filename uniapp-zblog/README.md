# Z-BLOG UniApp 手机端

基于 UniApp + Vue2，支持编译为 **H5 网页** 和 **Android APK**。

## 快速开始

### 方式一：HBuilderX（推荐，最简单）

1. 下载安装 [HBuilderX](https://www.dcloud.io/hbuilderx.html)
2. 打开 `uniapp-zblog/` 整个目录
3. 修改 `config.js` 中的 `owner` 和 `repo`
4. **运行 → 运行到浏览器** → H5 预览
5. **发行 → 原生 App 云打包** → 生成 APK

### 方式二：命令行（vue-cli）

```bash
cd uniapp-zblog
npm install
npm run dev:h5      # H5 开发预览
npm run build:h5    # H5 生产构建
```

---

## 功能

| 页面   | 功能                               |
|--------|------------------------------------|
| 首页   | 文章列表 + 分类筛选 + 下拉刷新 + 上拉加载更多 |
| 照片墙 | 双列瀑布流 + 原生全屏预览            |
| 分类   | 分类卡片 + 运行时间统计             |
| 搜索   | 关键词搜索（GitHub Search API）      |
| 详情   | Markdown 渲染 + 图片预览 + GitHub 链接 |

---

## 打包 APK

1. 在 HBuilderX 中，菜单 **发行 → 原生 App 云打包**
2. 选择 Android 平台，填写包名（如 `com.yourname.zblog`）
3. 使用公共测试证书或自有证书
4. 等待云端打包完成，下载 APK 安装即可
