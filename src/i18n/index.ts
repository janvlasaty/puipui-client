import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import en from './locales/en'
import cs from './locales/cs'

const STORAGE_KEY = 'language'

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    cs: { translation: cs },
  },
  lng: localStorage.getItem(STORAGE_KEY) || 'en',
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
})

// Update html lang attribute
document.documentElement.lang = i18n.language

i18n.on('languageChanged', (lng) => {
  localStorage.setItem(STORAGE_KEY, lng)
  document.documentElement.lang = lng
})

export default i18n
