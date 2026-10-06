import {defineRouting} from 'next-intl/routing';

// Only advertise locales with a translation catalog. Add catalogs before expanding this list.
export const locales = ['en', 'hi', 'es', 'fr', 'de', 'pt', 'it', 'ar', 'ru', 'zh', 'ja', 'ko', 'id', 'tr', 'vi', 'th'] as const;
export const routing = defineRouting({locales, defaultLocale: 'en', localePrefix: 'always'});
export const rtlLocales = new Set<string>(['ar']);
