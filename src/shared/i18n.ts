import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import en from "../locales/en.json";
import ru from "../locales/ru.json";
import kk from "../locales/kk.json";

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      ru: { translation: ru },
      kk: { translation: kk },
    },
    lng: "ru",
    fallbackLng: "ru",
    interpolation: {
      escapeValue: false,
    },
  })
  .catch(console.error);

export default i18n;
