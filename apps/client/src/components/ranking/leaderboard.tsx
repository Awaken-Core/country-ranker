"use client";

import React, { useCallback, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { Search, X, ArrowRight } from "lucide-react";
import { RankedCountryDTO } from "@/modules/ranking/ranking.types";
import { CountryRankingRow } from "./country-ranking-row";
import { cn } from "@/lib/utils";
import { Confetti, type ConfettiRef } from "@/components/ui/confetti";
import { toast } from "sonner";
import VotePurchaseModal from "@/components/purchase/vote-purchase-modal";

interface LeaderboardProps {
  initialRankings: RankedCountryDTO[];
}

export const Leaderboard: React.FC<LeaderboardProps> = ({
  initialRankings,
}) => {
  const confettiRef = useRef<ConfettiRef>(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "top20" | "top50">("all");
  const [purchaseOpen, setPurchaseOpen] = useState(false);
  const [purchaseCountryId, setPurchaseCountryId] = useState<string | null>(
    null,
  );
  const purchasableCountries = useMemo(
    () => initialRankings.map(({ country }) => country),
    [initialRankings],
  );

  const handleVoteSuccess = useCallback(
    (countryName: string, voteType: "UPVOTE" | "DOWNVOTE") => {
      void confettiRef.current?.fire({
        particleCount: 80,
        spread: 65,
        startVelocity: 35,
        origin: { x: 0.5, y: 0.65 },
        colors:
          voteType === "UPVOTE"
            ? ["#00df81", "#33ffaa", "#ffffff"]
            : ["#ff4d4d", "#ff8080", "#ffffff"],
      });
      toast.success(
        `🎉 You ${voteType === "UPVOTE" ? "upvoted" : "downvoted"} ${countryName}`,
      );
    },
    [],
  );

  const filtered = initialRankings.filter(
    (item) =>
      item.country.name.toLowerCase().includes(search.toLowerCase().trim()) ||
      item.country.code.toLowerCase().includes(search.toLowerCase().trim()),
  );

  const displayedList =
    filter === "top20"
      ? filtered.slice(0, 20)
      : filter === "top50"
        ? filtered.slice(0, 50)
        : filtered;

  function openPurchaseModal(countryId: string) {
    setPurchaseCountryId(countryId);
    setPurchaseOpen(true);
  }

  return (
    <div className="w-full flex-1 min-h-0 flex flex-col font-sans">
      <Confetti
        ref={confettiRef}
        manualstart
        className="pointer-events-none fixed inset-0 z-[9999] size-full"
      />
      {purchaseOpen && (
        <VotePurchaseModal
          open
          onOpenChange={setPurchaseOpen}
          countries={purchasableCountries}
          initialCountryId={purchaseCountryId}
        />
      )}
      {/* 1. Compact Editorial Header */}
      <div className="shrink-0 mb-3">
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span className="font-mono text-[10px] uppercase tracking-wider text-zinc-400">
              Realtime Global Ranking
            </span>
          </div>

          <Link
            href="/countries"
            className="group inline-flex items-center gap-1 text-xs text-zinc-400 hover:text-white transition-colors"
          >
            <span>All countries directory</span>
            <ArrowRight className="size-3 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
            Global Country Leaderboard
          </h1>
          <p className="text-xs text-zinc-400">
            Ranked by verified sovereign community popularity.
          </p>
        </div>
      </div>

      {/* 2. Self-Contained Leaderboard Panel with Dedicated Internal Scroll */}
      <div className="flex-1 min-h-0 flex flex-col rounded-xl border border-white/[0.08] bg-[#0C0C0C] overflow-hidden shadow-2xl">
        {/* Panel Toolbar (Sticky top inside container) */}
        <div className="shrink-0 px-4 py-2.5 border-b border-white/[0.06] bg-[#0E0E0E] flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Filter Pills - exactly matching reference image */}
          <div className="flex items-center gap-2 self-start sm:self-center">
            <button
              type="button"
              onClick={() => setFilter("all")}
              className={cn(
                "px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer",
                filter === "all"
                  ? "bg-[#1c1c1c] text-white border border-white/[0.1] shadow-sm"
                  : "text-zinc-400 hover:text-white",
              )}
            >
              All Ranked ({initialRankings.length})
            </button>
            <button
              type="button"
              onClick={() => setFilter("top20")}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer",
                filter === "top20"
                  ? "bg-[#1c1c1c] text-white border border-white/[0.1] shadow-sm"
                  : "text-zinc-400 hover:text-white",
              )}
            >
              Top 20
            </button>
            <button
              type="button"
              onClick={() => setFilter("top50")}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer",
                filter === "top50"
                  ? "bg-[#1c1c1c] text-white border border-white/[0.1] shadow-sm"
                  : "text-zinc-400 hover:text-white",
              )}
            >
              Top 50
            </button>
          </div>

          {/* Search Input */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-zinc-500 pointer-events-none" />
            <input
              type="text"
              placeholder="Search country or ISO code..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-8 bg-[#080808] border border-white/[0.08] rounded-lg pl-8 pr-7 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400/20 transition-all"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 text-zinc-400 hover:text-white rounded transition-colors"
                aria-label="Clear search"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Table Column Headers */}
        <div className="shrink-0 grid grid-cols-12 px-4 py-2 border-b border-white/[0.04] bg-[#0A0A0A] font-mono text-[10px] uppercase tracking-wider text-zinc-500">
          <div className="col-span-1"># Rank</div>
          <div className="col-span-7">Country</div>
          <div className="col-span-1 text-end">Score</div>
          <div className="col-span-3 text-end pr-14">Actions</div>
        </div>

        {/* 3. The Dedicated Scrolling Body */}
        <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-1.5 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
          {displayedList.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.15 }}
              className="h-48 flex flex-col items-center justify-center text-center p-4"
            >
              <p className="text-zinc-400 text-xs font-mono">
                No matching country found.
              </p>
              <p className="text-zinc-600 text-[11px] mt-1">
                Try searching by official name or 2-letter ISO code.
              </p>
            </motion.div>
          ) : (
            displayedList.map((item) => (
              <CountryRankingRow
                key={item.country.id}
                rankedCountry={item}
                onVoteSuccess={handleVoteSuccess}
                onOpenPurchase={openPurchaseModal}
              />
            ))
          )}
        </div>

        {/* Panel Footer / Status bar */}
        <div className="shrink-0 px-4 py-2 border-t border-white/[0.04] bg-[#0A0A0A] flex items-center justify-between text-[11px] font-mono text-zinc-500">
          <span>Showing {displayedList.length} sovereign states</span>
          <span>Verified PostgreSQL Ledger</span>
        </div>
      </div>
    </div>
  );
};
