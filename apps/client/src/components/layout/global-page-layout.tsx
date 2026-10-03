import React from "react";
import { SiteHeader } from "./site-header";
import { AdRail } from "../ads/ad-rail";

interface GlobalPageLayoutProps {
  children: React.ReactNode;
}

export const GlobalPageLayout: React.FC<GlobalPageLayoutProps> = ({ children }) => {
  return (
    <div
      className="h-screen w-screen overflow-hidden bg-[#080808] text-[#F5F5F5] flex flex-col font-sans"
      suppressHydrationWarning
    >
      {/* 1. Header (Fixed 56px) */}
      <SiteHeader />

      {/* 2. 3-Column Shell (Fills remaining viewport height, rails pushed toward outer edges) */}
      <div className="flex-1 min-h-0 w-full max-w-[1680px] mx-auto px-4 sm:px-6 lg:px-8 py-3 flex justify-between gap-6 lg:gap-8 overflow-hidden">
        {/* Left Promotional Rail (Desktop: pushed far left) */}
        <div className="hidden xl:flex shrink-0 h-full">
          <AdRail side="left" />
        </div>

        {/* Center Main Content Container (Controlled width, centered) */}
        <main className="w-full max-w-[820px] flex flex-col min-h-0 min-w-0 mx-auto">
          {children}
        </main>

        {/* Right Promotional Rail (Desktop: pushed far right) */}
        <div className="hidden xl:flex shrink-0 h-full">
          <AdRail side="right" />
        </div>
      </div>
    </div>
  );
};
