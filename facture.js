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
  var recent = isPatron() ? M.factures.slice(0, 4) : [];
  if (recent.length) {
    html += '<div class="sec-title"><span>Dernières factures</span><button class="link" data-a="go" data-r="factures">Toutes les factures</button></div><div class="card" style="padding-top:4px;padding-bottom:4px">' + recent.map(factRow).join('') + '</div>';
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
  archivePages(FACT.pages).then(function (archive) {
    return call('facture', [CFG.code, { files: FACT.pages.map(function (p) { return { mime: p.mime, data: p.data }; }), archive: archive }], 150000);
  })
    .then(function (doc) {
      clearInterval(FACT.timer); FACT.busy = false;
      if (!doc.est_document_achat && !(doc.lignes || []).length) { FACT.err = 'Ce document ne ressemble pas à une facture de matériel.'; render(false); return; }
      VERIF = buildVerif(doc); saveVerif();
      var pages = FACT.pages; FACT.pages = [];
      go('verif', {}, { replace: true });
      // logo du fournisseur : découpé dans la facture (si Gemini l'a trouvé), proposé pour sa fiche
      cropLogo(pages, doc).then(function (logo) {
        if (!logo || !VERIF) return;
        VERIF.logo = logo; saveVerif(); if (VIEW.r === 'verif') render(false);
      }).catch(function () {});
    })
    .catch(function (e) {
      clearInterval(FACT.timer); FACT.busy = false;
      FACT.err = e.code === 'NOKEY' ? 'La clé Gemini n\'est pas encore installée dans le script (voir le guide).' : e.message;
      render(false);
    });
};

/* ---------------- archive légère : pages en JPEG (1600 px, très lisibles) ---------------- */

var ARCH_W = 1600, ARCH_Q = 0.72;
function canvasJpeg(src, w, h) {
  var k = Math.min(1, ARCH_W / w), c = document.createElement('canvas');
  c.width = Math.round(w * k); c.height = Math.round(h * k);
  var cx = c.getContext('2d'); cx.fillStyle = '#fff'; cx.fillRect(0, 0, c.width, c.height); cx.drawImage(src, 0, 0, c.width, c.height);
  return { mime: 'image/jpeg', data: c.toDataURL('image/jpeg', ARCH_Q).split(',')[1] };
}
/** Les pages à garder dans le Drive : photos réduites, PDF transformés en images (10 pages max). Échec = on garde l'original. */
function archivePages(pages) {
  var out = [];
  var chain = Promise.resolve();
  pages.forEach(function (p) {
    chain = chain.then(function () {
      if (!/pdf/i.test(p.mime)) return loadImg(p.thumb || ('data:' + p.mime + ';base64,' + p.data)).then(function (img) { out.push(canvasJpeg(img, img.naturalWidth, img.naturalHeight)); });
      return loadPdfJs().then(function (lib) { return lib.getDocument({ data: pdfBytes(p.data) }).promise; }).then(function (pdf) {
        var c2 = Promise.resolve();
        for (var n = 1; n <= Math.min(pdf.numPages, 10); n++) (function (n) {
          c2 = c2.then(function () { return pdf.getPage(n); }).then(function (pg) {
            var v0 = pg.getViewport({ scale: 1 }), vp = pg.getViewport({ scale: ARCH_W / v0.width });
            var c = document.createElement('canvas'); c.width = Math.round(vp.width); c.height = Math.round(vp.height);
            var cx = c.getContext('2d'); cx.fillStyle = '#fff'; cx.fillRect(0, 0, c.width, c.height);
            return pg.render({ canvasContext: cx, viewport: vp }).promise.then(function () { out.push(canvasJpeg(c, c.width, c.height)); });
          });
        })(n);
        return c2;
      });
    });
  });
  return chain.then(function () { return out; }).catch(function (e) { console.warn('archive', e && e.message); return []; });
}

/* ---------------- logo du fournisseur ---------------- */

function loadImg(src) { return new Promise(function (res, rej) { var i = new Image(); i.onload = function () { res(i); }; i.onerror = rej; i.src = src; }); }
function pdfBytes(b64) { var bin = atob(b64), u = new Uint8Array(bin.length); for (var i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i); return u; }
/** Image source (img ou canvas) de la page n° `page` (1 = première) de l'ensemble des fichiers envoyés. */
function pageSource(pages, page) {
  var i = 0, before = 0;
  function next() {
    if (i >= pages.length) return Promise.resolve(null);
    var p = pages[i++];
    if (!/pdf/i.test(p.mime)) {
      if (before + 1 === page) return loadImg(p.thumb || ('data:' + p.mime + ';base64,' + p.data));
      before++; return next();
    }
    return loadPdfJs().then(function (lib) { return lib.getDocument({ data: pdfBytes(p.data) }).promise; }).then(function (pdf) {
      if (page > before + pdf.numPages) { before += pdf.numPages; return next(); }
      return pdf.getPage(page - before).then(function (pg) {
        var v0 = pg.getViewport({ scale: 1 }), vp = pg.getViewport({ scale: 1800 / Math.max(v0.width, v0.height) });
        var c = document.createElement('canvas'); c.width = Math.round(vp.width); c.height = Math.round(vp.height);
        var cx = c.getContext('2d'); cx.fillStyle = '#fff'; cx.fillRect(0, 0, c.width, c.height);
        return pg.render({ canvasContext: cx, viewport: vp }).promise.then(function () { return c; });
      });
    });
  }
  return next();
}
/** Découpe le logo (cadre donné par Gemini en millièmes) → petite image (moins de 40 000 caractères, rangée dans le Sheet). */
function cropLogo(pages, doc) {
  var b = doc.logo_box || [], page = num(doc.logo_page);
  if (!page || b.length !== 4 || !pages.length) return Promise.resolve('');
  var y0 = b[0] / 1000, x0 = b[1] / 1000, y1 = b[2] / 1000, x1 = b[3] / 1000;
  if (!(y1 > y0 && x1 > x0) || (y1 - y0) * (x1 - x0) > 0.3 || (y1 - y0) < 0.01 || (x1 - x0) < 0.02) return Promise.resolve('');
  return pageSource(pages, page).then(function (src) {
    if (!src) return '';
    var W = src.naturalWidth || src.width, H = src.naturalHeight || src.height, m = 0.008;
    var sx = Math.max(0, (x0 - m) * W), sy = Math.max(0, (y0 - m) * H), sw = Math.min(W, (x1 + m) * W) - sx, sh = Math.min(H, (y1 + m) * H) - sy;
    if (sw < 8 || sh < 8) return '';
    // on resserre le cadre sur le logo (marges blanches retirées)
    var t = document.createElement('canvas'); t.width = Math.round(sw); t.height = Math.round(sh);
    var tx = t.getContext('2d'); tx.fillStyle = '#fff'; tx.fillRect(0, 0, t.width, t.height); tx.drawImage(src, sx, sy, sw, sh, 0, 0, t.width, t.height);
    try {
      var px = tx.getImageData(0, 0, t.width, t.height).data, minX = t.width, minY = t.height, maxX = -1, maxY = -1;
      for (var y = 0; y < t.height; y++) for (var x = 0; x < t.width; x++) {
        var o = (y * t.width + x) * 4;
        if (px[o] < 232 || px[o + 1] < 232 || px[o + 2] < 232) { if (x < minX) minX = x; if (x > maxX) maxX = x; if (y < minY) minY = y; if (y > maxY) maxY = y; }
      }
      if (maxX < 0) return '';
      var pad = 4; minX = Math.max(0, minX - pad); minY = Math.max(0, minY - pad); maxX = Math.min(t.width - 1, maxX + pad); maxY = Math.min(t.height - 1, maxY + pad);
      src = t; sx = minX; sy = minY; sw = maxX - minX + 1; sh = maxY - minY + 1;
    } catch (e) { src = t; sx = 0; sy = 0; }
    var out = '', maxW = 480, maxH = 200;
    for (var tries = 0; tries < 4; tries++) {
      var k = Math.min(1, maxW / sw, maxH / sh), c = document.createElement('canvas');
      c.width = Math.max(1, Math.round(sw * k)); c.height = Math.max(1, Math.round(sh * k));
      var cx = c.getContext('2d'); cx.fillStyle = '#fff'; cx.fillRect(0, 0, c.width, c.height);
      cx.drawImage(src, sx, sy, sw, sh, 0, 0, c.width, c.height);
      out = c.toDataURL('image/png');
      if (out.length > 38000) out = c.toDataURL('image/jpeg', 0.88);
      if (out.length <= 38000) return out;
      maxW = Math.round(maxW * 0.75); maxH = Math.round(maxH * 0.75);
    }
    return '';
  });
}
A.vNoLogo = function () { if (VERIF) { VERIF.logo = ''; saveVerif(); render(false); } };

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
  if (!VERIF) { return SCREENS.facture(); }
  var M = D(), V = VERIF;
  var nOk = V.lignes.filter(function (l) { return l.statut === 'ok' || l.statut === 'create'; }).length;
  var nCheck = V.lignes.filter(function (l) { return l.statut === 'check'; }).length, nNew = V.lignes.filter(function (l) { return l.statut === 'new'; }).length;
  var dup = V.four && V.numero && M.factures.filter(function (f) { return f.fournisseur === V.four && norm(f.numero) === norm(V.numero); })[0];
  var html = '<div class="screen">' + head({ cls: 'green', title: 'Vérifier la facture', backAct: 'vBack',
    sub: esc([V.four ? fourName(V.four) : V.fourNom, V.numero ? 'n° ' + V.numero : '', fday(V.date), V.total !== null ? fe(V.total) + ' HT' : ''].filter(Boolean).join(' · ')),
    extra: '<div class="vchips"><span class="vc ok">' + nOk + ' reconnue' + (nOk > 1 ? 's' : '') + '</span>' + (nCheck ? '<span class="vc check">' + nCheck + ' à vérifier</span>' : '') + (nNew ? '<span class="vc new">' + nNew + ' nouveau' + (nNew > 1 ? 'x' : '') + '</span>' : '') + '</div>' }) +
    '<div class="scroll nonav" style="padding-bottom:170px">';
  if (dup) html += '<div class="hint" style="background:var(--orange-bg);color:#7A3D00"><b>Déjà rangée ?</b> Une facture ' + esc(fourName(V.four)) + ' n° ' + esc(V.numero) + ' a été rangée le ' + fday(dup.rangee) + '. Vérifie avant de valider pour ne pas compter deux fois.</div>';
  if (V.logo && !(V.four && M.four[V.four] && M.four[V.four].logo)) {
    html += '<div class="vlogo"><img src="' + V.logo + '" alt="Logo du fournisseur"><div class="grow"><b>Logo trouvé</b><span>Il ira sur la fiche du fournisseur (même si tu abandonnes).</span></div><button class="link" data-a="vNoLogo">Ne pas le garder</button></div>';
  }
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
    if (!ok) return;
    // le logo trouvé reste utile même si la facture n'est pas rangée
    var M = D(); if (VERIF.logo && VERIF.four && M.four[VERIF.four] && !M.four[VERIF.four].logo) commit(put('Fournisseurs', { id: VERIF.four, logo: VERIF.logo }));
    VERIF = null; saveVerif(); go('facture', {}, { replace: true });
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
  if (V.logo && four && !(M.four[four] && M.four[four].logo)) ops.push(put('Fournisseurs', { id: four, logo: V.logo }));
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
        if (me()) addFiles(files);
        else { window.PENDING_SHARE = files; toast('Facture reçue', 'Connecte-toi pour la ranger'); }
      });
    });
  }).catch(function () {});
}
window.afterLogin = function () { if (window.PENDING_SHARE) { var f = window.PENDING_SHARE; window.PENDING_SHARE = null; addFiles(f); } };
sharedFiles();


/* ---------------- toutes les factures (patron) ---------------- */

function factLignes(fid) { return D().moves.filter(function (m) { return m.note === fid && m.type === 'entree'; }); }
function factDate(f) { return String(f.date || f.rangee || '').slice(0, 10); }
function factRow(f) {
  var nb = num(f.lignes), photo = f.fichiers && !/\.pdf/i.test(f.fichiers) && f.fichiers.indexOf(' ') > 0;
  return '<button class="line frow" data-a="go" data-r="factureFiche" data-id="' + f.id + '">' +
    '<span class="fthumb"><i></i><i></i><i></i><i></i></span>' +
    '<div class="grow"><span class="t ell">' + esc((fourName(f.fournisseur) || 'Fournisseur ?') + (f.numero ? ' · n° ' + f.numero : '')) + '</span>' +
    '<span class="s">' + esc([fday(factDate(f)), nb + ' ligne' + (nb > 1 ? 's' : ''), userName(f.qui)].filter(Boolean).join(' · ')) + '</span></div>' +
    (f.total ? '<b class="ftot">' + fe(num(f.total)) + '</b>' : '') + '</button>';
}
var MOIS_NOMS = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
SCREENS.factures = function (p) {
  if (!isPatron()) return SCREENS.facture();
  var M = D(), nq = norm(p.q || '');
  var list = M.factures.filter(function (f) {
    if (!nq) return true;
    var txt = (fourName(f.fournisseur) || '') + ' ' + (f.numero || '') + ' ' + factLignes(f.id).map(function (m) { var pr = M.prod[m.produit]; return pr ? pr.nom : ''; }).join(' ');
    return norm(txt).indexOf(nq) >= 0;
  }).sort(function (a, b) { return factDate(a) < factDate(b) ? 1 : factDate(a) > factDate(b) ? -1 : ((a.rangee || '') < (b.rangee || '') ? 1 : -1); });
  var groups = [], cur = null;
  list.forEach(function (f) {
    var k = factDate(f).slice(0, 7);
    if (!cur || cur.k !== k) { cur = { k: k, items: [], tot: 0 }; groups.push(cur); }
    cur.items.push(f); cur.tot += num(f.total) || 0;
  });
  var html = '<div class="screen">' + head({ title: 'Factures', right: '<button class="small-btn" style="background:var(--green);color:#fff;border:0" data-a="go" data-r="facture">' + ic('plus') + 'Ranger</button>',
    extra: searchBox('fsq', 'Fournisseur, n° de facture, produit…', p.q) }) + syncBar() + '<div class="scroll">';
  if (!list.length) html += '<div class="empty">' + (nq ? 'Aucune facture trouvée' : 'Aucune facture rangée pour l\'instant.<br>Appuie sur « Ranger » pour lire la première.') + '</div>';
  groups.forEach(function (g) {
    var y = +g.k.slice(0, 4), m = +g.k.slice(5, 7);
    html += '<div class="sec-title"><span>' + (m ? MOIS_NOMS[m - 1] + ' ' + y : 'Sans date') + '</span><span class="s" style="color:var(--muted);font-size:14px;font-weight:600">' + (g.tot ? fe(g.tot) + ' HT' : '') + '</span></div>' +
      '<div class="card" style="padding-top:2px;padding-bottom:2px">' + g.items.map(factRow).join('') + '</div>';
  });
  html += '<p style="text-align:center;color:var(--muted);font-size:13px;margin-top:16px">Montants HT · originaux gardés sur Google Drive</p>';
  return html + '</div>' + nav('inventaire') + '</div>';
};
var FSQ_T = null;
I.fsq = function (v) { VIEW.p.q = v; saveView(); clearTimeout(FSQ_T); FSQ_T = setTimeout(function () { render(false); var inp = document.querySelector('[data-i="fsq"]'); if (inp) { inp.focus(); inp.setSelectionRange(v.length, v.length); } }, 250); };

SCREENS.factureFiche = function (p) {
  var M = D(), f = (M.factures.filter(function (x) { return x.id === p.id; }))[0];
  if (!f || !isPatron()) return SCREENS.factures(VIEW.p = { q: '' });
  var lignes = factLignes(f.id), liens = (f.fichiers || '').split(' ').filter(Boolean);
  var html = '<div class="screen">' + head({ title: esc(fourName(f.fournisseur) || 'Facture'), sub: esc('Facture' + (f.numero ? ' n° ' + f.numero : '') + (factDate(f) ? ' · ' + fday(factDate(f)) : '')) }) + '<div class="scroll nonav">';
  html += '<div class="card ftop"><div class="grow"><span class="s">Rangée' + (f.qui ? ' par ' + esc(userName(f.qui)) : '') + (f.rangee ? ' le ' + fday(f.rangee) : '') + '</span>' +
    '<span class="s">' + lignes.length + ' ligne' + (lignes.length > 1 ? 's' : '') + ' entrée' + (lignes.length > 1 ? 's' : '') + ' en stock</span></div>' +
    (f.total ? '<div class="ftotal">' + fe(num(f.total)) + '<small>HT</small></div>' : '') + '</div>';
  if (liens.length) {
    html += '<div class="card forig"><button class="fthumb big" data-a="fView" data-id="' + f.id + '" aria-label="Voir l\'original"><i></i><i></i><i></i><i></i><i></i><i></i></button>' +
      '<div class="grow"><span class="s">Original : ' + liens.length + ' fichier' + (liens.length > 1 ? 's' : '') + ' sur Google Drive</span>' +
      '<button class="btn" style="margin-top:8px" data-a="fView" data-id="' + f.id + '">' + ic('eye') + 'Voir l\'original</button>' +
      '<button class="btn light" style="margin-top:8px" data-a="fShare" data-id="' + f.id + '">' + ic('share') + 'Partager</button></div></div>';
  } else {
    html += '<div class="hint">Pas d\'original enregistré pour cette facture.</div>';
  }
  html += '<div class="sec-title"><span>Entré en stock</span></div><div class="card" style="padding-top:2px;padding-bottom:2px">' +
    (lignes.length ? lignes.map(function (m) {
      var pr = M.prod[m.produit];
      return '<button class="line" data-a="openProd" data-id="' + m.produit + '"><span class="mv in" style="min-width:48px">+' + fq(num(m.delta)) + '</span>' +
        '<div class="grow"><span class="t ell">' + esc(pr ? pr.nom : 'Produit supprimé') + '</span></div>' +
        (m.prix ? '<span class="s" style="white-space:nowrap">' + fe(num(m.prix)) + '/u</span>' : '') + '</button>';
    }).join('') : '<div class="empty">Plus aucune ligne en stock pour cette facture.</div>') + '</div>';
  html += '<button class="btn danger" style="margin-top:18px" data-a="fCancel" data-id="' + f.id + '">' + ic('trash') + 'Annuler cette facture</button>' +
    '<p style="font-size:13px;color:var(--muted);margin:8px 4px 0">Annuler retire du stock les ' + lignes.length + ' entrée' + (lignes.length > 1 ? 's' : '') + ' de cette facture et met l\'original à la corbeille du Drive. Les produits créés, les prix et ce que l\'appli a appris restent.</p>';
  return html + '</div></div>';
};
A.fCancel = function (d) {
  var M = D(), f = (M.factures.filter(function (x) { return x.id === d.id; }))[0]; if (!f) return;
  var lignes = factLignes(f.id), liens = (f.fichiers || '').split(' ').filter(Boolean);
  ask({ title: 'Annuler cette facture ?', text: lignes.length + ' entrée' + (lignes.length > 1 ? 's' : '') + ' en stock seront retirée' + (lignes.length > 1 ? 's' : '') + '. Tu pourras la ranger à nouveau ensuite.', ok: 'Annuler la facture', danger: true }).then(function (ok) {
    if (!ok) return;
    var ops = lignes.map(function (m) { return del('Mouvements', m.id); }); ops.push(del('Factures', f.id));
    commit(ops);
    if (liens.length) call('jeterFichiers', [CFG.code, { liens: liens }], 60000).catch(function () { /* le fichier restera dans le Drive */ });
    toast('Facture annulée', lignes.length + ' entrée' + (lignes.length > 1 ? 's' : '') + ' retirée' + (lignes.length > 1 ? 's' : '') + ' du stock');
    go('factures', {}, { replace: true });
  });
};

/* ---------------- original : affiché dans l'appli, sans compte Google ---------------- */

var FCACHE = {};   // lien → { nom, mime, data } (gardé le temps de la session)
function getOriginal(lien) {
  if (FCACHE[lien]) return Promise.resolve(FCACHE[lien]);
  return call('fichier', [CFG.code, { lien: lien }], 90000).then(function (r) { FCACHE[lien] = r; return r; });
}
function b64Blob(r) { var bin = atob(r.data), u = new Uint8Array(bin.length); for (var i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i); return new Blob([u], { type: r.mime }); }
function loadPdfJs() {
  if (window.pdfjsLib) return Promise.resolve(window.pdfjsLib);
  return new Promise(function (res, rej) {
    var sc = document.createElement('script'); sc.src = 'lib/pdfjs/pdf.min.js';
    sc.onload = function () { window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'lib/pdfjs/pdf.worker.min.js'; res(window.pdfjsLib); };
    sc.onerror = function () { rej(new Error('Lecteur PDF indisponible hors connexion')); };
    document.head.appendChild(sc);
  });
}
function renderPdfInto(box, r) {
  return loadPdfJs().then(function (lib) {
    var bin = atob(r.data), u = new Uint8Array(bin.length); for (var i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i);
    return lib.getDocument({ data: u }).promise;
  }).then(function (pdf) {
    var chain = Promise.resolve(), w = Math.min(box.clientWidth || 360, 900), dpr = Math.min(window.devicePixelRatio || 1, 2) * 1.5;
    for (var n = 1; n <= Math.min(pdf.numPages, 20); n++) (function (n) {
      chain = chain.then(function () { return pdf.getPage(n); }).then(function (page) {
        var v0 = page.getViewport({ scale: 1 }), sc = w / v0.width, vp = page.getViewport({ scale: sc * dpr });
        var c = document.createElement('canvas'); c.width = Math.round(vp.width); c.height = Math.round(vp.height); c.className = 'vpage';
        box.appendChild(c);
        return page.render({ canvasContext: c.getContext('2d'), viewport: vp }).promise;
      });
    })(n);
    return chain;
  });
}
A.fView = function (d) {
  var f = (D().factures.filter(function (x) { return x.id === d.id; }))[0]; if (!f) return;
  var liens = (f.fichiers || '').split(' ').filter(Boolean); if (!liens.length) return;
  var ov = document.createElement('div'); ov.className = 'viewer'; ov.id = 'viewer';
  ov.innerHTML = '<div class="v-head"><div class="grow"><b>' + esc((fourName(f.fournisseur) || 'Facture') + (f.numero ? ' · n° ' + f.numero : '')) + '</b><span>Écarte deux doigts pour zoomer</span></div>' +
    '<button class="v-x" data-a="fViewClose" aria-label="Fermer">' + ic('x') + '</button></div>' +
    '<div class="v-body"><div class="v-load"><i class="spin"></i>Je récupère l\'original…</div></div>' +
    '<div class="v-foot"><button class="btn light" data-a="fZoom">' + ic('search') + 'Zoom</button><button class="btn" data-a="fShare" data-id="' + f.id + '">' + ic('share') + 'Partager</button></div>';
  document.body.appendChild(ov); document.body.classList.add('noscroll');
  try { history.pushState({ r: VIEW.r, p: VIEW.p, viewer: 1 }, ''); } catch (e) {}
  var body = ov.querySelector('.v-body');
  Promise.all(liens.map(getOriginal)).then(function (rs) {
    if (!document.getElementById('viewer')) return;
    body.innerHTML = '';
    var chain = Promise.resolve();
    rs.forEach(function (r) {
      chain = chain.then(function () {
        if (/pdf/i.test(r.mime)) return renderPdfInto(body, r);
        var img = document.createElement('img'); img.className = 'vpage'; img.alt = r.nom || 'Facture'; img.src = 'data:' + r.mime + ';base64,' + r.data; body.appendChild(img);
      });
    });
    return chain;
  }).catch(function (e) {
    body.innerHTML = '<div class="v-load err">Impossible d\'afficher l\'original.<br><span>' + esc(e.message || String(e)) + '</span></div>';
  });
};
function closeViewer() { var ov = document.getElementById('viewer'); if (ov) { ov.remove(); document.body.classList.remove('noscroll'); return true; } return false; }
A.fViewClose = function () { if (history.state && history.state.viewer) history.back(); else closeViewer(); };
// bouton retour d'Android : ferme l'original sans changer d'écran
window.addEventListener('popstate', function (e) { if (closeViewer()) e.stopImmediatePropagation(); }, true);
A.fZoom = function () { var b = document.querySelector('#viewer .v-body'); if (b) b.classList.toggle('zoom'); };
A.fShare = function (d) {
  var f = (D().factures.filter(function (x) { return x.id === d.id; }))[0]; if (!f) return;
  var liens = (f.fichiers || '').split(' ').filter(Boolean); if (!liens.length) return;
  toast('Préparation…', 'Je récupère l\'original');
  Promise.all(liens.map(getOriginal)).then(function (rs) {
    var titre = 'Facture ' + (fourName(f.fournisseur) || '') + (f.numero ? ' n° ' + f.numero : '');
    var files = rs.every(function (r) { return /^image\//.test(r.mime); }) && window.jspdf ? [imagesToPdf(rs, titre)] :
      rs.map(function (r) { return new File([b64Blob(r)], r.nom || 'Facture', { type: r.mime }); });
    if (navigator.canShare && navigator.canShare({ files: files })) return navigator.share({ files: files, title: titre, text: titre }).catch(function () {});
    files.forEach(function (fl) { var a = document.createElement('a'); a.href = URL.createObjectURL(fl); a.download = fl.name; document.body.appendChild(a); a.click(); a.remove(); });
    toast('Téléchargé', 'Le fichier est dans tes téléchargements');
  }).catch(function (e) { toast('Partage impossible', e.message || String(e)); });
};

/** Pages images → un seul PDF (A4) pour l'envoyer au comptable comme une vraie facture. */
function imagesToPdf(rs, titre) {
  var doc = new window.jspdf.jsPDF({ unit: 'mm', format: 'a4', compress: true });
  rs.forEach(function (r, i) {
    if (i) doc.addPage();
    var props = doc.getImageProperties('data:' + r.mime + ';base64,' + r.data);
    var W = 210, H = 297, m = 6, k = Math.min((W - 2 * m) / props.width, (H - 2 * m) / props.height);
    var w = props.width * k, h = props.height * k;
    doc.addImage('data:' + r.mime + ';base64,' + r.data, 'JPEG', (W - w) / 2, m, w, h);
  });
  var nom = titre.replace(/[\\/:*?"<>|]+/g, ' ').replace(/\s+/g, ' ').trim() + '.pdf';
  return new File([doc.output('blob')], nom, { type: 'application/pdf' });
}
