const VERSION = 'v5';
const STATIC_CACHE = `vt-static-${VERSION}`;
const RUNTIME_CACHE = `vt-runtime-${VERSION}`;

const PRECACHE = [
  '/',
  '/offline.html',
  '/manifest.webmanifest',
  '/favicon.svg',
  '/favicon.png',
  '/pwa/icon-192.png',
  '/pwa/icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((c) => c.addAll(PRECACHE)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k !== STATIC_CACHE && k !== RUNTIME_CACHE)
          .map((k) => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

function isApi(url) {
  return url.pathname.startsWith('/api/');
}

function isStaticAsset(url) {
  return /\.(?:js|css|woff2?|ttf|otf|svg|png|jpg|jpeg|gif|webp|avif|ico)$/.test(url.pathname);
}

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // Never intercept admin or auth flows — keep them strictly online for security
  if (url.pathname.startsWith('/admin') || url.pathname.startsWith('/api/admin') || url.pathname.startsWith('/api/auth')) return;

  if (isApi(url)) {
    // Network-first for APIs; fall back to cached response when offline
    event.respondWith(
      fetch(req)
        .then((res) => {
          if (res.ok && req.method === 'GET') {
            const clone = res.clone();
            caches.open(RUNTIME_CACHE).then((c) => c.put(req, clone));
          }
          return res;
        })
        .catch(() => caches.match(req).then((r) => r || new Response(JSON.stringify({ offline: true }), { status: 503, headers: { 'Content-Type': 'application/json' } })))
    );
    return;
  }

  if (isStaticAsset(url)) {
    // Cache-first for static assets
    event.respondWith(
      caches.match(req).then((cached) => {
        if (cached) return cached;
        return fetch(req).then((res) => {
          if (res.ok) {
            const clone = res.clone();
            caches.open(RUNTIME_CACHE).then((c) => c.put(req, clone));
          }
          return res;
        }).catch(() => cached);
      })
    );
    return;
  }

  // HTML navigations — network-first. On failure, only serve the branded
  // /offline.html outage page when the browser is genuinely offline; a
  // transient fetch error on a flaky mobile connection should NOT trap the
  // user on the offline shell while they have working internet (this was
  // the cause of /pandits randomly redirecting to /offline.html on mobile).
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req).catch(async (err) => {
        if (typeof navigator !== 'undefined' && navigator.onLine === false) {
          const off = await caches.match('/offline.html');
          if (off) return off;
          const shell = await caches.match('/');
          if (shell) return shell;
          return new Response('<h1>You are offline</h1>', { headers: { 'Content-Type': 'text/html' } });
        }
        // Online but the request failed (DNS hiccup, transient timeout, etc).
        // Re-throw so the browser surfaces its own retry UI instead of the
        // offline page, which would otherwise lie about the user's state.
        throw err;
      })
    );
  }
});

self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
});
