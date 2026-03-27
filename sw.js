/**
 * Z-BLOG Service Worker
 * 静态资源缓存优先，API 请求网络优先
 */

const CACHE_NAME = 'zblog-v1';
const STATIC_ASSETS = [
  '/mobile.html',
  '/index.html',
  '/config.js',
  '/js/api.js',
  '/js/render.js',
  '/js/app.js',
  '/js/mobile.js',
  '/css/style.css',
  '/css/mobile.css',
  '/manifest.json',
];

// ── 安装：缓存静态资源 ────────────────────────────────────
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(STATIC_ASSETS).catch(() => {}))
      .then(() => self.skipWaiting())
  );
});

// ── 激活：清理旧缓存 ──────────────────────────────────────
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// ── 拦截请求 ──────────────────────────────────────────────
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // GitHub API：网络优先，失败则返回缓存
  if (url.hostname === 'api.github.com') {
    event.respondWith(
      fetch(request)
        .then(res => {
          if (res.ok) {
            const clone = res.clone();
            caches.open(CACHE_NAME).then(c => c.put(request, clone));
          }
          return res;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  // CDN 资源（marked、highlight.js）：缓存优先
  if (url.hostname.includes('cdnjs') || url.hostname.includes('jsdelivr')) {
    event.respondWith(
      caches.match(request).then(cached => {
        if (cached) return cached;
        return fetch(request).then(res => {
          if (res.ok) {
            const clone = res.clone();
            caches.open(CACHE_NAME).then(c => c.put(request, clone));
          }
          return res;
        });
      })
    );
    return;
  }

  // 本地静态资源：缓存优先，网络回退
  if (url.origin === self.location.origin) {
    event.respondWith(
      caches.match(request).then(cached => cached || fetch(request))
    );
  }
});
