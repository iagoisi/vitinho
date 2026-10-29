import React from 'react'
import { createRoot, hydrateRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { I18nextProvider } from 'react-i18next'
import { App } from './App'
import { createI18n } from './i18n'
import './styles.css'

const language = window.location.pathname.startsWith('/pt') ? 'pt' : 'en'
const element = <React.StrictMode><I18nextProvider i18n={createI18n(language)}><BrowserRouter><App /></BrowserRouter></I18nextProvider></React.StrictMode>
const root = document.getElementById('root')!
if (root.hasChildNodes()) hydrateRoot(root, element)
else createRoot(root).render(element)
