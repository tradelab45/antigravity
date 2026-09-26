const CACHE_VERSION = 'rupeerookie-v4';
const APP_SHELL = ['/', '/index.html', '/manifest.webmanifest', '/app-icon.svg', '/app-icon-192.png', '/app-icon-512.png'];
const isAsset = url => url.origin === self.location.origin && (url.pathname.startsWith('/assets/') || APP_SHELL.slice(2).includes(url.pathname));

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_VERSION).then(cache => cache.addAll(APP_SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith('rupeerookie-') && key !== CACHE_VERSION).map(key => caches.delete(key)))).then(() => self.clients.claim()));
});
self.addEventListener('message', event => {
  if (event.data?.type !== 'CACHE_URLS' || !Array.isArray(event.data.urls)) return;
  const urls = event.data.urls.filter(value => {
    try { return isAsset(new URL(value, self.location.origin)); } catch { return false; }
  }).slice(0, 300);
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_VERSION);
    const results = await Promise.allSettled(urls.map(async url => {
      if (!(await cache.match(url))) await cache.add(url);
    }));
    event.ports[0]?.postMessage({ ready: urls.length > 0 && results.every(result => result.status === 'fulfilled') });
  })());
});
self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin || url.pathname.startsWith('/api/')) return;
  if (request.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        const response = await fetch(request, { signal: AbortSignal.timeout(4000) });
        if (!response.ok || !response.headers.get('content-type')?.includes('text/html')) throw new Error('Navigation unavailable');
        const cache = await caches.open(CACHE_VERSION);
        await cache.put('/index.html', response.clone());
        return response;
      } catch {
        return await caches.match('/index.html') || await caches.match('/') || new Response('Reconnect to load RupeeRookie.', { status: 503 });
      }
    })());
  } else if (isAsset(url)) {
    event.respondWith((async () => {
      const cached = await caches.match(request);
      if (cached) return cached;
      const response = await fetch(request);
      if (response.ok) { const cache = await caches.open(CACHE_VERSION); await cache.put(request, response.clone()); }
      return response;
    })());
  }
});

