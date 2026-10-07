/* Stock Da Costa — PDF « état du stock » pour le comptable (jsPDF + autotable, en local) */
'use strict';

var PDF_LOGO = null;
function preloadPdfLogo() {
  if (PDF_LOGO) return;
  var img = new Image();
  img.onload = function () {
    try {
      var c = document.createElement('canvas'); c.width = img.naturalWidth; c.height = img.naturalHeight;
      c.getContext('2d').drawImage(img, 0, 0);
      PDF_LOGO = { data: c.toDataURL('image/png'), w: img.naturalWidth, h: img.naturalHeight };
    } catch (e) {}
  };
  img.src = 'icons/logo-blanc.png';
}

function pdfTxt(s) {
  return String(s == null ? '' : s).replace(/[−–—]/g, '-').replace(/[’‘]/g, "'").replace(/[“”«»]/g, '"').replace(/ | /g, ' ').replace(/…/g, '...');
}
function pdfEuro(n) { return pdfTxt(fe(n)); }

/** Construit le PDF. opt = { date: 'AAAA-MM-JJ', prix: bool, zeros: bool } */
function buildPdf(opt) {
  var M = D();
  var jsPDF = window.jspdf && window.jspdf.jsPDF;
  if (!jsPDF) throw new Error('Bibliothèque PDF absente');
  var doc = new jsPDF({ unit: 'mm', format: 'a4' });
  var end = opt.date + 'T23:59:59';
  var dateTxt = fday(opt.date);
  var entreprise = M.reg.entreprise || 'EURL Da Costa';
  var NAVY = [46, 44, 110], SOFT = [236, 237, 247];

  // lignes : produits actifs + produits supprimés qui avaient encore du stock à cette date
  var rows = [];
  M.allProds.forEach(function (p) {
    var q = stockAt(p.id, end);
    if (p.actif === '0' && q === 0) return;
    if (p.cree && p.cree.slice(0, 10) > opt.date && q === 0) return;
    if (!opt.zeros && q <= 0) return;
    var pr = prixRef(p.id);
    rows.push({ p: p, q: q, prix: pr ? pr.prix : null, four: p.four ? fourName(p.four) : (pr ? fourName(pr.four) : '') });
  });
  var famIdx = function (id) { return M.famOrder[id] === undefined ? 999 : M.famOrder[id]; };
  rows.sort(function (a, b) { return famIdx(a.p.famille) - famIdx(b.p.famille) || cmp(a.p.nom, b.p.nom); });

  var total = 0, sansPrix = 0, groups = [], cur = null;
  rows.forEach(function (r) {
    var f = r.p.famille || '';
    if (!cur || cur.id !== f) { cur = { id: f, nom: famName(f) || 'Sans famille', rows: [], total: 0, sansPrix: 0 }; groups.push(cur); }
    cur.rows.push(r);
    if (r.q > 0) { if (r.prix !== null) { cur.total += r.prix * r.q; total += r.prix * r.q; } else { cur.sansPrix++; sansPrix++; } }
  });

  // en-tête
  doc.setFillColor(NAVY[0], NAVY[1], NAVY[2]); doc.rect(0, 0, 210, 36, 'F');
  if (PDF_LOGO) { var lw = 38, lh = lw * PDF_LOGO.h / PDF_LOGO.w; doc.addImage(PDF_LOGO.data, 'PNG', 12, (36 - lh) / 2, lw, lh); }
  doc.setTextColor(201, 200, 234); doc.setFont('helvetica', 'bold'); doc.setFontSize(8);
  doc.text('INVENTAIRE DES STOCKS', 58, 12);
  doc.setTextColor(255, 255, 255); doc.setFontSize(19);
  doc.text(pdfTxt('État du stock au ' + dateTxt), 58, 21);
  doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5); doc.setTextColor(201, 200, 234);
  doc.text(pdfTxt(entreprise + ' · Couverture zinguerie'), 58, 28);

  // résumé
  doc.setTextColor(23, 22, 46);
  var boxes = [['RÉFÉRENCES', String(rows.length)], ['FAMILLES', String(groups.length)]];
  if (opt.prix) boxes.push(['VALEUR TOTALE HT', total ? pdfEuro(total) : '-']);
  var bw = (186 - (boxes.length - 1) * 4) / boxes.length;
  boxes.forEach(function (b, i) {
    var x = 12 + i * (bw + 4);
    doc.setDrawColor(226, 228, 235); doc.setLineWidth(0.3); doc.roundedRect(x, 42, bw, 15, 2, 2, 'S');
    doc.setFont('helvetica', 'bold'); doc.setFontSize(7); doc.setTextColor(94, 97, 120); doc.text(pdfTxt(b[0]), x + 4, 47.5);
    doc.setFontSize(13); doc.setTextColor(i === 2 ? NAVY[0] : 23, i === 2 ? NAVY[1] : 22, i === 2 ? NAVY[2] : 46); doc.text(pdfTxt(b[1]), x + 4, 54);
  });

  var head = ['Désignation', 'Fournisseur', 'Unité', 'Qté'];
  if (opt.prix) head.push('PU HT', 'Valeur HT');
  var body = [];
  groups.forEach(function (g) {
    var lab = g.nom.toUpperCase() + '  (' + g.rows.length + ')';
    var row = [{ content: pdfTxt(lab), colSpan: opt.prix ? 5 : 4, styles: { fillColor: SOFT, textColor: NAVY, fontStyle: 'bold' } }];
    if (opt.prix) row.push({ content: g.total ? pdfEuro(g.total) : '', styles: { fillColor: SOFT, textColor: NAVY, fontStyle: 'bold', halign: 'right' } });
    body.push(row);
    g.rows.forEach(function (r) {
      var line = [pdfTxt(r.p.nom + (r.p.actif === '0' ? ' (supprimé)' : '')), pdfTxt(r.four), pdfTxt(r.p.unite || ''), pdfTxt(fq(r.q))];
      if (opt.prix) line.push(r.prix === null ? '-' : pdfEuro(r.prix), r.prix === null || r.q <= 0 ? '-' : pdfEuro(r.prix * r.q));
      body.push(line);
    });
  });
  if (!body.length) body.push([{ content: 'Aucun produit en stock à cette date', colSpan: head.length, styles: { halign: 'center', textColor: [94, 97, 120] } }]);

  var colStyles = { 0: { cellWidth: 'auto' }, 1: { cellWidth: 26 }, 2: { cellWidth: 15 }, 3: { cellWidth: 14, halign: 'right', fontStyle: 'bold' } };
  if (opt.prix) { colStyles[4] = { cellWidth: 20, halign: 'right' }; colStyles[5] = { cellWidth: 24, halign: 'right' }; }
  doc.autoTable({
    startY: 62, head: [head.map(pdfTxt)], body: body, margin: { left: 12, right: 12, bottom: 16 },
    styles: { font: 'helvetica', fontSize: 8.3, cellPadding: { top: 1.4, bottom: 1.4, left: 1.8, right: 1.8 }, textColor: [23, 22, 46], lineColor: [238, 240, 244], lineWidth: { bottom: 0.2 } },
    headStyles: { fillColor: NAVY, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
    columnStyles: colStyles,
    didParseCell: function (d) {
      if (d.section === 'head' && d.column.index >= 3) d.cell.styles.halign = 'right';
      if (d.section === 'body' && d.column.index === 3 && typeof d.cell.raw === 'string' && /^-|^0$/.test(d.cell.raw)) d.cell.styles.textColor = [168, 41, 31];
    }
  });

  var y = doc.lastAutoTable.finalY + 6;
  if (opt.prix) {
    if (y > 270) { doc.addPage(); y = 20; }
    doc.setFillColor(NAVY[0], NAVY[1], NAVY[2]); doc.roundedRect(118, y, 80, 12, 2, 2, 'F');
    doc.setTextColor(255, 255, 255); doc.setFont('helvetica', 'bold'); doc.setFontSize(10);
    doc.text('TOTAL HT', 122, y + 7.8); doc.text(pdfEuro(total), 194, y + 7.8, { align: 'right' });
    if (sansPrix) {
      doc.setTextColor(94, 97, 120); doc.setFont('helvetica', 'normal'); doc.setFontSize(8);
      doc.text(pdfTxt(sansPrix + ' produit' + (sansPrix > 1 ? 's' : '') + ' en stock sans prix renseigné (non compté' + (sansPrix > 1 ? 's' : '') + ' dans le total).'), 12, y + 7.8);
    }
  }

  var n = doc.getNumberOfPages(), gen = 'Document établi le ' + fday(nowIso()) + " par l'appli de stock " + entreprise;
  for (var i = 1; i <= n; i++) {
    doc.setPage(i); doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5); doc.setTextColor(94, 97, 120);
    doc.text(pdfTxt(gen), 12, 290); doc.text('Page ' + i + ' / ' + n, 198, 290, { align: 'right' });
  }
  return doc;
}

function makePdf(opt, how) {
  var doc;
  try { doc = buildPdf(opt); }
  catch (e) { toast('PDF impossible', e.message); return; }
  var name = 'Stock_' + (D().reg.entreprise || 'DaCosta').replace(/^EURL\s+/i, '').replace(/[^A-Za-z0-9]+/g, '') + '_' + opt.date + '.pdf';
  var blob = doc.output('blob');
  var file = null;
  try { file = new File([blob], name, { type: 'application/pdf' }); } catch (e) {}
  if (how === 'share' && file && navigator.canShare && navigator.canShare({ files: [file] })) {
    var mail = D().reg.emailComptable;
    navigator.share({ files: [file], title: name, text: 'État du stock au ' + fday(opt.date) + (mail ? '' : '') }).catch(function (e) {
      if (e && e.name !== 'AbortError') downloadBlob(blob, name);
    });
    return;
  }
  downloadBlob(blob, name);
  if (how === 'share') toast('PDF téléchargé', 'Le partage direct n\'est pas possible ici : envoie le fichier depuis tes téléchargements');
}
function downloadBlob(blob, name) {
  var url = URL.createObjectURL(blob);
  var a = document.createElement('a'); a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(function () { URL.revokeObjectURL(url); }, 60000);
}
