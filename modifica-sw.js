/* Service worker for LOGOS Modifica only — scoped to modifica.html itself,
   deliberately kept separate from LOGOS's own service worker (sw.js), which
   has a different scope and caches a different, unrelated set of files.
   Caches the app shell so it installs and opens without a connection; the
   WebRTC handshake itself still needs the internet to find the other peer. */

const CACHE = 'logos-modifica-3.33';
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
     all the logic now lives.
     `cache: 'no-store'` matters here specifically: GitHub Pages serves these
     files with a 10-minute max-age, and a plain fetch() honours that HTTP
     cache before it ever reaches the network — so without this, "network
     first" would silently degrade back into serving up to 10 minutes of
     stale code after every single deploy, the exact failure this was
     written to avoid. */
  const isAppCode = req.mode === 'navigate' || req.destination === 'document' ||
                    req.destination === 'script' || req.destination === 'style';
  if (isAppCode){
    event.respondWith(
      fetch(req, { cache: 'no-store' })
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

/* ---------------- the knock: a wake-up with nothing in it ----------------
   The push carries no data at all — no name, no message, not even which
   contact. It only ever means one thing: someone you have already connected
   with once wants to talk. Reading who, and answering, both still happen
   entirely inside the app over the same encrypted mailbox as always; the
   notification's only job is to get the app opened. */
self.addEventListener('push', () => {
  self.registration.showNotification('DigitalValut Logos', {
    body: 'Qualcuno vuole parlarti.',
    icon: './modifica-icon-192.png',
    badge: './modifica-icon-192.png',
    tag: 'dvlogos-knock',
    renotify: true,
  });
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      for (const c of list){
        if (c.url.indexOf('modifica.html') !== -1) return c.focus();
      }
      return self.clients.openWindow('./modifica.html');
    })
  );
});
