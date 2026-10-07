import countryNames from './country-names.json';

const names: Record<string, Record<string, string>> = countryNames;

export function countryName(locale: string, code: string, fallback: string): string {
  return names[locale]?.[code.toUpperCase()] || fallback;
}
