/* Stock Da Costa — version ordinateur et tablette (V3.0)
   Même appli, mêmes données : au-delà de 900 px de large, menu à gauche et écrans adaptés.
   Le téléphone ne change pas. */
'use strict';

/* ---------------- la coquille : menu à gauche ---------------- */
var SECTION = {
  home: 'home', stock: 'stock', prod: 'stock', edit: 'stock', pick: 'stock', mvt: 'stock',
  commandes: 'commandes', factures: 'factures', factureFiche: 'factures', facture: 'factures', verif: 'factures',
  inventaire: 'inventaire', comptage: 'inventaire', histo: 'inventaire',
  fours: 'fours', four: 'fours', fourEdit: 'fours',
  reglages: 'reglages', equipe: 'reglages', user: 'reglages', entreprise: 'reglages', fams: 'reglages'
};
function sideNav() {
  var M = D(), u = me(), patron = isPatron(), cur = SECTION[VIEW.r] || '';
  if (!patron && cur === 'inventaire') cur = 'histo';
  var items = [['home', 'home', patron ? 'Bureau' : 'Accueil'], ['stock', 'stock', 'Stock'], ['commandes', 'bell', 'À commander']];
  if (patron) { items.push(['factures', 'file', 'Factures']); items.push(['inventaire', 'inv', 'Inventaire & comptable']); }
  else items.push(['histo', 'history', 'Historique']);
  items.push(['fours', 'truck', 'Fournisseurs']);
  items.push(['reglages', 'gear', 'Réglages']);
  var n = M.aCmd.length;
  return '<nav class="side" aria-label="Menu principal">' +
    '<div class="side-brand"><img src="icons/toit-blanc.png" alt=""><div><b>' + esc((M.reg.entreprise || 'Da Costa').replace(/^EURL\s+/i, '').toUpperCase()) + '</b><span>Stock atelier</span></div></div>' +
    '<div class="side-quick"><button class="sq out" data-a="startMv" data-m="S" title="Sortie">' + ic('minus') + '<span>SORTIE</span></button>' +
    '<button class="sq mic" data-a="vxOpen" aria-label="Parler à l\'appli" title="Parler à l\'appli">' + ic('mic') + '</button>' +
    '<button class="sq in" data-a="startMv" data-m="E" title="Entrée">' + ic('plus') + '<span>ENTRÉE</span></button></div>' +
    '<div class="side-links">' + items.map(function (it) {
      return '<button class="side-link ' + (cur === it[0] ? 'on' : '') + '" data-a="sideGo" data-r="' + it[0] + '" title="' + esc(it[2]) + '">' + ic(it[1]) + '<span>' + esc(it[2]) + '</span>' +
        (it[0] === 'commandes' && n ? '<i class="side-dot">' + n + '</i>' : '') + '</button>';
    }).join('') + '</div>' +
    '<button class="side-me" data-a="logout2" title="Changer d\'utilisateur"><span class="who-av">' + initial(u.nom) + '</span><span class="side-me-t"><b>' + esc(u.nom) + '</b><span>' + (patron ? 'Patron' : 'Salarié') + ' · changer</span></span></button>' +
    '</nav>';
}
A.sideGo = function (d) { if (VIEW.r === d.r) { window.scrollTo(0, 0); return; } go(d.r, {}, { replace: true }); };
window.deskShell = function (html) { return '<div class="desk-shell">' + sideNav() + '<div class="desk-main">' + html + '</div></div>'; };

/* ---------------- Bureau (accueil) ---------------- */
var _homePhone = SCREENS.home;
SCREENS.home = function (p) {
  if (!wide()) return _homePhone(p);
  var M = D(), u = me(), patron = isPatron(), d = new Date();
  var recent = M.moves.filter(function (m) { return m.type !== 'depart' || m.qui; }).slice(0, 7);
  var html = '<div class="screen desk-home"><div class="scroll">' +
    '<div class="dh-top"><div class="grow"><h1>' + (patron ? 'Bonjour ' : 'Salut ') + esc(u.nom) + '</h1><p>' + JOURS[d.getDay()] + ' ' + d.getDate() + ' ' + MOIS_LONG[d.getMonth()] + ' · tout est synchronisé avec les téléphones</p></div>' +
    '<div class="dh-search">' + searchBox('dq', 'Chercher un produit, une réf., un fournisseur…', '') + '</div></div>' + syncBar();
  html += '<div class="kpis">';
  if (patron) { var V = valeurStock(); html += '<button class="kpi navy" data-a="sideGo" data-r="inventaire"><span>Valeur du stock (HT)</span><b>' + fe(V.val) + '</b><small>' + (V.sansPrix ? V.sansPrix + ' produit' + (V.sansPrix > 1 ? 's' : '') + ' en stock sans prix' : 'tous les produits en stock ont un prix') + '</small></button>'; }
  html += '<button class="kpi" data-a="sideGo" data-r="stock"><span>Produits suivis</span><b>' + M.prods.length + '</b><small>' + M.fams.length + ' familles · ' + M.foursActifs.length + ' fournisseurs</small></button>' +
    '<button class="kpi warn" data-a="sideGo" data-r="commandes"><span>À commander</span><b>' + M.aCmd.length + '</b><small>sous leur seuil ou ajoutés</small></button>' +
    '<button class="kpi bad" data-a="stockFilter" data-f="zero"><span>À zéro</span><b>' + M.zeros.length + '</b><small>plus rien en stock</small></button></div>';
  if (patron && M.nbSeuils === 0) html += '<div class="hint"><b>Astuce :</b> règle le seuil d\'alerte des produits que tu rachètes souvent : l\'appli te prévient quand en recommander.</div>';
  html += '<div class="dh-cols">';
  html += '<section class="card"><div class="card-title"><h2>À commander bientôt</h2><button class="link" data-a="sideGo" data-r="commandes">Préparer la commande</button></div>' +
    (M.alertes.length ? M.alertes.slice(0, 7).map(function (x) {
      return '<button class="line" data-a="openProd" data-id="' + x.id + '"><div class="grow"><span class="t ell">' + esc(x.nom) + '</span></div><span class="badge ' + M.etat[x.id] + '">' + fq(M.stock[x.id] || 0) + ' / ' + fq(x.seuil) + '</span></button>';
    }).join('') : '<div class="empty">Rien à commander pour l\'instant.</div>') + '</section>';
  html += '<section class="card"><div class="card-title"><h2>Derniers mouvements</h2><button class="link" data-a="go" data-r="histo">Historique</button></div>' +
    (recent.length ? recent.map(mvRow).join('') : '<div class="empty">Aucune entrée ni sortie pour l\'instant.</div>') + '</section>';
  var mois = todayIsoDate().slice(0, 7), fm = patron ? M.factures.filter(function (f) { return String(f.date || f.rangee || '').slice(0, 7) === mois; }) : [];
  html += '<section class="card"><div class="card-title"><h2>' + (patron ? 'Factures du mois' : 'Ranger une facture') + '</h2>' + (patron ? '<button class="link" data-a="sideGo" data-r="factures">Toutes</button>' : '') + '</div>' + dropZone() +
    (patron ? (fm.length ? fm.slice(0, 5).map(factRow).join('') : '<div class="empty" style="padding:12px">Aucune facture rangée ce mois-ci.</div>') : '') + '</section>';
  html += '</div></div></div>';
  return html;
};
I.dq = function (v) { if (!v) return; go('stock', { q: v }); setTimeout(function () { var i = document.querySelector('input[data-i="q"]'); if (i) { i.focus(); i.setSelectionRange(v.length, v.length); } }, 30); };
function dropZone() {
  return '<label class="dropzone" for="dzFile">' + ic('download') + '<b>Glisse tes factures PDF ici</b><span>depuis Gmail ou un dossier · plusieurs d\'un coup · ou clique pour choisir</span></label>' +
    '<input type="file" id="dzFile" accept="image/*,application/pdf" multiple data-files class="hidden">';
}

/* ---------------- Stock en tableau + fiche ---------------- */
var _stockPhone = SCREENS.stock;
SCREENS.stock = function (p) {
  if (!wide()) return _stockPhone(p);
  var M = D(), list = sortProds(filterProds(p.q, p.f), p.sort), patron = isPatron();
  var extra = [['alert', 'À commander'], ['zero', 'À zéro']];
  if (patron) extra.push(['noprice', 'Sans prix']);
  if (!p.sel || !M.prod[p.sel]) p.sel = list.length ? list[0].id : '';
  var html = '<div class="screen desk-stock"><div class="scroll">' +
    '<div class="ds-top"><h1>Stock</h1><span class="sub" id="pcount">' + list.length + ' produit' + (list.length > 1 ? 's' : '') + '</span><span class="grow"></span>' +
    '<div class="ds-search">' + searchBox('q', 'Chercher : coude, Ø100, volige, CMO…', p.q) + '</div>' +
    '<button class="btn light ds-btn" data-a="stockCsv">' + ic('download') + 'Exporter (Excel)</button>' +
    (patron ? '<button class="btn ds-btn" data-a="newProd">' + ic('plus') + 'Nouveau produit</button>' : '') + '</div>' +
    famChips(p.f, 'filt', extra) + syncBar() +
    '<div class="ds-split"><div class="ds-table"><table><thead><tr>' + thSort('nom', 'Produit', p.sort) + '<th>Famille</th><th>Fournisseur</th>' + thSort('stock', 'Stock', p.sort, 'num') + '<th class="num">Seuil</th>' +
    (patron ? '<th class="num">Prix HT</th>' + thSort('valeur', 'Valeur', p.sort, 'num') : '') + '</tr></thead><tbody id="plist">' + prodTable(list, p.sel) + '</tbody></table></div>' +
    '<aside class="ds-panel" aria-label="Fiche du produit">' + prodPanel(p.sel) + '</aside></div></div></div>';
  return html;
};
function thSort(k, label, cur, cls) {
  var on = (cur || 'nom') === k;
  return '<th class="' + (cls || '') + '"><button class="th-sort ' + (on ? 'on' : '') + '" data-a="stockSort" data-k="' + k + '">' + label + (on ? ' ▲' : '') + '</button></th>';
}
function sortProds(list, k) {
  var M = D();
  if (k === 'stock') return list.slice().sort(function (a, b) { return (M.stock[a.id] || 0) - (M.stock[b.id] || 0); });
  if (k === 'valeur') return list.slice().sort(function (a, b) { return valeurDe(b) - valeurDe(a); });
  return list;
}
function valeurDe(p) { var pr = prixRef(p.id), q = D().stock[p.id] || 0; return pr && q > 0 ? pr.prix * q : 0; }
function prodTable(list, sel) {
  var M = D(), patron = isPatron();
  if (!list.length) return '<tr><td colspan="7" class="empty">Aucun produit trouvé</td></tr>';
  return list.slice(0, 400).map(function (p) {
    var q = M.stock[p.id] || 0, e = M.etat[p.id], pr = patron ? prixRef(p.id) : null, s = num(p.seuil);
    return '<tr class="' + (p.id === sel ? 'on' : '') + '" data-a="selProd" data-id="' + p.id + '"><td class="pn">' + esc(p.nom) + '</td><td class="mut">' + esc(famName(p.famille)) + '</td><td class="mut">' + esc(fourName(p.four)) + '</td>' +
      '<td class="num"><span class="qv ' + (e === 'ok' ? '' : e) + '">' + fq(q) + '</span></td><td class="num mut">' + (s > 0 ? fq(s) : '—') + '</td>' +
      (patron ? '<td class="num">' + (pr ? fe(pr.prix) : '<span class="mut">—</span>') + '</td><td class="num">' + (pr && q > 0 ? fe(pr.prix * q) : '<span class="mut">—</span>') + '</td>' : '') + '</tr>';
  }).join('') + (list.length > 400 ? '<tr><td colspan="7" class="empty">… affine ta recherche pour voir les autres</td></tr>' : '');
}
function prodPanel(id) {
  var M = D(), p = M.prod[id], patron = isPatron();
  if (!p) return '<div class="empty">Choisis un produit dans la liste.</div>';
  var q = M.stock[p.id] || 0, e = M.etat[p.id], s = num(p.seuil), prix = M.prix[p.id] || [];
  var h = '<div class="dp-k">' + esc([famName(p.famille), fourName(p.four)].filter(Boolean).join(' · ').toUpperCase()) + '</div><h2>' + esc(p.nom) + '</h2>' +
    '<div class="dp-boxes"><div class="dp-box ' + (e === 'ok' ? '' : e) + '"><span>En stock' + (p.unite ? ' (' + esc(p.unite) + ')' : '') + '</span><b>' + fq(q) + '</b></div><div class="dp-box"><span>Seuil d\'alerte</span><b>' + (s > 0 ? fq(s) : '—') + '</b></div></div>' +
    '<div class="dp-act"><button class="out" data-a="panelMv" data-m="S" data-id="' + p.id + '">− Sortie</button><button class="in" data-a="panelMv" data-m="E" data-id="' + p.id + '">+ Entrée</button></div>';
  h += '<div class="dp-sec">Fournisseurs' + (patron ? ' et prix' : '') + '</div>' + (prix.length ? prix.map(function (x) {
    var pp = numOrNull(x.prix);
    return '<div class="dp-row"><span>' + esc(fourName(x.fournisseur) || '?') + (x.fournisseur === p.four ? ' <small class="ok">· habituel</small>' : '') + (x.ref ? ' <small>réf. ' + esc(x.ref) + '</small>' : '') + '</span>' + (patron ? '<b>' + (pp === null ? '—' : fe(pp)) + '</b>' : '') + '</div>';
  }).join('') : '<div class="dp-row mut">Aucun fournisseur renseigné</div>');
  var mv = (M.movesBy[p.id] || []).slice(0, 6);
  h += '<div class="dp-sec">Derniers mouvements</div>' + (mv.length ? mv.map(function (m) {
    return '<div class="dp-row"><span>' + esc([fday(m.date), userName(m.qui), m.lieu || (m.type === 'depart' ? 'stock de départ' : '')].filter(Boolean).join(' · ')) + '</span>' + mvBadge(m) + '</div>';
  }).join('') : '<div class="dp-row mut">Aucun mouvement</div>');
  var ic0 = M.cmd[p.id];
  h += '<button class="cmd-add ' + (ic0 ? 'on' : '') + '" style="margin-top:12px" data-a="panelCmd" data-id="' + p.id + '">' + ic('bell') + '<span class="grow">' + (ic0 ? 'Dans la commande : <b>' + fq(num(ic0.qte)) + '</b> · +1' : 'Ajouter à la commande') + '</span><b>+1</b></button>';
  h += '<button class="btn light" style="margin-top:14px" data-a="openProd" data-id="' + p.id + '">Ouvrir la fiche complète' + (patron ? ' (modifier, prix, seuil)' : '') + '</button>';
  return h;
}
A.panelCmd = function (d) { commit(cmdAdd(d.id, 1)); toast('Ajouté à la commande', D().prod[d.id].nom); render(false); };
A.selProd = function (d) { VIEW.p.sel = d.id; saveView(); render(false); };
A.stockSort = function (d) { VIEW.p.sort = d.k === 'nom' ? '' : d.k; saveView(); render(false); };
A.panelMv = function (d) { go('mvt', { mode: d.m, pid: d.id, n: 1, lieu: '', from: 'prod' }); };
A.stockCsv = function () {
  var M = D(), patron = isPatron(), list = sortProds(filterProds(VIEW.p.q, VIEW.p.f), VIEW.p.sort);
  var cell = function (v) { v = String(v == null ? '' : v); return /[;"\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; };
  var nb = function (n) { return String(Math.round(n * 1000) / 1000).replace('.', ','); };
  var rows = [['Produit', 'Famille', 'Fournisseur', 'Stock', 'Unité', 'Seuil'].concat(patron ? ['Prix HT', 'Valeur HT'] : [])];
  list.forEach(function (p) {
    var q = M.stock[p.id] || 0, pr = patron ? prixRef(p.id) : null;
    rows.push([p.nom, famName(p.famille), fourName(p.four), nb(q), p.unite || '', num(p.seuil) > 0 ? nb(num(p.seuil)) : ''].concat(patron ? [pr ? nb(pr.prix) : '', pr && q > 0 ? nb(pr.prix * q) : ''] : []));
  });
  var csv = '﻿' + rows.map(function (r) { return r.map(cell).join(';'); }).join('\r\n');
  downloadBlob(new Blob([csv], { type: 'text/csv;charset=utf-8' }), 'Stock_' + todayIsoDate() + '.csv');
  toast('Fichier Excel enregistré', list.length + ' produits · dans tes téléchargements');
};

/* ---------------- Factures : vérification côte à côte (original à gauche) ---------------- */
var ORIG = {}, ORIG_NODE = {};       // pages en mémoire par vérification (jamais dans le téléphone)
var _verif = SCREENS.verif;
SCREENS.verif = function (p) {
  var h = _verif(p);
  if (!wide() || !VERIF) return h;
  var open = '<div class="scroll nonav" style="padding-bottom:170px">';
  if (h.indexOf(open) < 0 || h.indexOf('<div class="bottom-bar">') < 0) return h;
  AFTER.push(mountOrig);
  return h.replace(open, '<div class="scroll nonav vsplit" style="padding-bottom:170px"><div class="vorig" id="vorig"></div><div class="vright">').replace('<div class="bottom-bar">', '</div><div class="bottom-bar">');
};
function verifKey(V) { return V.vid || (V.fichiers || []).join(' ') || ''; }
function mountOrig() {
  var box = document.getElementById('vorig'), V = VERIF; if (!box || !V) return;
  var k = verifKey(V), node = ORIG_NODE[k];
  if (node) { box.appendChild(node); return; }
  node = document.createElement('div'); node.className = 'vorig-in';
  node.innerHTML = '<div class="v-load"><i class="spin"></i>J\'affiche l\'original…</div>';
  ORIG_NODE[k] = node; box.appendChild(node);
  var src = ORIG[V.vid] ? Promise.resolve(ORIG[V.vid].map(function (pg) { return { mime: pg.mime, data: pg.data, nom: pg.name }; })) :
    (V.fichiers || []).length ? Promise.all(V.fichiers.map(getOriginal)) : Promise.reject(new Error('Original non disponible.'));
  src.then(function (rs) {
    node.innerHTML = '';
    var chain = Promise.resolve();
    rs.forEach(function (r) {
      chain = chain.then(function () {
        if (/pdf/i.test(r.mime)) return renderPdfInto(node, r);
        var img = document.createElement('img'); img.className = 'vpage'; img.alt = 'Page de la facture'; img.src = 'data:' + r.mime + ';base64,' + r.data; node.appendChild(img);
      });
    });
    return chain;
  }).catch(function (e) { node.innerHTML = '<div class="v-load err">Original non affiché.<br><span>' + esc(e.message || String(e)) + '</span></div>'; });
}

/* ---------------- Inventaire : aperçu du PDF comptable en grand ---------------- */
var _invPhone = SCREENS.inventaire, PDF_URL = '';
SCREENS.inventaire = function (p) {
  var h = _invPhone(p);
  if (!wide() || !isPatron()) return h;
  var mk = '<div class="scroll">', i = h.indexOf(mk), j = h.lastIndexOf('</div><nav class="nav">');
  if (i < 0 || j < 0) return h;
  AFTER.push(refreshPdfPreview);
  return h.slice(0, i) + '<div class="scroll inv-wide"><div class="inv-grid"><div class="inv-left">' + h.slice(i + mk.length, j) + '</div>' +
    '<div class="inv-right"><div class="card pdf-card"><div class="card-title"><h2>Aperçu du PDF pour le comptable</h2></div>' +
    '<iframe id="pdfprev" class="pdf-frame" title="Aperçu du PDF"></iframe>' +
    '<div class="btn-row" style="margin-top:12px"><button class="btn" data-a="pdf" data-how="dl">' + ic('download') + 'Enregistrer sur l\'ordinateur</button><button class="btn light" data-a="pdfMail">' + ic('mail') + 'Envoyer au comptable</button><button class="btn light" data-a="pdfPrint">Imprimer</button></div>' +
    '</div></div></div>' + h.slice(j);
};
function refreshPdfPreview() {
  var f = document.getElementById('pdfprev'); if (!f || !window.buildPdf) return;
  var p = VIEW.p;
  try {
    var blob = buildPdf({ date: p.date || todayIsoDate(), prix: !!p.prix, zeros: !!p.zeros }).output('blob');
    if (PDF_URL) URL.revokeObjectURL(PDF_URL);
    PDF_URL = URL.createObjectURL(blob);
    f.src = PDF_URL + '#view=FitH';
  } catch (e) { f.outerHTML = '<div class="empty">Aperçu impossible : ' + esc(e.message) + '</div>'; }
}
A.pdfPrint = function () { var f = document.getElementById('pdfprev'); try { f.contentWindow.focus(); f.contentWindow.print(); } catch (e) { A.pdf({ how: 'dl' }); } };
A.pdfMail = function () {
  var p = VIEW.p, M = D();
  A.pdf({ how: 'share' });
  var mail = M.reg.emailComptable || '';
  setTimeout(function () {
    location.href = 'mailto:' + encodeURIComponent(mail) + '?subject=' + encodeURIComponent('État du stock au ' + fday(p.date || todayIsoDate())) +
      '&body=' + encodeURIComponent('Bonjour,\n\nVoici l\'état du stock au ' + fday(p.date || todayIsoDate()) + ' (fichier PDF joint).\n\nCordialement,\n' + (M.reg.entreprise || ''));
  }, 600);
};

/* ---------------- factures glissées dans la fenêtre / « Ouvrir avec › Stock » ---------------- */
function prendreFichiers(files) {
  files = Array.prototype.filter.call(files || [], function (f) { return /pdf|^image\//i.test(f.type) || /\.(pdf|jpe?g|png)$/i.test(f.name || ''); });
  if (!files.length) return;
  if (me()) addFiles(files); else window.PENDING_SHARE = files;
}
document.addEventListener('dragover', function (e) {
  if (!e.dataTransfer || Array.prototype.indexOf.call(e.dataTransfer.types || [], 'Files') < 0) return;
  e.preventDefault(); document.body.classList.add('dragging');
});
document.addEventListener('dragleave', function (e) { if (!e.relatedTarget) document.body.classList.remove('dragging'); });
document.addEventListener('drop', function (e) {
  document.body.classList.remove('dragging');
  if (!e.dataTransfer || !e.dataTransfer.files || !e.dataTransfer.files.length) return;
  e.preventDefault(); prendreFichiers(e.dataTransfer.files);
});
if ('launchQueue' in window && window.launchQueue) {
  window.launchQueue.setConsumer(function (lp) {
    if (!lp || !lp.files || !lp.files.length) return;
    Promise.all(lp.files.map(function (h) { return h.getFile(); })).then(prendreFichiers).catch(function () {});
  });
}

/* ---------------- Réglages : l'appli sur l'ordinateur ---------------- */
var INSTALL_EVT = null;
window.addEventListener('beforeinstallprompt', function (e) { e.preventDefault(); INSTALL_EVT = e; if (VIEW.r === 'reglages') render(false); });
window.addEventListener('appinstalled', function () { INSTALL_EVT = null; toast('Appli installée', 'Elle a son icône sur ce poste'); });
function ordiCard() {
  if (!isPatron()) return '';
  var h = '<div class="card"><div class="card-title"><h2>L\'appli sur l\'ordinateur</h2></div>' +
    '<p style="font-size:14px;color:var(--muted);margin:0 0 10px">La même appli, avec un grand écran : stock en tableau, factures glissées depuis Gmail, PDF comptable en grand. Tout reste synchronisé avec les téléphones.</p>';
  if (INSTALL_EVT) h += '<button class="btn" style="margin-bottom:10px" data-a="installApp">' + ic('install') + 'Installer l\'appli sur cet appareil</button>';
  h += SYNC.admin ? '<button class="btn light" data-a="copyAppLink">' + ic('copy') + 'Copier l\'adresse de l\'appli</button><p style="font-size:13px;color:var(--muted);margin:8px 0 0">Tu es connecté en administrateur : sur l\'ordinateur, ouvre cette adresse et tape ton code.</p>'
    : '<button class="btn light" data-a="ordiLink">' + ic('share') + 'M\'envoyer mon lien pour l\'ordinateur</button>';
  return h + '</div>';
}
A.installApp = function () { if (!INSTALL_EVT) return; INSTALL_EVT.prompt(); INSTALL_EVT.userChoice.then(function () { INSTALL_EVT = null; render(false); }).catch(function () {}); };
A.copyAppLink = function () { copyText(appLink()); };
A.ordiLink = function () {
  var cle = LS.get('cle', '') || '';
  if (!/^[0-9a-f]{40,}$/i.test(cle)) { toast('Lien indisponible', 'Ouvre d\'abord ton lien personnel sur ce téléphone'); return; }
  openMsg({ title: 'Ton lien pour l\'ordinateur', sub: 'Envoie-le-toi (par mail, c\'est le plus simple), puis ouvre-le sur l\'ordinateur.',
    subject: 'Appli Stock sur l\'ordinateur',
    text: 'Mon appli du stock sur l\'ordinateur (lien personnel, à ne transférer à personne) :\n' + appLink() + '#cle=' + cle +
      '\n\nSur l\'ordinateur : ouvre ce lien dans Edge ou Chrome, choisis ton nom et ton code à 4 chiffres.\nPour l\'avoir comme un logiciel : menu ⋯ › Applications › Installer.',
    hint: 'Ce lien donne accès à ton stock : garde-le pour toi.' });
};
var _reglages = SCREENS.reglages;
SCREENS.reglages = function (p) {
  var h = _reglages(p), mk = '<div class="card"><div class="card-title"><h2>Synchronisation</h2>';
  return h.indexOf(mk) >= 0 ? h.replace(mk, ordiCard() + mk) : h;
};
