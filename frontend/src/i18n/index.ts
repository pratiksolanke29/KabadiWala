import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import mr from "./mr.json";
import hi from "./hi.json";
import en from "./en.json";

const resources = {
  mr: { translation: mr },
  hi: { translation: hi },
  en: { translation: en },
};

const savedLanguage = localStorage.getItem("kabadiwala-language") as
  | "mr"
  | "hi"
  | "en"
  | null;
const initialLanguage = savedLanguage || "en";

i18n.use(initReactI18next).init({
  resources,
  lng: initialLanguage,
  fallbackLng: "en",
  interpolation: {
    escapeValue: false,
  },
  react: {
    useSuspense: false,
  },
});

const syncDocumentLanguage = (language: string) => {
  if (typeof document !== "undefined")
    document.documentElement.lang = language.slice(0, 2);
};
syncDocumentLanguage(i18n.language || initialLanguage);
i18n.on("languageChanged", syncDocumentLanguage);

export default i18n;
