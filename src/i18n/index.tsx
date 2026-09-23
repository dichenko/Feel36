import { useState, type ReactNode } from 'react';
import { detectLocale, LOCALE_STORAGE_KEY } from './detectLocale';
import type { AppLocale } from './types';
import { LocaleContext, translations, type LocaleContextValue } from './context';

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setCurrentLocale] = useState<AppLocale>(detectLocale);
  const setLocale = (nextLocale: AppLocale) => {
    setCurrentLocale(nextLocale);
    try {
      localStorage.setItem(LOCALE_STORAGE_KEY, nextLocale);
    } catch {
      // The language still changes for the current session.
    }
  };
  const value: LocaleContextValue = {
    locale,
    t: translations[locale],
    setLocale,
  };

  return (
    <LocaleContext.Provider value={value}>
      <div dir={value.t.dir} lang={locale}>
        {children}
      </div>
    </LocaleContext.Provider>
  );
}
