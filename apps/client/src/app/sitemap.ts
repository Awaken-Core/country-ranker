import { MetadataRoute } from "next";
import { countryService } from "@/modules/countries/country.service";
import { locales, routing } from "@/i18n/routing";
import { SITE_URL } from "@/i18n/seo";

export const revalidate = 3600; // Regenerate sitemap every hour

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const result = await countryService.getAllCountries({ limit: 300 });
  const countries = result.data;

  const entries: MetadataRoute.Sitemap = [];

  // Helper to generate alternate language objects for Next.js sitemap
  const getAlternates = (path = "") => {
    const cleanPath = path.startsWith("/") ? path : path ? `/${path}` : "";
    const languages: Record<string, string> = {};
    for (const loc of locales) {
      if (loc === routing.defaultLocale) {
        languages[loc] = `${SITE_URL}${cleanPath}`;
      } else {
        languages[loc] = `${SITE_URL}/${loc}${cleanPath}`;
      }
    }
    return { languages };
  };

  // 1. Home / Leaderboard entries
  for (const loc of locales) {
    const url = loc === routing.defaultLocale ? `${SITE_URL}/` : `${SITE_URL}/${loc}`;
    entries.push({
      url,
      lastModified: new Date(),
      changeFrequency: "hourly",
      priority: loc === routing.defaultLocale ? 1.0 : 0.8,
      alternates: getAlternates(),
    });
  }

  // 2. Directory entries (/countries)
  for (const loc of locales) {
    const url =
      loc === routing.defaultLocale
        ? `${SITE_URL}/countries`
        : `${SITE_URL}/${loc}/countries`;
    entries.push({
      url,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: loc === routing.defaultLocale ? 0.9 : 0.7,
      alternates: getAlternates("countries"),
    });
  }

  // 3. Country profile entries (/country/[slug])
  for (const country of countries) {
    for (const loc of locales) {
      const countryPath = `country/${country.slug}`;
      const url =
        loc === routing.defaultLocale
          ? `${SITE_URL}/${countryPath}`
          : `${SITE_URL}/${loc}/${countryPath}`;
      entries.push({
        url,
        lastModified: country.createdAt ? new Date(country.createdAt) : new Date(),
        changeFrequency: "hourly",
        priority: loc === routing.defaultLocale ? 0.8 : 0.6,
        alternates: getAlternates(countryPath),
      });
    }
  }

  return entries;
}
