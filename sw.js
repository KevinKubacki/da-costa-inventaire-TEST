// Service worker : l'appli s'ouvre même sans réseau, et se met à jour toute seule.
// ⚠ Changer VERSION à chaque livraison (sinon les téléphones gardent l'ancienne version).
const VERSION = '1.3-2026-10-07';
// Nom du cache propre à CE dossier (officielle /stock/ et test /stock-test/ peuvent être sur le même compte GitHub)
const SCOPE = new URL(self.registration.scope).pathname;
const PREFIX = 'stock-dacosta:' + SCOPE + ':';
const CACHE = PREFIX + VERSION;
const ASSETS = [
  './', 'index.html', 'style.css', 'config.js', 'core.js', 'pdf.js', 'app.js', 'manifest.webmanifest', 'manifest-test.webmanifest',
  'lib/jspdf.umd.min.js', 'lib/jspdf.plugin.autotable.min.js',
  'fonts/barlow-latin-400-normal.woff2', 'fonts/barlow-latin-500-normal.woff2', 'fonts/barlow-latin-600-normal.woff2', 'fonts/barlow-latin-700-normal.woff2',
  'fonts/barlow-semi-condensed-latin-600-normal.woff2', 'fonts/barlow-semi-condensed-latin-700-normal.woff2', 'fonts/barlow-semi-condensed-latin-800-normal.woff2',
  'icons/logo-blanc.png', 'icons/toit-blanc.png', 'icons/favicon.png', 'icons/apple-touch-icon.png', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/maskable-512.png',
  'icons/test-favicon.png', 'icons/test-apple-touch-icon.png', 'icons/test-icon-192.png', 'icons/test-icon-512.png', 'icons/test-maskable-512.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS.map((u) => new Request(u, { cache: 'reload' })))).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  // On ne supprime que NOS anciens caches (jamais ceux des autres applis du même compte GitHub).
  const old = (k) => (k.startsWith(PREFIX) && k !== CACHE) || /^stock-dacosta-1\.[01]-/.test(k);
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter(old).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;           // Google Apps Script : toujours par le réseau
  if (url.pathname.endsWith('/config.js')) {                 // la configuration : toujours la version en ligne si possible
    e.respondWith(fetch(req, { cache: 'no-store' }).then((res) => {
      if (res.ok) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put('config.js', copy)); }
      return res;
    }).catch(() => caches.match('config.js')));
    return;
  }
  e.respondWith(
    caches.match(req, { ignoreSearch: true }).then((hit) => hit || fetch(req).then((res) => {
      if (res.ok) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); }
      return res;
    }).catch(() => caches.match('index.html')))
  );
});
