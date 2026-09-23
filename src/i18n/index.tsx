import type { ReactNode } from 'react';
import { detectLocale } from './detectLocale';
import { LocaleContext, translations, type LocaleContextValue } from './context';

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
