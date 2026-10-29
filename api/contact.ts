import { contactSchema } from '../src/contactSchema'

type Request = { method?: string; body?: unknown; headers: Record<string, string | string[] | undefined> }
type Response = { status: (code: number) => Response; json: (body: object) => void; setHeader: (name: string, value: string) => void }

export default async function handler(req: Request, res: Response) {
  res.setHeader('Cache-Control', 'no-store')
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  if (Number(req.headers['content-length'] ?? 0) > 10000) return res.status(413).json({ error: 'Request too large' })
  let body: unknown
  try { body = req.body } catch { return res.status(400).json({ error: 'Invalid JSON' }) }
  if (JSON.stringify(body ?? '').length > 10000) return res.status(413).json({ error: 'Request too large' })
  try {
    if (req.headers.origin && new URL(String(req.headers.origin)).host !== req.headers.host) return res.status(403).json({ error: 'Forbidden' })
  } catch { return res.status(403).json({ error: 'Forbidden' }) }
  const parsed = contactSchema.safeParse(body)
  if (!parsed.success) return res.status(400).json({ error: 'Invalid inquiry' })
  const inquiry = parsed.data
  // shortcut: honeypot and time check are basic spam friction; add edge rate limiting if abuse appears.
  if (inquiry.website || Date.now() - inquiry.startedAt < 3000 || Date.now() - inquiry.startedAt > 86400000) return res.status(400).json({ error: 'Invalid inquiry' })
  if (!process.env.RESEND_API_KEY || !process.env.RESEND_FROM) return res.status(503).json({ error: 'Email delivery not configured' })

  const lines = [
    `Language: ${body && typeof body === 'object' && 'lang' in body ? String(body.lang).slice(0, 10) : 'unknown'}`,
    `Profile: ${inquiry.profile}`,
    `Name: ${inquiry.name}`,
    `Email: ${inquiry.email}`,
    `Organization: ${inquiry.organization}`,
    `Period: ${inquiry.period}`,
    `Participants: ${inquiry.participants}`,
    `Interest: ${inquiry.interest}`,
    `Species / priorities: ${inquiry.species}`,
    `Details: ${inquiry.details}`,
  ]
  try {
    const result = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: process.env.RESEND_FROM, to: ['vitinhopantanal@gmail.com'], reply_to: inquiry.email, subject: `New ${inquiry.profile} inquiry — Vitinho Birdwatching Tours`, text: lines.join('\n') }),
    })
    if (!result.ok) return res.status(502).json({ error: 'Email delivery failed' })
    return res.status(200).json({ ok: true })
  } catch {
    return res.status(502).json({ error: 'Email delivery failed' })
  }
}
