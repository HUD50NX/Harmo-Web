/* Harmo Web — navegação (por #endereço, o "voltar" do iPhone funciona), Início e instalar como app. */
'use strict';
const ROUTES = {
  '': homePage,
  'cifras': cifrasPage,
  'cifra': cifraPage,           // #cifra/<id>
  'teoria': teoriaPage,
  'campo': campoPage,
  'escalas': () => scalePage(false),
  'arpejos': () => scalePage(true),
  'ilustrada': ilustradaPage,   // #ilustrada ou #ilustrada/<aba>
};
function go(h) { location.hash = h ? '#' + h : ''; }
function back(fallback) { if (history.length > 1 && document.referrer !== 'x') history.back(); else go(fallback || ''); }
function header(title, opts) {
  opts = opts || {};
  return `<div class="hd"><button class="ib" onclick="${opts.back ? `go('${opts.back}')` : 'history.back()'}" aria-label="Voltar">${icon('back')}</button><h1>${title}</h1>${opts.right || ''}</div>`;
}
function route() {
  stopSeq(); closeSheet();
  const h = decodeURIComponent(location.hash.slice(1)); const [name, ...rest] = h.split('/');
  const fn = ROUTES[name] || homePage; const page = $('#page'); page.innerHTML = ''; page.scrollTop = 0;
  fn(page, rest.join('/'));
}
window.addEventListener('hashchange', route);

// ---------------- Início ----------------
function homePage(page) {
  page.innerHTML = `<div class="scroll"><div class="center">
    <div class="home-t"><h1><span>Harmo</span></h1><p>web</p></div>
    <div class="ggrid">
      ${glass({ title: 'Minhas cifras', icon: 'note', color: '#FF8A1E', attrs: `onclick="go('cifras')"` })}
      ${glass({ title: 'Teoria', icon: 'book', color: '#4F8BFF', attrs: `onclick="go('teoria')"` })}
    </div>
    <div id="inst"></div>
  </div></div>`;
  installButton();
}

// ---------------- instalar (atalho como app) ----------------
let deferredPrompt = null;
window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); deferredPrompt = e; if (!location.hash) installButton(); });
const standalone = () => window.matchMedia('(display-mode: standalone)').matches || navigator.standalone;
const isIOS = () => /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
function installButton() {
  const box = $('#inst'); if (!box || standalone()) return;
  box.innerHTML = `<button class="install" onclick="install()">${icon('dl', 20)} Instalar o Harmo Web</button>`;
}
function install() {
  if (deferredPrompt) { deferredPrompt.prompt(); deferredPrompt.userChoice.finally(() => { deferredPrompt = null; }); return; }
  const ios = isIOS();
  sheet('Instalar o Harmo Web', ios ? `
    <div class="box" style="margin-top:0">No iPhone é pelo Safari, em 3 toques:</div>
    <div class="box"><b>1.</b> Toque em <b>Compartilhar</b> ${icon('share', 18).replace('class="ic"', 'class="ic" style="display:inline;vertical-align:-3px"')} (embaixo, no meio da barra do Safari).</div>
    <div class="box"><b>2.</b> Role e toque em <b>Adicionar à Tela de Início</b>.</div>
    <div class="box"><b>3.</b> Toque em <b>Adicionar</b>. O ícone do Harmo Web aparece junto com os seus apps e abre em tela cheia.</div>
    <div class="box m">Se estiver no Chrome do iPhone: toque em ⋯ / Compartilhar → Adicionar à Tela de Início.</div>` : `
    <div class="box" style="margin-top:0">No Chrome: toque em <b>⋮</b> (em cima, à direita) e depois em <b>Instalar app</b> ou <b>Adicionar à tela inicial</b>.</div>
    <div class="box m">No computador: o ícone de instalar aparece no fim da barra de endereço.</div>`);
}

if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('sw.js').catch(() => {});
route();
