"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";
import { AdCard } from "./ad-card";
import { type AdItem, type SponsorAd, VISIBLE_ADS_PER_RAIL } from "./ad-data";

interface AdRailProps {
  side: "left" | "right";
  sponsors: Array<SponsorAd | null>;
  available: number;
  loading: boolean;
  onPauseChange: (paused: boolean) => void;
  onReserve: () => void;
  className?: string;
}

export function AdRail({
  side,
  sponsors,
  available,
  loading,
  onPauseChange,
  onReserve,
  className,
}: AdRailProps) {
  const reduceMotion = useReducedMotion();
  const cards: Array<AdItem | null> = Array.from(
    { length: VISIBLE_ADS_PER_RAIL },
    (_, index) =>
      sponsors[index] ??
      (available > 0
        ? {
            id: "available-slot" as const,
            available,
          }
        : null),
  );

  return (
    <aside
      aria-label={`${side} rotating sponsor rail`}
      onPointerEnter={() => onPauseChange(true)}
      onPointerLeave={() => onPauseChange(false)}
      className={cn(
        "flex h-full w-[180px] shrink-0 select-none flex-col gap-3 2xl:w-[240px]",
        className,
      )}
    >
      {cards.map((ad, slotIndex) => (
        <div
          key={`${side}-display-position-${slotIndex}`}
          className="relative min-h-0 flex-1 [perspective:900px]"
        >
          {loading ? (
            <div className="absolute inset-0 animate-pulse rounded-lg border border-white/[0.06] bg-white/[0.03]" />
          ) : ad ? (
            "id" in ad ? (
              <AdCard ad={ad} onReserve={onReserve} className="h-full" />
            ) : (
              <AnimatePresence initial={false} mode="wait">
                <motion.div
                  key={ad.slotId}
                  initial={
                    reduceMotion
                      ? { opacity: 0 }
                      : {
                          opacity: 0,
                          filter: "blur(3px)",
                          x: 34,
                          y: -10,
                          rotateX: 7,
                          rotateY: 72,
                          scale: 0.92,
                        }
                  }
                  animate={{
                    opacity: 1,
                    filter: "blur(0px)",
                    x: 0,
                    y: 0,
                    rotateX: 0,
                    rotateY: 0,
                    scale: 1,
                  }}
                  exit={
                    reduceMotion
                      ? { opacity: 0 }
                      : {
                          opacity: 0,
                          filter: "blur(3px)",
                          x: -34,
                          y: 10,
                          rotateX: -7,
                          rotateY: -72,
                          scale: 0.92,
                        }
                  }
                  transition={{
                    duration: reduceMotion ? 0.4 : 0.6,
                    delay: reduceMotion ? 0 : slotIndex * 0.1,
                    ease: [0.36, 1, 0.36, 1],
                  }}
                  className="absolute inset-0 transform-3d will-change-transform"
                >
                  <AdCard ad={ad} className="h-full" />
                </motion.div>
              </AnimatePresence>
            )
          ) : null}
        </div>
      ))}
    </aside>
  );
}
