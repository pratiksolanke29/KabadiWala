import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import mr from './mr.json';
import hi from './hi.json';
import en from './en.json';

const resources = {
  mr: { translation: mr },
  hi: { translation: hi },
  en: { translation: en },
};

const savedLanguage = localStorage.getItem('kabadiwala-language') as 'mr' | 'hi' | 'en' | null;
const initialLanguage = savedLanguage || 'mr';

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: initialLanguage,
    fallbackLng: 'mr',
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: false,
    },
  });

export default i18n;