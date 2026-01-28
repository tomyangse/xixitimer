import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translation files
import translationZH from './locales/zh.json';
import translationEN from './locales/en.json';
import translationSV from './locales/sv.json';
import translationFR from './locales/fr.json';
import translationDE from './locales/de.json';
import translationES from './locales/es.json';
import translationIT from './locales/it.json';
import translationDA from './locales/da.json';
import translationNO from './locales/no.json';
import translationFI from './locales/fi.json';
import translationIS from './locales/is.json';
import translationJA from './locales/ja.json';
import translationKO from './locales/ko.json';

const resources = {
    zh: { translation: translationZH },
    en: { translation: translationEN },
    sv: { translation: translationSV },
    fr: { translation: translationFR },
    de: { translation: translationDE },
    es: { translation: translationES },
    it: { translation: translationIT },
    da: { translation: translationDA },
    no: { translation: translationNO },
    fi: { translation: translationFI },
    is: { translation: translationIS },
    ja: { translation: translationJA },
    ko: { translation: translationKO }
};

i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        resources,
        fallbackLng: 'zh',
        debug: true, // Enable debug in development
        interpolation: {
            escapeValue: false, // React safe from XSS
        }
    });

export default i18n;
