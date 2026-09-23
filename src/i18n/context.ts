import { createContext, useContext } from 'react';
import type { AppLocale, Translations } from './types';
import { en } from './locales/en';
import { ru } from './locales/ru';
import { es } from './locales/es';
import { ptBR } from './locales/pt-BR';
import { id } from './locales/id';

export const translations: Record<AppLocale, Translations> = {
  en,
  ru,
  es,
  'pt-BR': ptBR,
  id,
};

export interface LocaleContextValue {
  locale: AppLocale;
  t: Translations;
  setLocale: (locale: AppLocale) => void;
}

export const LocaleContext = createContext<LocaleContextValue>({
  locale: 'en',
  t: en,
  setLocale: () => undefined,
});

export function useLocale(): LocaleContextValue {
  return useContext(LocaleContext);
}

export function getTranslations(locale: AppLocale): Translations {
  return translations[locale];
}
