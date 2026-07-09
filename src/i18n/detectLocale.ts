import type { AppLocale } from './types';

const SUPPORTED_LOCALES: AppLocale[] = ['en', 'ru', 'es', 'ar', 'tr'];

export function detectLocale(): AppLocale {
  const languageCode = window.Telegram?.WebApp?.initDataUnsafe?.user?.language_code;

  if (!languageCode) {
    return 'en';
  }

  const base = languageCode.split('-')[0].toLowerCase();

  if (SUPPORTED_LOCALES.includes(base as AppLocale)) {
    return base as AppLocale;
  }

  return 'en';
}
