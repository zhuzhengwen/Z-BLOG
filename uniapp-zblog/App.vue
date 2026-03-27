<script>
export default {
  onLaunch() {},
  onShow()   {},
  onHide()   {},
}
</script>

<style>
/* 全局样式 */
page {
  background-color: #f8fafc;
  font-family: -apple-system, 'PingFang SC', 'Hiragino Sans GB', sans-serif;
  color: #1e293b;
  font-size: 15px;
}
/* 隐藏默认滚动条 */
::-webkit-scrollbar { display: none; }

/* 通用变量（H5 生效） */
/* #ifdef H5 */
:root {
  --primary:    #2563eb;
  --bg:         #f8fafc;
  --surface:    #ffffff;
  --surface-2:  #f1f5f9;
  --border:     #e2e8f0;
  --text:       #1e293b;
  --text-muted: #64748b;
  --radius:     10px;
}
/* #endif */
</style>
