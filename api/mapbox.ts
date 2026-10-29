import type { IncomingMessage, ServerResponse } from 'node:http'

const upstreamOrigin = 'https://api.mapbox.com'
const allowedPaths = [
  /^\/styles\/v1\/iagoisi09\/cmj4imuam00az01s2h11g3vyd(?:\/|$)/,
  /^\/fonts\/v1\/iagoisi09\//,
  /^\/v4\/mapbox\.(?:mapbox-terrain-dem-v1|mapbox-streets-v8|mapbox-terrain-v2-contour)(?:,mapbox\.(?:mapbox-terrain-dem-v1|mapbox-streets-v8|mapbox-terrain-v2-contour))*(?:\.json|\/)/,
]

function rewriteMapboxUrls(value: unknown): unknown {
  if (typeof value === 'string') {
    if (!value.startsWith('https://') && !value.startsWith('http://')) return value
    const url = new URL(value)
    if (url.hostname !== 'api.mapbox.com' && !url.hostname.endsWith('.tiles.mapbox.com')) return value
    url.searchParams.delete('access_token')
    const path = (url.pathname + url.search).replace(/%7B/gi, '{').replace(/%7D/gi, '}')
    return `/api/mapbox?path=${encodeURIComponent(path).replace(/%7B/gi, '{').replace(/%7D/gi, '}')}`
  }
  if (Array.isArray(value)) return value.map(rewriteMapboxUrls)
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([key, entry]) => [key, rewriteMapboxUrls(entry)]))
  }
  return value
}

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  if (req.method !== 'GET') { res.statusCode = 405; res.end(); return }

  const token = process.env.MAPBOX_TOKEN
  if (!token?.startsWith('pk.')) { res.statusCode = 503; res.end(); return }

  const path = new URL(req.url ?? '/', 'http://localhost').searchParams.get('path')
  if (!path || path.length > 1500 || !path.startsWith('/') || path.startsWith('//')) {
    res.statusCode = 400; res.end(); return
  }

  const upstream = new URL(path, upstreamOrigin)
  if (upstream.origin !== upstreamOrigin || !allowedPaths.some(pattern => pattern.test(upstream.pathname))) {
    res.statusCode = 403; res.end(); return
  }

  upstream.searchParams.delete('access_token')
  upstream.searchParams.set('access_token', token)

  try {
    const response = await fetch(upstream, { signal: AbortSignal.timeout(10000) })
    if (!response.ok) { res.statusCode = response.status; res.end(); return }
    const contentType = response.headers.get('content-type') ?? 'application/octet-stream'
    let body = Buffer.from(await response.arrayBuffer())
    if (contentType.includes('json')) {
      const json = JSON.stringify(rewriteMapboxUrls(JSON.parse(body.toString('utf8'))))
      if (json.includes(token)) { res.statusCode = 502; res.end(); return }
      body = Buffer.from(json)
    }
    res.setHeader('Content-Type', contentType)
    res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=86400')
    res.statusCode = 200
    res.end(body)
  } catch {
    res.statusCode = 502
    res.end()
  }
}
