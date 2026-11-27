const CACHE = 'zakatbusiness-v2';
const FILES = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png', './icon-maskable-512.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const r = e.request;
  if (r.method !== 'GET') return;
  const u = new URL(r.url);
  if (u.origin === location.origin) {
    // Fichiers de l'appli : internet d'abord (pour recevoir les mises à jour), sinon la copie gardée.
    e.respondWith(
      fetch(r)
        .then((res) => { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(r, copy)); return res; })
        .catch(() => caches.match(r).then((m) => m || caches.match('./index.html')))
    );
  } else if (u.hostname.endsWith('googleapis.com') || u.hostname.endsWith('gstatic.com')) {
    // Polices : copie gardée d'abord.
    e.respondWith(
      caches.match(r).then((m) => m || fetch(r)
        .then((res) => { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(r, copy)); return res; })
        .catch(() => m))
    );
  }
});
