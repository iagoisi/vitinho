import { renderToString } from 'react-dom/server'
import { StaticRouter } from 'react-router-dom'
import { I18nextProvider } from 'react-i18next'
import { App } from './App'
import { createI18n, type Language } from './i18n'

export function render(language: Language) {
  return renderToString(<I18nextProvider i18n={createI18n(language)}><StaticRouter location={`/${language}/`}><App /></StaticRouter></I18nextProvider>)
}
