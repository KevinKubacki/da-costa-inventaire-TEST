/* Stock Da Costa — écrans de l'appli */
'use strict';

/* ================= icônes ================= */
var IC = {
  back: '<path d="M15 5l-7 7 7 7"/>', plus: '<path d="M5 12h14M12 5v14"/>', minus: '<path d="M5 12h14"/>',
  home: '<path d="M3 11l9-7 9 7"/><path d="M5 10v10h14V10"/>',
  stock: '<path d="M3 7l9-4 9 4-9 4-9-4z"/><path d="M3 12l9 4 9-4"/><path d="M3 17l9 4 9-4"/>',
  bell: '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10 21h4"/>',
  inv: '<path d="M9 4h6l1 2h3v15H5V6h3z"/><path d="M9 12l2 2 4-4"/>',
  eye: '<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/>', check: '<path d="M5 12l5 5 9-10"/>',
  x: '<path d="M6 6l12 12M18 6L6 18"/>', edit: '<path d="M4 20h4L19 9l-4-4L4 16z"/>',
  trash: '<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/>',
  gear: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
  phone: '<path d="M5 4h4l2 5-3 2a11 11 0 0 0 5 5l2-3 5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2"/>',
  mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/>',
  map: '<path d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11z"/><circle cx="12" cy="10" r="2.5"/>',
  truck: '<path d="M3 6h11v10H3zM14 9h4l3 3v4h-7"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/>',
  users: '<circle cx="9" cy="8" r="3.5"/><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6"/><path d="M16 4.5a3.5 3.5 0 0 1 0 7M21 20c0-2.6-1.6-4.8-4-5.6"/>',
  tag: '<path d="M3 12V4h8l10 10-8 8z"/><circle cx="7.5" cy="8.5" r="1.5"/>',
  sync: '<path d="M20 12a8 8 0 0 1-14 5.3M4 12a8 8 0 0 1 14-5.3"/><path d="M18 3v4h-4M6 21v-4h4"/>',
  file: '<path d="M6 3h9l4 4v14H6z"/><path d="M14 3v5h5"/><path d="M9 13h7M9 17h5"/>',
  share: '<path d="M12 3v12M7 8l5-5 5 5"/><path d="M5 13v7h14v-7"/>', download: '<path d="M12 4v11M7 10l5 5 5-5"/><path d="M5 20h14"/>',
  copy: '<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3"/>',
  chat: '<path d="M4 20l1.5-4A8 8 0 1 1 9 19z"/>',
  logout: '<path d="M15 4h4v16h-4M10 8l-4 4 4 4M6 12h11"/>',
  history: '<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5M12 7v5l3 3"/>',
  star: '<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z"/>',
  chev: '<path d="M9 5l7 7-7 7"/>', folder: '<path d="M3 6h6l2 2h10v11H3z"/>', box: '<path d="M3 7l9-4 9 4v10l-9 4-9-4z"/><path d="M3 7l9 4 9-4M12 11v10"/>',
  camera: '<path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/>',
  euro: '<path d="M18 6a7 7 0 1 0 0 12"/><path d="M4 10h10M4 14h10"/>', install: '<path d="M12 3v12M7 10l5 5 5-5"/><rect x="4" y="18" width="16" height="3" rx="1"/>'
};
function ic(n, cls) { return '<svg class="i ' + (cls || '') + '" viewBox="0 0 24 24" aria-hidden="true">' + (IC[n] || '') + '</svg>'; }

/* ================= état de l'appli ================= */
var VIEW = { r: 'boot', p: {} };
var ME = LS.get('user', null);
var PENDING_RENDER = false;
var INSTALL_EVT = null;
var root = document.getElementById('app');

function me() { var u = D().user[ME]; return u && u.actif !== '0' ? u : null; }
function isPatron() { var u = me(); return !!(u && u.role === 'patron'); }
function famName(id) { var f = D().fam[id]; return f ? f.nom : ''; }
function fourName(id) { var f = D().four[id]; return f ? f.nom : ''; }
function userName(id) { var u = D().user[id]; return u ? u.nom : (id ? '?' : ''); }
function initial(s) { return esc((String(s || '?').trim()[0] || '?').toUpperCase()); }

/* ================= navigation ================= */
function go(r, p, opt) {
  opt = opt || {};
  closeSheetDom();
  VIEW = { r: r, p: p || {} };
  try { if (opt.replace) history.replaceState({ r: r, p: VIEW.p }, ''); else history.pushState({ r: r, p: VIEW.p }, ''); } catch (e) {}
  render(true);
}
function saveView() { try { history.replaceState({ r: VIEW.r, p: VIEW.p }, ''); } catch (e) {} }
function back() { history.back(); }
window.addEventListener('popstate', function (e) {
  if (SHEET) { var after = SHEET.after; closeSheetDom(); if (after) after(); return; }
  var s = e.state;
  if (s && s.r) { VIEW = { r: s.r, p: s.p || {} }; render(true); }
  else { VIEW = { r: me() ? 'home' : 'login', p: {} }; saveView(); render(true); }
});

/* ================= rendu ================= */
/** Les barres marquées data-under-head restent collées juste sous l'en-tête (hauteur mesurée). */
function stickUnderHead() {
  var h = document.querySelector('.head'), els = document.querySelectorAll('[data-under-head]');
  if (!h || !els.length) return;
  var top = Math.round(h.getBoundingClientRect().height);
  for (var i = 0; i < els.length; i++) els[i].style.top = top + 'px';
}
window.addEventListener('resize', function () { stickUnderHead(); });
function isTyping() { var a = document.activeElement; return a && /^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName) && !SHEET; }

function render(top) {
  var y = window.scrollY;
  var fn = SCREENS[VIEW.r] || SCREENS.home;
  if (VIEW.r !== 'boot' && VIEW.r !== 'login' && !me()) { VIEW = { r: 'login', p: {} }; fn = SCREENS.login; saveView(); }
  document.body.classList.toggle('has-bar', false);
  root.innerHTML = (IS_TEST ? '<div class="testtag" aria-hidden="true">TEST</div>' : '') + fn(VIEW.p);
  stickUnderHead();
  PENDING_RENDER = false;
  document.body.classList.toggle('has-bar', !!root.querySelector('.bottom-bar'));
  window.scrollTo(0, top ? 0 : y);
  if (AFTER.length) { var a = AFTER; AFTER = []; a.forEach(function (f) { try { f(); } catch (e) {} }); }
}
var AFTER = [];

window.onDataChange = function (local) {
  if (local) return;
  migrateNames();
  if (VIEW.r === 'boot') { route0(); return; }
  if (isTyping() || SHEET) { PENDING_RENDER = true; return; }
  render(false);
};
window.onSyncChange = function () {
  if (VIEW.r === 'boot') { if (LOADED) route0(); else render(false); return; }
  var b = document.getElementById('syncbar');
  if (b) b.outerHTML = syncBar();
};
document.addEventListener('focusout', function () { setTimeout(function () { if (PENDING_RENDER && !isTyping() && !SHEET) render(false); }, 150); });

function route0() {
  if (!LOADED) { render(false); return; }
  VIEW = { r: me() ? 'home' : 'login', p: {} };
  saveView(); render(true);
}

/** Une seule fois : met les noms des produits existants au même format (MAJUSCULES). Fait par le téléphone du patron. */
function migrateNames() {
  if (!LOADED || !isPatron() || D().reg.nomsMaj === '1') return;
  var ops = [];
  D().allProds.forEach(function (p) { var n = upName(p.nom); if (n && n !== p.nom) ops.push(put('Produits', { id: p.id, nom: n })); });
  ops.push(put('Reglages', { id: 'nomsMaj', valeur: '1' }));
  commit(ops);
}

/* ================= briques d'écran ================= */
function head(o) {
  var h = '<header class="head ' + (o.cls || '') + '">' +
    '<div class="head-row">' + (o.back !== false ? '<button class="icon-btn back" data-a="' + (o.backAct || 'back') + '" aria-label="Retour">' + ic('back') + '</button>' : '') +
    '<h1>' + o.title + '</h1>' + (o.right || '') + '</div>' + (o.sub ? '<div class="sub">' + o.sub + '</div>' : '') + (o.extra || '') + '</header>';
  // o.below : bandeau (filtres) qui reste collé sous l'en-tête quand on fait défiler
  return o.below ? '<div class="stick">' + h + '<div class="stick-below">' + o.below + '</div></div>' : h;
}
function nav(cur) {
  var M = D(), n = M.alertes.length;
  var items = [['home', 'home', 'Accueil'], ['stock', 'stock', 'Stock'], ['commandes', 'bell', 'À commander']];
  items.push(isPatron() ? ['inventaire', 'inv', 'Inventaire'] : ['histo', 'history', 'Historique']);
  return '<nav class="nav">' + items.map(function (it) {
    return '<button class="' + (cur === it[0] ? 'on' : '') + '" data-a="nav" data-r="' + it[0] + '">' + ic(it[1]) + it[2] +
      (it[0] === 'commandes' && n ? '<span class="dot">' + n + '</span>' : '') + '</button>';
  }).join('') + '</nav>';
}
function syncBar() {
  var pend = OUTBOX.length, since = pendingSince();
  if (SYNC.errCode === 'CONFIG' || SYNC.errCode === 'CODE') return '<div id="syncbar" class="syncbar bad">' + ic('sync') + esc(SYNC.err) + '</div>';
  if (pend && Date.now() - since > 20000) return '<div id="syncbar" class="syncbar" data-a="go" data-r="reglages">' + ic('sync') +
    pend + ' modif' + (pend > 1 ? 's' : '') + ' pas encore envoyée' + (pend > 1 ? 's' : '') + (SYNC.err ? ' · ' + esc(SYNC.err) : ' · envoi en cours…') + '</div>';
  if (REJECTED.length) return '<div id="syncbar" class="syncbar bad" data-a="go" data-r="reglages">' + ic('sync') + REJECTED.length + ' modif refusée(s) par le Google Sheet : voir Réglages</div>';
  return '<div id="syncbar"></div>';
}
function pill(p) {
  var M = D(), q = M.stock[p.id] || 0, e = M.etat[p.id];
  return '<span class="pill ' + (e === 'ok' ? '' : e) + '">' + fq(q) + (p.unite ? '<small>' + esc(p.unite) + '</small>' : '') + '</span>';
}
function prodSub(p) {
  var M = D(), e = M.etat[p.id], s = [famName(p.famille)];
  if (p.four) s.push(fourName(p.four));
  if (isPatron()) { var pr = prixRef(p.id); if (pr) s.push(fe(pr.prix)); }
  if (e === 'bas') s.push('stock bas'); else if (e === 'rupt') s.push('rupture');
  return s.filter(Boolean).join(' · ');
}
function prodRow(p, act) {
  return '<button class="row" data-a="' + act + '" data-id="' + p.id + '"><div class="grow"><span class="t">' + esc(p.nom) +
    '</span><span class="s">' + esc(prodSub(p)) + '</span></div>' + pill(p) + '</button>';
}
function searchBox(key, ph, val) {
  return '<div class="search">' + ic('search') + '<input type="search" enterkeyhint="search" autocomplete="off" aria-label="Chercher" placeholder="' + esc(ph) +
    '" value="' + esc(val || '') + '" data-i="' + key + '"></div>';
}
function filterProds(q, f) {
  var M = D(), nq = norm(q || '').trim(), words = nq ? nq.split(/\s+/) : [];
  return M.prods.filter(function (p) {
    if (f === 'alert' && !(M.etat[p.id] === 'bas' || M.etat[p.id] === 'rupt')) return false;
    if (f === 'zero' && (M.stock[p.id] || 0) > 0) return false;
    if (f === 'noprice' && prixRef(p.id)) return false;
    if (f && f.indexOf('fam:') === 0 && p.famille !== f.slice(4)) return false;
    if (!words.length) return true;
    var hay = norm(p.nom + ' ' + p.ref + ' ' + famName(p.famille) + ' ' + (M.prix[p.id] || []).map(function (x) { return fourName(x.fournisseur) + ' ' + x.ref; }).join(' '));
    return words.every(function (w) { return hay.indexOf(w) >= 0; });
  });
}
function famChips(cur, act, extra) {
  var M = D(), chips = [['all', 'Tout']].concat(extra || []).concat(M.fams.map(function (f) { return ['fam:' + f.id, f.nom]; }));
  return '<div class="chips">' + chips.map(function (c) {
    var warn = c[0] === 'alert';
    return '<button class="chip ' + (warn ? 'warn ' : '') + ((cur || 'all') === c[0] ? 'on' : '') + '" data-a="' + act + '" data-f="' + c[0] + '">' + esc(c[1]) + '</button>';
  }).join('') + '</div>';
}
function stepper(act, key, val, label) {
  return '<div class="stepper"><button type="button" data-a="' + act + '" data-k="' + key + '" data-d="-1" aria-label="Moins">−</button>' +
    '<button type="button" class="v" data-a="' + act + 'Set" data-k="' + key + '" aria-label="' + esc(label || 'Saisir') + '">' + fq(val) + '</button>' +
    '<button type="button" data-a="' + act + '" data-k="' + key + '" data-d="1" aria-label="Plus">+</button></div>';
}
function mvBadge(m) {
  var d = num(m.delta), cls = m.type === 'sortie' ? 'out' : m.type === 'entree' ? 'in' : 'adj';
  return '<span class="mv ' + cls + '">' + (m.type === 'depart' ? '=' + fq(d) : (d > 0 ? '+' : '') + fq(d)) + '</span>';
}
function mvSub(m, withProd) {
  var s = [];
  if (m.qui) s.push(userName(m.qui));
  if (m.type === 'entree' && m.fournisseur) s.push(fourName(m.fournisseur));
  if (m.lieu) s.push(m.lieu);
  if (m.type === 'ajust') s.push('correction');
  if (m.type !== 'depart' || !m.lieu) s.push(fdate(m.date));
  return s.join(' · ');
}
function mvRow(m) {
  var p = D().prod[m.produit];
  return '<button class="line" data-a="mvInfo" data-id="' + m.id + '">' + mvBadge(m) + '<div class="grow"><span class="t ell">' + esc(p ? p.nom : 'Produit supprimé') +
    '</span><span class="s ell">' + esc(mvSub(m)) + '</span></div></button>';
}

/* ================= feuilles, confirmations, messages ================= */
var SHEET = null;
function openSheet(html, opt) {
  closeSheetDom();
  var ov = document.createElement('div');
  ov.className = 'overlay';
  ov.innerHTML = '<div class="sheet" role="dialog" aria-modal="true"><div class="grab"></div>' + html + '</div>';
  ov.addEventListener('click', function (e) { if (e.target === ov) closeSheet(); });
  document.body.appendChild(ov);
  SHEET = { el: ov, onClose: opt && opt.onClose };
  var tst = document.querySelector('.toast'); if (tst) tst.classList.add('top');   // ne pas cacher les boutons de la fenêtre
  try { history.pushState({ r: VIEW.r, p: VIEW.p, sheet: 1 }, ''); } catch (e) {}
  var f = ov.querySelector('[autofocus]'); if (f) setTimeout(function () { f.focus(); if (f.select) f.select(); }, 60);
  return ov;
}
function closeSheetDom() {
  if (!SHEET) return;
  var s = SHEET; SHEET = null;
  s.el.remove();
  if (s.onClose) s.onClose();
  if (PENDING_RENDER) setTimeout(function () { render(false); }, 0);
}
function closeSheet(after) { if (!SHEET) { if (after) after(); return; } SHEET.after = after || null; history.back(); }

function ask(o) {
  return new Promise(function (resolve) {
    var done = false;
    openSheet('<h3>' + esc(o.title) + '</h3>' + (o.text ? '<p>' + o.text + '</p>' : '') +
      '<div class="btn-row"><button class="btn light" data-a="askNo">' + esc(o.no || 'Annuler') + '</button>' +
      '<button class="btn ' + (o.danger ? 'red' : '') + '" data-a="askYes" style="font-size:18px">' + esc(o.ok || 'OK') + '</button></div>',
      { onClose: function () { if (!done) resolve(false); } });
    A.askYes = function () { done = true; closeSheet(function () { resolve(true); }); };
    A.askNo = function () { closeSheet(); };
  });
}
function askText(o) {
  return new Promise(function (resolve) {
    var done = false;
    openSheet('<h3>' + esc(o.title) + '</h3>' + (o.text ? '<p>' + esc(o.text) + '</p>' : '') +
      '<form data-f="askOk"><input class="inp" id="askIn" autofocus autocomplete="off" ' + (o.type ? 'type="' + o.type + '" ' : '') + (o.mode ? 'inputmode="' + o.mode + '" ' : '') +
      'value="' + esc(o.value || '') + '" placeholder="' + esc(o.placeholder || '') + '" aria-label="' + esc(o.title) + '">' +
      '<div class="btn-row" style="margin-top:14px"><button type="button" class="btn light" data-a="askNo">Annuler</button><button class="btn" style="font-size:18px">' + esc(o.ok || 'OK') + '</button></div></form>',
      { onClose: function () { if (!done) resolve(null); } });
    A.askNo = function () { closeSheet(); };
    F.askOk = function () { var v = document.getElementById('askIn').value; done = true; closeSheet(function () { resolve(v); }); };
  });
}
function askNumber(o) {
  return askText({ title: o.title, text: o.text, value: o.value === undefined ? '' : fq(o.value).replace('−', '-'), mode: 'decimal', ok: o.ok }).then(function (v) {
    if (v === null) return null; var n = numOrNull(v); return n === null ? null : n;
  });
}
var TOAST_T = null;
function toast(title, sub, undo) {
  var old = document.querySelector('.toast'); if (old) old.remove();
  var t = document.createElement('div'); t.className = 'toast' + (SHEET ? ' top' : ''); t.setAttribute('role', 'status');
  t.innerHTML = ic('check') + '<div class="grow"><b>' + esc(title) + '</b>' + (sub ? '<span>' + esc(sub) + '</span>' : '') + '</div>' + (undo ? '<button>Annuler</button>' : '');
  if (undo) t.querySelector('button').onclick = function () { t.remove(); undo(); };
  document.body.appendChild(t);
  clearTimeout(TOAST_T); TOAST_T = setTimeout(function () { t.remove(); }, undo ? 6000 : 3000);
}

/* ================= événements ================= */
var A = {}, I = {}, C = {}, F = {};
document.addEventListener('click', function (e) {
  var el = e.target.closest('[data-a]');
  if (!el || el.disabled) return;
  var fn = A[el.dataset.a];
  if (fn) { e.preventDefault(); fn(el.dataset, el, e); }
});
document.addEventListener('input', function (e) { var el = e.target.closest('[data-i]'); if (el && I[el.dataset.i]) I[el.dataset.i](el.value, el, e); });
document.addEventListener('change', function (e) { var el = e.target.closest('[data-c]'); if (el && C[el.dataset.c]) C[el.dataset.c](el.value, el, e); });
document.addEventListener('submit', function (e) { var el = e.target.closest('[data-f]'); if (el) { e.preventDefault(); if (F[el.dataset.f]) F[el.dataset.f](el); } });

A.back = function () { back(); };
A.nav = function (d) { if (VIEW.r === d.r) { window.scrollTo(0, 0); return; } go(d.r, {}, { replace: VIEW.r !== 'home' }); };
A.go = function (d) { go(d.r, d.id ? { id: d.id } : {}); };
A.retry = function () { flush(); render(false); };

/* ================= démarrage / connexion ================= */
var SCREENS = {};

SCREENS.boot = function () {
  var err = SYNC.err && !SYNC.busy;
  return '<div class="loading"><img src="icons/logo-blanc.png" alt="EURL Da Costa">' +
    (err ? '<div style="font-size:17px;font-weight:700">Connexion au Google Sheet impossible</div><div style="color:var(--on-navy)">' + esc(SYNC.err) + '</div>' +
      '<button class="btn light" style="max-width:260px" data-a="retry">Réessayer</button>'
      : '<div class="spin"></div><div>Connexion au Google Sheet…</div>') + '</div>';
};

SCREENS.login = function (p) {
  var M = D();
  if (p.uid && M.user[p.uid]) {
    var u = M.user[p.uid], step = p.step || (u.pin ? 'enter' : 'new');
    var title = step === 'enter' ? 'Ton code' : step === 'new' ? 'Choisis ton code' : 'Retape ton code';
    var help = step === 'new' ? '4 chiffres, à retenir. Il sera demandé une seule fois sur ce téléphone.' : step === 'confirm' ? 'Pour être sûr de ne pas s\'être trompé.' : '';
    var dots = ''; for (var i = 0; i < 4; i++) dots += '<i class="' + ((p.code || '').length > i ? 'f' : '') + '"></i>';
    var keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'back', '0', 'del'];
    return '<div class="login"><div style="display:flex;align-items:center;gap:12px"><button class="icon-btn back" data-a="loginBack" aria-label="Retour">' + ic('back') + '</button>' +
      '<div class="who" style="border:0;background:none;padding:0"><span class="av ' + (u.role === 'patron' ? '' : 's') + '">' + initial(u.nom) + '</span><div><b>' + esc(u.nom) + '</b></div></div></div>' +
      '<h1>' + title + '</h1><p>' + help + '</p><div class="dots ' + (p.shake ? 'shake' : '') + '">' + dots + '</div><div class="err">' + esc(p.err || '') + '</div>' +
      '<div class="pad">' + keys.map(function (k) {
        if (k === 'back') return '<button class="ghost" data-a="loginBack">Retour</button>';
        if (k === 'del') return '<button class="ghost" data-a="pinDel" aria-label="Effacer">⌫</button>';
        return '<button data-a="pinKey" data-k="' + k + '">' + k + '</button>';
      }).join('') + '</div>' +
      (step === 'enter' ? '<p style="margin-top:8px;font-size:13px">Code oublié ? ' + (u.role === 'patron' ? 'Efface la case « pin » de ta ligne dans l\'onglet Utilisateurs du Google Sheet.' : 'Demande au patron de le réinitialiser (Réglages › Équipe).') + '</p>' : '') +
      '</div>';
  }
  var users = M.usersActifs;
  return '<div class="login"><img class="logo" src="icons/logo-blanc.png" alt="EURL Da Costa, couverture zinguerie">' +
    '<h1>Qui es-tu ?</h1><p>Choix fait une seule fois sur ce téléphone</p>' +
    users.map(function (u) {
      return '<button class="who" data-a="pickUser" data-id="' + u.id + '"><span class="av ' + (u.role === 'patron' ? '' : 's') + '">' + initial(u.nom) +
        '</span><span style="flex:1"><b>' + esc(u.nom) + '</b><span>' + (u.role === 'patron' ? 'Patron · tout l\'accès' : 'Salarié · entrées et sorties') + '</span></span>' + ic('chev') + '</button>';
    }).join('') +
    (users.length ? '' : '<p>Aucun utilisateur dans le Google Sheet (onglet Utilisateurs).</p>') +
    installBtn() + '</div>';
};
function installBtn() {
  if (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) return '';
  if (INSTALL_EVT) return '<button class="btn light" style="margin-top:auto" data-a="install">' + ic('install') + 'Installer l\'appli sur ce téléphone</button>';
  if (/iphone|ipad/i.test(navigator.userAgent)) return '<p style="margin-top:auto;font-size:13px">Pour l\'installer : bouton Partager de Safari, puis « Sur l\'écran d\'accueil ».</p>';
  return '';
}
window.addEventListener('beforeinstallprompt', function (e) { e.preventDefault(); INSTALL_EVT = e; if (VIEW.r === 'login') render(false); });
A.install = function () { if (!INSTALL_EVT) return; INSTALL_EVT.prompt(); INSTALL_EVT.userChoice.then(function () { INSTALL_EVT = null; render(false); }); };

A.pickUser = function (d) { VIEW.p = { uid: d.id, code: '' }; saveView(); render(false); };
A.loginBack = function () { VIEW.p = {}; saveView(); render(false); };
A.pinDel = function () { VIEW.p.code = (VIEW.p.code || '').slice(0, -1); VIEW.p.err = ''; VIEW.p.shake = false; render(false); };
A.pinKey = function (d) {
  var p = VIEW.p, u = D().user[p.uid]; if (!u) return;
  p.shake = false; p.err = '';
  p.code = ((p.code || '') + d.k).slice(0, 4);
  if (p.code.length < 4) { render(false); return; }
  var step = p.step || (u.pin ? 'enter' : 'new');
  if (step === 'enter') {
    if (p.code === String(u.pin)) return loginAs(u.id);
    p.code = ''; p.err = 'Code incorrect'; p.shake = true;
  } else if (step === 'new') { p.first = p.code; p.code = ''; p.step = 'confirm'; }
  else {
    if (p.code === p.first) { commit(put('Utilisateurs', { id: u.id, pin: p.code })); return loginAs(u.id); }
    p.code = ''; p.step = 'new'; p.err = 'Les deux codes ne sont pas pareils, recommence.'; p.shake = true;
  }
  render(false);
};
function loginAs(id) { ME = id; LS.set('user', id); migrateNames(); go('home', {}, { replace: true }); if (window.afterLogin) window.afterLogin(); }

/* ================= accueil ================= */
SCREENS.home = function () {
  var M = D(), u = me(), patron = isPatron();
  var d = new Date();
  var recent = M.moves.filter(function (m) { return m.type !== 'depart' || m.qui; }).slice(0, 5);
  var html = '<div class="screen"><header class="head home-head"><div class="brand"><img src="icons/toit-blanc.png" alt="">' +
    '<div><b>' + esc((M.reg.entreprise || 'Da Costa').replace(/^EURL\s+/i, '').toUpperCase()) + '</b><span>Stock atelier</span></div>' +
    '<button class="gear" data-a="go" data-r="reglages" aria-label="Réglages">' + ic('gear') + '</button></div>' +
    '<div class="hello">Salut ' + esc(u.nom) + '</div><div class="sub">' + JOURS[d.getDay()] + ' ' + d.getDate() + ' ' + MOIS_LONG[d.getMonth()] + ' · qu\'est-ce que tu fais ?</div></header>' +
    '<div class="big-actions"><button class="big out" data-a="startMv" data-m="S">' + ic('minus') + '<div><b>SORTIE</b><span>Je prends du matériel</span></div></button>' +
    '<button class="big in" data-a="startMv" data-m="E">' + ic('plus') + '<div><b>ENTRÉE</b><span>Je range une livraison</span></div></button></div>' +
    syncBar() + '<div class="scroll">' +
    '<div class="tiles"><button class="tile" data-a="nav" data-r="stock"><b>' + M.prods.length + '</b><span>produits</span></button>' +
    '<button class="tile ' + (M.alertes.length ? 'warn' : '') + '" data-a="nav" data-r="commandes"><b>' + M.alertes.length + '</b><span>à commander</span></button>' +
    '<button class="tile ' + (M.zeros.length ? 'bad' : '') + '" data-a="stockFilter" data-f="zero"><b>' + M.zeros.length + '</b><span>à zéro</span></button></div>';
  if (patron && M.nbSeuils === 0) html += '<div class="hint"><b>Astuce :</b> règle le seuil d\'alerte des produits que tu rachètes souvent (fiche produit › Seuil d\'alerte). L\'appli te dira quand en recommander.</div>';
  if (M.alertes.length) {
    html += '<div class="card"><div class="card-title"><h2>À commander bientôt</h2><button class="link" data-a="nav" data-r="commandes">Tout voir</button></div>' +
      M.alertes.slice(0, 3).map(function (p) {
        var e = M.etat[p.id];
        return '<button class="line" data-a="openProd" data-id="' + p.id + '"><div class="grow"><span class="t ell">' + esc(p.nom) + '</span></div><span class="badge ' + e + '">' +
          fq(M.stock[p.id] || 0) + ' / ' + fq(p.seuil) + '</span></button>';
      }).join('') + '</div>';
  }
  html += '<div class="sec-title"><span>Derniers mouvements</span><button class="link" data-a="go" data-r="histo">Tout voir</button></div>' +
    '<div class="card" style="padding-top:4px;padding-bottom:4px">' + (recent.length ? recent.map(mvRow).join('') : '<div class="empty">Aucune entrée ni sortie depuis l\'inventaire du 30/09/2026.<br>Appuie sur SORTIE ou ENTRÉE pour commencer.</div>') + '</div>' +
    '</div>' + nav('home') + '</div>';
  return html;
};
A.menu = function () {
  var u = me();
  openSheet('<h3>' + esc(u.nom) + '</h3><p>' + (u.role === 'patron' ? 'Patron' : 'Salarié') + '</p>' +
    (isPatron() ? '<button class="menu-item" data-a="sheetGo" data-r="reglages">' + ic('gear') + 'Réglages</button>' : '') +
    '<button class="menu-item" data-a="sheetGo" data-r="histo">' + ic('history') + 'Historique des mouvements</button>' +
    '<button class="menu-item" data-a="sheetGo" data-r="fours">' + ic('truck') + 'Fournisseurs</button>' +
    (isPatron() ? '' : '<button class="menu-item" data-a="sheetGo" data-r="reglages">' + ic('sync') + 'Synchronisation</button>') +
    '<button class="menu-item" data-a="logout">' + ic('logout') + 'Changer d\'utilisateur</button>');
};
A.sheetGo = function (d) { closeSheet(function () { go(d.r, {}); }); };
A.logout = function () {
  closeSheet(function () { ME = null; LS.del('user'); go('login', {}, { replace: true }); });
};
A.stockFilter = function (d) { go('stock', { f: d.f }); };
A.openProd = function (d) { go('prod', { id: d.id }); };

/* ================= stock ================= */
SCREENS.stock = function (p) {
  var M = D(), list = filterProds(p.q, p.f), patron = isPatron();
  var extra = [['alert', 'À commander'], ['zero', 'À zéro']];
  if (patron) extra.push(['noprice', 'Sans prix']);
  return '<div class="screen">' + head({ back: false, title: 'Stock', right: '<span class="sub" id="pcount">' + list.length + ' produit' + (list.length > 1 ? 's' : '') + '</span>',
    extra: searchBox('q', 'Chercher : coude, Ø100, volige, CMO…', p.q), below: famChips(p.f, 'filt', extra) }) + syncBar() +
    '<div class="scroll" style="padding-top:4px">' + valeurBanner() + '<div class="list" id="plist">' + prodList(list, 'openProd') + '</div></div>' +
    (patron ? '<button class="fab" data-a="newProd">' + ic('plus') + 'Produit</button>' : '') + nav('stock') + '</div>';
};
function prodList(list, act) {
  if (!list.length) return '<div class="empty">Aucun produit trouvé</div>';
  var out = list.slice(0, 250).map(function (p) { return prodRow(p, act); }).join('');
  if (list.length > 250) out += '<div class="empty">… affine ta recherche pour voir les autres</div>';
  return out;
}
I.q = function (v) {
  VIEW.p.q = v; saveView();
  var list = filterProds(v, VIEW.p.f), el = document.getElementById('plist');
  if (el) el.innerHTML = prodList(list, VIEW.r === 'pick' ? 'pickProd' : 'openProd');
  var c = document.getElementById('pcount'); if (c) c.textContent = list.length + ' produit' + (list.length > 1 ? 's' : '');
  var r = document.getElementById('recents'); if (r) r.style.display = v ? 'none' : '';
};
A.filt = function (d) { VIEW.p.f = d.f === 'all' ? '' : d.f; saveView(); render(false); };
A.newProd = function () {
  var f = VIEW.p.f && VIEW.p.f.indexOf('fam:') === 0 ? VIEW.p.f.slice(4) : '';
  go('edit', { f: newForm(f) });
};

/* ================= sortie / entrée ================= */
A.startMv = function (d) { go('pick', { mode: d.m }); };
SCREENS.pick = function (p) {
  var M = D(), S = p.mode === 'S';
  var mine = [], seen = {};
  M.moves.forEach(function (m) {
    if (mine.length >= 6 || seen[m.produit] || m.qui !== ME || (m.type !== 'sortie' && m.type !== 'entree')) return;
    var pr = M.prod[m.produit]; if (!pr || pr.actif === '0') return;
    seen[m.produit] = 1; mine.push(pr);
  });
  var list = filterProds(p.q, p.f);
  return '<div class="screen">' + head({ cls: S ? 'red' : 'green', title: 'Quel produit ?', backAct: 'pickBack',
    right: p.done ? '<button class="small-btn" data-a="pickDone" style="background:#fff;border:0;color:' + (S ? 'var(--red)' : 'var(--green)') + ';height:44px;font-size:16px">Terminé</button>' : '',
    extra: '<div class="seg"><button class="' + (S ? 'on' : '') + '" data-a="pickMode" data-m="S">− Sortie</button><button class="' + (S ? '' : 'on') + '" data-a="pickMode" data-m="E">+ Entrée</button></div>' +
      searchBox('q', 'Chercher un produit…', p.q), below: famChips(p.f, 'filt') }) + syncBar() +
    '<div class="scroll">' + (!S && !p.done ? '<button class="row" style="border:2px solid var(--green);margin-bottom:12px" data-a="go" data-r="facture"><span class="mv in" style="width:44px;height:44px">' + ic('camera') + '</span><div class="grow"><span class="t">Ranger une facture</span><span class="s">Photo ou PDF : l\'appli lit les lignes pour toi</span></div>' + ic('chev') + '</button>' : '') +
    (p.done ? '<div class="done-banner">' + ic('check') + '<span>' + esc(p.done) + '<br><span style="font-weight:500">Un autre produit ? Sinon appuie sur Terminé.</span></span></div>' : '') +
    (mine.length && !p.q && !p.f ? '<div id="recents"><div class="sec-title" style="margin-top:0"><span>Mes derniers produits</span></div><div class="list">' + mine.map(function (x) { return prodRow(x, 'pickProd'); }).join('') + '</div><div class="sec-title"><span>Tous les produits</span></div></div>' : '') +
    '<div class="list" id="plist">' + prodList(list, 'pickProd') + '</div></div></div>';
};
A.pickMode = function (d) { VIEW.p.mode = d.m; VIEW.p.done = ''; saveView(); render(false); };
A.pickBack = function () { back(); };
A.pickDone = function () { go('home', {}, { replace: true }); };
A.pickProd = function (d) {
  var p = VIEW.p;
  go('mvt', { mode: p.mode, pid: d.id, n: 1, lieu: p.lieu || '', four: '', from: 'pick', q: p.q || '', f: p.f || '' }, { replace: true });
};

SCREENS.mvt = function (p) {
  var M = D(), S = p.mode === 'S', pr = M.prod[p.pid], patron = isPatron();
  if (!pr) return SCREENS.home();
  var q = M.stock[pr.id] || 0, n = p.n || 0, after = round3(S ? q - n : q + n);
  if (!S && p.four === undefined) p.four = '';
  if (!S && !p.four && !p.fourSet) { p.four = pr.four || (M.prix[pr.id] && M.prix[pr.id][0] ? M.prix[pr.id][0].fournisseur : ''); p.fourSet = true; prefillPrix(p); }
  var backAct = p.from === 'pick' ? 'mvBack' : 'back';
  var html = '<div class="screen">' + head({ cls: S ? 'red' : 'green', title: S ? 'Je prends du matériel' : 'Je range du matériel', backAct: backAct,
    extra: '<div class="seg"><button class="' + (S ? 'on' : '') + '" data-a="mvMode" data-m="S">− Sortie</button><button class="' + (S ? '' : 'on') + '" data-a="mvMode" data-m="E">+ Entrée</button></div>' }) +
    '<div class="scroll nonav">' +
    '<button class="prod-card" data-a="' + backAct + '"><div class="grow"><span class="t">' + esc(pr.nom) + '</span><span class="s">' + esc(famName(pr.famille)) + ' · en stock : ' + fq(q) + (pr.unite ? ' ' + esc(pr.unite) : '') + '</span></div><span class="link">Changer</span></button>' +
    '<div class="qty-card"><span style="font-size:15px;font-weight:600;color:var(--muted)">Combien' + (pr.unite ? ' (' + esc(pr.unite) + ')' : '') + ' ?</span>' +
    '<div class="qty"><button class="rnd" data-a="mvN" data-d="-1" aria-label="Un de moins">' + ic('minus') + '</button>' +
    '<button class="n" data-a="mvNSet" aria-label="Saisir la quantité">' + fq(n) + '</button>' +
    '<button class="rnd" data-a="mvN" data-d="1" aria-label="Un de plus">' + ic('plus') + '</button></div>' +
    '<div class="quick">' + [5, 10, 20].map(function (k) { return '<button data-a="mvN" data-d="' + k + '">+' + k + '</button>'; }).join('') + '</div>' +
    '<span class="after ' + (after < 0 ? 'neg' : '') + '">' + (after < 0 ? 'Il n\'en reste que ' + fq(q) + ' !' : (S ? 'Il en restera ' : 'Il y en aura ') + fq(after)) + '</span></div>';
  if (S) {
    html += '<div class="field"><label for="lieu">Pour quel chantier ? <span class="help">(facultatif)</span></label>' +
      '<input id="lieu" class="inp" data-i="lieu" autocomplete="off" placeholder="ex. Chantier Martin, Ladon" value="' + esc(p.lieu || '') + '">' +
      (M.chantiers.length ? '<div class="chips wrap">' + M.chantiers.slice(0, 6).map(function (c) { return '<button class="chip ' + (c === p.lieu ? 'on' : '') + '" data-a="mvLieu" data-v="' + esc(c) + '">' + esc(c) + '</button>'; }).join('') + '</div>' : '') + '</div>';
  } else {
    var known = (M.prix[pr.id] || []).map(function (x) { return x.fournisseur; });
    var fours = M.foursActifs.slice().sort(function (a, b) { return (known.indexOf(b.id) >= 0) - (known.indexOf(a.id) >= 0); });
    html += '<div class="field"><span class="flabel">Ça vient d\'où ?</span><div class="chips wrap">' +
      fours.map(function (f) { return '<button class="chip ' + (p.four === f.id ? 'on' : '') + '" data-a="mvFour" data-v="' + f.id + '">' + esc(f.nom) + '</button>'; }).join('') +
      '<button class="chip ' + (p.four === 'retour' ? 'on' : '') + '" data-a="mvFour" data-v="retour">Retour de chantier</button></div></div>';
    if (patron && p.four && p.four !== 'retour') {
      html += '<div class="field"><label for="prix">Prix d\'achat HT à l\'unité <span class="help">(facultatif)</span></label>' +
        '<input id="prix" class="inp" data-i="mvPrix" inputmode="decimal" autocomplete="off" placeholder="ex. 12,50" value="' + esc(p.prix || '') + '">' +
        (p.prixInfo ? '<span class="help">' + esc(p.prixInfo) + '</span>' : '') + '</div>';
    }
  }
  html += '</div><div class="bottom-bar"><button class="btn ' + (S ? 'red' : 'green') + '" data-a="saveMvt" ' + (n > 0 ? '' : 'disabled') + ' style="height:62px;font-size:23px">' +
    (S ? 'Valider la sortie de ' : 'Valider l\'entrée de ') + fq(n) + '</button></div></div>';
  return html;
};
function prefillPrix(p) {
  var row = (D().prix[p.pid] || []).filter(function (x) { return x.fournisseur === p.four; })[0];
  p.prix = row && numOrNull(row.prix) !== null ? fq(row.prix) : '';
  p.prixInfo = row && numOrNull(row.prix) !== null ? 'Dernier prix connu chez ' + fourName(p.four) + (row.maj ? ' (' + fday(row.maj) + ')' : '') : '';
}
A.mvBack = function () { var p = VIEW.p; go('pick', { mode: p.mode, lieu: p.lieu || '', q: p.q || '', f: p.f || '' }, { replace: true }); };
A.mvMode = function (d) { VIEW.p.mode = d.m; saveView(); render(false); };
A.mvN = function (d) { VIEW.p.n = Math.max(0, round3((VIEW.p.n || 0) + num(d.d))); saveView(); render(false); };
A.mvNSet = function () { askNumber({ title: 'Quantité', value: VIEW.p.n }).then(function (v) { if (v !== null && v >= 0) { VIEW.p.n = round3(v); saveView(); render(false); } }); };
I.lieu = function (v) { VIEW.p.lieu = v; saveView(); };
A.mvLieu = function (d) { VIEW.p.lieu = VIEW.p.lieu === d.v ? '' : d.v; saveView(); render(false); };
A.mvFour = function (d) { VIEW.p.four = VIEW.p.four === d.v ? '' : d.v; prefillPrix(VIEW.p); saveView(); render(false); };
I.mvPrix = function (v) { VIEW.p.prix = v; saveView(); };
A.saveMvt = function () {
  var p = VIEW.p, M = D(), pr = M.prod[p.pid], S = p.mode === 'S', n = p.n || 0;
  if (!pr || !(n > 0)) return;
  var q = M.stock[pr.id] || 0;
  var doit = function () {
    var id = uid('m'), four = !S && p.four && p.four !== 'retour' ? p.four : '';
    var prix = !S && isPatron() && four ? numOrNull(p.prix) : null;
    var ops = [put('Mouvements', { id: id, date: nowIso(), produit: pr.id, delta: String(S ? -n : n), type: S ? 'sortie' : 'entree', qui: ME,
      lieu: S ? (p.lieu || '').trim() : (p.four === 'retour' ? 'Retour de chantier' : ''), fournisseur: four, prix: prix === null ? '' : String(prix), note: '' })];
    if (four) {
      var ex = (M.prix[pr.id] || []).filter(function (x) { return x.fournisseur === four; })[0];
      if (prix !== null) ops.push(put('Prix', { id: ex ? ex.id : uid('x'), produit: pr.id, fournisseur: four, prix: String(prix), ref: ex ? ex.ref : '', maj: nowIso() }));
      else if (!ex) ops.push(put('Prix', { id: uid('x'), produit: pr.id, fournisseur: four, prix: '', ref: '', maj: '' }));
      if (!pr.four) ops.push(put('Produits', { id: pr.id, four: four }));
    }
    commit(ops);
    var after = stockOf(pr.id);
    var msg = (S ? '−' : '+') + fq(n) + ' ' + pr.nom;
    toast(msg, 'Stock : ' + fq(after), function () { commit(del('Mouvements', id)); toast('Annulé', pr.nom); render(false); });
    if (p.from === 'prod') { back(); return; }
    go('pick', { mode: p.mode, lieu: p.lieu || '', done: msg + ' · stock : ' + fq(after) }, { replace: true });
  };
  if (S && n > q) {
    ask({ title: 'Stock insuffisant ?', text: 'L\'appli n\'en compte que <b>' + fq(q) + '</b>. Valider quand même ? Le stock passera à ' + fq(q - n) + '.', ok: 'Valider quand même' })
      .then(function (ok) { if (ok) doit(); });
  } else doit();
};

/* ================= fiche produit ================= */
SCREENS.prod = function (p) {
  var M = D(), pr = M.prod[p.id], patron = isPatron();
  if (!pr) return '<div class="screen">' + head({ title: 'Produit introuvable' }) + '<div class="empty">Ce produit a été supprimé.</div></div>';
  var q = M.stock[pr.id] || 0, e = M.etat[pr.id], seuil = num(pr.seuil);
  var badge = e === 'rupt' ? '<span class="badge rupt">Rupture · seuil ' + fq(seuil) + '</span>' : e === 'bas' ? '<span class="badge bas" style="background:#FFE0B8;color:#7A3D00">Stock bas · seuil ' + fq(seuil) + '</span>' :
    seuil > 0 ? '<span class="badge ok">Seuil d\'alerte : ' + fq(seuil) + '</span>' : '';
  var prix = M.prix[pr.id] || [], cheap = moinsCher(pr.id);
  var moves = (M.movesBy[pr.id] || []).slice(0, 15);
  var run = q, hist = moves.map(function (m) {
    var s = run; run = round3(run - num(m.delta));
    return '<button class="line" data-a="mvInfo" data-id="' + m.id + '">' + mvBadge(m) + '<div class="grow"><span class="t ell">' + esc(m.type === 'depart' ? 'Stock de départ' : m.type === 'ajust' ? 'Correction du stock' : m.type === 'sortie' ? (m.lieu || 'Sortie') : (fourName(m.fournisseur) || m.lieu || 'Entrée')) +
      '</span><span class="s ell">' + esc([userName(m.qui), fdate(m.date)].filter(Boolean).join(' · ')) + '</span></div><span class="s" style="color:var(--muted);font-size:14px">→ ' + fq(s) + '</span></button>';
  }).join('');
  var html = '<div class="screen"><header class="head" style="padding-bottom:30px"><div class="head-row"><button class="icon-btn back" data-a="back" aria-label="Retour">' + ic('back') + '</button><span style="flex:1"></span>' +
    (patron ? '<button class="icon-btn" data-a="editProd" aria-label="Modifier">' + ic('edit') + '</button>' : '') + '</div>' +
    '<div class="sub" style="font-weight:600;letter-spacing:.04em">' + esc([famName(pr.famille), fourName(pr.four)].filter(Boolean).join(' · ').toUpperCase()) + '</div>' +
    '<h1 style="font-size:29px">' + esc(pr.nom) + '</h1>' +
    '<div class="big-qty"><b>' + fq(q) + '</b><div class="grow"><span class="sub">' + esc(pr.unite || 'en stock') + (pr.unite ? ' en stock' : '') + '</span>' + badge + '</div></div></header>' +
    '<div class="scroll" style="padding-top:0"><div class="over-actions"><button style="background:var(--red)" data-a="prodMv" data-m="S">− Sortie</button><button style="background:var(--green)" data-a="prodMv" data-m="E">+ Entrée</button></div>' +
    '<div class="card"><div class="kv"><span style="display:flex;flex-direction:column"><span style="color:var(--ink);font-weight:600">Seuil d\'alerte</span><span style="font-size:13px">' +
    (seuil > 0 ? 'Alerte quand il en reste ' + fq(seuil) + ' ou moins' : 'Pas d\'alerte pour ce produit') + '</span></span>' +
    (patron ? stepper('seuil', 'seuil', seuil, 'Saisir le seuil') : '<b>' + fq(seuil) + '</b>') + '</div>' +
    (pr.ref ? '<div class="kv"><span>Référence</span><span>' + esc(pr.ref) + '</span></div>' : '') +
    (pr.unite ? '<div class="kv"><span>Compté en</span><span>' + esc(pr.unite) + '</span></div>' : '') +
    (pr.notes ? '<div class="kv"><span>Notes</span><span style="white-space:pre-line">' + esc(pr.notes) + '</span></div>' : '') + '</div>';
  html += '<div class="sec-title"><span>Fournisseurs' + (patron ? ' et prix' : '') + '</span>' + (patron ? '<button class="link" data-a="editProd">Modifier</button>' : '') + '</div><div class="card" style="padding-top:4px;padding-bottom:4px">' +
    (prix.length ? prix.map(function (x) {
      var main = x.fournisseur === pr.four, pp = numOrNull(x.prix);
      return '<button class="line" data-a="openFour" data-id="' + x.fournisseur + '"><div class="grow"><span class="t">' + esc(fourName(x.fournisseur) || '?') + (main ? ' <span class="badge navy">habituel</span>' : '') +
        (patron && cheap && cheap.id === x.id ? ' <span class="badge ok">moins cher</span>' : '') + '</span><span class="s">' + esc([x.ref ? 'réf. ' + x.ref : '', patron && x.maj ? 'prix du ' + fday(x.maj) : ''].filter(Boolean).join(' · ')) + '</span></div>' +
        (patron ? '<b style="font-size:17px" class="' + (cheap && cheap.id === x.id ? 'cheap' : '') + '">' + (pp === null ? '<span style="color:var(--muted);font-weight:500;font-size:14px">prix ?</span>' : fe(pp)) + '</b>' : '') + '</button>';
    }).join('') : '<div class="empty" style="padding:16px">Aucun fournisseur renseigné</div>') + '</div>';
  if (patron) {
    var pr0 = prixRef(pr.id);
    if (pr0 && q > 0) html += '<div class="hint">Valeur en stock : <b>' + fe(pr0.prix * q) + '</b> HT (' + fq(q) + ' × ' + fe(pr0.prix) + ')</div>';
  }
  html += '<div class="sec-title"><span>Historique</span></div><div class="card" style="padding-top:4px;padding-bottom:4px">' + (hist || '<div class="empty">Aucun mouvement</div>') + '</div>';
  if (patron) html += '<div class="btn-row" style="margin-top:6px"><button class="btn light" data-a="fixStock">' + ic('edit') + 'Corriger</button><button class="btn danger" data-a="delProd">' + ic('trash') + 'Supprimer</button></div>';
  html += '</div>' + nav('stock') + '</div>';
  return html;
};
A.prodMv = function (d) { go('mvt', { mode: d.m, pid: VIEW.p.id, n: 1, lieu: '', from: 'prod' }); };
A.seuil = function (d) {
  var pr = D().prod[VIEW.p.id]; if (!pr) return;
  commit(put('Produits', { id: pr.id, seuil: String(Math.max(0, num(pr.seuil) + num(d.d))) })); render(false);
};
A.seuilSet = function () {
  var pr = D().prod[VIEW.p.id];
  askNumber({ title: 'Seuil d\'alerte', text: 'Alerte quand il en reste ce nombre ou moins. 0 = pas d\'alerte.', value: num(pr.seuil) }).then(function (v) {
    if (v !== null && v >= 0) { commit(put('Produits', { id: pr.id, seuil: String(v) })); render(false); }
  });
};
A.fixStock = function () {
  var pr = D().prod[VIEW.p.id], q = stockOf(pr.id);
  askNumber({ title: 'Corriger le stock', text: 'Combien y en a-t-il vraiment ? L\'appli enregistre l\'écart comme une correction.', value: q, ok: 'Corriger' }).then(function (v) {
    if (v === null || v === q) return;
    commit(put('Mouvements', { id: uid('m'), date: nowIso(), produit: pr.id, delta: String(round3(v - q)), type: 'ajust', qui: ME, lieu: 'Correction manuelle', fournisseur: '', prix: '', note: '' }));
    toast('Stock corrigé', pr.nom + ' : ' + fq(v)); render(false);
  });
};
A.delProd = function () {
  var pr = D().prod[VIEW.p.id];
  ask({ title: 'Supprimer ce produit ?', text: '« ' + esc(pr.nom) + ' » disparaîtra du stock et des listes. Son historique reste dans le Google Sheet et dans les anciens PDF.', ok: 'Supprimer', danger: true })
    .then(function (ok) { if (ok) { commit(put('Produits', { id: pr.id, actif: '0' })); toast('Produit supprimé', pr.nom); back(); } });
};
A.editProd = function () { go('edit', { id: VIEW.p.id, f: editForm(VIEW.p.id) }); };
A.mvInfo = function (d) {
  var M = D(), m = DB.Mouvements[d.id]; if (!m) return;
  var pr = M.prod[m.produit], patron = isPatron();
  var canDel = patron ? true : (m.qui === ME && m.type !== 'depart' && (Date.now() - (parseIso(m.date) || 0)) < 864e5);
  var t = { sortie: 'Sortie', entree: 'Entrée', ajust: 'Correction', depart: 'Stock de départ' }[m.type] || m.type;
  openSheet('<h3>' + t + ' : ' + (num(m.delta) > 0 ? '+' : '') + fq(m.delta) + '</h3><p>' + esc(pr ? pr.nom : 'Produit supprimé') + '</p>' +
    '<div class="card" style="margin-bottom:14px"><div class="kv"><span>Date</span><span>' + esc(fday(m.date) + ' ' + m.date.slice(11, 16).replace(':', 'h')) + '</span></div>' +
    (m.qui ? '<div class="kv"><span>Par</span><span>' + esc(userName(m.qui)) + '</span></div>' : '') +
    (m.lieu ? '<div class="kv"><span>' + (m.type === 'sortie' ? 'Chantier' : 'Info') + '</span><span>' + esc(m.lieu) + '</span></div>' : '') +
    (m.fournisseur ? '<div class="kv"><span>Fournisseur</span><span>' + esc(fourName(m.fournisseur)) + '</span></div>' : '') +
    (patron && m.prix ? '<div class="kv"><span>Prix unitaire HT</span><span>' + fe(num(m.prix)) + '</span></div>' : '') + '</div>' +
    (pr && VIEW.r !== 'prod' ? '<button class="btn light" style="margin-bottom:10px" data-a="mvOpenProd" data-id="' + pr.id + '">Voir le produit</button>' : '') +
    (canDel ? '<button class="btn danger" data-a="mvDel" data-id="' + m.id + '">' + ic('trash') + 'Supprimer ce mouvement (erreur)</button>' : ''));
};
A.mvOpenProd = function (d) { closeSheet(function () { go('prod', { id: d.id }); }); };
A.mvDel = function (d) {
  var m = DB.Mouvements[d.id]; if (!m) return;
  closeSheet(function () {
    ask({ title: 'Supprimer ce mouvement ?', text: 'Le stock sera recalculé comme s\'il n\'avait jamais eu lieu.', ok: 'Supprimer', danger: true }).then(function (ok) {
      if (!ok) return;
      var copy = Object.assign({}, m);
      commit(del('Mouvements', m.id)); render(false);
      toast('Mouvement supprimé', '', function () { commit(put('Mouvements', copy)); render(false); });
    });
  });
};

/* ================= création / modification d'un produit ================= */
function newForm(fam) {
  var M = D();
  return { isNew: true, nom: '', famille: fam || (M.fams[0] ? M.fams[0].id : ''), unite: '', seuil: 0, qte: 0, ref: '', notes: '',
    lines: [{ id: '', fournisseur: M.foursActifs[0] ? M.foursActifs[0].id : '', prix: '', ref: '', main: true }] };
}
function editForm(id) {
  var M = D(), p = M.prod[id];
  var lines = (M.prix[id] || []).map(function (x) { return { id: x.id, fournisseur: x.fournisseur, prix: numOrNull(x.prix) === null ? '' : fq(x.prix), ref: x.ref || '', main: x.fournisseur === p.four, orig: x.prix }; });
  if (!lines.length) lines.push({ id: '', fournisseur: p.four || '', prix: '', ref: '', main: true });
  if (!lines.some(function (l) { return l.main; })) lines[0].main = true;
  return { isNew: false, id: id, nom: p.nom, famille: p.famille, unite: p.unite || '', seuil: num(p.seuil), ref: p.ref || '', notes: p.notes || '', lines: lines };
}
var UNITES = ['pièce', 'mètre', 'ml', 'm²', 'boîte', 'paquet', 'rouleau', 'kg', 'botte', 'litre'];
SCREENS.edit = function (p) {
  var M = D(), f = p.f; if (!f) { go('stock', {}, { replace: true }); return ''; }
  var html = '<div class="screen">' + head({ title: f.isNew ? 'Nouveau produit' : 'Modifier le produit' }) + '<div class="scroll nonav">' +
    '<div class="field"><label for="fnom">Nom du produit <span class="help">(enregistré en MAJUSCULES)</span></label><input id="fnom" class="inp" style="text-transform:uppercase" data-i="f" data-k="nom" autocomplete="off" placeholder="EX. CROCHET DE GOUTTIÈRE Ø33 INOX" value="' + esc(f.nom) + '"></div>' +
    '<div class="field"><span class="flabel">Famille</span><div class="chips wrap">' + M.fams.map(function (x) {
      return '<button class="chip ' + (f.famille === x.id ? 'on' : '') + '" data-a="fSet" data-k="famille" data-v="' + x.id + '">' + esc(x.nom) + '</button>'; }).join('') +
    '<button class="chip" data-a="newFam">+ Nouvelle</button></div></div>' +
    '<div class="field"><span class="flabel">Compté en</span><div class="chips wrap"><button class="chip ' + (!f.unite ? 'on' : '') + '" data-a="fSet" data-k="unite" data-v="">—</button>' +
    UNITES.concat(f.unite && UNITES.indexOf(f.unite) < 0 ? [f.unite] : []).map(function (u) { return '<button class="chip ' + (f.unite === u ? 'on' : '') + '" data-a="fSet" data-k="unite" data-v="' + esc(u) + '">' + esc(u) + '</button>'; }).join('') + '</div></div>' +
    '<div style="display:grid;grid-template-columns:' + (f.isNew ? '1fr 1fr' : '1fr') + ';gap:10px;margin-bottom:16px">' +
    (f.isNew ? '<div class="card" style="margin:0;display:flex;flex-direction:column;align-items:center;gap:8px"><span class="flabel" style="text-align:center">Quantité en stock</span>' + stepper('fstep', 'qte', f.qte, 'Saisir la quantité') + '</div>' : '') +
    '<div class="card" style="margin:0;display:flex;flex-direction:column;align-items:center;gap:8px"><span class="flabel" style="text-align:center">Alerte à partir de</span>' + stepper('fstep', 'seuil', f.seuil, 'Saisir le seuil') +
    '<span class="help" style="font-size:12px;color:var(--muted);text-align:center">0 = pas d\'alerte</span></div></div>' +
    '<div class="sec-title" style="margin-top:4px"><span>Fournisseurs et prix</span></div>' +
    '<p style="margin:-2px 0 10px;font-size:14px;color:var(--muted)">Mets tous les fournisseurs chez qui tu achètes ce produit, avec leur prix : l\'appli te montrera le moins cher.</p>' +
    f.lines.map(function (l, i) {
      return '<div class="price-line"><div style="display:flex;gap:8px;align-items:center"><select class="inp" style="flex:1" data-i="fl" data-idx="' + i + '" data-k="fournisseur" aria-label="Fournisseur">' +
        '<option value="">Choisir le fournisseur…</option>' + M.foursActifs.concat(M.fours.filter(function (x) { return x.actif === '0' && x.id === l.fournisseur; })).map(function (x) {
          return '<option value="' + x.id + '"' + (x.id === l.fournisseur ? ' selected' : '') + '>' + esc(x.nom) + '</option>'; }).join('') +
        '<option value="__new">+ Nouveau fournisseur…</option></select>' +
        '<button class="icon-btn" style="color:var(--red-ink)" data-a="rmLine" data-idx="' + i + '" aria-label="Retirer ce fournisseur">' + ic('trash') + '</button></div>' +
        '<div class="r2"><input class="inp" data-i="fl" data-idx="' + i + '" data-k="prix" inputmode="decimal" autocomplete="off" placeholder="Prix HT (€)" aria-label="Prix HT" value="' + esc(l.prix) + '">' +
        '<input class="inp" data-i="fl" data-idx="' + i + '" data-k="ref" autocomplete="off" placeholder="Réf. fournisseur" aria-label="Référence chez ce fournisseur" value="' + esc(l.ref) + '"></div>' +
        '<button class="chip ' + (l.main ? 'on' : '') + '" style="align-self:flex-start;min-height:36px" data-a="lineMain" data-idx="' + i + '">' + (l.main ? '★ Fournisseur habituel' : 'Mettre en habituel') + '</button></div>';
    }).join('') +
    '<button class="btn light" style="margin-bottom:18px" data-a="addLine">' + ic('plus') + 'Ajouter un fournisseur</button>' +
    '<div class="field"><label for="fref">Référence interne <span class="help">(facultatif)</span></label><input id="fref" class="inp" data-i="f" data-k="ref" autocomplete="off" value="' + esc(f.ref) + '"></div>' +
    '<div class="field"><label for="fnotes">Notes <span class="help">(facultatif)</span></label><textarea id="fnotes" class="inp" data-i="f" data-k="notes" rows="3">' + esc(f.notes) + '</textarea></div>' +
    '</div><div class="bottom-bar"><button class="btn green" data-a="saveProd">' + (f.isNew ? 'Ajouter au stock' : 'Enregistrer') + '</button></div></div>';
  return html;
};
I.f = function (v, el) { VIEW.p.f[el.dataset.k] = v; saveView(); };
A.fSet = function (d) { VIEW.p.f[d.k] = d.v; saveView(); render(false); };
A.fstep = function (d) { var f = VIEW.p.f; f[d.k] = Math.max(0, round3(num(f[d.k]) + num(d.d))); saveView(); render(false); };
A.fstepSet = function (d) {
  var f = VIEW.p.f;
  askNumber({ title: d.k === 'qte' ? 'Quantité en stock' : 'Seuil d\'alerte', value: f[d.k] }).then(function (v) { if (v !== null && v >= 0) { f[d.k] = round3(v); saveView(); render(false); } });
};
I.fl = function (v, el) {
  var f = VIEW.p.f, l = f.lines[+el.dataset.idx]; if (!l) return;
  if (el.dataset.k === 'fournisseur' && v === '__new') {
    el.value = l.fournisseur || '';
    askText({ title: 'Nouveau fournisseur', placeholder: 'Nom du fournisseur', ok: 'Ajouter' }).then(function (name) {
      name = (name || '').trim(); if (!name) return;
      var id = uid('f'); commit(put('Fournisseurs', { id: id, nom: name, contact: '', tel: '', email: '', adresse: '', notes: '', actif: '1' }));
      l.fournisseur = id; saveView(); render(false);
      toast('Fournisseur ajouté', 'Tu pourras compléter ses coordonnées dans Réglages › Fournisseurs');
    });
    return;
  }
  l[el.dataset.k] = v; saveView();
};
A.addLine = function () { VIEW.p.f.lines.push({ id: '', fournisseur: '', prix: '', ref: '', main: !VIEW.p.f.lines.length }); saveView(); render(false); };
A.rmLine = function (d) {
  var f = VIEW.p.f, l = f.lines.splice(+d.idx, 1)[0];
  if (l && l.main && f.lines[0]) f.lines[0].main = true;
  saveView(); render(false);
};
A.lineMain = function (d) { VIEW.p.f.lines.forEach(function (l, i) { l.main = i === +d.idx; }); saveView(); render(false); };
A.newFam = function () {
  askText({ title: 'Nouvelle famille', placeholder: 'ex. Cuivre', ok: 'Ajouter' }).then(function (name) {
    name = (name || '').trim(); if (!name) return;
    var id = uid('fa'); commit(put('Familles', { id: id, nom: name, ordre: String(D().fams.length + 1) }));
    if (VIEW.p.f) VIEW.p.f.famille = id; saveView(); render(false);
  });
};
A.saveProd = function () {
  var f = VIEW.p.f, M = D();
  var nom = upName(f.nom);
  if (!nom) { toast('Il manque le nom du produit'); var el = document.getElementById('fnom'); if (el) el.focus(); return; }
  var lines = f.lines.filter(function (l) { return l.fournisseur; });
  var main = lines.filter(function (l) { return l.main; })[0] || lines[0];
  var id = f.isNew ? uid('p') : f.id;
  var dup = M.prods.filter(function (p) { return p.id !== id && norm(p.nom) === norm(nom); })[0];
  var save = function () {
    var ops = [put('Produits', { id: id, nom: nom, famille: f.famille || '', unite: f.unite || '', seuil: String(num(f.seuil)), four: main ? main.fournisseur : '', ref: (f.ref || '').trim(), notes: (f.notes || '').trim(), actif: '1' })];
    if (f.isNew) {
      ops[0].row.cree = nowIso();
      if (num(f.qte) > 0) ops.push(put('Mouvements', { id: uid('m'), date: nowIso(), produit: id, delta: String(num(f.qte)), type: 'depart', qui: ME, lieu: 'Stock de départ', fournisseur: '', prix: '', note: '' }));
    }
    var keep = {}, seenF = {};
    lines.forEach(function (l) {
      if (seenF[l.fournisseur]) return; seenF[l.fournisseur] = 1;
      var pv = numOrNull(l.prix), lid = l.id || uid('x');
      keep[lid] = 1;
      var old = l.id ? DB.Prix[l.id] : null;
      var changed = !old || numOrNull(old.prix) !== pv || old.fournisseur !== l.fournisseur;
      ops.push(put('Prix', { id: lid, produit: id, fournisseur: l.fournisseur, prix: pv === null ? '' : String(pv), ref: (l.ref || '').trim(), maj: changed && pv !== null ? nowIso() : (old ? old.maj : '') }));
    });
    if (!f.isNew) (M.prix[id] || []).forEach(function (x) { if (!keep[x.id]) ops.push(del('Prix', x.id)); });
    commit(ops);
    toast(f.isNew ? 'Produit ajouté' : 'Produit enregistré', nom);
    if (f.isNew) go('prod', { id: id }, { replace: true }); else back();
  };
  if (dup && f.isNew) ask({ title: 'Ce produit existe déjà ?', text: '« ' + esc(dup.nom) + ' » est déjà dans le stock. L\'ajouter quand même ?', ok: 'Ajouter quand même' }).then(function (ok) { if (ok) save(); });
  else save();
};

/* ================= à commander ================= */
SCREENS.commandes = function (p) {
  var M = D(), patron = isPatron();
  var items = M.alertes.slice();
  if (p.zeros) M.zeros.forEach(function (x) { if (items.indexOf(x) < 0) items.push(x); });
  var groups = {}, order = [];
  items.forEach(function (x) { var k = x.four && M.four[x.four] ? x.four : 'none'; if (!groups[k]) { groups[k] = []; order.push(k); } groups[k].push(x); });
  order.sort(function (a, b) { return a === 'none' ? 1 : b === 'none' ? -1 : cmp(fourName(a), fourName(b)); });
  var cur = groups[p.four] ? p.four : order[0];
  p.sel = p.sel || {}; p.qty = p.qty || {};
  var html = '<div class="screen">' + head({ back: false, title: 'À commander', sub: 'Coche ce qu\'il faut recommander, puis envoie la liste au fournisseur' }) + syncBar() +
    '<div class="scroll" style="padding-top:0">';
  html += '<div class="chips">' + order.map(function (k) {
    return '<button class="chip ' + (k === cur ? 'on' : '') + '" data-a="cmdFour" data-v="' + k + '">' + esc(k === 'none' ? 'Sans fournisseur' : fourName(k)) + ' (' + groups[k].length + ')</button>';
  }).join('') + '</div>';
  html += '<button class="opt card" style="padding:4px 14px;margin-bottom:12px" data-a="cmdZeros"><div class="grow"><b style="font-size:15px">Ajouter les produits à zéro</b><span class="s">même ceux sans seuil d\'alerte</span></div><span class="switch ' + (p.zeros ? 'on' : '') + '"></span></button>';
  if (!cur) {
    html += '<div class="empty">' + (M.nbSeuils ? 'Rien à commander pour l\'instant 👍' : 'Aucun seuil d\'alerte réglé.<br>Règle-les dans les fiches produits pour que l\'appli te prévienne.') + '</div>';
  } else {
    var tot = 0, nb = 0, noPrice = 0;
    html += '<div class="list">' + groups[cur].map(function (x) {
      var q = M.stock[x.id] || 0, s = num(x.seuil), on = p.sel[x.id] !== false;
      var qty = p.qty[x.id] !== undefined ? p.qty[x.id] : defQty(x);
      var pr = (M.prix[x.id] || []).filter(function (y) { return y.fournisseur === cur; })[0], pv = pr ? numOrNull(pr.prix) : null;
      if (on) { nb++; if (pv !== null) tot += pv * qty; else noPrice++; }
      return '<div class="row" style="' + (on ? 'border:2px solid var(--navy)' : '') + '"><button data-a="cmdSel" data-id="' + x.id + '" aria-label="Cocher" style="width:30px;height:30px;border-radius:8px;flex-shrink:0;display:flex;align-items:center;justify-content:center;' +
        (on ? 'background:var(--navy);border:0;color:#fff' : 'background:#fff;border:2px solid #B9BCCB') + '">' + (on ? ic('check') : '') + '</button>' +
        '<div class="grow" data-a="openProd" data-id="' + x.id + '"><span class="t" style="font-size:15px">' + esc(x.nom) + '</span><span class="s" style="color:' + (q <= 0 ? 'var(--red-ink)' : 'var(--orange-ink)') + ';font-weight:600">' +
        (q <= 0 ? 'Plus rien' : 'Reste ' + fq(q)) + (s > 0 ? ' · seuil ' + fq(s) : '') + (patron && pv !== null ? ' · ' + fe(pv) : '') + '</span></div>' +
        '<div class="stepper" style="gap:4px"><button data-a="cmdQ" data-id="' + x.id + '" data-d="-1" style="width:38px;height:38px" aria-label="Moins">−</button><span class="v" style="min-width:34px;font-size:22px">' + fq(qty) +
        '</span><button data-a="cmdQ" data-id="' + x.id + '" data-d="1" style="width:38px;height:38px" aria-label="Plus">+</button></div></div>';
    }).join('') + '</div>';
    var f = M.four[cur];
    if (patron && tot > 0) html += '<div class="hint" style="margin-top:12px">Montant estimé : <b>' + fe(tot) + ' HT</b>' + (noPrice ? ' (+ ' + noPrice + ' produit' + (noPrice > 1 ? 's' : '') + ' sans prix)' : '') + '</div>';
    html += '<div class="sec-title"><span>Envoyer la commande' + (f ? ' à ' + esc(f.nom) : '') + '</span></div>';
    html += '<button class="btn" data-a="cmdSend">' + ic('mail') + 'Voir et envoyer le message</button>';
    if (f && !f.email && !f.tel) html += '<p style="font-size:13px;color:var(--muted);margin:8px 0 0">Ajoute le mail ou le téléphone de ' + esc(f.nom) + ' dans Réglages › Fournisseurs pour l\'envoyer directement.</p>';
    p._cur = cur; p._nb = nb;
  }
  html += '</div>' + nav('commandes') + '</div>';
  return html;
};
function defQty(x) { var q = stockOf(x.id), s = num(x.seuil); return s > 0 ? Math.max(1, Math.ceil(2 * s - q)) : 1; }
A.cmdFour = function (d) { VIEW.p.four = d.v; saveView(); render(false); };
A.cmdZeros = function () { VIEW.p.zeros = !VIEW.p.zeros; saveView(); render(false); };
A.cmdSel = function (d) { var s = VIEW.p.sel = VIEW.p.sel || {}; s[d.id] = s[d.id] === false; saveView(); render(false); };
A.cmdQ = function (d) {
  var qy = VIEW.p.qty = VIEW.p.qty || {}, x = D().prod[d.id];
  var cur = qy[d.id] !== undefined ? qy[d.id] : defQty(x);
  qy[d.id] = Math.max(1, cur + num(d.d)); saveView(); render(false);
};
function cmdText() {
  var p = VIEW.p, M = D(), cur = p._cur, f = M.four[cur], u = me();
  var lines = [];
  var items = M.alertes.slice(); if (p.zeros) M.zeros.forEach(function (x) { if (items.indexOf(x) < 0) items.push(x); });
  items.filter(function (x) { return (x.four && M.four[x.four] ? x.four : 'none') === cur && (p.sel || {})[x.id] !== false; }).forEach(function (x) {
    var qty = (p.qty || {})[x.id] !== undefined ? p.qty[x.id] : defQty(x);
    var pr = (M.prix[x.id] || []).filter(function (y) { return y.fournisseur === cur; })[0];
    var ref = pr && pr.ref ? pr.ref : x.ref;
    lines.push('- ' + fq(qty).replace('−', '-') + (x.unite ? ' ' + x.unite : '') + ' × ' + x.nom + (ref ? ' (réf. ' + ref + ')' : ''));
  });
  return { n: lines.length, text: 'Bonjour' + (f && f.contact ? ' ' + f.contact : '') + ',\n\nVoici une commande pour ' + (M.reg.entreprise || 'EURL Da Costa') + ' :\n' + lines.join('\n') + '\n\nMerci,\n' + (u ? u.nom : '') + '\n' + (M.reg.entreprise || 'EURL Da Costa'), four: f };
}
A.cmdSend = function () {
  var c = cmdText();
  if (!c.n) { toast('Coche au moins un produit'); return; }
  var f = c.four;
  openMsg({ title: 'Commande' + (f ? ' ' + f.nom : ''), sub: c.n + ' produit' + (c.n > 1 ? 's' : '') + '. Vérifie le message, puis choisis comment l\'envoyer.',
    text: c.text, tel: f && f.tel, email: f && f.email, subject: 'Commande ' + (D().reg.entreprise || 'EURL Da Costa'),
    hint: f && !f.tel && !f.email ? 'Pas de téléphone ni de mail pour ce fournisseur : WhatsApp et SMS te demanderont le contact.' : '' });
};
function waNumber(t) { t = String(t || '').replace(/[^\d+]/g, ''); if (!t) return ''; if (t[0] === '+') return t.slice(1); if (t.indexOf('00') === 0) return t.slice(2); if (t[0] === '0') return '33' + t.slice(1); return t; }
function copyText(t) {
  var ok = function () { toast('Texte copié', 'Colle-le dans un SMS, un mail…'); };
  if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(t).then(ok, function () { fallbackCopy(t); ok(); });
  else { fallbackCopy(t); ok(); }
}
function fallbackCopy(t) { var ta = document.createElement('textarea'); ta.value = t; document.body.appendChild(ta); ta.select(); try { document.execCommand('copy'); } catch (e) {} ta.remove(); }


/* ================= aperçu d'un message avant envoi (commandes, invitations) ================= */
var MSG = null;
function openMsg(o) {
  MSG = o;
  var share = !!navigator.share;
  var btn = function (how, icon, label, off) {
    return '<button class="' + (off ? 'off' : '') + '" data-a="msgSend" data-how="' + how + '">' + ic(icon) + label + '</button>';
  };
  openSheet('<h3>' + esc(o.title) + '</h3>' + (o.sub ? '<p>' + esc(o.sub) + '</p>' : '') +
    '<label class="flabel" for="msgText" style="display:block;margin-bottom:6px">Message <span class="help" style="font-weight:500;color:var(--muted)">(tu peux le modifier)</span></label>' +
    '<textarea id="msgText" class="inp" rows="9" style="font-size:16px;line-height:1.35">' + esc(o.text) + '</textarea>' +
    '<div class="contact-actions" style="grid-template-columns:repeat(' + (share ? 5 : 4) + ',1fr);margin-top:12px">' +
    btn('wa', 'chat', 'WhatsApp') + btn('sms', 'phone', 'SMS') + btn('mail', 'mail', 'Mail') +
    (share ? btn('share', 'share', 'Autre…') : '') + btn('copy', 'copy', 'Copier') + '</div>' +
    (o.hint ? '<p style="font-size:13px;margin:0">' + esc(o.hint) + '</p>' : ''));
}
A.msgSend = function (d) {
  var o = MSG; if (!o) return;
  var el = document.getElementById('msgText'), t = el ? el.value : o.text;
  if (d.how === 'copy') { copyText(t); return; }
  if (d.how === 'share') { navigator.share({ text: t }).catch(function () {}); return; }
  var url = '';
  if (d.how === 'wa') url = 'https://wa.me/' + waNumber(o.tel) + '?text=' + encodeURIComponent(t);
  if (d.how === 'sms') url = 'sms:' + String(o.tel || '').replace(/[^\d+]/g, '') + '?body=' + encodeURIComponent(t);
  if (d.how === 'mail') url = 'mailto:' + encodeURIComponent(o.email || '') + '?subject=' + encodeURIComponent(o.subject || '') + '&body=' + encodeURIComponent(t);
  if (d.how === 'wa') window.open(url, '_blank'); else location.href = url;
};

/* ================= historique ================= */
SCREENS.histo = function (p) {
  var M = D(), f = p.f || 'all', nq = norm(p.q || '');
  var list = M.moves.filter(function (m) {
    if (f === 'S' && m.type !== 'sortie') return false; if (f === 'E' && m.type !== 'entree') return false;
    if (f === 'A' && m.type !== 'ajust' && m.type !== 'depart') return false;
    if (f === 'me' && m.qui !== ME) return false;
    if (nq) { var pr = M.prod[m.produit]; if (norm((pr ? pr.nom : '') + ' ' + m.lieu + ' ' + userName(m.qui) + ' ' + fourName(m.fournisseur)).indexOf(nq) < 0) return false; }
    return true;
  });
  var lim = p.lim || 100;
  var chips = [['all', 'Tout'], ['S', 'Sorties'], ['E', 'Entrées'], ['A', 'Corrections'], ['me', 'Les miens']];
  return '<div class="screen">' + head({ back: isPatron(), title: 'Historique', extra: searchBox('hq', 'Chercher : produit, chantier, personne…', p.q),
    below: '<div class="chips">' + chips.map(function (c) { return '<button class="chip ' + (f === c[0] ? 'on' : '') + '" data-a="hf" data-f="' + c[0] + '">' + c[1] + '</button>'; }).join('') + '</div>' }) + syncBar() +
    '<div class="scroll" style="padding-top:4px">' +
    '<div class="card" style="padding-top:4px;padding-bottom:4px" id="hlist">' + (list.length ? list.slice(0, lim).map(mvRow).join('') : '<div class="empty">Aucun mouvement</div>') + '</div>' +
    (list.length > lim ? '<button class="btn light" data-a="hmore">Voir plus</button>' : '') + '</div>' + nav(isPatron() ? 'inventaire' : 'histo') + '</div>';
};
A.hf = function (d) { VIEW.p.f = d.f; VIEW.p.lim = 100; saveView(); render(false); };
A.hmore = function () { VIEW.p.lim = (VIEW.p.lim || 100) + 100; saveView(); render(false); };
var HQ_T = null;
I.hq = function (v) { VIEW.p.q = v; saveView(); clearTimeout(HQ_T); HQ_T = setTimeout(function () { var y = window.scrollY; var a = document.activeElement; render(false); var inp = document.querySelector('[data-i="hq"]'); if (inp && a && a.dataset && a.dataset.i === 'hq') { inp.focus(); inp.setSelectionRange(v.length, v.length); } window.scrollTo(0, y); }, 250); };

/* ================= inventaire et PDF ================= */
function valeurStock() {
  var M = D(), val = 0, sansPrix = 0, avecStock = 0;
  M.prods.forEach(function (x) { var q = M.stock[x.id] || 0; if (q <= 0) return; avecStock++; var pr = prixRef(x.id); if (pr) val += pr.prix * q; else sansPrix++; });
  return { val: val, sansPrix: sansPrix, avecStock: avecStock };
}
/** Onglet Stock, patron seulement : la valeur du stock en un coup d'œil. */
function valeurBanner() {
  if (!isPatron()) return '';
  var V = valeurStock();
  return '<button class="valbar" data-a="nav" data-r="inventaire"><span class="grow"><span class="vl">Valeur du stock</span><b>' + fe(V.val) + ' <small>HT</small></b></span>' +
    (V.sansPrix ? '<span class="badge bas">' + V.sansPrix + ' sans prix</span>' : '') + ic('chev') + '</button>';
}
SCREENS.inventaire = function (p) {
  if (!isPatron()) return SCREENS.home();
  var M = D();
  if (!p.date) p.date = todayIsoDate();
  if (p.prix === undefined) p.prix = true;
  var V = valeurStock(), val = V.val, sansPrix = V.sansPrix, avecStock = V.avecStock;
  var inv = M.invEnCours, nbC = inv ? Object.keys(M.comptes).length : 0;
  var mois = todayIsoDate().slice(0, 7), nbF = M.factures.length, nbFm = M.factures.filter(function (f) { return String(f.rangee || f.date || '').slice(0, 7) === mois; }).length;
  var html = '<div class="screen">' + head({ back: false, title: 'Inventaire', sub: 'Le bureau : valeur, historique, factures, PDF comptable' }) + syncBar() + '<div class="scroll">';
  html += '<div class="card"><div class="card-title"><h2>Valeur du stock aujourd\'hui</h2></div><div style="font-family:var(--cond);font-weight:800;font-size:34px;color:var(--navy)">' + fe(val) + ' <span style="font-size:18px">HT</span></div>' +
    (sansPrix ? '<button class="link" data-a="stockFilter" data-f="noprice" style="text-align:left">' + sansPrix + ' produit' + (sansPrix > 1 ? 's' : '') + ' en stock sans prix : les compléter ›</button>' : '<span class="s" style="color:var(--muted);font-size:14px">' + avecStock + ' produits en stock, tous avec un prix</span>') + '</div>';
  html += '<div class="desk"><button class="desk-tile" data-a="go" data-r="histo"><span class="dt-ic navy">' + ic('history') + '</span><b>Historique</b><span>entrées, sorties, corrections</span></button>' +
    '<button class="desk-tile" data-a="go" data-r="factures"><span class="dt-ic green">' + ic('file') + '</span><b>Factures</b><span>' + (nbF ? nbF + ' rangée' + (nbF > 1 ? 's' : '') + ' · ' + nbFm + ' ce mois' : 'aucune pour l\'instant') + '</span></button></div>';
  html += '<div class="card"><div class="card-title"><h2>PDF pour le comptable</h2></div>' +
    '<div class="field" style="margin:8px 0"><label for="pdate">État du stock au</label><input id="pdate" type="date" class="inp" data-c="pdate" value="' + esc(p.date) + '" max="' + todayIsoDate() + '"></div>' +
    '<button class="opt" data-a="ptog" data-k="prix"><div class="grow"><b style="font-size:15px">Prix et valeur</b><span class="s">prix d\'achat HT et valeur par ligne</span></div><span class="switch ' + (p.prix ? 'on' : '') + '"></span></button>' +
    '<button class="opt" data-a="ptog" data-k="zeros"><div class="grow"><b style="font-size:15px">Produits à zéro</b><span class="s">les lister aussi</span></div><span class="switch ' + (p.zeros ? 'on' : '') + '"></span></button>' +
    '<div class="btn-row" style="margin-top:8px"><button class="btn light" data-a="pdf" data-how="dl">' + ic('download') + 'Télécharger</button><button class="btn" style="font-size:18px" data-a="pdf" data-how="share">' + ic('share') + 'Envoyer</button></div>' +
    (M.reg.emailComptable ? '<p style="font-size:13px;color:var(--muted);margin:10px 0 0">« Envoyer » ouvre le partage du téléphone : choisis Gmail puis envoie à ' + esc(M.reg.emailComptable) + '.</p>' : '<p style="font-size:13px;color:var(--muted);margin:10px 0 0">Astuce : mets l\'adresse mail du comptable dans Réglages.</p>') + '</div>';
  html += '<div class="card"><div class="card-title"><h2>Recompter le stock</h2>' + (inv ? '<span class="badge navy">en cours</span>' : '') + '</div>';
  if (inv) {
    var pc = M.prods.length ? Math.round(nbC * 100 / M.prods.length) : 0;
    html += '<p style="margin:2px 0 8px;font-size:14px;color:var(--muted)">Commencé le ' + fday(inv.date) + (inv.qui ? ' par ' + esc(userName(inv.qui)) : '') + '</p>' +
      '<div style="display:flex;justify-content:space-between;font-size:14px;margin-bottom:6px"><b>' + nbC + ' compté' + (nbC > 1 ? 's' : '') + ' sur ' + M.prods.length + '</b><span>' + pc + ' %</span></div><div class="progress"><i style="width:' + pc + '%"></i></div>' +
      '<div class="btn-row" style="margin-top:12px"><button class="btn light" data-a="invStop">Abandonner</button><button class="btn" style="font-size:18px" data-a="go" data-r="comptage">Continuer</button></div>' +
      '<button class="btn green" style="margin-top:10px" data-a="invEnd">Terminer et mettre le stock à jour</button>';
  } else {
    html += '<p style="margin:2px 0 12px;font-size:14px;color:var(--muted)">Pour la fin d\'année ou quand tu veux : tu comptes ce qu\'il y a vraiment à l\'atelier, l\'appli corrige les écarts. Le salarié peut compter en même temps sur son téléphone.</p>' +
      '<button class="btn" data-a="invStart">Commencer un recomptage</button>';
  }
  html += '</div>';
  if (M.invFinis.length) {
    html += '<div class="sec-title"><span>Inventaires archivés</span></div><div class="list">' + M.invFinis.map(function (x) {
      var d = (x.fin || x.date).slice(0, 10);
      return '<button class="row" data-a="pdfAt" data-d="' + d + '">' + ic('file') + '<div class="grow"><span class="t">Inventaire au ' + fday(d) + '</span><span class="s">' + (x.id === 'inv_20260930' ? 'Repris de la feuille papier' : 'Recomptage' + (x.qui ? ' de ' + esc(userName(x.qui)) : '')) + '</span></div><span class="link">PDF</span></button>';
    }).join('') + '</div>';
  }
  html += '</div>' + nav('inventaire') + '</div>';
  return html;
};
C.pdate = function (v) { VIEW.p.date = v || todayIsoDate(); saveView(); };
A.ptog = function (d) { VIEW.p[d.k] = !VIEW.p[d.k]; saveView(); render(false); };
A.pdf = function (d) {
  var p = VIEW.p;
  makePdf({ date: p.date || todayIsoDate(), prix: !!p.prix, zeros: !!p.zeros }, d.how);
};
A.pdfAt = function (d) { makePdf({ date: d.d, prix: true, zeros: false }, 'share'); };
A.invStart = function () {
  commit(put('Inventaires', { id: uid('inv'), date: nowIso(), qui: ME, statut: 'en_cours', lignes: '', fin: '' }));
  go('comptage', {});
};
A.invStop = function () {
  var inv = D().invEnCours; if (!inv) return;
  ask({ title: 'Abandonner le recomptage ?', text: 'Les quantités déjà comptées seront oubliées. Le stock ne change pas.', ok: 'Abandonner', danger: true }).then(function (ok) {
    if (!ok) return;
    var ops = [del('Inventaires', inv.id)];
    Object.keys(D().comptes).forEach(function (pid) { ops.push(del('Comptages', D().comptes[pid].id)); });
    commit(ops); render(false);
  });
};
A.invEnd = function () {
  var M = D(), inv = M.invEnCours; if (!inv) return;
  var diffs = [];
  Object.keys(M.comptes).forEach(function (pid) {
    var c = num(M.comptes[pid].compte), q = M.stock[pid] || 0;
    if (M.prod[pid] && round3(c - q) !== 0) diffs.push({ pid: pid, d: round3(c - q), c: c, q: q });
  });
  var nb = Object.keys(M.comptes).length;
  ask({ title: 'Terminer le recomptage ?', ok: 'Mettre à jour le stock',
    text: nb + ' produit' + (nb > 1 ? 's' : '') + ' compté' + (nb > 1 ? 's' : '') + ', <b>' + diffs.length + ' écart' + (diffs.length > 1 ? 's' : '') + '</b> à corriger.' +
      (diffs.length ? '<br>' + diffs.slice(0, 6).map(function (x) { return esc(M.prod[x.pid].nom) + ' : ' + fq(x.q) + ' → ' + fq(x.c); }).join('<br>') + (diffs.length > 6 ? '<br>…' : '') : '') +
      '<br>Les produits non comptés gardent leur quantité.' }).then(function (ok) {
    if (!ok) return;
    var now = nowIso(), lab = 'Recomptage du ' + fday(now);
    var ops = diffs.map(function (x) { return put('Mouvements', { id: uid('m'), date: now, produit: x.pid, delta: String(x.d), type: 'ajust', qui: ME, lieu: lab, fournisseur: '', prix: '', note: '' }); });
    ops.push(put('Inventaires', { id: inv.id, statut: 'termine', fin: now }));
    commit(ops);
    toast('Stock mis à jour', diffs.length + ' correction' + (diffs.length > 1 ? 's' : ''));
    if (VIEW.r === 'comptage') go('inventaire', {}, { replace: true }); else render(false);
  });
};

SCREENS.comptage = function (p) {
  var M = D(), inv = M.invEnCours;
  if (!inv) return SCREENS.inventaire(VIEW.p = {});
  var list = filterProds(p.q, p.f);
  var nbC = Object.keys(M.comptes).length;
  return '<div class="screen">' + head({ title: 'Recomptage', right: '<span class="sub" id="cprog">' + nbC + ' / ' + M.prods.length + '</span>', extra: searchBox('cq', 'Chercher un produit…', p.q) }) + syncBar() +
    '<div class="scroll nonav" style="padding-top:0">' + famChips(p.f, 'cfilt') +
    '<p style="font-size:13px;color:var(--muted);margin:0 0 10px">Tape la quantité trouvée, ou « = » si c\'est la même que prévue.</p>' +
    '<div class="list" id="clist">' + countList(list) + '</div></div>' +
    '<div class="bottom-bar"><button class="btn green" data-a="invEnd">Terminer et mettre le stock à jour</button></div></div>';
};
function countList(list) {
  var M = D();
  if (!list.length) return '<div class="empty">Aucun produit</div>';
  return list.map(function (x) {
    var c = M.comptes[x.id], q = M.stock[x.id] || 0;
    return '<div class="row" style="padding-right:8px"><div class="grow"><span class="t" style="font-size:15px">' + esc(x.nom) + '</span><span class="s">Prévu : ' + fq(q) + (x.unite ? ' ' + esc(x.unite) : '') +
      ' <span id="ec_' + x.id + '">' + ecart(c, q) + '</span></span></div>' +
      '<button class="eq" data-a="cEq" data-id="' + x.id + '" aria-label="Même quantité que prévu">=</button>' +
      '<input class="count-in ' + (c ? 'done' : '') + '" inputmode="decimal" autocomplete="off" aria-label="Quantité comptée" data-c="cnt" data-id="' + x.id + '" value="' + (c ? esc(fq(c.compte).replace('−', '-')) : '') + '"></div>';
  }).join('');
}
function ecart(c, q) {
  if (!c) return '';
  var d = round3(num(c.compte) - q);
  return d === 0 ? '<b style="color:var(--green-ink)">· OK</b>' : '<b style="color:var(--red-ink)">· écart ' + (d > 0 ? '+' : '') + fq(d) + '</b>';
}
var CQ_T = null;
I.cq = function (v) { VIEW.p.q = v; saveView(); clearTimeout(CQ_T); CQ_T = setTimeout(function () { var el = document.getElementById('clist'); if (el) el.innerHTML = countList(filterProds(v, VIEW.p.f)); }, 200); };
A.cfilt = function (d) { VIEW.p.f = d.f === 'all' ? '' : d.f; saveView(); render(false); };
function saveCount(pid, v) {
  var M = D(), inv = M.invEnCours; if (!inv) return;
  var id = inv.id + '_' + pid, n = numOrNull(v);
  if (n === null) { if (DB.Comptages[id]) commit(del('Comptages', id)); }
  else commit(put('Comptages', { id: id, inventaire: inv.id, produit: pid, compte: String(n), qui: ME, date: nowIso() }));
  var M2 = D();
  var e = document.getElementById('ec_' + pid); if (e) e.innerHTML = ecart(M2.comptes[pid], M2.stock[pid] || 0);
  var inp = document.querySelector('.count-in[data-id="' + pid + '"]'); if (inp) inp.classList.toggle('done', n !== null);
  var pr = document.getElementById('cprog'); if (pr) pr.textContent = Object.keys(M2.comptes).length + ' / ' + M2.prods.length;
}
C.cnt = function (v, el) { saveCount(el.dataset.id, v); };
A.cEq = function (d) {
  var q = stockOf(d.id), inp = document.querySelector('.count-in[data-id="' + d.id + '"]');
  if (inp) inp.value = fq(q).replace('−', '-');
  saveCount(d.id, String(q));
};

/* ================= réglages ================= */
SCREENS.reglages = function () {
  var M = D(), patron = isPatron(), u = me();
  var lastTxt = SYNC.last ? (Date.now() - SYNC.last < 90000 ? 'à l\'instant' : 'il y a ' + Math.round((Date.now() - SYNC.last) / 60000) + ' min') : 'jamais';
  var html = '<div class="screen">' + head({ title: 'Réglages' }) + '<div class="scroll nonav">';
  html += '<div class="card mecard"><span class="who-av">' + initial(u.nom) + '</span><div class="grow"><b>' + esc(u.nom) + '</b><span>' + (patron ? 'Patron' : 'Salarié') + ' · connecté sur ce téléphone</span></div>' +
    '<button class="small-btn" data-a="logout2">' + ic('logout') + 'Changer</button></div>';
  if (patron) {
    html += '<div class="grp">L\'entreprise</div><div class="list" style="margin-bottom:14px">' +
      menuRow('entreprise', 'home', 'Entreprise', esc(M.reg.entreprise || 'Nom') + (M.reg.emailComptable ? ' · comptable : ' + esc(M.reg.emailComptable) : ' · mail du comptable')) +
      menuRow('equipe', 'users', 'Équipe', M.usersActifs.length + ' personne' + (M.usersActifs.length > 1 ? 's' : '') + ' · inviter un salarié') +
      menuRow('fours', 'truck', 'Fournisseurs', M.foursActifs.length + ' fournisseurs · contacts, prix comparés') +
      menuRow('fams', 'folder', 'Familles de produits', M.fams.length + ' familles') + '</div>';
  } else {
    html += '<div class="list" style="margin-bottom:14px">' + menuRow('fours', 'truck', 'Fournisseurs', 'Téléphones et contacts') + '</div>';
  }
  html += '<div class="grp">L\'appli</div>';
  if (patron) {
    var fi = FINFO;
    html += '<div class="card"><div class="card-title"><h2>Factures enregistrées</h2><span class="s" style="color:var(--muted);font-size:14px">' + (fi ? fi.n + ' fichier' + (fi.n > 1 ? 's' : '') : '…') + '</span></div>' +
      (fi ? '<div class="progress"><i style="width:' + Math.max(1, Math.min(100, fi.driveLimite ? Math.round(fi.driveUtilise * 100 / fi.driveLimite) : 0)) + '%"></i></div>' +
        '<p style="font-size:13px;color:var(--muted);margin:8px 0 0">' + fmo(fi.octets) + ' de factures' + (fi.driveLimite ? ' · Google Drive : ' + fgo(fi.driveUtilise) + ' utilisés sur ' + fgo(fi.driveLimite) : '') + '. Rangées dans le dossier « Factures » à côté du Google Sheet.</p>'
        : '<p id="finfo" style="font-size:13px;color:var(--muted);margin:4px 0 0">Calcul de la place utilisée…</p>') + '</div>';
  }
  html += '<div class="card"><div class="card-title"><h2>Synchronisation</h2>' + (SYNC.err ? '<span class="badge rupt">problème</span>' : OUTBOX.length ? '<span class="badge bas">en cours</span>' : '<span class="badge ok">à jour</span>') + '</div>' +
    '<div class="kv"><span>Dernier échange avec le Google Sheet</span><span>' + lastTxt + '</span></div>' +
    '<div class="kv"><span>Modifications en attente</span><span>' + OUTBOX.length + '</span></div>' +
    (SYNC.err ? '<div class="kv"><span>Dernière erreur</span><span style="color:var(--red-ink)">' + esc(SYNC.err) + '</span></div>' : '') +
    (REJECTED.length ? '<div class="hint" style="background:var(--red-bg);color:var(--red-ink);margin:10px 0">' + REJECTED.length + ' modification(s) refusée(s) par le Google Sheet : ' + esc(REJECTED[0]._err || '') +
      '<div class="btn-row" style="margin-top:8px"><button class="btn light" data-a="rejRetry">Réessayer</button><button class="btn danger" data-a="rejDrop">Ignorer</button></div></div>' : '') +
    '<div class="btn-row" style="margin-top:10px"><button class="btn light" data-a="testCnx">Tester la connexion</button>' +
    (patron && SYNC.sheetUrl ? '<a class="btn light" href="' + esc(SYNC.sheetUrl) + '" target="_blank" rel="noopener">Ouvrir le Sheet</a>' : '<button class="btn light" data-a="retry">Synchroniser</button>') + '</div>' +
    '<p id="cnx" style="font-size:13px;color:var(--muted);margin:8px 0 0"></p></div>';
  html += '<p style="text-align:center;color:var(--muted);font-size:13px;margin-top:20px">Stock Da Costa' + (IS_TEST ? ' · <b style="color:#B45309">VERSION TEST</b>' : '') + ' · appli ' + APP_VERSION + (SYNC.version ? ' · script ' + esc(SYNC.version) : '') + '</p>';
  html += '</div></div>';
  if (patron && !FINFO) loadFinfo();
  return html;
};
/** Place utilisée par les factures (demandée au script quand on ouvre Réglages). */
var FINFO = null, FINFO_BUSY = false;
function loadFinfo() {
  if (FINFO_BUSY || !navigator.onLine) return; FINFO_BUSY = true;
  call('fichiersInfo', [CFG.code], 60000).then(function (r) { FINFO = r; FINFO_BUSY = false; if (VIEW.r === 'reglages') render(false); })
    .catch(function (e) { FINFO_BUSY = false; var el = document.getElementById('finfo'); if (el) el.textContent = 'Place utilisée : indisponible (' + e.message + ').'; });
}
function fmo(o) { o = num(o); return o < 1e6 ? Math.max(1, Math.round(o / 1e3)) + ' Ko' : (o / 1e6).toFixed(o < 1e7 ? 1 : 0).replace('.', ',') + ' Mo'; }
function fgo(o) { o = num(o); return (o / 1e9).toFixed(o < 1e10 ? 1 : 0).replace('.', ',') + ' Go'; }
/* fiche Entreprise (nom, mail du comptable) */
SCREENS.entreprise = function () {
  if (!isPatron()) return SCREENS.reglages();
  var M = D();
  return '<div class="screen">' + head({ title: 'Entreprise' }) + '<div class="scroll nonav"><div class="card">' +
    '<div class="field" style="margin-top:8px"><label for="rnom">Nom</label><input id="rnom" class="inp" data-c="reg" data-k="entreprise" value="' + esc(M.reg.entreprise || '') + '"></div>' +
    '<div class="field" style="margin-bottom:4px"><label for="rmail">Mail du comptable</label><input id="rmail" class="inp" type="email" inputmode="email" data-c="reg" data-k="emailComptable" placeholder="comptable@exemple.fr" value="' + esc(M.reg.emailComptable || '') + '"></div>' +
    '</div><p style="font-size:13px;color:var(--muted);margin:4px 4px 0">Le mail du comptable sert pour envoyer le PDF d\'inventaire et les factures.</p></div></div>';
};
function menuRow(r, icon, t, s) { return '<button class="row" data-a="go" data-r="' + r + '">' + ic(icon) + '<div class="grow"><span class="t">' + t + '</span><span class="s">' + s + '</span></div>' + ic('chev') + '</button>'; }
C.reg = function (v, el) { commit(put('Reglages', { id: el.dataset.k, valeur: v.trim() })); toast('Enregistré'); };
A.logout2 = function () { ME = null; LS.del('user'); go('login', {}, { replace: true }); };
A.rejRetry = function () { retryRejected(); render(false); };
A.rejDrop = function () { ask({ title: 'Ignorer ces modifications ?', text: 'Elles ne seront jamais enregistrées dans le Google Sheet.', ok: 'Ignorer', danger: true }).then(function (ok) { if (ok) { dropRejected(); render(false); } }); };
A.testCnx = function () {
  var el = document.getElementById('cnx'); if (el) el.textContent = 'Test en cours…';
  var t0 = Date.now();
  call('ping', [CFG.code]).then(function (r) { if (el) el.textContent = 'OK : script ' + r.version + ', réponse en ' + ((Date.now() - t0) / 1000).toFixed(1) + ' s.'; flush(); })
    .catch(function (e) { if (el) el.textContent = 'Échec : ' + e.message; });
};

/* équipe */
SCREENS.equipe = function () {
  var M = D();
  return '<div class="screen">' + head({ title: 'Équipe' }) + '<div class="scroll nonav"><div class="list">' + M.users.map(function (u) {
    return '<button class="row" data-a="editUser" data-id="' + u.id + '" style="' + (u.actif === '0' ? 'opacity:.55' : '') + '"><span class="avatar" style="margin:0;background:' + (u.role === 'patron' ? 'var(--navy)' : 'var(--gold)') + ';color:' + (u.role === 'patron' ? '#fff' : 'var(--navy)') + ';display:flex;align-items:center;justify-content:center">' + initial(u.nom) + '</span>' +
      '<div class="grow"><span class="t">' + esc(u.nom + (u.nomFamille ? ' ' + u.nomFamille : '')) + '</span><span class="s">' + (u.role === 'patron' ? 'Patron' : 'Salarié') + (u.tel ? ' · ' + esc(u.tel) : '') + (u.actif === '0' ? ' · ne fait plus partie de l\'équipe' : u.pin ? '' : ' · code pas encore choisi') + '</span></div>' + ic('chev') + '</button>';
  }).join('') + '</div><p style="font-size:13px;color:var(--muted);margin:12px 2px">Chaque personne choisit son code à 4 chiffres la première fois qu\'elle ouvre l\'appli sur son téléphone.</p></div>' +
    '<div class="bottom-bar"><button class="btn" data-a="newUser">' + ic('plus') + 'Ajouter un salarié</button></div></div>';
};
A.newUser = function () { go('user', { f: { isNew: true, nom: '', nomFamille: '', tel: '', role: 'salarie' } }); };
function userForm(u) { return { isNew: false, id: u.id, nom: u.nom, nomFamille: u.nomFamille || '', tel: u.tel || '', role: u.role || 'salarie' }; }
A.editUser = function (d) { go('user', { f: userForm(D().user[d.id]) }); };
function appLink() { return location.origin + location.pathname.replace(/index\.html$/, ''); }
function inviteText(u) {
  var boss = me() ? me().nom : 'Jimmy';
  return 'Salut ' + u.nom + ' ! C\'est ' + boss + ' 👋\n\n' +
    'J\'ai mis en place une appli pour gérer le stock de l\'atelier. Installe-la sur ton téléphone avec ce lien :\n' + appLink() + '\n\n' +
    '1. Ouvre le lien et appuie sur « Installer » (sur iPhone : bouton Partager puis « Sur l\'écran d\'accueil »).\n' +
    '2. Choisis ton prénom et invente ton code à 4 chiffres.\n\n' +
    'Ensuite c\'est simple : quand tu prends du matériel, tu fais SORTIE. Quand tu ranges une livraison, tu fais ENTRÉE.\n\nMerci !';
}
function openInvite(u) {
  openMsg({ title: 'Inviter ' + u.nom, sub: 'Le message avec le lien de l\'appli. Modifie-le si tu veux, puis choisis comment l\'envoyer.',
    text: inviteText(u), tel: u.tel, subject: 'Appli du stock', hint: u.tel ? '' : 'Ajoute son numéro pour que WhatsApp et SMS s\'ouvrent directement sur sa conversation.' });
}
A.invite = function () { var u = D().user[VIEW.p.f.id]; if (u) openInvite(u); };
SCREENS.user = function (p) {
  var f = p.f, u = f.isNew ? null : D().user[f.id];
  return '<div class="screen">' + head({ title: f.isNew ? 'Nouveau salarié' : esc(f.nom || 'Personne') }) + '<div class="scroll nonav">' +
    '<div class="field"><label for="unom">Prénom</label><input id="unom" class="inp" data-i="uf" data-k="nom" autocomplete="off" autocapitalize="words" value="' + esc(f.nom) + '" placeholder="ex. Mathieu"></div>' +
    '<div class="field"><label for="unf">Nom <span class="help">(facultatif)</span></label><input id="unf" class="inp" data-i="uf" data-k="nomFamille" autocomplete="off" autocapitalize="words" value="' + esc(f.nomFamille) + '"></div>' +
    '<div class="field"><label for="utel">Téléphone <span class="help">(pour lui envoyer l\'invitation)</span></label><input id="utel" class="inp" type="tel" inputmode="tel" data-i="uf" data-k="tel" autocomplete="off" value="' + esc(f.tel) + '" placeholder="ex. 06 12 34 56 78"></div>' +
    '<div class="field"><span class="flabel">Rôle</span><div class="chips wrap"><button class="chip ' + (f.role === 'salarie' ? 'on' : '') + '" data-a="ufRole" data-v="salarie">Salarié : entrées et sorties</button>' +
    '<button class="chip ' + (f.role === 'patron' ? 'on' : '') + '" data-a="ufRole" data-v="patron">Patron : tout l\'accès</button></div></div>' +
    (u && u.id !== ME ? '<button class="btn" style="margin-bottom:14px" data-a="invite">' + ic('share') + 'Envoyer l\'invitation</button>' : '') +
    (u ? '<div class="card"><div class="kv"><span>Code</span><span>' + (u.pin ? 'choisi' : 'à choisir au prochain lancement') + '</span></div></div>' +
      (u.pin ? '<button class="btn light" style="margin-bottom:10px" data-a="userPin">Réinitialiser son code</button>' : '') +
      (u.id !== ME ? (u.actif === '0' ? '<button class="btn light" data-a="userActif" data-v="1">Remettre dans l\'équipe</button>' : '<button class="btn danger" data-a="userActif" data-v="0">' + ic('trash') + 'Retirer de l\'équipe</button>') : '') : '') +
    '</div><div class="bottom-bar"><button class="btn green" data-a="saveUser">' + (f.isNew ? 'Ajouter' : 'Enregistrer') + '</button></div></div>';
};
I.uf = function (v, el) { VIEW.p.f[el.dataset.k] = v; saveView(); };
A.ufRole = function (d) { VIEW.p.f.role = d.v; saveView(); render(false); };
function patronsActifs(except) { return D().usersActifs.filter(function (u) { return u.role === 'patron' && u.id !== except; }).length; }
A.saveUser = function () {
  var f = VIEW.p.f, nom = (f.nom || '').trim();
  if (!nom) { toast('Il manque le prénom'); return; }
  if (!f.isNew && f.role !== 'patron' && D().user[f.id].role === 'patron' && !patronsActifs(f.id)) { toast('Il faut garder au moins un patron'); return; }
  var extra = { nomFamille: (f.nomFamille || '').trim(), tel: (f.tel || '').trim() };
  if (f.isNew) {
    var nid = uid('u');
    commit(put('Utilisateurs', Object.assign({ id: nid, nom: nom, role: f.role, pin: '', actif: '1', ordre: String(D().users.length + 1) }, extra)));
    toast('Salarié ajouté', nom + ' choisira son code à la première connexion');
    go('user', { f: userForm(D().user[nid]) }, { replace: true });
    AFTER.push(function () { openInvite(D().user[nid]); });
    render(false);
    return;
  }
  commit(put('Utilisateurs', Object.assign({ id: f.id, nom: nom, role: f.role }, extra)));
  toast('Enregistré', nom);
  back();
};
A.userPin = function () {
  var f = VIEW.p.f;
  ask({ title: 'Réinitialiser le code ?', text: esc(f.nom) + ' choisira un nouveau code à sa prochaine connexion.', ok: 'Réinitialiser' }).then(function (ok) {
    if (ok) { commit(put('Utilisateurs', { id: f.id, pin: '' })); toast('Code réinitialisé'); render(false); }
  });
};
A.userActif = function (d) {
  var f = VIEW.p.f, u = D().user[f.id];
  if (d.v === '0' && u.role === 'patron' && !patronsActifs(u.id)) { toast('Il faut garder au moins un patron'); return; }
  var go2 = function () { commit(put('Utilisateurs', { id: f.id, actif: d.v })); toast(d.v === '0' ? 'Retiré de l\'équipe' : 'Remis dans l\'équipe', f.nom); back(); };
  if (d.v === '0') ask({ title: 'Retirer ' + f.nom + ' ?', text: 'Il ne pourra plus utiliser l\'appli. Ses mouvements restent dans l\'historique.', ok: 'Retirer', danger: true }).then(function (ok) { if (ok) go2(); });
  else go2();
};

/* fournisseurs */
SCREENS.fours = function (p) {
  var M = D(), nq = norm(p.q || '');
  var count = {}; Object.keys(M.prix).forEach(function (pid) { if (!M.prod[pid] || M.prod[pid].actif === '0') return; M.prix[pid].forEach(function (x) { count[x.fournisseur] = (count[x.fournisseur] || 0) + 1; }); });
  var list = M.foursActifs.filter(function (f) { return !nq || norm(f.nom + ' ' + f.contact).indexOf(nq) >= 0; });
  return '<div class="screen">' + head({ title: 'Fournisseurs', extra: searchBox('fq', 'Chercher un fournisseur…', p.q) }) + '<div class="scroll nonav"><div class="list" id="flist">' +
    (list.length ? list.map(function (f) {
      return '<button class="row" data-a="openFour" data-id="' + f.id + '">' + (f.logo ? '<span class="flogo"><img src="' + esc(f.logo) + '" alt=""></span>' : '<span class="avatar" style="margin:0;background:var(--navy-soft);color:var(--navy);display:flex;align-items:center;justify-content:center">' + initial(f.nom) + '</span>') + '<div class="grow"><span class="t">' + esc(f.nom) + '</span><span class="s">' +
        esc([f.contact, f.tel].filter(Boolean).join(' · ') || 'coordonnées à compléter') + ' · ' + (count[f.id] || 0) + ' produit' + ((count[f.id] || 0) > 1 ? 's' : '') + '</span></div>' + ic('chev') + '</button>';
    }).join('') : '<div class="empty">Aucun fournisseur</div>') + '</div></div>' +
    (isPatron() ? '<div class="bottom-bar"><button class="btn" data-a="newFour">' + ic('plus') + 'Nouveau fournisseur</button></div>' : '') + '</div>';
};
var FQ_T = null;
I.fq = function (v) { VIEW.p.q = v; saveView(); clearTimeout(FQ_T); FQ_T = setTimeout(function () { var a = document.activeElement; render(false); var inp = document.querySelector('[data-i="fq"]'); if (inp && a && a.dataset && a.dataset.i === 'fq') { inp.focus(); inp.setSelectionRange(v.length, v.length); } }, 250); };
A.openFour = function (d) { if (D().four[d.id]) go('four', { id: d.id }); };
A.newFour = function () { go('fourEdit', { f: { isNew: true, nom: '', contact: '', tel: '', email: '', adresse: '', notes: '' } }); };
SCREENS.four = function (p) {
  var M = D(), f = M.four[p.id], patron = isPatron();
  if (!f) return SCREENS.fours({});
  var rows = [];
  Object.keys(M.prix).forEach(function (pid) {
    var pr = M.prod[pid]; if (!pr || pr.actif === '0') return;
    M.prix[pid].forEach(function (x) { if (x.fournisseur === f.id) rows.push({ p: pr, x: x }); });
  });
  var nq = norm(p.q || '');
  if (nq) rows = rows.filter(function (r) { return norm(r.p.nom + ' ' + r.x.ref).indexOf(nq) >= 0; });
  rows.sort(function (a, b) { return cmp(a.p.nom, b.p.nom); });
  var addr = f.adresse ? 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(f.adresse) : '';
  var html = '<div class="screen">' + head({ title: esc(f.nom), sub: esc(f.contact || ''), right: patron ? '<button class="icon-btn" data-a="editFour" aria-label="Modifier">' + ic('edit') + '</button>' : '' }) +
    '<div class="scroll nonav">' + (f.logo ? '<div class="four-logo"><img src="' + esc(f.logo) + '" alt="Logo ' + esc(f.nom) + '"></div>' : '') +
    // barre d'actions : reste collée sous l'en-tête quand on fait défiler les produits
    '<div class="act-stick" data-under-head><div class="contact-actions four-acts">' +
    '<a href="' + (f.tel ? 'tel:' + esc(f.tel.replace(/\s/g, '')) : '#') + '" class="ca-call ' + (f.tel ? '' : 'off') + '">' + ic('phone') + 'Appeler</a>' +
    '<button data-a="fourMsg" class="ca-msg ' + (f.tel ? '' : 'off') + '">' + ic('chat') + 'Message</button>' +
    '<a href="' + (f.email ? 'mailto:' + esc(f.email) : '#') + '" class="ca-mail ' + (f.email ? '' : 'off') + '">' + ic('mail') + 'Mail</a>' +
    '<a href="' + (addr || '#') + '" target="_blank" rel="noopener" class="ca-map ' + (addr ? '' : 'off') + '">' + ic('map') + 'Itinéraire</a></div></div>' +
    '<div class="card">' + kvLine('Contact', f.contact) + kvLine('Téléphone', f.tel) + kvLine('Mail', f.email) + kvLine('Adresse', f.adresse) + kvLine('Notes', f.notes) +
    (!f.contact && !f.tel && !f.email && !f.adresse ? '<div class="empty" style="padding:12px">Coordonnées à compléter' + (patron ? ' (crayon en haut)' : '') + '</div>' : '') + '</div>' +
    '<div class="sec-title"><span>Produits achetés ici (' + rows.length + ')</span></div>' + searchBox('fpq', 'Chercher un produit chez ' + f.nom + '…', p.q) +
    '<div class="card" style="padding-top:4px;padding-bottom:4px;margin-top:10px" id="fplist">' + fourProds(rows, patron) + '</div></div></div>';
  return html;
};
A.fourMsg = function () {
  var f = D().four[VIEW.p.id]; if (!f) return;
  openMsg({ title: 'Message à ' + f.nom, sub: f.contact ? 'Contact : ' + f.contact : '', tel: f.tel, email: f.email, subject: 'EURL Da Costa',
    text: 'Bonjour' + (f.contact ? ' ' + f.contact : '') + ',\n\n' });
};
function fourProds(rows, patron) {
  if (!rows.length) return '<div class="empty" style="padding:16px">Aucun produit</div>';
  return rows.map(function (r) {
    var cheap = moinsCher(r.p.id), pv = numOrNull(r.x.prix);
    return '<button class="line" data-a="openProd" data-id="' + r.p.id + '"><div class="grow"><span class="t">' + esc(r.p.nom) + '</span><span class="s">' + esc([r.x.ref ? 'réf. ' + r.x.ref : '', r.p.four === r.x.fournisseur ? 'fournisseur habituel' : ''].filter(Boolean).join(' · ')) + '</span></div>' +
      (patron ? '<span style="display:flex;flex-direction:column;align-items:flex-end"><b class="' + (cheap && cheap.id === r.x.id ? 'cheap' : '') + '">' + (pv === null ? '<span style="color:var(--muted);font-weight:500;font-size:14px">prix ?</span>' : fe(pv)) + '</b>' +
        (cheap && cheap.id !== r.x.id && pv !== null ? '<span style="font-size:12px;color:var(--muted)">' + esc(fourName(cheap.fournisseur)) + ' : ' + fe(num(cheap.prix)) + '</span>' : cheap && cheap.id === r.x.id ? '<span style="font-size:12px" class="cheap">le moins cher</span>' : '') + '</span>' : '') + '</button>';
  }).join('');
}
var FPQ_T = null;
I.fpq = function (v) { VIEW.p.q = v; saveView(); clearTimeout(FPQ_T); FPQ_T = setTimeout(function () { var a = document.activeElement; var y = window.scrollY; render(false); var inp = document.querySelector('[data-i="fpq"]'); if (inp && a && a.dataset && a.dataset.i === 'fpq') { inp.focus(); inp.setSelectionRange(v.length, v.length); } window.scrollTo(0, y); }, 250); };
function kvLine(k, v) { return v ? '<div class="kv"><span>' + k + '</span><span style="white-space:pre-line;max-width:65%">' + esc(v) + '</span></div>' : ''; }
A.delLogo = function () { VIEW.p.f.logo = ''; VIEW.p.f.logoDel = true; saveView(); render(false); };
A.editFour = function () { var f = D().four[VIEW.p.id]; go('fourEdit', { f: { isNew: false, id: f.id, logo: f.logo || '', nom: f.nom, contact: f.contact || '', tel: f.tel || '', email: f.email || '', adresse: f.adresse || '', notes: f.notes || '' } }); };
SCREENS.fourEdit = function (p) {
  var f = p.f;
  var fld = function (k, label, type, ph, mode) {
    return '<div class="field"><label for="fe_' + k + '">' + label + '</label>' + (type === 'textarea' ? '<textarea id="fe_' + k + '" class="inp" rows="3" data-i="fef" data-k="' + k + '" placeholder="' + esc(ph || '') + '">' + esc(f[k]) + '</textarea>'
      : '<input id="fe_' + k + '" class="inp" ' + (type ? 'type="' + type + '" ' : '') + (mode ? 'inputmode="' + mode + '" ' : '') + 'autocomplete="off" data-i="fef" data-k="' + k + '" placeholder="' + esc(ph || '') + '" value="' + esc(f[k]) + '">') + '</div>';
  };
  return '<div class="screen">' + head({ title: f.isNew ? 'Nouveau fournisseur' : 'Modifier' }) + '<div class="scroll nonav">' +
    fld('nom', 'Nom', '', 'ex. Réseau Pro Montargis') + fld('contact', 'Contact <span class="help">(commercial, vendeur…)</span>', '', 'ex. Sébastien') +
    fld('tel', 'Téléphone', 'tel', 'ex. 02 38 00 00 00', 'tel') + fld('email', 'Mail', 'email', 'ex. agence@fournisseur.fr', 'email') +
    fld('adresse', 'Adresse', 'textarea', 'ex. ZA des Champs, 45200 Amilly') + fld('notes', 'Notes', 'textarea', 'ex. n° de compte client, horaires…') +
    (!f.isNew && f.logo ? '<div class="field"><label>Logo <span class="help">(repris d\'une facture)</span></label><div class="four-logo" style="margin:0 0 8px">' + '<img src="' + esc(f.logo) + '" alt="Logo"></div>' +
      '<button class="btn light" data-a="delLogo" style="margin-bottom:16px">' + ic('x') + 'Retirer le logo</button></div>' : '') +
    (f.isNew ? '' : '<button class="btn danger" data-a="delFour">' + ic('trash') + 'Supprimer ce fournisseur</button>') +
    '</div><div class="bottom-bar"><button class="btn green" data-a="saveFour">' + (f.isNew ? 'Ajouter' : 'Enregistrer') + '</button></div></div>';
};
I.fef = function (v, el) { VIEW.p.f[el.dataset.k] = v; saveView(); };
A.saveFour = function () {
  var f = VIEW.p.f, nom = (f.nom || '').trim();
  if (!nom) { toast('Il manque le nom'); return; }
  var id = f.isNew ? uid('f') : f.id;
  var row = { id: id, nom: nom, contact: f.contact.trim(), tel: f.tel.trim(), email: f.email.trim(), adresse: f.adresse.trim(), notes: f.notes.trim(), actif: '1' };
  if (f.logoDel) row.logo = '';
  commit(put('Fournisseurs', row));
  toast(f.isNew ? 'Fournisseur ajouté' : 'Enregistré', nom);
  if (f.isNew) go('four', { id: id }, { replace: true }); else back();
};
A.delFour = function () {
  var f = VIEW.p.f;
  ask({ title: 'Supprimer ' + f.nom + ' ?', text: 'Il disparaît de la liste des fournisseurs. Les produits gardent leurs autres fournisseurs.', ok: 'Supprimer', danger: true }).then(function (ok) {
    if (!ok) return;
    commit(put('Fournisseurs', { id: f.id, actif: '0' }));
    toast('Fournisseur supprimé', f.nom);
    go('fours', {}, { replace: true });
  });
};

/* familles */
SCREENS.fams = function () {
  var M = D(), count = {};
  M.prods.forEach(function (p) { count[p.famille] = (count[p.famille] || 0) + 1; });
  return '<div class="screen">' + head({ title: 'Familles de produits' }) + '<div class="scroll nonav"><div class="list">' + M.fams.map(function (f) {
    return '<div class="row"><div class="grow" data-a="renFam" data-id="' + f.id + '"><span class="t">' + esc(f.nom) + '</span><span class="s">' + (count[f.id] || 0) + ' produit' + ((count[f.id] || 0) > 1 ? 's' : '') + ' · toucher pour renommer</span></div>' +
      (count[f.id] ? '' : '<button class="icon-btn" style="color:var(--red-ink)" data-a="delFam" data-id="' + f.id + '" aria-label="Supprimer">' + ic('trash') + '</button>') + '</div>';
  }).join('') + '</div><p style="font-size:13px;color:var(--muted);margin:12px 2px">Pour changer un produit de famille : fiche produit › crayon.</p></div>' +
    '<div class="bottom-bar"><button class="btn" data-a="newFam">' + ic('plus') + 'Nouvelle famille</button></div></div>';
};
A.renFam = function (d) {
  var f = D().fam[d.id];
  askText({ title: 'Renommer la famille', value: f.nom, ok: 'Renommer' }).then(function (v) { v = (v || '').trim(); if (v && v !== f.nom) { commit(put('Familles', { id: f.id, nom: v })); render(false); } });
};
A.delFam = function (d) { var f = D().fam[d.id]; ask({ title: 'Supprimer « ' + f.nom + ' » ?', ok: 'Supprimer', danger: true }).then(function (ok) { if (ok) { commit(del('Familles', f.id)); render(false); } }); };

/* ================= démarrage ================= */
(function start() {
  try { history.replaceState({ r: 'boot', p: {} }, ''); } catch (e) {}
  if (LOADED) { VIEW = { r: me() ? 'home' : 'login', p: {} }; saveView(); migrateNames(); }
  render(true);
  startSync();
  if ('serviceWorker' in navigator && window.isSecureContext) {
    var had = !!navigator.serviceWorker.controller;
    navigator.serviceWorker.register('sw.js').then(function (reg) {
      document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'visible') reg.update().catch(function () {}); });
    }).catch(function () {});
    navigator.serviceWorker.addEventListener('controllerchange', function () { if (had && !isTyping()) location.reload(); });
  }
  if (window.preloadPdfLogo) preloadPdfLogo();
})();
