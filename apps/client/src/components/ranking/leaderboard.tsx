"use client";

import React, { useState } from "react";
import { RankedCountryDTO } from "@/modules/ranking/ranking.types";
import { CountryRankingRow } from "./country-ranking-row";
import Link from "next/link";

interface LeaderboardProps {
  initialRankings: RankedCountryDTO[];
}

export const Leaderboard: React.FC<LeaderboardProps> = ({ initialRankings }) => {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "top20" | "top50">("all");

  const filtered = initialRankings.filter(
    (item) =>
      item.country.name.toLowerCase().includes(search.toLowerCase().trim()) ||
      item.country.code.toLowerCase().includes(search.toLowerCase().trim())
  );

  const displayedList =
    filter === "top20"
      ? filtered.slice(0, 20)
      : filter === "top50"
      ? filtered.slice(0, 50)
      : filtered;

  return (
    <div className="w-full flex-1 min-h-0 flex flex-col">
      {/* 1. Compact Editorial Header */}
      <div className="shrink-0 mb-3">
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-mono text-[10px] uppercase tracking-wider text-zinc-400">
              Realtime Global Ranking
            </span>
          </div>

          <Link
            href="/countries"
            className="text-xs text-zinc-400 hover:text-white transition-colors"
          >
            All countries directory →
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
        <div className="shrink-0 px-4 py-3 border-b border-white/[0.06] bg-[#0E0E0E] flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 self-start sm:self-center">
            <button
              onClick={() => setFilter("all")}
              className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                filter === "all"
                  ? "bg-white/[0.1] text-white"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              All Ranked ({initialRankings.length})
            </button>
            <button
              onClick={() => setFilter("top20")}
              className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                filter === "top20"
                  ? "bg-white/[0.1] text-white"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              Top 20
            </button>
            <button
              onClick={() => setFilter("top50")}
              className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                filter === "top50"
                  ? "bg-white/[0.1] text-white"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              Top 50
            </button>
          </div>

          {/* Search Input */}
          <div className="relative w-full sm:w-64">
            <input
              type="text"
              placeholder="Search by country or code..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-8 bg-[#080808] border border-white/[0.08] rounded-lg pl-8 pr-7 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-zinc-500"
            />
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500 text-xs">
              🔍
            </span>
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-zinc-400 hover:text-white"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Table Column Headers */}
        <div className="shrink-0 grid grid-cols-12 px-4 py-2 border-b border-white/[0.04] bg-[#0A0A0A] font-mono text-[10px] uppercase tracking-wider text-zinc-500">
          <div className="col-span-2 sm:col-span-1"># Rank</div>
          <div className="col-span-6 sm:col-span-7">Country</div>
          <div className="col-span-2 text-right">Votes</div>
          <div className="col-span-2 text-right">Movement</div>
        </div>

        {/* 3. The Dedicated Scrolling Body (overflow-y-auto) */}
        <div className="flex-1 overflow-y-auto p-2.5 flex flex-col gap-1.5 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
          {displayedList.length === 0 ? (
            <div className="h-48 flex flex-col items-center justify-center text-center p-4">
              <p className="text-zinc-400 text-xs font-mono">No matching country found.</p>
            </div>
          ) : (
            displayedList.map((item) => (
              <CountryRankingRow key={item.country.id} rankedCountry={item} />
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
