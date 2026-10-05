// Harmo Web — as músicas de um artista (as mais tocadas primeiro).
// GET /api/artista?a=<artista-no-link>
const H = {
  'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36',
  'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
  'accept-language': 'pt-BR,pt;q=0.9,en;q=0.8',
  'sec-fetch-dest': 'document', 'sec-fetch-mode': 'navigate', 'sec-fetch-site': 'none', 'upgrade-insecure-requests': '1',
};
const unesc = s => s.replace(/&#(\d+);/g, (_, n) => String.fromCharCode(+n)).replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
const BAD = /^(letra|musicas|discografia|fotos|videos|cifras|top|albuns|playlist|biografia|tocar)/;

function songsFrom(html, a) {
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

module.exports = async (req, res) => {
  res.setHeader('access-control-allow-origin', '*');
  const a = (req.query || {}).a || '';
  if (!/^[a-z0-9-]{1,120}$/.test(a)) { res.status(400).json({ erro: 'artista inválido' }); return; }
  try {
    const pages = await Promise.all([`https://www.cifraclub.com.br/${a}/musicas.html`, `https://www.cifraclub.com.br/${a}/`].map(u => fetch(u, { headers: H }).then(r => r.ok ? r.text() : '').catch(() => '')));
    const all = [], seen = new Set();
    for (const h of pages) for (const s of songsFrom(h, a)) if (!seen.has(s.u)) { seen.add(s.u); all.push(s); }
    if (!all.length) { res.status(404).json({ erro: 'nada encontrado' }); return; }
    res.setHeader('cache-control', 'public, s-maxage=86400, stale-while-revalidate=604800');
    res.status(200).json({ songs: all.slice(0, 500) });
  } catch (e) { res.status(502).json({ erro: 'falhou: ' + e.message }); }
};
module.exports.songsFrom = songsFrom;
