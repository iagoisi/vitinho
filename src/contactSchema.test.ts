import { describe, expect, it } from 'vitest'
import { contactSchema } from './contactSchema'

const valid = { name: 'Ana Silva', email: 'ana@example.com', profile: 'traveler', period: 'July 2027', participants: 2, interest: 'birding', consent: true, startedAt: Date.now() }

describe('contact inquiry', () => {
  it('accepts a complete private inquiry', () => expect(contactSchema.safeParse(valid).success).toBe(true))
  it('requires an organization for operators', () => expect(contactSchema.safeParse({ ...valid, profile: 'operator' }).success).toBe(false))
  it('rejects invalid email and a filled honeypot', () => {
    expect(contactSchema.safeParse({ ...valid, email: 'wrong' }).success).toBe(false)
    expect(contactSchema.safeParse({ ...valid, website: 'spam' }).success).toBe(false)
  })
})
