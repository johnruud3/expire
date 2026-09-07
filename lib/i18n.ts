import * as Localization from 'expo-localization';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import type { AppLanguage } from '@/lib/types';
import en from '@/locales/en.json';
import nb from '@/locales/nb.json';

export function deviceLanguage(): AppLanguage {
  const code = Localization.getLocales()[0]?.languageCode;
  return code === 'nb' || code === 'no' || code === 'nn' ? 'nb' : 'en';
}

void i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    nb: { translation: nb },
  },
  lng: deviceLanguage(),
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
  compatibilityJSON: 'v4',
});

export default i18n;
