import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Navigate, Route, Routes, useParams } from 'react-router-dom'
import { Landing } from './sections/Landing'
import type { Language } from './i18n'

function LanguagePage() {
  const { lang } = useParams()
  const { i18n } = useTranslation()
  useEffect(() => {
    if (lang !== 'en' && lang !== 'pt') return
    void i18n.changeLanguage(lang)
    document.documentElement.lang = lang === 'pt' ? 'pt-BR' : 'en'
  }, [lang, i18n])
  if (lang !== 'en' && lang !== 'pt') return <Navigate to="/en/" replace />
  return <Landing lang={lang as Language} />
}

export function App() {
  return <Routes><Route path="/" element={<Navigate to="/en/" replace />} /><Route path="/:lang" element={<LanguagePage />} /><Route path="*" element={<Navigate to="/en/" replace />} /></Routes>
}
