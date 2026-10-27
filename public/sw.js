// ============================================
// ModelJourney Service Worker
// 策略：用户确认后激活（不自动 skipWaiting）
// ============================================
// 🔑 每次发布新版本时，手动把下面的 CACHE_VERSION 改一下（如 v1.1.0 → v1.1.1）
// 只要 sw.js 文件内容有差异（哪怕只有这一个字符串），浏览器就会触发更新检测
// ============================================

const CACHE_VERSION = 'v1.1.1';
const CACHE_NAME = `modeljourney-${CACHE_VERSION}`;

// 需要预缓存的静态资源（首次安装时尽量拉取）
// ⚠️ 注意：这里只缓 HTML/manifest，具体 JS/CSS 由下面的 fetch 拦截动态缓存
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
];

// ============================================
// install 阶段：预缓存关键资源
// ⚠️ 这里【故意不调用】self.skipWaiting()
//   让新 SW 进入 waiting 状态，等用户点击"立即更新"后再激活
// ============================================
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS).catch((err) => {
        console.warn('[SW] Precache failed (non-fatal):', err);
      });
    })
  );
  // ❌ 不要写 self.skipWaiting()，否则会跳过"用户确认"这一步
});

// ============================================
// activate 阶段：清理所有旧版本缓存 + 立即接管页面
// 说明：caches.delete() 只影响 Cache Storage（HTML/JS/CSS），
//       完全不会碰 IndexedDB / localStorage / 本地挂载文件夹
// ============================================
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
            return null;
          })
        );
      })
      .then(() => self.clients.claim())
  );
});

// ============================================
// message 阶段：用户点击"立即更新"时，App 会 postMessage({ type: 'SKIP_WAITING' })
// 收到后调用 self.skipWaiting() 触发激活
// ============================================
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// ============================================
// fetch 阶段：缓存策略
// - 导航请求（HTML）：网络优先（保证用户能拿到最新 HTML），失败回退缓存
// - 静态资源（JS/CSS/图片）：缓存优先，网络回填
// - 非 GET / 跨域 / chrome-extension / local:// 直接放行
// ============================================
self.addEventListener('fetch', (event) => {
  const { request } = event;

  // 只处理 GET
  if (request.method !== 'GET') return;

  // 只处理同源请求（跨域 / chrome-extension / 挂载文件夹等一律放行）
  if (!request.url.startsWith(self.location.origin)) return;

  // 导航请求（HTML 页面）：网络优先
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, responseClone));
          return response;
        })
        .catch(() => {
          return caches.match(request).then((cached) => cached || caches.match('/index.html'));
        })
    );
    return;
  }

  // 静态资源：缓存优先，网络回填
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request)
        .then((response) => {
          if (response && response.status === 200 && response.type === 'basic') {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, responseClone));
          }
          return response;
        })
        .catch(() => {
          // 静态资源获取失败时，静默失败（不影响主流程）
          return new Response('', { status: 504 });
        });
    })
  );
});