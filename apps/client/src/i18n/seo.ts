import { locales, routing } from "./routing";

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "https://countryrank.com");

/**
 * Returns canonical and hreflang language alternates for any path.
 * Follows Google's recommended x-default pattern.
 */
export function getAlternateLanguages(pathname = "") {
  const cleanPath = pathname.startsWith("/") ? pathname : pathname ? `/${pathname}` : "";

  const languages: Record<string, string> = {};

  for (const loc of locales) {
    if (loc === routing.defaultLocale) {
      languages[loc] = `${SITE_URL}${cleanPath}`;
    } else {
      languages[loc] = `${SITE_URL}/${loc}${cleanPath}`;
    }
  }

  languages["x-default"] = `${SITE_URL}${cleanPath}`;

  return languages;
}

export function getCanonicalUrl(locale: string, pathname = "") {
  const cleanPath = pathname.startsWith("/") ? pathname : pathname ? `/${pathname}` : "";
  if (locale === routing.defaultLocale) {
    return `${SITE_URL}${cleanPath}`;
  }
  return `${SITE_URL}/${locale}${cleanPath}`;
}
