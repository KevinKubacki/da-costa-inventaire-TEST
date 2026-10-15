/* Stock Da Costa — onglet Bilan (V3.11, cadré avec Kevin le 15/10/2026)
   Réservé au patron. Tout est calculé dans le téléphone à partir des mouvements (rien de plus dans le Sheet).
   - Achats : ce qui a été acheté (entrées avec prix) par famille / sous-famille / recherche, détail par fournisseur,
     par produit (prix moyen, dernier prix), par mois → pour négocier un fournisseur unique.
   - Entrées / sorties : par produit, acheté / sorti / en stock, en quantité et en euros.
   - Prix : évolution du prix payé chez un même fournisseur.
   - Chantiers : nombre par mois, coût, les plus gros, ce qui y part le plus.
   À reproposer à Kevin plus tard (sa demande) : stock qui dort, écarts d'inventaire, ruptures. */
'use strict';

IC.chart = '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>';
var BL_COUL = ['#2E2C6E', '#157F4A', '#C2362B', '#B45309', '#0E7490', '#7C3AED'];

/* ---------------- calculs ---------------- */
function blJour(d) { return d.toISOString().slice(0, 10); }
function blPeriode(p) {
  var auj = todayIsoDate(), M = D(), deb;
  var prem = M.moves.length ? M.moves[M.moves.length - 1].date.slice(0, 10) : auj;   // début du suivi (inventaire de départ)
  if (p.per === '12m') { var d = new Date(); d.setDate(d.getDate() - 364); deb = blJour(d); }
  else if (p.per === 'tout') deb = prem;
  else if (p.per === 'dates') deb = p.d1 || prem;
  else deb = auj.slice(0, 4) + '-01-01';
  var fin = p.per === 'dates' && p.d2 ? p.d2 : auj;
  if (fin < deb) { var t = fin; fin = deb; deb = t; }
  var dc = deb < prem ? prem : deb, fc = fin > auj ? auj : fin;
  var jours = Math.max(1, Math.round((Date.parse(fc) - Date.parse(dc)) / 864e5) + 1);
  return { deb: deb, fin: fin, prem: prem, jours: jours, partiel: jours < 360, court: jours < 60 };
}
function blDans(m, P) { var d = m.date.slice(0, 10); return d >= P.deb && d <= P.fin; }
/** Le produit est-il dans le périmètre choisi (famille, sous-famille, mots cherchés) ? */
function blFiltre(p) {
  var M = D(), sc = p.scope || '', words = norm(p.q || '').split(/\s+/).filter(Boolean);
  return function (pr) {
    if (!pr) return false;
    if (sc.indexOf('f:') === 0 && pr.famille !== sc.slice(2)) return false;
    if (sc.indexOf('s:') === 0 && pr.sfam !== sc.slice(2)) return false;
    if (!words.length) return true;
    var hay = norm(pr.nom + ' ' + famName(pr.famille) + ' ' + sfamName(pr.sfam) + ' ' + fourName(pr.four) + ' ' + (pr.ref || ''));
    return words.every(function (w) { return hay.indexOf(w) >= 0; });
  };
}
function blRetour(m) { return m.type === 'entree' && (!!m.chantier || norm(m.lieu) === 'retour de chantier'); }
/** Quantité « parlante » : un produit vendu par boîte de 100 compte 100 pièces par boîte. */
function blUnite(pr, q) {
  var n = typeof tailleBoite === 'function' ? tailleBoite(pr.nom) : 0;
  if (n > 1) return { u: 'pièces', q: q * n };
  return { u: pr.unite || 'u', q: q };
}
function blAjoute(map, u, q) { map[u] = (map[u] || 0) + q; }
function fN(n) { return Number(Math.round(n * 100) / 100).toLocaleString('fr-FR', { maximumFractionDigits: 2 }); }
function blQtes(map) { return Object.keys(map).sort(function (a, b) { return map[b] - map[a]; }).map(function (u) { return fN(map[u]) + ' ' + u; }).join(' · '); }
function blAn(mt, P) { return P.partiel ? Math.round(mt * 365 / P.jours) : mt; }

var BLM = { k: '' };
function blCalc(p) {
  var key = DBV + '|' + JSON.stringify([p.per, p.d1, p.d2, p.scope, p.q]);
  if (BLM.k === key) return BLM.r;
  var M = D(), P = blPeriode(p), ok = blFiltre(p);
  var R = { P: P, mt: 0, qt: {}, nAch: 0, sansPrix: 0, four: {}, prod: {}, mois: {}, es: {}, prixEvo: [] };
  var hist = {};   // prix payés par produit + fournisseur (dans la période)
  M.moves.forEach(function (m) {
    if (!blDans(m, P)) return;
    var pr = M.prod[m.produit]; if (!ok(pr)) return;
    var q = num(m.delta); if (!q) return;
    var e = R.es[m.produit] = R.es[m.produit] || { pid: m.produit, entre: 0, entreMt: 0, sorti: 0, sortiMt: 0, estime: false };
    if (m.type === 'entree' && q > 0 && !blRetour(m)) {            // un achat
      var f = m.fournisseur || pr.four || '', px = numOrNull(m.prix), u = blUnite(pr, q);
      e.entre += q;
      var k = m.produit + '|' + f, a = R.prod[k] = R.prod[k] || { pid: m.produit, four: f, q: 0, qp: 0, mt: 0, last: null, n: 0 };
      a.q += q; a.n++; R.nAch++; blAjoute(R.qt, u.u, u.q);
      var F = R.four[f] = R.four[f] || { id: f, mt: 0, qt: {}, prods: {} };
      blAjoute(F.qt, u.u, u.q); F.prods[m.produit] = 1;
      if (px !== null) {
        var mt = q * px; a.mt += mt; a.qp += q; R.mt += mt; F.mt += mt; e.entreMt += mt;
        if (!a.last || m.date > a.last.date) a.last = { date: m.date, prix: px };
        var mo = m.date.slice(0, 7); R.mois[mo] = R.mois[mo] || {}; R.mois[mo][f] = (R.mois[mo][f] || 0) + mt;
        (hist[k] = hist[k] || []).push({ date: m.date, prix: px });
      } else R.sansPrix++;
    } else if (m.type === 'sortie' || blRetour(m)) {                 // part sur un chantier (ou en revient)
      var pu = numOrNull(m.pu); if (pu === null) { var r = prixRef(m.produit); pu = r ? r.prix : null; if (pu !== null) e.estime = true; }
      e.sorti += -q; if (pu !== null) e.sortiMt += -q * pu;
    }
  });
  Object.keys(hist).forEach(function (k) {
    var h = hist[k].sort(function (a, b) { return a.date < b.date ? -1 : 1; });
    if (h.length < 2) return;
    var a = h[0], b = h[h.length - 1]; if (!a.prix || Math.abs(b.prix - a.prix) < 1e-6) return;
    R.prixEvo.push({ pid: k.split('|')[0], four: k.split('|')[1], de: a, a: b, n: h.length, pct: (b.prix - a.prix) / a.prix * 100 });
  });
  R.prixEvo.sort(function (x, y) { return Math.abs(y.pct) - Math.abs(x.pct); });
  R.fours = Object.keys(R.four).map(function (k) { return R.four[k]; }).sort(function (a, b) { return b.mt - a.mt; });
  R.prods = Object.keys(R.prod).map(function (k) { return R.prod[k]; }).sort(function (a, b) { return b.mt - a.mt || b.q - a.q; });
  R.esL = Object.keys(R.es).map(function (k) { var e = R.es[k]; e.stock = M.stock[k] || 0; var r = prixRef(k); e.val = r && e.stock > 0 ? e.stock * r.prix : 0; return e; })
    .sort(function (a, b) { return (b.sortiMt + b.entreMt) - (a.sortiMt + a.entreMt) || (b.sorti + b.entre) - (a.sorti + a.entre); });
  BLM = { k: key, r: R };
  return R;
}
function blChantiers(P) {
  var R = CH(), l = R.list.filter(function (c) { var d = chDate(c); return d && d >= P.deb && d <= P.fin; });
  var mois = {}, tot = 0, prods = {};
  var L = l.map(function (c) {
    var b = chBilan(c.id), mo = chDate(c).slice(0, 7);
    mois[mo] = (mois[mo] || 0) + 1; tot += b.total;
    b.lignes.forEach(function (x) { var p = prods[x.pid] = prods[x.pid] || { pid: x.pid, net: 0, cout: 0 }; p.net += x.net; p.cout += x.cout; });
    return { c: c, total: b.total, estime: b.estime };
  }).sort(function (a, b) { return b.total - a.total; });
  return { list: L, mois: mois, tot: tot, prods: Object.keys(prods).map(function (k) { return prods[k]; }).filter(function (x) { return x.net > 0; }).sort(function (a, b) { return b.cout - a.cout || b.net - a.net; }) };
}

/* ---------------- écran ---------------- */
var BL_TABS = [['achats', 'Achats'], ['es', 'Entrées / sorties'], ['prix', 'Prix'], ['ch', 'Chantiers']];
var BL_PER = [['an', 'Cette année'], ['12m', '12 derniers mois'], ['tout', 'Depuis le début'], ['dates', 'Dates…']];
SCREENS.bilan = function (p) {
  if (!isPatron()) { go('home', {}, { replace: true }); return ''; }
  var M = D(), tab = p.tab || 'achats', per = p.per || 'an';
  p.per = per;
  var below = '<div class="chips bl-tabs">' + BL_TABS.map(function (x) { return '<button class="chip ' + (tab === x[0] ? 'on' : '') + '" data-a="blTab" data-t="' + x[0] + '">' + x[1] + '</button>'; }).join('') + '</div>' +
    '<div class="bl-per">' + BL_PER.map(function (x) { return '<button class="' + (per === x[0] ? 'on' : '') + '" data-a="blPer" data-t="' + x[0] + '">' + x[1] + '</button>'; }).join('') + '</div>' +
    (per === 'dates' ? '<div class="bl-dates"><label>Du <input type="date" class="inp" data-i="bd1" value="' + esc(p.d1 || '') + '"></label><label>au <input type="date" class="inp" data-i="bd2" value="' + esc(p.d2 || '') + '"></label></div>' : '');
  if (tab !== 'ch') {
    var opts = '<option value="">Tous les produits</option>' + M.fams.map(function (f) {
      return '<option value="f:' + f.id + '"' + (p.scope === 'f:' + f.id ? ' selected' : '') + '>' + esc(f.nom) + '</option>' +
        (M.sfamsDe[f.id] || []).map(function (x) { return '<option value="s:' + x.id + '"' + (p.scope === 's:' + x.id ? ' selected' : '') + '>   ' + esc(f.nom) + ' › ' + esc(x.nom) + '</option>'; }).join('');
    }).join('');
    below += '<div class="bl-scope"><select class="inp" data-i="bscope" aria-label="Famille ou sous-famille">' + opts + '</select>' +
      '<input class="inp" data-i="bq" placeholder="Mot (ex. VIS 6X120)" autocomplete="off" value="' + esc(p.q || '') + '" aria-label="Chercher un produit"></div>';
  }
  var html = '<div class="screen">' + head({ back: false, title: 'Bilan', below: below }) + syncBar() + '<div class="scroll bl">';
  html += tab === 'es' ? blES(p) : tab === 'prix' ? blPrix(p) : tab === 'ch' ? blCh(p) : blAchats(p);
  return html + '</div>' + nav('bilan') + '</div>';
};
A.blTab = function (d) { VIEW.p.tab = d.t; VIEW.p.all = false; saveView(); render(false); };
A.blPer = function (d) { VIEW.p.per = d.t; saveView(); render(false); };
I.bscope = function (v) { VIEW.p.scope = v; VIEW.p.all = false; saveView(); render(false); };
I.bd1 = function (v) { VIEW.p.d1 = v; saveView(); render(false); };
I.bd2 = function (v) { VIEW.p.d2 = v; saveView(); render(false); };
var BLQ_T = null;
I.bq = function (v) { VIEW.p.q = v; saveView(); clearTimeout(BLQ_T); BLQ_T = setTimeout(function () { render(false); var inp = document.querySelector('[data-i="bq"]'); if (inp) { inp.focus(); inp.setSelectionRange(v.length, v.length); } }, 300); };
A.blAll = function () { VIEW.p.all = !VIEW.p.all; saveView(); render(false); };

function blPerTxt(P) {
  return 'du ' + fday(P.deb) + ' au ' + fday(P.fin) + (P.deb < P.prem ? ' · suivi depuis le ' + fday(P.prem) : '');
}
function blScopeTxt(p) {
  var M = D(), s = p.scope || '', t = s.indexOf('f:') === 0 ? famName(s.slice(2)) : s.indexOf('s:') === 0 ? famName((M.sfam[s.slice(2)] || {}).famille) + ' › ' + sfamName(s.slice(2)) : 'Tous les produits';
  return t + (p.q ? ' · « ' + p.q + ' »' : '');
}
function blBar(pct, coul) { return '<span class="bl-bar"><i style="width:' + Math.max(1.5, Math.min(100, pct)).toFixed(1) + '%;background:' + (coul || 'var(--navy)') + '"></i></span>'; }
function blFourNom(id) { return id ? fourName(id) : 'Sans fournisseur'; }
function blLogo(id) { var f = D().four[id]; return f && f.logo ? '<img class="bl-logo" src="' + f.logo + '" alt="">' : '<span class="bl-logo ph">' + esc((blFourNom(id) || '?').charAt(0)) + '</span>'; }

/* --- Achats : le cas de Jimmy (fournisseur unique) --- */
function blAchats(p) {
  var R = blCalc(p), P = R.P, h = '';
  h += '<div class="card bl-head"><span class="s">' + esc(blScopeTxt(p)) + ' · ' + blPerTxt(P) + '</span>' +
    '<div class="bl-kpis"><div><span>Acheté (HT)</span><b>' + fe(R.mt) + '</b></div>' +
    '<div><span>' + (P.partiel ? 'Rythme sur 1 an' : 'Sur 1 an') + '</span><b>' + (P.court ? '—' : (P.partiel ? '≈ ' : '') + fe(blAn(R.mt, P))) + '</b></div></div>' +
    (Object.keys(R.qt).length ? '<p class="bl-q">' + blQtes(R.qt) + '</p>' : '') +
    (P.court ? '<p class="bl-note">Seulement ' + P.jours + ' jour' + (P.jours > 1 ? 's' : '') + ' de suivi : le rythme sur 1 an s\'affichera à partir de 2 mois (avant, il serait trompeur). Il devient exact avec un an d\'achats.</p>' : P.partiel ? '<p class="bl-note">Estimé sur ' + P.jours + ' jours de suivi : le chiffre sur 1 an devient exact avec un an d\'achats.</p>' : '') +
    (R.sansPrix ? '<p class="bl-note warn">' + R.sansPrix + ' entrée' + (R.sansPrix > 1 ? 's' : '') + ' sans prix : comptée' + (R.sansPrix > 1 ? 's' : '') + ' en quantité, pas en euros.</p>' : '') + '</div>';
  if (!R.nAch) return h + '<div class="empty">Aucun achat sur cette période' + (p.scope || p.q ? ' pour ce choix' : '') + '.<br>Les achats viennent des factures rangées et des entrées avec un prix.</div>';
  // par fournisseur
  h += '<div class="bl-grid"><section class="card"><div class="card-title"><h2>Par fournisseur</h2><span class="s">' + R.fours.length + '</span></div>' +
    R.fours.map(function (F, i) {
      var pct = R.mt > 0 ? F.mt * 100 / R.mt : 0;
      return '<div class="bl-row">' + blLogo(F.id) + '<div class="grow"><div class="bl-l1"><b>' + esc(blFourNom(F.id)) + '</b><b>' + fe(F.mt) + '</b></div>' + blBar(pct, BL_COUL[i % BL_COUL.length]) +
        '<span class="s">' + Math.round(pct) + ' % · ' + Object.keys(F.prods).length + ' produit' + (Object.keys(F.prods).length > 1 ? 's' : '') + ' · ' + blQtes(F.qt) + (P.partiel && !P.court ? ' · ≈ ' + fe(blAn(F.mt, P)) + '/an' : '') + '</span></div></div>';
    }).join('') + '</section>';
  // par mois
  var mois = Object.keys(R.mois).sort(), max = 0, top = R.fours.slice(0, BL_COUL.length).map(function (F) { return F.id; });
  mois.forEach(function (mo) { var t = 0; Object.keys(R.mois[mo]).forEach(function (f) { t += R.mois[mo][f]; }); max = Math.max(max, t); });
  if (mois.length) h += '<section class="card"><div class="card-title"><h2>Par mois</h2></div>' + mois.map(function (mo) {
    var t = 0, seg = '';
    Object.keys(R.mois[mo]).forEach(function (f) { t += R.mois[mo][f]; });
    top.concat(['__autres']).forEach(function (f, i) {
      var v = f === '__autres' ? Object.keys(R.mois[mo]).filter(function (x) { return top.indexOf(x) < 0; }).reduce(function (a, x) { return a + R.mois[mo][x]; }, 0) : (R.mois[mo][f] || 0);
      if (v > 0) seg += '<i style="width:' + (v * 100 / max).toFixed(2) + '%;background:' + (f === '__autres' ? '#A3A5BC' : BL_COUL[i]) + '" title="' + esc(f === '__autres' ? 'Autres' : blFourNom(f)) + ' : ' + fe(v) + '"></i>';
    });
    return '<div class="bl-mois"><span class="m">' + MOIS[+mo.slice(5, 7) - 1] + ' ' + mo.slice(2, 4) + '</span><span class="bl-stack">' + seg + '</span><b>' + fe(t) + '</b></div>';
  }).join('') + '<div class="bl-leg">' + top.map(function (f, i) { return '<span><i style="background:' + BL_COUL[i] + '"></i>' + esc(blFourNom(f)) + '</span>'; }).join('') + '</div></section></div>';
  // par produit
  var n = p.all ? R.prods.length : Math.min(10, R.prods.length);
  h += '<section class="card"><div class="card-title"><h2>' + (p.all || R.prods.length <= 10 ? 'Par produit' : 'Les 10 plus gros achats') + '</h2>' +
    '<button class="link" data-a="blCsv">Exporter (Excel)</button></div>' +
    R.prods.slice(0, n).map(function (a) {
      var pr = D().prod[a.pid] || { nom: '?' }, u = blUnite(pr, a.q), pm = a.qp ? a.mt / a.qp : null;
      return '<button class="bl-row bl-prod" data-a="openProd" data-id="' + a.pid + '"><div class="grow"><div class="bl-l1"><span class="t">' + esc(pr.nom) + '</span><b>' + (a.mt ? fe(a.mt) : '—') + '</b></div>' +
        '<span class="s">' + esc(blFourNom(a.four)) + ' · ' + fN(u.q) + ' ' + u.u + (pm !== null ? ' · prix moyen ' + fePu(pm) + (a.last && Math.abs(a.last.prix - pm) > 1e-6 ? ' · dernier ' + fePu(a.last.prix) : '') : ' · sans prix') + '</span></div></button>';
    }).join('') +
    (R.prods.length > 10 ? '<button class="btn light" style="margin-top:8px" data-a="blAll">' + (p.all ? 'Voir les 10 premiers' : 'Voir les ' + R.prods.length + ' produits') + '</button>' : '') + '</section>';
  h += '<p class="bl-note" style="margin:4px 2px 16px">Pour négocier : choisis une famille ou une sous-famille (ex. Clous & vis › Vis), ou tape un mot. Le total, sa part chez chaque fournisseur et les prix moyens se mettent à jour.</p>';
  return h;
}
A.openProd = A.openProd || function (d) { go('prod', { id: d.id }); };
A.blCsv = function () {
  var R = blCalc(VIEW.p), M = D(), P = R.P;
  var cell = function (v) { v = String(v == null ? '' : v); return /[;"\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; };
  var nb = function (n) { return n === null || n === undefined ? '' : String(Math.round(n * 10000) / 10000).replace('.', ','); };
  var rows = [['Produit', 'Famille', 'Sous-famille', 'Fournisseur', 'Réf.', 'Quantité achetée', 'Unité', 'Montant HT', 'Prix moyen HT', 'Dernier prix HT', 'Dernier achat']];
  R.prods.forEach(function (a) {
    var pr = M.prod[a.pid] || {}, u = blUnite(pr, a.q), px = (M.prix[a.pid] || []).filter(function (x) { return x.fournisseur === a.four; })[0];
    rows.push([pr.nom, famName(pr.famille), sfamName(pr.sfam), blFourNom(a.four), px ? px.ref : '', nb(u.q), u.u, nb(a.mt), a.qp ? nb(a.mt / a.qp) : '', a.last ? nb(a.last.prix) : '', a.last ? fday(a.last.date) : '']);
  });
  var csv = '﻿' + rows.map(function (r) { return r.map(cell).join(';'); }).join('\r\n');
  downloadBlob(new Blob([csv], { type: 'text/csv;charset=utf-8' }), 'Achats_' + P.deb + '_' + P.fin + '.csv');
  toast('Fichier Excel enregistré', R.prods.length + ' produits · dans tes téléchargements');
};

/* --- Entrées / sorties par produit --- */
function blES(p) {
  var R = blCalc(p), P = R.P, L = R.esL, te = 0, ts = 0, tv = 0, est = false;
  L.forEach(function (e) { te += e.entreMt; ts += e.sortiMt; tv += e.val; if (e.estime) est = true; });
  var h = '<div class="card bl-head"><span class="s">' + esc(blScopeTxt(p)) + ' · ' + blPerTxt(P) + '</span>' +
    '<div class="bl-kpis three"><div><span>Entré (acheté)</span><b class="g">' + fe(te) + '</b></div><div><span>Sorti (chantiers)</span><b class="r">' + fe(ts) + '</b></div><div><span>En stock aujourd\'hui</span><b>' + fe(tv) + '</b></div></div>' +
    (est ? '<p class="bl-note">Les sorties d\'avant le suivi des chantiers sont comptées au prix actuel (estimé).</p>' : '') + '</div>';
  if (!L.length) return h + '<div class="empty">Aucun mouvement sur cette période' + (p.scope || p.q ? ' pour ce choix' : '') + '.</div>';
  var n = p.all ? L.length : Math.min(25, L.length);
  h += '<section class="card"><div class="card-title"><h2>Par produit</h2><span class="s">' + L.length + '</span></div>' +
    '<div class="bl-es-h"><span></span><span>Entré</span><span>Sorti</span><span>Stock</span></div>' +
    L.slice(0, n).map(function (e) {
      var pr = D().prod[e.pid] || { nom: '?' }, u = pr.unite ? ' ' + esc(pr.unite) : '';
      return '<button class="bl-es" data-a="openProd" data-id="' + e.pid + '"><span class="t">' + esc(pr.nom) + '</span>' +
        '<span class="g">' + (e.entre ? '+' + fN(e.entre) + u + (e.entreMt ? '<small>' + fe(e.entreMt) + '</small>' : '') : '—') + '</span>' +
        '<span class="r">' + (e.sorti ? '−' + fN(e.sorti) + u + (e.sortiMt ? '<small>' + fe(e.sortiMt) + '</small>' : '') : '—') + '</span>' +
        '<span>' + fN(e.stock) + u + (e.val ? '<small>' + fe(e.val) + '</small>' : '') + '</span></button>';
    }).join('') +
    (L.length > 25 ? '<button class="btn light" style="margin-top:8px" data-a="blAll">' + (p.all ? 'Voir moins' : 'Voir les ' + L.length + ' produits') + '</button>' : '') + '</section>';
  return h;
}

/* --- Évolution des prix --- */
function blPrix(p) {
  var R = blCalc(p), P = R.P, L = R.prixEvo, up = L.filter(function (x) { return x.pct > 0; }).length;
  var h = '<div class="card bl-head"><span class="s">' + esc(blScopeTxt(p)) + ' · ' + blPerTxt(P) + '</span>' +
    '<div class="bl-kpis"><div><span>Prix en hausse</span><b class="r">' + up + '</b></div><div><span>Prix en baisse</span><b class="g">' + (L.length - up) + '</b></div></div>' +
    '<p class="bl-note">Compare le 1er et le dernier prix payé pour un même produit chez un même fournisseur, sur la période.</p></div>';
  if (!L.length) return h + '<div class="empty">Pas encore de changement de prix à montrer.<br>Il faut au moins 2 achats du même produit chez le même fournisseur, à des prix différents.</div>';
  return h + '<section class="card">' + L.map(function (x) {
    var pr = D().prod[x.pid] || { nom: '?' };
    return '<button class="bl-row bl-prod" data-a="openProd" data-id="' + x.pid + '"><div class="grow"><div class="bl-l1"><span class="t">' + esc(pr.nom) + '</span><b class="' + (x.pct > 0 ? 'r' : 'g') + '">' + (x.pct > 0 ? '+' : '−') + fN(Math.abs(x.pct)) + ' %</b></div>' +
      '<span class="s">' + esc(blFourNom(x.four)) + ' · ' + fePu(x.de.prix) + ' le ' + fday(x.de.date) + ' → ' + fePu(x.a.prix) + ' le ' + fday(x.a.date) + ' · ' + x.n + ' achats</span></div></button>';
  }).join('') + '</section>';
}

/* --- Chantiers --- */
function blCh(p) {
  var P = blPeriode(p), C = blChantiers(P), nb = C.list.length;
  var nbMois = Math.max(1, Math.round(P.jours / 30.4));
  var h = '<div class="card bl-head"><span class="s">Chantiers commencés ' + blPerTxt(P) + '</span>' +
    '<div class="bl-kpis three"><div><span>Chantiers</span><b>' + nb + '</b></div><div><span>Par mois (moyenne)</span><b>' + fN(Math.round(nb / nbMois * 10) / 10) + '</b></div><div><span>Matériel HT</span><b>' + fe(C.tot) + '</b></div></div>' +
    (nb ? '<p class="bl-q">Coût moyen par chantier : <b>' + fe(C.tot / nb) + '</b>' + (P.partiel && !P.court ? ' · rythme sur 1 an ≈ ' + Math.round(nb * 365 / P.jours) + ' chantiers' : '') + '</p>' : '') + '</div>';
  if (!nb) return h + '<div class="empty">Aucun chantier commencé sur cette période.</div>';
  var mois = Object.keys(C.mois).sort(), max = Math.max.apply(null, mois.map(function (m) { return C.mois[m]; }));
  h += '<div class="bl-grid"><section class="card"><div class="card-title"><h2>Les plus gros chantiers</h2></div>' + C.list.slice(0, 5).map(function (x, i) {
    return '<button class="bl-row bl-prod" data-a="go" data-r="chantier" data-id="' + x.c.id + '"><span class="bl-rang">' + (i + 1) + '</span><div class="grow"><div class="bl-l1"><span class="t">' + esc(x.c.nom) + '</span><b>' + fe(x.total) + '</b></div>' +
      '<span class="s">' + esc(chDates(x.c) || '') + (x.estime ? ' · en partie estimé' : '') + '</span></div></button>';
  }).join('') + '</section>' +
    '<section class="card"><div class="card-title"><h2>Chantiers par mois</h2></div>' + mois.map(function (m) {
      return '<div class="bl-mois"><span class="m">' + MOIS[+m.slice(5, 7) - 1] + ' ' + m.slice(2, 4) + '</span><span class="bl-stack"><i style="width:' + (C.mois[m] * 100 / max).toFixed(1) + '%;background:var(--navy)"></i></span><b>' + C.mois[m] + '</b></div>';
    }).join('') + '</section></div>';
  h += '<section class="card"><div class="card-title"><h2>Ce qui part le plus sur les chantiers</h2></div>' + C.prods.slice(0, 10).map(function (x) {
    var pr = D().prod[x.pid] || { nom: '?' };
    return '<button class="bl-row bl-prod" data-a="openProd" data-id="' + x.pid + '"><div class="grow"><div class="bl-l1"><span class="t">' + esc(pr.nom) + '</span><b>' + (x.cout ? fe(x.cout) : '—') + '</b></div><span class="s">' + fN(x.net) + (pr.unite ? ' ' + esc(pr.unite) : '') + ' sorti' + (x.net > 1 ? 's' : '') + '</span></div></button>';
  }).join('') + '</section>';
  return h;
}
