/* Harmo Web — base: notas, acordes, transposição, piano (mesma conta do SynthCore do app) e telinhas. */
'use strict';
const SHARP = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const FLAT = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];
const NOTE_PC = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
const $ = (s, r) => (r || document).querySelector(s);
const $$ = (s, r) => [...(r || document).querySelectorAll(s)];
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function pcOf(n) { if (!n) return -1; let p = NOTE_PC[n[0].toUpperCase()]; if (p == null) return -1; for (const ch of n.slice(1)) { if (ch === '#') p++; else if (ch === 'b') p--; } return (p + 12) % 12; }

/** Tom: 0..11 maior, 12..23 menor (como no app). */
function parseKey(s) { if (!s) return -1; const m = String(s).trim().match(/^([A-G][#b]?)(m?)/); if (!m) return -1; const p = pcOf(m[1]); return p < 0 ? -1 : p + (m[2] ? 12 : 0); }
function flatKey(k) { if (k < 0) return false; const p = k % 12; return k < 12 ? [5, 10, 3, 8, 1, 6].includes(p) : [2, 7, 0, 5, 10, 3].includes(p); }
function keyName(k) { if (k < 0) return '?'; const nm = flatKey(k) ? FLAT : SHARP; return nm[k % 12] + (k >= 12 ? 'm' : ''); }

/** Acorde → {root, suf, bass, minor}. */
const CHORD_RE = /^([A-G][#b]?)([^/\s]*)(?:\/([A-G][#b]?))?$/;
function parseChord(t) {
  t = String(t).replace(/^§/, '').replace(/[()]/g, m => m); const m = t.match(CHORD_RE); if (!m) return null;
  const suf = m[2];
  if (suf && !/^(m|M|maj|min|dim|aug|sus|add|°|º|ø|\+|\d|\(|-|7M|b|#|\))/.test(suf)) return null;
  if (/[a-ln-z]{4,}/i.test(suf.replace(/maj|dim|aug|sus|add|min/gi, ''))) return null;
  const minor = /^(m(?!aj)|min|-)/.test(suf);
  return { root: pcOf(m[1]), suf, bass: m[3] ? pcOf(m[3]) : pcOf(m[1]), hasBass: !!m[3], minor, text: t };
}
function isChordTok(t) { t = t.replace(/^§/, ''); if (/^\(?[A-G][#b]?[^\s]*\)?$/.test(t)) return !!parseChord(t.replace(/^\(|\)$/g, '')); return false; }
function transChord(t, semi, flats) {
  const mark = t.startsWith('§') ? '§' : ''; let body = mark ? t.slice(1) : t;
  const pre = body.match(/^\(*/)[0], post = body.match(/\)*$/)[0]; body = body.slice(pre.length, body.length - post.length || undefined);
  const c = body.match(CHORD_RE); if (!c) return t;
  const nm = flats ? FLAT : SHARP; const r = nm[(pcOf(c[1]) + semi + 120) % 12];
  return mark + pre + r + c[2] + (c[3] ? '/' + nm[(pcOf(c[3]) + semi + 120) % 12] : '') + post;
}
/** As notas (pc) de um acorde escrito, pro som. */
function chordPcs(t) {
  const c = parseChord(String(t).replace(/^§/, '').replace(/^\(|\)$/g, '')); if (!c) return null;
  const s = c.suf.replace(/\(|\)/g, ''); const r = c.root; let iv;
  if (/^(°|º|dim)/.test(s)) iv = /7/.test(s) || s === '°' || s === 'º' ? [0, 3, 6, 9] : [0, 3, 6];
  else if (/m7b5|ø|m7\(b5\)/.test(c.suf)) iv = [0, 3, 6, 10];
  else if (/^(\+|aug)/.test(s) || /^5\+|#5/.test(s) && !c.minor) iv = [0, 4, 8];
  else if (c.minor) iv = [0, 3, 7];
  else if (/sus2|^2/.test(s)) iv = [0, 2, 7];
  else if (/sus|^4|^7\(?4|7sus4/.test(s)) iv = [0, 5, 7];
  else iv = [0, 4, 7];
  if (/7M|maj7|M7/.test(c.suf)) iv.push(11);
  else if (/7/.test(s) && !iv.includes(9)) iv.push(10);
  if (/(^|[^1])6/.test(s)) iv.push(9);
  if (/9/.test(s)) iv.push(/b9/.test(s) ? 1 : 2);
  if (/#5/.test(s) && iv.includes(7)) iv[iv.indexOf(7)] = 8;
  if (/b5/.test(s) && iv.includes(7)) iv[iv.indexOf(7)] = 6;
  return { pcs: [...new Set(iv.map(i => (r + i) % 12))], bass: c.bass, root: r };
}

// ---------------- guardar no aparelho ----------------
const store = {
  get(k, d) { try { const v = localStorage.getItem('harmo:' + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem('harmo:' + k, JSON.stringify(v)); return true; } catch (e) { toast('Sem espaço pra salvar'); return false; } },
};


// ---------------- piano (port do SynthCore) ----------------
let AC, OUT; const BUF = {}; let timers = [], LIVE = [];
function audio() {
  if (!AC) {
    AC = new (window.AudioContext || window.webkitAudioContext)();
    const comp = AC.createDynamicsCompressor(); comp.threshold.value = -10; comp.ratio.value = 4; comp.connect(AC.destination);
    OUT = AC.createGain(); OUT.connect(comp);
    const len = AC.sampleRate * 1.6 | 0, ir = AC.createBuffer(2, len, AC.sampleRate);
    for (let c = 0; c < 2; c++) { const d = ir.getChannelData(c); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3) * .5; }
    const cv = AC.createConvolver(); cv.buffer = ir; const wet = AC.createGain(); wet.gain.value = .22; OUT.connect(cv); cv.connect(wet); wet.connect(comp);
  }
  if (AC.state === 'suspended') AC.resume();
  return AC;
}
// iPhone: o som só liga depois de um toque
['touchend', 'click'].forEach(ev => document.addEventListener(ev, () => { try { audio(); } catch (e) {} }, { once: true, passive: true }));
function pianoBuf(midi, vel) {
  const key = midi + '_' + vel; if (BUF[key]) return BUF[key];
  const SR = AC.sampleRate, secs = midi < 48 ? 4 : 3, N = Math.floor(SR * secs), b = AC.createBuffer(1, N, SR), y = b.getChannelData(0);
  const f = 440 * Math.pow(2, (midi - 69) / 12), B = Math.max(.00005, Math.min(.002, .0001 * Math.pow(2, (midi - 48) / 18))), tau1 = Math.max(.9, Math.min(9, 8 * Math.pow(2, -(midi - 36) / 16)));
  const br = .5, bright = Math.min(1.4, (.35 + .5 * vel) * (.4 + 1.2 * br)), cut = 2500 + 4000 * br; const P = [];
  for (let n = 1; n <= 8; n++) {
    const fn = n * f * Math.sqrt(1 + B * n * n); if (fn > cut) break;
    const a = Math.pow(n, -(2.3 - 1.1 * bright)) * (Math.abs(Math.sin(Math.PI * n / 7.5)) + .15), tn = tau1 / (1 + .45 * (n - 1));
    P.push({ w: 2 * Math.PI * fn / SR, w2: n <= 3 ? 2 * Math.PI * fn * (1 + .0007 + .0002 * (n - 1)) / SR : 0, ph2: .25 * (n - 1) * 2 * Math.PI, aF: a * .55, aS: a * .45, mF: Math.exp(-1 / (SR * tn / 5)), mS: Math.exp(-1 / (SR * tn)) });
  }
  let noise = .18 * vel; const nm = Math.exp(-1 / (SR * .007)), lpA = Math.min(.9, 2 * Math.PI * Math.min(4000, f * 6) / SR), kf = .2 + .3 * br; let lp = 0, ml = 0, atk = 0;
  for (let i = 0; i < N; i++) {
    let v = 0; for (const p of P) { const a = p.aF + p.aS; v += p.w2 ? a * .5 * (Math.sin(p.w * i) + Math.sin(p.w2 * i + p.ph2)) : a * Math.sin(p.w * i); p.aF *= p.mF; p.aS *= p.mS; }
    if (noise > 1e-4) { lp += lpA * ((Math.random() * 2 - 1) * noise - lp); v += lp; noise *= nm; }
    atk = Math.min(1, atk + 1 / (SR * .002)); v *= atk * vel * .2; ml += kf * (v - ml); y[i] = Math.tanh(ml * 1.6 * .9);
  }
  return BUF[key] = b;
}
function note(midi, t, d, vel) {
  audio(); t = t || AC.currentTime + .04; d = d || 1.5;
  const s = AC.createBufferSource(); s.buffer = pianoBuf(midi, vel || .7); const g = AC.createGain(); s.connect(g); g.connect(OUT);
  const td = midi < 48 ? .2 : midi < 72 ? .12 : .08; g.gain.setValueAtTime(1, t + d); g.gain.setTargetAtTime(0, t + d, td / 3); s.start(t); s.stop(t + d + td * 3);
  LIVE.push({ s, g, end: t + d + td * 3 }); if (LIVE.length > 200) LIVE = LIVE.filter(x => x.end > AC.currentTime);
}
function playPcs(pcs, bass, t, d) { audio(); t = t || AC.currentTime + .05; d = d || 1.6; pcs.map(p => 55 + ((p - 55) % 12 + 12) % 12).sort((a, b) => a - b).forEach((m, i) => note(m, t + i * .012, d, .62)); if (bass != null && bass >= 0) note(36 + bass, t, d, .7); }
function playChord(t, when, d) { const c = chordPcs(t); if (c) playPcs(c.pcs, c.bass, when, d); }
/** Para tudo: o que ia tocar não toca, e o que está soando abafa rápido. */
function stopSeq() { timers.forEach(clearTimeout); timers = []; if (!AC) return; const now = AC.currentTime;
  for (const x of LIVE) { if (x.end <= now) continue; try { x.g.gain.cancelScheduledValues(now); x.g.gain.setValueAtTime(x.g.gain.value, now); x.g.gain.setTargetAtTime(0, now, .03); x.s.stop(now + .2); } catch (e) {} }
  LIVE = []; }
/** Toca uma lista de acordes (texto) em sequência; onStep(i) acende o atual (-1 no fim). */
function playSeq(list, onStep, step) {
  audio(); stopSeq(); step = step || 1; const t0 = AC.currentTime + .08;
  list.forEach((c, i) => { playChord(c, t0 + i * step, step * 1.3); if (onStep) timers.push(setTimeout(() => onStep(i), i * step * 1000 + 80)); });
  if (onStep) timers.push(setTimeout(() => onStep(-1), list.length * step * 1000 + 400));
}
function playScale(pcs, root) { audio(); let last = -1; const ms = []; for (const p of pcs) { let m = 60 + p; while (m <= last) m += 12; ms.push(m); last = m; } ms.push(60 + pcs[0] + 12); const t0 = AC.currentTime + .05; ms.forEach((m, i) => note(m, t0 + i * .3, .45, .6)); }

// ---------------- telinhas ----------------
function toast(msg) { let t = $('#toast'); if (!t) { t = document.createElement('div'); t.id = 'toast'; document.body.appendChild(t); } t.textContent = msg; t.classList.add('on'); clearTimeout(t._h); t._h = setTimeout(() => t.classList.remove('on'), 2200); }
/** Lista que sobe de baixo. items: [{icon,title,sub,color,on}] → onPick(i). */
function sheet(title, html, onOpen) {
  closeSheet(); const bg = document.createElement('div'); bg.className = 'sheetbg'; bg.onclick = e => { if (e.target === bg) closeSheet(); };
  bg.innerHTML = `<div class="sheet"><div class="grab"></div>${title ? `<div class="sh-t">${title}</div>` : ''}<div class="sh-b">${html}</div></div>`;
  document.body.appendChild(bg); requestAnimationFrame(() => bg.classList.add('on')); if (onOpen) onOpen($('.sheet', bg)); return bg;
}
function closeSheet() { $$('.sheetbg').forEach(b => b.remove()); stopSeq(); }
const ICONS = {
  tuner: '<path d="M4.5 16a8 8 0 1 1 15 0"/><path d="M12 16l3.5-5.5"/><circle cx="12" cy="16" r="1.4" fill="currentColor"/>',
  note: '<path d="M9 17.5V6l10-2v11.5"/><circle cx="6.5" cy="17.5" r="2.5"/><circle cx="16.5" cy="15.5" r="2.5"/>',
  book: '<path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5z"/><path d="M4 20.5A2.5 2.5 0 0 1 6.5 18H20v3H6.5"/>',
  search: '<circle cx="11" cy="11" r="6.5"/><path d="M16 16l4.5 4.5"/>',
  back: '<path d="M15 5l-7 7 7 7"/>', close: '<path d="M6 6l12 12M18 6L6 18"/>',
  wand: '<path d="M5 19L17 7"/><path d="M15 5l4 4"/><path d="M19 3v3M20.5 4.5h-3M7 3v2M8 4H6"/>',
  grid: '<rect x="4" y="4" width="6.5" height="6.5" rx="1.5"/><rect x="13.5" y="4" width="6.5" height="6.5" rx="1.5"/><rect x="4" y="13.5" width="6.5" height="6.5" rx="1.5"/><rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.5"/>',
  scale: '<path d="M4 18h3v-4h3v-4h3V6h3V3"/>', arp: '<path d="M5 19l4-7 4 4 6-11"/><circle cx="5" cy="19" r="1.6"/><circle cx="9" cy="12" r="1.6"/><circle cx="13" cy="16" r="1.6"/><circle cx="19" cy="5" r="1.6"/>',
  star: '<circle cx="12" cy="12" r="2.4"/><circle cx="12" cy="4" r="1.8"/><circle cx="19" cy="16" r="1.8"/><circle cx="5" cy="16" r="1.8"/><path d="M12 6v3.6M17.4 15l-3.3-1.8M6.6 15l3.3-1.8"/>',
  circle: '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4.2"/>', path: '<circle cx="5" cy="6" r="2"/><circle cx="19" cy="18" r="2"/><path d="M7 6h6a3 3 0 0 1 0 6h-2a3 3 0 0 0 0 6h6"/>',
  tri: '<path d="M12 4l8 14H4z"/><path d="M12 20l-8-14h16z" opacity=".55"/>', dom: '<path d="M12 3v4M12 17v4M3 12h4M17 12h4"/><circle cx="12" cy="12" r="4"/>',
  modes: '<rect x="3" y="5" width="7" height="5" rx="1"/><rect x="14" y="5" width="7" height="5" rx="1"/><rect x="8.5" y="14" width="7" height="5" rx="1"/><path d="M10 7.5h4M12 10v4"/>',
  piano: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M8 5v14M13 5v14M18 5v14" opacity=".6"/><path d="M6.5 5v8M11.5 5v8M16.5 5v8" stroke-width="3"/>',
  tree: '<circle cx="12" cy="5" r="2"/><circle cx="5" cy="18" r="2"/><circle cx="12" cy="18" r="2"/><circle cx="19" cy="18" r="2"/><path d="M12 7v9M11 7l-5 9M13 7l5 9"/>',
  pyr: '<circle cx="12" cy="4.5" r="2"/><circle cx="7" cy="12" r="2"/><circle cx="17" cy="12" r="2"/><circle cx="4" cy="19.5" r="2"/><circle cx="12" cy="19.5" r="2"/><circle cx="20" cy="19.5" r="2"/><path d="M11 6l-3 4M13 6l3 4M6 14l-1.4 3.6M8 14l3 4M16 14l-3 4M18 14l1.4 3.6"/>',
  dl: '<path d="M12 4v11M7 10l5 5 5-5M5 20h14"/>', trash: '<path d="M5 7h14M10 7V4h4v3M7 7l1 13h8l1-13"/>', share: '<path d="M12 15V4M8 8l4-4 4 4"/><path d="M6 12v7h12v-7"/>',
  plus: '<path d="M12 5v14M5 12h14"/>', play: '<path d="M8 5l11 7-11 7z" fill="currentColor"/>', undo: '<path d="M9 14L4 9l5-5"/><path d="M4 9h11a5 5 0 0 1 0 10h-3"/>',
};
function icon(n, size) { return `<svg class="ic" viewBox="0 0 24 24" width="${size || 24}" height="${size || 24}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${ICONS[n] || ''}</svg>`; }
/** Cartão no estilo TintCard do app (lista): cor, ícone, título, sub. */
function tint(o) { return `<button class="tint" style="--c:${o.color}" ${o.attrs || ''}><span class="tq">${o.glyph ? `<b>${o.glyph}</b>` : icon(o.icon || 'note', 22)}</span><span class="tt"><b>${esc(o.title)}</b>${o.sub ? `<small>${esc(o.sub)}</small>` : ''}</span><span class="ta">›</span></button>`; }
/** Botão grande "vidro escuro" (atalhos do Início). */
function glass(o) { return `<button class="glass${o.wide ? ' wide' : ''}" style="--c:${o.color}" ${o.attrs || ''}><span class="gq">${icon(o.icon, 30)}</span><b>${o.title}</b></button>`; }
