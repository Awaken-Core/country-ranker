import React from "react";
import {Link} from "@/i18n/navigation";
import { CountryFlag } from "@/components/country-flag";
import { RankedCountryDTO } from "@/modules/ranking/ranking.types";
import { cn } from "@/lib/utils";

interface CountryRankCardProps {
  rankedCountry: RankedCountryDTO;
  highlight?: boolean;
  className?: string;
}

export const CountryRankCard: React.FC<CountryRankCardProps> = ({
  rankedCountry,
  highlight = false,
  className,
}) => {
  const { rank, country, upvotes, downvotes } = rankedCountry;

  // Visual treatments for podium top 3
  const isGold = rank === 1;
  const isSilver = rank === 2;
  const isBronze = rank === 3;

  return (
    <Link
      href={`/country/${country.slug}`}
      className={cn(
        "group relative flex items-center justify-between gap-4 rounded-xl border border-white/[0.08] bg-[#0D0D11]/80 px-4 py-3.5 backdrop-blur-md transition-all duration-200 hover:-translate-y-0.5 hover:border-white/20 hover:bg-[#13131A] hover:shadow-lg hover:shadow-black/50 sm:px-6 sm:py-4",
        isGold && "border-amber-500/40 bg-gradient-to-r from-amber-500/[0.08] to-transparent hover:border-amber-400/60 shadow-[0_0_20px_rgba(245,158,11,0.08)]",
        isSilver && "border-slate-300/30 bg-gradient-to-r from-slate-300/[0.06] to-transparent hover:border-slate-300/50",
        isBronze && "border-amber-700/30 bg-gradient-to-r from-amber-700/[0.06] to-transparent hover:border-amber-700/50",
        highlight && "ring-1 ring-primary/40",
        className
      )}
    >
      <div className="flex items-center gap-4 min-w-0">
        {/* Rank indicator */}
        <div
          className={cn(
            "flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-lg font-mono text-sm font-semibold tracking-wider",
            isGold && "bg-amber-500/20 text-amber-300 ring-1 ring-amber-500/50 shadow-[0_0_12px_rgba(245,158,11,0.25)]",
            isSilver && "bg-slate-300/20 text-slate-200 ring-1 ring-slate-300/40",
            isBronze && "bg-amber-700/20 text-amber-400 ring-1 ring-amber-700/40",
            !isGold && !isSilver && !isBronze && "bg-white/[0.04] text-muted-foreground"
          )}
        >
          {isGold ? "🥇" : isSilver ? "🥈" : isBronze ? "🥉" : `#${rank}`}
        </div>

        {/* Flag */}
        <CountryFlag code={country.code} size="lg" className="rounded-sm shadow" />

        {/* Name and Code */}
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="truncate text-sm sm:text-base font-medium text-foreground group-hover:text-white transition-colors">
              {country.name}
            </h3>
            <span className="rounded bg-white/[0.05] px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground uppercase">
              {country.code}
            </span>
          </div>
        </div>
      </div>

      {/* Votes Column */}
      <div className="flex items-center gap-4 sm:gap-6 text-right shrink-0">
        <div>
          <div className="font-mono text-sm sm:text-base font-semibold text-foreground group-hover:text-white">
            {upvotes.toLocaleString()}
          </div>
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
            Upvotes
          </div>
        </div>

        {downvotes > 0 && (
          <div className="hidden sm:block">
            <div className="font-mono text-xs font-normal text-muted-foreground/80">
              {downvotes.toLocaleString()}
            </div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground/60">
              Downvotes
            </div>
          </div>
        )}

        <div className="text-muted-foreground/40 group-hover:text-foreground group-hover:translate-x-0.5 transition-all text-sm">
          →
        </div>
      </div>
    </Link>
  );
};
