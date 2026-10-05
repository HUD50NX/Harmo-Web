// Harmo Web — o que o servidorzinho usa pra ler as páginas de cifra (sem rota própria: começa com _).
export const H = {
  'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36',
  'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
  'accept-language': 'pt-BR,pt;q=0.9,en;q=0.8',
  'sec-fetch-dest': 'document', 'sec-fetch-mode': 'navigate', 'sec-fetch-site': 'none', 'upgrade-insecure-requests': '1',
};
export const unesc = s => s.replace(/&#(\d+);/g, (_, n) => String.fromCharCode(+n)).replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCharCode(parseInt(n, 16)))
  .replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&');
const strip = s => unesc(s.replace(/<!--[\s\S]*?-->/g, '').replace(/<\/div>\s*<div[^>]*>/g, '').replace(/<[^>]+>/g, ''));
export function parseCifra(html) {
  const pre = html.match(/<pre[^>]*data-chord-content[^>]*>([\s\S]*?)<\/pre>/) || html.match(/<div class="cifra_cnt[\s\S]*?<pre[^>]*>([\s\S]*?)<\/pre>/) || html.match(/<pre[^>]*>([\s\S]*?)<\/pre>/);
  if (!pre) return null;
  const x = strip(pre[1]).replace(/\r/g, '');
  const title = (html.match(/<title>([\s\S]*?)<\/title>/) || [])[1] || '';
  const parts = unesc(title).split(' - ').map(s => s.trim()).filter(Boolean);
  if (parts.length > 1 && /cifra/i.test(parts[parts.length - 1])) parts.pop();
  const t = parts.length > 1 ? parts.slice(0, -1).join(' - ') : parts[0] || '';
  const a = parts.length > 1 ? parts[parts.length - 1] : '';
  const k = (html.match(/>Tom(?:<!-- -->)?:\s*<\/span>\s*<[^>]*>\s*([A-G][#b]?m?)/) || html.match(/Tom:\s*(?:<[^>]+>\s*)*([A-G][#b]?m?)\b/) || [])[1] || '';
  return { t, a, k, x };
}
const BAD = /^(letra|musicas|discografia|fotos|videos|cifras|top|albuns|playlist|biografia|tocar)/;
export function songsFrom(html, a) {
  const out = [], seen = new Set();
  const re = new RegExp(`<a[^>]*href="(?:https://www\\.cifraclub\\.com\\.br)?/${a}/([a-z0-9-]+)/"[^>]*>([\\s\\S]*?)</a>`, 'g');
  let m; while ((m = re.exec(html))) {
    const u = m[1]; if (seen.has(u) || BAD.test(u)) continue;
    const inner = m[2];
    let t = (inner.match(/primaryLabel[^>]*>\s*<span[^>]*>([^<]+)<\/span>/) || inner.match(/Capa da música &quot;(.*?)&quot;/) || [])[1];
    if (!t) { const txt = inner.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim(); if (!txt || txt.length > 80) continue; t = txt; }
    seen.add(u); out.push({ u, t: unesc(t).trim() });
  }
  return out;
}
export const json = (o, status, cache) => new Response(JSON.stringify(o), { status: status || 200, headers: { 'content-type': 'application/json', 'access-control-allow-origin': '*', ...(cache ? { 'cache-control': 'public, s-maxage=86400, stale-while-revalidate=604800' } : {}) } });
