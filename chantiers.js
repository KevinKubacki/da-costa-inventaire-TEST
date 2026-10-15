/* Stock Da Costa — suivi de chantier (V3.7)
   Un chantier = une ligne de l'onglet Chantiers. Les mouvements y sont rattachés par son id (colonne chantier),
   ou, pour les anciennes sorties, par le nom tapé (colonne lieu). Le coût utilise le prix figé par le script
   au jour de la sortie (colonne pu) ; à défaut, le prix actuel (« estimé »). Le salarié ne voit jamais les prix. */
'use strict';

IC.casque = '<path d="M2 17h20v2.5H2z"/><path d="M4 17a8 8 0 0 1 16 0"/><path d="M10 9.3V17M14 9.3V17"/>';

/* ---------------- données ---------------- */
var CHM = { v: -1 };
var CH_HORS = ['a la voix', 'retour de chantier', 'livraison (a la voix)'];
function chNorm(s) { return norm(String(s || '')).replace(/^chantier\s+/, '').replace(/[^a-z0-9]+/g, ' ').trim(); }
function CH() {
  if (CHM.v === DBV) return CHM;
  var M = D(), R = { v: DBV, all: [], list: [], by: {}, byNom: {}, mv: {}, st: {} };
  Object.keys(DB.Chantiers || {}).forEach(function (k) { var c = DB.Chantiers[k]; if (c && c.id) { R.all.push(c); R.by[c.id] = c; } });
  R.list = R.all.filter(function (c) { return c.actif !== '0'; });
  R.list.forEach(function (c) { var k = chNorm(c.nom); if (k && !R.byNom[k]) R.byNom[k] = c; });
  M.moves.forEach(function (m) {
    var id = chDe(m, R);
    if (id) (R.mv[id] = R.mv[id] || []).push(m);
  });
  CHM = R;
  return R;
}
/** À quel chantier appartient ce mouvement ? */
function chDe(m, R) {
  R = R || CH();
  if (m.chantier && R.by[m.chantier]) return m.chantier;
  if (m.type === 'sortie' && m.lieu) { var c = R.byNom[chNorm(m.lieu)]; if (c) return c.id; }
  return '';
}
function chNom(id) { var c = CH().by[id]; return c ? c.nom : ''; }
function chFini(c) { return !!(c.fin && c.fin < todayIsoDate()); }
/** Date de référence du chantier (début, sinon 1er mouvement). */
function chDate(c) { var mv = CH().mv[c.id] || []; return c.debut || (mv.length ? mv[mv.length - 1].date.slice(0, 10) : (c.cree || '').slice(0, 10)); }
function chDernier(c) { var mv = CH().mv[c.id] || []; return mv.length ? mv[0].date : (c.cree || ''); }
/** Le bilan d'un chantier : par produit, sorti / revenu / net / coût. */
function chBilan(id) {
  var R = CH();
  if (R.st[id]) return R.st[id];
  var M = D(), P = {}, tot = 0, estime = false, n = 0;
  (R.mv[id] || []).forEach(function (m) {
    var q = num(m.delta); if (!q) return;
    var x = P[m.produit] = P[m.produit] || { pid: m.produit, sorti: 0, revenu: 0, cout: 0, estime: false, pu: null };
    var pu = numOrNull(m.pu), est = false;
    if (pu === null) { var pr = prixRef(m.produit); pu = pr ? pr.prix : null; est = true; }
    if (q < 0) x.sorti += -q; else x.revenu += q;
    if (pu !== null) { x.cout += -q * pu; x.pu = pu; if (est) { x.estime = true; estime = true; } }
    n++;
  });
  var lignes = Object.keys(P).map(function (k) { var x = P[k]; x.net = round3(x.sorti - x.revenu); x.cout = Math.round(x.cout * 100) / 100; tot += x.cout; return x; })
    .sort(function (a, b) { return (b.cout - a.cout) || (b.net - a.net); });
  return (R.st[id] = { lignes: lignes, total: Math.round(tot * 100) / 100, estime: estime, nb: n, sansPrix: lignes.filter(function (x) { return x.pu === null; }).length });
}
var MOIS_C = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];
function chJour(d) { if (!d) return ''; var y = +d.slice(0, 4), m = +d.slice(5, 7), j = +d.slice(8, 10); return j + ' ' + MOIS_C[m - 1] + (y !== +todayIsoDate().slice(0, 4) ? ' ' + y : ''); }
function chDates(c) {
  var d = c.debut, f = c.fin;
  if (d && f) return chJour(d) + ' → ' + chJour(f);
  if (d) return 'depuis le ' + chJour(d);
  if (f) return 'jusqu\'au ' + chJour(f);
  return '';
}
/** Crée un chantier (nom tel qu'il est tapé, 1re lettre en majuscule). Renvoie son id. */
function chCreer(nom, opt) {
  nom = String(nom || '').replace(/\s+/g, ' ').trim();
  if (!nom) return '';
  var ex = CH().byNom[chNorm(nom)]; if (ex) return ex.id;
  var id = uid('ch');
  commit(put('Chantiers', { id: id, nom: nom.charAt(0).toUpperCase() + nom.slice(1), debut: (opt && opt.debut) || todayIsoDate(), fin: '', notes: '', actif: '1', cree: nowIso(), qui: ME }));
  return id;
}

/* ---------------- reprise des anciens noms tapés (une seule fois, téléphone du patron, script 3.4 ou plus) ---------------- */
function chReprise() {
  if (!LOADED || !isPatron() || D().reg.chantiersRepris === '1') return;
  if (!verAuMoins(SYNC.version, '3.4')) return;
  var M = D(), R = CH(), vus = {}, ops = [];
  M.moves.slice().reverse().forEach(function (m) {
    if (m.type !== 'sortie' || !m.lieu || m.chantier) return;
    var k = chNorm(m.lieu);
    if (!k || CH_HORS.indexOf(norm(m.lieu).trim()) >= 0 || R.byNom[k] || vus[k]) return;
    vus[k] = 1;
    ops.push(put('Chantiers', { id: uid('ch'), nom: m.lieu.trim().charAt(0).toUpperCase() + m.lieu.trim().slice(1), debut: m.date.slice(0, 10), fin: '', notes: 'Repris des anciennes sorties', actif: '1', cree: nowIso(), qui: ME }));
  });
  ops.push(put('Reglages', { id: 'chantiersRepris', valeur: '1' }));
  commit(ops);
}
(function () {
  var prev = window.onDataChange;
  window.onDataChange = function (x) { if (prev) prev(x); setTimeout(chReprise, 0); };
})();

/* ---------------- liste des chantiers ---------------- */
function chFiltre(p) {
  var R = CH(), nq = chNorm(p.q || ''), f = p.f || 'cours', tri = p.tri || 'recent';
  var l = R.list.filter(function (c) {
    if (f === 'cours' && chFini(c)) return false;
    if (f === 'fini' && !chFini(c)) return false;
    if (nq && chNorm(c.nom + ' ' + (c.notes || '')).indexOf(nq) < 0) return false;
    return true;
  });
  l.sort(function (a, b) {
    if (tri === 'az') return cmp(a.nom, b.nom);
    var da = chDate(a), db = chDate(b);
    return tri === 'ancien' ? (da < db ? -1 : da > db ? 1 : cmp(a.nom, b.nom)) : (da < db ? 1 : da > db ? -1 : cmp(a.nom, b.nom));
  });
  return l;
}
function chRow(c, sel) {
  var b = chBilan(c.id), patron = isPatron(), np = b.lignes.length;
  var sub = [chDates(c), np ? np + ' produit' + (np > 1 ? 's' : '') : 'rien de sorti'].filter(Boolean).join(' · ');
  return '<button class="row chrow' + (sel ? ' sel' : '') + '" data-a="chOpen" data-id="' + c.id + '"><span class="ch-ic' + (chFini(c) ? ' fini' : '') + '">' + ic('casque') + '</span>' +
    '<div class="grow"><span class="t">' + esc(c.nom) + '</span><span class="s">' + esc(sub) + '</span></div>' +
    (patron && b.total ? '<b class="ch-cout">' + fe(b.total) + '</b>' : '') + (chFini(c) ? '<span class="badge">terminé</span>' : '') + '</button>';
}
SCREENS.chantiers = function (p) {
  var l = chFiltre(p), tri = p.tri || 'recent', f = p.f || 'cours', W = wide();
  var below = '<div class="ch-tri">' + [['recent', 'Plus récents'], ['ancien', 'Plus anciens'], ['az', 'A → Z']].map(function (x) {
    return '<button class="' + (tri === x[0] ? 'on' : '') + '" data-a="chTri" data-t="' + x[0] + '">' + x[1] + '</button>'; }).join('') + '</div>' +
    '<div class="chips">' + [['cours', 'En cours'], ['fini', 'Terminés'], ['tous', 'Tous']].map(function (x) {
      return '<button class="chip ' + (f === x[0] ? 'on' : '') + '" data-a="chF" data-f="' + x[0] + '">' + x[1] + '</button>'; }).join('') + '</div>';
  var liste = l.length ? '<div class="list" id="chlist">' + l.map(function (c) { return chRow(c, W && p.sel === c.id); }).join('') + '</div>'
    : '<div class="empty">' + (p.q ? 'Aucun chantier trouvé' : f === 'fini' ? 'Aucun chantier terminé' : 'Aucun chantier pour l\'instant.<br>Crée-le ici, ou choisis-le quand tu sors du matériel.') + '</div>';
  var html = '<div class="screen">' + head({ back: isPatron(), title: 'Chantiers',
    right: '<button class="small-btn" style="background:var(--green);color:#fff;border:0" data-a="chNew">' + ic('plus') + 'Nouveau</button>',
    extra: searchBox('chq', 'Chercher un chantier…', p.q), below: below }) + syncBar() + '<div class="scroll">';
  if (W && p.sel && CH().by[p.sel]) html += '<div class="ch-2col"><div class="ch-col">' + liste + '</div><div class="ch-col ch-detail">' + chCorps(CH().by[p.sel], true) + '</div></div>';
  else html += liste;
  return html + '</div>' + nav(isPatron() ? 'inventaire' : 'chantiers') + '</div>';
};
A.chTri = function (d) { VIEW.p.tri = d.t; saveView(); render(false); };
A.chF = function (d) { VIEW.p.f = d.f; saveView(); render(false); };
var CHQ_T = null;
I.chq = function (v) { VIEW.p.q = v; saveView(); clearTimeout(CHQ_T); CHQ_T = setTimeout(function () { render(false); var inp = document.querySelector('[data-i="chq"]'); if (inp) { inp.focus(); inp.setSelectionRange(v.length, v.length); } }, 250); };
A.chOpen = function (d) {
  if (wide() && VIEW.r === 'chantiers') { VIEW.p.sel = d.id; saveView(); render(false); return; }
  go('chantier', { id: d.id });
};
A.chNew = function () { go('chantierEdit', { id: '', nom: VIEW.p && VIEW.p.q || '', debut: todayIsoDate(), fin: '', notes: '' }); };

/* ---------------- fiche d'un chantier ---------------- */
function chCorps(c, inList) {
  var M = D(), b = chBilan(c.id), patron = isPatron(), mv = CH().mv[c.id] || [];
  var h = '';
  if (inList) h += '<div class="ch-dhead"><div class="grow"><h2>' + esc(c.nom) + '</h2><span class="s">' + esc(chDates(c) || 'sans date') + (chFini(c) ? ' · terminé' : '') + '</span></div>' +
    '<button class="small-btn" data-a="chEdit" data-id="' + c.id + '">' + ic('edit') + 'Modifier</button></div>';
  if (patron) h += '<div class="card ch-tot"><span class="s">Coût du matériel HT</span><b>' + fe(b.total) + '</b>' +
    (b.estime ? '<span class="s">dont des sorties d\'avant le suivi : prix actuel (estimé)</span>' : '') +
    (b.sansPrix ? '<span class="s warn">' + b.sansPrix + ' produit' + (b.sansPrix > 1 ? 's' : '') + ' sans prix : non compté' + (b.sansPrix > 1 ? 's' : '') + '</span>' : '') + '</div>';
  h += '<div class="ch-acts"><button class="btn red" data-a="chSortir" data-id="' + c.id + '">' + ic('minus') + 'Sortir</button>' +
    '<button class="btn green" data-a="chRetour" data-id="' + c.id + '">' + ic('plus') + 'Retour</button>' +
    '<button class="btn ch-mic" data-a="chParler" data-id="' + c.id + '" aria-label="Parler pour ce chantier">' + ic('mic') + '</button></div>';
  h += '<div class="sec-title"><span>Matériel utilisé</span><span class="s" style="color:var(--muted);font-size:14px;font-weight:600">' + b.lignes.length + ' produit' + (b.lignes.length > 1 ? 's' : '') + '</span></div>';
  h += '<div class="card ch-mat">' + (b.lignes.length ? b.lignes.map(function (x) {
    var pr = M.prod[x.pid];
    var sub = 'sorti ' + fq(x.sorti) + (x.revenu ? ' · revenu ' + fq(x.revenu) : '') + (patron && x.pu !== null ? ' · ' + fePu(x.pu) + '/u' + (x.estime ? ' (estimé)' : '') : '');
    return '<button class="line" data-a="openProd" data-id="' + x.pid + '"><span class="mv out ch-net">' + fq(x.net) + '</span><div class="grow"><span class="t ell">' + esc(pr ? pr.nom : 'Produit supprimé') + '</span>' +
      '<span class="s ell">' + esc(sub) + '</span></div>' + (patron && x.pu !== null ? '<b class="ch-cout">' + fe(x.cout) + '</b>' : '') + '</button>';
  }).join('') : '<div class="empty">Rien n\'est encore sorti pour ce chantier.</div>') + '</div>';
  if (c.notes) h += '<div class="sec-title"><span>Notes</span></div><div class="card"><p style="margin:0;white-space:pre-wrap">' + esc(c.notes) + '</p></div>';
  h += '<div class="sec-title"><span>Mouvements</span><span class="s" style="color:var(--muted);font-size:14px;font-weight:600">' + mv.length + '</span></div>' +
    '<div class="card" style="padding-top:2px;padding-bottom:2px">' + (mv.length ? mv.slice(0, 200).map(mvRow).join('') : '<div class="empty">Aucun mouvement</div>') + '</div>';
  return h;
}
SCREENS.chantier = function (p) {
  var c = CH().by[p.id];
  if (!c) return SCREENS.chantiers(VIEW.p = {});
  return '<div class="screen">' + head({ title: esc(c.nom), sub: esc((chDates(c) || 'sans date') + (chFini(c) ? ' · terminé' : '')),
    right: '<button class="icon-btn" data-a="chEdit" data-id="' + c.id + '" aria-label="Modifier le chantier">' + ic('edit') + '</button>' }) + syncBar() +
    '<div class="scroll">' + chCorps(c, false) + '</div>' + nav(isPatron() ? 'inventaire' : 'chantiers') + '</div>';
};
var CH_FROM = '';   // sortie / retour lancé depuis la fiche d'un chantier : « Terminé » y ramène
A.chSortir = function (d) { CH_FROM = d.id; go('pick', { mode: 'S', ch: d.id }); };
A.chRetour = function (d) { CH_FROM = d.id; go('pick', { mode: 'E', ch: d.id, retour: 1 }); };
A.chParler = function (d) { if (A.vxOpen) A.vxOpen({ ch: d.id }); };
A.chEdit = function (d) { var c = CH().by[d.id]; if (!c) return; go('chantierEdit', { id: c.id, nom: c.nom, debut: c.debut || '', fin: c.fin || '', notes: c.notes || '' }); };

/* ---------------- créer / modifier ---------------- */
SCREENS.chantierEdit = function (p) {
  var c = p.id ? CH().by[p.id] : null, nb = c ? (CH().mv[c.id] || []).length : 0;
  var h = '<div class="screen">' + head({ title: c ? 'Modifier le chantier' : 'Nouveau chantier' }) + '<div class="scroll nonav">' +
    '<div class="field"><label for="chn">Nom du chantier</label><input id="chn" class="inp" data-i="chEd" data-k="nom" autocomplete="off" placeholder="ex. Martin, Paris 16e, Mairie de Ladon" value="' + esc(p.nom || '') + '"' + (c ? '' : ' autofocus') + '></div>' +
    '<div class="ch-dates"><div class="field"><label for="chd">Début <span class="help">(facultatif)</span></label><input id="chd" type="date" class="inp" data-c="chEdD" data-k="debut" value="' + esc(p.debut || '') + '"></div>' +
    '<div class="field"><label for="chf">Fin <span class="help">(facultatif)</span></label><input id="chf" type="date" class="inp" data-c="chEdD" data-k="fin" value="' + esc(p.fin || '') + '"></div></div>' +
    (p.fin ? '<button class="link" data-a="chFinVide">Enlever la date de fin (chantier en cours)</button>' : '<button class="link" data-a="chFinAuj">Chantier terminé aujourd\'hui</button>') +
    '<div class="field" style="margin-top:14px"><label for="chno">Notes <span class="help">(facultatif)</span></label><textarea id="chno" class="inp" rows="3" data-i="chEd" data-k="notes" placeholder="Adresse, client, remarques…">' + esc(p.notes || '') + '</textarea></div>';
  if (c && isPatron()) h += '<button class="btn danger" style="margin-top:18px" data-a="chSuppr">' + ic('trash') + (nb ? 'Retirer de la liste' : 'Supprimer ce chantier') + '</button>' +
    (nb ? '<p style="font-size:13px;color:var(--muted);margin:8px 4px 0">Ses ' + nb + ' mouvements restent dans l\'historique.</p>' : '');
  return h + '</div><div class="bottom-bar"><button class="btn" data-a="chSave" style="height:58px;font-size:21px">' + (c ? 'Enregistrer' : 'Créer le chantier') + '</button></div></div>';
};
I.chEd = function (v, el) { VIEW.p[el.getAttribute('data-k')] = v; saveView(); };
C.chEdD = function (v, el) { VIEW.p[el.getAttribute('data-k')] = v; saveView(); render(false); };
A.chFinAuj = function () { VIEW.p.fin = todayIsoDate(); saveView(); render(false); };
A.chFinVide = function () { VIEW.p.fin = ''; saveView(); render(false); };
A.chSave = function () {
  var p = VIEW.p, nom = String(p.nom || '').replace(/\s+/g, ' ').trim(), R = CH();
  if (!nom) { toast('Il manque le nom', 'Donne un nom au chantier'); return; }
  if (p.debut && p.fin && p.fin < p.debut) { toast('Dates à vérifier', 'La fin est avant le début'); return; }
  var dbl = R.byNom[chNorm(nom)];
  if (dbl && dbl.id !== p.id) { toast('Ce chantier existe déjà', dbl.nom); return; }
  nom = nom.charAt(0).toUpperCase() + nom.slice(1);
  if (!p.id) {
    var id = uid('ch');
    commit(put('Chantiers', { id: id, nom: nom, debut: p.debut || '', fin: p.fin || '', notes: p.notes || '', actif: '1', cree: nowIso(), qui: ME }));
    toast('Chantier créé', nom);
    go('chantier', { id: id }, { replace: true });
    return;
  }
  var c = R.by[p.id], ops = [put('Chantiers', { id: c.id, nom: nom, debut: p.debut || '', fin: p.fin || '', notes: p.notes || '' })];
  // renommé : les anciennes sorties liées par le nom gardent le lien
  if (c.nom !== nom) (R.mv[c.id] || []).forEach(function (m) { if (!m.chantier) ops.push(put('Mouvements', { id: m.id, chantier: c.id })); });
  commit(ops);
  toast('Chantier enregistré', nom);
  back();
};
A.chSuppr = function () {
  var c = CH().by[VIEW.p.id]; if (!c) return;
  var nb = (CH().mv[c.id] || []).length;
  ask({ title: nb ? 'Retirer ce chantier de la liste ?' : 'Supprimer ce chantier ?', text: nb ? 'Ses mouvements restent dans l\'historique et le stock ne change pas.' : 'Rien n\'a été sorti pour ce chantier.', ok: nb ? 'Retirer' : 'Supprimer', danger: true }).then(function (ok) {
    if (!ok) return;
    var ops = [nb ? put('Chantiers', { id: c.id, actif: '0' }) : del('Chantiers', c.id)];
    if (nb) (CH().mv[c.id] || []).forEach(function (m) { if (!m.chantier) ops.push(put('Mouvements', { id: m.id, chantier: c.id })); });
    commit(ops);
    go('chantiers', {}, { replace: true });
  });
};

/* ---------------- choisir un chantier (sortie, retour, voix) ---------------- */
var CHP = null;
function chChoix(opt) {
  CHP = opt || {};
  openSheet('<h3>' + esc(CHP.titre || 'Quel chantier ?') + '</h3>' +
    '<div class="search" style="margin:4px 0 10px">' + ic('search') + '<input type="search" autocomplete="off" placeholder="Chercher ou taper un nouveau nom" data-i="chpq" autofocus></div>' +
    '<div id="chpl" class="chp-list">' + chChoixListe('') + '</div>');
}
function chChoixListe(q) {
  var R = CH(), nq = chNorm(q);
  var l = R.list.filter(function (c) { return !nq || chNorm(c.nom).indexOf(nq) >= 0 || nq.split(' ').every(function (w) { return chNorm(c.nom).indexOf(w) >= 0; }); })
    .sort(function (a, b) { return (chFini(a) - chFini(b)) || (chDernier(a) < chDernier(b) ? 1 : chDernier(a) > chDernier(b) ? -1 : 0); });
  var exact = nq && R.byNom[nq];
  var h = q.trim() && !exact ? '<button class="row chp-new" data-a="chPickNew"><span class="ch-ic new">' + ic('plus') + '</span><div class="grow"><span class="t">Créer le chantier « ' + esc(q.trim()) + ' »</span><span class="s">nouveau, à partir d\'aujourd\'hui</span></div></button>' : '';
  h += l.slice(0, 40).map(function (c) {
    return '<button class="row" data-a="chPick" data-id="' + c.id + '"><span class="ch-ic' + (chFini(c) ? ' fini' : '') + '">' + ic('casque') + '</span><div class="grow"><span class="t">' + esc(c.nom) + '</span><span class="s">' + esc([chDates(c), chFini(c) ? 'terminé' : ''].filter(Boolean).join(' · ')) + '</span></div></button>';
  }).join('');
  if (!l.length && !q.trim()) h += '<div class="empty">Aucun chantier encore : tape son nom pour le créer.</div>';
  return h;
}
I.chpq = function (v) { if (CHP) CHP.q = v; var el = document.getElementById('chpl'); if (el) el.innerHTML = chChoixListe(v); };
A.chPick = function (d) { var cb = CHP && CHP.ok; CHP = null; closeSheet(function () { if (cb) cb(d.id); }); };
A.chPickNew = function () { var q = CHP && CHP.q, cb = CHP && CHP.ok; CHP = null; var id = chCreer(q); closeSheet(function () { if (cb && id) cb(id); }); };

/* ---------------- branchement dans la sortie / le retour à la main ---------------- */
// Le choix du produit garde le chantier ; un bandeau rappelle pour quel chantier on sort / quel retour on fait.
(function () {
  var pick0 = SCREENS.pick;
  SCREENS.pick = function (p) {
    var h = pick0(p);
    if (!p.ch || !CH().by[p.ch]) return h;
    var ban = '<div class="ch-banner ' + (p.mode === 'S' ? 'out' : 'in') + '">' + ic('casque') + '<span>' + (p.mode === 'S' ? 'Sortie pour le chantier ' : 'Retour du chantier ') + '<b>' + esc(chNom(p.ch)) + '</b></span></div>';
    return h.replace('<div class="scroll">', '<div class="scroll">' + ban);
  };
  var pickProd0 = A.pickProd;
  A.pickProd = function (d) {
    var p = VIEW.p;
    if (!p.ch) return pickProd0(d);
    go('mvt', { mode: p.mode, pid: d.id, n: 1, ch: p.ch, four: p.retour || p.mode === 'E' ? 'retour' : '', from: 'pick', q: p.q || '', f: p.f || '', retour: p.retour || '' }, { replace: true });
  };
  var pickDone0 = A.pickDone;
  A.pickDone = function () { var id = CH_FROM; CH_FROM = ''; if (id && CH().by[id]) { go('chantier', { id: id }, { replace: true }); return; } pickDone0(); };
})();
/** Le champ « chantier » de l'écran Sortie / Retour. */
function chChamp(p, S) {
  var c = p.ch ? CH().by[p.ch] : null;
  var titre = S ? 'Pour quel chantier ?' : 'De quel chantier ?';
  var h = '<div class="field"><span class="flabel">' + titre + (S ? ' <span class="help">(facultatif)</span>' : '') + '</span>' +
    '<button class="chsel' + (c ? ' on' : (S ? '' : ' need')) + '" data-a="mvCh">' + ic('casque') + '<span class="grow">' + (c ? esc(c.nom) : 'Choisir un chantier') + '</span>' +
    (c ? '<span class="chsel-x" data-a="mvChX" aria-label="Enlever le chantier">' + ic('x') + '</span>' : ic('chev')) + '</button>';
  if (!c) {   // raccourci : le dernier chantier où j'ai sorti du matériel
    var M = D(), last = null;
    M.moves.some(function (m) { if (m.qui === ME && m.type === 'sortie') { var id = chDe(m); if (id && !chFini(CH().by[id])) { last = id; return true; } } return false; });
    if (last) h += '<div class="chips wrap" style="margin-top:8px"><button class="chip" data-a="mvChSet" data-id="' + last + '">' + ic('history') + esc(chNom(last)) + '</button></div>';
  }
  return h + '</div>';
}
A.mvCh = function () {
  var S = VIEW.p.mode === 'S';
  chChoix({ titre: S ? 'Pour quel chantier ?' : 'Retour de quel chantier ?', ok: function (id) { VIEW.p.ch = id; if (!S) VIEW.p.four = 'retour'; saveView(); render(false); } });
};
A.mvChX = function () { VIEW.p.ch = ''; saveView(); render(false); };
A.mvChSet = function (d) { VIEW.p.ch = d.id; saveView(); render(false); };
(function () {
  var mvt0 = SCREENS.mvt;
  SCREENS.mvt = function (p) {
    var S = p.mode === 'S';
    if (p.lieu && !p.ch && S) { var c = CH().byNom[chNorm(p.lieu)]; if (c) p.ch = c.id; }
    var h = mvt0(p);
    return h;
  };
  var save0 = A.saveMvt;
  A.saveMvt = function () { var p = VIEW.p; if (p.mode !== 'S' && p.four === 'retour' && !p.ch) { A.mvCh(); return; } save0(); };
  var mvFour0 = A.mvFour;
  A.mvFour = function (d) { mvFour0(d); if (VIEW.p.four !== 'retour') { VIEW.p.ch = ''; saveView(); } else if (!VIEW.p.ch) A.mvCh(); };
})();
