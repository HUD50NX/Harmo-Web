export const VARS = [
  ['www', 'https://www.cifraclub.com.br/hillsong-united/oceans-where-feet-may-fail/', 'chrome'],
  ['com', 'https://www.cifraclub.com/hillsong-united/oceans-where-feet-may-fail/', 'chrome'],
  ['m', 'https://m.cifraclub.com.br/hillsong-united/oceans-where-feet-may-fail/', 'iphone'],
  ['www-iphone', 'https://www.cifraclub.com.br/hillsong-united/oceans-where-feet-may-fail/', 'iphone'],
  ['imprimir', 'https://www.cifraclub.com.br/hillsong-united/oceans-where-feet-may-fail/imprimir.html', 'chrome'],
  ['letras', 'https://www.letras.mus.br/hillsong-united/oceans-where-feet-may-fail/', 'chrome'],
  ['api', 'https://api.cifraclub.com.br/v3/', 'okhttp'],
];
const UA = { chrome: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36', iphone: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1', okhttp: 'okhttp/4.9.2' };
export async function run() {
  const out = {};
  await Promise.all(VARS.map(async ([n, u, ua]) => { try { const r = await fetch(u, { headers: { 'user-agent': UA[ua], 'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8', 'accept-language': 'pt-BR,pt;q=0.9', 'sec-fetch-dest': 'document', 'sec-fetch-mode': 'navigate', 'sec-fetch-site': 'none', 'upgrade-insecure-requests': '1' } }); const t = await r.text(); out[n] = r.status + ' ' + t.length + (t.includes('data-chord-content') || t.includes('<pre') ? ' PRE' : ''); } catch (e) { out[n] = 'ERR ' + e.message; } }));
  return out;
}
