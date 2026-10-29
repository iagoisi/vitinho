import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslation } from 'react-i18next'
import { contactSchema, type ContactInput } from '../contactSchema'
import type { Language } from '../i18n'

export function ContactForm({ lang }: { lang: Language }) {
  const { t } = useTranslation(undefined, { lng: lang })
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const { register, handleSubmit, watch, reset, setValue, formState: { errors, isSubmitting } } = useForm<ContactInput>({
    resolver: zodResolver(contactSchema),
    defaultValues: { profile: 'traveler', participants: 1, organization: '', species: '', details: '', website: '', consent: undefined, startedAt: 0 },
  })
  useEffect(() => { setValue('startedAt', Date.now()) }, [setValue])
  const operator = watch('profile') === 'operator'
  const onSubmit = handleSubmit(async (values) => {
    setStatus('idle')
    try {
      const response = await fetch('/api/contact', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...values, lang }) })
      if (!response.ok) throw new Error('Delivery failed')
      setStatus('success')
      reset({ profile: 'traveler', participants: 1, organization: '', species: '', details: '', website: '', consent: undefined, startedAt: Date.now() })
    } catch {
      setStatus('error')
    }
  })
  const message = (name: keyof ContactInput) => errors[name] ? t(name === 'email' ? 'contact.invalidEmail' : name === 'participants' ? 'contact.invalidParticipants' : name === 'consent' ? 'contact.consentRequired' : 'contact.required') : undefined
  return (
    <form className="contact-form" onSubmit={onSubmit} noValidate>
      <div className="form-grid">
        <label>{t('contact.name')}<input autoComplete="name" {...register('name')} aria-invalid={!!errors.name} />{message('name') && <small role="alert">{message('name')}</small>}</label>
        <label>{t('contact.emailLabel')}<input type="email" autoComplete="email" {...register('email')} aria-invalid={!!errors.email} />{message('email') && <small role="alert">{message('email')}</small>}</label>
        <label>{t('contact.profile')}<select {...register('profile')}><option value="traveler">{t('contact.traveler')}</option><option value="operator">{t('contact.operator')}</option></select></label>
        {operator && <label>{t('contact.organization')}<input autoComplete="organization" {...register('organization')} aria-invalid={!!errors.organization} />{message('organization') && <small role="alert">{message('organization')}</small>}</label>}
        <label>{t('contact.period')}<input {...register('period')} aria-invalid={!!errors.period} placeholder={t('contact.periodExample')} />{message('period') && <small role="alert">{message('period')}</small>}</label>
        <label>{t('contact.participants')}<input type="number" min="1" max="100" inputMode="numeric" {...register('participants')} aria-invalid={!!errors.participants} />{message('participants') && <small role="alert">{message('participants')}</small>}</label>
        <label className="form-wide">{t('contact.interest')}<select {...register('interest')} defaultValue="" aria-invalid={!!errors.interest}><option value="" disabled>{t('contact.select')}</option>{(['birding', 'photography', 'wildlife', 'guiding'] as const).map((item) => <option value={item} key={item}>{t(`contact.${item}`)}</option>)}</select>{message('interest') && <small role="alert">{message('interest')}</small>}</label>
        <label className="form-wide">{t('contact.species')}<textarea rows={2} {...register('species')} /></label>
        <label className="form-wide">{t('contact.details')}<textarea rows={3} {...register('details')} /></label>
      </div>
      <label className="hidden-field" aria-hidden="true">Website<input tabIndex={-1} autoComplete="off" {...register('website')} /></label>
      <input type="hidden" {...register('startedAt')} />
      <label className="consent"><input type="checkbox" {...register('consent')} aria-invalid={!!errors.consent} /><span>{t('contact.consent')}</span></label>
      {message('consent') && <small role="alert">{message('consent')}</small>}
      <p className="privacy-note">{t('contact.response')}</p>
      <button className="button button-primary" disabled={isSubmitting} type="submit">{isSubmitting ? t('contact.sending') : t('contact.submit')} <span aria-hidden="true">↗</span></button>
      {status !== 'idle' && <p className={`form-status ${status}`} role="status">{t(`contact.${status}`)}</p>}
    </form>
  )
}
