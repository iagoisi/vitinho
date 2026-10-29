import type { IncomingMessage, ServerResponse } from 'node:http'

export default function handler(req: IncomingMessage, res: ServerResponse) {
  res.setHeader('Cache-Control', 'no-store')
  if (req.method !== 'GET') { res.statusCode = 405; res.end(); return }

  const token = process.env.MAPBOX_TOKEN
  if (!token?.startsWith('pk.')) { res.statusCode = 503; res.end(); return }

  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.end(JSON.stringify({ token }))
}
