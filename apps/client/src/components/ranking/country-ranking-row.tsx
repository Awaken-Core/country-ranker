"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { CountryFlag } from "@/components/country-flag";
import { RankedCountryDTO } from "@/modules/ranking/ranking.types";
import { cn } from "@/lib/utils";
import { LeaderboardVoteActions } from "@/components/voting/leaderboard-vote-actions";

interface CountryRankingRowProps {
  rankedCountry: RankedCountryDTO;
  className?: string;
}

export const CountryRankingRow: React.FC<CountryRankingRowProps> = ({
  rankedCountry,
  className,
}) => {
  const { rank, country, score } = rankedCountry;
  const [hasMessage, setHasMessage] = useState(false);

  const isGold = rank === 1;
  const isSilver = rank === 2;
  const isBronze = rank === 3;

  return (
    <motion.div
      whileHover={{ x: 2 }}
      transition={{ duration: 0.12, ease: "easeOut" }}
      className={cn(
        "group grid grid-cols-12 items-center px-4 py-2.5 rounded-lg border text-xs transition-colors",
        hasMessage ? "relative z-50" : "relative z-0",
        isGold
          ? "bg-[#14120C]/90 border-amber-600/30 hover:border-amber-500/50 hover:bg-[#19150E]"
          : isSilver
          ? "bg-[#101112]/90 border-white/[0.06] hover:border-zinc-300/30 hover:bg-[#151618]"
          : isBronze
          ? "bg-[#12100E]/90 border-amber-700/20 hover:border-amber-700/40 hover:bg-[#181310]"
          : "bg-[#0E0E0E]/80 border-white/[0.04] hover:bg-[#141414] hover:border-white/10",
        className
      )}
    >
      {/* Rank column - plain clean number matching photo 2 */}
      <div className="col-span-2 sm:col-span-1 flex items-center">
        <Link href={`/country/${country.slug}`} className="w-full flex items-center">
          <span
            className={cn(
              "font-mono tabular-nums pl-0.5",
              isGold && "text-sm font-bold text-amber-500",
              isSilver && "text-sm font-semibold text-zinc-200",
              isBronze && "text-sm font-semibold text-amber-600",
              !isGold && !isSilver && !isBronze && "text-xs font-medium text-zinc-500"
            )}
          >
            {rank}
          </span>
        </Link>
      </div>

      {/* Country Name + Flag + Code (cols 3-8) */}
      <Link
        href={`/country/${country.slug}`}
        className="col-span-6 sm:col-span-7 flex items-center gap-2.5 min-w-0 pr-2"
      >
        <CountryFlag code={country.code} size="sm" className="rounded-[2px] shadow-sm shrink-0" />
        <span className="font-medium text-zinc-200 group-hover:text-white transition-colors truncate">
          {country.name}
        </span>
        <span className="font-mono text-[10px] text-zinc-500 uppercase shrink-0">
          {country.code}
        </span>
      </Link>

      {/* Vote Count (cols 9-10) */}
      <div className="col-span-2 flex items-center justify-end">
        <span className="font-mono text-xs font-semibold text-zinc-300 group-hover:text-white tabular-nums transition-colors">
          {score.toLocaleString()}
        </span>
      </div>

      {/* Actions */}
      <div className="col-span-2 flex items-center justify-end font-mono text-[11px]">
        <LeaderboardVoteActions
          slug={country.slug}
          onMessageChange={setHasMessage}
        />
      </div>
    </motion.div>
  );
};
