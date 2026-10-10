import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "../globals.css";
import {NextIntlClientProvider, hasLocale} from 'next-intl';
import {setRequestLocale, getTranslations} from 'next-intl/server';
import {notFound} from 'next/navigation';
import {routing, rtlLocales} from '@/i18n/routing';
import { SITE_URL, getCanonicalUrl, getAlternateLanguages } from "@/i18n/seo";
import { cn } from "@/lib/utils";
import Providers from "@/components/provider";
import { GoogleAnalytics } from "@next/third-parties/google";
import { env } from "@/lib/env";

const geistSans = Geist({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

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
    metadataBase: new URL(SITE_URL),
    title: {
      default: title,
      template: "%s | CountryRank",
    },
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
      locale: locale,
      type: "website",
      images: [
        {
          url: "/image/logo.png",
          width: 512,
          height: 512,
          alt: "CountryRank - Global Country Leaderboard",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["/image/logo.png"],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-image-preview": "large",
      },
    },
    verification: {
      google: "google644c01f42c4867e9.html",
    },
  };
}
export default async function RootLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{locale: string}>;
}>) {
  const {locale} = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  return (
    <html lang={locale} dir={rtlLocales.has(locale) ? 'rtl' : 'ltr'} className={cn(geistSans.variable, geistMono.variable, "font-sans")} suppressHydrationWarning>
      <body
        className="font-sans antialiased bg-[#080808] text-[#F5F5F5]"
        suppressHydrationWarning
      >
         <NextIntlClientProvider><Providers>{children}</Providers></NextIntlClientProvider>
         {env.NEXT_PUBLIC_GA_MEASUREMENT_ID && (
           <GoogleAnalytics gaId={env.NEXT_PUBLIC_GA_MEASUREMENT_ID} />
         )}
      </body>
    </html>
  );
}
