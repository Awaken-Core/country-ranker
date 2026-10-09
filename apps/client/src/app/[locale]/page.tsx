import { rankingService } from "@/modules/ranking/ranking.service";
import { Leaderboard } from "@/components/ranking/leaderboard";
import { GlobalPageLayout } from "@/components/layout/global-page-layout";
import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { getCanonicalUrl, getAlternateLanguages, SITE_URL } from "@/i18n/seo";

export const revalidate = 30; // 30s ISR

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations("UI");
  const canonicalUrl = getCanonicalUrl(locale);
  const title = `${t("leaderboard")} | CountryRank`;
  const description = t("rankingDescription");

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
      languages: getAlternateLanguages(),
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

export default async function Home({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const initialRankings = await rankingService.getTopCountries(300);

  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "CountryRank",
    "url": SITE_URL,
    "description": "Global country leaderboard ranked by verified community votes.",
    "inLanguage": locale,
  };

  return (
    <GlobalPageLayout>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
      />
      <Leaderboard initialRankings={initialRankings} />
    </GlobalPageLayout>
  );
}
