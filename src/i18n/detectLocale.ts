import type { AppLocale } from './types';

export const SUPPORTED_LOCALES: AppLocale[] = ['ru', 'en', 'es', 'pt-BR', 'id'];

export const LOCALE_STORAGE_KEY = 'feelme36_locale';

export const languageNames: Record<AppLocale, string> = {
  ru: 'Русский',
  en: 'English',
  es: 'Español',
  'pt-BR': 'Português (Brasil)',
  id: 'Bahasa Indonesia',
};

export function getProfileLocale(): AppLocale {
  const languageCode = window.Telegram?.WebApp?.initDataUnsafe?.user?.language_code;

  if (!languageCode) {
    return 'en';
  }

  const normalized = languageCode.replace('_', '-').toLowerCase();
  if (normalized === 'pt-br') return 'pt-BR';

  const base = normalized.split('-')[0];

  if (base === 'pt') return 'pt-BR';
  if (SUPPORTED_LOCALES.includes(base as AppLocale)) {
    return base as AppLocale;
  }

  return 'en';
}

export function detectLocale(): AppLocale {
  try {
    const savedLocale = localStorage.getItem(LOCALE_STORAGE_KEY);
    if (SUPPORTED_LOCALES.includes(savedLocale as AppLocale)) {
      return savedLocale as AppLocale;
    }
  } catch {
    // Local storage can be unavailable in restrictive browser contexts.
  }

  return getProfileLocale();
}
