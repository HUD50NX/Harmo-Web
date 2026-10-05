import { run } from './_variants.js';
export const config = { regions: ['gru1'] };
export default async (req, res) => { res.setHeader('content-type', 'application/json'); res.end(JSON.stringify({ region: process.env.VERCEL_REGION, ...(await run()) })); };
