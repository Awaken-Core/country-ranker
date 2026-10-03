import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
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

export const metadata: Metadata = {
  title: "CountryRank - Global Country Leaderboard & Standing",
  description: "Realtime global sovereign rankings and country leaderboard database.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn(geistSans.variable, geistMono.variable, "font-sans")} suppressHydrationWarning>
      <body
        className="font-sans antialiased bg-[#080808] text-[#F5F5F5]"
        suppressHydrationWarning
      >
         <Providers>{children}</Providers>
      </body>
    </html>
  );
}

