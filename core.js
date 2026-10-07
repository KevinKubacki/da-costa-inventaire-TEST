/* Stock Da Costa — données locales, synchronisation automatique, calculs */
'use strict';

var APP_VERSION = '1.16';
var CFG = window.STOCK_CONFIG || {};
var IS_TEST = CFG.test === true;                       // version de test de Kevin (config.js : test: true)
var NS = IS_TEST ? 'stock-test:' : 'stock:';            // mémoire du téléphone séparée entre test et officielle
var TABLES = ['Reglages', 'Utilisateurs', 'Fournisseurs', 'Familles', 'Produits', 'Prix', 'Mouvements', 'Inventaires', 'Comptages', 'Factures', 'Alias'];

var LS = {
  get: function (k, d) { try { var v = localStorage.getItem(NS + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
  set: function (k, v) { try { localStorage.setItem(NS + k, JSON.stringify(v)); } catch (e) {} },
  del: function (k) { try { localStorage.removeItem(NS + k); } catch (e) {} }
};

function uid(p) { return (p || '') + Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }
function num(v) { if (v === null || v === undefined || v === '') return 0; var n = parseFloat(String(v).replace(',', '.').replace(/\s/g, '')); return isFinite(n) ? n : 0; }
function numOrNull(v) { if (v === null || v === undefined || String(v).trim() === '') return null; var n = parseFloat(String(v).replace(',', '.').replace(/\s/g, '')); return isFinite(n) ? n : null; }
function round3(n) { return Math.round(n * 1000) / 1000; }
function nowIso() { var d = new Date(), z = function (x) { return (x < 10 ? '0' : '') + x; };
  return d.getFullYear() + '-' + z(d.getMonth() + 1) + '-' + z(d.getDate()) + 'T' + z(d.getHours()) + ':' + z(d.getMinutes()) + ':' + z(d.getSeconds()); }

/* ---------------- base locale ---------------- */

function emptyDB() { var db = {}; TABLES.forEach(function (t) { db[t] = {}; }); return db; }
function tablesToDB(tables) {
  var db = emptyDB();
  TABLES.forEach(function (t) { (tables[t] || []).forEach(function (r) { if (r && r.id) db[t][r.id] = r; }); });
  return db;
}
function applyLocal(db, op) {
  if (!db[op.t]) db[op.t] = {};
  var t = db[op.t];
  if (op.op === 'put') {
    var cur = t[op.row.id] || {}, n = {};
    Object.keys(cur).forEach(function (k) { n[k] = cur[k]; });
    Object.keys(op.row).forEach(function (k) { var v = op.row[k]; n[k] = v === null || v === undefined ? '' : String(v); });
    t[op.row.id] = n;
  } else if (op.op === 'del') delete t[op.id];
}

var DB = LS.get('db', null) || emptyDB();
TABLES.forEach(function (t) { if (!DB[t]) DB[t] = {}; });
var OUTBOX = LS.get('outbox', []);
var REJECTED = LS.get('rejected', []);
var DBV = 1;
var LAST_SIG = '';
var LOADED = LS.get('loaded', false);   // vrai dès qu'une synchro complète a réussi une fois

function saveLocal() { LS.set('db', DB); LS.set('outbox', OUTBOX); LS.set('rejected', REJECTED); }

/** Enregistre des modifications : appliquées tout de suite ici, envoyées au Sheet juste après. */
function commit(ops) {
  if (!Array.isArray(ops)) ops = [ops];
  ops.forEach(function (op) {
    var o = { op: op.op, t: op.t, _at: Date.now(), _k: uid('k') };
    if (op.op === 'put') o.row = op.row; else o.id = op.id;
    applyLocal(DB, o);
    OUTBOX.push(o);
  });
  DBV++;
  saveLocal();
  scheduleFlush(600);
  if (window.onDataChange) window.onDataChange(true);
}
function put(t, row) { return { op: 'put', t: t, row: row }; }
function del(t, id) { return { op: 'del', t: t, id: id }; }

/* ---------------- synchronisation ---------------- */

var SYNC = { busy: false, since: 0, last: LS.get('lastSync', 0), err: '', errCode: '', errAt: 0, retry: 0, timer: null,
  sheetUrl: LS.get('sheetUrl', ''), version: LS.get('scriptVersion', ''), ms: 0 };
var RETRY = [2000, 5000, 10000, 30000, 30000];

function configOk() { return CFG.apiUrl && /^(https:\/\/|http:\/\/(localhost|127\.0\.0\.1)[:/])/.test(CFG.apiUrl) && CFG.code && CFG.code !== 'A_CHANGER'; }

function call(fn, args, ms) {
  var ctrl = typeof AbortController !== 'undefined' ? new AbortController() : null;
  var to = setTimeout(function () { if (ctrl) ctrl.abort(); }, ms || 25000);
  return fetch(CFG.apiUrl, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ fn: fn, args: args }), signal: ctrl ? ctrl.signal : undefined, redirect: 'follow' })
    .then(function (r) { if (!r.ok) throw new Error('Réponse ' + r.status + ' du serveur'); return r.json(); })
    .then(function (j) { if (!j.ok) { var e = new Error(j.error || 'Erreur du serveur'); e.code = j.code || ''; throw e; } return j.result; })
    .catch(function (e) {
      if (e.name === 'AbortError') e = new Error('Le serveur ne répond pas (délai dépassé)');
      else if (e instanceof TypeError) e = new Error(navigator.onLine === false ? 'Pas de réseau' : 'Serveur injoignable');
      throw e;
    })
    .finally(function () { clearTimeout(to); });
}

function scheduleFlush(ms) {
  clearTimeout(SYNC.timer);
  SYNC.timer = setTimeout(flush, ms);
}

function flush() {
  if (!configOk()) { SYNC.err = 'Appli non configurée : remplir config.js (adresse du script et code).'; SYNC.errCode = 'CONFIG'; notifySync(); return Promise.resolve(); }
  if (SYNC.busy) {
    if (Date.now() - SYNC.since < 40000) return Promise.resolve();
    SYNC.busy = false;                    // sécurité : un envoi bloqué ne bloque plus tout
  }
  SYNC.busy = true; SYNC.since = Date.now();
  var batch = OUTBOX.slice(0, 150);
  var ops = batch.map(function (o) { return o.op === 'put' ? { op: 'put', t: o.t, row: o.row } : { op: 'del', t: o.t, id: o.id }; });
  var t0 = Date.now();
  notifySync();
  return call('sync', [CFG.code, ops]).then(function (res) {
    SYNC.ms = Date.now() - t0;
    var results = res.results || [];
    batch.forEach(function (o, i) {
      var r = results[i];
      if (r) {
        o._try = (o._try || 0) + 1; o._err = r;
        if (o._try >= 3) { REJECTED.push(o); o._drop = true; }
      } else o._drop = true;
    });
    OUTBOX = OUTBOX.filter(function (o) { return !o._drop; });
    var db = tablesToDB(res.tables || {});
    OUTBOX.forEach(function (o) { applyLocal(db, o); });
    var sig = JSON.stringify(db);
    var changed = sig !== LAST_SIG;
    if (changed) { DB = db; LAST_SIG = sig; DBV++; }
    SYNC.err = ''; SYNC.errCode = ''; SYNC.retry = 0; SYNC.last = Date.now();
    SYNC.sheetUrl = res.sheetUrl || SYNC.sheetUrl; SYNC.version = res.version || SYNC.version;
    LS.set('lastSync', SYNC.last); LS.set('sheetUrl', SYNC.sheetUrl); LS.set('scriptVersion', SYNC.version);
    LOADED = true; LS.set('loaded', true);
    saveLocal();
    SYNC.busy = false;
    if (changed && window.onDataChange) window.onDataChange(false);
    if (OUTBOX.length && OUTBOX.some(function (o) { return !o._try; })) scheduleFlush(300);
    else if (OUTBOX.length) scheduleFlush(RETRY[0]);
  }).catch(function (e) {
    SYNC.busy = false;
    SYNC.err = e.message; SYNC.errCode = e.code || ''; SYNC.errAt = Date.now();
    if (e.code === 'CODE') SYNC.err = "Code d'accès refusé. L'appli envoie le code « " + CFG.code + " » : il doit être écrit exactement pareil dans CODE_ACCES du script, puis le script redéployé (Gérer les déploiements › Nouvelle version).";
    var d = e.code === 'BUSY' ? 1500 : RETRY[Math.min(SYNC.retry, RETRY.length - 1)];
    SYNC.retry++;
    scheduleFlush(d);
  }).then(notifySync);
}

function notifySync() { if (window.onSyncChange) window.onSyncChange(); }
function pendingSince() { return OUTBOX.length ? OUTBOX[0]._at : 0; }

function startSync() {
  LAST_SIG = JSON.stringify(DB);
  flush();
  setInterval(function () { if (document.visibilityState === 'visible') flush(); }, 30000);
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'visible') flush();
    else beacon();
  });
  window.addEventListener('online', function () { flush(); });
  window.addEventListener('pagehide', beacon);
}
function beacon() {
  if (!OUTBOX.length || !configOk() || !navigator.sendBeacon) return;
  try {
    var ops = OUTBOX.slice(0, 150).map(function (o) { return o.op === 'put' ? { op: 'put', t: o.t, row: o.row } : { op: 'del', t: o.t, id: o.id }; });
    navigator.sendBeacon(CFG.apiUrl, new Blob([JSON.stringify({ fn: 'sync', args: [CFG.code, ops] })], { type: 'text/plain;charset=utf-8' }));
  } catch (e) {}
}
function retryRejected() { REJECTED.forEach(function (o) { o._try = 0; delete o._drop; OUTBOX.push(o); }); REJECTED = []; saveLocal(); flush(); }
function dropRejected() { REJECTED = []; saveLocal(); notifySync(); }

/* ---------------- calculs (mémorisés tant que les données ne changent pas) ---------------- */

var MEMO = { v: -1 };
var collator = typeof Intl !== 'undefined' ? new Intl.Collator('fr', { sensitivity: 'base', numeric: true }) : null;
function cmp(a, b) { return collator ? collator.compare(a, b) : (a < b ? -1 : a > b ? 1 : 0); }
function norm(s) { return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ø/g, 'o').replace(/×/g, 'x'); }

function D() {
  if (MEMO.v === DBV) return MEMO;
  var M = { v: DBV };
  var vals = function (t) { return Object.keys(DB[t] || {}).map(function (k) { return DB[t][k]; }); };
  M.reg = {}; vals('Reglages').forEach(function (r) { M.reg[r.id] = r.valeur; });
  M.users = vals('Utilisateurs').sort(function (a, b) { return num(a.ordre) - num(b.ordre) || cmp(a.nom, b.nom); });
  M.usersActifs = M.users.filter(function (u) { return u.actif !== '0'; });
  M.user = {}; M.users.forEach(function (u) { M.user[u.id] = u; });
  M.fours = vals('Fournisseurs').sort(function (a, b) { return cmp(a.nom, b.nom); });
  M.foursActifs = M.fours.filter(function (f) { return f.actif !== '0'; });
  M.four = {}; M.fours.forEach(function (f) { M.four[f.id] = f; });
  M.fams = vals('Familles').sort(function (a, b) { return num(a.ordre) - num(b.ordre) || cmp(a.nom, b.nom); });
  M.fam = {}; M.fams.forEach(function (f) { M.fam[f.id] = f; });
  M.famOrder = {}; M.fams.forEach(function (f, i) { M.famOrder[f.id] = i; });
  M.allProds = vals('Produits');
  M.prod = {}; M.allProds.forEach(function (p) { M.prod[p.id] = p; });
  M.prods = M.allProds.filter(function (p) { return p.actif !== '0'; }).sort(function (a, b) { return cmp(a.nom, b.nom); });

  M.prix = {};
  vals('Prix').forEach(function (x) { (M.prix[x.produit] = M.prix[x.produit] || []).push(x); });
  Object.keys(M.prix).forEach(function (k) {
    M.prix[k].sort(function (a, b) {
      var pa = numOrNull(a.prix), pb = numOrNull(b.prix);
      if (pa === null && pb === null) return 0; if (pa === null) return 1; if (pb === null) return -1; return pa - pb;
    });
  });

  M.moves = vals('Mouvements').sort(function (a, b) { return a.date < b.date ? 1 : a.date > b.date ? -1 : 0; });
  M.stock = {}; M.movesBy = {};
  M.moves.forEach(function (m) {
    M.stock[m.produit] = round3((M.stock[m.produit] || 0) + num(m.delta));
    (M.movesBy[m.produit] = M.movesBy[m.produit] || []).push(m);
  });

  M.etat = {};
  M.alertes = []; M.zeros = []; M.nbSeuils = 0;
  M.prods.forEach(function (p) {
    var q = M.stock[p.id] || 0, s = num(p.seuil), e = 'ok';
    if (s > 0) { M.nbSeuils++; if (q <= s) e = q <= 0 ? 'rupt' : 'bas'; }
    else if (q <= 0) e = 'zero';
    M.etat[p.id] = e;
    if (e === 'rupt' || e === 'bas') M.alertes.push(p);
    if (q <= 0) M.zeros.push(p);
  });
  M.alertes.sort(function (a, b) { return ((M.stock[a.id] || 0) / (num(a.seuil) || 1)) - ((M.stock[b.id] || 0) / (num(b.seuil) || 1)); });

  // chantiers récents (sorties) et dernière utilisation des produits
  var seen = {}; M.chantiers = [];
  M.moves.forEach(function (m) {
    if (m.type === 'sortie' && m.lieu && !seen[norm(m.lieu)] && M.chantiers.length < 8) { seen[norm(m.lieu)] = 1; M.chantiers.push(m.lieu); }
  });

  M.alias = {}; vals('Alias').forEach(function (a) { M.alias[a.fournisseur + '|' + a.libelle] = a; });
  M.factures = vals('Factures').sort(function (a, b) { return (a.rangee || '') < (b.rangee || '') ? 1 : -1; });

  M.invEnCours = vals('Inventaires').filter(function (i) { return i.statut === 'en_cours'; }).sort(function (a, b) { return a.date < b.date ? 1 : -1; })[0] || null;
  M.invFinis = vals('Inventaires').filter(function (i) { return i.statut === 'termine'; }).sort(function (a, b) { return a.date < b.date ? 1 : -1; });
  M.comptes = {};
  if (M.invEnCours) vals('Comptages').forEach(function (c) { if (c.inventaire === M.invEnCours.id) M.comptes[c.produit] = c; });

  MEMO = M;
  return M;
}

function stockOf(pid) { return D().stock[pid] || 0; }
/** Stock d'un produit à une date (fin de journée incluse). */
function stockAt(pid, isoEnd) {
  var s = 0; (D().movesBy[pid] || []).forEach(function (m) { if (m.date <= isoEnd) s += num(m.delta); });
  return round3(s);
}
/** Prix de référence : celui du fournisseur habituel, sinon le moins cher connu. */
function prixRef(pid) {
  var M = D(), p = M.prod[pid], rows = M.prix[pid] || [];
  if (!p) return null;
  var main = rows.filter(function (x) { return x.fournisseur === p.four && numOrNull(x.prix) !== null; })[0];
  var best = main || rows.filter(function (x) { return numOrNull(x.prix) !== null; })[0];
  return best ? { prix: numOrNull(best.prix), four: best.fournisseur, row: best } : null;
}
function moinsCher(pid) {
  var rows = (D().prix[pid] || []).filter(function (x) { return numOrNull(x.prix) !== null; });
  return rows.length > 1 ? rows[0] : null;
}

/* ---------------- formats ---------------- */

function fq(n) {
  n = round3(num(n));
  var s = Math.abs(n % 1) < 1e-9 ? String(Math.round(n)) : String(Math.round(n * 100) / 100).replace('.', ',');
  return s.replace('-', '−');
}
function fe(n) {
  if (n === null || n === undefined) return '';
  return Number(n).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR', minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
var MOIS = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];
var JOURS = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
var MOIS_LONG = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
function parseIso(s) {
  var m = /^(\d{4})-(\d\d)-(\d\d)(?:T(\d\d):(\d\d)(?::(\d\d))?)?/.exec(s || '');
  if (!m) return null;
  return new Date(+m[1], +m[2] - 1, +m[3], +(m[4] || 0), +(m[5] || 0), +(m[6] || 0));
}
function fdate(iso) {
  var d = parseIso(iso); if (!d) return '';
  var t = new Date(); t.setHours(0, 0, 0, 0);
  var dd = new Date(d); dd.setHours(0, 0, 0, 0);
  var diff = Math.round((t - dd) / 864e5);
  var h = d.getHours() + 'h' + (d.getMinutes() < 10 ? '0' : '') + d.getMinutes();
  if (diff === 0) return "aujourd'hui " + h;
  if (diff === 1) return 'hier ' + h;
  return d.getDate() + ' ' + MOIS[d.getMonth()] + (d.getFullYear() !== t.getFullYear() ? ' ' + d.getFullYear() : '');
}
function fday(iso) { var d = parseIso(iso); if (!d) return ''; var z = function (x) { return (x < 10 ? '0' : '') + x; }; return z(d.getDate()) + '/' + z(d.getMonth() + 1) + '/' + d.getFullYear(); }
function todayIsoDate() { return nowIso().slice(0, 10); }
/** Format unique des noms de produits (saisie, voix, factures) : MAJUSCULES, espaces simples. */
function upName(s) { return String(s || '').replace(/\s+/g, ' ').trim().toLocaleUpperCase('fr-FR'); }
function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
