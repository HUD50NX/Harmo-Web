/* Harmo Web — Minhas cifras: busca na internet, baixar, ver (tom, tab, letra), Rearmonizar e salvar no aparelho. */
'use strict';
const API = (window.HARMO_API || '') + '/api';
const SEARCH = 'https://solr.sscdn.co/cc/c7/?q=';
const cifras = () => store.get('cifras', []);
const saveCifras = l => store.set('cifras', l);
const getCifra = id => cifras().find(c => c.id === id);
function putCifra(c) { const l = cifras(); const i = l.findIndex(x => x.id === c.id); if (i >= 0) l[i] = c; else l.unshift(c); saveCifras(l); }
const CS = store.get('cifraOpts', { fs: 15, tab: true });

// ---------------- lista ----------------
function cifrasPage(page) {
  page.innerHTML = header('Minhas cifras', { back: '', right: `<button class="ib" id="paste" aria-label="Colar cifra">${icon('plus')}</button>` }) + `<div class="scroll">
    <div class="search"><input id="q" type="search" placeholder="Buscar música ou artista" autocomplete="off" enterkeyhint="search"><button class="btn ac" id="web">${icon('search', 18)} Web</button></div>
    <div id="list"></div></div>`;
  const q = $('#q', page), list = $('#list', page);
  const draw = () => {
    const s = q.value.trim().toLowerCase(); const l = cifras().filter(c => !s || (c.t + ' ' + c.a).toLowerCase().includes(s));
    list.innerHTML = l.length ? l.map(c => tint({ title: c.t, sub: [c.a, c.k ? 'Tom ' + keyName(parseKey(c.k)) : '', c.r ? 'rearmonizada' : ''].filter(Boolean).join(' · '), icon: c.r ? 'wand' : 'note', color: c.r ? '#B18CFF' : '#FF8A1E', attrs: `data-id="${c.id}"` })).join('')
      : `<div class="empty">${s ? 'Nada salvo com esse nome.<br>Toque em <b>Web</b> pra buscar na internet.' : 'Nenhuma cifra salva ainda.<br>Digite o nome da música e toque em <b>Web</b>.'}</div>`;
    $$('[data-id]', list).forEach(b => b.onclick = () => go('cifra/' + b.dataset.id));
  };
  q.oninput = draw; q.onkeydown = e => { if (e.key === 'Enter') { e.preventDefault(); webSearch(q.value); } };
  $('#web', page).onclick = () => webSearch(q.value); $('#paste', page).onclick = pasteCifra; draw();
}

// ---------------- busca na internet ----------------
async function webSearch(q, start) {
  q = (q || '').trim(); if (!q) { toast('Digite o nome da música'); return; }
  start = start || 0; if (!start) sheet('Buscando…', '<div class="empty">Procurando cifras…</div>');
  let docs = [];
  try { const r = await fetch(SEARCH + encodeURIComponent(q) + (start ? '&start=' + start : '')); const t = await r.text(); const j = JSON.parse(t.slice(t.indexOf('{'), t.lastIndexOf('}') + 1)); docs = (j.response && j.response.docs) || []; }
  catch (e) { closeSheet(); toast('Sem internet ou a busca falhou'); return; }
  const items = docs.filter(d => d.tipo === '1' || d.tipo === '2');
  const html = items.map(d => d.tipo === '1'
    ? tint({ title: 'Todas as músicas', sub: d.art || d.txt, glyph: '★', color: '#B18CFF', attrs: `data-art="${esc(d.dns)}" data-an="${esc(d.art || d.txt)}"` })
    : tint({ title: d.txt, sub: d.art, glyph: '♪', color: '#FF8A1E', attrs: `data-dns="${esc(d.dns)}" data-url="${esc(d.url)}" data-t="${esc(d.txt)}" data-a="${esc(d.art)}"` })).join('');
  const more = docs.length >= 10 ? `<button class="btn" style="width:100%" id="more">Mais resultados ↓</button>` : `<div class="empty" style="padding:12px">Fim dos resultados</div>`;
  const wire = sh => {
    $$('[data-dns]', sh).forEach(b => b.onclick = () => importCifra(b.dataset.dns, b.dataset.url, b.dataset.t, b.dataset.a));
    $$('[data-art]', sh).forEach(b => b.onclick = () => artistSongs(b.dataset.art, b.dataset.an));
    const m = $('#more', sh); if (m) m.onclick = async () => { m.textContent = 'Buscando mais…'; m.disabled = true; const r = await webSearchMore(q, start + docs.length); m.outerHTML = r; wire(sh); };
  };
  if (start) return html + more;
  if (!items.length) { sheet('Nada encontrado', '<div class="empty">Tente outro nome (música, artista ou os dois).</div>'); return; }
  sheet(`Qual cifra importar? <span style="color:var(--mut);font-weight:600;font-size:14px">· ${docs.length >= 10 ? 'mais de ' : ''}${items.length} encontradas</span>`, html + more, wire);
}
async function webSearchMore(q, start) { return await webSearch(q, start) || '<div class="empty">Fim dos resultados</div>'; }
async function artistSongs(dns, name) {
  sheet(esc(name), '<div class="empty">Buscando as músicas…</div>');
  try {
    const r = await fetch(`${API}/artista?a=${encodeURIComponent(dns)}`); const j = await r.json(); if (!j.songs) throw 0;
    sheet(`${esc(name)} <span style="color:var(--mut);font-weight:600;font-size:14px">· ${j.songs.length} músicas</span>`, j.songs.map(s => tint({ title: s.t, sub: name, glyph: '♪', color: '#FF8A1E', attrs: `data-dns="${esc(dns)}" data-url="${esc(s.u)}" data-t="${esc(s.t)}" data-a="${esc(name)}"` })).join(''),
      sh => $$('[data-dns]', sh).forEach(b => b.onclick = () => importCifra(b.dataset.dns, b.dataset.url, b.dataset.t, b.dataset.a)));
  } catch (e) { sheet(esc(name), '<div class="empty">Não consegui buscar as músicas agora.</div>'); }
}
async function importCifra(dns, url, t, a) {
  const id = dns + '/' + url; const old = getCifra(id); if (old) { closeSheet(); go('cifra/' + id); return; }
  sheet('Baixando…', `<div class="empty">Baixando a cifra de <b>${esc(t)}</b>…</div>`);
  try {
    const r = await fetch(`${API}/cifra?a=${encodeURIComponent(dns)}&m=${encodeURIComponent(url)}`); const j = await r.json(); if (!j.x) throw new Error(j.erro || 'vazia');
    const c = { id, t: j.t || t, a: j.a || a, k: j.k || '', x: cleanText(j.x), r: null, semi: 0, at: Date.now() };
    putCifra(c); closeSheet(); go('cifra/' + id);
  } catch (e) { sheet('Não deu pra baixar', `<div class="box" style="margin-top:0">A cifra não veio agora. Tente de novo daqui a pouco.</div><div class="box m">Se precisar já: copie a cifra de qualquer site e toque em <b>+</b> (Colar cifra) em Minhas cifras.</div>`); }
}
function cleanText(x) { return String(x).replace(/\r/g, '').replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim(); }
function pasteCifra() {
  sheet('Colar cifra', `<div class="search" style="margin-top:0"><input id="pt" placeholder="Nome da música"></div><div class="search"><input id="pa" placeholder="Artista (opcional)"></div>
    <textarea id="px" placeholder="Cole aqui a cifra (acordes em cima da letra)" style="width:100%;height:38vh;background:#121317;color:#fff;border:1px solid var(--line);border-radius:14px;padding:10px;font:14px ui-monospace,monospace"></textarea>
    <button class="btn ac" style="width:100%;margin-top:10px" id="ps">Salvar</button>`, sh => {
    $('#ps', sh).onclick = () => { const x = cleanText($('#px', sh).value), t = $('#pt', sh).value.trim() || 'Sem nome'; if (!x) { toast('Cole a cifra'); return; }
      const c = { id: 'p' + Date.now(), t, a: $('#pa', sh).value.trim(), k: guessKey(x), x, r: null, semi: 0, at: Date.now() }; putCifra(c); closeSheet(); go('cifra/' + c.id); };
  });
}
/** Tom provável: o primeiro e o último acorde, e qual maior/menor aparece mais. */
function guessKey(x) { const ch = []; x.split('\n').forEach(l => { if (lineKind(l) === 'c') l.split(/\s+/).forEach(t => { const c = parseChord(t.replace(/^\(|\)$/g, '')); if (c) ch.push(c); }); });
  if (!ch.length) return ''; const c = ch[ch.length - 1]; return (flatKey(c.root + (c.minor ? 12 : 0)) ? FLAT : SHARP)[c.root] + (c.minor ? 'm' : ''); }

// ---------------- ler a cifra ----------------
const TAB_RE = /^\s*[A-Ga-g]?[#b]?\|[-0-9hpbrx\/\\|~*() .^v]{3,}/;
function lineKind(l) {
  if (TAB_RE.test(l)) return 't';
  const s = l.replace(/\[[^\]]*\]/g, ' ').replace(/^\s*(intro|refrão|refrao|ponte|solo|final|pré-refrão|pre-refrao|parte \d+)\s*:?/i, ' ').trim();
  if (!s) return /\[[^\]]*\]/.test(l) ? 'h' : '';
  const toks = s.split(/\s+/).filter(t => !/^(\||x\d+|\d+x|-+|\(|\)|\/)$/i.test(t));
  if (!toks.length) return 'h';
  return toks.every(t => isChordTok(t.replace(/^\(+|\)+$/g, ''))) ? 'c' : '';
}
function chordToks(line) { const out = []; const re = /\S+/g; let m; while ((m = re.exec(line))) { const t = m[0]; const core = t.replace(/^\(+|\)+$/g, ''); if (isChordTok(core)) out.push({ t, col: m.index, core }); } return out; }

function cifraPage(page, id) {
  const c = getCifra(id); if (!c) { go('cifras'); return; }
  const V = cifraPage.v && cifraPage.v.id === id ? cifraPage.v : (cifraPage.v = { id, rearm: false, show: c.r ? 'r' : 'o', tom: false, undo: [] });
  const key0 = parseKey(c.k), semi = c.semi || 0, keyNow = key0 < 0 ? -1 : (key0 % 12 + semi + 120) % 12 + (key0 >= 12 ? 12 : 0);
  const flats = keyNow >= 0 ? flatKey(keyNow) : false;
  const text = V.rearm || V.show === 'r' ? (c.r || c.x) : c.x;
  const lines = text.split('\n'); const hasTab = lines.some(l => lineKind(l) === 't');
  let body = '';
  lines.forEach((l, li) => {
    const k = lineKind(l);
    if (k === 't') { if (CS.tab) body += `<span class="tab">${esc(transTab(l, semi))}</span>\n`; return; }
    if (k === 'c') {
      // cada pedaço fica na coluna dele; se o acorde transposto ficou maior, o próximo anda só o necessário
      let out = '', pos = 0; const re = /\S+/g; let m;
      while ((m = re.exec(l))) {
        const raw = m[0], core = raw.replace(/^\(+|\)+$/g, ''), isC = isChordTok(core);
        const shown = isC ? transChord(raw, semi, flats).replace(/^§/, '') : raw;
        const col = Math.max(m.index, pos ? pos + 1 : 0); out += ' '.repeat(col - pos);
        out += isC ? `<span class="ch${raw.startsWith('§') ? ' rm' : ''}" data-l="${li}" data-c="${m.index}">${esc(shown)}</span>` : esc(shown);
        pos = col + shown.length;
      }
      body += out + '\n'; return;
    }
    if (!CS.tab && /^\s*\[(tab|solo)[^\]]*\]\s*$/i.test(l)) return;
    body += esc(l) + '\n';
  });
  const right = `<button class="ib" id="menu" aria-label="Mais">⋯</button>`;
  page.innerHTML = header(esc(c.t), { back: 'cifras', right }) + `
    <div class="cbar">
      <button class="btn" id="tom">Tom ${keyNow >= 0 ? keyName(keyNow) : '?'} ▾</button>
      <button class="btn" id="fm">A−</button><button class="btn" id="fp">A+</button>
      ${hasTab ? `<button class="btn" id="tb">${CS.tab ? '☑' : '☐'} Tab</button>` : ''}
      ${c.r && !V.rearm ? `<button class="btn" id="sw">${V.show === 'r' ? 'Ver original' : 'Ver rearmonizada'}</button>` : ''}
      <span style="flex:1"></span>
      <button class="btn ${V.rearm ? 'pu' : ''}" id="rm" style="${V.rearm ? '' : 'color:#C9A6FF'}">${icon('wand', 16)} ${V.rearm ? 'Pronto' : 'Rearmonizar'}</button>
    </div>
    ${V.tom ? tomPanel(key0, semi) : ''}
    ${c.a ? `<div style="padding:0 14px 4px;color:var(--mut);font-size:14px">${esc(c.a)}</div>` : ''}
    ${V.rearm ? `<div style="margin:0 12px 8px;padding:9px 12px;border-radius:12px;background:#3A2D5C55;border:1px solid #6b4fa8;font-size:14px">Toque num acorde pra ver as opções. O que você mudar fica <b style="color:#C9A6FF">roxo</b> e é salvo sozinho.</div>` : ''}
    <div class="cifra ${V.rearm ? 'rearm' : ''}" id="cf" style="font-size:${CS.fs}px">${body}</div>
    ${V.rearm ? `<div class="rmbar"><button class="btn" id="un" ${V.undo.length ? '' : 'disabled style="opacity:.4"'}>${icon('undo', 16)} Desfazer</button><button class="btn pu" id="ok">Pronto</button></div>` : ''}`;
  const redraw = () => cifraPage(page, id);
  $('#tom', page).onclick = () => { V.tom = !V.tom; redraw(); };
  $('#fm', page).onclick = () => { CS.fs = Math.max(11, CS.fs - 1); store.set('cifraOpts', CS); redraw(); };
  $('#fp', page).onclick = () => { CS.fs = Math.min(24, CS.fs + 1); store.set('cifraOpts', CS); redraw(); };
  if ($('#tb', page)) $('#tb', page).onclick = () => { CS.tab = !CS.tab; store.set('cifraOpts', CS); redraw(); };
  if ($('#sw', page)) $('#sw', page).onclick = () => { V.show = V.show === 'r' ? 'o' : 'r'; redraw(); };
  const toggleRm = () => { V.rearm = !V.rearm; if (V.rearm && !c.r) { c.r = c.x; } if (!V.rearm) { if (c.r === c.x) c.r = null; putCifra(c); V.show = c.r ? 'r' : 'o'; V.undo = []; } redraw(); };
  $('#rm', page).onclick = toggleRm; if ($('#ok', page)) $('#ok', page).onclick = toggleRm;
  if ($('#un', page)) $('#un', page).onclick = () => { if (!V.undo.length) return; c.r = V.undo.pop(); putCifra(c); redraw(); };
  $$('.tompanel [data-semi]', page).forEach(b => b.onclick = () => { c.semi = +b.dataset.semi; putCifra(c); if (b.dataset.close) V.tom = false; redraw(); });
  $('#menu', page).onclick = () => sheet(esc(c.t), `
    ${c.r ? `<button class="btn" style="width:100%;margin-bottom:8px" id="mx">Apagar a rearmonização</button>` : ''}
    <button class="btn" style="width:100%;margin-bottom:8px;background:#5a2323" id="md">${icon('trash', 16)} Apagar esta cifra</button>`, sh => {
    if ($('#mx', sh)) $('#mx', sh).onclick = () => { if (confirm('Apagar a rearmonização desta cifra?')) { c.r = null; putCifra(c); V.show = 'o'; closeSheet(); redraw(); } };
    $('#md', sh).onclick = () => { if (confirm('Apagar a cifra "' + c.t + '"?')) { saveCifras(cifras().filter(x => x.id !== c.id)); closeSheet(); go('cifras'); } };
  });
  $('#cf', page).onclick = e => {
    const s = e.target.closest('.ch'); if (!s) return;
    if (!V.rearm) { playChord(s.textContent); s.classList.add('lit'); setTimeout(() => s.classList.remove('lit'), 500); return; }
    openMap(c, V, +s.dataset.l, +s.dataset.c, semi, flats, redraw);
  };
}
function tomPanel(key0, semi) {
  const cur = key0 < 0 ? -1 : (key0 % 12 + semi + 120) % 12, minor = key0 >= 12;
  const cell = (lab, s, on, close) => `<button class="${on ? 'on' : ''}" data-semi="${s}" ${close ? 'data-close="1"' : ''}>${lab}</button>`;
  let g = ''; for (let i = 0; i < 12; i++) { const s = key0 < 0 ? i : ((i - key0 % 12 + 18) % 12) - 6; g += cell((flatKey(i + (minor ? 12 : 0)) ? FLAT : SHARP)[i] + (minor ? 'm' : ''), s, i === cur, true); }
  return `<div class="tompanel"><div class="row"><button class="btn" data-semi="0" data-close="1">↺</button><button class="btn" data-semi="${semi - 1}">−½ tom</button><button class="btn" data-semi="${semi + 1}">+½ tom</button>
    <span style="color:var(--mut);font-size:13px;margin-left:auto">${semi ? (semi > 0 ? '+' : '') + semi / 2 + ' tom' : 'tom original'}</span></div><div class="g">${key0 < 0 ? '' : g}</div></div>`;
}
/** Tablatura acompanha o tom: cada casa anda os semitons (abaixo de 0 sobe uma oitava). */
function transTab(l, semi) {
  if (!semi) return l; const m = l.match(/^(\s*[A-Ga-g]?[#b]?\|)(.*)$/); if (!m) return l;
  return m[1] + m[2].replace(/\d+/g, d => { let f = +d + semi; while (f < 0) f += 12; return String(f); });
}

// ---------------- REARMONIZAR (as opções do Rearmonizar do app) ----------------
const R_IV = [0, 2, 4, 5, 7, 9, 11], R_TRI = ['', 'm', 'm', '', '', 'm', '°'], R_SEV = ['7M', 'm7', 'm7', '7M', '7', 'm7', 'm7(b5)'], R_FUN = [0, 1, 0, 1, 2, 0, 2];
const R_FN = ['Repouso', 'Preparação', 'Tensão', 'Passagem'], R_FNC = ['#3DDC84', '#6EA8FF', '#FF8A1E', '#B18CFF'];
const GP = 'Preparar a chegada (vai antes)', GT = 'Trocar este acorde', GN = 'Vizinhos (muda 1 nota)', GE = 'Empréstimo modal', GV = 'Variar no mesmo compasso';
function relMajor(key) { return key < 0 ? 0 : key >= 12 ? (key % 12 + 3) % 12 : key; }
function degreeOf(c, key) {
  if (!c) return -1; const R = relMajor(key);
  for (let i = 0; i < 7; i++) if ((R + R_IV[i]) % 12 === c.root) {
    const m = R_TRI[i] === 'm', dm = R_TRI[i] === '°', cd = /°|dim|b5/.test(c.text);
    if (dm ? (cd || c.minor) : (m === c.minor)) return i; if (i === 4 && !c.minor) return i;
  }
  return -1;
}
function rearmOptions(text, key) {
  const c = parseChord(text.replace(/^§/, '').replace(/^\(+|\)+$/g, '')); const o = []; if (!c) return o;
  const nn = flatKey(key) ? FLAT : SHARP, root = c.root, R = relMajor(key), d = key < 0 ? -1 : degreeOf(c, key);
  const me = c.text, rn = nn[root], suf = c.suf, dom = nn[(root + 7) % 12] + '7', sus = /4|sus/.test(me);
  const add = (g, label, desc, kind, ...ch) => o.push({ g, label, desc, kind, ch });
  // preparar (vai antes)
  add(GP, 'Dominante', 'tensão que puxa pro ' + me, 'ins', dom);
  add(GP, 'Dominante com baixo na 3ª', 'o baixo sobe meio tom e cai no ' + me, 'ins', dom + '/' + SHARP[(root + 11) % 12]);
  if (!sus) add(GP, 'Sus4', 'suspende e resolve no ' + me, 'ins', rn + '4');
  add(GP, 'ii – V', 'prepara e resolve (o clássico 2-5-1)', 'ins', nn[(root + 2) % 12] + (c.minor ? 'm7(b5)' : 'm7'), dom);
  add(GP, '7(4) → 7', 'dominante suspenso que resolve', 'ins', nn[(root + 7) % 12] + '7(4)', dom);
  add(GP, 'Gospel (IV/V)', 'o som de igreja antes do ' + me, 'ins', nn[(root + 5) % 12] + '/' + SHARP[(root + 7) % 12]);
  add(GP, 'Plagal (IV)', 'o "amém": chega pelo IV', 'ins', nn[(root + 5) % 12] + (c.minor ? 'm' : ''));
  if (!c.minor) add(GP, 'iv menor', 'IV menor antes: bem emotivo', 'ins', nn[(root + 5) % 12] + 'm');
  add(GP, 'Diminuto', 'sobe meio tom até o ' + me, 'ins', nn[(root + 11) % 12] + '°');
  add(GP, 'Diminuto de cima', 'desce meio tom até o ' + me, 'ins', nn[(root + 1) % 12] + '°');
  add(GP, 'SubV', 'dominante substituto: desce meio tom', 'ins', nn[(root + 1) % 12] + '7');
  add(GP, 'Cromático de cima', 'o mesmo acorde meio tom acima', 'ins', nn[(root + 1) % 12] + suf);
  add(GP, 'bVII', 'chega de um tom abaixo', 'ins', nn[(root + 10) % 12]);
  if (!c.minor) add(GP, 'bVI – bVII', 'cadência emprestada do menor, chega com força', 'ins', nn[(root + 8) % 12], nn[(root + 10) % 12]);
  add(GP, 'V7(b9)', 'dominante bem tenso', 'ins', nn[(root + 7) % 12] + '7(b9)');
  // trocar
  if (d >= 0) {
    add(GT, 'Tétrade', '', 'rep', rn + R_SEV[d]);
    if (R_TRI[d] !== '°') add(GT, 'Com 9', '', 'rep', rn + (R_TRI[d] === 'm' ? 'm(9)' : '9'));
    const grp = R_FUN[d] === 0 ? [0, 5, 2] : R_FUN[d] === 1 ? [3, 1] : [4, 6];
    for (const g of grp) if (g !== d) add(GT, 'Mesma função', R_FN[R_FUN[d]].toLowerCase() + ', outra cor', 'rep', nn[(R + R_IV[g]) % 12] + R_TRI[g]);
  } else { add(GT, 'Com 7ª', '', 'rep', rn + (c.minor ? 'm7' : '7')); add(GT, 'Com 9', '', 'rep', rn + (c.minor ? 'm(9)' : '9')); }
  if (!c.hasBass && !/°/.test(me)) add(GT, 'Baixo na 3ª', 'baixo andando', 'rep', rn + (c.minor ? 'm' : '') + '/' + SHARP[(root + (c.minor ? 3 : 4)) % 12]);
  if (!sus) add(GT, 'Sus4', '', 'rep', rn + '4');
  // vizinhos (Harmonia ilustrada): muda uma nota só
  if (!/°|dim|\+|aug|sus|4/.test(suf)) {
    if (c.minor) { add(GN, 'Homônimo', 'mesmo nome, maior', 'rep', rn); add(GN, 'Relativo', 'divide 2 notas', 'rep', nn[(root + 3) % 12]); add(GN, 'Anti-relativo', 'divide 2 notas', 'rep', nn[(root + 8) % 12]); }
    else { add(GN, 'Homônimo', 'mesmo nome, menor', 'rep', rn + 'm'); add(GN, 'Relativo', 'divide 2 notas', 'rep', nn[(root + 9) % 12] + 'm'); add(GN, 'Anti-relativo', 'divide 2 notas', 'rep', nn[(root + 4) % 12] + 'm'); add(GN, 'Aumentado', 'a 5ª sobe ½ tom (passagem)', 'var', rn + '+'); }
  }
  // empréstimo modal
  if (key >= 0 && key < 12) {
    const T0 = R;
    if (d === 0) { add(GE, 'I menor', 'o I com cor triste', 'rep', nn[T0] + 'm'); add(GE, 'bVI', 'do menor: surpresa no lugar do I', 'rep', nn[(T0 + 8) % 12] + '7M'); add(GE, 'bIII', 'do menor', 'rep', nn[(T0 + 3) % 12] + '7M'); }
    if (d === 3 || d === 1) { add(GE, 'iv menor', 'a cor mais usada no louvor', 'rep', nn[(T0 + 5) % 12] + 'm'); add(GE, 'iv6', 'iv menor com 6ª', 'rep', nn[(T0 + 5) % 12] + 'm6'); add(GE, 'iiø', 'do menor', 'rep', nn[(T0 + 2) % 12] + 'm7(b5)'); add(GE, 'bVI', 'do menor', 'rep', nn[(T0 + 8) % 12] + '7M'); add(GE, 'bVII', 'do mixolídio', 'rep', nn[(T0 + 10) % 12]); add(GE, 'bII (napolitano)', 'do frígio', 'rep', nn[(T0 + 1) % 12] + '7M'); }
    if (d === 4 || d === 6) { add(GE, 'v menor', 'dominante sem tensão (mixolídio)', 'rep', nn[(T0 + 7) % 12] + 'm7'); add(GE, 'bVII7', 'dominante "de trás": resolve no I', 'rep', nn[(T0 + 10) % 12] + '7'); add(GE, 'bII7', 'SubV do I', 'rep', nn[(T0 + 1) % 12] + '7'); }
    if (d === 5 || d === 2) { add(GE, 'bVI', 'do menor', 'rep', nn[(T0 + 8) % 12] + '7M'); add(GE, 'bIII', 'do menor', 'rep', nn[(T0 + 3) % 12] + '7M'); }
  } else if (key >= 12) {
    const T0 = key % 12;
    if (d === 5) add(GE, 'I maior (picardia)', 'termina luminoso', 'rep', nn[T0]);
    if (d === 1 || d === 6) { add(GE, 'IV maior', 'do dórico', 'rep', nn[(T0 + 5) % 12]); add(GE, 'ii m7', 'do dórico', 'rep', nn[(T0 + 2) % 12] + 'm7'); }
    if (d === 2 || d === 4) { add(GE, 'V7', 'do menor harmônico: puxa forte pro i', 'rep', nn[(T0 + 7) % 12] + '7'); add(GE, 'vii°', 'do menor harmônico', 'rep', nn[(T0 + 11) % 12] + '°'); }
  }
  if (!c.minor) add(GE, 'iv antes', 'o iv menor do ' + me + ' antes dele', 'ins', nn[(root + 5) % 12] + 'm');
  add(GE, 'bVII antes', 'chega do bVII (mixolídio)', 'ins', nn[(root + 10) % 12]);
  // variar no mesmo compasso
  if (!/°|dim|b5/.test(me)) {
    const head = me.split('/')[0], third = SHARP[(root + (c.minor ? 3 : 4)) % 12], fifth = SHARP[(root + 7) % 12];
    add(GV, 'Inversão', 'na metade do compasso o baixo vai pra 3ª', 'var', head + '/' + third);
    add(GV, 'Baixo na 5ª', 'na metade do compasso', 'var', head + '/' + fifth);
    add(GV, 'Baixo subindo', 'o baixo anda 1 → 3 → 5', 'var', head + '/' + third, head + '/' + fifth);
    if (c.minor) add(GV, 'Baixo descendo', 'clichê do menor: desce de meio em meio tom', 'var', head + '/' + SHARP[(root + 11) % 12], head + '/' + SHARP[(root + 10) % 12], head + '/' + SHARP[(root + 9) % 12]);
    else add(GV, 'Baixo descendo', 'desce meio tom e mais meio: puxa o próximo', 'var', head + '/' + SHARP[(root + 11) % 12], head + '/' + SHARP[(root + 10) % 12]);
    if (!sus) { add(GV, 'Termina em sus4', 'segura no fim do compasso', 'var', rn + '4'); add(GV, 'Sus4 e volta', 'suspende e resolve nele mesmo', 'var', rn + '4', head); }
    if (c.minor) add(GV, 'Linha por cima', 'a nota de cima desce: m → m7M → m7 → m6', 'var', rn + 'm7M', rn + 'm7', rn + 'm6');
    else add(GV, 'Linha por cima', 'a nota de cima desce: 8 → 7M → 6', 'var', rn + '7M', rn + '6');
    if (!c.minor) add(GV, 'Vira dominante', 'no fim do compasso vira ' + rn + '7 e puxa pro ' + nn[(root + 5) % 12], 'var', rn + '7');
  }
  return o;
}
/** Todos os acordes da cifra, em ordem (linha, coluna). */
function allChordsOf(text) { const out = []; text.split('\n').forEach((l, li) => { if (lineKind(l) === 'c') chordToks(l).forEach(t => out.push({ li, col: t.col, t: t.t, core: t.core })); }); return out; }
/** Põe acordes numa linha de acordes: antes / no lugar / depois do acorde em 'col'. Empurra o resto só se não couber. */
function editLine(line, col, kind, chords) {
  const toks = []; const re = /\S+/g; let mm; while ((mm = re.exec(line))) toks.push({ t: mm[0], col: mm.index });
  const k = toks.findIndex(t => t.col === col); if (k < 0) return line;
  const nw = chords.map(c => ({ t: '§' + c, col: -1 }));
  if (kind === 'rep') { toks.splice(k, 1, ...nw.map((n, i) => ({ t: n.t, col: i ? -1 : col }))); }
  else if (kind === 'ins') { const w = nw.reduce((s, n) => s + n.t.length + 1, 0); const prevEnd = k > 0 ? toks[k - 1].col + toks[k - 1].t.length + 1 : 0; let start = Math.max(prevEnd, col - w);
    nw.forEach(n => { n.col = start; start += n.t.length + 1; }); toks.splice(k, 0, ...nw); }
  else { toks.splice(k + 1, 0, ...nw); }
  let out = '', pos = 0; for (const t of toks) { const c = Math.max(t.col < 0 ? pos + 1 : t.col, out ? pos + 1 : 0); out += ' '.repeat(c - pos) + t.t; pos = c + t.t.length; }
  // o resto da linha que não é acorde (ex.: "|" ou "x2") some só se ficar embaixo de um acorde; aqui a linha é só de acordes
  return out;
}
function openMap(c, V, li, col, semi, flats, redraw) {
  const key = parseKey(c.k); const text = c.r || c.x; const all = allChordsOf(text);
  const k = all.findIndex(x => x.li === li && x.col === col); if (k < 0) return;
  const me = all[k], prev = all[k - 1], next = all[k + 1];
  const show = t => transChord(t, semi, flats).replace(/^§/, '');
  // tudo no tom que está na tela; ao salvar, volta pro tom original da cifra
  const keyD = key < 0 ? -1 : (key % 12 + semi + 120) % 12 + (key >= 12 ? 12 : 0);
  const opts = rearmOptions(show(me.core), keyD);
  const back = ch => transChord(ch, -semi, flatKey(key));
  const d = keyD >= 0 ? degreeOf(parseChord(show(me.core)), keyD) : -1;
  const fnC = t => { const dd = keyD >= 0 ? degreeOf(parseChord(show(t).replace(/^\(+|\)+$/g, '')), keyD) : -1; return dd < 0 ? R_FNC[3] : R_FNC[R_FUN[dd]]; };
  const gNum = dd => keyD >= 12 ? ((dd - 5 + 7) % 7) + 1 : dd + 1;
  let chosen = -1;
  const groups = [...new Set(opts.map(o => o.g))];
  const optHtml = groups.map(g => `<div class="og">${g}</div><div class="opts">${opts.map((o, i) => o.g === g ? `<button class="opt" data-o="${i}"><b>${o.ch.join(' → ')}</b><small>${o.label}${o.desc ? ' · ' + o.desc : ''}</small></button>` : '').join('')}</div>`).join('');
  const isMine = me.t.startsWith('§');
  sheet('', `
    <div class="path"><div class="pc" style="color:${prev ? fnC(prev.core) : '#888'}">${prev ? esc(show(prev.t)) : 'início'}</div><span class="ar">→</span>
      <div class="pc me" style="color:${fnC(me.core)}">${esc(show(me.t))}</div><span class="ar">→</span>
      <div class="pc" style="color:${next ? fnC(next.core) : '#888'}">${next ? esc(show(next.t)) : 'fim'}</div></div>
    <div style="color:var(--mut);font-size:13.5px;margin:-4px 2px 6px">${d >= 0 ? `Grau ${gNum(d)} do tom · <span style="color:${R_FNC[R_FUN[d]]}">${R_FN[R_FUN[d]]}</span>` : 'Fora do campo do tom (passagem)'}${isMine ? ' · <b style="color:#C9A6FF">você colocou</b>' : ''}</div>
    <div class="row"><button class="btn" id="ouv">${icon('play', 15)} Ouvir como está</button>${isMine ? `<button class="btn" id="tir">✕ Tirar</button>` : ''}</div>
    ${optHtml}
    <div style="position:sticky;bottom:0;padding-top:10px;background:#1A1C21"><button class="btn pu" style="width:100%;opacity:.4" id="use" disabled>Usar</button></div>`, sh => {
    const seqFor = o => { const p = prev ? [show(prev.t)] : [], n = next ? [show(next.t)] : []; const m = show(me.t);
      if (!o) return [...p, m, ...n]; const ch = o.ch; return o.kind === 'ins' ? [...p, ...ch, m, ...n] : o.kind === 'rep' ? [...p, ...ch, ...n] : [...p, m, ...ch, ...n]; };
    $('#ouv', sh).onclick = () => playSeq(seqFor(null), null, .9);
    $$('[data-o]', sh).forEach(b => b.onclick = () => { $$('.opt', sh).forEach(x => x.classList.remove('on')); b.classList.add('on'); chosen = +b.dataset.o; const u = $('#use', sh); u.disabled = false; u.style.opacity = 1; playSeq(seqFor(opts[chosen]), null, .9); });
    $('#use', sh).onclick = () => { if (chosen < 0) return; const o = opts[chosen]; V.undo.push(c.r || c.x); const L = (c.r || c.x).split('\n'); L[li] = editLine(L[li], col, o.kind, o.ch.map(back)); c.r = L.join('\n'); putCifra(c); closeSheet(); toast(o.kind === 'ins' ? 'Coloquei antes' : o.kind === 'var' ? 'Coloquei no mesmo compasso' : 'Troquei'); redraw(); };
    if ($('#tir', sh)) $('#tir', sh).onclick = () => { V.undo.push(c.r); const L = c.r.split('\n'); const toks = [...L[li].matchAll(/\S+/g)].map(m => ({ t: m[0], col: m.index })).filter(t => t.col !== col); let out = '', pos = 0; for (const t of toks) { out += ' '.repeat(Math.max(out ? 1 : 0, t.col - pos)) + t.t; pos = out.length; } L[li] = out; c.r = L.join('\n'); putCifra(c); closeSheet(); redraw(); };
  });
}
