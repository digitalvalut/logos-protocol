/*
 * Copyright 2026 Associazione di Promozione Sociale DigitalValut (ETS)
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/* Service worker for LOGOS Modifica only — scoped to modifica.html itself,
   deliberately kept separate from LOGOS's own service worker (sw.js), which
   has a different scope and caches a different, unrelated set of files.
   Caches the app shell so it installs and opens without a connection; the
   WebRTC handshake itself still needs the internet to find the other peer. */

const CACHE = 'logos-modifica-4.00';
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

/* ---------------- share target: "share to" from another app ----------------
   Android routes a share (a photo from the gallery, a PDF from a mail client,
   whatever) here as a real POST with the files as multipart form data — a
   static page cannot read that body, only a service worker can, which is why
   this exists as a fetch handler and not app code. It never touches the
   files themselves: they are stashed byte-for-byte in a scratch Cache and the
   browser is sent straight back to the app, which is the only place that
   ever decides what happens to them next. */
const SHARE_CACHE = 'logos-modifica-share-temp';
async function handleShare(event){
  try{
    const form = await event.request.formData();
    const files = form.getAll('sharedFiles').filter(f => f && typeof f.arrayBuffer === 'function');
    if (files.length){
      const cache = await caches.open(SHARE_CACHE);
      const stamp = Date.now().toString(36);
      let i = 0;
      for (const file of files){
        const url = new URL('./__shared/' + stamp + '-' + (i++) + '/' + encodeURIComponent(file.name || 'file'), self.location.href);
        await cache.put(url, new Response(file, { headers: { 'Content-Type': file.type || 'application/octet-stream' } }));
      }
    }
  }catch(e){ /* nothing usable arrived; the app just opens normally */ }
  return Response.redirect('./modifica.html?shared=1', 303);
}

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method === 'POST'){
    const url = new URL(req.url);
    if (url.origin === self.location.origin && url.pathname.endsWith('/modifica.html')){
      event.respondWith(handleShare(event));
    }
    return;
  }
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

/* Asked by the app's own health check. The page is served network-first, so
   the code running is always current — but this file is not, and a stale
   service worker still serving an old shell is exactly the failure that has
   cost this project more time than any other. Now it can be seen instead of
   guessed. */
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'version' && event.ports && event.ports[0]){
    event.ports[0].postMessage(CACHE);
  }
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
