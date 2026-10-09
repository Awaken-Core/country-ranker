"use client";
import {useTranslations, useLocale} from "next-intl";

import React, { useState } from "react";
import {countryName} from '@/i18n/country-name';
import {Link} from "@/i18n/navigation";
import { motion } from "motion/react";
import { Search, X, ArrowLeft } from "lucide-react";
import { CountryDTO } from "@/modules/countries/country.types";
import { CountryCard } from "./country-card";

interface CountryListClientProps {
  countries: CountryDTO[];
}

export const CountryListClient: React.FC<CountryListClientProps> = ({ countries }) => {
  const t = useTranslations('UI');
  const locale = useLocale();
  const [search, setSearch] = useState("");

  const filtered = countries.filter(
    (c) =>
      countryName(locale, c.code, c.name).toLowerCase().includes(search.toLowerCase().trim()) ||
      c.name.toLowerCase().includes(search.toLowerCase().trim()) ||
      c.code.toLowerCase().includes(search.toLowerCase().trim())
  );

  return (
    <div className="w-full flex-1 min-h-0 flex flex-col font-sans">
      {/* Directory Container with Internal Scroll */}
      <div className="flex-1 min-h-0 flex flex-col rounded-xl border border-white/[0.08] bg-[#0C0C0C] overflow-hidden shadow-2xl">
        {/* Search & Actions Toolbar */}
        <div className="shrink-0 px-3 py-2.5 sm:px-4 border-b border-white/[0.06] bg-[#0E0E0E] flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-3">
          <span className="text-xs font-mono text-zinc-400 self-start sm:self-center">
            {t('listed', {count: filtered.length})}
          </span>

          <div className="flex w-full sm:w-auto items-center gap-2 sm:gap-3">
            <div className="relative flex-1 sm:w-60 sm:flex-initial">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-zinc-500 pointer-events-none" />
              <input
                type="text"
                placeholder={t('search')}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full h-8 bg-[#080808] border border-white/[0.08] rounded-lg pl-8 pr-7 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400/20 transition-all"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 text-zinc-400 hover:text-white rounded transition-colors"
                  aria-label={t('clearSearch')}
                >
                  <X className="size-3.5" />
                </button>
              )}
            </div>

            <Link
              href="/"
              className="group shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-zinc-400 hover:text-white hover:bg-white/[0.05] transition-all"
            >
              <ArrowLeft className="size-3.5 text-zinc-500 group-hover:text-white transition-transform group-hover:-translate-x-0.5" />
              <span className="whitespace-nowrap">{t('back')}</span>
            </Link>
          </div>
        </div>

        {/* Scrollable Country Grid */}
        <div className="flex-1 overflow-y-auto p-3 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
          {filtered.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.15 }}
              className="col-span-full h-48 flex flex-col items-center justify-center text-center p-4"
            >
              <p className="text-zinc-400 text-xs font-mono">{t('noResults')}</p>
              <p className="text-zinc-600 text-[11px] mt-1">{t('searchHint')}</p>
            </motion.div>
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
