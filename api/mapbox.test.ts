import type { IncomingMessage, ServerResponse } from 'node:http'
import { afterEach, expect, it, vi } from 'vitest'
import handler from './mapbox'

async function request(path: string) {
  const headers: Record<string, string> = {}
  let body = ''
  const res = {
    statusCode: 200,
    setHeader(name: string, value: string) { headers[name] = value },
    end(value?: Buffer) { body = value?.toString('utf8') ?? '' },
  }
  await handler({ method: 'GET', url: `/api/mapbox?path=${encodeURIComponent(path)}` } as IncomingMessage, res as unknown as ServerResponse)
  return { status: res.statusCode, headers, body }
}

afterEach(() => {
  vi.unstubAllGlobals()
  delete process.env.MAPBOX_TOKEN
})

it('keeps the Mapbox token out of tile metadata and preserves tile placeholders', async () => {
  process.env.MAPBOX_TOKEN = 'pk.test-secret-value'
  const upstream = vi.fn(async (_url: URL) => new Response(JSON.stringify({
    tiles: ['https://a.tiles.mapbox.com/v4/mapbox.mapbox-streets-v8/{z}/{x}/{y}.vector.pbf?access_token=pk.test-secret-value'],
  }), { headers: { 'content-type': 'application/json' } }))
  vi.stubGlobal('fetch', upstream)

  const result = await request('/v4/mapbox.mapbox-streets-v8.json')
  expect(result.status).toBe(200)
  expect(result.body).not.toContain(process.env.MAPBOX_TOKEN)
  expect(JSON.parse(result.body).tiles[0]).toContain('{z}%2F{x}%2F{y}')
  expect(JSON.parse(result.body).tiles[0]).toMatch(/^\/api\/mapbox\?path=/)
  expect(String(upstream.mock.calls[0]?.[0])).toContain('access_token=pk.test-secret-value')
})

it('rejects resources outside the map style and tilesets', async () => {
  process.env.MAPBOX_TOKEN = 'pk.test-secret-value'
  const upstream = vi.fn()
  vi.stubGlobal('fetch', upstream)

  expect((await request('/styles/v1/another-account/another-style')).status).toBe(403)
  expect((await request('/v4/another.tileset.json')).status).toBe(403)
  expect(upstream).not.toHaveBeenCalled()
})
