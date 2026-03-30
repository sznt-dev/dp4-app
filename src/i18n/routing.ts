import { defineRouting } from 'next-intl/routing';
import { locales, defaultLocale } from './config';

export const routing = defineRouting({
  locales,
  defaultLocale,
  localePrefix: 'as-needed', // PT-BR URLs sem prefixo, outros com
  localeDetection: true, // Auto-detect from Accept-Language header + NEXT_LOCALE cookie
});
