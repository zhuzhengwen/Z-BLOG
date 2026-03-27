/**
 * Z-BLOG 配置文件
 * 修改此文件以配置你的博客
 */
const CONFIG = {
  // ========== 必填：GitHub 仓库信息 ==========
  owner: 'zhuzhengwen',   // GitHub 用户名或组织名
  repo:  'Z-BLOG',       // 仓库名称（Issues 所在仓库）
  token: '',                // 可选：GitHub Personal Access Token（提高 API 频率限制至 5000次/小时）

  // ========== 博客基本信息 ==========
  siteTitle:  'Z-BLOG',
  siteDesc:   '基于 GitHub Issues 的个人博客',
  siteAuthor: 'Author',
  siteAvatar: '', // 头像 URL，留空则使用 GitHub 头像

  // ========== 分页 ==========
  postsPerPage: 10,

  // ========== 分类定义 ==========
  // 对应 GitHub Issue 的 Label，请在 GitHub 仓库中创建同名 Label
  categories: [
    { label: 'article', name: '文章', icon: '📝', color: '#28a745', desc: '长篇文章与教程' },
    { label: 'image',   name: '图片', icon: '🖼️', color: '#0969da', desc: '图片与摄影作品' },
    { label: 'video',   name: '视频', icon: '🎬', color: '#d73a49', desc: '视频内容' },
    { label: 'note',    name: '笔记', icon: '📌', color: '#6f42c1', desc: '随记与短笔记' },
    { label: 'link',    name: '链接', icon: '🔗', color: '#e36209', desc: '收藏的链接' },
  ],

  // ========== 缓存时长（毫秒）==========
  cacheDuration: 5 * 60 * 1000, // 5 分钟
};
