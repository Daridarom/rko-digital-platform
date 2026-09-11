import { Readable } from 'node:stream';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,HEAD,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Range, Content-Type');
  res.setHeader('Access-Control-Expose-Headers', 'Accept-Ranges, Content-Length, Content-Range, Content-Type');
  res.setHeader('Cache-Control', 'public, max-age=300, s-maxage=3600');

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (!['GET', 'HEAD'].includes(req.method)) return res.status(405).json({ error: 'Method not allowed' });

  const id = String(req.query.id || '');
  if (!/^[A-Za-z0-9_-]{10,200}$/.test(id)) return res.status(400).json({ error: 'Invalid Google Drive file id' });

  const target = `https://drive.usercontent.google.com/download?id=${encodeURIComponent(id)}&export=download&confirm=t`;
  const headers = { 'User-Agent': 'RKO-Digital-Library/1.0' };
  if (req.headers.range) headers.Range = req.headers.range;

  try {
    const upstream = await fetch(target, { headers, redirect: 'follow' });
    if (!upstream.ok && upstream.status !== 206) {
      return res.status(upstream.status).json({ error: `Google Drive returned ${upstream.status}` });
    }
    const pass = ['content-type', 'content-length', 'content-range', 'accept-ranges', 'etag', 'last-modified'];
    for (const name of pass) {
      const value = upstream.headers.get(name);
      if (value) res.setHeader(name, value);
    }
    if (!res.getHeader('Content-Type')) res.setHeader('Content-Type', 'application/pdf');
    res.status(upstream.status);
    if (req.method === 'HEAD' || !upstream.body) return res.end();
    Readable.fromWeb(upstream.body).pipe(res);
  } catch (error) {
    console.error(error);
    if (!res.headersSent) res.status(502).json({ error: 'Failed to fetch file from Google Drive' });
    else res.end();
  }
}
