// Z-BLOG UniApp 配置（与 web 端保持一致）
const CONFIG = {
  owner: 'zhuzhengwen',
  repo:  'Z-BLOG',
  token: '',  // 不在代码中存储，防止 GitHub 自动吊销

  siteTitle:     'Z-BLOG',
  siteDesc:      '基于 GitHub Issues 的个人博客',
  siteStartDate: '2026-03-26',
  postsPerPage:  10,

  categories: [
    { label: 'article', name: '文章', icon: '📝', color: '#28a745' },
    { label: 'image',   name: '图片', icon: '🖼️', color: '#0969da' },
    { label: 'think',   name: '思考', icon: '💡', color: '#d73a49' },
    { label: 'note',    name: '笔记', icon: '📌', color: '#6f42c1' },
    { label: 'link',    name: '链接', icon: '🔗', color: '#e36209' },
    { label: 'music',   name: '音乐', icon: '🎵', color: '#ec4899' },
  ],

  cacheDuration: 5 * 60 * 1000,
}

export default CONFIG
