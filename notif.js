/* Stock Da Costa — notifications (V1.21) : Firebase Cloud Messaging.
   Le script envoie ; ce téléphone s'abonne (jeton Firebase) et le service worker affiche. */
'use strict';

var PUSH = { busy: false, err: '', checked: false };
function pushCfg() { return SYNC.push || null; }
function pushOk() { return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window; }
function pushMine() { var t = LS.get('pushTok', null); return t && t.qui === ME && Notification.permission === 'granted' ? t : null; }
function loadScript(src) {
  return new Promise(function (res, rej) { var s = document.createElement('script'); s.src = src; s.onload = res; s.onerror = function () { rej(new Error('Chargement impossible : ' + src)); }; document.head.appendChild(s); });
}
var FB = null;
function firebaseMsg(cfg) {
  if (FB) return Promise.resolve(FB);
  return (window.firebase ? Promise.resolve() : loadScript('lib/firebase/firebase-app-compat.js').then(function () { return loadScript('lib/firebase/firebase-messaging-compat.js'); }))
    .then(function () {
      var app = firebase.apps.length ? firebase.app() : firebase.initializeApp({ apiKey: cfg.apiKey, authDomain: cfg.authDomain, projectId: cfg.projectId, messagingSenderId: cfg.messagingSenderId, appId: cfg.appId });
      FB = firebase.messaging(app); return FB;
    });
}
/** Demande le jeton de CE téléphone à Firebase et le donne au script (si nouveau ou si la personne a changé). */
function pushAbonner(force) {
  var cfg = pushCfg(); if (!cfg || !pushOk()) return Promise.reject(new Error('Notifications non disponibles ici.'));
  return navigator.serviceWorker.ready.then(function (reg) {
    return firebaseMsg(cfg).then(function (m) { return m.getToken({ vapidKey: cfg.vapidKey, serviceWorkerRegistration: reg }); });
  }).then(function (tok) {
    if (!tok) throw new Error('Firebase n\'a pas donné de jeton.');
    var old = LS.get('pushTok', null);
    if (!force && old && old.token === tok && old.qui === ME) return old;
    return call('abonner', [CFG.code, { token: tok, qui: ME, appareil: /Android/.test(navigator.userAgent) ? 'Android' : /iPhone|iPad/.test(navigator.userAgent) ? 'iPhone' : 'Ordinateur' }], 30000)
      .then(function () { var t = { token: tok, qui: ME, le: Date.now() }; LS.set('pushTok', t); return t; });
  });
}
/** Au démarrage : si les notifications sont déjà autorisées, on vérifie que le jeton est toujours le bon. */
function pushVerifier() {
  if (PUSH.checked || !ME || !pushCfg() || !pushOk() || Notification.permission !== 'granted') return;
  PUSH.checked = true;
  setTimeout(function () { pushAbonner(false).catch(function () { PUSH.checked = false; }); }, 4000);
}
A.pushOn = function () {
  if (PUSH.busy) return;
  PUSH.busy = true; PUSH.err = ''; render(false);
  Notification.requestPermission().then(function (p) {
    if (p !== 'granted') throw new Error(p === 'denied' ? 'Tu as refusé les notifications. Pour changer d\'avis : réglages du téléphone › Chrome › Notifications.' : 'Pas d\'autorisation donnée.');
    return pushAbonner(true);
  }).then(function () { PUSH.busy = false; toast('Notifications activées', 'Tu peux envoyer un essai'); render(false); })
    .catch(function (e) { PUSH.busy = false; PUSH.err = e.message || String(e); render(false); });
};
A.pushEssai = function () {
  if (PUSH.busy) return;
  PUSH.busy = true; render(false);
  call('notifEssai', [CFG.code, { qui: ME }], 30000).then(function (r) {
    PUSH.busy = false; PUSH.err = r.envoyes ? '' : 'Pas envoyée : ' + ((r.erreurs || [])[0] || 'raison inconnue');
    if (r.envoyes) toast('Essai envoyé', 'Elle arrive dans quelques secondes');
    render(false);
  }).catch(function (e) { PUSH.busy = false; PUSH.err = e.message; render(false); });
};
function notifCard() {
  var cfg = pushCfg(), patron = isPatron(), u = me() || {};
  var recoit = patron ? 'les produits qui passent sous leur seuil et les factures rangées par un salarié' : u.alertes === '1' ? 'les produits qui passent sous leur seuil' : '';
  if (!patron && !recoit) return '';
  var h = '<div class="card"><div class="card-title"><h2>Notifications</h2>' + (cfg && pushOk() && pushMine() ? '<span class="badge ok">activées</span>' : '') + '</div>';
  if (!cfg) return h + '<p style="font-size:14px;color:var(--muted);margin:0">Pas encore configurées dans le script (Firebase : voir le LISEZ-MOI).</p></div>';
  if (!pushOk()) return h + '<p style="font-size:14px;color:var(--muted);margin:0">Ce navigateur ne sait pas recevoir de notifications. Ouvre l\'appli installée sur le téléphone (Android).</p></div>';
  h += '<p style="font-size:14px;color:var(--muted);margin:0 0 10px">Tu reçois sur ce téléphone : ' + recoit + '.</p>';
  if (PUSH.err) h += '<div class="hint" style="background:var(--red-bg);color:var(--red-ink)">' + esc(PUSH.err) + '</div>';
  if (Notification.permission === 'denied') return h + '<div class="hint" style="background:var(--orange-bg);color:#7A3D00">Bloquées sur ce téléphone. Pour les autoriser : réglages du téléphone › Applis › Chrome (ou l\'appli Stock) › Notifications.</div></div>';
  if (pushMine()) return h + '<button class="btn light" data-a="pushEssai"' + (PUSH.busy ? ' disabled' : '') + '>' + (PUSH.busy ? 'Envoi…' : 'Envoyer une notification d\'essai') + '</button></div>';
  return h + '<button class="btn" data-a="pushOn"' + (PUSH.busy ? ' disabled' : '') + '>' + (PUSH.busy ? 'Activation…' : 'Activer les notifications') + '</button></div>';
}
/** Fiche d'une personne (patron) : alertes de stock pour un salarié + état de ses notifications. */
function notifUserCard(u) {
  if (!u || u.actif === '0') return '';
  var n = num(u.notif), sal = u.role !== 'patron';
  return '<div class="card"><div class="kv"><span>Notifications</span><span>' + (n ? 'activées' + (n > 1 ? ' (' + n + ' appareils)' : '') : 'pas activées sur son téléphone') + '</span></div>' +
    (sal ? '<button class="toggle-row" data-a="userAlertes" data-v="' + (u.alertes === '1' ? '' : '1') + '"><span class="grow"><b>Alertes de stock bas</b><span>Prévenu quand un produit passe sous son seuil</span></span><span class="sw ' + (u.alertes === '1' ? 'on' : '') + '"><i></i></span></button>'
      : '<p style="font-size:13px;color:var(--muted);margin:6px 0 0">Un patron reçoit toujours les alertes de stock bas et les factures rangées par un salarié.</p>') + '</div>';
}
A.userAlertes = function (d) { commit(put('Utilisateurs', { id: VIEW.p.f.id, alertes: d.v })); toast(d.v ? 'Alertes activées' : 'Alertes désactivées', d.v ? 'Il faut aussi qu\'il active les notifications sur son téléphone' : ''); render(false); };
