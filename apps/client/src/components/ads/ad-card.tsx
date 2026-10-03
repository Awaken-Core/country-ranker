import React from "react";
import { AdItem } from "./ad-data";
import { cn } from "@/lib/utils";

interface AdCardProps {
  ad: AdItem;
  className?: string;
}

export const AdCard: React.FC<AdCardProps> = ({ ad, className }) => {
  return (
    <div
      className={cn(
        "group relative flex flex-col items-center justify-between text-center px-3 py-2.5 rounded-lg border transition-all duration-150 cursor-pointer flex-1 min-h-0",
        ad.cardBg || "bg-[#101010] hover:border-white/20",
        ad.accentColor || "border-white/[0.08]",
        className
      )}
    >
      <div className="flex flex-col items-center w-full">
        {/* Brand Icon */}
        <div
          className={cn(
            "w-6 h-6 rounded-md flex items-center justify-center font-bold text-[11px] shadow mb-1.5 transition-transform group-hover:scale-105",
            ad.logoBg || "bg-zinc-800",
            ad.logoTextColor || "text-white"
          )}
        >
          {ad.logoText || "★"}
        </div>

        {/* Brand Title */}
        <div className="font-semibold text-[11px] tracking-tight text-white/95 group-hover:text-white leading-none">
          {ad.brand}
        </div>

        {/* Description */}
        <p className="font-mono text-[9px] text-zinc-400 mt-1 line-clamp-2 leading-tight">
          {ad.description}
        </p>
      </div>

      {/* Hover action indicator */}
      {ad.isAvailableSlot ? (
        <span className="mt-1 text-[8px] font-mono uppercase tracking-widest text-amber-400/90 group-hover:text-amber-300">
          Reserve Spot →
        </span>
      ) : (
        <span className="mt-1 text-[8px] font-mono text-zinc-500 group-hover:text-zinc-300 transition-colors">
          Promoted ↗
        </span>
      )}
    </div>
  );
};
