// Cambiá VERSION cada vez que subas cambios a GitHub para que el iPhone los tome.
const VERSION = 'gastos-v1';
const ARCHIVOS = [
  './',
  './index.html',
  './styles.css',
  './app.js',
  './manifest.json',
  './icons/icon-180.png',
  './icons/icon-192.png',
  './icons/icon-512.png',
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(ARCHIVOS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Solo archivos propios (GET). Las llamadas a Google van siempre directo a la red.
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  e.respondWith(
    caches.match(req, { ignoreSearch: true }).then(cacheada => {
      const red = fetch(req).then(resp => {
        if (resp.ok) caches.open(VERSION).then(c => c.put(req, resp.clone()));
        return resp;
      }).catch(() => cacheada || caches.match('./index.html'));
      return cacheada || red;
    })
  );
});
