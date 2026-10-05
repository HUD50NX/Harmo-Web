import { run } from './_variants.js';
export const config = { runtime: 'edge' };
export default async () => new Response(JSON.stringify(await run()), { headers: { 'content-type': 'application/json' } });
