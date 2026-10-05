// Harmo Web — baixa a página da cifra e devolve só o que o app usa (título, artista, tom e o texto).
// GET /api/cifra?a=<artista-no-link>&m=<musica-no-link>
import { H, parseCifra, json } from './_lib.js';
export const config = { runtime: 'edge' };
const SLUG = /^[a-z0-9-]{1,120}$/;
export default async function (req) {
  const q = new URL(req.url).searchParams, a = q.get('a') || '', m = q.get('m') || '';
  if (!SLUG.test(a) || !SLUG.test(m)) return json({ erro: 'link inválido' }, 400);
  try {
    const r = await fetch(`https://www.cifraclub.com.br/${a}/${m}/`, { headers: H });
    if (!r.ok) return json({ erro: 'site respondeu ' + r.status }, 502);
    const out = parseCifra(await r.text());
    if (!out || !out.x.trim()) return json({ erro: 'cifra não encontrada' }, 404);
    return json(out, 200, true);
  } catch (e) { return json({ erro: 'falhou: ' + e.message }, 502); }
}
