import { Metadata } from "next";
import {getTranslations} from 'next-intl/server';
import { countryService } from "@/modules/countries/country.service";
import { CountryListClient } from "@/components/country/country-list-client";
import { GlobalPageLayout } from "@/components/layout/global-page-layout";

export async function generateMetadata(): Promise<Metadata> {
  const t=await getTranslations('UI');
  return {title: `${t('directory')} | CountryRank`, description: t('directoryDescription')};
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
