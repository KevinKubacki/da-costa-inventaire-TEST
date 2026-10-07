/* Stock Da Costa — la voix (V1.9)
 * Jimmy appuie sur le micro, parle, rappuie : Gemini comprend (audio → lignes),
 * l'appli montre ce qu'elle a compris et le DIT avec une vraie voix (synthèse Gemini, pas la voix robot du téléphone).
 * Rien ne bouge dans le stock avant « Valider ».
 */
'use strict';

var VX = { st: 'idle', mode: 'mvt', err: '', said: '', append: false };   // écran d'écoute
var VOX = LS.get('voxverif', null);                                        // vérification en cours (survit à une fermeture)
function saveVox() { if (VOX) LS.set('voxverif', VOX); else LS.del('voxverif'); }

/* ================= lecture audio (voix de l'appli) ================= */

var AUD = { ctx: null, src: null, an: null, raf: 0, cache: {}, playing: false };
/** Contexte audio unique, « débloqué » pendant un appui de Jimmy (règle des navigateurs). */
function audioCtx() {
  if (!AUD.ctx) { var C = window.AudioContext || window.webkitAudioContext; if (!C) return null; AUD.ctx = new C(); }
  if (AUD.ctx.state === 'suspended') AUD.ctx.resume();
  return AUD.ctx;
}
function b64Bytes(b64) { var bin = atob(b64), u = new Uint8Array(bin.length); for (var i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i); return u; }
function bytesB64(u) { var s = '', k = 0x8000; for (var i = 0; i < u.length; i += k) s += String.fromCharCode.apply(null, u.subarray(i, i + k)); return btoa(s); }
function wavHeader(dataLen, rate) {
  var h = new DataView(new ArrayBuffer(44)), w = function (o, t) { for (var i = 0; i < t.length; i++) h.setUint8(o + i, t.charCodeAt(i)); };
  w(0, 'RIFF'); h.setUint32(4, 36 + dataLen, true); w(8, 'WAVE'); w(12, 'fmt '); h.setUint32(16, 16, true); h.setUint16(20, 1, true); h.setUint16(22, 1, true);
  h.setUint32(24, rate, true); h.setUint32(28, rate * 2, true); h.setUint16(32, 2, true); h.setUint16(34, 16, true); w(36, 'data'); h.setUint32(40, dataLen, true);
  return new Uint8Array(h.buffer);
}
/** Réponse de Gemini → fichier WAV (WAV tel quel, ou PCM 16 bits brut auquel on ajoute l'en-tête). */
function toWav(r) {
  var u = b64Bytes(r.data);
  if (/wav/i.test(r.mime) || (u[0] === 82 && u[1] === 73 && u[2] === 70 && u[3] === 70)) return u;
  var m = /rate=(\d+)/.exec(r.mime || ''), rate = m ? +m[1] : 24000, out = new Uint8Array(44 + u.length);
  out.set(wavHeader(u.length, rate), 0); out.set(u, 44);
  return out;
}
function voiceName() { return (D().reg.voix || '').trim(); }
/** Demande la voix au script (mise en cache : une même phrase n'est demandée qu'une fois). */
function fetchVoice(text) {
  var key = voiceName() + '|' + text;
  if (!AUD.cache[key]) {
    AUD.cache[key] = call('parler', [CFG.code, { texte: text, voix: voiceName() }], 60000).then(function (r) {
      var ctx = audioCtx(); if (!ctx) throw new Error('Son indisponible');
      var wav = toWav(r);
      return new Promise(function (res, rej) { ctx.decodeAudioData(wav.buffer.slice(0), res, rej); });
    });
    AUD.cache[key].catch(function () { delete AUD.cache[key]; });
  }
  return AUD.cache[key];
}
function stopSpeak() {
  if (AUD.src) { try { AUD.src.onended = null; AUD.src.stop(); } catch (e) {} AUD.src = null; }
  cancelAnimationFrame(AUD.raf); AUD.playing = false; waveIdle();
}
/** Dit la phrase avec la voix Gemini ; les barres d'onde suivent le son en direct. */
function speak(text) {
  if (!text) return Promise.resolve(false);
  stopSpeak();
  setSpeakState('load');
  return fetchVoice(text).then(function (buf) {
    var ctx = audioCtx(); stopSpeak();
    var src = ctx.createBufferSource(), an = ctx.createAnalyser(); an.fftSize = 256;
    src.buffer = buf; src.connect(an); an.connect(ctx.destination);
    AUD.src = src; AUD.an = an; AUD.playing = true; setSpeakState('play');
    var data = new Uint8Array(an.frequencyBinCount);
    (function loop() {
      if (!AUD.playing) return;
      an.getByteFrequencyData(data);
      var bars = document.querySelectorAll('.wave i');
      for (var i = 0; i < bars.length; i++) { var v = data[2 + i * 3] / 255; bars[i].style.transform = 'scaleY(' + (0.18 + v * 1.1).toFixed(2) + ')'; }
      AUD.raf = requestAnimationFrame(loop);
    })();
    return new Promise(function (res) { src.onended = function () { AUD.playing = false; AUD.src = null; cancelAnimationFrame(AUD.raf); waveIdle(); setSpeakState(''); res(true); }; src.start(); });
  }).catch(function (e) { setSpeakState('err'); return false; });
}
function waveIdle() { var bars = document.querySelectorAll('.wave i'); for (var i = 0; i < bars.length; i++) bars[i].style.transform = ''; }
function setSpeakState(s) { var el = document.getElementById('vxSay'); if (el) el.setAttribute('data-s', s); }

/* ================= enregistrement du micro (avec le halo) ================= */

var REC = null;
function recStart() {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) return Promise.reject(new Error('Micro indisponible sur ce téléphone.'));
  return navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true, channelCount: 1 } }).then(function (stream) {
    var C = window.AudioContext || window.webkitAudioContext, ctx = new C();
    var src = ctx.createMediaStreamSource(stream), an = ctx.createAnalyser(); an.fftSize = 1024;
    var proc = ctx.createScriptProcessor(4096, 1, 1), chunks = [];
    proc.onaudioprocess = function (e) { if (REC && !REC.done) chunks.push(new Float32Array(e.inputBuffer.getChannelData(0))); };
    src.connect(an); src.connect(proc); proc.connect(ctx.destination);
    REC = { stream: stream, ctx: ctx, an: an, proc: proc, chunks: chunks, rate: ctx.sampleRate, t0: Date.now(), lv: 0, raf: 0, done: false };
    haloLoop();
    return REC;
  });
}
/** Le halo autour du micro grossit avec la voix de Jimmy. */
function haloLoop() {
  if (!REC || REC.done) return;
  var buf = new Uint8Array(REC.an.fftSize); REC.an.getByteTimeDomainData(buf);
  var sum = 0; for (var i = 0; i < buf.length; i++) { var x = (buf[i] - 128) / 128; sum += x * x; }
  var rms = Math.sqrt(sum / buf.length), target = Math.min(1, rms * 5.5);
  REC.lv = target > REC.lv ? REC.lv * 0.4 + target * 0.6 : REC.lv * 0.88 + target * 0.12;
  var mic = document.getElementById('vxMic');
  if (mic) mic.style.setProperty('--lv', REC.lv.toFixed(3));
  var t = document.getElementById('vxTime');
  if (t) { var s = Math.floor((Date.now() - REC.t0) / 1000); t.textContent = Math.floor(s / 60) + ':' + (s % 60 < 10 ? '0' : '') + (s % 60); }
  if (Date.now() - REC.t0 > 90000) { A.vxToggle(); return; }            // 1 min 30 au maximum
  REC.raf = requestAnimationFrame(haloLoop);
}
/** Arrête le micro → WAV 16 kHz mono (léger, parfaitement compris par Gemini). */
function recStop() {
  var R = REC; if (!R) return null;
  R.done = true; cancelAnimationFrame(R.raf);
  try { R.stream.getTracks().forEach(function (t) { t.stop(); }); } catch (e) {}
  try { R.proc.disconnect(); R.ctx.close(); } catch (e) {}
  REC = null;
  var n = 0; R.chunks.forEach(function (c) { n += c.length; });
  if (!n) return { sec: 0 };
  var all = new Float32Array(n), o = 0; R.chunks.forEach(function (c) { all.set(c, o); o += c.length; });
  var ratio = R.rate / 16000, len = Math.floor(n / ratio), pcm = new Uint8Array(len * 2), dv = new DataView(pcm.buffer);
  for (var i = 0; i < len; i++) {
    var a = Math.floor(i * ratio), b = Math.min(n, Math.floor((i + 1) * ratio)), s = 0;
    for (var j = a; j < b; j++) s += all[j];
    var v = Math.max(-1, Math.min(1, s / Math.max(1, b - a)));
    dv.setInt16(i * 2, v < 0 ? v * 0x8000 : v * 0x7FFF, true);
  }
  var wav = new Uint8Array(44 + pcm.length); wav.set(wavHeader(pcm.length, 16000), 0); wav.set(pcm, 44);
  return { sec: n / R.rate, data: bytesB64(wav) };
}
function recCancel() { if (REC) { recStop(); } }

/* ================= écran « Parle à l'appli » ================= */

var VX_EX = {
  mvt: ['Ajoute 10 coudes de 80 et 2 rouleaux de plomb de 30, livraison Réseau Pro', 'Sors 4 bandes de rive pour le chantier Martin'],
  inv: ['Volige de 14 : 80', 'Contre-latte, il y en a 86', 'Chevrons de 4 mètres : 2']
};
function canCount() { return isPatron() || !!D().invEnCours; }
SCREENS.voix = function (p) {
  if (p && p.mode) VX.mode = p.mode;
  if (VX.mode === 'inv' && !canCount()) VX.mode = 'mvt';
  var st = VX.st, rec = st === 'rec', think = st === 'think';
  var title = rec ? 'Je t\'écoute… <span id="vxTime">0:00</span>' : think ? 'Je réfléchis…' : st === 'err' ? 'Oups' : (VX.append ? 'Qu\'est-ce que tu ajoutes ?' : 'Appuie une fois pour parler');
  var sub = rec ? 'Parle normalement. Appuie sur le carré pour arrêter.' : think ? 'Je cherche les produits dans ton stock' : st === 'err' ? esc(VX.err) : 'Pose ton téléphone, parle normalement, puis appuie encore pour arrêter.';
  var html = '<div class="screen vx' + (rec ? ' rec' : '') + (think ? ' think' : '') + '">' +
    '<div class="vx-top"><button class="vx-x" data-a="vxClose" aria-label="Fermer">' + ic('x') + '</button><b>Parle à l\'appli</b><span></span></div>' +
    (!VX.append && canCount() ? '<div class="vx-seg' + (rec || think ? ' off' : '') + '"><button class="' + (VX.mode === 'mvt' ? 'on' : '') + '" data-a="vxMode" data-m="mvt">Entrées / sorties</button><button class="' + (VX.mode === 'inv' ? 'on' : '') + '" data-a="vxMode" data-m="inv">Recomptage</button></div>' : '<div style="height:12px"></div>') +
    '<div class="vx-center"><button id="vxMic" class="vx-mic" data-a="vxToggle" aria-label="' + (rec ? 'Arrêter' : 'Parler') + '"' + (think ? ' disabled' : '') + '>' +
    '<i class="h h3"></i><i class="h h2"></i><i class="h h1"></i><span class="core">' + (think ? '<i class="vx-spin"></i>' : ic(rec ? 'stop' : 'mic')) + '</span></button>' +
    '<div class="vx-title">' + title + '</div><div class="vx-sub">' + sub + '</div>' +
    (st === 'err' && VX.said ? '<div class="vx-said">Tu as dit : « ' + esc(VX.said) + ' »</div>' : '') + '</div>';
  if (!rec && !think) {
    html += '<div class="vx-ex"><span>PAR EXEMPLE</span>' + VX_EX[VX.mode].map(function (x) { return '<div>« ' + esc(x) + ' »</div>'; }).join('') + '</div>';
  }
  return html + '</div>';
};
A.vxMode = function (d) { if (VX.st === 'rec' || VX.st === 'think') return; VX.mode = d.m; VX.st = 'idle'; VX.err = ''; render(false); };
A.vxClose = function () {
  recCancel(); stopSpeak(); VX.st = 'idle'; VX.err = '';
  if (VX.append && VOX) { VX.append = false; go('voixVerif', {}, { replace: true }); return; }
  VX.append = false; go('home', {}, { replace: true });
};
A.vxToggle = function () {
  audioCtx();                                   // débloque le son pendant l'appui (pour pouvoir répondre ensuite)
  if (VX.st === 'think') return;
  if (VX.st !== 'rec') {
    stopSpeak();
    VX.st = 'rec'; VX.err = ''; VX.said = ''; render(false);
    call('ping', [CFG.code], 15000).catch(function () {});   // réveille le script pendant que Jimmy parle (réponse plus rapide)
    recStart().catch(function (e) {
      REC = null; VX.st = 'err';
      VX.err = /denied|NotAllowed|Permission/i.test(e && (e.name + e.message)) ? 'Le micro est bloqué : autorise-le pour l\'appli (cadenas à côté de l\'adresse, ou Paramètres du téléphone › Applis › Chrome › Autorisations › Micro).' : (e.message || 'Micro indisponible.');
      render(false);
    });
    return;
  }
  var r = recStop();
  if (!r || r.sec < 0.6) { VX.st = 'err'; VX.err = 'Je n\'ai rien entendu. Appuie une fois, parle, puis rappuie.'; render(false); return; }
  VX.st = 'think'; render(false);
  var t0 = Date.now();
  call('voix', [CFG.code, { audio: r.data, mime: 'audio/wav', mode: VX.mode }], 120000).then(function (doc) {
    VX.said = doc.transcription || '';
    var lignes = doc.lignes || [];
    if (!doc.comprehensible || !lignes.length) {
      VX.st = 'err'; VX.err = 'Je n\'ai pas compris de produit. Réessaie en disant la quantité et le produit.';
      render(false); speak(doc.reponse || 'Je n\'ai pas bien compris, tu peux répéter ?');
      return;
    }
    var nv = buildVox(doc);
    if (VX.append && VOX) {
      var base = VOX.lignes.length;
      nv.lignes.forEach(function (l, i) { l.k = 'l' + (base + i); VOX.lignes.push(l); });
      if (!VOX.four && nv.four) VOX.four = nv.four;
      if (!VOX.chantier && nv.chantier) VOX.chantier = nv.chantier;
      VOX.reponse = nv.reponse; VOX.confirmation = nv.confirmation || VOX.confirmation;
      VOX.transcription = (VOX.transcription ? VOX.transcription + ' ' : '') + nv.transcription;
    } else VOX = nv;
    VOX.ms = Date.now() - t0;
    saveVox(); VX.st = 'idle'; VX.append = false;
    go('voixVerif', {}, { replace: true });
    speak(VOX.reponse).then(function () { if (VOX && VOX.confirmation) fetchVoice(VOX.confirmation).catch(function () {}); });
  }).catch(function (e) {
    VX.st = 'err';
    VX.err = e.code === 'NOKEY' ? 'La clé Gemini n\'est pas installée dans le script.' : e.code === 'QUOTA' ? 'Trop de demandes à Gemini pour le moment : réessaie dans une minute.' : (e.message || 'Problème de connexion.');
    render(false);
  });
};

/* ================= ce que l'appli a compris ================= */

function voxKey(dit) { return 'voix|' + norm(dit || '').replace(/\s+/g, ' ').trim(); }
function buildVox(doc) {
  var M = D();
  var ok = function (id) { return id && M.prod[id] && M.prod[id].actif !== '0' ? id : ''; };
  var four = doc.fournisseur_id && M.four[doc.fournisseur_id] && M.four[doc.fournisseur_id].actif !== '0' ? doc.fournisseur_id : (doc.fournisseur ? matchFour({ fournisseur: doc.fournisseur }) : '');
  var lignes = (doc.lignes || []).map(function (l, i) {
    var op = l.action === 'sortie' || l.action === 'compte' ? l.action : 'entree';
    var L = { k: 'l' + i, op: op, qte: Math.abs(num(l.quantite)), dit: String(l.dit || '').trim(), pid: '', cands: [], statut: 'new',
      nom: upName(l.nom_propose || l.dit), famille: M.fam[l.famille_proposee] ? l.famille_proposee : (M.fams[0] ? M.fams[0].id : ''), source: '' };
    if (!(L.qte >= 0) || (op !== 'compte' && !L.qte)) L.qte = op === 'compte' ? 0 : 1;
    var al = M.alias[voxKey(L.dit)], pid = ok(l.produit_id), others = (l.autres_ids || []).map(ok).filter(Boolean);
    if (al && ok(al.produit)) { L.pid = al.produit; L.statut = 'ok'; L.source = 'appris'; }
    else if (pid && num(l.confiance) >= 0.8) { L.pid = pid; L.statut = 'ok'; }
    else if (pid) { L.statut = 'check'; L.cands = [pid].concat(others.filter(function (x) { return x !== pid; })).slice(0, 3); }
    else { L.statut = 'new'; L.cands = others.slice(0, 2); }
    return L;
  });
  return { source: 'voix', mode: VX.mode, four: four, fourNom: String(doc.fournisseur || '').trim(), chantier: String(doc.chantier || '').trim(),
    transcription: String(doc.transcription || ''), reponse: String(doc.reponse || ''), confirmation: String(doc.confirmation || 'C\'est noté !'), lignes: lignes };
}
function voxLine(k) { return VOX && VOX.lignes.filter(function (l) { return l.k === k; })[0]; }
function voxPending() { return VOX ? VOX.lignes.filter(function (l) { return l.statut === 'check' || l.statut === 'new'; }).length : 0; }
var OPS = { entree: { s: '+', lab: 'Entrée', cls: 'in' }, sortie: { s: '−', lab: 'Sortie', cls: 'out' }, compte: { s: '=', lab: 'Recomptage', cls: 'adj' } };
function voxAfter(l, q) { return l.op === 'entree' ? q + l.qte : l.op === 'sortie' ? q - l.qte : l.qte; }

SCREENS.voixVerif = function () {
  if (!VOX) return SCREENS.voix({});
  var M = D(), V = VOX;
  var nOk = V.lignes.filter(function (l) { return l.statut === 'ok' || l.statut === 'create'; }).length, left = voxPending();
  var hasIn = V.lignes.some(function (l) { return l.op === 'entree' && l.statut !== 'skip'; });
  var html = '<div class="screen">' + head({ title: 'Voilà ce que j\'ai compris', backAct: 'voxBack',
    sub: esc([V.four ? 'Livraison ' + fourName(V.four) : '', V.chantier ? 'Chantier ' + V.chantier : ''].filter(Boolean).join(' · ')) }) +
    '<div class="scroll nonav" style="padding-bottom:180px">';
  html += '<div class="say" id="vxSay" data-s=""><div class="say-top"><span class="wave">' + '<i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i>' + '</span><span class="say-lab">à voix haute</span>' +
    '<button class="small-btn" data-a="voxReplay">' + ic('replay') + 'Réécouter</button></div>' +
    '<p class="say-txt">' + esc(V.reponse) + '</p>' + (V.transcription ? '<p class="say-you">Tu as dit : « ' + esc(V.transcription) + ' »</p>' : '') +
    '<p class="say-err">La voix n\'a pas pu être chargée (connexion ou quota Gemini) : tout est écrit ci-dessus.</p></div>';
  if (hasIn && V.fourNom && !V.four) {
    html += '<div class="vcard check"><div class="vhead"><span class="dot check"></span><span>Fournisseur dit : <b>' + esc(V.fourNom) + '</b></span></div>' +
      '<span class="vq check">Il n\'est pas dans ta liste.</span><div class="btn-row"><button class="btn light" style="height:46px" data-a="voxFourNew">Ajouter</button><button class="btn light" style="height:46px" data-a="voxFourPick">Choisir</button></div>' +
      '<div class="vmini"><button data-a="voxFourNone">Sans fournisseur</button></div></div>';
  }
  var order = { check: 0, new: 1, create: 2, ok: 3, skip: 4 };
  V.lignes.slice().sort(function (a, b) { return order[a.statut] - order[b.statut]; }).forEach(function (l) {
    var o = OPS[l.op], said = '<span class="vsrc">Tu as dit : <b>' + esc(l.dit) + '</b> · ' + o.lab.toLowerCase() + ' ' + o.s + ' ' + fq(l.qte) + '</span>';
    if (l.statut === 'check') {
      html += '<div class="vcard check"><div class="vhead"><span class="dot check"></span>' + said + '</div><span class="vq check">Je pense que c\'est :</span>' +
        l.cands.map(function (pid, i) { return '<button class="vcand ' + (i === 0 ? 'best' : '') + '" data-a="voxPick" data-k="' + l.k + '" data-id="' + pid + '">' + esc(M.prod[pid].nom) + ' <span>· stock ' + fq(M.stock[pid] || 0) + '</span></button>'; }).join('') +
        '<div class="vmini"><button data-a="voxOther" data-k="' + l.k + '">Autre produit…</button><button data-a="voxToNew" data-k="' + l.k + '">C\'est un nouveau</button><button data-a="voxSkip" data-k="' + l.k + '">Retirer</button></div></div>';
    } else if (l.statut === 'new') {
      html += '<div class="vcard new"><div class="vhead"><span class="dot new"></span>' + said + '</div><span class="vq new">Je ne le connais pas : je le crée ?</span>' +
        '<button class="vnew" data-a="voxName" data-k="' + l.k + '"><b>' + esc(l.nom) + '</b><span>' + esc(famName(l.famille)) + ' · <u>modifier</u></span></button>' +
        '<div class="btn-row"><button class="btn" style="background:#2F5BD3;font-family:Barlow;font-weight:700;font-size:16px;height:48px" data-a="voxCreate" data-k="' + l.k + '">Créer</button><button class="btn light" style="height:48px" data-a="voxOther" data-k="' + l.k + '">C\'est un existant</button></div>' +
        (l.cands.length ? '<div class="vmini" style="margin-top:6px">' + l.cands.map(function (pid) { return '<button data-a="voxPick" data-k="' + l.k + '" data-id="' + pid + '">' + esc(M.prod[pid].nom) + ' ?</button>'; }).join('') + '</div>' : '') +
        '<div class="vmini"><button data-a="voxSkip" data-k="' + l.k + '">Retirer cette ligne</button></div></div>';
    } else if (l.statut === 'skip') {
      html += '<div class="vcard skip"><span class="vsrc">Retirée : <b>' + esc(l.dit) + '</b></span><button class="link" data-a="voxUnskip" data-k="' + l.k + '">Reprendre</button></div>';
    } else {
      var p = l.statut === 'create' ? { nom: l.nom } : M.prod[l.pid], q = l.statut === 'create' ? 0 : (M.stock[l.pid] || 0);
      var info = [o.lab, l.op === 'entree' && V.four ? fourName(V.four) : '', l.op === 'sortie' && V.chantier ? 'Chantier ' + V.chantier : '', l.source === 'appris' ? 'reconnu (déjà dit)' : ''].filter(Boolean).join(' · ');
      html += '<button class="vcard ok vxl" data-a="voxMenu" data-k="' + l.k + '"><span class="vxq ' + o.cls + '">' + o.s + fq(l.qte) + '</span><span class="grow"><span class="t">' + esc(p ? p.nom : '?') +
        (l.statut === 'create' ? ' <span class="badge" style="background:#DCE6FF;color:#1E3A8A">nouveau</span>' : '') + '</span>' +
        '<span class="s">' + esc(info) + ' · stock ' + fq(q) + ' → ' + fq(voxAfter(l, q)) + '</span></span></button>';
    }
  });
  if (V.lignes.some(function (l) { return l.statut === 'ok'; })) html += '<p style="text-align:center;font-size:13px;color:var(--muted);margin:6px 0 0">Touche une ligne pour la corriger ou la retirer</p>';
  html += '<button class="btn light" style="margin-top:14px" data-a="voxCancel">' + ic('trash') + 'Tout annuler</button></div>' +
    '<div class="bottom-bar"><div style="text-align:center;font-size:14px;font-weight:600;margin-bottom:8px;color:' + (left ? '#7A3D00' : 'var(--green-ink)') + '">' +
    (left ? 'Encore ' + left + ' point' + (left > 1 ? 's' : '') + ' à regarder' : nOk + ' ligne' + (nOk > 1 ? 's' : '') + ' prête' + (nOk > 1 ? 's' : '')) + '</div>' +
    '<div class="vx-bar"><button class="vx-more" data-a="voxMore" aria-label="Compléter à la voix">' + ic('mic') + '</button>' +
    '<button class="btn green" style="height:62px;font-size:22px" data-a="voxValidate" ' + (left || !nOk ? 'disabled' : '') + '>Valider ' + (nOk > 1 ? 'les ' + nOk + ' lignes' : 'la ligne') + '</button></div></div></div>';
  return html;
};
function voxSet(k, fn) { var l = voxLine(k); if (!l) return; fn(l); saveVox(); render(false); }
A.voxReplay = function () { audioCtx(); if (VOX) speak(VOX.reponse); };
A.voxBack = function () { A.voxCancel(); };
A.voxPick = function (d) { voxSet(d.k, function (l) { l.pid = d.id; l.statut = 'ok'; l.source = ''; }); };
A.voxSkip = function (d) { voxSet(d.k, function (l) { l.prev = l.statut; l.statut = 'skip'; }); };
A.voxUnskip = function (d) { voxSet(d.k, function (l) { l.statut = l.pid ? 'ok' : (l.prev === 'create' ? 'create' : 'new'); }); };
A.voxToNew = function (d) { voxSet(d.k, function (l) { l.statut = 'new'; l.pid = ''; }); };
A.voxCreate = function (d) { voxSet(d.k, function (l) { l.statut = 'create'; l.pid = ''; }); };
A.voxOther = function (d) { var l = voxLine(d.k); openPicker('Quel produit ?', '', function (pid) { voxSet(d.k, function (x) { x.pid = pid; x.statut = 'ok'; x.source = ''; }); }); };
A.voxName = function (d) {
  var l = voxLine(d.k), M = D();
  openSheet('<h3>Nouveau produit</h3><p>Tu as dit : ' + esc(l.dit) + '</p>' +
    '<div class="field"><label for="vnm">Nom</label><input id="vnm" class="inp" style="text-transform:uppercase" value="' + esc(l.nom) + '"></div>' +
    '<div class="field"><label for="vfm">Famille</label><select id="vfm" class="inp">' + M.fams.map(function (f) { return '<option value="' + f.id + '"' + (f.id === l.famille ? ' selected' : '') + '>' + esc(f.nom) + '</option>'; }).join('') + '</select></div>' +
    '<button class="btn" data-a="voxNameOk" data-k="' + l.k + '">OK</button>');
};
A.voxNameOk = function (d) {
  var nm = upName(document.getElementById('vnm').value), fm = document.getElementById('vfm').value;
  closeSheet(function () { voxSet(d.k, function (l) { if (nm) l.nom = nm; l.famille = fm; }); });
};
A.voxMenu = function (d) {
  var l = voxLine(d.k), nm = l.statut === 'create' ? l.nom : (D().prod[l.pid] || {}).nom || '';
  openSheet('<h3>' + esc(nm) + '</h3><p>Tu as dit : ' + esc(l.dit) + '</p>' +
    '<div class="seg3">' + ['entree', 'sortie', 'compte'].map(function (op) { return '<button class="' + (l.op === op ? 'on ' + OPS[op].cls : '') + '" data-a="voxOp" data-k="' + l.k + '" data-op="' + op + '">' + OPS[op].s + ' ' + OPS[op].lab + '</button>'; }).join('') + '</div>' +
    '<button class="menu-item" data-a="voxQty" data-k="' + l.k + '">' + ic('edit') + 'Modifier la quantité (' + fq(l.qte) + ')</button>' +
    '<button class="menu-item" data-a="voxChange" data-k="' + l.k + '">' + ic('stock') + 'Ce n\'est pas ce produit</button>' +
    (l.statut === 'create' ? '<button class="menu-item" data-a="voxRename" data-k="' + l.k + '">' + ic('tag') + 'Changer le nom ou la famille</button>' : '') +
    '<button class="menu-item" data-a="voxSkipSheet" data-k="' + l.k + '">' + ic('x') + 'Retirer cette ligne</button>');
};
A.voxOp = function (d) { closeSheet(function () { voxSet(d.k, function (l) { l.op = d.op; }); }); };
A.voxChange = function (d) { closeSheet(function () { A.voxOther(d); }); };
A.voxRename = function (d) { closeSheet(function () { A.voxName(d); }); };
A.voxSkipSheet = function (d) { closeSheet(function () { A.voxSkip(d); }); };
A.voxQty = function (d) {
  var l = voxLine(d.k);
  closeSheet(function () {
    askNumber({ title: OPS[l.op].lab + ' : quelle quantité ?', value: l.qte }).then(function (n) { if (n === null || n === undefined || !(n >= 0)) return; voxSet(d.k, function (x) { x.qte = n; }); });
  });
};
A.voxFourNew = function () {
  askText({ title: 'Nouveau fournisseur', value: VOX.fourNom, ok: 'Ajouter' }).then(function (name) {
    name = (name || '').trim(); if (!name) return;
    var id = uid('f'); commit(put('Fournisseurs', { id: id, nom: name, contact: '', tel: '', email: '', adresse: '', notes: '', actif: '1' }));
    VOX.four = id; saveVox(); render(false);
  });
};
A.voxFourPick = function () {
  openSheet('<h3>Quel fournisseur ?</h3>' + D().foursActifs.map(function (f) { return '<button class="menu-item" data-a="voxFourSet" data-id="' + f.id + '">' + ic('truck') + esc(f.nom) + '</button>'; }).join(''));
};
A.voxFourSet = function (d) { closeSheet(function () { VOX.four = d.id; saveVox(); render(false); }); };
A.voxFourNone = function () { VOX.fourNom = ''; saveVox(); render(false); };
A.voxMore = function () { audioCtx(); stopSpeak(); VX.append = true; VX.st = 'idle'; VX.mode = VOX.mode || VX.mode; go('voix', {}, { replace: true }); };
A.voxCancel = function () {
  ask({ title: 'Tout annuler ?', text: 'Rien ne sera changé dans le stock.', ok: 'Tout annuler', danger: true }).then(function (ok) {
    if (!ok) return; stopSpeak(); VOX = null; saveVox(); go('home', {}, { replace: true });
  });
};
A.voxValidate = function () {
  audioCtx();
  var V = VOX, M = D(); if (!V || voxPending()) return;
  var now = nowIso(), ops = [], n = 0, inv = M.invEnCours;
  V.lignes.forEach(function (l) {
    if (l.statut !== 'ok' && l.statut !== 'create') return;
    var pid = l.pid;
    if (l.statut === 'create') {
      pid = uid('p');
      ops.push(put('Produits', { id: pid, nom: upName(l.nom), famille: l.famille, unite: '', seuil: '0', four: l.op === 'entree' && V.four ? V.four : '', ref: '', notes: '', actif: '1', cree: now }));
    }
    var q = l.statut === 'create' ? 0 : (M.stock[pid] || 0);
    if (l.op === 'entree') ops.push(put('Mouvements', { id: uid('m'), date: now, produit: pid, delta: String(round3(l.qte)), type: 'entree', qui: ME, lieu: V.four ? 'Livraison (à la voix)' : 'À la voix', fournisseur: V.four || '', prix: '', note: 'voix' }));
    else if (l.op === 'sortie') ops.push(put('Mouvements', { id: uid('m'), date: now, produit: pid, delta: String(-round3(l.qte)), type: 'sortie', qui: ME, lieu: V.chantier || 'À la voix', fournisseur: '', prix: '', note: 'voix' }));
    else if (inv) ops.push(put('Comptages', { id: inv.id + '_' + pid, inventaire: inv.id, produit: pid, compte: String(l.qte), qui: ME, date: now }));
    else if (round3(l.qte - q) !== 0) ops.push(put('Mouvements', { id: uid('m'), date: now, produit: pid, delta: String(round3(l.qte - q)), type: 'ajust', qui: ME, lieu: 'Recomptage à la voix', fournisseur: '', prix: '', note: 'voix' }));
    if (l.dit) ops.push(put('Alias', { id: 'a' + hashKey(voxKey(l.dit)), fournisseur: 'voix', libelle: voxKey(l.dit).slice(5), produit: pid, facteur: '1', maj: now }));
    n++;
  });
  commit(ops);
  var conf = V.confirmation || 'C\'est noté !';
  VOX = null; saveVox();
  toast('C\'est fait', n + ' ligne' + (n > 1 ? 's' : '') + (inv && V.mode === 'inv' ? ' comptée' + (n > 1 ? 's' : '') + ' dans le recomptage' : ' enregistrée' + (n > 1 ? 's' : '')));
  go('home', {}, { replace: true });
  speak(conf);
};

/* ================= Réglages : voix de l'appli ================= */

var VOIX_CHOIX = [['Achird', 'amicale'], ['Puck', 'enjouée'], ['Charon', 'posée'], ['Algenib', 'grave'], ['Sulafat', 'chaleureuse'], ['Kore', 'ferme']];
function voixCard() {
  var cur = voiceName() || 'Achird';
  return '<div class="card"><div class="card-title"><h2>Voix de l\'appli</h2></div><p style="font-size:13px;color:var(--muted);margin:2px 0 10px">Une vraie voix (Gemini), pas celle du téléphone. Touche pour écouter et choisir.</p>' +
    '<div class="voix-grid">' + VOIX_CHOIX.map(function (v) { return '<button class="' + (v[0] === cur ? 'on' : '') + '" data-a="voixPick" data-v="' + v[0] + '"><b>' + v[0] + '</b><span>' + v[1] + '</span></button>'; }).join('') + '</div></div>';
}
A.voixPick = function (d) {
  audioCtx();
  commit(put('Reglages', { id: 'voix', valeur: d.v })); render(false);
  toast('Voix ' + d.v, 'Écoute…');
  speak('Salut ' + (me() ? me().nom : '') + ' ! C\'est moi qui te répondrai dans l\'appli. Plus dix coudes de quatre-vingts, c\'est noté.');
};
A.vxOpen = function () { audioCtx(); recCancel(); VX = { st: 'idle', mode: 'mvt', err: '', said: '', append: false }; go('voix', {}); };
