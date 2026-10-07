// Service worker : l'appli s'ouvre même sans réseau, et se met à jour toute seule.
// ⚠ Changer VERSION à chaque livraison (sinon les téléphones gardent l'ancienne version).
const VERSION = '1.14-2026-10-07';
// Nom du cache propre à CE dossier (officielle /stock/ et test /stock-test/ peuvent être sur le même compte GitHub)
const SCOPE = new URL(self.registration.scope).pathname;
const PREFIX = 'stock-dacosta:' + SCOPE + ':';
const CACHE = PREFIX + VERSION;
const ASSETS = [
  './', 'index.html', 'style.css', 'config.js', 'core.js', 'pdf.js', 'app.js', 'facture.js', 'voix.js', 'manifest.webmanifest', 'manifest-test.webmanifest',
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
  // Facture partagée depuis une autre appli (Gmail…, Android) : on la garde puis on ouvre l'écran Facture.
  if (req.method === 'POST' && new URL(req.url).searchParams.has('share-target')) {
    e.respondWith((async () => {
      try {
        const fd = await req.formData();
        const c = await caches.open('stock-share:' + SCOPE);
        (await c.keys()).forEach((k) => c.delete(k));
        let i = 0;
        for (const f of fd.getAll('file')) {
          if (f && f.size) await c.put(SCOPE + 'share/' + (i++), new Response(f, { headers: { 'content-type': f.type || 'application/octet-stream' } }));
        }
      } catch (err) {}
      return Response.redirect(SCOPE + '?partage=1', 303);
    })());
    return;
  }
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
