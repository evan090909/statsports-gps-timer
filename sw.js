const cachePrefix = 'statsports-gps-' + self.registration.scope + '-';
const cacheName = cachePrefix + 'v3';
const appPage = new URL('index.html', self.registration.scope).href;
const appFiles = [appPage, './manifest.webmanifest', './icons/icon-192.png',
  './icons/icon-512.png', './icons/maskable-512.png', './icons/apple-touch-icon.png'];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(cacheName).then(cache => cache.addAll(appFiles.map(url =>
    new Request(new URL(url, self.registration.scope), {cache:'reload'})))));
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names.filter(name => name.startsWith(cachePrefix) && name !== cacheName)
      .map(name => caches.delete(name)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET' || !request.url.startsWith(self.registration.scope)) return;
  event.respondWith((async () => {
    const cache = await caches.open(cacheName);
    if (request.mode === 'navigate') {
      try {
        return await fetch(request);
      } catch {
        return (await cache.match(appPage)) ?? Response.error();
      }
    }
    return (await cache.match(request)) ?? fetch(request);
  })());
});
