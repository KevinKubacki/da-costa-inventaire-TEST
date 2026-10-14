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

var AUD = { ctx: null, src: null, an: null, raf: 0, cache: {}, playing: false, tok: 0, gain: null };
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
function voiceName() { return (D().reg.voix || '').trim() || 'Achird'; }

// Phrases toujours identiques : fabriquées une seule fois (gardées dans le Drive par le script ET dans le téléphone) → dites sans attente.
var PHRASE_ESSAI = 'Salut ! C\'est moi qui te répondrai dans l\'appli.';
// Confirmations après « Valider » : elles tournent (jamais deux fois la même d'affilée), chacune gardée après sa 1re fois
var PHRASES_OK = ['Voilà, c\'est fait !', 'C\'est bon, c\'est enregistré.', 'Pas de souci, c\'est bon, c\'est fait.'];
function phraseOk(avancer) {
  var i = 0; try { i = (+localStorage.getItem(NS + 'okTour') || 0) % PHRASES_OK.length; } catch (e) {}
  if (avancer) try { localStorage.setItem(NS + 'okTour', String((i + 1) % PHRASES_OK.length)); } catch (e) {}
  return PHRASES_OK[i];
}
function prechargerOk() { PHRASES_OK.forEach(function (t) { cachedVoice(prononce(t), voiceName()); }); }
var PHRASE_REPETE = 'Je n\'ai pas bien compris, tu peux répéter ?';
var VCACHE = 'stock-voix:' + (typeof NS !== 'undefined' ? NS : '');
function phoneCacheGet(key) {
  if (!window.caches) return Promise.resolve(null);
  return caches.open(VCACHE).then(function (c) { return c.match('/voix/' + encodeURIComponent(key)); }).then(function (r) { return r ? r.arrayBuffer() : null; }).catch(function () { return null; });
}
function phoneCachePut(key, bytes) {
  if (!window.caches) return;
  caches.open(VCACHE).then(function (c) { return c.put('/voix/' + encodeURIComponent(key), new Response(bytes, { headers: { 'content-type': 'audio/wav' } })); }).catch(function () {});
}
function decodeWav(bytes) {
  var ctx = audioCtx(); if (!ctx) return Promise.reject(new Error('Son indisponible'));
  var ab = bytes instanceof ArrayBuffer ? bytes.slice(0) : bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
  return new Promise(function (res, rej) { ctx.decodeAudioData(ab, res, rej); });
}
/** Demande la voix au script (mise en cache : une même phrase n'est demandée qu'une fois). `fixe` = phrase toujours identique. */
function fetchVoice(text, fixe, voix) {
  voix = voix || voiceName();
  var key = voix + '|' + text;
  if (!AUD.cache[key]) {
    var t0 = Date.now();
    AUD.cache[key] = (fixe ? phoneCacheGet(key) : Promise.resolve(null)).then(function (hit) {
      if (hit) return decodeWav(hit);
      return call('parler', [CFG.code, { texte: text, voix: voix, garder: !!fixe }], 60000).then(function (r) {
        var wav = toWav(r); AUD.lastMs = Date.now() - t0;
        if (fixe) phoneCachePut(key, wav);
        return decodeWav(wav);
      });
    });
    AUD.cache[key].catch(function () { delete AUD.cache[key]; });
  }
  return AUD.cache[key];
}
/** Coupe la voix tout de suite (et annule celle qui était en train d'arriver). */
function stopSpeak() {
  AUD.tok++;
  if (AUD.src) { try { AUD.src.onended = null; AUD.src.stop(); } catch (e) {} AUD.src = null; }
  liveStopAll();
  cancelAnimationFrame(AUD.raf); AUD.playing = false; waveIdle(); setSpeakState('');
}
function waveLoop(an) {
  var data = new Uint8Array(an.frequencyBinCount);
  cancelAnimationFrame(AUD.raf);
  (function loop() {
    if (!AUD.playing) return;
    an.getByteFrequencyData(data);
    var bars = document.querySelectorAll('.wave i');
    for (var i = 0; i < bars.length; i++) { var v = data[2 + i * 3] / 255; bars[i].style.transform = 'scaleY(' + (0.18 + v * 1.1).toFixed(2) + ')'; }
    AUD.raf = requestAnimationFrame(loop);
  })();
}
function playBuffer(buf, tok) {
  return new Promise(function (res) {
    if (tok !== AUD.tok) { res(false); return; }
    var ctx = audioCtx(), src = ctx.createBufferSource(), an = ctx.createAnalyser(); an.fftSize = 256;
    src.buffer = buf; src.connect(an); an.connect(ctx.destination);
    AUD.src = src; AUD.an = an; AUD.playing = true; setSpeakState('play');
    waveLoop(an);
    src.onended = function () { if (AUD.src === src) { AUD.src = null; AUD.playing = false; cancelAnimationFrame(AUD.raf); waveIdle(); } res(tok === AUD.tok); };
    src.start();
  });
}

/* ---------- voix EN DIRECT (API Live de Gemini : gratuite, sans limite par jour, le son arrive en continu) ---------- */

var LIVE = { token: null, exp: 0, model: '', tokP: null, ready: null, readyVoice: '', cur: null, srcs: [], off: 0 };
var LIVE_URL = 'wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContentConstrained?access_token=';
var LIVE_CONSIGNE = 'Tu es la voix d\'une application de gestion de stock pour un artisan couvreur. Chaque message que tu reçois est un texte à DIRE À VOIX HAUTE : prononce-le exactement, mot pour mot, en français, avec une voix naturelle, chaleureuse et détendue, un débit vif. N\'ajoute rien, ne réponds pas, ne pose aucune question, ne commente pas.';
function liveToken() {
  if (LIVE.token && LIVE.exp - Date.now() > 60000) return Promise.resolve(LIVE.token);
  if (!LIVE.tokP) LIVE.tokP = call('jetonVoix', [CFG.code], 20000).then(function (r) { LIVE.token = r.jeton; LIVE.exp = r.expire; LIVE.model = r.modele; LIVE.tokP = null; return r.jeton; },
    function (e) { LIVE.tokP = null; throw e; });
  return LIVE.tokP;
}
/** Ouvre une session Live (connexion + réglages) ; prête quand Google répond « setupComplete ». */
function liveOpen(voice) {
  return liveToken().then(function (token) {
    return new Promise(function (res, rej) {
      var ws, done = false;
      try { ws = new WebSocket(LIVE_URL + encodeURIComponent(token)); } catch (e) { rej(e); return; }
      var timer = setTimeout(function () { if (!done) { done = true; try { ws.close(); } catch (e) {} rej(new Error('live-timeout')); } }, 7000);
      ws.onopen = function () {
        ws.send(JSON.stringify({ setup: { model: 'models/' + (LIVE.model || 'gemini-3.8-live'),
          generationConfig: { responseModalities: ['AUDIO'], temperature: 0.2, speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: voice } } } },
          systemInstruction: { parts: [{ text: LIVE_CONSIGNE }] } } }));
      };
      ws.onmessage = function (ev) {
        liveData(ev).then(function (m) {
          if (!done && m && m.setupComplete) { done = true; clearTimeout(timer); ws.onmessage = null; res(ws); }
        });
      };
      ws.onerror = function () { if (!done) { done = true; clearTimeout(timer); rej(new Error('live-ws')); } };
      ws.onclose = function (ev) { if (!done) { done = true; clearTimeout(timer); if (ev && ev.code === 1008) LIVE.token = null; rej(new Error('live-close ' + (ev && ev.code))); } };
    });
  });
}
function liveData(ev) {
  var d = ev.data;
  var txt = typeof d === 'string' ? Promise.resolve(d) : d && d.text ? d.text() : d instanceof ArrayBuffer ? Promise.resolve(new TextDecoder().decode(d)) : Promise.resolve('');
  return txt.then(function (t) { try { return JSON.parse(t); } catch (e) { return null; } });
}
/** Prépare une session à l'avance (pendant que Gemini réfléchit) : la voix part dès que le texte est prêt. */
function livePrepare(voice) {
  voice = voice || voiceName();
  if (LIVE.off > Date.now()) return Promise.reject(new Error('live-off'));
  if (LIVE.ready && LIVE.readyVoice === voice) return LIVE.ready;
  if (LIVE.ready) LIVE.ready.then(function (ws) { try { ws.close(); } catch (e) {} }, function () {});
  LIVE.readyVoice = voice;
  LIVE.ready = liveOpen(voice);
  LIVE.ready.catch(function () { LIVE.ready = null; });
  return LIVE.ready;
}
function liveStopAll() {
  LIVE.srcs.forEach(function (s) { try { s.onended = null; s.stop(); } catch (e) {} }); LIVE.srcs = [];
  if (LIVE.cur) { try { LIVE.cur.close(); } catch (e) {} LIVE.cur = null; }
}
/** Dit le texte par l'API Live : le son est joué AU FUR ET À MESURE qu'il arrive. Renvoie le son complet (pour Réécouter). */
function speakLive(text, voice, tok, t0) {
  return livePrepare(voice).then(function (ws) {
    LIVE.ready = null;                               // cette session est consommée
    if (tok !== AUD.tok) { try { ws.close(); } catch (e) {} return false; }
    LIVE.cur = ws;
    var ctx = audioCtx(), an = ctx.createAnalyser(); an.fftSize = 256; an.connect(ctx.destination); AUD.an = an;
    var next = 0, started = false, pcm = [], rate = 24000;
    return new Promise(function (res, rej) {
      var first = setTimeout(function () { if (!started) { try { ws.close(); } catch (e) {} rej(new Error('lent')); } }, 7000);
      var finish = function () {
        clearTimeout(first);
        var wait = Math.max(0, (next - ctx.currentTime) * 1000) + 60;
        setTimeout(function () {
          if (tok === AUD.tok) { AUD.playing = false; cancelAnimationFrame(AUD.raf); waveIdle(); }
          // tout le son reçu → gardé pour « Réécouter » (sans redemander)
          var n = 0; pcm.forEach(function (c) { n += c.length; });
          var all = new Float32Array(n), o = 0; pcm.forEach(function (c) { all.set(c, o); o += c.length; });
          var buf = n ? ctx.createBuffer(1, n, rate) : null; if (buf) buf.copyToChannel(all, 0);
          res(buf || false);
        }, wait);
        try { ws.close(); } catch (e) {} if (LIVE.cur === ws) LIVE.cur = null;
      };
      ws.onmessage = function (ev) {
        liveData(ev).then(function (m) {
          if (!m || tok !== AUD.tok) return;
          var sc = m.serverContent;
          if (sc && sc.modelTurn && sc.modelTurn.parts) sc.modelTurn.parts.forEach(function (p) {
            var id = p.inlineData || p.inline_data; if (!id || !id.data) return;
            var mm = /rate=(\d+)/.exec(id.mimeType || id.mime_type || ''); if (mm) rate = +mm[1];
            var u = b64Bytes(id.data), n = Math.floor(u.length / 2), f = new Float32Array(n), dv = new DataView(u.buffer);
            for (var i = 0; i < n; i++) f[i] = dv.getInt16(i * 2, true) / 32768;
            pcm.push(f);
            var b = ctx.createBuffer(1, n, rate); b.copyToChannel(f, 0);
            var src = ctx.createBufferSource(); src.buffer = b; src.connect(an);
            if (!started) { started = true; clearTimeout(first); next = ctx.currentTime + 0.06; AUD.playing = true; setSpeakState('play'); waveLoop(an); AUD.firstMs = Date.now() - t0; AUD.via = 'direct'; showTiming(); }
            if (next < ctx.currentTime) next = ctx.currentTime + 0.02;
            src.start(next); next += b.duration; LIVE.srcs.push(src);
          });
          if (sc && (sc.turnComplete || sc.generationComplete)) finish();
        });
      };
      ws.onclose = function () { if (LIVE.cur === ws) { LIVE.cur = null; if (started) finish(); else rej(new Error('live-close')); } };
      ws.send(JSON.stringify({ realtimeInput: { text: text } }));
    });
  });
}

/** Son déjà connu (mémoire ou téléphone) pour cette phrase et cette voix ? */
function cachedVoice(text, voix) {
  var key = voix + '|' + text;
  if (AUD.mem && AUD.mem[key]) return Promise.resolve(AUD.mem[key]);
  return phoneCacheGet(key).then(function (b) { return b ? decodeWav(b).then(function (buf) { (AUD.mem = AUD.mem || {})[key] = buf; return buf; }) : null; }).catch(function () { return null; });
}
function bufferToWav(buf) {
  var f = buf.getChannelData(0), pcm = new Uint8Array(f.length * 2), dv = new DataView(pcm.buffer);
  for (var i = 0; i < f.length; i++) { var v = Math.max(-1, Math.min(1, f[i])); dv.setInt16(i * 2, v < 0 ? v * 0x8000 : v * 0x7FFF, true); }
  var out = new Uint8Array(44 + pcm.length); out.set(wavHeader(pcm.length, buf.sampleRate), 0); out.set(pcm, 44); return out;
}
/**
 * Dit la phrase. Ordre : 1) déjà connue (instantané)  2) voix EN DIRECT (Live, sans limite)  3) ancienne voix (limitée)  4) texte seul.
 * Une nouvelle demande coupe la précédente.
 */
/** Mots du métier que les voix prononcent mal : on écrit comme ça se dit (le texte affiché ne change pas). */
var PRONONCE = [[/\bbast(?:a)?ings?\b/gi, function (m) { return /s$/i.test(m) ? 'bastins' : 'bastin'; }], [/\bØ\s?/g, 'diamètre ']];
function prononce(t) { PRONONCE.forEach(function (r) { t = t.replace(r[0], r[1]); }); return t; }
function speak(text, opt) {
  opt = opt || {};
  if (text) text = prononce(text);
  stopSpeak();
  if (!text) return Promise.resolve(false);
  var tok = AUD.tok, t0 = Date.now(), voix = opt.voix || voiceName(), key = voix + '|' + text;
  setSpeakState('load');
  return cachedVoice(text, voix).then(function (buf) {
    if (tok !== AUD.tok) return false;
    if (buf) { AUD.firstMs = Date.now() - t0; AUD.via = 'mémoire'; showTiming(); return playBuffer(buf, tok); }
    return speakLive(text, voix, tok, t0).then(function (full) {
      if (full && full.length) { (AUD.mem = AUD.mem || {})[key] = full; if (opt.fixe) phoneCachePut(key, bufferToWav(full)); }
      return !!full;
    }, function (e) {
      if (tok !== AUD.tok) return false;
      if (!/lent/.test(e && e.message || '')) LIVE.off = Date.now() + 60000;     // la voix en direct ne marche pas : on n'insiste pas pendant 1 min
      // repli : l'ancienne voix (limitée à quelques phrases par jour)
      var limite = new Promise(function (res, rej) { setTimeout(function () { rej(new Error('lent')); }, 15000); });
      return Promise.race([fetchVoice(text, opt.fixe, voix), limite]).then(function (b) {
        AUD.firstMs = Date.now() - t0; AUD.via = 'secours'; showTiming();
        (AUD.mem = AUD.mem || {})[key] = b; return playBuffer(b, tok);
      });
    });
  }).then(function (ok) { if (tok === AUD.tok) setSpeakState(''); return ok; })
    .catch(function (e) {
      if (tok !== AUD.tok) return false;
      var el = document.querySelector('#vxSay .say-err');
      if (el) el.textContent = e && e.code === 'QUOTA_JOUR' ? 'Voix indisponible pour le moment : tout est écrit ci-dessus.' : e && e.code === 'QUOTA' ? 'Voix en pause une minute : tout est écrit ci-dessus.' : e && e.message === 'lent' ? 'La voix met trop de temps : tout est écrit ci-dessus. Réessaie « Réécouter » dans un instant.' : 'La voix n\'a pas pu être chargée : tout est écrit ci-dessus.';
      setSpeakState('err');
      if (VIEW.r === 'reglages') toast('Voix indisponible', 'Réessaie dans un instant');
      return false;
    });
}
function waveIdle() { var bars = document.querySelectorAll('.wave i'); for (var i = 0; i < bars.length; i++) bars[i].style.transform = ''; }
function setSpeakState(s) {
  var el = document.getElementById('vxSay'); if (el) el.setAttribute('data-s', s);
  var vs = document.querySelectorAll('.voix-grid button.load'); if (s !== 'load') for (var i = 0; i < vs.length; i++) vs[i].classList.remove('load');
}
/** Version TEST : temps mesurés, pour régler la rapidité avec Kevin. */
function showTiming() {
  if (!IS_TEST) return;
  var el = document.getElementById('vxTiming'); if (!el || !VOX) return;
  el.textContent = 'compris en ' + (VOX.ms / 1000).toFixed(1) + ' s' + (VOX.modele ? ' (' + VOX.modele.replace(/^gemini-/, '') + ')' : '') + (AUD.firstMs ? ' · voix (' + (AUD.via || '') + ') en ' + (AUD.firstMs / 1000).toFixed(1) + ' s' : '');
}
// la voix s'arrête dès qu'on change d'écran
(function () {
  var last = null;
  window.addEventListener('popstate', function () { stopSpeak(); });
  var orig = window.render;
  if (typeof orig === 'function') window.render = function () { if (last !== VIEW.r) { if (last !== null && !AUD.garde) stopSpeak(); AUD.garde = false; last = VIEW.r; } return orig.apply(this, arguments); };
})();

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
  var peak = 0; for (var k = 0; k < n; k += 4) { var av = Math.abs(all[k]); if (av > peak) peak = av; }
  return { sec: n / R.rate, data: bytesB64(wav), peak: peak };
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
    (st === 'err' && VX.said ? '<div class="vx-said">J\'ai entendu : « ' + esc(VX.said) + ' »</div>' : '') +
    (st === 'err' && VX.wav ? '<button class="small-btn vx-replay" data-a="vxPlayRec">' + ic('replay') + 'Réécouter mon enregistrement</button>' : '') + '</div>';
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
  VX.wav = r.data;                                                    // pour « Réécouter mon enregistrement » en cas de souci
  if (r.peak < 0.012) {                                               // le micro n'a capté que du silence (souvent : Bluetooth de la voiture)
    VX.st = 'err'; VX.said = '';
    VX.err = 'Le micro n\'a presque rien capté. Si le téléphone est relié en Bluetooth (voiture, écouteurs), coupe le Bluetooth ou parle tout près du téléphone, puis réessaie.';
    render(false); return;
  }
  VX.st = 'think'; render(false);
  livePrepare(voiceName()).catch(function () {});      // la voix se connecte pendant que Gemini réfléchit
  var t0 = Date.now();
  call('voix', [CFG.code, { audio: r.data, mime: 'audio/wav', mode: VX.mode, ctx: voixCtx(), avant: VX.append && VOX ? VOX.transcription || '' : '' }], 120000).then(function (doc) {
    VX.said = doc.transcription || '';
    var lignes = doc.lignes || [];
    if (!lignes.length) { lignes = doc.lignes = derniersParLaVoix(VX.said); if (lignes.length) doc.reponse = 'Je supprime ' + (lignes.length > 1 ? 'les ' + lignes.length + ' derniers mouvements' : 'le dernier mouvement') + '. Vérifie, puis valide.'; }
    if (!lignes.length) { lignes = doc.lignes = phraseLocale(VX.said); if (lignes.length) doc.reponse = 'Voilà ce que j\'ai trouvé. Vérifie, puis valide.'; }
    if (lignes.length) doc.comprehensible = true;
    if (!doc.comprehensible || !lignes.length) {
      VX.st = 'err'; VX.err = VX.said ? 'Je n\'ai pas trouvé de produit dans ta phrase. Redis-la avec la quantité et le nom du produit (« retire 195 crochets de gouttière »).' :
        'Je n\'ai rien compris de clair. Réécoute ton enregistrement ci-dessous : si le son est mauvais, coupe le Bluetooth ou parle plus près du téléphone.';
      render(false); speak(PHRASE_REPETE, { fixe: true });
      return;
    }
    var nv = buildVox(doc);
    preciser(nv);
    if (VX.append && VOX) {
      var pend = VOX.lignes.filter(function (l) { return l.statut === 'check' && l.ambigu; })[0], ch = pend ? choisirParLaVoix(pend, VX.said) : '';
      if (ch) {                                                    // il a répondu « lequel » : on choisit, et on reprend ce qu'il demande en plus
        vChoisir(pend, ch);
        nv.lignes.forEach(function (x) { if (x.op !== 'info' && (x.pid === ch || (x.cands || []).indexOf(ch) >= 0)) { pend.op = x.op; pend.qte = x.qte; } });
        nv.lignes = [];
      }
    }
    nv.reponse = composeReponse(nv);
    if (VX.append && VOX) {
      var base = VOX.lignes.length;
      nv.lignes.forEach(function (l, i) { l.k = 'l' + (base + i); VOX.lignes.push(l); });
      if (!VOX.four && nv.four) VOX.four = nv.four;
      if (!VOX.chantier && nv.chantier) VOX.chantier = nv.chantier;
      VOX.confirmation = nv.confirmation || VOX.confirmation;
      VOX.reponse = composeReponse(VOX);
      VOX.transcription = (VOX.transcription ? VOX.transcription + ' ' : '') + nv.transcription;
    } else VOX = nv;
    VOX.ms = Date.now() - t0; VOX.modele = doc.modele || '';
    saveVox(); VX.st = 'idle'; VX.append = false;
    go('voixVerif', {}, { replace: true });
    speak(VOX.reponse);
    prechargerOk();                                               // les confirmations, prêtes en mémoire
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
    var op = ['sortie', 'compte', 'info', 'commander', 'supprimer', 'dupliquer'].indexOf(l.action) >= 0 ? l.action : 'entree';
    var L = { k: 'l' + i, op: op, qte: Math.abs(num(l.quantite)), dit: String(l.dit || '').trim(), pid: '', cands: [], statut: 'new',
      nom: upName(l.nom_propose || l.dit), famille: M.fam[l.famille_proposee] ? l.famille_proposee : (M.fams[0] ? M.fams[0].id : ''), source: '' };
    if (!(L.qte >= 0) || (op !== 'compte' && op !== 'info' && !L.qte)) L.qte = op === 'compte' || op === 'info' ? 0 : 1;
    var al = M.alias[voxKey(L.dit)], pid = ok(l.produit_id), others = (l.autres_ids || []).map(ok).filter(Boolean);
    L.gpid = pid; L.gconf = num(l.confiance);
    if (op === 'supprimer' || op === 'dupliquer') return mvLine(L, l.mouvement_id, pid);
    if (al && ok(al.produit) && vMatch(L.dit).length < 2) { L.pid = al.produit; L.statut = 'ok'; L.source = 'appris'; }
    else if (pid && num(l.confiance) >= 0.8) { L.pid = pid; L.statut = 'ok'; }
    else if (pid) { L.statut = 'check'; L.cands = [pid].concat(others.filter(function (x) { return x !== pid; })).slice(0, 3); }
    else { L.statut = 'new'; L.cands = others.slice(0, 2); }
    return L;
  });
  return { source: 'voix', mode: VX.mode, four: four, fourNom: String(doc.fournisseur || '').trim(), chantier: String(doc.chantier || '').trim(),
    transcription: String(doc.transcription || ''), reponse: String(doc.reponse || ''), confirmation: String(doc.confirmation || 'C\'est noté !'), lignes: lignes };
}
/* ================= V3.3 : assistant précis — ce qu'il DIT = ce qu'il MONTRE ================= */
var MOTS_OUTILS = ['de', 'des', 'du', 'la', 'le', 'les', 'l', 'd', 'un', 'une', 'en', 'au', 'aux', 'a', 'et', 'ou', 'pour', 'avec', 'sans', 'mon', 'ma', 'mes', 'ce', 'ces', 'cet', 'cette',
  'il', 'me', 'moi', 'm', 'reste', 'combien', 'stock', 'encore', 'diametre', 'diam', 'metre', 'metres', 'mm', 'cm', 'produit', 'produits'];
function vTokens(s) {
  return norm(s || '').replace(/[^a-z0-9,]+/g, ' ').split(' ').map(function (w) {
    w = w.replace(/^,+|,+$/g, '');
    return w.length > 3 && /[a-z]$/.test(w) ? w.replace(/(s|x)$/, '') : w;
  }).filter(function (w) { return w && MOTS_OUTILS.indexOf(w) < 0; });
}
function vTokMatch(t, pts) {
  return pts.some(function (pt) {
    if (pt === t) return true;
    if (/^\d/.test(t)) return pt === 'o' + t || pt.split('x').indexOf(t) >= 0;
    return t.length >= 4 && pt.length >= 4 && (pt.indexOf(t) === 0 || t.indexOf(pt) === 0);
  });
}
/** Tous les produits du stock qui correspondent aux mots qu'il a dits (tous les mots doivent y être). */
function vMatch(dit) {
  var T = vTokens(dit); if (!T.length) return [];
  return D().prods.filter(function (p) { var pts = vTokens(p.nom); return T.every(function (t) { return vTokMatch(t, pts); }); });
}
/** Nombres dits en lettres (« quatre-vingt », « vingt-cinq », « cent quatre-vingt-quinze ») → chiffres, pour comparer avec les noms. */
var NB_FR = { zero: 0, un: 1, une: 1, deux: 2, trois: 3, quatre: 4, cinq: 5, six: 6, sept: 7, huit: 8, neuf: 9, dix: 10, onze: 11, douze: 12, treize: 13, quatorze: 14, quinze: 15, seize: 16,
  vingt: 20, vingts: 20, trente: 30, quarante: 40, cinquante: 50, soixante: 60, cent: 100, cents: 100, mille: 1000 };
function chiffresFr(t) {
  var out = [], cur = -1, tot = 0, prev = 0;
  var fin = function () { if (cur >= 0 || tot) out.push(String(tot + Math.max(cur, 0))); cur = -1; tot = 0; prev = 0; };
  norm(t || '').replace(/[^a-z0-9,]+/g, ' ').split(' ').forEach(function (w) {
    if (w === 'et' && cur >= 0) return;
    var n = NB_FR[w];
    if (n === undefined) { fin(); out.push(w); return; }
    if (cur < 0) cur = 0;
    if (n === 100) cur = (cur || 1) * 100;
    else if (n === 1000) { tot += (cur || 1) * 1000; cur = 0; }
    else if (n === 20 && prev === 4) cur += 76;                     // quatre-vingt
    else cur += n;
    prev = n;
  });
  fin();
  return out.join(' ');
}
/** Les mots du produit qu'il a VRAIMENT prononcés : Gemini recopie parfois le nom complet du catalogue dans « dit »
    (« bande de solin 2 m zinc quartz » alors qu'il a dit « bande de solin ») → on ne garde que ce qu'on retrouve dans la phrase entendue. */
function vMotsDits(dit, transcription) {
  var T = vTokens(dit);
  if (!transcription) return T;
  var tr = vTokens(chiffresFr(transcription));
  var k = T.filter(function (t) { return /^\d/.test(t) ? tr.indexOf(t) >= 0 || tr.indexOf('o' + t) >= 0 || tr.some(function (x) { return x.split('x').indexOf(t) >= 0; }) : vTokMatch(t, tr); });
  return k.length ? k : T;
}
function vMatchT(T) {
  if (!T.length) return [];
  return D().prods.filter(function (p) { var pts = vTokens(p.nom); return T.every(function (t) { return vTokMatch(t, pts); }); });
}
/** Après Gemini, l'appli vérifie elle-même, TOUJOURS de la même façon :
    tous les produits du stock qui portent les mots qu'il a dits sont proposés ; un seul → sûr ; plusieurs → elle demande lequel (jamais au hasard).
    Le produit choisi par Gemini est toujours ajouté aux choix s'il n'y est pas. */
function preciser(V) {
  var M = D();
  V.lignes.forEach(function (L) {
    if (L.op === 'supprimer' || L.op === 'dupliquer' || L.statut === 'create' || L.choisi) return;
    var T = vMotsDits(L.dit, V.transcription), m = vMatchT(T), g = L.gpid && M.prod[L.gpid] ? L.gpid : '';
    if (!m.length && g) {                                     // un mot dit n'est dans aucun nom (« bande de solin grise ») : on garde ceux du produit de Gemini
      var gt = vTokens(M.prod[g].nom), Tg = T.filter(function (t) { return vTokMatch(t, gt); });
      if (Tg.length) m = vMatchT(Tg);
    }
    if (!m.length) return;                                    // rien dans le stock : on laisse Gemini (nouveau produit, ou son choix)
    if (g && m.indexOf(M.prod[g]) < 0 && (L.gconf >= 0.5 || m.length > 1)) m = m.concat([M.prod[g]]);
    if (m.length === 1) { L.pid = m[0].id; L.statut = 'ok'; L.ambigu = false; L.cands = []; return; }
    // ordre : le nom qui porte exactement ces mots, puis le choix de Gemini, puis les plus courts (les plus « simples »)
    var exact = function (p) { var pt = vTokens(p.nom); return pt.length === T.length && pt.every(function (x) { return T.some(function (t) { return vTokMatch(t, [x]); }); }); };
    m.sort(function (a, b) { return (exact(b) - exact(a)) || ((b.id === g) - (a.id === g)) || (vTokens(a.nom).length - vTokens(b.nom).length) || (a.nom < b.nom ? -1 : 1); });
    var ids = m.map(function (p) { return p.id; });
    var mots = String(L.dit || '').split(/\s+/), garde = mots.map(function (w) { var t = vTokens(w)[0]; return t ? (T.indexOf(t) >= 0 ? 1 : 0) : -1; });
    var i0 = garde.indexOf(1), i1 = garde.lastIndexOf(1);
    if (i0 >= 0) L.dit = mots.slice(i0, i1 + 1).filter(function (w, k) { return garde[i0 + k] !== 0; }).join(' ');   // ce qu'il a vraiment dit (« bande de solin »)
    L.pid = ''; L.statut = 'check'; L.cands = ids.slice(0, 8); L.allCands = L.cands.slice(); L.ambigu = true; L.source = ''; L.nbTrouves = ids.length;
  });
}
/** Ce qui distingue chaque produit des autres (« Ø25 0,52 », « anglaise galva Ø65 1×10 »). */
function vLabels(ids, dit) {
  var M = D(), toks = ids.map(function (id) { return vTokens(M.prod[id].nom); }), T = vTokens(dit || '');
  var commun = toks[0].filter(function (t) { return toks.every(function (x) { return x.indexOf(t) >= 0; }); });
  var lab = function (nom, sans) {
    var mots = nom.split(/\s+/), k = [];
    mots.forEach(function (x, i) {
      var t = vTokens(x)[0];
      if (t) { if (!vTokMatch(t, T) && sans.indexOf(t) < 0 && !(/\d/.test(x) && /[\/.\-]/.test(x) && x.length > 8)) k.push(i); }   // codes type « ZC.0,65MM/100MM-2ML » : illisibles à voix haute
      else if (k.length && k[k.length - 1] === i - 1) k.push(i);                                   // « 2 m » : l'unité suit le nombre
    });
    while (k.length && !vTokens(mots[k[k.length - 1]])[0] && !/^(m|ml|mm|cm|kg)$/i.test(mots[k[k.length - 1]])) k.pop();
    return k.map(function (i) { return mots[i]; }).join(' ').toLowerCase();
  };
  var r = ids.map(function (id) { return lab(M.prod[id].nom, commun); });
  if (r.some(function (x) { return !x; })) r = ids.map(function (id) { return lab(M.prod[id].nom, []); });   // l'un n'a rien de plus : on garde « 2 m » pour tous
  return r.map(function (x, i) { return x || M.prod[ids[i]].nom.toLowerCase(); });
}
var FEMININS = ['bande', 'feuille', 'descente', 'gouttiere', 'ardoise', 'volige', 'latte', 'contre', 'planche', 'pointe', 'vis', 'patte', 'chatiere', 'crapaudine', 'baguette', 'tole', 'plaque', 'tuile', 'faitiere', 'rive', 'sortie', 'boite', 'chanlatte', 'colle', 'mousse', 'cheminee', 'noue', 'fenetre', 'targette', 'telecommande'];
function vFeminin(dit) { var t = vTokens(dit)[0] || ''; return FEMININS.indexOf(t) >= 0 || /(ette|ion|ure|ere)$/.test(t); }
function vListe(a) { return a.length < 2 ? a.join('') : a.slice(0, -1).join(', ') + ' ou ' + a[a.length - 1]; }
function vNom(l) { var p = D().prod[l.pid]; return l.ambigu || !l.dit ? (p ? p.nom.toLowerCase() : l.nom.toLowerCase()) : l.dit; }
/** « les bandes de solin », « les crochets » : le nom tel qu'il l'a dit, avec l'article. */
function vPluriel(dit) { var m = String(dit || '').split(/\s+/); if (m[0] && !/[sxz]$/i.test(m[0]) && m[0].length > 2) m[0] += /al$/i.test(m[0]) ? '' : 's'; return m.join(' '); }
function vLes(dit) { var d = String(dit || 'ce produit').trim(); return /^(les|des|la|le|l'|ton|tes|ta)\b/i.test(d) ? d.replace(/^des\b/i, 'les') : (vTokens(d)[0] && /s$|x$/.test(norm(d.split(/\s+/)[0])) ? 'les ' : (vFeminin(d) ? 'la ' : 'le ')) + d; }
function vEt(a) { return a.length < 2 ? a.join('') : a.slice(0, -1).join(', ') + ' et ' + a[a.length - 1]; }
/** La phrase dite à voix haute, toujours construite à partir de ce qui est affiché.
    Ordre : d'abord ce qui est fait (ordres directs), puis les réponses aux questions, puis ce qu'il doit choisir, puis ce qui est inconnu. */
function composeReponse(V) {
  var M = D(), L = V.lignes.filter(function (l) { return l.statut !== 'skip' && l.statut !== 'refus'; });
  if (!L.length) return 'Il ne reste rien à faire.';
  var pret = function (l) { return l.statut === 'ok' || l.statut === 'create'; };
  var act = L.filter(function (l) { return pret(l) && l.op !== 'info'; }), info = L.filter(function (l) { return pret(l) && l.op === 'info'; });
  var amb = L.filter(function (l) { return l.statut === 'check' && l.ambigu; }), chk = L.filter(function (l) { return l.statut === 'check' && !l.ambigu; });
  var nw = L.filter(function (l) { return l.statut === 'new'; });
  var out = [];
  // 1) ordres directs
  if (act.length > 3) out.push('J\'ai noté ' + act.length + ' mouvements.');
  else if (act.length) out.push(act.map(function (l) {
    var nom = vNom(l), q = fq(l.qte);
    if (l.op === 'sortie') return q + ' ' + nom + ' en moins' + (V.chantier ? ' pour ' + V.chantier : '');
    if (l.op === 'entree') return q + ' ' + nom + ' en plus';
    if (l.op === 'compte') return nom + ' : je mets le stock à ' + q;
    if (l.op === 'commander') return q + ' ' + nom + ' en commande';
    var m = mvById(l.mid);
    return (l.op === 'supprimer' ? 'je supprime ' : 'je refais ') + (m ? ({ entree: 'l\'entrée', sortie: 'la sortie', ajust: 'la correction' }[m.type] || 'le mouvement') + ' de ' + fq(Math.abs(num(m.delta))) + ' ' + nom : 'ce mouvement');
  }).join(', ').replace(/^./, function (c) { return c.toUpperCase(); }) + '.');
  // 2) réponses aux questions
  info.forEach(function (l) { var st = M.stock[l.pid] || 0; out.push(st > 0 ? 'Il te reste ' + fq(st) + ' ' + vNom(l) + '.' : 'Tu n\'as plus de ' + vNom(l) + '.'); });
  // 3) à choisir
  if (amb.length === 1) {
    var a1 = amb[0], f = vFeminin(a1.dit), n1 = a1.nbTrouves || a1.cands.length, qui = f ? 'Laquelle' : 'Lequel';
    var verbe = { info: '', sortie: ' tu sors', entree: ' tu rentres', compte: ' je corrige', commander: ' je commande' }[a1.op] || '';
    if (a1.cands.length <= 4) out.push('Pour ' + vLes(vPluriel(a1.dit)) + ', j\'ai trouvé ' + n1 + ' produits : ' + vListe(vLabels(a1.cands, a1.dit)) + '. ' + qui + verbe + ' ?');
    else out.push('Pour ' + vLes(vPluriel(a1.dit)) + ', j\'ai trouvé ' + n1 + ' produits : choisis ' + (f ? 'la bonne' : 'le bon') + ' à l\'écran.');
  } else if (amb.length > 1) {
    out.push(amb.map(function (l, i) { return (i ? 'pour ' : 'Pour ') + vLes(vPluriel(l.dit)) + ', ' + (i ? '' : 'j\'ai trouvé ') + (l.nbTrouves || l.cands.length) + (i ? '' : ' produits'); }).join(', et ').replace(/, et (?=[^,]*$)/, ', et ') + '. Choisis le bon à chaque fois' +
      (amb.some(function (l) { return l.op === 'info'; }) ? ', et dis-moi ce que tu veux en faire.' : '.'));
  }
  chk.forEach(function (l) { out.push(l.mvc ? 'Quel mouvement ? Choisis dans la liste.' : 'Pour ' + (l.dit || 'ce produit') + ', je pense à ' + M.prod[l.cands[0]].nom.toLowerCase() + '. C\'est bien ça ?'); });
  // 4) inconnus
  if (nw.length === 1) out.push(nw[0].op === 'info' ? 'Je n\'ai pas de ' + nw[0].nom.toLowerCase() + ' dans le stock. Je le crée ?' : 'Je ne connais pas ' + nw[0].nom.toLowerCase() + ' : je le crée ?');
  else if (nw.length > 1) out.push('Je ne connais pas ' + vEt(nw.map(function (l) { return l.nom.toLowerCase(); })) + ' : je les crée ?');
  // 5) la suite
  var questions = amb.length + chk.length + nw.length;
  if (!questions) {
    if (!act.length && info.length === 1) {
      var e = M.etat[info[0].pid];
      out.push(e === 'bas' || e === 'rupt' ? 'C\'est sous ton seuil : je le mets en commande ?' : 'Tu veux en sortir, en rentrer, corriger ou commander ?');
    } else if (act.length) out.push('Tu valides ?');
  }
  return out.join(' ');
}
/** Il répond au micro « le 25 », « l'anthracite », « le deuxième »… : l'appli choisit parmi ce qu'elle a proposé. */
function choisirParLaVoix(l, t) {
  var n = norm(t || ''), ord = [/premi/, /(deuxi|second)/, /troisi/, /quatri/, /cinqui/];
  for (var i = 0; i < ord.length; i++) if (ord[i].test(n) && l.cands[i]) return l.cands[i];
  if (/dernier/.test(n)) return l.cands[l.cands.length - 1];
  var M = D(), T = vTokens(t), all = l.cands.map(function (id) { return vTokens(M.prod[id].nom); });
  var commun = all[0].filter(function (x) { return all.every(function (y) { return y.indexOf(x) >= 0; }); });
  var sc = l.cands.map(function (id, k) { var dist = all[k].filter(function (x) { return commun.indexOf(x) < 0; }); return T.filter(function (w) { return vTokMatch(w, dist); }).length; });
  var max = Math.max.apply(null, sc);
  return max > 0 && sc.filter(function (x) { return x === max; }).length === 1 ? l.cands[sc.indexOf(max)] : '';
}
/** Choisir un produit parmi plusieurs : les autres lignes qui parlaient de la même chose suivent. */
function vChoisir(l, id) {
  l.pid = id; l.statut = 'ok'; l.source = ''; l.choisi = true;
  VOX.lignes.forEach(function (x) { if (x !== l && x.ambigu && x.statut === 'check' && norm(x.dit) === norm(l.dit) && x.cands.indexOf(id) >= 0) { x.pid = id; x.statut = 'ok'; x.choisi = true; } });
}
function voxDire() { VOX.reponse = composeReponse(VOX); saveVox(); speak(VOX.reponse); }
/** Filet si Gemini n'a rendu aucune ligne : l'appli lit elle-même « verbe + quantité + produit » dans ce qu'il a entendu. */
var MOTS_VIDES = ['de', 'des', 'du', 'la', 'le', 'les', 'un', 'une', 'en', 'au', 'aux', 'moi', 'me', 'm', 'stp', 'pour', 'dans', 'mon', 'ma', 'mes', 'stock', 'il', 'j', 'ai', 'y', 'a', 'reste', 'encore', 'combien', 'est', 'ce', 'que', 'qu', 'te', 'tu', 'peux', 'mets', 'met', 'en', 'commande'];
function phraseLocale(t) {
  var n = norm(t || '').replace(/[^a-z0-9,.\s]/g, ' ');
  if (!n.trim()) return [];
  var act = /combien|reste.?t.?il|est.ce qu.il (me )?reste/.test(n) ? 'info' : /command/.test(n) ? 'commander' : /(il me reste|il en reste|il y en a|j en ai|en tout)/.test(n) ? 'compte' :
    /(retir|sor[st]|enleve|prend|utilis|pris)/.test(n) ? 'sortie' : /(ajout|rentr|recu|livr|mets|met )/.test(n) ? 'entree' : '';
  if (!act) return [];
  var m = /(\d+(?:[.,]\d+)?)/.exec(n), qte = m ? parseFloat(m[1].replace(',', '.')) : (act === 'info' ? 0 : 1);
  var mots = n.replace(/\d+([.,]\d+)?/g, ' ').split(/\s+/).filter(function (w) { return w.length > 1 && MOTS_VIDES.indexOf(w) < 0 && !/^(retir|sor|enlev|prend|ajout|rentr|command|utilis)/.test(w); });
  if (!mots.length) return [];
  var M = D(), score = function (p) { var h = norm(p.nom); return mots.filter(function (w) { return h.indexOf(w.replace(/s$/, '')) >= 0; }).length; };
  var best = M.prods.map(function (p) { return { p: p, s: score(p) }; }).filter(function (x) { return x.s > 0; }).sort(function (a, b) { return b.s - a.s; }).slice(0, 3);
  if (!best.length) return [];
  return [{ action: act, quantite: qte, dit: mots.join(' '), produit_id: best[0].p.id, confiance: best.length === 1 || best[0].s > best[1].s ? 0.85 : 0.5, autres_ids: best.slice(1).map(function (x) { return x.p.id; }), nom_propose: '', famille_proposee: '' }];
}
A.vxPlayRec = function () { if (!VX.wav) return; try { stopSpeak(); new Audio('data:audio/wav;base64,' + VX.wav).play(); } catch (e) {} };
/* --- revenir sur un mouvement déjà enregistré (supprimer / refaire) --- */
var NOMBRES = { un: 1, une: 1, deux: 2, trois: 3, quatre: 4, cinq: 5, six: 6, sept: 7, huit: 8, neuf: 9, dix: 10 };
/** Si Gemini n'a rien rendu mais que la phrase dit « supprime / annule les N derniers (mouvements) », l'appli le fait elle-même. */
function derniersParLaVoix(t) {
  var n = norm(t || '');
  if (!/(supprim|annul|efface|enleve|retire)/.test(n) || !/dernier/.test(n)) return [];
  var m = /(\d+|un|une|deux|trois|quatre|cinq|six|sept|huit|neuf|dix)\s+dernier/.exec(n);
  var k = m ? (NOMBRES[m[1]] || parseInt(m[1], 10) || 1) : 1;
  return D().moves.filter(function (x) { return x.type !== 'depart'; }).slice(0, Math.min(k, 10))
    .map(function (x) { return { action: 'supprimer', mouvement_id: x.id, quantite: Math.abs(num(x.delta)), dit: 'les ' + k + ' derniers mouvements', produit_id: x.produit, confiance: 1, autres_ids: [] }; });
}
function mvById(id) { return D().moves.filter(function (m) { return m.id === id; })[0] || null; }
function mvAllowed(L, m) {
  if (!m || m.type === 'depart') return false;
  if (L.op === 'dupliquer') return true;
  return isPatron() || (m.qui === ME && (Date.now() - (parseIso(m.date) || 0)) < 864e5);   // même règle qu'à la main
}
function mvDesc(m) {
  var d = num(m.delta);
  return ({ entree: 'Entrée', sortie: 'Sortie', ajust: 'Correction' }[m.type] || m.type) + ' ' + (d > 0 ? '+' : '−') + fq(Math.abs(d)) + ' · ' + mvSub(m);
}
function mvLine(L, mid, pid) {
  var m = mvById(mid);
  L.qte = m ? Math.abs(num(m.delta)) : L.qte;
  if (m) { L.mid = m.id; L.pid = m.produit; L.statut = mvAllowed(L, m) ? 'ok' : 'refus'; return L; }
  // pas trouvé : on propose les derniers mouvements (de ce produit si on le connaît)
  var recent = D().moves.filter(function (x) { return x.type !== 'depart' && (!pid || x.produit === pid) && mvAllowed(L, x); }).slice(0, 4);
  L.statut = 'check'; L.mvc = true; L.cands = recent.map(function (x) { return x.id; });
  return L;
}
function voxLine(k) { return VOX && VOX.lignes.filter(function (l) { return l.k === k; })[0]; }
function voxPending() { return VOX ? VOX.lignes.filter(function (l) { return l.statut === 'check' || l.statut === 'new'; }).length : 0; }
var OPS = { entree: { s: '+', lab: 'Entrée', cls: 'in' }, sortie: { s: '−', lab: 'Sortie', cls: 'out' }, compte: { s: '=', lab: 'Recomptage', cls: 'adj' },
  info: { s: '?', lab: 'Stock', cls: 'info' }, commander: { s: '🛒', lab: 'À commander', cls: 'cmd' },
  supprimer: { s: '✕', lab: 'Supprimer', cls: 'del' }, dupliquer: { s: '×2', lab: 'Refaire', cls: 'dup' } };
function voxAfter(l, q) {
  if (l.op === 'supprimer' || l.op === 'dupliquer') { var m = mvById(l.mid), d = m ? num(m.delta) : 0; return l.op === 'supprimer' ? q - d : q + d; }
  if (l.op === 'info' || l.op === 'commander') return q;
  return l.op === 'entree' ? q + l.qte : l.op === 'sortie' ? q - l.qte : l.qte;
}

SCREENS.voixVerif = function () {
  if (!VOX) return SCREENS.voix({});
  var M = D(), V = VOX;
  var nOk = V.lignes.filter(function (l) { return (l.statut === 'ok' || l.statut === 'create') && l.op !== 'info'; }).length, left = voxPending();
  var queInfo = !nOk && !left && V.lignes.some(function (l) { return l.op === 'info' && l.statut === 'ok'; });
  var hasIn = V.lignes.some(function (l) { return l.op === 'entree' && l.statut !== 'skip'; });
  var html = '<div class="screen">' + head({ title: 'Voilà ce que j\'ai compris', backAct: 'voxBack',
    sub: esc([V.four ? 'Livraison ' + fourName(V.four) : '', V.chantier ? 'Chantier ' + V.chantier : ''].filter(Boolean).join(' · ')) }) +
    '<div class="scroll nonav" style="padding-bottom:180px">';
  html += '<div class="say" id="vxSay" data-s=""><div class="say-top"><span class="wave">' + '<i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i>' + '</span><span class="say-lab">à voix haute</span>' +
    '<button class="small-btn" data-a="voxReplay">' + ic('replay') + 'Réécouter</button></div>' +
    '<p class="say-txt">' + esc(V.reponse) + '</p>' + (V.transcription ? '<p class="say-you">Tu as dit : « ' + esc(V.transcription) + ' »</p>' : '') +
    (IS_TEST ? '<p class="say-ms" id="vxTiming">' + (V.ms ? 'compris en ' + (V.ms / 1000).toFixed(1) + ' s' + (V.modele ? ' (' + V.modele.replace(/^gemini-/, '') + ')' : '') : '') + '</p>' : '') + '<p class="say-err">La voix n\'a pas pu être chargée (connexion ou quota Gemini) : tout est écrit ci-dessus.</p></div>';
  if (hasIn && V.fourNom && !V.four) {
    html += '<div class="vcard check"><div class="vhead"><span class="dot check"></span><span>Fournisseur dit : <b>' + esc(V.fourNom) + '</b></span></div>' +
      '<span class="vq check">Il n\'est pas dans ta liste.</span><div class="btn-row"><button class="btn light" style="height:46px" data-a="voxFourNew">Ajouter</button><button class="btn light" style="height:46px" data-a="voxFourPick">Choisir</button></div>' +
      '<div class="vmini"><button data-a="voxFourNone">Sans fournisseur</button></div></div>';
  }
  var order = { check: 0, new: 1, create: 2, ok: 3, refus: 4, skip: 5 };
  V.lignes.slice().sort(function (a, b) { return order[a.statut] - order[b.statut]; }).forEach(function (l) {
    var o = OPS[l.op], said = '<span class="vsrc">Tu as dit : <b>' + esc(l.dit) + '</b> · ' + o.lab.toLowerCase() + ' ' + o.s + ' ' + fq(l.qte) + '</span>';
    if (l.mvc && l.statut === 'check') {
      html += '<div class="vcard check"><div class="vhead"><span class="dot check"></span><span class="vsrc">Tu as dit : <b>' + esc(l.dit) + '</b> · ' + o.lab.toLowerCase() + '</span></div><span class="vq check">Quel mouvement ?</span>' +
        (l.cands.length ? l.cands.map(function (id) { var m = mvById(id), pr = m && M.prod[m.produit]; return m ? '<button class="vcand" data-a="voxPickMv" data-k="' + l.k + '" data-id="' + id + '">' + esc(pr ? pr.nom : '?') + ' <span>· ' + esc(mvDesc(m)) + '</span></button>' : ''; }).join('') : '<span class="vsrc">Aucun mouvement récent trouvé.</span>') +
        '<div class="vmini"><button data-a="voxSkip" data-k="' + l.k + '">Retirer</button></div></div>';
    } else if (l.statut === 'refus') {
      html += '<div class="vcard skip"><span class="vsrc"><b>' + esc(l.dit) + '</b> : tu ne peux supprimer que tes propres mouvements de moins de 24 h (demande à Jimmy).</span><button class="link" data-a="voxSkip" data-k="' + l.k + '">OK</button></div>';
    } else if (l.statut === 'check') {
      html += '<div class="vcard check"><div class="vhead"><span class="dot check"></span>' + said + '</div><span class="vq check">' + (l.ambigu ? 'J\'ai trouvé ' + l.cands.length + ' produits : ' + (vFeminin(l.dit) ? 'laquelle' : 'lequel') + ' ?' : 'Je pense que c\'est :') + '</span>' +
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
    } else if (l.op === 'info' && l.statut === 'ok') {
      var pi = M.prod[l.pid], qi = M.stock[l.pid] || 0, si = num(pi.seuil), ci = M.cmd[l.pid];
      html += '<div class="vcard ok vx-info"><div class="vxi-top"><span class="grow"><span class="t">' + esc(pi.nom) + '</span><span class="s">' + (si > 0 ? 'seuil ' + fq(si) + ' · ' : '') + esc(fourName(pi.four) || '') + '</span></span>' +
        '<span class="vxi-q ' + (M.etat[l.pid] || '') + '"><b>' + fq(qi) + '</b><small>en stock' + (pi.unite ? ' (' + esc(pi.unite) + ')' : '') + '</small></span></div>' +
        (ci ? '<div class="vxi-cmd">Déjà dans la commande : ' + fq(num(ci.qte)) + '</div>' : '') +
        '<div class="vxi-acts"><button class="out" data-a="voxInfoAct" data-k="' + l.k + '" data-op="sortie">− Sortie</button><button class="in" data-a="voxInfoAct" data-k="' + l.k + '" data-op="entree">+ Entrée</button>' +
        '<button class="adj" data-a="voxInfoAct" data-k="' + l.k + '" data-op="compte">= Corriger</button><button class="cmd" data-a="voxInfoAct" data-k="' + l.k + '" data-op="commander">' + ic('bell') + 'Commander</button></div>' +
        (l.allCands ? '<button class="link vxi-chg" data-a="voxRechoisir" data-k="' + l.k + '">Ce n\'est pas celui-là : changer de produit</button>' : '') + '</div>';
    } else {
      var p = l.statut === 'create' ? { nom: l.nom } : M.prod[l.pid], q = l.statut === 'create' ? 0 : (M.stock[l.pid] || 0);
      var mvm = l.mid ? mvById(l.mid) : null;
      var info = mvm ? o.lab + ' : ' + mvDesc(mvm) : [o.lab, l.op === 'entree' && V.four ? fourName(V.four) : '', l.op === 'sortie' && V.chantier ? 'Chantier ' + V.chantier : '', l.source === 'appris' ? 'reconnu (déjà dit)' : ''].filter(Boolean).join(' · ');
      if (l.op === 'commander') info = 'À commander · ajouté à la liste, le stock ne change pas';
      html += '<button class="vcard ok vxl" data-a="voxMenu" data-k="' + l.k + '"><span class="vxq ' + o.cls + '">' + (mvm ? o.s : l.op === 'commander' ? '+' + fq(l.qte) : o.s + fq(l.qte)) + '</span><span class="grow"><span class="t">' + esc(p ? p.nom : '?') +
        (l.statut === 'create' ? ' <span class="badge" style="background:#DCE6FF;color:#1E3A8A">nouveau</span>' : '') + '</span>' +
        '<span class="s">' + esc(info) + ' · stock ' + fq(q) + ' → ' + fq(voxAfter(l, q)) + '</span></span></button>';
    }
  });
  if (V.lignes.some(function (l) { return l.statut === 'ok'; })) html += '<p style="text-align:center;font-size:13px;color:var(--muted);margin:6px 0 0">Touche une ligne pour la corriger ou la retirer</p>';
  html += '<button class="btn light" style="margin-top:14px" data-a="voxCancel">' + ic('trash') + 'Tout annuler</button></div>' +
    '<div class="bottom-bar"><div style="text-align:center;font-size:14px;font-weight:600;margin-bottom:8px;color:' + (left ? '#7A3D00' : 'var(--green-ink)') + '">' +
    (left ? 'Encore ' + left + ' point' + (left > 1 ? 's' : '') + ' à regarder' : queInfo ? 'Rien n\'est modifié dans le stock' : nOk + ' ligne' + (nOk > 1 ? 's' : '') + ' prête' + (nOk > 1 ? 's' : '')) + '</div>' +
    '<div class="vx-bar"><button class="vx-more" data-a="voxMore" aria-label="Compléter à la voix">' + ic('mic') + '</button>' +
    (queInfo ? '<button class="btn" style="height:62px;font-size:22px" data-a="voxDone">OK, merci</button>' :
    '<button class="btn green" style="height:62px;font-size:22px" data-a="voxValidate" ' + (left || !nOk ? 'disabled' : '') + '>Valider ' + (nOk > 1 ? 'les ' + nOk + ' lignes' : 'la ligne') + '</button>') + '</div></div></div>';
  return html;
};
function voxSet(k, fn) { var l = voxLine(k); if (!l) return; fn(l); saveVox(); render(false); }
A.voxReplay = function () { audioCtx(); if (VOX) speak(VOX.reponse); };
/** Ce que le téléphone sait déjà (catalogue, stock, fournisseurs, familles) : envoyé avec la voix, le script n'a plus à lire le Sheet. */
function voixCtx() {
  var M = D();
  return {
    catalogue: M.prods.map(function (p) { return p.id + ' | ' + upName(p.nom) + ' | ' + p.famille + ' | ' + round3(M.stock[p.id] || 0) + ' | ' + (p.four && M.four[p.four] ? M.four[p.four].nom : '') + ' | ' + (num(p.seuil) > 0 ? round3(num(p.seuil)) : ''); }).join('\n'),
    fournisseurs: M.foursActifs.map(function (f) { return f.id + ' | ' + f.nom; }).join('\n'),
    familles: M.fams.map(function (f) { return f.id + ' | ' + f.nom; }).join('\n'),
    mouvements: M.moves.filter(function (m) { return m.type !== 'depart'; }).slice(0, 30).map(function (m) {
      var pr = M.prod[m.produit], d = num(m.delta);
      return m.id + ' | ' + fdate(m.date) + ' | ' + ({ entree: 'entrée', sortie: 'sortie', ajust: 'correction' }[m.type] || m.type) + ' | ' + (d > 0 ? '+' : '−') + fq(Math.abs(d)) +
        ' | ' + (pr ? upName(pr.nom) : '?') + ' | ' + (m.type === 'entree' && m.fournisseur ? fourName(m.fournisseur) : (m.lieu || '')) + ' | ' + userName(m.qui);
    }).join('\n')
  };
}
A.voxBack = function () { A.voxCancel(); };
A.voxPickMv = function (d) { voxSet(d.k, function (l) { var m = mvById(d.id); if (!m) return; l.mid = m.id; l.pid = m.produit; l.qte = Math.abs(num(m.delta)); l.statut = 'ok'; l.mvc = false; }); };
A.voxPick = function (d) { var l = voxLine(d.k); if (!l) return; vChoisir(l, d.id); voxDire(); render(false); };
A.voxRechoisir = function (d) { closeSheet(); voxSet(d.k, function (l) { if (!l.allCands) return; l.pid = ''; l.statut = 'check'; l.cands = l.allCands.slice(); l.choisi = false; }); voxDire(); render(false); };
A.voxInfoAct = function (d) {
  var l = voxLine(d.k), p = l && D().prod[l.pid]; if (!p) return;
  var t = { sortie: 'Combien tu en sors ?', entree: 'Combien tu en rentres ?', compte: 'Combien il y en a vraiment ?', commander: 'Combien à commander ?' }[d.op];
  askNumber({ title: t, text: p.nom, value: d.op === 'commander' ? defQty(p) : d.op === 'compte' ? (D().stock[p.id] || 0) : 1 }).then(function (n) {
    if (n === null || n === undefined || !(n >= 0)) return;
    voxSet(d.k, function (x) { x.op = d.op; x.qte = n; }); voxDire();
  });
};
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
  var l0 = voxLine(d.k);
  if (l0.mid) {
    var m0 = mvById(l0.mid);
    openSheet('<h3>' + OPS[l0.op].lab + '</h3><p>' + esc(m0 ? ((D().prod[m0.produit] || {}).nom || '') + ' · ' + mvDesc(m0) : '') + '</p>' +
      '<button class="menu-item" data-a="voxMvOther" data-k="' + l0.k + '">' + ic('history') + 'Un autre mouvement</button>' +
      '<button class="menu-item" data-a="voxSkipSheet" data-k="' + l0.k + '">' + ic('x') + 'Retirer cette ligne</button>');
    return;
  }
  var l = l0, nm = l.statut === 'create' ? l.nom : (D().prod[l.pid] || {}).nom || '';
  openSheet('<h3>' + esc(nm) + '</h3><p>Tu as dit : ' + esc(l.dit) + '</p>' +
    '<div class="seg3">' + ['entree', 'sortie', 'compte', 'commander'].map(function (op) { return '<button class="' + (l.op === op ? 'on ' + OPS[op].cls : '') + '" data-a="voxOp" data-k="' + l.k + '" data-op="' + op + '">' + OPS[op].s + ' ' + OPS[op].lab + '</button>'; }).join('') + '</div>' +
    '<button class="menu-item" data-a="voxQty" data-k="' + l.k + '">' + ic('edit') + 'Modifier la quantité (' + fq(l.qte) + ')</button>' +
    (l.allCands ? '<button class="menu-item" data-a="voxRechoisir" data-k="' + l.k + '">' + ic('replay') + 'Revoir le choix (' + l.allCands.length + ' produits)</button>' : '') +
    '<button class="menu-item" data-a="voxChange" data-k="' + l.k + '">' + ic('stock') + 'Ce n\'est pas ce produit</button>' +
    (l.statut === 'create' ? '<button class="menu-item" data-a="voxRename" data-k="' + l.k + '">' + ic('tag') + 'Changer le nom ou la famille</button>' : '') +
    '<button class="menu-item" data-a="voxSkipSheet" data-k="' + l.k + '">' + ic('x') + 'Retirer cette ligne</button>');
};
A.voxMvOther = function (d) { closeSheet(function () { voxSet(d.k, function (l) { var pid = l.pid; l.mid = ''; mvLine(l, '', pid); }); }); };
A.voxOp = function (d) { closeSheet(function () { voxSet(d.k, function (l) { l.op = d.op; }); voxDire(); }); };
A.voxChange = function (d) { closeSheet(function () { A.voxOther(d); }); };
A.voxRename = function (d) { closeSheet(function () { A.voxName(d); }); };
A.voxSkipSheet = function (d) { closeSheet(function () { A.voxSkip(d); }); };
A.voxQty = function (d) {
  var l = voxLine(d.k);
  closeSheet(function () {
    askNumber({ title: OPS[l.op].lab + ' : quelle quantité ?', value: l.qte }).then(function (n) { if (n === null || n === undefined || !(n >= 0)) return; voxSet(d.k, function (x) { x.qte = n; }); voxDire(); });
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
A.voxToCmd = function (d) { A.voxInfoAct({ k: d.k, op: 'commander' }); };
A.voxDone = function () { stopSpeak(); VOX = null; saveVox(); go('home', {}, { replace: true }); };
A.voxValidate = function () {
  audioCtx();
  var V = VOX, M = D(); if (!V || voxPending()) return;
  var now = nowIso(), ops = [], n = 0, inv = M.invEnCours;
  V.lignes.forEach(function (l) {
    if (l.statut !== 'ok' && l.statut !== 'create') return;
    var pid = l.pid;
    if (l.op === 'supprimer' || l.op === 'dupliquer') {
      var mv = mvById(l.mid); if (!mv) return;
      if (l.op === 'supprimer') ops.push(del('Mouvements', mv.id));
      else ops.push(put('Mouvements', { id: uid('m'), date: now, produit: mv.produit, delta: mv.delta, type: mv.type, qui: ME, lieu: mv.lieu || '', fournisseur: mv.fournisseur || '', prix: mv.prix || '', note: 'voix' }));
      n++; return;
    }
    if (l.statut === 'create') {
      pid = uid('p');
      ops.push(put('Produits', { id: pid, nom: upName(l.nom), famille: l.famille, unite: '', seuil: '0', four: l.op === 'entree' && V.four ? V.four : '', ref: '', notes: '', actif: '1', cree: now }));
    }
    var q = l.statut === 'create' ? 0 : (M.stock[pid] || 0);
    if (l.op === 'info') return;
    if (l.op === 'commander') { ops.push(cmdAdd(pid, l.qte)); n++; return; }
    if (l.op === 'entree') ops.push(put('Mouvements', { id: uid('m'), date: now, produit: pid, delta: String(round3(l.qte)), type: 'entree', qui: ME, lieu: V.four ? 'Livraison (à la voix)' : 'À la voix', fournisseur: V.four || '', prix: '', note: 'voix' }));
    else if (l.op === 'sortie') ops.push(put('Mouvements', { id: uid('m'), date: now, produit: pid, delta: String(-round3(l.qte)), type: 'sortie', qui: ME, lieu: V.chantier || 'À la voix', fournisseur: '', prix: '', note: 'voix' }));
    else if (inv) ops.push(put('Comptages', { id: inv.id + '_' + pid, inventaire: inv.id, produit: pid, compte: String(l.qte), qui: ME, date: now }));
    else if (round3(l.qte - q) !== 0) ops.push(put('Mouvements', { id: uid('m'), date: now, produit: pid, delta: String(round3(l.qte - q)), type: 'ajust', qui: ME, lieu: 'Recomptage à la voix', fournisseur: '', prix: '', note: 'voix' }));
    if (l.dit && !l.ambigu && !l.choisi) ops.push(put('Alias', { id: 'a' + hashKey(voxKey(l.dit)), fournisseur: 'voix', libelle: voxKey(l.dit).slice(5), produit: pid, facteur: '1', maj: now }));
    n++;
  });
  // la confirmation part TOUT DE SUITE (déjà dans le téléphone), avant l'enregistrement et le retour à l'accueil
  AUD.garde = true; speak(phraseOk(true), { fixe: true });
  commit(ops);
  VOX = null; saveVox();
  toast('C\'est fait', n + ' ligne' + (n > 1 ? 's' : '') + (inv && V.mode === 'inv' ? ' comptée' + (n > 1 ? 's' : '') + ' dans le recomptage' : ' enregistrée' + (n > 1 ? 's' : '')));
  AUD.garde = true; go('home', {}, { replace: true }); AUD.garde = false;
};

/* ================= Réglages : voix de l'appli ================= */

var VOIX_CHOIX = [['Achird', 'amical', 'h'], ['Puck', 'enjoué', 'h'], ['Charon', 'posé', 'h'], ['Algenib', 'grave', 'h'],
  ['Sulafat', 'chaleureuse', 'f'], ['Kore', 'ferme', 'f'], ['Aoede', 'légère', 'f'], ['Leda', 'jeune', 'f']];
function voixCard() {
  var cur = voiceName() || 'Achird';
  var btn = function (v) { return '<button class="' + v[2] + (v[0] === cur ? ' on' : '') + '" data-a="voixPick" data-v="' + v[0] + '"><b>' + v[0] + '</b><span>' + v[1] + '</span></button>'; };
  return '<div class="card"><div class="card-title"><h2>Voix de l\'appli</h2></div><p style="font-size:13px;color:var(--muted);margin:2px 0 10px">Une vraie voix (Gemini), pas celle du téléphone. Touche pour écouter et choisir.</p>' +
    '<div class="voix-lab h">Voix d\'homme</div><div class="voix-grid">' + VOIX_CHOIX.filter(function (v) { return v[2] === 'h'; }).map(btn).join('') + '</div>' +
    '<div class="voix-lab f">Voix de femme</div><div class="voix-grid">' + VOIX_CHOIX.filter(function (v) { return v[2] === 'f'; }).map(btn).join('') + '</div></div>';
}
A.voixPick = function (d) {
  audioCtx(); stopSpeak();
  if (voiceName() !== d.v) commit(put('Reglages', { id: 'voix', valeur: d.v }));
  var grid = document.querySelector('.voix-grid');
  if (grid) { [].forEach.call(document.querySelectorAll('.voix-grid button'), function (b) { b.classList.toggle('on', b.getAttribute('data-v') === d.v); b.classList.remove('load'); }); var me_ = document.querySelector('.voix-grid [data-v="' + d.v + '"]'); if (me_) me_.classList.add('load'); }
  speak(PHRASE_ESSAI, { fixe: true, voix: d.v });
};
A.vxOpen = function () {
  audioCtx(); recCancel(); VX = { st: 'idle', mode: 'mvt', err: '', said: '', append: false }; go('voix', {});
  call('ping', [CFG.code], 15000).catch(function () {});        // réveille le script dès l'ouverture
  liveToken().catch(function () {});                            // jeton de voix prêt à l'avance
  prechargerOk();
};
