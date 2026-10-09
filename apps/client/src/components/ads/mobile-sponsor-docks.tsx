"use client";

import { Megaphone } from "lucide-react";
import Image from "next/image";
import type { SponsorAd } from "./ad-data";
import { uploadthingsURI } from "@/lib/constants";

interface MobileSponsorDockProps {
  sponsors: SponsorAd[];
  available: number;
  loading: boolean;
  onReserve: () => void;
  position: "top" | "bottom";
}

const MOBILE_SPONSOR_COUNT = 5;

function sponsorLogo(logo: string) {
  return logo.startsWith("http") ? logo : `${uploadthingsURI}/f/${logo}`;
}

function SponsorDock({ sponsors, available, loading, onReserve, position }: MobileSponsorDockProps) {
  return (
    <section
      aria-label={`${position} sponsors`}
      className="grid grid-cols-5 gap-1 overflow-hidden rounded-lg border border-white/[0.07] bg-[#0b0b0b] p-1"
    >
      {Array.from({ length: MOBILE_SPONSOR_COUNT }, (_, index) => {
        const sponsor = sponsors[index];

        if (loading) {
          return <div key={index} className="h-12 animate-pulse rounded-md bg-white/[0.04]" />;
        }

        if (sponsor) {
          return (
            <a
              key={sponsor.slotId}
              href={sponsor.website}
              target="_blank"
              rel="noopener noreferrer sponsored"
              title={sponsor.name}
              className="flex h-12 min-w-0 flex-col items-center justify-center gap-1 rounded-md border border-white/10 px-1 text-center transition-transform hover:scale-[1.03] focus-visible:outline-2 focus-visible:outline-emerald-400"
              style={{ backgroundColor: sponsor.bgColor ?? "#141414", color: sponsor.textColor ?? "#f8fafc" }}
            >
              <Image
                src={sponsorLogo(sponsor.logo)}
                alt=""
                width={20}
                height={20}
                unoptimized
                className="size-5 rounded object-cover"
              />
              <span className="w-full truncate text-[8px] font-medium leading-none">{sponsor.name}</span>
            </a>
          );
        }

        return available > 0 ? (
          <button
            key={`available-${index}`}
            type="button"
            onClick={onReserve}
            className="flex h-12 min-w-0 flex-col items-center justify-center gap-1 rounded-md border border-dashed border-white/15 bg-white/[0.025] text-zinc-400 transition-colors hover:border-emerald-400/60 hover:text-white"
          >
            <Megaphone className="size-3" aria-hidden="true" />
            <span className="text-[8px] leading-none">Advertise</span>
          </button>
        ) : (
          <div key={`empty-${index}`} className="h-12 rounded-md bg-white/[0.02]" aria-hidden="true" />
        );
      })}
    </section>
  );
}

export function MobileSponsorDock(props: MobileSponsorDockProps) {
  return (
    <div className="shrink-0 md:hidden">
      <SponsorDock {...props} />
    </div>
  );
}
