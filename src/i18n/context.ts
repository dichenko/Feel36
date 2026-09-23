import { createContext, useContext } from 'react';
import type { AppLocale, Translations } from './types';
import { en } from './locales/en';
import { ru } from './locales/ru';
import { es } from './locales/es';
import { ar } from './locales/ar';
import { tr } from './locales/tr';

export const translations: Record<AppLocale, Translations> = {
  en,
  ru,
  es,
  ar,
  tr,
};

export interface LocaleContextValue {
  locale: AppLocale;
  t: Translations;
}

export const LocaleContext = createContext<LocaleContextValue>({
  locale: 'en',
  t: en,
});

export function useLocale(): LocaleContextValue {
  return useContext(LocaleContext);
}

export function getTranslations(locale: AppLocale): Translations {
  return translations[locale];
}
