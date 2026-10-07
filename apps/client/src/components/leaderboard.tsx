"use client";

import React, { useState } from "react";
import { RankedCountryDTO } from "@/modules/ranking/ranking.types";
import { TopThree } from "@/components/top-three";
import { CountryRankCard } from "@/components/country-rank-card";
import { Input } from "@/components/ui/input";
import {Link} from "@/i18n/navigation";

interface LeaderboardProps {
  initialRankings: RankedCountryDTO[];
  showTopThree?: boolean;
}

export const Leaderboard: React.FC<LeaderboardProps> = ({
  initialRankings,
  showTopThree = true,
}) => {
  const [search, setSearch] = useState("");

  const filtered = initialRankings.filter(
    (item) =>
      item.country.name.toLowerCase().includes(search.toLowerCase().trim()) ||
      item.country.code.toLowerCase().includes(search.toLowerCase().trim())
  );

  const topThreeList = showTopThree && !search ? initialRankings.slice(0, 3) : [];
  const listItems = showTopThree && !search ? filtered.slice(3) : filtered;

  return (
    <div className="w-full">
      {/* Search Bar */}
      <div className="mb-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:max-w-md">
          <Input
            type="text"
            placeholder="Search by country or code (e.g. India, US)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-11 bg-[#0D0D11]/90 border-white/[0.08] pl-10 text-sm focus:border-white/20 focus:ring-1 focus:ring-white/20 rounded-xl"
          />
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
            🔍
          </div>
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground"
            >
              Clear
            </button>
          )}
        </div>

        <div className="flex items-center gap-3 self-end sm:self-center">
          <span className="flex items-center gap-1.5 font-mono text-xs text-emerald-400">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            Live Rankings
          </span>
          <Link
            href="/countries"
            className="text-xs text-muted-foreground hover:text-foreground underline-offset-4 hover:underline"
          >
            All Countries →
          </Link>
        </div>
      </div>

      {/* Top 3 Podium (Only on clean view) */}
      {topThreeList.length > 0 && <TopThree topCountries={topThreeList} />}

      {/* Leaderboard Rows */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-white/[0.08] bg-[#0D0D11]/60 py-16 text-center backdrop-blur-md">
          <div className="text-3xl mb-2">🌍</div>
          <h3 className="text-base font-semibold text-foreground">No countries found</h3>
          <p className="text-xs text-muted-foreground mt-1">
            Try searching for another country name or ISO code.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {listItems.map((item) => (
            <CountryRankCard key={item.country.id} rankedCountry={item} />
          ))}
        </div>
      )}
    </div>
  );
};
