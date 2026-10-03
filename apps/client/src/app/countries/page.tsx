import { Metadata } from "next";
import { countryService } from "@/modules/countries/country.service";
import { CountryListClient } from "@/components/country/country-list-client";
import { GlobalPageLayout } from "@/components/layout/global-page-layout";

export const metadata: Metadata = {
  title: "Explore Countries | CountryRank",
  description: "Browse all sovereign nations, check live standing, and view global community voting data.",
};

export const revalidate = 60;

export default async function CountriesPage() {
  const result = await countryService.getAllCountries({ limit: 300 });

  return (
    <GlobalPageLayout>
      <CountryListClient countries={result.data} />
    </GlobalPageLayout>
  );
}
