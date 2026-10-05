/* Harmo Web — Teoria: Campo harmônico, Escalas, Arpejos e Harmonia ilustrada (port do app). */
'use strict';
function teoriaPage(page) {
  page.innerHTML = header('Teoria', { back: '' }) + `<div class="scroll"><div class="center">
    ${tint({ title: 'Campo harmônico', sub: 'os acordes de cada tom e a função de cada um', icon: 'grid', color: '#3DDC84', attrs: `onclick="go('campo')"` })}
    ${tint({ title: 'Escalas', sub: '22 escalas no braço e no teclado', icon: 'scale', color: '#FF8A1E', attrs: `onclick="go('escalas')"` })}
    ${tint({ title: 'Arpejos', sub: 'tríades e tétrades pelo braço', icon: 'arp', color: '#B18CFF', attrs: `onclick="go('arpejos')"` })}
    ${tint({ title: 'Harmonia ilustrada', sub: 'mapas de acordes vizinhos, círculos e caminhos', icon: 'star', color: '#FF5FA2', attrs: `onclick="go('ilustrada')"` })}
  </div></div>`;
}

// ================= CAMPO HARMÔNICO (port do FieldView) =================
const F_IV = [0, 2, 4, 5, 7, 9, 11], F_TRI = ['', 'm', 'm', '', '', 'm', '°'], F_SEV = ['7M', 'm7', 'm7', '7M', '7', 'm7', 'm7(b5)'];
const G_MAJ = ['1', '2', '3', '4', '5', '6', '7'], G_MIN = ['3', '4', '5', '6', '7', '1', '2'];
const F_MAJ = [0, 1, 0, 1, 2, 0, 2], F_MIN = [0, 1, 2, 1, 2, 0, 1];
const TO_MAJ = [[3, 4, 5], [4], [5, 3], [4, 0], [0, 5], [3, 1], [0]], TO_MIN = [[3, 1], [2, 5], [5], [4, 1], [0, 5], [1, 3], [2]];
const W_MAJ = ['casa: repouso total', 'prepara o 5 (2 → 5 → 1)', 'repouso fraco, parente do 1', 'afasta da casa e prepara', 'tensão máxima: pede o 1', 'repouso triste, pode substituir o 1', 'tensão, puxa forte pro 1'];
const W_MIN = ['repouso: o relativo maior', 'afasta da casa e prepara', 'tensão leve (o 5 com 7ª maior, na Passagem, puxa mais)', 'prepara, cor bonita no menor', 'tensão que leva pro 3 ou pra casa', 'casa: repouso total', 'prepara o 5 (2 → 5 → 1)'];
const ORDER_MAJ = [0, 1, 2, 3, 4, 5, 6], ORDER_MIN = [5, 6, 0, 1, 2, 3, 4];
const P_IV = [9, 11, 0, 2, 4, 1, 6, 8, 10], P_TO = [1, 2, 3, 4, 5, 1, 4, 5, 0], P_SUF = ['7', '7', '7', '7', '7', '°', '°', '°', ''], P_G = ['dom.', 'dom.', 'dom.', 'dom.', 'dom.', 'dim.', 'dim.', 'dim.', 'b7'];
const FN_NAME = ['Repouso', 'Preparação', 'Tensão', 'Passagem'], FN_COL = ['#3DDC84', '#6EA8FF', '#FF8A1E', '#B18CFF'];
const CAMPO = store.get('campo', { k: 0, min: false, sev: false, pas: false });
function campoPage(page) {
  const S = CAMPO, R = S.min ? (S.k + 3) % 12 : S.k, nm = flatKey(S.k + (S.min ? 12 : 0)) ? FLAT : SHARP;
  const name = d => nm[(R + F_IV[d]) % 12] + (S.sev ? F_SEV[d] : F_TRI[d]);
  const ord = S.min ? ORDER_MIN : ORDER_MAJ, fun = S.min ? F_MIN : F_MAJ, G = S.min ? G_MIN : G_MAJ;
  let cells = ord.map(d => `<button class="fc ${S.sel === 'd' + d ? 'on' : ''} ${S.focus != null && S.focus !== fun[d] ? 'dim' : ''}" style="--c:${FN_COL[fun[d]]}" data-c="d${d}"><b>${name(d)}</b><small>${G[d]}</small></button>`).join('');
  let pas = '';
  if (S.pas) pas = `<div class="sec">Passagem</div><div class="fgrid">` + P_IV.map((iv, i) => {
    const r = (R + iv) % 12, nmm = nm[r] + (P_SUF[i] === '' ? '' : P_SUF[i]);
    return `<button class="fc ${S.sel === 'p' + i ? 'on' : ''} ${S.focus != null && S.focus !== 3 ? 'dim' : ''}" style="--c:${FN_COL[3]}" data-c="p${i}"><b>${nmm}</b><small>${P_G[i]} → ${G[P_TO[i]]}</small></button>`;
  }).join('') + '</div>';
  let info = `Toque num acorde pra ouvir e ver pra onde ele costuma ir.`;
  if (S.sel) {
    if (S.sel[0] === 'd') { const d = +S.sel.slice(1); const to = (S.min ? TO_MIN : TO_MAJ)[d].map(name);
      info = `<b>${name(d)}</b> · grau ${G[d]} · <span style="color:${FN_COL[fun[d]]}">${FN_NAME[fun[d]]}</span><br>${(S.min ? W_MIN : W_MAJ)[d]}<div class="m">Costuma ir pra: <b>${to.join(', ')}</b></div>`; }
    else { const i = +S.sel.slice(1), r = (R + P_IV[i]) % 12; const tgt = name(P_TO[i]);
      info = `<b>${nm[r] + P_SUF[i]}</b> · ${P_G[i] === 'b7' ? 'bVII, emprestado' : P_G[i] === 'dom.' ? 'dominante secundário' : 'diminuto de passagem'}<div class="m">Puxa pro <b>${tgt}</b>${P_G[i] === 'dom.' ? ' (é o "V7" dele)' : P_G[i] === 'dim.' ? ' (sobe meio tom até ele)' : ''}.</div>`; }
  }
  page.innerHTML = header('Campo harmônico', { back: 'teoria' }) + `<div class="scroll">
    <div class="keys">${SHARP.map((n, i) => `<button class="${i === S.k ? 'on' : ''}" data-k="${i}">${(flatKey(i + (S.min ? 12 : 0)) ? FLAT : SHARP)[i]}</button>`).join('')}</div>
    <div class="row" style="margin-top:8px"><button class="chip ${!S.min ? 'on' : ''}" data-m="0">Maior</button><button class="chip ${S.min ? 'on' : ''}" data-m="1">Menor</button>
      <span style="flex:1"></span><button class="chip ${!S.sev ? 'on' : ''}" data-s="0">Tríades</button><button class="chip ${S.sev ? 'on' : ''}" data-s="1">Tétrades</button></div>
    <div class="fgrid">${cells}<button class="fc" style="--c:#B18CFF" data-pas="1"><b>${S.pas ? '−' : '+'}</b><small>Passagem</small></button></div>
    ${pas}
    <div class="legend">${FN_NAME.map((n, i) => `<span data-f="${i}" style="${S.focus === i ? 'color:#fff;font-weight:700' : ''}"><i style="background:${FN_COL[i]}"></i>${n}</span>`).join('')}</div>
    <div class="box">${info}</div>
    <div class="row" style="margin-top:10px"><button class="btn ac" id="pl">${icon('play', 16)} Ouvir o campo</button><button class="btn" id="cad">${icon('play', 16)} 1 – 4 – 5 – 1</button></div>
  </div>`;
  const save = () => { store.set('campo', S); campoPage(page); };
  $$('[data-k]', page).forEach(b => b.onclick = () => { S.k = +b.dataset.k; S.sel = null; save(); });
  $$('[data-m]', page).forEach(b => b.onclick = () => { S.min = b.dataset.m === '1'; S.sel = null; save(); });
  $$('[data-s]', page).forEach(b => b.onclick = () => { S.sev = b.dataset.s === '1'; save(); });
  $$('[data-f]', page).forEach(b => b.onclick = () => { S.focus = S.focus === +b.dataset.f ? null : +b.dataset.f; save(); });
  $('[data-pas]', page).onclick = () => { S.pas = !S.pas; save(); };
  $$('[data-c]', page).forEach(b => b.onclick = () => { S.sel = b.dataset.c; playChord(b.querySelector('b').textContent); save(); });
  $('#pl', page).onclick = () => playSeq(ord.map(name).concat([name(ord[0])]), null, .75);
  $('#cad', page).onclick = () => { const I = S.min ? 5 : 0, IV = S.min ? 1 : 3, V = 4; playSeq([name(I), name(IV), S.min ? nm[(R + 4) % 12] + '7' : name(V), name(I)]); };
}

// ================= ESCALAS e ARPEJOS (port do ScaleShapes/ScaleView) =================
const SC_IV = [[0, 3, 5, 7, 10], [0, 2, 4, 7, 9], [0, 3, 5, 6, 7, 10], [0, 2, 3, 4, 7, 9], [0, 2, 4, 5, 7, 9, 11], [0, 2, 3, 5, 7, 8, 10], [0, 2, 3, 5, 7, 8, 11], [0, 2, 3, 5, 7, 9, 11],
  [0, 2, 4, 5, 7, 9, 11], [0, 2, 3, 5, 7, 9, 10], [0, 1, 3, 5, 7, 8, 10], [0, 2, 4, 6, 7, 9, 11], [0, 2, 4, 5, 7, 9, 10], [0, 2, 3, 5, 7, 8, 10], [0, 1, 3, 5, 6, 8, 10],
  [0, 2, 3, 5, 7, 10], [0, 3, 5, 7, 9, 10], [0, 4, 5, 7, 10], [0, 3, 5, 7, 11], [0, 4, 5, 8, 10], [0, 2, 3, 5, 6, 8, 9, 11], [0, 1, 3, 4, 6, 7, 9, 10]];
const SC_BASE = [-1, -1, 0, 1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, 0, 0, -1, -1, -1, -1, -1];
const SC_BLUE = [-1, -1, 6, 3, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, 2, 9, -1, -1, -1, -1, -1];
const SC_NAMES = ['Penta menor', 'Penta maior', 'Blues', 'Blues maior', 'Maior natural', 'Menor natural', 'Menor harmônica', 'Menor melódica', 'Jônio', 'Dórico', 'Frígio', 'Lídio', 'Mixolídio', 'Eólio', 'Lócrio',
  'Penta menor 9', 'Penta menor 6', 'Penta maior 7', 'Penta menor 7M', 'Penta maior 7 #5', 'Diminuta', 'Dominante diminuta'];
const SC_ORDER = [0, 1, 15, 16, 2, 17, 18, 19, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 20, 21];
const SC_GROUPS = ['Pentatônicas e blues', 'Maior e menor', 'Modos gregos (são 7)', 'Diminutas'], SC_GCOL = ['#FF8A1E', '#4F8BFF', '#B18CFF', '#FF5A52'];
const scGroup = s => s >= 20 ? 3 : s >= 15 || s < 4 ? 0 : s < 8 ? 1 : 2;
const SC_ABOUT = ['5 notas: a mais usada em solo de guitarra (rock, blues, louvor).', '5 notas, sem meio-tom: melodias e solos fáceis por cima do tom maior.', 'Penta menor + a blue note (b5): o tempero do blues.', 'Penta maior + a b3 (blue note): o blues em tom maior, bem usado no gospel e country.', 'A base de quase tudo no louvor: alegre e resolvida.', 'Triste, introspectiva: o relativo menor do tom maior.', 'Menor com a 7ª maior: puxa forte pro i — é dela que vem o V7 do tom menor. Som clássico/árabe.', 'Menor com 6ª e 7ª maiores: suave, muito usada no jazz.', '1º modo: é a própria escala maior (I do campo harmônico).', '2º modo: menor com a 6ª maior — um menor mais "pra cima" (funk, pop, worship). Modo do ii.', '3º modo: menor com b2 — som espanhol/flamenco, tenso. Modo do iii.', '4º modo: maior com #4 — som "flutuando", de trilha sonora. Modo do IV.', '5º modo: maior com b7 — som de rock e blues. Modo do V.', '6º modo: é a menor natural. Modo do vi.', '7º modo: diminuto (b2 e b5), instável, quase não vira tom. Modo do vii.', 'Penta menor + a 9ª: som mais aberto e melancólico, ótimo em acordes m7 e m9.', 'Penta menor + a 6ª maior: o som do modo Dórico, um menor mais "pra cima". Boa no m6 e no m7.', 'Penta menor com a 3ª maior no lugar da b3: som de acorde 7. Use em cima do A7, por exemplo. Também chamada de penta dominante ou mixo.', 'Penta menor com a 7ª maior no lugar da b7: tensa, puxa forte pra tônica. Serve no m(7M) e no V7 do tom menor (Lá menor 7M em cima do E7).', 'Penta maior 7 com a 5ª aumentada (#5 = b6): pro acorde 7 com #5, como o V7 do tom menor. Mesmas notas da penta menor 7M uma 4ª acima (E maior 7 #5 = Lá menor 7M).', '8 notas, tom-semitom: a escala do acorde diminuto (°), boa nas passagens diminutas. Repete a cada 3 casas: o mesmo desenho serve 1 tom e meio acima.', '8 notas, semitom-tom: pro acorde 7 com b9 (o V7 que puxa forte pro tom). Tem b9, #9, #11 e 13. Também repete a cada 3 casas.'];
const ARP = [[0, 4, 7], [0, 3, 7], [0, 3, 6], [0, 4, 8], [0, 5, 7], [0, 2, 7], [0, 4, 7, 11], [0, 4, 7, 10], [0, 3, 7, 10], [0, 3, 6, 10], [0, 3, 6, 9], [0, 3, 7, 11], [0, 4, 8, 11], [0, 4, 7, 9], [0, 3, 7, 9], [0, 5, 7, 10]];
const ARP_NAMES = ['Maior', 'Menor', 'Diminuta', 'Aumentada', 'Suspensa (4ª)', 'Suspensa (2ª)', 'Maior com 7ª maior', 'Dominante', 'Menor com 7ª', 'Meio-diminuto', 'Diminuto', 'Menor com 7ª maior', 'Aumentado com 7ª maior', 'Maior com 6ª', 'Menor com 6ª', 'Dominante suspenso'];
const ARP_SYM = ['', 'm', 'dim', '+', 'sus4', 'sus2', '7M', '7', 'm7', 'm7(b5)', '°', 'm(7M)', '7M(#5)', '6', 'm6', '7sus4'];
const ARP_ABOUT = ['Tônica, 3ª maior e 5ª: o acorde maior. Som alegre e resolvido.', 'Tônica, 3ª menor e 5ª: o acorde menor. Som triste, introspectivo.', 'Duas 3ªs menores (1 b3 b5): tensa, instável. É o acorde do vii grau (B dim no tom de C).', 'Duas 3ªs maiores (1 3 #5): som de suspense que puxa pra frente. Passagem clássica: C → C+ → F.', 'Sem a 3ª, com a 4ª no lugar: som suspenso que pede pra resolver na 3ª (Dsus4 → D). Muito usado no louvor.', 'Sem a 3ª, com a 2ª no lugar: som aberto e moderno, muito usado no louvor e no pop.', 'Maior com 7ª maior: suave e sofisticado. É o acorde do I e do IV no tom maior (C7M, F7M).', 'Maior com 7ª menor (dominante): tenso, pede pra resolver. É o V7 do tom (G7 → C).', 'Menor com 7ª menor: o menor mais usado no louvor e na MPB. Acorde do ii, iii e vi (Dm7, Em7 e Am7 no tom de C).', 'Menor com 5ª diminuta e 7ª menor. É o vii do tom maior (Bm7(b5) em C) e o ii do tom menor.', 'Três 3ªs menores seguidas: cada nota fica 1 tom e meio da outra. Simétrico: o desenho se repete a cada 3 casas. Passagem clássica: C → C#° → Dm.', 'Menor com 7ª maior: som de suspense, de trilha de filme. É o i da menor harmônica (Am(7M)).', 'Aumentado com 7ª maior: brilhante e misterioso. É o III da menor harmônica (C7M(#5) no tom de Lá menor).', 'Maior com 6ª: som leve, de bossa e MPB. Mesmas notas do m7 do relativo (C6 = Am7).', 'Menor com 6ª maior: o som do Dórico, bem usado na bossa e no jazz.', 'Dominante com a 4ª no lugar da 3ª: prepara o V7 (G7sus4 → G7 → C). Também escrito 7/4.'];
let SCALE_PLAY = null;
const GTR = [40, 45, 50, 55, 59, 64], BASS5 = [23, 28, 33, 38, 43], ARP_MAX = 22;

function scPosition(scale, root, tune, p) {
  const sc = SC_BASE[scale] >= 0 ? SC_IV[SC_BASE[scale]] : SC_IV[scale];
  const n = sc.length, nps = n <= 5 ? 2 : 3, ns = tune.length, k = (p - 1) % n;
  const startPc = (root + sc[k]) % 12, f0 = ((startPc - tune[0]) % 12 + 12) % 12;
  const pitch = [], str = []; let min = 99;
  for (let i = 0; i < ns * nps; i++) { pitch.push(tune[0] + f0 + sc[(k + i) % n] + 12 * Math.floor((k + i) / n) - sc[k]); str.push(Math.floor(i / nps)); min = Math.min(min, pitch[i] - tune[str[i]]); }
  if (min < 0) for (let i = 0; i < pitch.length; i++) pitch[i] += 12;
  let fmin = 99, fmax = -1; for (let i = 0; i < pitch.length; i++) { const f = pitch[i] - tune[str[i]]; fmin = Math.min(fmin, f); fmax = Math.max(fmax, f); }
  const fr = tune.map(() => []); for (let i = 0; i < pitch.length; i++) fr[str[i]].push(pitch[i] - tune[str[i]]);
  const dist = (f) => f < 0 ? 999 : f < fmin ? fmin - f : f > fmax ? f - fmax : 0;
  if (SC_BLUE[scale] >= 0) {
    const lo = pitch[0], hi = pitch[pitch.length - 1], blue = SC_BLUE[scale];
    for (let P = lo + 1; P < hi; P++) {
      if (((P - root) % 12 + 12) % 12 !== blue) continue;
      let below = 0; while (below + 1 < pitch.length && pitch[below + 1] < P) below++;
      const sL = str[below], sU = str[Math.min(pitch.length - 1, below + 1)];
      const s = dist(P - tune[sL]) <= dist(P - tune[sU]) ? sL : sU, f = P - tune[s];
      fr[s].push(f); fmin = Math.min(fmin, f); fmax = Math.max(fmax, f);
    }
    for (let P = tune[0] + Math.max(0, fmin); P < lo; P++) if (((P - root) % 12 + 12) % 12 === blue && P - tune[0] <= fmax) fr[0].push(P - tune[0]);
    for (let P = hi + 1; P <= tune[ns - 1] + fmax; P++) if (((P - root) % 12 + 12) % 12 === blue && P - tune[ns - 1] >= fmin) fr[ns - 1].push(P - tune[ns - 1]);
  }
  return fr.map(a => a.sort((x, y) => x - y));
}
const inChord = (iv, x) => iv.includes(((x % 12) + 12) % 12);
function arpBox(iv, root, tune, str, f0) { const hi = Math.min(ARP_MAX, f0 + 4); return tune.map((t, s) => { const l = []; if (s >= str) for (let f = f0; f <= hi; f++) if (inChord(iv, t + f - root)) l.push(f); return l; }); }
function arpDiagonal(iv, root, tune, str, f0) {
  const ns = tune.length, p0 = tune[str] + f0, fr = tune.map(() => []); let cur = str, first = f0, count = 1; fr[cur].push(f0);
  for (let P = p0 + 1; P <= p0 + 24; P++) {
    if (!inChord(iv, P - root)) continue; let f = P - tune[cur];
    if (count < 2 && f - first <= 5) { if (f > ARP_MAX) break; fr[cur].push(f); count++; continue; }
    if (cur + 1 >= ns) break; cur++; f = P - tune[cur]; if (f < 0 || f > ARP_MAX) break; fr[cur].push(f); first = f; count = 1;
  }
  return fr;
}
function arpStarts(iv, root, tune, str, diag) { const l = []; for (let f = 0; f <= 19; f++) { if (!inChord(iv, tune[str] + f - root)) continue; if (diag) { const n = arpDiagonal(iv, root, tune, str, f).reduce((s, x) => s + x.length, 0); if (n < iv.length + 2) continue; } l.push(f); } return l; }
const DEG = ['1', 'b2', '2', 'b3', '3', '4', 'b5', '5', 'b6', '6', 'b7', '7'];
function degName(iv, ivs) { if (iv === 8 && ivs.includes(4) && !ivs.includes(7)) return '#5'; if (iv === 6 && ivs.includes(5) && ivs.includes(7) && !ivs.includes(4)) return 'b5'; if (iv === 6 && ivs.includes(7)) return '#4'; return DEG[iv]; }

function scalePage(arp) {
  if (SCALE_PLAY) { stopSeq(); SCALE_PLAY = null; }
  const page = $('#page'); const K = arp ? 'arpejos' : 'escalas';
  const S = store.get(K, { k: arp ? 4 : 9, s: arp ? 1 : 0, inst: 'g', view: arp ? 'v' : 'p', p: 1, deg: false, str: 0 });
  const save = () => { store.set(K, S); scalePage(arp); };
  const tune = S.inst === 'b' ? BASS5 : GTR, nm = SHARP;
  const ivs = arp ? ARP[S.s] : SC_IV[S.s], pcs = ivs.map(i => (S.k + i) % 12);
  const blue = arp ? -1 : SC_BLUE[S.s];
  const title = arp ? nm[S.k] + ARP_SYM[S.s] : nm[S.k] + ' ' + SC_NAMES[S.s];
  const color = arp ? (S.s < 6 ? '#3DDC84' : '#B18CFF') : SC_GCOL[scGroup(S.s)];
  // desenho
  let frets = null, posLabel = '', nPos = 0, starts = [];
  if (S.inst !== 'k') {
    if (!arp) {
      nPos = SC_BASE[S.s] >= 0 ? 5 : SC_IV[S.s].length;
      if (S.view === 'p') { S.p = Math.min(Math.max(1, S.p), nPos); frets = scPosition(S.s, S.k, tune, S.p); posLabel = `Posição ${S.p} de ${nPos}`; }
    } else if (S.view !== 'w') {
      const str = Math.min(S.str, tune.length - 3); starts = arpStarts(ivs, S.k, tune, str, S.view === 'd'); nPos = starts.length;
      S.p = Math.min(Math.max(1, S.p), nPos || 1); const f0 = starts[S.p - 1] ?? 0;
      frets = S.view === 'd' ? arpDiagonal(ivs, S.k, tune, str, f0) : arpBox(ivs, S.k, tune, str, f0);
      const all = frets.flat(); posLabel = `Posição ${S.p} de ${nPos} · casas ${Math.min(...all)} a ${Math.max(...all)}`;
    }
    if (!frets) frets = tune.map(t => { const l = []; for (let f = 0; f <= (arp ? 22 : 17); f++) if (pcs.includes((t + f) % 12)) l.push(f); return l; });
  }
  const lab = p => S.deg ? degName(((p - S.k) % 12 + 12) % 12, ivs) : nm[p];
  const dot = p => p === S.k ? '#FF8A1E' : (((p - S.k + 12) % 12) === blue ? '#B18CFF' : '#4F8BFF');
  let draw = '';
  if (S.inst === 'k') {
    // teclado: 2 oitavas a partir da tônica (é o que toca no Ouvir)
    const isB = m => [1, 3, 6, 8, 10].includes(m % 12); let lo = 60 + S.k, hi = lo + 24; while (isB(lo)) lo--; while (isB(hi)) hi++;
    const whites = []; for (let m = lo; m <= hi; m++) if (!isB(m)) whites.push(m);
    const ww = 24, W = whites.length * ww; let s = `<svg viewBox="0 0 ${W} 130" width="100%">`;
    whites.forEach((m, i) => { const p = m % 12, x = i * ww, on = pcs.includes(p); s += `<rect data-m="${m}" x="${x + .5}" y="4" width="${ww - 1.5}" height="120" rx="4" fill="${on ? dot(p) : '#E9EBEF'}"/>${on ? `<text x="${x + ww / 2}" y="112" text-anchor="middle" font-size="10" font-weight="800" fill="#111">${lab(p)}</text>` : ''}`; });
    for (let m = lo; m <= hi; m++) if (isB(m)) { const wi = whites.filter(w => w < m).length, x = wi * ww - ww * .3, p = m % 12, on = pcs.includes(p); s += `<rect data-m="${m}" x="${x}" y="4" width="${ww * .6}" height="74" rx="3" fill="${on ? dot(p) : '#2B2C30'}"/>${on ? `<text x="${x + ww * .3}" y="70" text-anchor="middle" font-size="7.5" font-weight="800" fill="#111">${lab(p)}</text>` : ''}`; }
    draw = `<div class="fret" style="padding:8px">${s}</svg></div>`;
  } else {
    const all = frets.flat(); let lo = 0, hi = 15;
    if (S.view === 'w' || (!arp && S.view === 'a')) { lo = 0; hi = arp ? 22 : 17; } else { lo = Math.max(0, Math.min(...all) - 1); hi = Math.max(lo + 5, Math.max(...all) + 1); }
    const FW = 46, SH = 30, ns = tune.length, W = (hi - lo + 1) * FW + 30, H = ns * SH + 34;
    let s = `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">`;
    const xOf = f => 24 + (f - lo) * FW + FW / 2, yOf = st => 14 + (ns - 1 - st) * SH + SH / 2;
    for (let f = lo; f <= hi; f++) { const x = 24 + (f - lo) * FW; s += `<line x1="${x + FW}" y1="${yOf(ns - 1)}" x2="${x + FW}" y2="${yOf(0)}" stroke="${f === 0 ? '#ddd' : '#555'}" stroke-width="${f === 0 ? 4 : 1.5}"/>`;
      if ([3, 5, 7, 9, 15, 17, 19, 21].includes(f)) s += `<circle cx="${xOf(f)}" cy="${H - 9}" r="3.5" fill="#666"/>`; if (f === 12) s += `<circle cx="${xOf(f) - 6}" cy="${H - 9}" r="3.5" fill="#666"/><circle cx="${xOf(f) + 6}" cy="${H - 9}" r="3.5" fill="#666"/>`;
      s += `<text x="${xOf(f)}" y="10" text-anchor="middle" font-size="10" fill="#888">${f}</text>`; }
    for (let st = 0; st < ns; st++) s += `<line x1="24" y1="${yOf(st)}" x2="${W - 6}" y2="${yOf(st)}" stroke="#9a9a9a" stroke-width="${1 + (ns - st) * .25}"/><text x="10" y="${yOf(st) + 4}" text-anchor="middle" font-size="11" font-weight="700" fill="#888">${nm[tune[st] % 12]}</text>`;
    frets.forEach((l, st) => l.forEach(f => { if (f < lo || f > hi) return; const p = (tune[st] + f) % 12; s += `<circle data-s="${st}" data-f="${f}" cx="${xOf(f)}" cy="${yOf(st)}" r="12" fill="${dot(p)}"/><text x="${xOf(f)}" y="${yOf(st) + 4}" text-anchor="middle" font-size="10.5" font-weight="800" fill="#111">${lab(p)}</text>`; }));
    draw = `<div class="fret" id="fr">${s}</svg></div>`;
  }
  const viewChips = S.inst === 'k' ? '' : arp ? `<div class="row" style="margin-top:8px">${[['v', 'Vertical'], ['d', 'Diagonal'], ['w', 'Braço inteiro']].map(([v, n]) => `<button class="chip ${S.view === v ? 'on' : ''}" data-v="${v}">${n}</button>`).join('')}</div>
      ${S.view !== 'w' ? `<div class="row" style="margin-top:6px"><span class="m" style="color:var(--mut);font-size:13px">Começa na</span>${(S.inst === 'b' ? ['5ª', '4ª', '3ª'] : ['6ª', '5ª', '4ª']).map((n, i) => `<button class="chip ${S.str === i ? 'on' : ''}" data-st="${i}">${n} corda</button>`).join('')}</div>` : ''}`
    : `<div class="row" style="margin-top:8px"><button class="chip ${S.view === 'p' ? 'on' : ''}" data-v="p">Posições</button><button class="chip ${S.view === 'a' ? 'on' : ''}" data-v="a">Braço inteiro</button></div>`;
  page.innerHTML = header(arp ? 'Arpejos' : 'Escalas', { back: 'teoria' }) + `<div class="scroll">
    <div class="keys">${nm.map((n, i) => `<button class="${i === S.k ? 'on' : ''}" data-k="${i}">${n}</button>`).join('')}</div>
    <div style="margin-top:10px">${tint({ title, sub: arp ? ARP_NAMES[S.s] + ' · trocar ▾' : SC_GROUPS[scGroup(S.s)] + ' · trocar ▾', glyph: arp ? (S.s < 6 ? '3' : '4') : '♪', color, attrs: 'id="pick"' })}</div>
    <div class="row"><button class="chip ${S.inst === 'g' ? 'on' : ''}" data-i="g">Guitarra / violão</button><button class="chip ${S.inst === 'b' ? 'on' : ''}" data-i="b">Baixo 5</button><button class="chip ${S.inst === 'k' ? 'on' : ''}" data-i="k">Teclado</button>
      <span style="flex:1"></span><button class="chip ${S.deg ? 'on' : ''}" id="dg">Graus</button></div>
    ${viewChips}
    ${draw}
    ${posLabel ? `<div class="nav2"><button class="ib" id="pv">◀</button><div>${posLabel}</div><button class="ib" id="nx">▶</button></div>` : ''}
    <div class="box"><b>${pcs.map(p => nm[p]).join(' ')}</b> <span class="m">· ${ivs.map(i => degName(i, ivs)).join(' ')}</span><div class="m" style="margin-top:4px">${arp ? ARP_ABOUT[S.s] : SC_ABOUT[S.s]}</div></div>
    <div class="row" style="margin-top:10px"><button class="btn ac" id="pl" style="min-width:140px">${icon('play', 16)} Ouvir</button></div>
  </div>`;
  $$('[data-k]', page).forEach(b => b.onclick = () => { S.k = +b.dataset.k; S.p = 1; save(); });
  $$('[data-i]', page).forEach(b => b.onclick = () => { S.inst = b.dataset.i; S.p = 1; save(); });
  $$('[data-v]', page).forEach(b => b.onclick = () => { S.view = b.dataset.v; S.p = 1; save(); });
  $$('[data-st]', page).forEach(b => b.onclick = () => { S.str = +b.dataset.st; S.p = 1; save(); });
  $('#dg', page).onclick = () => { S.deg = !S.deg; save(); };
  if ($('#pv', page)) { $('#pv', page).onclick = () => { S.p = S.p <= 1 ? nPos : S.p - 1; save(); }; $('#nx', page).onclick = () => { S.p = S.p >= nPos ? 1 : S.p + 1; save(); }; }
  // ouvir: sobe e desce (todas as cordas da posição / 2 oitavas no teclado), a nota tocando acende; o botão vira Parar
  const plB = $('#pl', page);
  const stopPlay = () => { stopSeq(); SCALE_PLAY = null; $$('.hit', page).forEach(e => e.classList.remove('hit')); plB.innerHTML = `${icon('play', 16)} Ouvir`; plB.classList.add('ac'); };
  plB.onclick = () => {
    if (SCALE_PLAY) { stopPlay(); return; }
    let seq = [];
    if (S.inst === 'k') { const base = 60 + S.k; for (let o = 0; o < 2; o++) ivs.forEach(i => seq.push({ m: base + 12 * o + i })); seq.push({ m: base + 24 }); }
    else if (frets && (S.view === 'p' || (arp && S.view !== 'w'))) { frets.forEach((l, st) => l.forEach(f => seq.push({ m: tune[st] + f, st, f }))); seq.sort((a, b) => a.m - b.m); }
    else { const b0 = tune[0] + ((S.k - tune[0]) % 12 + 12) % 12; ivs.forEach(i => seq.push({ m: b0 + i })); seq.push({ m: b0 + 12 }); }
    for (let i = seq.length - 2; i >= 0; i--) seq.push(seq[i]);                 // e desce
    audio(); stopSeq(); const STEP = .26, t0 = AC.currentTime + .08; SCALE_PLAY = seq;
    seq.forEach((n, i) => { note(n.m, t0 + i * STEP, i === seq.length - 1 ? 1.4 : STEP * 1.1, i === seq.length - 1 ? .66 : .6);
      timers.push(setTimeout(() => { $$('.hit', page).forEach(e => e.classList.remove('hit'));
        const el = n.st != null ? $(`circle[data-s="${n.st}"][data-f="${n.f}"]`, page) : ($(`rect[data-m="${n.m}"]`, page) || null);
        if (el) el.classList.add('hit'); }, i * STEP * 1000 + 80)); });
    timers.push(setTimeout(stopPlay, seq.length * STEP * 1000 + 600));
    plB.innerHTML = '■ Parar'; plB.classList.remove('ac');
  };
  $('#pick', page).onclick = () => {
    let html = '';
    if (arp) [['Tríades', 0, 6, '#3DDC84'], ['Tétrades', 6, 16, '#B18CFF']].forEach(([g, a, b, c]) => { html += `<div class="sec">${g}</div>`; for (let i = a; i < b; i++) html += tint({ title: nm[S.k] + ARP_SYM[i], sub: ARP_NAMES[i], glyph: g[0] === 'T' && i < 6 ? '3' : '4', color: c, attrs: `data-pk="${i}"` }); });
    else SC_GROUPS.forEach((g, gi) => { html += `<div class="sec">${g}</div>`; SC_ORDER.filter(s => scGroup(s) === gi).forEach(s => html += tint({ title: SC_NAMES[s], sub: SC_IV[s].map(i => degName(i, SC_IV[s])).join(' '), glyph: '♪', color: SC_GCOL[gi], attrs: `data-pk="${s}"` })); });
    sheet(arp ? 'Qual arpejo?' : 'Qual escala?', html, sh => $$('[data-pk]', sh).forEach(b => b.onclick = () => { S.s = +b.dataset.pk; S.p = 1; closeSheet(); save(); }));
  };
  const fr = $('#fr', page); if (fr && S.view !== 'p' && S.view !== 'v' && S.view !== 'd') fr.scrollLeft = 0;
}

// ================= HARMONIA ILUSTRADA =================
const ILU = [['circ', 'Círculos', 'quintas, quartas, relativas e o campo do tom', 'circle', '#F4C542'], ['tree', 'Árvore', 'vizinhos que mudam uma nota, em estrela', 'tree', '#FF5FA2'],
  ['pyr', 'Pirâmide', 'as notas em comum, nível por nível', 'pyr', '#4FD8FF'], ['route', 'De → Até', 'todos os caminhos de um acorde até outro', 'path', '#3DDC84'],
  ['cube', 'Estrelas', 'tons a uma terça maior e os aumentados', 'tri', '#8BE04E'], ['dom', 'Dominantes', 'V → V+ → I e o ciclo de 7', 'dom', '#F4C542'],
  ['mod', 'Modos', 'os 14 modos e a nota que muda', 'modes', '#B18CFF'], ['bus', 'Buscador de acordes', 'toque nas notas e ache os acordes', 'piano', '#FF8A1E']];
function ilustradaPage(page, tab) {
  if (!tab) {
    page.innerHTML = header('Harmonia ilustrada', { back: 'teoria' }) + `<div class="scroll"><div class="center">${ILU.map(([k, t, s, ic, c]) => tint({ title: t, sub: s, icon: ic, color: c, attrs: `onclick="go('ilustrada/${k}')"` })).join('')}</div></div>`;
    return;
  }
  const it = ILU.find(x => x[0] === tab) || ILU[0];
  page.innerHTML = header(it[1], { back: 'ilustrada' }) + `<iframe class="ifr" src="ilustrada.html#${it[0]}" allow="autoplay"></iframe>`;
}
