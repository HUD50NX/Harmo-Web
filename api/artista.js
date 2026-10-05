// Harmo Web — as músicas de um artista (as mais tocadas primeiro). GET /api/artista?a=<artista-no-link>
import { H, songsFrom, json } from './_lib.js';
export const config = { runtime: 'edge' };
export default async function (req) {
  const a = new URL(req.url).searchParams.get('a') || '';
  if (!/^[a-z0-9-]{1,120}$/.test(a)) return json({ erro: 'artista inválido' }, 400);
  const pages = await Promise.all([`https://www.cifraclub.com.br/${a}/musicas.html`, `https://www.cifraclub.com.br/${a}/`].map(u => fetch(u, { headers: H }).then(r => r.ok ? r.text() : '').catch(() => '')));
  const all = [], seen = new Set();
  for (const h of pages) for (const s of songsFrom(h, a)) if (!seen.has(s.u)) { seen.add(s.u); all.push(s); }
  if (!all.length) return json({ erro: 'nada encontrado' }, 404);
  return json({ songs: all.slice(0, 500) }, 200, true);
}
