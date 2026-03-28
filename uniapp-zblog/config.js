// Z-BLOG UniApp 配置（与 web 端保持一致）
const CONFIG = {
  owner: 'zhuzhengwen',
  repo:  'Z-BLOG',
  token: '',  // 不要在此填写 token，App 端代码可被反编译

  siteTitle:     'Z-BLOG',
  siteDesc:      '基于 GitHub Issues 的个人博客',
  siteStartDate: '2026-03-26',
  postsPerPage:  10,

  categories: [
    { label: 'article', name: '文章', icon: '文', color: '#28a745' },
    { label: 'image',   name: '图片', icon: '图', color: '#0969da' },
    { label: 'video',   name: '视频', icon: '视', color: '#d73a49' },
    { label: 'note',    name: '笔记', icon: '记', color: '#6f42c1' },
    { label: 'link',    name: '链接', icon: '链', color: '#e36209' },
  ],

  cacheDuration: 5 * 60 * 1000,
}

export default CONFIG
