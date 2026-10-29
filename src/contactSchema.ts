import { z } from 'zod'

export const contactSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.email().max(254),
  profile: z.enum(['traveler', 'operator']),
  organization: z.string().trim().max(120).default(''),
  period: z.string().trim().min(2).max(120),
  participants: z.coerce.number<number>().int().min(1).max(100),
  interest: z.enum(['birding', 'photography', 'wildlife', 'guiding']),
  species: z.string().trim().max(1000).default(''),
  details: z.string().trim().max(2000).default(''),
  consent: z.literal(true),
  website: z.string().max(0).default(''),
  startedAt: z.coerce.number<number>().int().positive(),
}).superRefine((value, context) => {
  if (value.profile === 'operator' && !value.organization) context.addIssue({ code: 'custom', path: ['organization'], message: 'Required for operators' })
})

export type ContactInput = z.input<typeof contactSchema>
