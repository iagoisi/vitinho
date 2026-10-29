import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Header } from '../components/Header'
import { Photo } from '../components/Photo'
import { ExperienceTrail } from '../components/ExperienceTrail'
import { DestinationMap } from '../components/DestinationMap'
import { ContactForm } from '../components/ContactForm'
import type { Language } from '../i18n'
import { tiltOffset } from '../heroMotion'
import { media } from '../media'

const experiences = ['birding', 'photography', 'wildlife', 'private'] as const
const wildlife = ['macaw', 'anteater', 'tiriba', 'rapazinho', 'aracari', 'redMacaw', 'jaguar'] as const
const destinations = [
  { id: 'pantanal', species: ['jaguar', 'macaw', 'anteater'], moreSpecies: ['jabiru', 'spoonbill', 'marshDeer', 'giantOtter', 'capybara'] },
  { id: 'bodoquena', species: ['tiriba', 'rapazinho', 'redMacaw'], moreSpecies: ['manakin', 'foliageGleaner', 'yellowParrot', 'pipingGuan', 'chachalaca'] },
] as const
// These are regions with documented occurrence, not claims of endemism.
const speciesRegions = {
  jaguar: ['pantanal'],
  macaw: ['pantanal', 'bodoquena'],
  anteater: ['pantanal'],
  tiriba: ['bodoquena'],
  rapazinho: ['bodoquena'],
  aracari: ['pantanal', 'bodoquena'],
  redMacaw: ['pantanal', 'bodoquena'],
} as const

const speciesLinks: Record<string, string> = {
  jaguar: 'https://www.inaturalist.org/taxa/41970',
  macaw: 'https://www.wikiaves.com.br/wiki/arara-azul',
  anteater: 'https://www.inaturalist.org/taxa/47107',
  redMacaw: 'https://www.wikiaves.com.br/wiki/arara-vermelha',
  tiriba: 'https://www.wikiaves.com.br/wiki/tiriba-fogo',
  rapazinho: 'https://www.wikiaves.com.br/wiki/rapazinho-do-chaco',
  jabiru: 'https://www.wikiaves.com.br/wiki/tuiuiu',
  spoonbill: 'https://www.wikiaves.com.br/wiki/colhereiro',
  marshDeer: 'https://www.inaturalist.org/taxa/42228',
  giantOtter: 'https://www.inaturalist.org/taxa/41845',
  capybara: 'https://www.inaturalist.org/taxa/74442',
  manakin: 'https://www.wikiaves.com.br/wiki/uirapuru-laranja',
  foliageGleaner: 'https://www.wikiaves.com.br/wiki/cisqueiro-do-rio',
  yellowParrot: 'https://www.wikiaves.com.br/wiki/papagaio-galego',
  pipingGuan: 'https://www.wikiaves.com.br/wiki/jacutinga-de-garganta-azul',
  chachalaca: 'https://www.wikiaves.com.br/wiki/aracua-do-pantanal',
}

function Heading({ eyebrow, title, intro }: { eyebrow: string; title: string; intro?: string }) {
  return <div className="section-heading"><p className="eyebrow">{eyebrow}</p><h2>{title}</h2>{intro && <p className="section-intro">{intro}</p>}</div>
}

export function Landing({ lang }: { lang: Language }) {
  const { t } = useTranslation(undefined, { lng: lang })
  const hero = useRef<HTMLElement>(null)
  const lightbox = useRef<HTMLDialogElement>(null)
  const wildlifeTrigger = useRef<HTMLButtonElement>(null)
  const [activeWildlife, setActiveWildlife] = useState<number | null>(null)
  const [flippedSpecies, setFlippedSpecies] = useState<string | null>(null)
  const [motionPermission, setMotionPermission] = useState<'prompt' | 'granted' | 'denied'>('denied')
  useEffect(() => {
    if (activeWildlife === null) return
    const dialog = lightbox.current
    if (!dialog) return
    if (!dialog.open) dialog.showModal()
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return
      event.preventDefault()
      const step = event.key === 'ArrowRight' ? 1 : -1
      setActiveWildlife(index => index === null ? null : (index + step + wildlife.length) % wildlife.length)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = previousOverflow
    }
  }, [activeWildlife])
  useEffect(() => {
    const section = hero.current
    const photo = section?.querySelector<HTMLImageElement>('.hero-photo img')
    const foliage = section?.querySelector<HTMLImageElement>('.hero-foreground img')
    if (!section || !photo) return
    const desktop = window.matchMedia('(min-width: 801px)')
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
    let frame = 0
    const update = () => {
      if (frame) return
      frame = requestAnimationFrame(() => {
        frame = 0
        const offset = desktop.matches && !reducedMotion.matches
          ? Math.min(100, Math.max(0, -section.getBoundingClientRect().top * 0.18))
          : 0
        photo.style.setProperty('--hero-scroll', `${offset}px`)
        foliage?.style.setProperty('--hero-scroll', `${Math.min(140, offset * 1.4)}px`)
      })
    }
    window.addEventListener('scroll', update, { passive: true })
    desktop.addEventListener('change', update)
    reducedMotion.addEventListener('change', update)
    update()
    return () => {
      window.removeEventListener('scroll', update)
      desktop.removeEventListener('change', update)
      reducedMotion.removeEventListener('change', update)
      cancelAnimationFrame(frame)
      photo.style.removeProperty('--hero-scroll')
      foliage?.style.removeProperty('--hero-scroll')
    }
  }, [])
  useEffect(() => {
    if (!window.isSecureContext || !window.DeviceOrientationEvent) return
    const orientation = window.DeviceOrientationEvent as typeof DeviceOrientationEvent & { requestPermission?: () => Promise<'granted' | 'denied'> }
    setMotionPermission(orientation.requestPermission ? 'prompt' : 'granted')
  }, [])
  useEffect(() => {
    if (motionPermission !== 'granted') return
    const photo = hero.current?.querySelector<HTMLImageElement>('.hero-photo img')
    if (!photo) return
    const mobile = window.matchMedia('(max-width: 800px)')
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
    let startingBeta: number | null = null
    let startingGamma: number | null = null
    const reset = () => {
      startingBeta = startingGamma = null
      photo.style.removeProperty('--hero-x')
      photo.style.removeProperty('--hero-y')
    }
    const onOrientation = ({ beta, gamma }: DeviceOrientationEvent) => {
      if (beta === null || gamma === null || !Number.isFinite(beta) || !Number.isFinite(gamma) || document.hidden || !mobile.matches || reducedMotion.matches) return
      startingBeta ??= beta
      startingGamma ??= gamma
      const rotation = (window.screen.orientation?.angle ?? 0) * Math.PI / 180
      const x = gamma - startingGamma
      const y = beta - startingBeta
      const horizontal = tiltOffset(x * Math.cos(rotation) + y * Math.sin(rotation))
      const vertical = tiltOffset(y * Math.cos(rotation) - x * Math.sin(rotation))
      photo.style.setProperty('--hero-x', `${horizontal}px`)
      photo.style.setProperty('--hero-y', `${vertical}px`)
    }
    window.addEventListener('deviceorientation', onOrientation)
    window.screen.orientation?.addEventListener('change', reset)
    document.addEventListener('visibilitychange', reset)
    mobile.addEventListener('change', reset)
    reducedMotion.addEventListener('change', reset)
    return () => {
      window.removeEventListener('deviceorientation', onOrientation)
      window.screen.orientation?.removeEventListener('change', reset)
      document.removeEventListener('visibilitychange', reset)
      mobile.removeEventListener('change', reset)
      reducedMotion.removeEventListener('change', reset)
      reset()
    }
  }, [motionPermission])
  const enableMotion = async () => {
    try {
      const orientation = window.DeviceOrientationEvent as typeof DeviceOrientationEvent & { requestPermission: () => Promise<'granted' | 'denied'> }
      setMotionPermission(await orientation.requestPermission())
    } catch { setMotionPermission('denied') }
  }
  const whatsapp = (operator = false) => `https://wa.me/5567998260643?text=${encodeURIComponent(t(operator ? 'contact.whatsappOperator' : 'contact.whatsappMessage'))}`
  return <>
    <Header lang={lang} />
    <main id="top">
      <section className="hero" aria-labelledby="hero-title" ref={hero}>
        <div className="hero-layout">
          <div className="hero-copy"><div className="hero-content">
            <img className="hero-logo" src={media.logoLight.src ?? undefined} alt="" />
            <p className="eyebrow">{t('hero.eyebrow')}</p>
            <h1 id="hero-title">{t('hero.title')}</h1>
            <p className="hero-intro">{t('hero.intro')}</p>
            <div className="hero-actions"><a className="button button-primary" href="#contact">{t('hero.contact')} <span aria-hidden="true">↗</span></a><a className="button button-outline-dark" href="#experiences">{t('hero.explore')}</a></div>
          </div></div>
          <Photo image="hero" alt={t('hero.photo')} className="hero-photo" eager />
          <div className="hero-foreground" aria-hidden="true"><Photo image="hero" alt="" className="hero-photo-foreground" /></div>
        </div>
        {motionPermission === 'prompt' && <button className="hero-motion-toggle" type="button" onClick={enableMotion}>{t('hero.motion')}</button>}
        <a className="scroll-cue" href="#about">{t('hero.scroll')} <span aria-hidden="true">↓</span></a>
      </section>

      <section id="about" className="section about-section">
        <div className="container about-grid">
          <div className="about-image-wrap"><Photo image="vitinho" alt={t('about.photo')} className="about-photo" /><span className="image-caption">01 / {t('about.note')}</span></div>
          <div className="about-copy"><Heading eyebrow={t('about.eyebrow')} title={t('about.title')} /><p>{t('about.p1')}</p><p>{t('about.p2')}</p><div className="fact-list"><span>{t('about.years')}</span><span>{t('about.training')}</span><span>{t('about.focus')}</span></div></div>
        </div>
      </section>

      <section id="destinations" className="section destinations-section dark-section">
        <div className="container">
          <Heading eyebrow={t('destinations.eyebrow')} title={t('destinations.title')} intro={t('destinations.intro')} />
          <div className="destination-grid">
            {destinations.map(({ id, species, moreSpecies }, index) => <article className="destination" id={`destination-${id}`} key={id}>
              <DestinationMap region={id} title={t(`destinations.${id}`)} />
              <div className="destination-copy">
                <div className="destination-meta"><span>0{index + 1} / Mato Grosso do Sul</span><span>{t(`destinations.${id}Biome`)}</span></div>
                <h3>{t(`destinations.${id}`)}</h3>
                <p>{t(`destinations.${id}Text`)}</p>
                <div className="destination-species">
                  <p className="destination-species-label">{t('destinations.speciesLabel')}</p>
                  <p className="destination-flip-guide"><span aria-hidden="true">↻</span>{t('flipCard.guide')}</p>
                  <div className="destination-species-list">
                    {species.map((item) => <div className={`destination-species-link species-${item}`} key={item}>
                      <button className="destination-species-flip" type="button" aria-pressed={flippedSpecies === item} aria-label={t(flippedSpecies === item ? 'flipCard.close' : 'flipCard.open', { species: t(`highlights.${item}`), fact: t(`flipCard.facts.${item}`) })} onClick={() => setFlippedSpecies(current => current === item ? null : item)}>
                        <div className="destination-flip-inner">
                          <div className="destination-flip-front"><Photo image={item} alt="" /><span className="destination-flip-cue" aria-hidden="true">↻ {t('flipCard.cue')}</span></div>
                          <div className="destination-flip-back" aria-hidden={flippedSpecies !== item}><span className="destination-flip-eyebrow">{t('flipCard.curiosity')}</span><strong>{t(`highlights.${item}`)}</strong><span className="destination-flip-fact">{t(`flipCard.facts.${item}`)}</span><span className="destination-flip-return">↶ {t('flipCard.return')}</span></div>
                        </div>
                      </button>
                      <a className="destination-species-name" href={speciesLinks[item]} target="_blank" rel="noopener noreferrer">{t(`highlights.${item}`)} <span aria-hidden="true">↗</span></a>
                    </div>)}
                  </div>
                </div>
                <div className="destination-more">
                  <p className="destination-species-label">{t('destinations.moreLabel')}</p>
                  <ul>{moreSpecies.map((item) => <li key={item}><a href={speciesLinks[item]} target="_blank" rel="noopener noreferrer">{t(`species.${item}`)} <span aria-hidden="true">↗</span></a></li>)}</ul>
                </div>
              </div>
            </article>)}
          </div>
          <p className="destination-note">{t('destinations.speciesNote')}</p>
        </div>
      </section>

      <section id="experiences" className="section experiences-section">
        <div className="container"><Heading eyebrow={t('experiences.eyebrow')} title={t('experiences.title')} intro={t('experiences.intro')} /><ExperienceTrail>
          {experiences.map((item, index) => <article className="experience" key={item}><span className="experience-number">0{index + 1}</span><div><h3>{t(`experiences.${item}`)}</h3><p>{t(`experiences.${item}Text`)}</p></div><Photo image={item} alt={t(`experiences.${item}Photo`)} /></article>)}
        </ExperienceTrail><div className="duration-grid"><div><span className="eyebrow">01—02</span><h3>{t('experiences.short')}</h3><p>{t('experiences.shortText')}</p></div><div><span className="eyebrow">05—06</span><h3>{t('experiences.extended')}</h3><p>{t('experiences.extendedText')}</p></div></div><p className="fine-print">{t('experiences.note')}</p></div>
      </section>

      <section id="wildlife" className="section wildlife-section dark-section">
        <div className="container"><Heading eyebrow={t('highlights.eyebrow')} title={t('highlights.title')} intro={t('highlights.intro')} /><p className="wildlife-gallery-note">0{wildlife.length} / {t('highlights.galleryHint')}</p><div className="wildlife-grid">
          {wildlife.map((item, index) => <figure className={`wildlife-item wildlife-${index}`} id={`species-${item}`} key={item}>
            <button className="wildlife-open" type="button" aria-label={t('highlights.open', { species: t(`highlights.${item}`) })} onClick={(event) => { wildlifeTrigger.current = event.currentTarget; setActiveWildlife(index) }}><Photo image={item} alt="" /><span aria-hidden="true" className="wildlife-zoom">↗</span></button>
            <figcaption><span>0{index + 1} / 0{wildlife.length}</span>{t(`highlights.${item}`)}</figcaption>
            <div className="wildlife-places" aria-label={t('highlights.regions')}>{speciesRegions[item].map((region) => <a href={`#destination-${region}`} key={region}>{t(`destinations.${region}`)}</a>)}</div>
          </figure>)}
        </div></div>
      </section>

      <dialog className="wildlife-lightbox" ref={lightbox} aria-label={t('highlights.viewerLabel')} onClose={() => { setActiveWildlife(null); wildlifeTrigger.current?.focus() }} onClick={(event) => { if (event.target === event.currentTarget) event.currentTarget.close() }}>
        {activeWildlife !== null && <div className="wildlife-lightbox-panel">
          <div className="wildlife-lightbox-top"><span>{t('highlights.eyebrow')}</span><button type="button" className="wildlife-lightbox-close" aria-label={t('highlights.close')} onClick={() => lightbox.current?.close()}>×</button></div>
          <div className="wildlife-lightbox-stage">
            <button type="button" className="wildlife-lightbox-arrow" aria-label={t('highlights.previous')} onClick={() => setActiveWildlife(index => index === null ? null : (index - 1 + wildlife.length) % wildlife.length)}>←</button>
            <img src={media[wildlife[activeWildlife]].src ?? undefined} srcSet={media[wildlife[activeWildlife]].srcSet} sizes="100vw" alt={t(`highlights.${wildlife[activeWildlife]}`)} />
            <button type="button" className="wildlife-lightbox-arrow" aria-label={t('highlights.next')} onClick={() => setActiveWildlife(index => index === null ? null : (index + 1) % wildlife.length)}>→</button>
          </div>
          <div className="wildlife-lightbox-bottom"><div><span className="wildlife-lightbox-count">0{activeWildlife + 1} / 0{wildlife.length}</span><h2>{t(`highlights.${wildlife[activeWildlife]}`)}</h2><p>{speciesRegions[wildlife[activeWildlife]].map(region => t(`destinations.${region}`)).join(' · ')}</p></div><div className="wildlife-lightbox-thumbs">{wildlife.map((item, index) => <button type="button" className={index === activeWildlife ? 'is-active' : ''} aria-label={t('highlights.open', { species: t(`highlights.${item}`) })} aria-current={index === activeWildlife ? 'true' : undefined} onClick={() => setActiveWildlife(index)} key={item}><img src={media[item].src ?? undefined} srcSet={media[item].srcSet} sizes="58px" alt="" /></button>)}</div></div>
        </div>}
      </dialog>

      <section id="partners" className="section guiding-section"><div className="container guiding-grid"><div><Heading eyebrow={t('guiding.eyebrow')} title={t('guiding.title')} /><a className="button button-primary" href="#contact">{t('guiding.cta')} <span aria-hidden="true">↗</span></a></div><div className="guiding-copy"><p>{t('guiding.body')}</p><p className="operator-names">{t('guiding.names')}</p><a className="text-link" href={whatsapp(true)} target="_blank" rel="noopener noreferrer">WhatsApp ↗</a></div></div></section>

      <section id="gallery" className="section gallery-section"><div className="container"><Heading eyebrow={t('gallery.eyebrow')} title={t('gallery.title')} intro={t('gallery.intro')} /><div className="gallery-grid"><Photo image="galleryOne" alt={t('gallery.birders')} /><Photo image="galleryTwo" alt={t('gallery.boat')} /></div><p className="fine-print">{t('gallery.testimonials')}</p></div></section>

      <section id="team" className="section team-section dark-section"><div className="container"><Heading eyebrow={t('team.eyebrow')} title={t('team.title')} /><div className="team-grid"><article><Photo image="teamVitinho" alt={t('team.vitinhoPhoto')} /><div><h3>{t('team.vitinho')}</h3><p>{t('team.vitinhoRole')}</p></div></article><article><Photo image="daiani" alt={t('team.daianiPhoto')} /><div><h3>{t('team.daiani')}</h3><p>{t('team.daianiRole')}</p></div></article></div></div></section>

      <section id="contact" className="section contact-section"><div className="container"><Heading eyebrow={t('contact.eyebrow')} title={t('contact.title')} intro={t('contact.intro')} /><div className="contact-grid"><div className="contact-panel"><h3>{t('contact.formTitle')}</h3><ContactForm lang={lang} /></div><div className="contact-panel contact-direct"><div><h3>{t('contact.whatsappTitle')}</h3><p>{t('contact.whatsappText')}</p><a className="button button-primary" href={whatsapp()} target="_blank" rel="noopener noreferrer">{t('contact.whatsappCta')} <span aria-hidden="true">↗</span></a></div><div className="direct-details"><p>{t('contact.email')}</p><a href="mailto:vitinhopantanal@gmail.com">vitinhopantanal@gmail.com</a><a href={whatsapp()} target="_blank" rel="noopener noreferrer">+55 67 99826-0643</a></div></div></div></div></section>
    </main>
    <footer className="site-footer"><div className="container footer-inner"><div><strong>Vitinho Birdwatching Tours</strong><p>{t('footer.line')}</p></div><div><a href="#top">↑ {t('hero.scroll')}</a><p>© {new Date().getFullYear()} · {t('footer.rights')}</p></div></div></footer>
  </>
}
