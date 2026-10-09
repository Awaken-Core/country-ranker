import { Metadata } from "next";
import {getTranslations} from 'next-intl/server';
import { countryService } from "@/modules/countries/country.service";
import { CountryListClient } from "@/components/country/country-list-client";
import { GlobalPageLayout } from "@/components/layout/global-page-layout";

import { getCanonicalUrl, getAlternateLanguages } from "@/i18n/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations("UI");
  const title = `${t("directory")} | CountryRank`;
  const description = t("directoryDescription");
  const canonicalUrl = getCanonicalUrl(locale, "countries");

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
      languages: getAlternateLanguages("countries"),
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      siteName: "CountryRank",
      locale,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export const revalidate = 60;

export default async function CountriesPage() {
  const result = await countryService.getAllCountries({ limit: 300 });

  return (
    <GlobalPageLayout>
      <CountryListClient countries={result.data} />
    </GlobalPageLayout>
  );
}
