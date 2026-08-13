/* Service worker for LOGOS Modifica only — scoped to modifica.html itself,
   deliberately kept separate from LOGOS's own service worker (sw.js), which
   has a different scope and caches a different, unrelated set of files.
   Caches the app shell so it installs and opens without a connection; the
   WebRTC handshake itself still needs the internet to find the other peer. */

const CACHE = 'logos-modifica-2.3';
const ASSETS = [
  './modifica.html',
  './modifica.css',
  './modifica.js',
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

function keep(req, res){
  if (res && res.ok && res.type === 'basic'){
    const copy = res.clone();
    caches.open(CACHE).then(cache => cache.put(req, copy));
  }
  return res;
}

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;
  if (new URL(req.url).origin !== self.location.origin) return;

  /* The app's own code — the page, its stylesheet and its script — goes to the
     network first. Cache-first meant an update only showed up on the *second*
     open, and to anyone using the app that reads as "the fix did not work".
     Offline still works: the moment the network fails we fall straight back to
     the cache. The script matters as much as the page here, since that is where
     all the logic now lives. */
  const isAppCode = req.mode === 'navigate' || req.destination === 'document' ||
                    req.destination === 'script' || req.destination === 'style';
  if (isAppCode){
    event.respondWith(
      fetch(req)
        .then(res => keep(req, res))
        .catch(() => caches.match(req, { ignoreSearch: true })
          .then(hit => hit || Response.error()))
    );
    return;
  }

  /* Icons and the manifest change rarely: serve them instantly from the cache
     and refresh in the background. */
  event.respondWith(
    caches.match(req, { ignoreSearch: true }).then(hit => {
      const live = fetch(req).then(res => keep(req, res)).catch(() => hit);
      return hit || live;
    })
  );
});
