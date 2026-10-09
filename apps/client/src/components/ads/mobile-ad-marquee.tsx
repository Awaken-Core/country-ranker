"use client";

import { AdCard } from "./ad-card";
import type { AdItem, SponsorAd } from "./ad-data";
import { Marquee } from "@/components/ui/marquee";

interface MobileAdMarqueeProps {
  sponsors: SponsorAd[];
  available: number;
  loading: boolean;
  onReserve: () => void;
}

export function MobileAdMarquee({
  sponsors,
  available,
  loading,
  onReserve,
}: MobileAdMarqueeProps) {
  const cards: AdItem[] = [
    ...sponsors,
    ...(available > 0
      ? [{ id: "available-slot" as const, available }]
      : []),
  ];

  if (!loading && cards.length === 0) return null;

  return (
    <aside
      aria-label="Sponsors"
      className="shrink-0 overflow-hidden border-t border-white/[0.07] bg-[#090909] py-2 md:hidden"
    >
      {loading ? (
        <div className="flex gap-2 overflow-hidden px-2">
          <div className="h-16 w-56 shrink-0 animate-pulse rounded-xl border border-white/[0.06] bg-white/[0.03]" />
          <div className="h-16 w-56 shrink-0 animate-pulse rounded-xl border border-white/[0.06] bg-white/[0.03]" />
        </div>
      ) : (
        <Marquee
          gap={8}
          speed={36}
          fadeEdges
          fadeWidth={18}
          pauseOnTap={false}
          draggable={false}
          className="w-full"
        >
          {cards.map((ad) => (
            <AdCard
              key={"id" in ad ? ad.id : ad.slotId}
              ad={ad}
              compact
              onReserve={onReserve}
            />
          ))}
        </Marquee>
      )}
    </aside>
  );
}
