import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import HttpBackend from 'i18next-http-backend';
import LanguageDetector from 'i18next-browser-languagedetector';

i18n
  .use(HttpBackend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: 'ar',
    supportedLngs: ['ar', 'en', 'ku', 'kmr', 'bad'],
    debug: false,
    backend: {
      loadPath: '/locales/{{lng}}/translation.json',
    },
    detection: {
      order: ['localStorage', 'navigator'],
      lookupLocalStorage: 'taq_app_language',
      caches: ['localStorage'],
    },
    interpolation: {
      escapeValue: false, // React already escapes values
    },
    react: {
      useSuspense: true,
    },
  });

// Keep <html dir="rtl|ltr"> in sync with the active language,
// same rule as before: ar, ku, and bad render right-to-left.
const RTL_LANGS = ['ar', 'ku', 'bad'];
function applyDirection(lng: string) {
  document.documentElement.dir = RTL_LANGS.includes(lng) ? 'rtl' : 'ltr';
  document.documentElement.lang = lng;
}

applyDirection(i18n.language);
i18n.on('languageChanged', applyDirection);

export default i18n;
