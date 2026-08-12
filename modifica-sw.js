/* Service worker for LOGOS Modifica only — scoped to modifica.html itself,
   deliberately kept separate from LOGOS's own service worker (sw.js), which
   has a different scope and caches a different, unrelated set of files.
   Caches the app shell so it installs and opens without a connection; the
   WebRTC handshake itself still needs the internet to find the other peer. */

const CACHE = 'logos-modifica-1.2';
const ASSETS = [
  './modifica.html',
  './modifica-manifest.webmanifest',
  './modifica-icon-192.png',
  './modifica-icon-512.png',
  './modifica-apple-touch-icon.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE)
      .then(cache => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
      .catch(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;
  if (new URL(req.url).origin !== self.location.origin) return;

  event.respondWith(
    caches.match(req, { ignoreSearch: true }).then(hit => {
      const live = fetch(req).then(res => {
        if (res && res.ok && res.type === 'basic') {
          const copy = res.clone();
          caches.open(CACHE).then(cache => cache.put(req, copy));
        }
        return res;
      }).catch(() => hit);
      return hit || live;
    })
  );
});
