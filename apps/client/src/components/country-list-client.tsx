"use client";

import React, { useState } from "react";
import { CountryDTO } from "@/modules/countries/country.types";
import { CountryCard } from "@/components/country-card";
import { Input } from "@/components/ui/input";

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
    <div>
      <div className="mb-8 max-w-md">
        <div className="relative">
          <Input
            type="text"
            placeholder="Search countries by name or ISO code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-11 bg-[#0D0D11]/90 border-white/[0.08] pl-10 text-sm focus:border-white/20 rounded-xl"
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
        <p className="text-xs text-muted-foreground mt-2 font-mono">
          Showing {filtered.length} of {countries.length} countries
        </p>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-white/[0.08] bg-[#0D0D11]/60 py-16 text-center backdrop-blur-md">
          <div className="text-3xl mb-2">🌍</div>
          <h3 className="text-base font-semibold text-foreground">No countries found</h3>
          <p className="text-xs text-muted-foreground mt-1">
            Try a different search query.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filtered.map((country) => (
            <CountryCard key={country.id} country={country} />
          ))}
        </div>
      )}
    </div>
  );
};
