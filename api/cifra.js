// Harmo Web — servidorzinho: baixa a página da cifra e devolve só o que o app usa (título, artista, tom e o texto).
// GET /api/cifra?a=<artista-no-link>&m=<musica-no-link>
const H = {
  'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36',
  'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
  'accept-language': 'pt-BR,pt;q=0.9,en;q=0.8',
  'sec-fetch-dest': 'document', 'sec-fetch-mode': 'navigate', 'sec-fetch-site': 'none', 'upgrade-insecure-requests': '1',
};
const SLUG = /^[a-z0-9-]{1,120}$/;
const unesc = s => s.replace(/&#(\d+);/g, (_, n) => String.fromCharCode(+n)).replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCharCode(parseInt(n, 16)))
  .replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&');
const strip = s => unesc(s.replace(/<!--.*?-->/gs, '').replace(/<\/div>\s*<div[^>]*>/g, '').replace(/<[^>]+>/g, ''));

function parse(html) {
  const pre = html.match(/<pre[^>]*data-chord-content[^>]*>([\s\S]*?)<\/pre>/) || html.match(/<div class="cifra_cnt[\s\S]*?<pre[^>]*>([\s\S]*?)<\/pre>/) || html.match(/<pre[^>]*>([\s\S]*?)<\/pre>/);
  if (!pre) return null;
  const x = strip(pre[1]).replace(/\r/g, '');
  const title = (html.match(/<title>([\s\S]*?)<\/title>/) || [])[1] || '';
  const parts = unesc(title).split(' - ').map(s => s.trim()).filter(Boolean);
  if (parts.length > 1 && /cifra/i.test(parts[parts.length - 1])) parts.pop();          // tira o nome do site
  const t = parts.length > 1 ? parts.slice(0, -1).join(' - ') : parts[0] || '';
  const a = parts.length > 1 ? parts[parts.length - 1] : '';
  const k = (html.match(/>Tom(?:<!-- -->)?:\s*<\/span>\s*<[^>]*>\s*([A-G][#b]?m?)/) || html.match(/Tom:\s*(?:<[^>]+>\s*)*([A-G][#b]?m?)\b/) || [])[1] || '';
  return { t, a, k, x };
}

module.exports = async (req, res) => {
  res.setHeader('access-control-allow-origin', '*');
  const { a, m } = req.query || {};
  if (!SLUG.test(a || '') || !SLUG.test(m || '')) { res.status(400).json({ erro: 'link inválido' }); return; }
  try {
    const r = await fetch(`https://www.cifraclub.com.br/${a}/${m}/`, { headers: H, redirect: 'follow' });
    if (!r.ok) { res.status(502).json({ erro: 'site respondeu ' + r.status }); return; }
    const out = parse(await r.text());
    if (!out || !out.x.trim()) { res.status(404).json({ erro: 'cifra não encontrada' }); return; }
    res.setHeader('cache-control', 'public, s-maxage=86400, stale-while-revalidate=604800');
    res.status(200).json(out);
  } catch (e) { res.status(502).json({ erro: 'falhou: ' + e.message }); }
};
module.exports.parse = parse;
