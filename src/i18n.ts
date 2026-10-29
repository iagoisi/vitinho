import i18next from 'i18next'
import { en } from './translations/en'
import { pt } from './translations/pt'

export type Language = 'en' | 'pt'
export const languages: Language[] = ['en', 'pt']

export function createI18n(language: Language) {
  const instance = i18next.createInstance()
  void instance.init({
    lng: language,
    fallbackLng: 'en',
    resources: { en: { translation: en }, pt: { translation: pt } },
    interpolation: { escapeValue: false },
    initAsync: false,
  })
  return instance
}
