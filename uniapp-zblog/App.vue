<script>
import { initMusic, loadPlaylistFromAPI } from './utils/music.js'
import api from './utils/api.js'
export default {
  onLaunch() {
    loadPlaylistFromAPI(api)
      .finally(() => { setTimeout(initMusic, 600) })
  },
  onShow()  {},
  onHide()  {},
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
::-webkit-scrollbar { display: none; }

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
