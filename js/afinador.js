/* Harmo Web — Afinador cromático (port do TunerPage/TunerPitch do app): nota grande, ponteiro ♭/♯ (±50 cents) e as 12 notas.
   Ouve pelo microfone; nada é gravado. Altura pelo método de McLeod com peso Hann (~1 cent). */
'use strict';
const T_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
let TUN = null;
function tunerPitch(x, off, SR, W, TMAX, TMIN, WIN, n) {
  let e = 0; for (let j = 0; j < W; j++) e += x[off + j] * x[off + j];
  if (Math.sqrt(e / W) < 0.003) return { f: -1, rms: Math.sqrt(e / W) };
  const wx = new Float64Array(W); let ex0 = 0;
  for (let j = 0; j < W; j++) { wx[j] = WIN[j] * x[off + j]; ex0 += wx[j] * x[off + j]; }
  for (let tau = 0; tau <= TMAX + 1; tau++) {
    let r = 0, m = 0; const o = off + tau;
    for (let j = 0; j < W; j++) { const y = x[o + j]; r += wx[j] * y; m += WIN[j] * y * y; }
    m += ex0; n[tau] = m > 0 ? 2 * r / m : 0;
  }
  let t = 1; while (t < TMAX && n[t] > 0) t++;
  let best = 0; const pk = [];
  while (t < TMAX && pk.length < 64) {
    while (t < TMAX && n[t] <= 0) t++;
    let mi = -1; while (t < TMAX && n[t] > 0) { if (mi < 0 || n[t] > n[mi]) mi = t; t++; }
    if (mi >= TMIN && mi > 0) { pk.push(mi); best = Math.max(best, n[mi]); }
  }
  if (!pk.length || best < 0.5) return { f: -1, rms: Math.sqrt(e / W) };
  let pick = pk[0]; for (const p of pk) if (n[p] >= 0.9 * best) { pick = p; break; }
  const a = n[pick - 1], b = n[pick], c = n[pick + 1], den = a - 2 * b + c;
  const p = pick + (den !== 0 ? 0.5 * (a - c) / den : 0);
  return { f: SR / p, clarity: b, rms: Math.sqrt(e / W) };
}

function afinadorPage(page) {
  page.innerHTML = header('Afinador', { back: '' }) + `<div class="scroll"><div class="center" style="gap:16px;align-items:center">
    <div id="tn" style="font-size:96px;font-weight:900;line-height:1;color:#8A8F98">–</div>
    <div id="tf" style="color:var(--mut);font-size:15px;height:20px"></div>
    <svg id="tg" viewBox="-160 -150 320 175" width="100%" style="max-width:420px">
      <path d="M-130,0 A130,130 0 0 1 130,0" fill="none" stroke="#2A2D34" stroke-width="14" stroke-linecap="round"/>
      ${[-50, -40, -30, -20, -10, 0, 10, 20, 30, 40, 50].map(c => { const a = (c / 50 * 30 - 90) * Math.PI / 180, r1 = c === 0 ? 100 : 108, r2 = 122; return `<line x1="${Math.cos(a) * r1}" y1="${Math.sin(a) * r1}" x2="${Math.cos(a) * r2}" y2="${Math.sin(a) * r2}" stroke="${c === 0 ? '#3DDC84' : '#5A5E66'}" stroke-width="${c === 0 ? 4 : 2}"/>`; }).join('')}
      <text x="-118" y="20" fill="#8A8F98" font-size="20" text-anchor="middle">♭</text><text x="118" y="20" fill="#8A8F98" font-size="20" text-anchor="middle">♯</text>
      <g id="nd" style="transition:transform .12s"><line x1="0" y1="0" x2="0" y2="-118" stroke="#fff" stroke-width="4" stroke-linecap="round"/></g>
      <circle r="9" fill="#fff"/>
    </svg>
    <div id="tc" style="color:var(--mut);font-size:15px;height:20px"></div>
    <div class="keys" id="tk" style="width:100%;grid-template-columns:repeat(12,1fr);gap:3px">${T_NAMES.map(n => `<div style="text-align:center;padding:8px 0;border-radius:9px;background:#1c1e23;font-weight:800;font-size:13px;color:#8A8F98">${n}</div>`).join('')}</div>
    <div style="width:100%;height:6px;border-radius:3px;background:#24272E;overflow:hidden"><div id="tv" style="height:100%;width:0;background:#3DDC84"></div></div>
    <button class="btn ac" id="tgo" style="min-width:200px">🎤 Ligar o microfone</button>
    <div class="m" style="color:var(--mut);font-size:13px;text-align:center">Lá = 440 Hz · violão, guitarra, baixo, teclado ou voz. Nada é gravado.</div>
  </div></div>`;
  $('#tgo', page).onclick = () => TUN ? tunerStop() : tunerStart(page);
}
async function tunerStart(page) {
  const btn = $('#tgo', page);
  let stream; try { stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false } }); }
  catch (e) { toast('Sem permissão pro microfone'); return; }
  const ac = audio(); const src = ac.createMediaStreamSource(stream); const an = ac.createAnalyser(); an.fftSize = 8192; src.connect(an);
  const D = ac.sampleRate > 30000 ? 2 : 1, SR = ac.sampleRate / D, W = Math.round(SR * 0.07), TMAX = Math.floor(SR / 38), TMIN = Math.floor(SR / 1500), N = W + TMAX + 2;
  const WIN = new Float64Array(W); for (let j = 0; j < W; j++) WIN[j] = 0.5 - 0.5 * Math.cos(2 * Math.PI * (j + 0.5) / W);
  const raw = new Float32Array(an.fftSize), x = new Float32Array(N), n = new Float64Array(TMAX + 2);
  let wake = null; try { wake = await navigator.wakeLock.request('screen'); } catch (e) {}
  const hist = []; let lastOk = 0;
  TUN = { stream, src, an, wake, timer: setInterval(() => {
    if (!document.body.contains(btn)) { tunerStop(); return; }
    an.getFloatTimeDomainData(raw); const start = raw.length - N * D;
    for (let i = 0; i < N; i++) { let s = 0; for (let d = 0; d < D; d++) s += raw[start + i * D + d]; x[i] = s / D; }
    const r = tunerPitch(x, 0, SR, W, TMAX, TMIN, WIN, n);
    $('#tv', page).style.width = Math.min(100, r.rms * 900) + '%';
    if (r.f > 0) { hist.push(r.f); if (hist.length > 3) hist.shift(); lastOk = Date.now(); }
    else if (Date.now() - lastOk > 1200) { hist.length = 0; }
    if (!hist.length) { $('#tn', page).style.color = '#8A8F98'; $('#tc', page).textContent = 'Toque uma nota'; return; }
    const f = [...hist].sort((a, b) => a - b)[Math.floor(hist.length / 2)];
    const midi = 69 + 12 * Math.log2(f / 440), near = Math.round(midi), cents = Math.round((midi - near) * 100), pc = ((near % 12) + 12) % 12;
    const ok = Math.abs(cents) <= 5, col = ok ? '#3DDC84' : '#fff';
    $('#tn', page).textContent = T_NAMES[pc]; $('#tn', page).style.color = col;
    $('#tf', page).textContent = f.toFixed(1) + ' Hz · oitava ' + (Math.floor(near / 12) - 1);
    $('#tc', page).innerHTML = ok ? '<b style="color:#3DDC84">Afinado</b>' : (cents < 0 ? `${-cents} cents abaixo — aperte` : `${cents} cents acima — afrouxe`);
    $('#nd', page).style.transform = `rotate(${Math.max(-50, Math.min(50, cents)) / 50 * 30}deg)`; $('#nd line', page).setAttribute('stroke', col);
    $$('#tk div', page).forEach((d, i) => { d.style.background = i === pc ? (ok ? '#3DDC84' : '#fff') : '#1c1e23'; d.style.color = i === pc ? '#111' : '#8A8F98'; });
  }, 60) };
  btn.textContent = '■ Desligar'; btn.classList.remove('ac');
}
function tunerStop() {
  if (!TUN) return; clearInterval(TUN.timer); try { TUN.src.disconnect(); } catch (e) {}
  TUN.stream.getTracks().forEach(t => t.stop()); try { TUN.wake && TUN.wake.release(); } catch (e) {} TUN = null;
  const b = $('#tgo'); if (b) { b.textContent = '🎤 Ligar o microfone'; b.classList.add('ac'); }
}
window.addEventListener('hashchange', tunerStop);
