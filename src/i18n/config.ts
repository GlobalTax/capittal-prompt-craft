import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { ca as dateCa, es as dateEs, enUS as dateEn } from 'date-fns/locale';
import type { Locale } from 'date-fns';
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

// Map i18n locales to date-fns locales
export const getDateLocale = (): Locale => {
  const locales: Record<string, Locale> = {
    ca: dateCa,
    es: dateEs,
    en: dateEn
  };
  return locales[i18n.language] || dateEs;
};

export default i18n;
