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
    { label: 'article', name: '文章', icon: '文', color: '#5a8a6a' },
    { label: 'image',   name: '图片', icon: '图', color: '#4a7ab5' },
    { label: 'video',   name: '视频', icon: '视', color: '#a05a6a' },
    { label: 'note',    name: '笔记', icon: '记', color: '#6b5b95' },
    { label: 'link',    name: '链接', icon: '链', color: '#b07a4e' },
  ],

  cacheDuration: 5 * 60 * 1000,
}

export default CONFIG
