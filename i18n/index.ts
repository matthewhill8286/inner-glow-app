import i18n, { use } from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';
import en from './locales/en/translation';
import el from './locales/el/translation';

const LANGUAGE_KEY = '@innerglow_language';

export const SUPPORTED_LANGUAGES = [
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'el', label: 'Ελληνικά', flag: '🇬🇷' },
] as const;

export type LanguageCode = (typeof SUPPORTED_LANGUAGES)[number]['code'];

const resources = {
  en: { translation: en },
  el: { translation: el },
};

const getDeviceLocale = (): LanguageCode => {
  const locale = Localization.getLocales()[0]?.languageCode || 'en';
  return resources[locale as keyof typeof resources] ? (locale as LanguageCode) : 'en';
};

export async function getSavedLanguage(): Promise<LanguageCode | null> {
  try {
    const saved = await AsyncStorage.getItem(LANGUAGE_KEY);
    if (saved && resources[saved as keyof typeof resources]) {
      return saved as LanguageCode;
    }
    return null;
  } catch {
    return null;
  }
}

export async function setLanguage(code: LanguageCode): Promise<void> {
  await AsyncStorage.setItem(LANGUAGE_KEY, code);
  await i18n.changeLanguage(code);
}

(async () => {
  const saved = await getSavedLanguage();
  const lng = saved ?? getDeviceLocale();

  await use(initReactI18next).init({
    resources,
    lng,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
  });
})();

export default i18n;
