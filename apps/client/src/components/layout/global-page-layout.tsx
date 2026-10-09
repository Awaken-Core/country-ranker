"use client";

import React, { useEffect, useMemo, useState } from "react";
import { SiteHeader } from "./site-header";
import { AdRail } from "../ads/ad-rail";
import type { SponsorsResponse } from "../ads/ad-data";
import BecomeSponsorModal from "../purchase/become-sponsor-modal";
import { MobileAdMarquee } from "../ads/mobile-ad-marquee";

interface GlobalPageLayoutProps {
  children: React.ReactNode;
}

const SPONSOR_ROTATION_MS =
  process.env.NODE_ENV === "development" ? 3_000 : 10_000;

export const GlobalPageLayout: React.FC<GlobalPageLayoutProps> = ({
  children,
}) => {
  const [sponsorRotation, setSponsorRotation] = useState(0);
  const [sponsorRotationPaused, setSponsorRotationPaused] = useState(false);
  const [sponsors, setSponsors] = useState<SponsorsResponse | null>(null);
  const [isSponsorModalOpen, setIsSponsorModalOpen] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    async function loadSponsors() {
      try {
        const response = await fetch("/api/v1/sponsors", {
          cache: "no-store",
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(`Sponsor request failed with ${response.status}`);
        }

        const payload = (await response.json()) as SponsorsResponse;
        setSponsors(payload);
      } catch (error) {
        if (!controller.signal.aborted) {
          console.error("Unable to load sponsors:", error);
        }
      }
    }

    void loadSponsors();

    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (sponsorRotationPaused) return;

    const interval = window.setInterval(() => {
      setSponsorRotation((current) => current + 1);
    }, SPONSOR_ROTATION_MS);

    return () => window.clearInterval(interval);
  }, [sponsorRotationPaused]);

  const [leftSponsors, rightSponsors] = useMemo(() => {
    const left = sponsors?.data.filter((_, index) => index % 2 === 0) ?? [];
    const right = sponsors?.data.filter((_, index) => index % 2 === 1) ?? [];

    return [left, right];
  }, [sponsors]);

  return (
    <div
      className="h-dvh w-full overflow-hidden bg-[#070707] text-[#F5F5F5] font-sans"
      suppressHydrationWarning
    >
      <div className="h-full w-full max-w-[1880px] mx-auto px-2 py-0 sm:px-5 sm:py-3 flex justify-between gap-5 lg:gap-8 overflow-hidden">
        {/* Left Promotional Rail (Desktop: pushed far left) */}
        <div className="hidden xl:flex shrink-0 h-full">
          <AdRail
            side="left"
            sponsors={leftSponsors}
            available={sponsors?.available ?? 0}
            loading={sponsors === null}
            rotation={sponsorRotation}
            onPauseChange={setSponsorRotationPaused}
            onReserve={() => setIsSponsorModalOpen(true)}
          />
        </div>

        {/* Center Main Content Container (Controlled width, centered) */}
        <main className="w-full max-w-[980px] flex flex-col gap-3 sm:gap-6 lg:gap-12 min-h-0 min-w-0 mx-auto px-0 sm:px-3">
          <SiteHeader />
          {children}
          <MobileAdMarquee
            sponsors={sponsors?.data ?? []}
            available={sponsors?.available ?? 0}
            loading={sponsors === null}
            onReserve={() => setIsSponsorModalOpen(true)}
          />
        </main>

        {/* Right Promotional Rail (Desktop: pushed far right) */}
        <div className="hidden xl:flex shrink-0 h-full">
          <AdRail
            side="right"
            sponsors={rightSponsors}
            available={sponsors?.available ?? 0}
            loading={sponsors === null}
            rotation={sponsorRotation}
            onPauseChange={setSponsorRotationPaused}
            onReserve={() => setIsSponsorModalOpen(true)}
          />
        </div>
      </div>

      <BecomeSponsorModal
        open={isSponsorModalOpen}
        onOpenChange={setIsSponsorModalOpen}
      />
    </div>
  );
};
