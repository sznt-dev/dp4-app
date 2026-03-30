export const locales = ['pt-br', 'pt-pt', 'en', 'es'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'pt-br';

export const localeNames: Record<Locale, string> = {
  'pt-br': 'Português (BR)',
  'pt-pt': 'Português (PT)',
  en: 'English',
  es: 'Español',
};

export const localeFlags: Record<Locale, string> = {
  'pt-br': '🇧🇷',
  'pt-pt': '🇵🇹',
  en: '🇺🇸',
  es: '🇪🇸',
};
