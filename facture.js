/* Stock Da Costa — factures : photo / PDF → lecture par Gemini → vérification → entrée en stock */
'use strict';

var FACT = { pages: [], busy: false, err: '', step: 0, timer: null };   // fichiers en mémoire (pas dans l'historique)
var VERIF = LS.get('verif', null);                                      // vérification en cours (survit à une fermeture)
function saveVerif() { if (VERIF) LS.set('verif', VERIF); else LS.del('verif'); }

/* ---------------- fichiers : photo ou PDF ---------------- */

function readAsDataURL(blob) {
  return new Promise(function (res, rej) { var r = new FileReader(); r.onload = function () { res(r.result); }; r.onerror = rej; r.readAsDataURL(blob); });
}
/** Photo réduite à 2000 px et JPEG 85 % : lisible par Gemini, légère à envoyer. */
function compressImage(file) {
  return readAsDataURL(file).then(function (url) {
    return new Promise(function (res) {
      var img = new Image();
      img.onload = function () {
        var max = 2000, w = img.naturalWidth, h = img.naturalHeight, k = Math.min(1, max / Math.max(w, h));
        var c = document.createElement('canvas'); c.width = Math.round(w * k); c.height = Math.round(h * k);
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
        var out = c.toDataURL('image/jpeg', 0.85);
        res({ mime: 'image/jpeg', data: out.split(',')[1], thumb: out });
      };
      img.onerror = function () { res(null); };
      img.src = url;
    });
  });
}
function addFiles(list) {
  var files = Array.prototype.slice.call(list || []);
  if (!files.length) return;
  Promise.all(files.map(function (f) {
    if (/pdf/i.test(f.type) || /\.pdf$/i.test(f.name || '')) {
      if (f.size > 15e6) { toast('PDF trop lourd', 'Maximum 15 Mo'); return null; }
      return readAsDataURL(f).then(function (u) { return { mime: 'application/pdf', data: u.split(',')[1], thumb: null, name: f.name || 'Facture.pdf' }; });
    }
    if (/^image\//.test(f.type)) return compressImage(f).then(function (p) { if (p) p.name = f.name || 'Photo'; return p; });
    toast('Fichier non pris en charge', 'Photo ou PDF seulement'); return null;
  })).then(function (pages) {
    pages.filter(Boolean).forEach(function (p) { if (FACT.pages.length < 6) FACT.pages.push(p); });
    FACT.err = '';
    if (VIEW.r !== 'facture') go('facture', {}); else render(false);
  });
}
document.addEventListener('change', function (e) {
  var el = e.target;
  if (el && el.dataset && el.dataset.files !== undefined) { addFiles(el.files); el.value = ''; }
});

/* ---------------- écran Facture ---------------- */

SCREENS.facture = function () {
  if (!isPatron()) return SCREENS.home();
  var M = D(), html = '<div class="screen">' + head({ cls: 'green', title: 'Entrée par facture', sub: 'L\'appli lit la facture, tu vérifies, c\'est rangé.' }) + '<div class="scroll nonav">';
  var inputs = '<input type="file" accept="image/*" capture="environment" data-files id="inPhoto" class="hidden">' +
    '<input type="file" accept="image/*,application/pdf" multiple data-files id="inFile" class="hidden">';
  if (FACT.busy) {
    var steps = ['J\'envoie la facture…', 'Je lis les lignes…', 'Je cherche dans ton stock…', 'Encore un instant…'];
    html += '<div class="scan-wrap"><div class="scan-doc">' + (FACT.pages[0] && FACT.pages[0].thumb ? '<img src="' + FACT.pages[0].thumb + '" alt="">' : ic('file')) + '<i class="scan-bar"></i></div>' +
      '<div class="scan-title">Je lis la facture…</div><div class="scan-step">' + steps[Math.min(FACT.step, steps.length - 1)] + '</div>' +
      '<p style="color:var(--muted);font-size:14px;text-align:center;margin:0">Ça prend en général 10 à 30 secondes.</p></div>';
    return html + '</div></div>';
  }
  if (VERIF && !FACT.pages.length) {
    html += '<button class="row" style="border:2px solid #F6B969;margin-bottom:14px" data-a="go" data-r="verif">' + ic('file') +
      '<div class="grow"><span class="t">Vérification en cours</span><span class="s">' + esc((VERIF.fourNom || 'Facture') + (VERIF.numero ? ' · n° ' + VERIF.numero : '')) + ' · à terminer</span></div>' + ic('chev') + '</button>';
  }
  if (FACT.err) html += '<div class="hint" style="background:var(--red-bg);color:var(--red-ink)"><b>Lecture impossible.</b> ' + esc(FACT.err) + '</div>';
  if (!FACT.pages.length) {
    html += '<label for="inPhoto" class="big-pick main">' + '<span class="ico">' + ic('camera') + '</span><span><b>Photographier la facture</b><span>Une ou plusieurs photos si elle est longue</span></span></label>' +
      '<label for="inFile" class="big-pick">' + '<span class="ico soft">' + ic('file') + '</span><span><b>Choisir un PDF ou une image</b><span>Une facture déjà sur le téléphone</span></span></label>' +
      '<div class="hint" style="display:flex;gap:10px">' + ic('mail') + '<span><b>Facture reçue par mail ?</b> Dans Gmail, ouvre le PDF, appuie sur « Partager » et choisis l\'appli <b>Stock</b>' + (IS_TEST ? ' <b>TEST</b>' : '') + '.</span></div>';
  } else {
    html += '<div class="sec-title" style="margin-top:0"><span>' + FACT.pages.length + ' page' + (FACT.pages.length > 1 ? 's' : '') + '</span></div><div class="pages">' +
      FACT.pages.map(function (p, i) {
        return '<div class="page-th">' + (p.thumb ? '<img src="' + p.thumb + '" alt="Page ' + (i + 1) + '">' : '<span class="pdf">' + ic('file') + '<b>PDF</b></span>') +
          '<button class="page-x" data-a="fDel" data-i="' + i + '" aria-label="Retirer">' + ic('x') + '</button></div>';
      }).join('') +
      (FACT.pages.length < 6 ? '<label for="inPhoto" class="page-th add">' + ic('plus') + '<span>Page</span></label>' : '') + '</div>' +
      '<button class="btn green" style="margin-top:16px;height:62px;font-size:22px" data-a="fRead">Lire la facture</button>' +
      '<button class="btn light" style="margin-top:10px" data-a="fClear">Recommencer</button>';
  }
  var recent = M.factures.slice(0, 5);
  if (recent.length) {
    html += '<div class="sec-title"><span>Dernières factures</span></div><div class="card" style="padding-top:4px;padding-bottom:4px">' + recent.map(function (f) {
      var first = (f.fichiers || '').split(' ')[0];
      return '<a class="line" style="text-decoration:none;color:inherit" ' + (first ? 'href="' + esc(first) + '" target="_blank" rel="noopener"' : '') + '><div class="grow"><span class="t">' + esc((fourName(f.fournisseur) || '?') + (f.numero ? ' · n° ' + f.numero : '')) +
        '</span><span class="s">' + esc([fday(f.date), f.lignes + ' ligne' + (num(f.lignes) > 1 ? 's' : ''), f.total ? fe(num(f.total)) + ' HT' : ''].filter(Boolean).join(' · ')) + '</span></div>' +
        (first ? '<span class="badge navy">voir</span>' : '<span class="badge ok">rangée</span>') + '</a>';
    }).join('') + '</div>';
  }
  return html + inputs + '</div></div>';
};
A.fDel = function (d) { FACT.pages.splice(+d.i, 1); render(false); };
A.fClear = function () { FACT.pages = []; FACT.err = ''; render(false); };
A.fRead = function () {
  if (!FACT.pages.length || FACT.busy) return;
  FACT.busy = true; FACT.err = ''; FACT.step = 0; render(true);
  clearInterval(FACT.timer);
  FACT.timer = setInterval(function () { FACT.step++; if (VIEW.r === 'facture') render(false); }, 5000);
  call('facture', [CFG.code, { files: FACT.pages.map(function (p) { return { mime: p.mime, data: p.data }; }) }], 150000)
    .then(function (doc) {
      clearInterval(FACT.timer); FACT.busy = false;
      if (!doc.est_document_achat && !(doc.lignes || []).length) { FACT.err = 'Ce document ne ressemble pas à une facture de matériel.'; render(false); return; }
      VERIF = buildVerif(doc); saveVerif();
      FACT.pages = [];
      go('verif', {}, { replace: true });
    })
    .catch(function (e) {
      clearInterval(FACT.timer); FACT.busy = false;
      FACT.err = e.code === 'NOKEY' ? 'La clé Gemini n\'est pas encore installée dans le script (voir le guide).' : e.message;
      render(false);
    });
};

/* ---------------- préparation de la vérification ---------------- */

function lineKey(four, libelle) { return four + '|' + norm(libelle).replace(/\s+/g, ' ').trim(); }
function matchFour(doc) {
  var M = D();
  if (doc.fournisseur_id && M.four[doc.fournisseur_id] && M.four[doc.fournisseur_id].actif !== '0') return doc.fournisseur_id;
  var n = norm(doc.fournisseur).replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
  if (!n) return '';
  var hit = M.foursActifs.filter(function (f) {
    var fn = norm(f.nom).replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
    return fn && (fn === n || n.indexOf(fn) === 0 || fn.indexOf(n) === 0 || n.split(' ')[0] === fn.split(' ')[0] && fn.split(' ')[0].length > 3);
  })[0];
  return hit ? hit.id : '';
}
function buildVerif(doc) {
  var M = D(), four = matchFour(doc);
  var ok = function (id) { return id && M.prod[id] && M.prod[id].actif !== '0' ? id : ''; };
  var lignes = (doc.lignes || []).map(function (l, i) {
    var qte = num(l.quantite) || 1, prix = numOrNull(l.prix_unitaire_ht);
    if (prix === null && numOrNull(l.montant_ht) !== null) prix = round3(num(l.montant_ht) / qte);
    var L = { k: 'l' + i, libelle: String(l.libelle || '').trim(), ref: String(l.reference || '').trim(), qte: qte, unite: String(l.unite || '').trim(),
      prix: prix, facteur: num(l.conditionnement) > 0 ? num(l.conditionnement) : 1, pid: '', cands: [], statut: 'new',
      nom: upName(l.nom_propose || l.libelle), famille: M.fam[l.famille_proposee] ? l.famille_proposee : (M.fams[0] ? M.fams[0].id : ''), source: '' };
    var al = four && M.alias[lineKey(four, L.libelle)];
    var byRef = four && L.ref ? Object.keys(M.prix).filter(function (pid) { return ok(pid) && M.prix[pid].some(function (x) { return x.fournisseur === four && x.ref && norm(x.ref) === norm(L.ref); }); })[0] : '';
    var pid = ok(l.produit_id), others = (l.autres_ids || []).map(ok).filter(Boolean);
    if (al && ok(al.produit)) { L.pid = al.produit; L.facteur = num(al.facteur) || 1; L.statut = 'ok'; L.source = 'appris'; }
    else if (byRef) { L.pid = byRef; L.statut = 'ok'; L.source = 'réf.'; }
    else if (pid && num(l.confiance) >= 0.8) { L.pid = pid; L.statut = 'ok'; }
    else if (pid) { L.statut = 'check'; L.cands = [pid].concat(others.filter(function (x) { return x !== pid; })).slice(0, 3); }
    else { L.statut = 'new'; L.cands = others.slice(0, 2); }
    return L;
  });
  return { source: 'facture', four: four, fourNom: upName(doc.fournisseur || ''), fourChoix: four ? 'ok' : '', numero: String(doc.numero || '').trim(),
    date: /^\d{4}-\d\d-\d\d$/.test(doc.date || '') ? doc.date : todayIsoDate(), total: numOrNull(doc.total_ht), type: doc.type_document || 'facture',
    fichiers: doc.fichiers || [], lignes: lignes, modele: doc.modele || '' };
}

/* ---------------- écran de vérification ---------------- */

function vLine(k) { return VERIF.lignes.filter(function (l) { return l.k === k; })[0]; }
function vPending() { return VERIF.lignes.filter(function (l) { return l.statut === 'check' || l.statut === 'new'; }).length + (VERIF.four ? 0 : 1); }
SCREENS.verif = function () {
  if (!VERIF || !isPatron()) { return SCREENS.facture(); }
  var M = D(), V = VERIF;
  var nOk = V.lignes.filter(function (l) { return l.statut === 'ok' || l.statut === 'create'; }).length;
  var nCheck = V.lignes.filter(function (l) { return l.statut === 'check'; }).length, nNew = V.lignes.filter(function (l) { return l.statut === 'new'; }).length;
  var dup = V.four && V.numero && M.factures.filter(function (f) { return f.fournisseur === V.four && norm(f.numero) === norm(V.numero); })[0];
  var html = '<div class="screen">' + head({ cls: 'green', title: 'Vérifier la facture', backAct: 'vBack',
    sub: esc([V.four ? fourName(V.four) : V.fourNom, V.numero ? 'n° ' + V.numero : '', fday(V.date), V.total !== null ? fe(V.total) + ' HT' : ''].filter(Boolean).join(' · ')),
    extra: '<div class="vchips"><span class="vc ok">' + nOk + ' reconnue' + (nOk > 1 ? 's' : '') + '</span>' + (nCheck ? '<span class="vc check">' + nCheck + ' à vérifier</span>' : '') + (nNew ? '<span class="vc new">' + nNew + ' nouveau' + (nNew > 1 ? 'x' : '') + '</span>' : '') + '</div>' }) +
    '<div class="scroll nonav" style="padding-bottom:170px">';
  if (dup) html += '<div class="hint" style="background:var(--orange-bg);color:#7A3D00"><b>Déjà rangée ?</b> Une facture ' + esc(fourName(V.four)) + ' n° ' + esc(V.numero) + ' a été rangée le ' + fday(dup.rangee) + '. Vérifie avant de valider pour ne pas compter deux fois.</div>';
  if (!V.four) {
    html += '<div class="vcard check"><div class="vhead"><span class="dot check"></span><span>Fournisseur lu : <b>' + esc(V.fourNom || '?') + '</b></span></div>' +
      '<span class="vq check">Il n\'est pas dans ta liste de fournisseurs.</span>' +
      '<div class="btn-row"><button class="btn" style="font-size:16px;height:48px;font-family:Barlow;font-weight:700" data-a="vFourNew">Ajouter</button><button class="btn light" style="height:48px" data-a="vFourPick">Choisir</button></div></div>';
  }
  var order = { check: 0, new: 1, create: 2, ok: 3, skip: 4 };
  V.lignes.slice().sort(function (a, b) { return order[a.statut] - order[b.statut]; }).forEach(function (l) {
    var src = '<span class="vsrc">Sur la facture : <b>' + esc(l.libelle) + '</b>' + (l.ref ? ' · réf. ' + esc(l.ref) : '') + ' · ' + fq(l.qte) + (l.unite ? ' ' + esc(l.unite) : '') + (l.prix !== null ? ' × ' + fe(l.prix) : '') + '</span>';
    if (l.statut === 'check') {
      html += '<div class="vcard check"><div class="vhead"><span class="dot check"></span>' + src + '</div><span class="vq check">Je pense que c\'est :</span>' +
        l.cands.map(function (pid, i) { var p = M.prod[pid]; return '<button class="vcand ' + (i === 0 ? 'best' : '') + '" data-a="vPick" data-k="' + l.k + '" data-id="' + pid + '">' + esc(p.nom) + ' <span>· stock ' + fq(M.stock[pid] || 0) + '</span></button>'; }).join('') +
        '<div class="vmini"><button data-a="vOther" data-k="' + l.k + '">Autre produit…</button><button data-a="vToNew" data-k="' + l.k + '">C\'est un nouveau</button><button data-a="vSkip" data-k="' + l.k + '">Ignorer</button></div></div>';
    } else if (l.statut === 'new') {
      html += '<div class="vcard new"><div class="vhead"><span class="dot new"></span>' + src + '</div><span class="vq new">Nouveau produit : je le crée ?</span>' +
        '<button class="vnew" data-a="vName" data-k="' + l.k + '"><b>' + esc(l.nom) + '</b><span>' + esc(famName(l.famille) + ' · ' + (V.four ? fourName(V.four) : V.fourNom) + (l.prix !== null ? ' · ' + fe(l.prix / l.facteur) + ' HT' : '') + ' · + ' + fq(l.qte * l.facteur)) + ' · <u>modifier</u></span></button>' +
        '<div class="btn-row"><button class="btn" style="background:#2F5BD3;font-family:Barlow;font-weight:700;font-size:16px;height:48px" data-a="vCreate" data-k="' + l.k + '">Créer</button><button class="btn light" style="height:48px" data-a="vOther" data-k="' + l.k + '">C\'est un existant</button></div>' +
        (l.cands.length ? '<div class="vmini" style="margin-top:6px">' + l.cands.map(function (pid) { return '<button data-a="vPick" data-k="' + l.k + '" data-id="' + pid + '">' + esc(M.prod[pid].nom) + ' ?</button>'; }).join('') + '</div>' : '') +
        '<div class="vmini"><button data-a="vSkip" data-k="' + l.k + '">Ignorer cette ligne</button></div></div>';
    } else if (l.statut === 'skip') {
      html += '<div class="vcard skip"><span class="vsrc">Ignorée : <b>' + esc(l.libelle) + '</b></span><button class="link" data-a="vUnskip" data-k="' + l.k + '">Reprendre</button></div>';
    } else {
      var p = l.statut === 'create' ? { nom: l.nom } : M.prod[l.pid];
      var q = l.statut === 'create' ? 0 : (M.stock[l.pid] || 0);
      html += '<button class="vcard ok" data-a="vLineMenu" data-k="' + l.k + '"><span class="dot ' + (l.statut === 'create' ? 'new' : 'ok') + '"></span><span class="grow"><span class="t">' + esc(p ? p.nom : '?') +
        (l.statut === 'create' ? ' <span class="badge" style="background:#DCE6FF;color:#1E3A8A">nouveau</span>' : '') + '</span>' +
        '<span class="s">' + (l.source === 'appris' ? 'reconnu (déjà vu) · ' : l.source === 'réf.' ? 'reconnu par la réf. · ' : '') + 'Facture : ' + esc(l.libelle) + (l.facteur !== 1 ? ' · ' + fq(l.qte) + ' × ' + fq(l.facteur) : '') +
        (l.statut === 'create' ? '' : ' · stock ' + fq(q) + ' → ' + fq(q + l.qte * l.facteur)) + '</span></span>' +
        '<span class="vqty"><b>+' + fq(l.qte * l.facteur) + '</b>' + (l.prix !== null ? '<span>' + fe(l.prix / l.facteur) + '</span>' : '') + '</span></button>';
    }
  });
  var left = vPending(), n = V.lignes.filter(function (l) { return l.statut === 'ok' || l.statut === 'create'; }).length;
  html += '<button class="btn light" style="margin-top:12px" data-a="vCancel">' + ic('trash') + 'Abandonner cette facture</button></div>' +
    '<div class="bottom-bar"><div style="text-align:center;font-size:14px;font-weight:600;margin-bottom:8px;color:' + (left ? '#7A3D00' : 'var(--green-ink)') + '">' +
    (left ? 'Encore ' + left + ' point' + (left > 1 ? 's' : '') + ' à regarder' : n + ' entrée' + (n > 1 ? 's' : '') + ', prix mis à jour, facture rangée') + '</div>' +
    '<button class="btn green" style="height:62px;font-size:22px" data-a="vValidate" ' + (left || !n ? 'disabled' : '') + '>Tout valider</button></div></div>';
  return html;
};
function vSet(k, fn) { var l = vLine(k); if (!l) return; fn(l); saveVerif(); render(false); }
A.vBack = function () { go('facture', {}, { replace: true }); };
A.vPick = function (d) { vSet(d.k, function (l) { l.pid = d.id; l.statut = 'ok'; l.source = ''; }); };
A.vSkip = function (d) { vSet(d.k, function (l) { l.prev = l.statut; l.statut = 'skip'; }); };
A.vUnskip = function (d) { vSet(d.k, function (l) { l.statut = l.pid ? 'ok' : (l.prev === 'create' ? 'create' : 'new'); }); };
A.vToNew = function (d) { vSet(d.k, function (l) { l.statut = 'new'; l.pid = ''; }); };
A.vCreate = function (d) { vSet(d.k, function (l) { l.statut = 'create'; l.pid = ''; }); };
A.vOther = function (d) { openPicker('Quel produit ?', vLine(d.k).libelle, function (pid) { vSet(d.k, function (l) { l.pid = pid; l.statut = 'ok'; l.source = ''; }); }); };
A.vName = function (d) {
  var l = vLine(d.k), M = D();
  openSheet('<h3>Nouveau produit</h3><p>Sur la facture : ' + esc(l.libelle) + '</p>' +
    '<div class="field"><label for="vnm">Nom</label><input id="vnm" class="inp" style="text-transform:uppercase" value="' + esc(l.nom) + '"></div>' +
    '<div class="field"><label for="vfm">Famille</label><select id="vfm" class="inp">' + M.fams.map(function (f) { return '<option value="' + f.id + '"' + (f.id === l.famille ? ' selected' : '') + '>' + esc(f.nom) + '</option>'; }).join('') + '</select></div>' +
    '<button class="btn" data-a="vNameOk" data-k="' + l.k + '">OK</button>');
};
A.vNameOk = function (d) {
  var nm = upName(document.getElementById('vnm').value), fm = document.getElementById('vfm').value;
  closeSheet(function () { vSet(d.k, function (l) { if (nm) l.nom = nm; l.famille = fm; }); });
};
A.vLineMenu = function (d) {
  var l = vLine(d.k);
  openSheet('<h3>' + esc(l.statut === 'create' ? l.nom : (D().prod[l.pid] || {}).nom || '') + '</h3><p>Sur la facture : ' + esc(l.libelle) + '</p>' +
    '<button class="menu-item" data-a="vQty" data-k="' + l.k + '">' + ic('edit') + 'Modifier la quantité</button>' +
    '<button class="menu-item" data-a="vChange" data-k="' + l.k + '">' + ic('stock') + 'Ce n\'est pas ce produit</button>' +
    (l.statut === 'create' ? '<button class="menu-item" data-a="vRename" data-k="' + l.k + '">' + ic('tag') + 'Changer le nom ou la famille</button>' : '') +
    '<button class="menu-item" data-a="vSkipSheet" data-k="' + l.k + '">' + ic('x') + 'Ignorer cette ligne</button>');
};
A.vChange = function (d) { closeSheet(function () { A.vOther(d); }); };
A.vRename = function (d) { closeSheet(function () { A.vName(d); }); };
A.vSkipSheet = function (d) { closeSheet(function () { A.vSkip(d); }); };
A.vQty = function (d) {
  var l = vLine(d.k), p = D().prod[l.pid], u = (p && p.unite) || 'unités';
  closeSheet(function () {
    openSheet('<h3>Quantité</h3><p>Sur la facture : ' + esc(l.libelle) + ' · ' + fq(l.qte) + (l.unite ? ' ' + esc(l.unite) : '') + '</p>' +
      '<div class="field"><label for="vq">Quantité facturée</label><input id="vq" class="inp" inputmode="decimal" value="' + fq(l.qte).replace('−', '-') + '"></div>' +
      '<div class="field"><label for="vf">1 ' + esc(l.unite || 'unité facturée') + ' = combien de ' + esc(u) + ' dans le stock ?</label><input id="vf" class="inp" inputmode="decimal" value="' + fq(l.facteur) + '">' +
      '<span class="help">Ex. 10 pour un paquet de 10 si tu comptes à la pièce. Retenu pour les prochaines factures.</span></div>' +
      '<button class="btn" data-a="vQtyOk" data-k="' + l.k + '">OK</button>');
  });
};
A.vQtyOk = function (d) {
  var q = numOrNull(document.getElementById('vq').value), f = numOrNull(document.getElementById('vf').value);
  closeSheet(function () { vSet(d.k, function (l) { if (q !== null && q > 0) l.qte = q; if (f !== null && f > 0) l.facteur = f; }); });
};
A.vFourNew = function () {
  askText({ title: 'Nouveau fournisseur', value: VERIF.fourNom ? VERIF.fourNom.charAt(0) + VERIF.fourNom.slice(1).toLowerCase() : '', ok: 'Ajouter' }).then(function (name) {
    name = (name || '').trim(); if (!name) return;
    var id = uid('f'); commit(put('Fournisseurs', { id: id, nom: name, contact: '', tel: '', email: '', adresse: '', notes: '', actif: '1' }));
    VERIF.four = id; rematchAlias(); saveVerif(); render(false);
  });
};
A.vFourPick = function () {
  var M = D();
  openSheet('<h3>Quel fournisseur ?</h3>' + M.foursActifs.map(function (f) { return '<button class="menu-item" data-a="vFourSet" data-id="' + f.id + '">' + ic('truck') + esc(f.nom) + '</button>'; }).join(''));
};
A.vFourSet = function (d) { closeSheet(function () { VERIF.four = d.id; rematchAlias(); saveVerif(); render(false); }); };
/** Quand le fournisseur devient connu, les associations déjà apprises chez lui s'appliquent. */
function rematchAlias() {
  var M = D();
  VERIF.lignes.forEach(function (l) {
    var al = M.alias[lineKey(VERIF.four, l.libelle)];
    if (al && M.prod[al.produit] && (l.statut === 'check' || l.statut === 'new')) { l.pid = al.produit; l.facteur = num(al.facteur) || 1; l.statut = 'ok'; l.source = 'appris'; }
  });
}
A.vCancel = function () {
  ask({ title: 'Abandonner cette facture ?', text: 'Rien ne sera ajouté au stock. Le fichier reste rangé dans Google Drive.', ok: 'Abandonner', danger: true }).then(function (ok) {
    if (!ok) return; VERIF = null; saveVerif(); go('facture', {}, { replace: true });
  });
};
function hashKey(s) { var h = 0; for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return (h >>> 0).toString(36); }
A.vValidate = function () {
  var V = VERIF, M = D(); if (!V || vPending()) return;
  var now = nowIso(), fid = uid('fa'), ops = [], n = 0, four = V.four;
  var lab = (V.type === 'commande' ? 'Commande' : V.type === 'livraison' ? 'Livraison' : 'Facture') + (V.numero ? ' n° ' + V.numero : '');
  V.lignes.forEach(function (l) {
    if (l.statut !== 'ok' && l.statut !== 'create') return;
    var pid = l.pid, unitPrice = l.prix !== null ? round3(l.prix / l.facteur) : null;
    if (l.statut === 'create') {
      pid = uid('p');
      ops.push(put('Produits', { id: pid, nom: upName(l.nom), famille: l.famille, unite: '', seuil: '0', four: four, ref: '', notes: '', actif: '1', cree: now }));
    } else if (M.prod[pid] && !M.prod[pid].four) ops.push(put('Produits', { id: pid, four: four }));
    ops.push(put('Mouvements', { id: uid('m'), date: now, produit: pid, delta: String(round3(l.qte * l.facteur)), type: 'entree', qui: ME, lieu: lab, fournisseur: four, prix: unitPrice === null ? '' : String(unitPrice), note: fid }));
    var ex = (M.prix[pid] || []).filter(function (x) { return x.fournisseur === four; })[0];
    ops.push(put('Prix', { id: ex ? ex.id : uid('x'), produit: pid, fournisseur: four, prix: unitPrice === null ? (ex ? ex.prix : '') : String(unitPrice), ref: l.ref || (ex ? ex.ref : ''), maj: unitPrice === null ? (ex ? ex.maj : '') : now }));
    var key = lineKey(four, l.libelle);
    ops.push(put('Alias', { id: 'a' + hashKey(key), fournisseur: four, libelle: key.split('|')[1], produit: pid, facteur: String(l.facteur), maj: now }));
    n++;
  });
  ops.push(put('Factures', { id: fid, date: V.date, fournisseur: four, numero: V.numero, total: V.total === null ? '' : String(V.total), lignes: String(n), fichiers: (V.fichiers || []).join(' '), qui: ME, rangee: now }));
  commit(ops);
  VERIF = null; saveVerif();
  toast('Facture rangée', n + ' entrée' + (n > 1 ? 's' : '') + ' en stock · prix à jour');
  go('home', {}, { replace: true });
};

/* ---------------- choisir un produit (liste + recherche) ---------------- */

var PICK_CB = null;
function openPicker(title, hint, cb) {
  PICK_CB = cb;
  openSheet('<h3>' + esc(title) + '</h3>' + (hint ? '<p>Sur la facture : ' + esc(hint) + '</p>' : '') +
    '<div class="search" style="margin-bottom:10px">' + ic('search') + '<input type="search" autocomplete="off" aria-label="Chercher" placeholder="Chercher…" data-i="pickq" autofocus style="border:1px solid var(--chip)"></div>' +
    '<div class="list" id="picklist">' + pickList('') + '</div>');
}
function pickList(q) {
  var list = filterProds(q, '').slice(0, 60);
  return list.length ? list.map(function (p) { return '<button class="row" style="min-height:52px" data-a="pickIt" data-id="' + p.id + '"><div class="grow"><span class="t" style="font-size:15px">' + esc(p.nom) + '</span><span class="s">' + esc(famName(p.famille)) + ' · stock ' + fq(stockOf(p.id)) + '</span></div></button>'; }).join('') : '<div class="empty">Aucun produit</div>';
}
I.pickq = function (v) { var el = document.getElementById('picklist'); if (el) el.innerHTML = pickList(v); };
A.pickIt = function (d) { var cb = PICK_CB; PICK_CB = null; closeSheet(function () { if (cb) cb(d.id); }); };

/* ---------------- facture partagée depuis Gmail (Android) ---------------- */

function sharedFiles() {
  if (!/[?&]partage=1/.test(location.search) || !('caches' in window)) return;
  try { history.replaceState(history.state, '', location.pathname); } catch (e) {}
  var name = 'stock-share:' + location.pathname.replace(/index\.html$/, '');
  caches.open(name).then(function (c) {
    return c.keys().then(function (keys) {
      return Promise.all(keys.map(function (k) { return c.match(k).then(function (r) { return r.blob(); }); })).then(function (blobs) {
        keys.forEach(function (k) { c.delete(k); });
        var files = blobs.map(function (b, i) { try { return new File([b], b.type === 'application/pdf' ? 'Facture.pdf' : 'Photo' + i + '.jpg', { type: b.type }); } catch (e) { b.name = 'Fichier'; return b; } });
        if (!files.length) return;
        if (isPatron()) addFiles(files);
        else { window.PENDING_SHARE = files; toast('Facture reçue', 'Connecte-toi en patron pour la ranger'); }
      });
    });
  }).catch(function () {});
}
window.afterLogin = function () { if (window.PENDING_SHARE && isPatron()) { var f = window.PENDING_SHARE; window.PENDING_SHARE = null; addFiles(f); } };
sharedFiles();
