// Service Worker — Para Amanda
// Cache-first para assets estáticos (HTML/CSS/JS/imagens/fontes locais),
// network-first para o áudio (arquivo grande, melhor stream do server).
// Mudar VERSION força atualização do cache em todos os clients.

const VERSION = 'v2';
const CACHE = `para-amanda-${VERSION}`;

const PRECACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/para-amanda/styles.css',
  '/para-amanda/app.js?v=3',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/apple-touch-icon.png',
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE)
      .then(cache => Promise.allSettled(PRECACHE.map(url => cache.add(url))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // não interceptar CDN externa

  // Áudio: stream direto, sem cache (arquivo grande)
  if (url.pathname.endsWith('.mp3') || url.pathname.endsWith('.m4a')) {
    return; // deixa o browser lidar normalmente
  }

  // HTML: network-first para sempre pegar a última versão
  if (req.mode === 'navigate' || req.headers.get('accept')?.includes('text/html')) {
    event.respondWith(
      fetch(req)
        .then(res => {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put(req, copy)).catch(() => {});
          return res;
        })
        .catch(() => caches.match(req).then(r => r || caches.match('/')))
    );
    return;
  }

  // Assets: cache-first
  event.respondWith(
    caches.match(req).then(cached => cached || fetch(req).then(res => {
      if (res.ok) {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(req, copy)).catch(() => {});
      }
      return res;
    }))
  );
});
