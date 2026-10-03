import React from "react";
import Link from "next/link";
import { CountryFlag } from "@/components/country-flag";
import { RankedCountryDTO } from "@/modules/ranking/ranking.types";
import { cn } from "@/lib/utils";

interface CountryRankingRowProps {
  rankedCountry: RankedCountryDTO;
  className?: string;
}

export const CountryRankingRow: React.FC<CountryRankingRowProps> = ({
  rankedCountry,
  className,
}) => {
  const { rank, country, upvotes } = rankedCountry;

  const isGold = rank === 1;
  const isSilver = rank === 2;
  const isBronze = rank === 3;

  return (
    <Link
      href={`/country/${country.slug}`}
      className={cn(
        "group grid grid-cols-12 items-center px-4 py-2.5 rounded-lg border text-xs transition-colors",
        isGold
          ? "bg-[#14120C] border-amber-500/20 hover:border-amber-500/40"
          : isSilver
          ? "bg-[#101112] border-zinc-500/15 hover:border-zinc-400/30"
          : isBronze
          ? "bg-[#12100E] border-amber-700/15 hover:border-amber-700/30"
          : "bg-[#0E0E0E] border-white/[0.04] hover:bg-[#141414] hover:border-white/10",
        className
      )}
    >
      {/* Rank column (cols 1-2) */}
      <div className="col-span-2 sm:col-span-1 flex items-center">
        <span
          className={cn(
            "font-mono text-xs font-semibold tabular-nums",
            isGold && "text-amber-400",
            isSilver && "text-zinc-300",
            isBronze && "text-amber-600",
            !isGold && !isSilver && !isBronze && "text-zinc-500"
          )}
        >
          {rank}
        </span>
      </div>

      {/* Country Name + Flag + Code (cols 3-8) */}
      <div className="col-span-6 sm:col-span-7 flex items-center gap-2.5 min-w-0 pr-2">
        <CountryFlag code={country.code} size="sm" className="rounded-[1px] shadow-sm shrink-0" />
        <span className="font-medium text-zinc-200 group-hover:text-white truncate">
          {country.name}
        </span>
        <span className="font-mono text-[10px] text-zinc-500 uppercase shrink-0">
          {country.code}
        </span>
      </div>

      {/* Vote Count (cols 9-10) */}
      <div className="col-span-2 flex items-center justify-end">
        <span className="font-mono text-xs font-semibold text-zinc-300 group-hover:text-white tabular-nums">
          {upvotes.toLocaleString()}
        </span>
      </div>

      {/* Change / Movement (cols 11-12) */}
      <div className="col-span-2 flex items-center justify-end font-mono text-[11px]">
        {isGold ? (
          <span className="text-emerald-400 font-medium">↑ +1</span>
        ) : (
          <span className="text-zinc-500">—</span>
        )}
      </div>
    </Link>
  );
};
