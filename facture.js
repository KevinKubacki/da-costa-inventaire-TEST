/* Stock Da Costa — factures : photo / PDF → lecture par Gemini → vérification → entrée en stock */
'use strict';

var FACT = { pages: [], busy: false, err: '', step: 0, timer: null };   // fichiers en mémoire (pas dans l'historique)
var VERIF = LS.get('verif', null);                                      // vérification en cours (survit à une fermeture)
var VQUEUE = LS.get('vqueue', []);                                       // V1.20 : les factures suivantes à vérifier
function saveVerif() { if (VERIF) LS.set('verif', VERIF); else LS.del('verif'); if (VQUEUE.length) LS.set('vqueue', VQUEUE); else LS.del('vqueue'); }
/** Chaque PDF = une facture ; toutes les photos ensemble = une facture (pages d'un même document). */
function groupDocs(pages) {
  var docs = [], photos = [];
  pages.forEach(function (p) { if (/pdf/i.test(p.mime)) docs.push({ nom: p.name || 'PDF', pages: [p] }); else photos.push(p); });
  if (photos.length) docs.push({ nom: photos.length > 1 ? photos.length + ' photos' : 'Photo', pages: photos });
  return docs;
}
/** Après une facture validée ou abandonnée : la suivante de la file. */
function nextVerif(msg) {
  if (VQUEUE.length) {
    VERIF = VQUEUE.shift(); saveVerif();
    if (msg) toast(msg, 'Facture suivante : ' + (VERIF.fourNom || 'à vérifier'));
    go('verif', {}, { replace: true }); return true;
  }
  VERIF = null; saveVerif(); return false;
}

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
    var P = FACT.prog || [], nb = P.length;
    html += '<div class="scan-wrap"><div class="scan-doc">' + (FACT.pages[0] && FACT.pages[0].thumb ? '<img src="' + FACT.pages[0].thumb + '" alt="">' : ic('file')) + '<i class="scan-bar"></i></div>' +
      '<div class="scan-title">' + (nb > 1 ? 'Je lis les ' + nb + ' factures…' : 'Je lis la facture…') + '</div>' + progList(P) +
      '<p style="color:var(--muted);font-size:14px;text-align:center;margin:0">Ça prend en général 10 à 30 secondes' + (nb > 1 ? ' (elles sont lues en même temps)' : '') + '.</p></div>';
    return html + '</div></div>';
  }
  if (VERIF && !FACT.pages.length) {
    html += '<button class="row" style="border:2px solid #F6B969;margin-bottom:14px" data-a="go" data-r="verif">' + ic('file') +
      '<div class="grow"><span class="t">Vérification en cours</span><span class="s">' + esc((VERIF.fourNom || 'Facture') + (VERIF.numero ? ' · n° ' + VERIF.numero : '')) + ' · à terminer' + (VQUEUE.length ? ' (+ ' + VQUEUE.length + ' autre' + (VQUEUE.length > 1 ? 's' : '') + ')' : '') + '</span></div>' + ic('chev') + '</button>';
  }
  if (FACT.err) html += (FACT.devis ? '<div class="hint" style="background:var(--orange-bg);color:#7A3D00"><b>Devis : rien n\'est rangé.</b> ' : '<div class="hint" style="background:var(--red-bg);color:var(--red-ink)"><b>Lecture impossible.</b> ') + esc(FACT.err) + '</div>' + (FACT.prog && FACT.prog.length > 1 ? progList(FACT.prog) : '');
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
function progList(P) {
  return '<div class="fprog">' + P.map(function (x, i) {
    var s = Math.round((Date.now() - x.t0) / 1000);
    var st = x.etat === 'prep' ? 'Préparation…' : x.etat === 'lit' ? 'Gemini lit les lignes… ' + s + ' s' : x.etat === 'ok' ? esc(x.four || 'Fournisseur ?') + ' — ' + x.n + ' ligne' + (x.n > 1 ? 's' : '') + ' trouvée' + (x.n > 1 ? 's' : '') :
      x.etat === 'skip' ? (x.devis ? 'Devis / offre de prix : rien n\'entre en stock' : 'Pas une facture de matériel : ignorée') : 'Erreur : ' + esc(x.msg || '');
    return '<div class="fp ' + x.etat + '"><span class="fp-i">' + (x.etat === 'ok' ? '✓' : x.etat === 'skip' ? '–' : x.etat === 'err' ? '!' : '<i class="spin"></i>') + '</span><span class="grow"><b>' + (P.length > 1 ? 'Facture ' + (i + 1) + ' · ' : '') + esc(x.nom) + '</b><span>' + st + '</span></span></div>';
  }).join('') + '</div>';
}
A.fRead = function () {
  if (!FACT.pages.length || FACT.busy) return;
  var docs = groupDocs(FACT.pages), t0 = Date.now();
  FACT.prog = docs.map(function (d) { return { nom: d.nom, etat: 'prep', t0: t0 }; });
  FACT.busy = true; FACT.err = ''; render(true);
  clearInterval(FACT.timer);
  FACT.timer = setInterval(function () { if (VIEW.r === 'facture') render(false); }, 1000);
  var lus = [];
  Promise.all(docs.map(function (d, i) {
    var P = FACT.prog[i];
    return archivePages(d.pages).then(function (archive) {
      P.etat = 'lit'; P.t0 = Date.now(); if (VIEW.r === 'facture') render(false);
      return call('facture', [CFG.code, { files: d.pages.map(function (p) { return { mime: p.mime, data: p.data }; }), archive: archive }], 150000);
    }).then(function (doc) {
      if (!doc.est_document_achat && !(doc.lignes || []).length) { P.etat = 'skip'; return; }
      if (/devis|offre/i.test(doc.type_document || '')) { P.etat = 'skip'; P.devis = true; return; }   // V3.10 : un devis / une offre de prix n'entre jamais en stock
      var v = buildVerif(doc); v.deja = doc.deja || null; v.vid = uid('v'); if (window.ORIG) ORIG[v.vid] = d.pages; P.etat = 'ok'; P.n = (doc.lignes || []).length; P.four = v.fourNom || (v.four ? fourName(v.four) : '');
      lus[i] = v;
      // logo du fournisseur : découpé dans la facture (si Gemini l'a trouvé), proposé pour sa fiche
      cropLogo(d.pages, doc).then(function (logo) { if (!logo) return; v.logo = logo; if (v === VERIF || VQUEUE.indexOf(v) >= 0) { saveVerif(); if (VIEW.r === 'verif') render(false); } }).catch(function () {});
    }).catch(function (e) {
      P.etat = 'err'; P.msg = e.code === 'NOKEY' ? 'la clé Gemini n\'est pas encore installée dans le script (voir le guide).' : e.message;
    }).then(function () { if (VIEW.r === 'facture') render(false); });
  })).then(function () {
    clearInterval(FACT.timer); FACT.busy = false;
    var ok = lus.filter(Boolean), P = FACT.prog, ign = P.filter(function (x) { return x.etat === 'skip'; }).length, err = P.filter(function (x) { return x.etat === 'err'; });
    if (!ok.length) {
      FACT.devis = P.length === 1 && !!P[0].devis;
      FACT.err = P.length === 1 ? (err.length ? err[0].msg : P[0].devis ? 'C\'est un devis (offre de prix) : rien n\'entre en stock. Range la facture quand le matériel sera livré.' : 'Ce document ne ressemble pas à une facture de matériel.') : 'Aucune facture de matériel trouvée.';
      render(false); return;
    }
    ok.forEach(function (v, i) { v.pos = i + 1; v.tot = ok.length; });
    FACT.pages = [];
    if (VERIF) VQUEUE = VQUEUE.concat(ok); else { VERIF = ok[0]; VQUEUE = VQUEUE.concat(ok.slice(1)); }
    saveVerif();
    var autres = [ign ? ign + ' ignorée' + (ign > 1 ? 's' : '') + ' (devis ou pas du matériel)' : '', err.length ? err.length + ' illisible' + (err.length > 1 ? 's' : '') : ''].filter(Boolean).join(' · ');
    if (ok.length > 1 || autres) toast(ok.length + ' facture' + (ok.length > 1 ? 's' : '') + ' à vérifier', autres || 'l\'une après l\'autre');
    go('verif', {}, { replace: true });
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
/* ---------- V3.8 : garde-fous avant de ranger (unités, prix) ---------- */
/** « (BOÎTE 100) », « BTE 200 », « PACK 2500 », « SAC 25 » : combien de pièces dans le conditionnement écrit dans un nom. */
function tailleBoite(nom) {
  var m = /(?:bo[iî]tes?|bte|bt|paquets?|pqt|pack|sacs?|cartons?|lots?)\.?\s*(?:de\s*)?(\d{2,5})\b/i.exec(String(nom || ''));
  return m ? +m[1] : 0;
}
/* ---------- V3.13 : « on compte comme on achète » (décidé avec Kevin et Jimmy le 15/10) ----------
   Des vis s'achètent en boîtes : le stock les compte en boîtes, au prix de la boîte, et le Bilan donne aussi les pièces.
   Pour chaque ligne de facture, l'appli propose comment la ranger (Jimmy valide) :
   1) le libellé donne la taille (« BOÎTE 100 », « BTE 200 », « SAC 25 ») → des boîtes de cette taille ;
   2) quantité × prix lu = 100 ou 1 000 fois le montant de la ligne (prix « pour 100 ») → boîtes de 100 (ou 1 000) ;
      ou petite visserie à moins de 0,50 € la pièce en quantité ronde → boîtes de 100 (50, 25) ;
   3) au kilo → garder au kilo, ou compter en rouleaux (Jimmy donne le poids d'un rouleau) ;
   sinon : à l'unité, rien à demander (un Velux est un Velux). */
var MOTS_LOT = /\b(VIS|POINTES?|CLOUS?|CHEVILLES?|AGRAFES?|RIVETS?|TIREFONDS?|BOULONS?|ECROUS?|RONDELLES?)\b/;
var RE_BOITE_NOM = /\s*\(?\b(?:BO[IÎ]TES?|BTE|BT|PAQUETS?|PQT|PACK|LOTS?)\.?\s*(?:DE\s*)?\d{2,5}\b\)?/i;
function condProposee(L) {
  var q = L.qte, n = tailleBoite(L.libelle) || tailleBoite(L.nom);
  if (/^\s*(kg|kgs|kilo)/i.test(L.unite || '')) return { mode: 'kg' };
  if (n > 1) { var enPieces = q >= n && Math.abs(q / n - Math.round(q / n)) < 1e-6; return { mode: 'boite', n: n, f: enPieces ? 1 / n : 1, src: 'libelle' }; }
  if (L.puLu > 0 && L.montant > 0 && q > 0) {
    var r = q * L.puLu / L.montant, m = [100, 1000].filter(function (x) { return r > x * 0.97 && r < x * 1.03; })[0];
    if (m) return { mode: 'boite', n: m, f: 1 / m, src: 'cent' };
  }
  var nm = String(L.libelle + ' ' + (L.nom || '')).toUpperCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  if (L.prix !== null && L.prix > 0 && L.prix < 0.5 && q >= 50 && MOTS_LOT.test(nm)) {
    n = q % 100 === 0 ? 100 : q % 50 === 0 ? 50 : q % 25 === 0 ? 25 : 0;
    if (n) return { mode: 'boite', n: n, f: 1 / n, src: 'petit' };
  }
  return null;
}
function nomSansBoite(nom) { return String(nom || '').replace(RE_BOITE_NOM, '').replace(/\s+/g, ' ').trim(); }
function nomAvecBoite(nom, n) { return tailleBoite(nom) === n ? nom : nomSansBoite(nom) + ' (BOÎTE ' + n + ')'; }
/** Ligne d'un NOUVEAU produit : applique le rangement choisi (boîtes de n, pièces, kilo, rouleaux de w kg). */
function rangerComme(L, choix, n) {
  var c = L.cond || {};
  L.condChoix = choix;
  // V3.14 (Jimmy) : le nom reste celui de la facture ; la taille de la boîte va dans la fiche (Produits.boite)
  var tn = tailleBoite(L.nom);
  if (choix === 'boite') { L.facteur = c.n === n && c.f === 1 ? 1 : 1 / n; L.condN = n; L.uStock = 'boîte'; if (tn && tn !== n) L.nom = nomSansBoite(L.nom); }
  else if (choix === 'piece') { L.facteur = c.mode === 'boite' && c.f === 1 ? c.n : 1; L.condN = 0; L.uStock = ''; if (tn) L.nom = nomSansBoite(L.nom); }
  else if (choix === 'kg') { L.facteur = 1; L.condN = 0; L.uStock = 'kg'; }
  else if (choix === 'rouleau') { L.facteur = 1 / n; L.condN = n; L.uStock = 'rouleau'; }
}
/** Carte « produit compté à la pièce, la facture parle de boîtes ». */
function condAlerte(l, p, al) {
  var c = l.cond || {}, n = al.n, nb = c.f === 1 ? l.qte : l.qte / n, np = c.f === 1 ? l.qte * n : l.qte, stk = D().stock[l.pid] || 0;
  var pb = l.prix !== null ? (c.f === 1 ? l.prix : l.prix * n) : null;
  if (al.sansTaille) return '<div class="valerte vprix"><div class="vp-t">Combien de pièces dans une boîte ?</div>' +
    '<p>Ce produit est compté en boîtes, mais sa fiche ne dit pas combien il y a de pièces dans une boîte. Sur la facture : <b>' + fq(np) + ' pièces</b>' + (pb !== null ? ' à ' + fePu(l.prix) + ' la pièce' : '') + '.</p></div>' +
    '<button class="btn vp-b" data-a="vConv" data-v="oui" data-k="' + l.k + '"><b>+ ' + fq(round3(nb)) + ' boîte' + (nb > 1 ? 's' : '') + ' de ' + fq(n) + '</b><span>la fiche retiendra « boîte de ' + fq(n) + ' »</span></button>' +
    '<button class="btn light vp-b" data-a="vCond" data-v="autre" data-k="' + l.k + '"><b>Des boîtes d\'une autre taille…</b><span>ex. 1 boîte de ' + fq(np) + '</span></button>' +
    '<div class="vmini"><button data-a="vQty" data-k="' + l.k + '">Modifier la quantité…</button><button data-a="vOther" data-k="' + l.k + '">Autre produit…</button><button data-a="vToNew" data-k="' + l.k + '">C\'est un nouveau</button></div>';
  return '<div class="valerte vprix"><div class="vp-t">Ce produit est compté à la pièce</div>' +
    '<p>Sur la facture : <b>' + fq(round3(nb)) + ' boîte' + (nb > 1 ? 's' : '') + ' de ' + fq(n) + '</b> (' + fq(np) + ' pièces)' + (pb !== null ? ', soit <b>' + fePu(pb) + ' la boîte</b>' : '') + '.</p>' +
    '<p>Tu achètes ce produit en boîtes : le compter en boîtes est plus simple (stock, sorties, inventaire). Le Bilan donnera toujours aussi le nombre de pièces.</p>' +
    (stk ? '<p>Le stock actuel (' + fq(stk) + ' pièces) devient ' + fq(round3(stk / n)) + ' boîte' + (stk / n > 1 ? 's' : '') + ', sans changer sa valeur.</p>' : '') +
    '</div><div class="vp-q">Je le passe en boîtes de ' + fq(n) + ' ?</div>' +
    '<button class="btn vp-b" data-a="vConv" data-v="oui" data-k="' + l.k + '"><b>Oui : + ' + fq(round3(nb)) + ' boîte' + (nb > 1 ? 's' : '') + ' de ' + fq(n) + '</b><span>le produit sera compté en boîtes (conseillé)</span></button>' +
    '<button class="btn light vp-b" data-a="vCond" data-v="autre" data-k="' + l.k + '"><b>Oui, mais des boîtes d\'une autre taille…</b></button>' +
    '<button class="btn light vp-b" data-a="vConv" data-v="non" data-k="' + l.k + '"><b>Non : + ' + fq(np) + ' pièces</b><span>garder ce produit à la pièce (je ne redemanderai plus)</span></button>' +
    '<div class="vmini"><button data-a="vOther" data-k="' + l.k + '">Autre produit…</button><button data-a="vToNew" data-k="' + l.k + '">C\'est un nouveau</button></div>';
}
/** La ligne est rattachée (à la main) à un produit existant : on repart de la facture telle quelle, puis contrôles. */
function versExistant(l) {
  if (l.condChoix) { l.facteur = 1; l.condChoix = ''; l.uStock = ''; l.condN = 0; }
  l.convertir = 0; l.gardePiece = false;
  if (!condControle(l)) vControle(l);
}
/** Nouveau produit : la proposition la plus logique est appliquée d'office (Jimmy la voit et peut en changer avant « Créer »). */
function condNouveau(L) {
  var c = L.cond; if (!c) return;
  if (c.mode === 'boite') rangerComme(L, 'boite', c.n); else rangerComme(L, 'kg', 0);
}
/** Ligne rapprochée d'un produit EXISTANT compté à la pièce alors que la facture parle de boîtes : proposer de le passer en boîtes (patron). */
function condControle(L) {
  if (L.statut !== 'ok' || !L.pid || L.alerteOk || L.facteur !== 1 || !isPatron()) return false;
  var p = D().prod[L.pid], c = L.cond; if (!p || !c || c.mode !== 'boite' || boiteDe(p) > 1 || p.compte === 'piece') return false;
  var sansTaille = /^(bo[iî]te|paquet)/i.test(p.unite || '');      // compté en boîtes, mais la fiche ne dit pas combien de pièces dedans
  if (sansTaille && c.f === 1) return false;                         // la facture compte déjà en boîtes : rien à demander
  L.alerte = { type: 'cond', n: c.n, sansTaille: sansTaille }; L.statut = 'check'; L.cands = [L.pid]; return true;
}
A.vCond = function (d) {
  var l = vLine(d.k); if (!l) return;
  if (d.v === 'autre' || d.v === 'rouleau') {
    askNumber({ title: d.v === 'rouleau' ? 'Un rouleau pèse combien de kilos ?' : 'Combien de pièces dans une boîte ?', text: d.v === 'rouleau' ? 'Regarde l\'étiquette d\'un rouleau. L\'appli comptera ce produit en rouleaux.' : 'Regarde sur la boîte. L\'appli comptera ce produit en boîtes.', value: d.v === 'rouleau' ? undefined : (l.condN || (l.cond && l.cond.n) || 100) }).then(function (n) {
      if (!(n > 0)) return;
      vSet(d.k, function (x) { if (x.statut === 'check' && x.alerte && x.alerte.type === 'cond') { if (x.alerte.sansTaille) x.fixeBoite = n; else x.convertir = n; x.condN = n; x.facteur = x.cond && x.cond.f === 1 ? 1 : 1 / n; x.uStock = 'boîte'; x.statut = 'ok'; x.alerte = null; x.alerteOk = true; } else rangerComme(x, d.v === 'rouleau' ? 'rouleau' : 'boite', n); });
    });
    return;
  }
  vSet(d.k, function (x) { rangerComme(x, d.v, num(d.n) || (x.cond && x.cond.n) || 0); });
};
/** Produit existant : « Oui, le passer en boîtes de n » / « Non, garder à la pièce » (retenu sur le produit). */
A.vConv = function (d) {
  vSet(d.k, function (l) {
    var c = l.cond || {}, n = l.alerte && l.alerte.n || c.n;
    if (d.v === 'oui' && l.alerte && l.alerte.sansTaille) { l.fixeBoite = n; l.facteur = c.f === 1 ? 1 : 1 / n; l.uStock = 'boîte'; l.condN = n; }
    else if (d.v === 'oui') { l.convertir = n; l.facteur = c.f === 1 ? 1 : 1 / n; l.uStock = 'boîte'; l.condN = n; }
    else { l.gardePiece = true; l.facteur = c.f === 1 ? n : 1; }
    l.statut = 'ok'; l.alerte = null; l.alerteOk = true;
  });
};
/** Opérations pour passer un produit compté à la pièce en boîtes de n : nom, unité, seuil, tout l'historique (quantités ÷ n, prix × n),
    prix des fournisseurs, conversions apprises et commande. Le stock garde exactement la même valeur. */
function opsEnBoites(pid, n, sansFiche) {
  var M = D(), p = M.prod[pid], ops = []; if (!p || !(n > 1)) return ops;
  var r3 = function (x) { return String(round3(x)); };
  if (!sansFiche) { var row = { id: pid, unite: 'boîte', boite: String(n) }; if (num(p.seuil) > 0) row.seuil = r3(Math.max(1, num(p.seuil) / n)); ops.push(put('Produits', row)); }
  (M.movesBy[pid] || []).forEach(function (m) {
    var r = { id: m.id, delta: r3(num(m.delta) / n) };
    if (numOrNull(m.prix) !== null) r.prix = String(rnd5(num(m.prix) * n));
    if (numOrNull(m.pu) !== null) r.pu = String(rnd5(num(m.pu) * n));
    ops.push(put('Mouvements', r));
  });
  (M.prix[pid] || []).forEach(function (x) { if (numOrNull(x.prix) !== null) ops.push(put('Prix', { id: x.id, prix: String(rnd5(num(x.prix) * n)) })); });
  Object.keys(M.alias).forEach(function (k) { var a = M.alias[k]; if (a.produit === pid) ops.push(put('Alias', { id: a.id, facteur: String(rnd5((num(a.facteur) || 1) / n)) })); });
  if (M.cmd[pid]) ops.push(put('Commande', { id: M.cmd[pid].id, qte: r3(Math.max(1, num(M.cmd[pid].qte) / n)) }));
  return ops;
}
/** Texte « 5 boîtes de 100 » / « 500 pièces » / « 23,5 kg » pour une ligne. */
function rangeTxt(l) {
  var q = l.qte * l.facteur;
  if (l.uStock === 'boîte' || (l.statut === 'ok' && l.pid && boiteDe(D().prod[l.pid]) > 1 && l.facteur !== 1)) { var n = l.condN || l.convertir || boiteDe(D().prod[l.pid]) || Math.round(1 / l.facteur); return fq(round3(q)) + ' boîte' + (q > 1 ? 's' : '') + (n > 1 ? ' de ' + fq(n) : ''); }
  if (l.uStock === 'rouleau') return fq(round3(q)) + ' rouleau' + (q > 1 ? 'x' : '') + ' de ' + fq(l.condN) + ' kg';
  if (l.uStock === 'kg') return fq(q) + ' kg';
  return fq(q) + (l.cond && l.cond.mode === 'boite' ? ' pièce' + (q > 1 ? 's' : '') : '');
}
/** Bloc « Comment tu le ranges ? » sur la carte d'un nouveau produit. */
function condBloc(l) {
  var c = l.cond; if (!c) return '';
  var pu = function () { return l.prix !== null && isPatron() ? ' · ' + fePu(l.prix / l.facteur) + (l.uStock === 'boîte' ? ' la boîte' : l.uStock === 'rouleau' ? ' le rouleau' : l.uStock === 'kg' ? ' le kg' : ' pièce') : ''; };
  var chip = function (v, n, t, on) { return '<button class="vcond' + (on ? ' on' : '') + '" data-a="vCond" data-k="' + l.k + '" data-v="' + v + '"' + (n ? ' data-n="' + n + '"' : '') + '>' + t + '</button>'; };
  var h = '<div class="vrange"><div class="vr-t">En stock : <b>+ ' + esc(rangeTxt(l)) + '</b>' + pu() + '</div><div class="vr-chips">';
  if (c.mode === 'boite') {
    var nb = c.f === 1 ? l.qte : l.qte / c.n, np = c.f === 1 ? l.qte * c.n : l.qte;
    h += chip('boite', c.n, fq(round3(nb)) + ' boîte' + (nb > 1 ? 's' : '') + ' de ' + fq(c.n), l.condChoix === 'boite' && l.condN === c.n) +
      chip('autre', 0, l.condChoix === 'boite' && l.condN !== c.n ? 'Boîtes de ' + fq(l.condN) : 'Autre taille…', l.condChoix === 'boite' && l.condN !== c.n) +
      chip('piece', 0, fq(np) + ' à la pièce', l.condChoix === 'piece');
  } else {
    h += chip('kg', 0, 'Au kilo', l.condChoix !== 'rouleau') + chip('rouleau', 0, l.condChoix === 'rouleau' ? 'Rouleaux de ' + fq(l.condN) + ' kg' : 'En rouleaux…', l.condChoix === 'rouleau');
  }
  return h + '</div></div>';
}
/** Fournisseur(s) d'un produit : son fournisseur habituel s'il en a un (c'est lui qui compte, même si un autre prix a été noté par erreur),
    sinon ceux qui ont un prix. Liste vide = produit sans fournisseur (ex. inventaire papier) : il peut servir à tout le monde. */
function prodFours(pid) {
  var M = D(), p = M.prod[pid], f = [];
  if (p && p.four) return [p.four];
  (M.prix[pid] || []).forEach(function (x) { if (x.fournisseur && f.indexOf(x.fournisseur) < 0) f.push(x.fournisseur); });
  return f;
}
function autreFour(pid, four) { var f = prodFours(pid); return !!(four && f.length && f.indexOf(four) < 0); }
/** V3.9 (demande de Jimmy) : un article d'un AUTRE fournisseur n'est jamais rangé sur un produit existant, même s'il lui ressemble
    (vis 6X120 Prolians ≠ VIS ROCKET 6×120 Chausson) : un produit distinct par fournisseur (analyses d'achats, négociation).
    Vaut aussi pour une association apprise par erreur. Seul un choix fait à la main par Jimmy (« Autre produit ») passe outre. */
function unAutreFournisseur(L, four) {
  if (!four || L.source === 'choisi' || L.statut === 'create' || L.statut === 'skip') return;
  if (L.pid && autreFour(L.pid, four)) { L.pid = ''; L.statut = 'new'; L.source = ''; L.facteur = 1; L.alerte = null; }
  L.cands = (L.cands || []).filter(function (id) { return !autreFour(id, four); });
  if (L.statut === 'check' && !L.pid && !L.cands.length) L.statut = 'new';
}
/** Contrôle une ligne rapprochée d'un produit existant : unité qui ne colle pas, prix très différent de d'habitude. */
function vControle(L) {
  if (L.statut !== 'ok' || !L.pid || L.alerteOk) return;
  var M = D(), p = M.prod[L.pid]; if (!p) return;
  var n = boiteDe(p), nf = tailleBoite(L.libelle);
  if (n > 1 && L.facteur === 1 && nf !== n && L.qte >= n / 2) {   // le stock compte des boîtes de n, la facture des pièces
    L.alerte = { type: 'unite', n: n }; L.statut = 'check'; L.cands = [L.pid]; return;
  }
  var ref = isPatron() && L.prix !== null ? prixRef(L.pid) : null, u = L.prix !== null ? L.prix / L.facteur : null;
  if (ref && ref.prix > 0 && u > 0 && (u / ref.prix > 4 || u / ref.prix < 0.25)) { L.alerte = { type: 'prix', avant: ref.prix }; L.statut = 'check'; L.cands = [L.pid]; }
}
function totalLignes(V) {
  var t = 0, ok = true;
  V.lignes.forEach(function (l) { if (l.statut === 'skip') return; if (l.prix === null) { ok = false; return; } t += l.qte * l.prix; });
  return ok ? Math.round(t * 100) / 100 : null;
}
A.vUnite = function (d) { vSet(d.k, function (l) { var n = l.alerte ? l.alerte.n : 1; l.facteur = 1 / n; l.statut = 'ok'; l.alerte = null; l.alerteOk = true; }); };
A.vAlerteOk = function (d) { vSet(d.k, function (l) { l.statut = 'ok'; l.alerte = null; l.alerteOk = true; }); };
/** V3.12 (retour de Kevin : « prix au cent ? » incompréhensible) : la carte « prix très différent » montre les deux prix en clair,
    explique un écart de 100 ou 1000 fois (prix donné pour 100 pièces), dit si le montant de la ligne confirme le prix de la facture,
    et demande simplement « Quel est le bon prix pour 1 pièce ? » avec un bouton par prix. */
function prixAlerte(l, p, al) {
  var u = l.prix / l.facteur, av = al.avant, uw = p && p.unite ? p.unite : 'pièce';
  var cent = function (x) { return x < 0.1 ? ' <span class="vp-cent">soit ' + fe(x * 100) + ' les 100</span>' : ''; };
  var pres = function (r, n) { return r > n * 0.9 && r < n * 1.1; };
  var r = av / u, why = '';
  [100, 1000].forEach(function (n) {
    if (why) return;
    if (pres(r, n)) why = 'C\'est <b>' + n + ' fois moins</b> qu\'avant. Les fournisseurs donnent souvent le prix <b>pour ' + n + ' pièces</b> : l\'ancien prix était sans doute celui de ' + n + ' pièces, pris pour celui d\'une seule.';
    else if (pres(1 / r, n)) why = 'C\'est <b>' + n + ' fois plus</b> qu\'avant. Le prix écrit sur la facture est sans doute celui de <b>' + n + ' pièces</b>, pas d\'une seule.';
  });
  if (!why) why = 'C\'est <b>' + (u > av ? fq(Math.round(u / av * 10) / 10) + ' fois plus' : fq(Math.round(av / u * 10) / 10) + ' fois moins') + '</b> que d\'habitude.';
  var conf = l.montant > 0 && Math.abs(l.qte * l.prix - l.montant) <= Math.max(0.02, l.montant * 0.01);
  return '<div class="valerte vprix"><div class="vp-t">Le prix a beaucoup changé</div>' +
    '<div class="vp-l"><span>Sur cette facture</span><b>' + fePu(u) + '</b> pour 1 ' + esc(uw) + cent(u) + '</div>' +
    '<div class="vp-l"><span>Avant, dans l\'appli</span><b>' + fePu(av) + '</b> pour 1 ' + esc(uw) + cent(av) + '</div>' +
    '<p>' + why + '</p>' +
    (conf ? '<p class="vp-ok">' + ic('check') + 'La facture le confirme : ' + fq(l.qte) + ' × ' + fePu(l.prix) + ' = ' + fe(l.montant) + ', le montant écrit sur la ligne.</p>' : '<p>Regarde le montant de cette ligne sur la facture pour savoir lequel est juste.</p>') +
    '</div><div class="vp-q">Quel est le bon prix pour 1 ' + esc(uw) + ' ?</div>' +
    '<button class="btn vp-b" data-a="vAlerteOk" data-k="' + l.k + '"><b>' + fePu(u) + '</b><span>celui de la facture' + (conf ? ' (conseillé)' : '') + ' · la fiche sera corrigée</span></button>' +
    '<button class="btn light vp-b" data-a="vPrixAvant" data-k="' + l.k + '"><b>' + fePu(av) + '</b><span>celui d\'avant</span></button>' +
    '<div class="vmini"><button data-a="vQty" data-k="' + l.k + '">Autre prix…</button><button data-a="vOther" data-k="' + l.k + '">Autre produit…</button><button data-a="vToNew" data-k="' + l.k + '">C\'est un nouveau</button></div>';
}
A.vPrixAvant = function (d) { vSet(d.k, function (l) { if (l.alerte && l.alerte.avant) l.prix = rnd5(l.alerte.avant * l.facteur); l.statut = 'ok'; l.alerte = null; l.alerteOk = true; }); };
/** Famille quand Gemini n'en propose pas : d'après le 1er mot qui parle (VIS… → Clous & vis), sinon Divers, sinon la 1re. */
var FAM_MOTS = [['clous', /\b(VIS|POINTES?|CLOUS?|CHEVILLES?|TIREFONDS?|RIVETS?|BOULONS?|ECROUS?|AGRAFES?)\b/], ['plomb', /\bPLOMB\b/], ['ardoise', /\bARDOISES?\b/],
  ['fonte', /\bFONTE\b/], ['bois', /\b(VOLIGES?|BASTAINGS?|BASTINS?|CHEVRONS?|LITEAUX?|LITEAU|MADRIERS?|PLANCHES?)\b/], ['etancheite', /\b(MEMBRANES?|ECRAN|SILICONE|MASTIC|BITUME|ETANCH)/], ['zinc', /\b(ZINC|ZN|GOUTTIERES?|DESCENTES?|COUDES?)\b/]];
function famDevinee(nom) {
  var M = D(), n = String(nom || '').toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  for (var i = 0; i < FAM_MOTS.length; i++) if (M.fam[FAM_MOTS[i][0]] && FAM_MOTS[i][1].test(n)) return FAM_MOTS[i][0];
  return M.fam.divers ? 'divers' : (M.fams[0] ? M.fams[0].id : '');
}
function buildVerif(doc) {
  var M = D(), four = matchFour(doc);
  var ok = function (id) { return id && M.prod[id] && M.prod[id].actif !== '0' ? id : ''; };
  var lignes = (doc.lignes || []).map(function (l, i) {
    var qte = num(l.quantite) || 1, prix = numOrNull(l.prix_unitaire_ht), mt = numOrNull(l.montant_ht), corr = false;
    // V3.8 : le MONTANT de la ligne fait foi (prix « au cent » ou « au mille » : 500 vis × 1,91 €/100 = 9,55 €)
    // V3.14 : toujours le montant ÷ quantité quand le montant est lu (le prix de la boîte retombe juste : 250 × 0,0329 = 8,225 ≠ 8,23)
    if (mt !== null && mt > 0 && qte > 0) { var pm = mt / qte; if (prix === null || Math.abs(prix - pm) > Math.max(0.005, pm * 0.05)) corr = prix !== null; prix = pm; }
    if (prix !== null) prix = rnd5(prix);
    var L = { k: 'l' + i, libelle: String(l.libelle || '').trim(), ref: String(l.reference || '').trim(), qte: qte, unite: String(l.unite || '').trim(),
      prix: prix, facteur: num(l.conditionnement) > 0 ? num(l.conditionnement) : 1, pid: '', cands: [], statut: 'new',
      nom: upName(l.nom_propose || l.libelle), famille: M.fam[l.famille_proposee] ? l.famille_proposee : famDevinee(l.nom_propose || l.libelle), source: '', montant: mt, prixCorr: corr, puLu: numOrNull(l.prix_unitaire_ht) };
    var al = four && M.alias[lineKey(four, L.libelle)];
    var byRef = four && L.ref ? Object.keys(M.prix).filter(function (pid) { return ok(pid) && M.prix[pid].some(function (x) { return x.fournisseur === four && x.ref && norm(x.ref) === norm(L.ref); }); })[0] : '';
    var pid = ok(l.produit_id), others = (l.autres_ids || []).map(ok).filter(Boolean);
    if (al && ok(al.produit)) { L.pid = al.produit; L.facteur = num(al.facteur) || 1; L.statut = 'ok'; L.source = 'appris'; }
    else if (byRef) { L.pid = byRef; L.statut = 'ok'; L.source = 'réf.'; }
    else if (pid && num(l.confiance) >= 0.8) { L.pid = pid; L.statut = 'ok'; }
    else if (pid) { L.statut = 'check'; L.cands = [pid].concat(others.filter(function (x) { return x !== pid; })).slice(0, 3); }
    else { L.statut = 'new'; L.cands = others.slice(0, 2); }
    unAutreFournisseur(L, four);
    L.cond = condProposee(L);
    if (L.statut === 'new') condNouveau(L);
    else if (!condControle(L)) vControle(L);
    return L;
  });
  return { source: 'facture', four: four, fourNom: upName(doc.fournisseur || ''), fourChoix: four ? 'ok' : '', numero: String(doc.numero || '').trim(),
    date: /^\d{4}-\d\d-\d\d$/.test(doc.date || '') ? doc.date : todayIsoDate(), total: numOrNull(doc.total_ht), type: doc.type_document || 'facture',
    fichiers: doc.fichiers || [], lignes: lignes, modele: doc.modele || '', fourInfos: doc.fournisseur_infos || null };
}

/* ---------------- écran de vérification ---------------- */

function vLine(k) { return VERIF.lignes.filter(function (l) { return l.k === k; })[0]; }
function vPending() { return VERIF.lignes.filter(function (l) { return l.statut === 'check' || l.statut === 'new'; }).length + (VERIF.four ? 0 : 1); }
SCREENS.verif = function () {
  if (!VERIF) { return SCREENS.facture(); }
  var M = D(), V = VERIF;
  var nOk = V.lignes.filter(function (l) { return l.statut === 'ok' || l.statut === 'create'; }).length;
  var nCheck = V.lignes.filter(function (l) { return l.statut === 'check'; }).length, nNew = V.lignes.filter(function (l) { return l.statut === 'new'; }).length;
  var numsV = String(V.numero || '').split('+').map(function (x) { return norm(x).replace(/[^a-z0-9]/g, ''); }).filter(Boolean);
  var dup = V.four && V.numero && M.factures.filter(function (f) { return f.fournisseur === V.four && (norm(f.numero) === norm(V.numero) || String(f.numero || '').split('+').some(function (x) { return numsV.indexOf(norm(x).replace(/[^a-z0-9]/g, '')) >= 0; })); })[0];
  if (!dup && V.deja && (!V.four || V.four === V.deja.fournisseur)) dup = V.deja;   // vérifié par le script (salarié)
  var html = '<div class="screen">' + head({ cls: 'green', title: V.tot > 1 ? 'Facture ' + V.pos + '/' + V.tot : 'Vérifier la facture', backAct: 'vBack',
    sub: esc([V.four ? fourName(V.four) : V.fourNom, V.numero ? 'n° ' + V.numero : '', fday(V.date), V.total !== null ? fe(V.total) + ' HT' : ''].filter(Boolean).join(' · ')),
    extra: '<div class="vchips"><span class="vc ok">' + nOk + ' reconnue' + (nOk > 1 ? 's' : '') + '</span>' + (nCheck ? '<span class="vc check">' + nCheck + ' à vérifier</span>' : '') + (nNew ? '<span class="vc new">' + nNew + ' nouveau' + (nNew > 1 ? 'x' : '') + '</span>' : '') + '</div>' }) +
    '<div class="scroll nonav" style="padding-bottom:170px">';
  if (dup) html += '<div class="hint" style="background:var(--orange-bg);color:#7A3D00"><b>Déjà rangée ?</b> Une facture ' + esc(fourName(V.four)) + ' n° ' + esc(V.numero) + ' a été rangée le ' + fday(dup.rangee) + '. Vérifie avant de valider pour ne pas compter deux fois.</div>';
  var tl = totalLignes(V);
  if (V.total !== null && V.total > 0 && tl !== null && Math.abs(tl - V.total) > Math.max(1, V.total * 0.03)) {
    html += '<div class="hint vtotal" style="background:var(--orange-bg);color:#7A3D00"><b>Le total ne colle pas :</b> les lignes font ' + fe(tl) + ', la facture ' + fe(V.total) + ' HT. ' +
      (tl > V.total ? 'Un prix est sans doute trop haut (prix au cent ?).' : 'Il manque peut-être une ligne.') + ' Vérifie avant de valider.</div>';
  } else if (V.total !== null && V.total > 0 && tl !== null) html += '<div class="vtotal-ok">' + ic('check') + 'Total des lignes : ' + fe(tl) + ' · facture : ' + fe(V.total) + ' HT</div>';
  if (V.logo && !(V.four && M.four[V.four] && M.four[V.four].logo)) {
    html += '<div class="vlogo"><img src="' + V.logo + '" alt="Logo du fournisseur"><div class="grow"><b>Logo trouvé</b><span>Il ira sur la fiche du fournisseur (même si tu abandonnes).</span></div><button class="link" data-a="vNoLogo">Ne pas le garder</button></div>';
  }
  var nv = infosNouvelles(V);
  if (nv) {
    html += '<div class="vcard vinfos"><div class="vhead"><span class="dot ok"></span><span>Sur la facture, il y a aussi pour <b>' + esc(fourName(V.four)) + '</b> :</span></div><ul class="vinfo-list">' +
      (nv.adresse ? '<li>Adresse : <b>' + esc(nv.adresse) + '</b></li>' : '') + nv.tels.map(function (t) { return '<li>' + esc(t.l || 'Téléphone') + ' : <b>' + esc(t.n) + '</b></li>'; }).join('') +
      (nv.email ? '<li>Mail : <b>' + esc(nv.email) + '</b></li>' : '') + (nv.site ? '<li>Site : <b>' + esc(nv.site) + '</b></li>' : '') + (nv.client ? '<li>N° client : <b>' + esc(nv.client) + '</b></li>' : '') +
      '</ul><div class="btn-row"><button class="btn" style="font-size:16px;height:48px;font-family:Barlow;font-weight:700" data-a="vInfosAdd">Ajouter à sa fiche</button><button class="btn light" style="height:48px" data-a="vInfosNo">Non merci</button></div></div>';
  }
  if (!V.four) {
    html += '<div class="vcard check"><div class="vhead"><span class="dot check"></span><span>Fournisseur lu : <b>' + esc(V.fourNom || '?') + '</b></span></div>' +
      '<span class="vq check">Il n\'est pas dans ta liste de fournisseurs.' + (V.fourInfos && (V.fourInfos.adresse || (V.fourInfos.telephones || []).length) ? ' « Ajouter » crée sa fiche avec l\'adresse et les téléphones lus sur la facture.' : '') + '</span>' +
      '<div class="btn-row"><button class="btn" style="font-size:16px;height:48px;font-family:Barlow;font-weight:700" data-a="vFourNew">Ajouter</button><button class="btn light" style="height:48px" data-a="vFourPick">Choisir</button></div></div>';
  }
  var order = { check: 0, new: 1, create: 2, ok: 3, skip: 4 };
  V.lignes.slice().sort(function (a, b) { return order[a.statut] - order[b.statut]; }).forEach(function (l) {
    var src = '<span class="vsrc">Sur la facture : <b>' + esc(l.libelle) + '</b>' + (l.ref ? ' · réf. ' + esc(l.ref) : '') + ' · ' + fq(l.qte) + (l.unite ? ' ' + esc(l.unite) : '') + (l.prix !== null ? ' × ' + fePu(l.prix) : '') + '</span>';
    if (l.statut === 'check' && l.alerte) {
      var pa = M.prod[l.pid], al = l.alerte;
      html += '<div class="vcard check"><div class="vhead"><span class="dot check"></span>' + src + '</div>' +
        '<span class="vq check">' + esc(pa ? pa.nom : '?') + '</span>' +
        (al.type === 'cond' ? condAlerte(l, pa, al) : al.type === 'unite' ? '<div class="valerte">Ce produit est compté <b>par boîte de ' + al.n + '</b>, la facture compte <b>' + fq(l.qte) + ' pièces</b>.</div>' +
          '<button class="btn vp-b" data-a="vUnite" data-k="' + l.k + '"><b>+ ' + fq(round3(l.qte / al.n)) + ' boîte' + (l.qte / al.n > 1 ? 's' : '') + ' de ' + al.n + '</b><span>les ' + fq(l.qte) + ' pièces de la facture rangées en boîtes (conseillé)</span></button>' +
          '<button class="btn light vp-b" data-a="vAlerteOk" data-k="' + l.k + '"><b>+ ' + fq(l.qte) + ' boîtes</b><span>seulement si la facture compte déjà en boîtes</span></button>' +
          '<div class="vmini"><button data-a="vQty" data-k="' + l.k + '">Autre quantité…</button><button data-a="vOther" data-k="' + l.k + '">Autre produit…</button><button data-a="vToNew" data-k="' + l.k + '">C\'est un nouveau (autre taille)</button></div>'
        : prixAlerte(l, pa, al)) + '</div>';
    } else if (l.statut === 'check') {
      html += '<div class="vcard check"><div class="vhead"><span class="dot check"></span>' + src + '</div><span class="vq check">Je pense que c\'est :</span>' +
        l.cands.map(function (pid, i) { var p = M.prod[pid]; return '<button class="vcand ' + (i === 0 ? 'best' : '') + '" data-a="vPick" data-k="' + l.k + '" data-id="' + pid + '">' + esc(p.nom) + ' <span>· stock ' + fq(M.stock[pid] || 0) + '</span></button>'; }).join('') +
        '<div class="vmini"><button data-a="vOther" data-k="' + l.k + '">Autre produit…</button><button data-a="vToNew" data-k="' + l.k + '">C\'est un nouveau</button><button data-a="vSkip" data-k="' + l.k + '">Ignorer</button></div></div>';
    } else if (l.statut === 'new') {
      html += '<div class="vcard new"><div class="vhead"><span class="dot new"></span>' + src + '</div><span class="vq new">Nouveau produit : je le crée ?</span>' +
        '<button class="vnew" data-a="vName" data-k="' + l.k + '"><b>' + esc(l.nom) + '</b><span>' + esc(famName(l.famille) + ' · ' + (V.four ? fourName(V.four) : V.fourNom) + (l.prix !== null && !l.cond ? ' · ' + fePu(l.prix / l.facteur) + ' HT' : '') + (l.cond ? '' : ' · + ' + fq(l.qte * l.facteur))) + ' · <u>modifier</u></span></button>' + condBloc(l) +
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
        '<span class="s">' + (l.source === 'appris' ? 'reconnu (déjà vu) · ' : l.source === 'réf.' ? 'reconnu par la réf. · ' : '') + 'Facture : ' + esc(l.libelle) + (l.facteur !== 1 ? ' · ' + fq(l.qte) + (l.unite ? ' ' + esc(l.unite) : '') + ' → ' + esc(rangeTxt(l)) : '') +
        (l.convertir > 1 ? ' · <b>passe en boîtes de ' + fq(l.convertir) + '</b>' : '') +
        (l.statut === 'create' ? '' : ' · stock ' + fq(round3(l.convertir > 1 ? q / l.convertir : q)) + ' → ' + fq(round3((l.convertir > 1 ? q / l.convertir : q) + l.qte * l.facteur))) + '</span></span>' +
        '<span class="vqty"><b>+' + fq(round3(l.qte * l.facteur)) + '</b>' + (l.uStock === 'boîte' || l.convertir > 1 ? '<span>boîte' + (l.qte * l.facteur > 1 ? 's' : '') + '</span>' : l.uStock ? '<span>' + esc(l.uStock) + '</span>' : '') + (l.prix !== null ? '<span>' + fePu(l.prix / l.facteur) + '</span>' : '') + '</span></button>';
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
A.vPick = function (d) { vSet(d.k, function (l) { l.pid = d.id; l.statut = 'ok'; l.source = ''; l.alerte = null; l.alerteOk = false; versExistant(l); }); };
A.vSkip = function (d) { vSet(d.k, function (l) { l.prev = l.statut; l.statut = 'skip'; }); };
A.vUnskip = function (d) { vSet(d.k, function (l) { l.statut = l.pid ? 'ok' : (l.prev === 'create' ? 'create' : 'new'); }); };
A.vToNew = function (d) { vSet(d.k, function (l) { l.statut = 'new'; l.pid = ''; l.alerte = null; l.convertir = 0; l.gardePiece = false; l.facteur = 1; condNouveau(l); }); };
A.vCreate = function (d) { vSet(d.k, function (l) { l.statut = 'create'; l.pid = ''; }); };
A.vOther = function (d) { openPicker('Quel produit ?', vLine(d.k).libelle, function (pid) { vSet(d.k, function (l) { l.pid = pid; l.statut = 'ok'; l.source = 'choisi'; l.alerte = null; l.alerteOk = false; versExistant(l); }); }); };
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
/** V3.14 (retour de Jimmy : « plus on corrigeait, plus le nombre de boîtes augmentait ») : plus de coefficient à taper.
    On dit simplement ce qui ENTRE EN STOCK, dans l'unité du stock (boîtes, pièces…), et le prix pour 1 de cette unité ; l'appli calcule le reste. */
function uStockLigne(l) {
  var p = l.pid ? D().prod[l.pid] : null;
  if (l.uStock === 'boîte' || l.convertir > 1 || l.fixeBoite > 1 || (p && boiteDe(p) > 1 && l.facteur !== 1) || (p && /^bo[iî]te/i.test(p.unite || ''))) return 'boîte';
  if (l.uStock) return l.uStock;
  return (p && p.unite) || 'pièce';
}
A.vQty = function (d) {
  var l = vLine(d.k), u = uStockLigne(l), q = round3(l.qte * l.facteur), pu = l.prix !== null ? rnd5(l.prix / l.facteur) : null;
  var pl = function (x) { return /^(bo[iî]te|pièce|rouleau)$/.test(x) ? x + 's' : x; };
  closeSheet(function () {
    openSheet('<h3>Ce qui entre en stock</h3><p>Sur la facture : <b>' + esc(l.libelle) + '</b> · ' + fq(l.qte) + (l.unite ? ' ' + esc(l.unite) : '') + (l.montant ? ' · ligne ' + fe(l.montant) + ' HT' : '') + '</p>' +
      '<div class="field"><label for="vq">Combien de <b>' + esc(pl(u)) + '</b> entrent en stock ?</label><input id="vq" class="inp" inputmode="decimal" value="' + fq(q).replace('−', '-') + '">' +
      (u === 'boîte' ? '<span class="help">Ex. une seule boîte de ' + fq(l.qte) + ' pièces : tape 1.</span>' : '') + '</div>' +
      (isPatron() ? '<div class="field"><label for="vp">Prix HT pour 1 ' + esc(u) + '</label><input id="vp" class="inp" inputmode="decimal" value="' + (pu !== null ? String(pu).replace('.', ',') : '') + '">' +
        '<span class="help" id="vqcalc">' + (l.montant ? 'Montant de la ligne sur la facture : ' + fe(l.montant) + '.' : '') + '</span></div>' : '') +
      '<button class="btn" data-a="vQtyOk" data-k="' + l.k + '">OK</button>');
  });
};
A.vQtyOk = function (d) {
  var q = numOrNull(document.getElementById('vq').value), vp = document.getElementById('vp');
  var pr = vp && vp.value !== vp.defaultValue ? numOrNull(vp.value) : null;      // prix non retouché : le prix de la facture reste (le prix de la boîte suit la quantité)
  closeSheet(function () { vSet(d.k, function (l) {
    if (q !== null && q > 0) {
      l.facteur = rnd5(q / l.qte) || l.facteur;                       // stock = quantité facturée × facteur
      if (l.uStock === 'boîte' && l.facteur > 0) l.condN = round3(1 / l.facteur);
    }
    if (pr !== null && pr >= 0) l.prix = rnd5(pr * l.facteur);       // prix pour 1 unité du stock → prix pour 1 unité facturée
    if (l.alerte) { l.statut = 'ok'; l.alerte = null; l.alerteOk = true; }   // corrigé à la main : on lui fait confiance
  }); });
};
/** Nouveau fournisseur : sa fiche est pré-remplie avec ce que Gemini a lu sur la facture (V3.1). */
A.vFourNew = function () {
  var V = VERIF, I0 = V.fourInfos || {}, nom = V.fourNom ? V.fourNom.charAt(0) + V.fourNom.slice(1).toLowerCase() : '';
  var tels = (I0.telephones || []).filter(function (t) { return t && t.numero; }).map(function (t) { return { l: t.libelle || '', n: t.numero }; });
  go('fourEdit', { f: { isNew: true, fromVerif: true, nom: nom, contact: '', telsL: tels.length ? tels : [{ l: 'Agence', n: '' }], email: I0.email || '', site: I0.site || '',
    adresse: I0.adresse || '', notes: I0.numero_client ? 'N° client : ' + I0.numero_client : '' } });
};
/** Fournisseur déjà connu : ce que la facture apporte de plus que sa fiche. */
function infosNouvelles(V) {
  var f = V.four && D().four[V.four], I0 = V.fourInfos; if (!f || !I0 || V.infosOff) return null;
  var r = {}, n = 0, deja = fourTels(f).map(function (t) { return telDigits(t.n); });
  if (I0.adresse && !f.adresse) { r.adresse = I0.adresse; n++; }
  if (I0.email && !f.email) { r.email = I0.email; n++; }
  if (I0.site && !f.site) { r.site = I0.site; n++; }
  r.tels = (I0.telephones || []).filter(function (t) { var d = telDigits(t && t.numero); return d.length >= 9 && deja.indexOf(d) < 0; }).map(function (t) { return { l: t.libelle || '', n: t.numero }; });
  n += r.tels.length;
  if (I0.numero_client && String(f.notes || '').indexOf(I0.numero_client) < 0) { r.client = I0.numero_client; n++; }
  return n ? r : null;
}
A.vInfosAdd = function () {
  var V = VERIF, f = D().four[V.four], r = infosNouvelles(V); if (!f || !r) return;
  var row = { id: f.id }, tels = fourTels(f).concat(r.tels);
  if (r.adresse) row.adresse = r.adresse; if (r.email) row.email = r.email; if (r.site) row.site = r.site;
  if (r.tels.length) { row.tels = telsText(tels); row.tel = tels[0].n; }
  if (r.client) row.notes = (f.notes ? f.notes + '\n' : '') + 'N° client : ' + r.client;
  commit(put('Fournisseurs', row));
  V.infosOff = true; saveVerif(); toast('Fiche de ' + f.nom + ' complétée', 'Fournisseurs › ' + f.nom); render(false);
};
A.vInfosNo = function () { VERIF.infosOff = true; saveVerif(); render(false); };
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
    unAutreFournisseur(l, VERIF.four);
    if (l.statut === 'new' && !l.condChoix) condNouveau(l);
    if (l.statut === 'ok' && l.source === 'appris' && !condControle(l)) vControle(l);
  });
}
A.vCancel = function () {
  ask({ title: 'Abandonner cette facture ?', text: 'Rien ne sera ajouté au stock. Le fichier reste rangé dans Google Drive.', ok: 'Abandonner', danger: true }).then(function (ok) {
    if (!ok) return;
    // le logo trouvé reste utile même si la facture n'est pas rangée
    var M = D(); if (VERIF.logo && VERIF.four && M.four[VERIF.four] && !M.four[VERIF.four].logo) commit(put('Fournisseurs', { id: VERIF.four, logo: VERIF.logo }));
    if (!nextVerif('Facture abandonnée')) go('facture', {}, { replace: true });
  });
};
function hashKey(s) { var h = 0; for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return (h >>> 0).toString(36); }
A.vValidate = function () {
  var V = VERIF, M = D(); if (!V || vPending()) return;
  var now = nowIso(), fid = uid('fa'), ops = [], n = 0, four = V.four;
  var lab = (V.type === 'commande' ? 'Commande' : V.type === 'livraison' ? 'Livraison' : 'Facture') + (V.numero ? ' n° ' + V.numero : '');
  V.lignes.forEach(function (l) {
    if (l.statut !== 'ok' && l.statut !== 'create') return;
    var pid = l.pid, unitPrice = l.prix !== null ? rnd5(l.prix / l.facteur) : null;
    if (l.convertir > 1) ops = ops.concat(opsEnBoites(pid, l.convertir));          // V3.13 : produit passé en boîtes
    if (l.gardePiece) ops.push(put('Produits', { id: pid, compte: 'piece' }));
    if (l.fixeBoite > 1) ops.push(put('Produits', { id: pid, boite: String(l.fixeBoite) }));   // V3.14 : la fiche retient la taille de la boîte       // ne plus le proposer pour ce produit
    if (l.statut === 'create') {
      pid = uid('p');
      ops.push(put('Produits', { id: pid, nom: upName(l.nom), famille: l.famille, sfam: sfamDevinee(l.nom, l.famille), unite: l.uStock || '', boite: (l.uStock === 'boîte' || l.uStock === 'rouleau') && l.condN ? String(l.condN) : '', seuil: '0', four: four, ref: '', notes: '', actif: '1', cree: now }));
    } else if (M.prod[pid] && !M.prod[pid].four) ops.push(put('Produits', { id: pid, four: four }));
    ops.push(put('Mouvements', { id: uid('m'), date: now, produit: pid, delta: String(round3(l.qte * l.facteur)), type: 'entree', qui: ME, lieu: lab, fournisseur: four, prix: unitPrice === null ? '' : String(unitPrice), note: fid }));
    var ex = (M.prix[pid] || []).filter(function (x) { return x.fournisseur === four; })[0];
    // seulement ce qui est connu : un salarié ne voit pas les prix existants, le script retrouve la bonne ligne (V1.20)
    var pr = { id: ex ? ex.id : uid('x'), produit: pid, fournisseur: four };
    if (unitPrice !== null) { pr.prix = String(unitPrice); pr.maj = now; }
    if (l.ref) pr.ref = l.ref;
    if (ex || unitPrice !== null || l.ref) ops.push(put('Prix', pr));
    var key = lineKey(four, l.libelle);
    ops.push(put('Alias', { id: 'a' + hashKey(key), fournisseur: four, libelle: key.split('|')[1], produit: pid, facteur: String(l.facteur), maj: now }));
    n++;
  });
  if (V.logo && four && !(M.four[four] && M.four[four].logo)) ops.push(put('Fournisseurs', { id: four, logo: V.logo }));
  ops.push(put('Factures', { id: fid, date: V.date, fournisseur: four, numero: V.numero, total: V.total === null ? '' : String(V.total), lignes: String(n), fichiers: (V.fichiers || []).join(' '), qui: ME, rangee: now }));
  commit(ops);
  if (nextVerif('Facture rangée')) return;
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
        (m.prix ? '<span class="s" style="white-space:nowrap">' + fePu(num(m.prix)) + '/u</span>' : '') + '</button>';
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

/* V3.14 : une seule fois (patron) — la taille de la boîte passe du nom à la fiche (Produits.boite).
   Produits rangés en boîtes par la 3.13 (« … (BOÎTE 500) », unité boîte) : le nom redevient celui de la facture.
   Anciens produits de l'inventaire papier (« VIS ROCKET 6×120/70 (BOÎTE 100) ») : le nom ne change pas, la fiche retient 100. */
function boitesVersFiche() {
  if (typeof LOADED === 'undefined' || !LOADED || !isPatron() || D().reg.boites2 === '1') return;
  var ops = [];
  D().allProds.forEach(function (p) {
    if (num(p.boite) > 0) return;
    var mr = /\(ROULEAU\s*(\d+(?:[.,]\d+)?)\s*KG\)/i.exec(p.nom || '');
    if (mr && p.unite === 'rouleau') { ops.push(put('Produits', { id: p.id, boite: String(num(mr[1].replace(',', '.'))), nom: String(p.nom).replace(mr[0], '').replace(/\s+/g, ' ').trim() })); return; }
    var mb = /\b(?:BO[IÎ]TES?|BTE|PAQUETS?|PACK)\.?\s*(?:DE\s*)?(\d{2,5})\b/i.exec(p.nom || ''); if (!mb) return;
    var n = +mb[1];
    var ajoute = / \(BOÎTE \d+\)$/.test(p.nom);   // ajouté par la 3.13 (« … (BOÎTE 500) » en fin de nom) : on le retire ; sinon c'était sur la facture, on garde
    if (p.unite === 'boîte') ops.push(put('Produits', ajoute ? { id: p.id, boite: String(n), nom: String(p.nom).replace(/ \(BOÎTE \d+\)$/, '') } : { id: p.id, boite: String(n) }));
    else if (!p.unite) ops.push(put('Produits', { id: p.id, boite: String(n), unite: 'boîte' }));
  });
  ops.push(put('Reglages', { id: 'boites2', valeur: '1' }));
  commit(ops);
}
(function () { var prev = window.onDataChange; window.onDataChange = function (x) { if (prev) prev(x); setTimeout(boitesVersFiche, 0); }; })();
