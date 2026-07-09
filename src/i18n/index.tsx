import { createContext, useContext, type ReactNode } from 'react';
import type { AppLocale, Translations } from './types';
import { detectLocale } from './detectLocale';
import { en } from './locales/en';
import { ru } from './locales/ru';
import { es } from './locales/es';
import { ar } from './locales/ar';
import { tr } from './locales/tr';

const translations: Record<AppLocale, Translations> = {
  en,
  ru,
  es,
  ar,
  tr,
};

interface LocaleContextValue {
  locale: AppLocale;
  t: Translations;
}

const LocaleContext = createContext<LocaleContextValue>({
  locale: 'en',
  t: en,
});

export function LocaleProvider({ children }: { children: ReactNode }) {
  const locale = detectLocale();
  const value: LocaleContextValue = {
    locale,
    t: translations[locale],
  };

  return (
    <LocaleContext.Provider value={value}>
      <div dir={value.t.dir} lang={locale}>
        {children}
      </div>
    </LocaleContext.Provider>
  );
}

export function useLocale(): LocaleContextValue {
  return useContext(LocaleContext);
}

export function getTranslations(locale: AppLocale): Translations {
  return translations[locale];
}
