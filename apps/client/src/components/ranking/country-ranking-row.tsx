"use client";

import { useLocale } from "next-intl";
import React from "react";
import { countryName } from "@/i18n/country-name";
import { Link } from "@/i18n/navigation";
import { motion, useReducedMotion } from "motion/react";
import { Crown } from "lucide-react";
import { CountryFlag } from "@/components/country-flag";
import { RankedCountryDTO } from "@/modules/ranking/ranking.types";
import { cn } from "@/lib/utils";
import { LeaderboardVoteActions } from "@/components/voting/leaderboard-vote-actions";

interface CountryRankingRowProps {
  rankedCountry: RankedCountryDTO;
  className?: string;
  isUserCountry?: boolean;
  isHighlighted?: boolean;
  onVoteSuccess: (countryName: string, voteType: "UPVOTE" | "DOWNVOTE") => void;
  onOpenPurchase: (countryId: string) => void;
}

export const CountryRankingRow = React.forwardRef<
  HTMLDivElement,
  CountryRankingRowProps
>(
  (
    {
      rankedCountry,
      className,
      isUserCountry = false,
      isHighlighted = false,
      onVoteSuccess,
      onOpenPurchase,
    },
    ref,
  ) => {
    const locale = useLocale();
    const { rank, country, score } = rankedCountry;
    const reduceMotion = useReducedMotion();

    const isGold = rank === 1;
    const isSilver = rank === 2;
    const isBronze = rank === 3;

    return (
      <motion.div
        ref={ref}
        data-country-code={country.code}
        whileHover={{ x: 2 }}
        transition={{ duration: 0.12, ease: "easeOut" }}
      className={cn(
        "group grid grid-cols-[32px_minmax(0,1fr)_28px_96px] sm:grid-cols-12 items-center px-2 py-1.5 sm:px-4 sm:py-2.5 rounded-lg border text-xs transition-all duration-300",
        "relative z-0",
        isHighlighted
          ? "border-emerald-500/60 bg-emerald-950/25 ring-1 ring-emerald-500/30"
          : isUserCountry
            ? "border-emerald-500/30 bg-emerald-950/15"
            : isGold
              ? "bg-[#14120C]/90 border-amber-600/30 hover:border-amber-500/50 hover:bg-[#19150E]"
              : isSilver
                ? "bg-[#101112]/90 border-white/[0.06] hover:border-zinc-300/30 hover:bg-[#151618]"
                : isBronze
                  ? "bg-[#12100E]/90 border-amber-700/20 hover:border-amber-700/40 hover:bg-[#181310]"
                  : "bg-[#0E0E0E]/80 border-white/[0.04] hover:bg-[#141414] hover:border-white/10",
        className,
      )}
    >
      {/* Game-style rank badge: animated podium emblems, clean numerals below. */}
      <div className="col-start-1 col-span-1 flex items-center">
        <Link
          href={`/country/${country.slug}`}
          className="w-full flex items-center justify-start"
          aria-label={`${countryName(locale, country.code, country.name)}, rank ${rank}`}
        >
          {rank <= 3 ? (
            <motion.span
              initial={reduceMotion ? false : { opacity: 0, scale: 0.72, rotate: -8 }}
              animate={
                reduceMotion
                  ? undefined
                  : {
                      opacity: 1,
                      scale: [1, 1.045, 1],
                      rotate: 0,
                    }
              }
              transition={{
                opacity: { duration: 0.3, delay: rank * 0.07 },
                rotate: { duration: 0.35, delay: rank * 0.07 },
                scale: {
                  duration: 2.8,
                  delay: rank * 0.22,
                  repeat: Infinity,
                  ease: "easeInOut",
                },
              }}
              whileHover={reduceMotion ? undefined : { scale: 1.12, rotate: 3 }}
              className={cn(
                "relative isolate flex size-7 sm:size-10 items-center justify-center overflow-hidden rounded-md border font-mono text-base sm:text-lg font-black tabular-nums shadow-lg",
                "before:absolute before:inset-[-60%] before:-z-10 before:animate-[spin_4s_linear_infinite] before:bg-[conic-gradient(from_90deg,transparent_0deg,rgba(255,255,255,.5)_55deg,transparent_105deg)]",
                "after:absolute after:inset-px after:-z-10 after:rounded-[5px]",
                isGold &&
                  "border-amber-200/80 bg-amber-500 text-white shadow-[0_0_22px_rgba(245,158,11,.48)] after:bg-[radial-gradient(circle_at_35%_25%,#ffdc72,#d35400_70%)]",
                isSilver &&
                  "border-sky-100/80 bg-slate-400 text-white shadow-[0_0_20px_rgba(148,163,184,.42)] after:bg-[radial-gradient(circle_at_35%_25%,#dff4ff,#526477_70%)]",
                isBronze &&
                  "border-orange-300/70 bg-orange-700 text-white shadow-[0_0_20px_rgba(234,88,12,.42)] after:bg-[radial-gradient(circle_at_35%_25%,#ffb067,#8a2f16_70%)]",
              )}
            >
              {isGold && (
                <Crown
                  aria-hidden="true"
                  className="absolute top-0.5 size-3 text-amber-100 drop-shadow"
                  strokeWidth={2.5}
                />
              )}
              <span className={cn("relative drop-shadow-md", isGold && "pt-2")}>{rank}</span>
              <span className="absolute inset-x-1 bottom-1 h-px bg-white/35" aria-hidden="true" />
            </motion.span>
          ) : (
            <motion.span
              initial={reduceMotion ? false : { opacity: 0, x: -5 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.22, delay: Math.min(rank, 12) * 0.025 }}
              className="flex size-7 sm:size-10 items-center justify-center font-mono text-base sm:text-xl font-medium tabular-nums text-zinc-400 transition-colors group-hover:text-white"
            >
              {rank}
            </motion.span>
          )}
        </Link>
      </div>

      {/* Country Name + Flag + Code (cols 3-8) */}
      <Link
        href={`/country/${country.slug}`}
        className="col-start-2 col-span-1 sm:col-span-7 flex items-center gap-1.5 sm:gap-2.5 min-w-0 pr-1 sm:pr-2"
      >
        <CountryFlag
          code={country.code}
          size="sm"
          className="rounded-[2px] shadow-sm shrink-0"
        />
        <span className="text-[11px] sm:text-xs font-medium text-zinc-200 group-hover:text-white transition-colors truncate">
          {countryName(locale, country.code, country.name)}
        </span>
        {isUserCountry && (
          <span className="hidden sm:inline-flex items-center text-[9px] font-mono font-semibold uppercase px-1.5 py-0.5 rounded bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 shrink-0">
            YOUR COUNTRY
          </span>
        )}
        <span className="hidden min-[360px]:inline font-mono text-[9px] sm:text-[10px] text-zinc-500 uppercase shrink-0">
          {country.code}
        </span>
      </Link>

      {/* Net score */}
      <div className="col-start-3 sm:col-start-auto col-span-1 flex items-center justify-end">
        <span className="font-mono text-[10px] sm:text-xs font-semibold text-zinc-300 group-hover:text-white tabular-nums transition-colors">
          {score.toLocaleString(locale)}
        </span>
      </div>

      {/* Actions */}
      <div className="col-start-4 sm:col-start-auto col-span-1 sm:col-span-3 flex items-center justify-end font-mono text-[11px]">
        <LeaderboardVoteActions
          slug={country.slug}
          countryName={countryName(locale, country.code, country.name)}
          onVoteSuccess={onVoteSuccess}
          onOpenPurchase={() => onOpenPurchase(country.id)}
        />
      </div>
    </motion.div>
  );
});

CountryRankingRow.displayName = "CountryRankingRow";
