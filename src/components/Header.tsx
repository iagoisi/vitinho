import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import type { Language } from '../i18n'
import { media } from '../media'

const links = ['about', 'destinations', 'experiences', 'wildlife', 'partners', 'contact'] as const

export function Header({ lang }: { lang: Language }) {
  const { t } = useTranslation(undefined, { lng: lang })
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState<string | null>(null)
  const logo = media.logoDark
  useEffect(() => {
    let frame = 0
    const update = () => {
      if (frame) return
      frame = requestAnimationFrame(() => {
        frame = 0
        const threshold = window.innerHeight * .4
        setActive([...links].reverse().find(id => (document.getElementById(id)?.getBoundingClientRect().top ?? Infinity) <= threshold) ?? null)
      })
    }
    window.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', update)
    window.addEventListener('hashchange', update)
    update()
    return () => {
      window.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
      window.removeEventListener('hashchange', update)
      cancelAnimationFrame(frame)
    }
  }, [])
  return (
    <header className="site-header">
      <div className="container header-inner">
        <a className="brand" href={`/${lang}/#top`} aria-label="Vitinho Birdwatching Tours">
          {logo.src ? <img src={logo.src} alt="Vitinho Birdwatching Tours" /> : <span>Vitinho <small>Birdwatching Tours</small></span>}
        </a>
        <button className="menu-toggle" type="button" aria-expanded={open} aria-controls="main-nav" onClick={() => setOpen(!open)}>{t(open ? 'nav.close' : 'nav.menu')}</button>
        <nav id="main-nav" className={open ? 'nav-open' : ''} aria-label={t('nav.aria')}>
          {links.map((id) => <a href={`#${id}`} key={id} aria-current={active === id ? 'location' : undefined} onClick={() => setOpen(false)}>{t(`nav.${id}`)}</a>)}
        </nav>
        <div className="language-switch" aria-label={t('nav.language')}>
          <Link to="/en/" lang="en" aria-current={lang === 'en' ? 'page' : undefined}>EN</Link>
          <span aria-hidden="true">/</span>
          <Link to="/pt/" lang="pt-BR" aria-current={lang === 'pt' ? 'page' : undefined}>PT</Link>
        </div>
      </div>
    </header>
  )
}
