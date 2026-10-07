import {defineRouting} from 'next-intl/routing';

// Only advertise locales with a translation catalog. Add catalogs before expanding this list.
export const locales = ['en', 'hi', 'es', 'fr', 'de', 'pt', 'it', 'ar', 'ru', 'zh', 'ja', 'ko', 'id', 'tr', 'vi', 'th'] as const;
export const routing = defineRouting({locales, defaultLocale: 'en', localePrefix: 'as-needed'});
export const rtlLocales = new Set<string>(['ar']);

/** Returns the public URL for a locale, omitting the default English prefix. */
export function localePath(locale: string, pathname = '/') {
  const normalizedPath = pathname.startsWith('/') ? pathname : `/${pathname}`;
  return locale === routing.defaultLocale
    ? normalizedPath
    : `/${locale}${normalizedPath === '/' ? '' : normalizedPath}`;
}
