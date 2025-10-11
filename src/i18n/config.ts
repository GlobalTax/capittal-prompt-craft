import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import es from './locales/es.json';
import ca from './locales/ca.json';
import en from './locales/en.json';

const savedLanguage = localStorage.getItem('language') || 'es';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      es: { translation: es },
      ca: { translation: ca },
      en: { translation: en }
    },
    lng: savedLanguage,
    fallbackLng: 'es',
    interpolation: {
      escapeValue: false
    }
  });

// Save language preference when it changes
i18n.on('languageChanged', (lng) => {
  localStorage.setItem('language', lng);
});

export default i18n;
