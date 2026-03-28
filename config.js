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
    { label: 'article', name: '文章', color: '#28a745', desc: '长篇文章与教程',
      icon: `<svg class="ci" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 1h7l3 3v11H3V1z"/><path d="M9 1v3h3"/><line x1="5.5" y1="8" x2="10.5" y2="8"/><line x1="5.5" y1="11" x2="10.5" y2="11"/></svg>` },
    { label: 'image',   name: '图片', color: '#0969da', desc: '图片与摄影作品',
      icon: `<svg class="ci" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="2" width="14" height="12" rx="1.5"/><circle cx="5" cy="6.5" r="1.3" fill="currentColor" stroke="none"/><path d="M1 12 5 8l3 3 2-2 5 4.5"/></svg>` },
    { label: 'video',   name: '视频', color: '#d73a49', desc: '视频内容',
      icon: `<svg class="ci" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="4" width="10" height="8" rx="1.5"/><path d="M11 7.3l4-2.3v6l-4-2.3z"/></svg>` },
    { label: 'note',    name: '笔记', color: '#6f42c1', desc: '随记与短笔记',
      icon: `<svg class="ci" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="1" width="12" height="14" rx="1.5"/><line x1="5" y1="6" x2="11" y2="6"/><line x1="5" y1="9" x2="11" y2="9"/><line x1="5" y1="12" x2="8.5" y2="12"/></svg>` },
    { label: 'link',    name: '链接', color: '#e36209', desc: '收藏的链接',
      icon: `<svg class="ci" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M6.5 9.5a3.5 3.5 0 005 0l2-2a3.5 3.5 0 00-5-5L7.5 4"/><path d="M9.5 6.5a3.5 3.5 0 00-5 0l-2 2a3.5 3.5 0 005 5L8.5 12"/></svg>` },
  ],

  // ========== 缓存时长（毫秒）==========
  cacheDuration: 5 * 60 * 1000, // 5 分钟
};
