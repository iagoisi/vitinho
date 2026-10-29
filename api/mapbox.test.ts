import type { IncomingMessage, ServerResponse } from 'node:http'
import { afterEach, expect, it } from 'vitest'
import handler from './mapbox'

function request(method = 'GET') {
  const headers: Record<string, string> = {}
  let body = ''
  const res = {
    statusCode: 200,
    setHeader(name: string, value: string) { headers[name] = value },
    end(value?: string) { body = value ?? '' },
  }
  handler({ method } as IncomingMessage, res as unknown as ServerResponse)
  return { status: res.statusCode, headers, body }
}

afterEach(() => { delete process.env.MAPBOX_TOKEN })

it('serves only a public token to the Mapbox client', () => {
  process.env.MAPBOX_TOKEN = 'pk.test-token'
  const result = request()
  expect(result.status).toBe(200)
  expect(JSON.parse(result.body)).toEqual({ token: 'pk.test-token' })
  expect(result.headers['Cache-Control']).toBe('no-store')

  process.env.MAPBOX_TOKEN = 'sk.private-token'
  expect(request().status).toBe(503)
  expect(request('POST').status).toBe(405)
})
