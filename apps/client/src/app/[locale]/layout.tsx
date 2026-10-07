import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "../globals.css";
import {NextIntlClientProvider, hasLocale} from 'next-intl';
import {setRequestLocale, getTranslations} from 'next-intl/server';
import {notFound} from 'next/navigation';
import {routing, rtlLocales} from '@/i18n/routing';
import { cn } from "@/lib/utils";
import Providers from "@/components/provider";

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

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('UI');
  return {title: `${t('leaderboard')} | CountryRank`, description: t('rankingDescription')};
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
      </body>
    </html>
  );
}
