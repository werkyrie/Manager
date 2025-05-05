"use client"

import i18n from "i18next"
import { initReactI18next } from "react-i18next"
import LanguageDetector from "i18next-browser-languagedetector"

// Import translations
import enTranslation from "./locales/en.json"
import zhTranslation from "./locales/zh.json"

// Check if i18n has already been initialized to prevent duplicate initialization
if (!i18n.isInitialized) {
  i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
      resources: {
        en: {
          translation: enTranslation,
        },
        zh: {
          translation: zhTranslation,
        },
      },
      fallbackLng: "en",
      interpolation: {
        escapeValue: false, // React already escapes values
      },
      detection: {
        order: ["localStorage", "navigator"],
        caches: ["localStorage"],
      },
    })
}

export default i18n
