import { describe, expect, it } from 'vitest'
import handler from '../api/contact'

function response() {
  return { code: 0, body: {} as object, status(code: number) { this.code = code; return this }, json(body: object) { this.body = body }, setHeader() {} }
}

const inquiry = { name: 'Ana Silva', email: 'ana@example.com', profile: 'traveler', period: 'July 2027', participants: 2, interest: 'birding', consent: true, startedAt: Date.now() - 5000 }

describe('contact function', () => {
  it('rejects invalid and rushed submissions', async () => {
    const invalid = response()
    await handler({ method: 'POST', body: { ...inquiry, email: 'bad' }, headers: {} }, invalid)
    expect(invalid.code).toBe(400)
    const rushed = response()
    await handler({ method: 'POST', body: { ...inquiry, startedAt: Date.now() }, headers: {} }, rushed)
    expect(rushed.code).toBe(400)
  })
  it('reports missing delivery configuration without claiming success', async () => {
    const result = response()
    await handler({ method: 'POST', body: inquiry, headers: {} }, result)
    expect(result.code).toBe(503)
  })
  it('handles malformed JSON from the Vercel body parser', async () => {
    const result = response()
    const request = { method: 'POST', headers: {}, get body(): never { throw new Error('Malformed JSON') } }
    await handler(request, result)
    expect(result.code).toBe(400)
  })
  it('rejects cross-origin browser submissions', async () => {
    const result = response()
    await handler({ method: 'POST', body: inquiry, headers: { origin: 'https://other.example', host: 'vitinho.example' } }, result)
    expect(result.code).toBe(403)
  })
})
