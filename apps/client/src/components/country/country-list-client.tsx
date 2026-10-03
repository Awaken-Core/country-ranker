"use client";

import React, { useState } from "react";
import { CountryDTO } from "@/modules/countries/country.types";
import { CountryCard } from "./country-card";
import Link from "next/link";

interface CountryListClientProps {
  countries: CountryDTO[];
}

export const CountryListClient: React.FC<CountryListClientProps> = ({ countries }) => {
  const [search, setSearch] = useState("");

  const filtered = countries.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase().trim()) ||
      c.code.toLowerCase().includes(search.toLowerCase().trim())
  );

  return (
    <div className="w-full flex-1 min-h-0 flex flex-col">
      {/* Top Header */}
      <div className="shrink-0 mb-3 flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
            Country Directory
          </h1>
          <p className="text-xs text-zinc-400">
            Browse all sovereign states on CountryRank.
          </p>
        </div>

        <Link
          href="/"
          className="text-xs text-zinc-400 hover:text-white transition-colors"
        >
          ← Back to Leaderboard
        </Link>
      </div>

      {/* Directory Container with Internal Scroll */}
      <div className="flex-1 min-h-0 flex flex-col rounded-xl border border-white/[0.08] bg-[#0C0C0C] overflow-hidden shadow-2xl">
        {/* Search Toolbar */}
        <div className="shrink-0 px-4 py-3 border-b border-white/[0.06] bg-[#0E0E0E] flex items-center justify-between gap-3">
          <span className="text-xs font-mono text-zinc-400">
            {filtered.length} Countries Listed
          </span>

          <div className="relative w-64">
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

        {/* Scrollable Country Grid */}
        <div className="flex-1 overflow-y-auto p-3 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
          {filtered.length === 0 ? (
            <div className="col-span-full h-48 flex items-center justify-center text-center">
              <p className="text-zinc-400 text-xs font-mono">No matching country found.</p>
            </div>
          ) : (
            filtered.map((country) => (
              <CountryCard key={country.id} country={country} />
            ))
          )}
        </div>
      </div>
    </div>
  );
};
