// Configuration de la VERSION TEST de Kevin.
// V1.19 : PLUS AUCUN CODE ICI (ce fichier est public sur GitHub). Chaque téléphone reçoit son accès
// par son lien d'invitation personnel ; Kevin tape une fois le code administrateur (CODE_ACCES du script).
window.STOCK_CONFIG = {
  apiUrl: 'https://script.google.com/macros/s/AKfycbxeb3OgZsCN74D2C4YVbGuFfHqzfLEaV1PAQI07Yxai2a9Bbd64IDM0QTkMszJmpnmitA/exec',
  test: true             // VERSION DE TEST (bandeau TEST, icône orange, mémoire séparée)
};

// Filet de sécurité : si le téléphone fait encore tourner une ancienne version de l'appli gardée en mémoire,
// elle est jetée et la nouvelle est rechargée toute seule (ce fichier-ci est toujours relu en ligne).
(function () {
  if (!('serviceWorker' in navigator)) return;
  navigator.serviceWorker.getRegistration().then(function (r) { if (r) r.update(); }).catch(function () {});
  setTimeout(function () {
    if (!window.APP_VERSION || window.STOCK_V2) return;                    // version récente : rien à faire
    var n = 0; try { n = +(sessionStorage.getItem('stock-reparer') || 0); sessionStorage.setItem('stock-reparer', n + 1); } catch (e) {}
    if (n >= 2) return;                                                    // jamais de boucle
    var dossier = location.pathname.replace(/[^/]*$/, '');
    Promise.all([
      window.caches ? caches.keys().then(function (k) { return Promise.all(k.filter(function (x) { return x.indexOf(dossier) >= 0 || /^stock-dacosta-1\./.test(x); }).map(function (x) { return caches.delete(x); })); }) : null,
      navigator.serviceWorker.getRegistration().then(function (r) { return r && r.unregister(); })
    ]).catch(function () {}).then(function () {
      // les fichiers de l'appli sont relus sur GitHub (sinon le navigateur peut ressortir les anciens de sa mémoire)
      return fetch('sw.js', { cache: 'reload' }).then(function (r) { return r.text(); }).then(function (t) {
        var m = /ASSETS\s*=\s*\[([\s\S]*?)\]/.exec(t), l = m ? m[1].match(/'[^']+'/g) || [] : [];
        return Promise.all(l.map(function (q) { return fetch(q.slice(1, -1), { cache: 'reload' }).catch(function () {}); }));
      });
    }).catch(function () {}).then(function () { location.reload(); });
  }, 2500);
})();
