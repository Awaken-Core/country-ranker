import React from "react";
import {Link} from "@/i18n/navigation";
import { CountryFlag } from "@/components/country-flag";
import { RankedCountryDTO } from "@/modules/ranking/ranking.types";
import { cn } from "@/lib/utils";

interface TopThreeProps {
  topCountries: RankedCountryDTO[];
}

export const TopThree: React.FC<TopThreeProps> = ({ topCountries }) => {
  if (!topCountries || topCountries.length === 0) return null;

  const first = topCountries[0];
  const second = topCountries[1];
  const third = topCountries[2];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6 mb-8 items-end">
      {/* 2nd Place */}
      {second && (
        <div className="order-2 md:order-1">
          <Link
            href={`/country/${second.country.slug}`}
            className="group relative block rounded-2xl border border-slate-400/20 bg-gradient-to-b from-slate-400/[0.08] to-[#0D0D11]/90 p-5 sm:p-6 backdrop-blur-md transition-all duration-200 hover:-translate-y-1 hover:border-slate-300/40 hover:shadow-xl hover:shadow-slate-500/5 text-center"
          >
            <div className="inline-flex h-8 px-3 items-center justify-center rounded-full bg-slate-300/20 text-slate-200 font-mono text-xs font-semibold mb-4 ring-1 ring-slate-300/30">
              🥈 #2 Silver
            </div>
            <div className="my-3 flex justify-center">
              <CountryFlag code={second.country.code} size="xl" className="shadow-lg rounded" />
            </div>
            <h3 className="text-lg font-semibold text-foreground group-hover:text-white transition-colors truncate">
              {second.country.name}
            </h3>
            <p className="font-mono text-sm text-muted-foreground mt-0.5 uppercase tracking-wider">
              {second.country.code}
            </p>
            <div className="mt-4 pt-4 border-t border-white/[0.06] flex justify-around">
              <div>
                <span className="block font-mono text-base font-bold text-foreground">
                  {second.upvotes.toLocaleString()}
                </span>
                <span className="text-[10px] uppercase text-muted-foreground tracking-wider">Upvotes</span>
              </div>
              {second.downvotes > 0 && (
                <div>
                  <span className="block font-mono text-base font-semibold text-muted-foreground">
                    {second.downvotes.toLocaleString()}
                  </span>
                  <span className="text-[10px] uppercase text-muted-foreground/60 tracking-wider">Downvotes</span>
                </div>
              )}
            </div>
          </Link>
        </div>
      )}

      {/* 1st Place (Gold Hero) */}
      {first && (
        <div className="order-1 md:order-2 md:-translate-y-2">
          <Link
            href={`/country/${first.country.slug}`}
            className="group relative block rounded-2xl border border-amber-500/40 bg-gradient-to-b from-amber-500/[0.15] via-[#14120B]/90 to-[#0D0D11]/90 p-6 sm:p-8 backdrop-blur-md transition-all duration-200 hover:-translate-y-1 hover:border-amber-400/60 shadow-[0_0_30px_rgba(245,158,11,0.12)] text-center"
          >
            <div className="inline-flex h-9 px-4 items-center justify-center rounded-full bg-amber-500/25 text-amber-300 font-mono text-xs font-bold mb-4 ring-1 ring-amber-400/50 shadow-[0_0_15px_rgba(245,158,11,0.3)]">
              👑 #1 Global Leader
            </div>
            <div className="my-4 flex justify-center">
              <CountryFlag code={first.country.code} size="xl" className="shadow-2xl scale-125 my-2 rounded" />
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-foreground group-hover:text-amber-200 transition-colors truncate">
              {first.country.name}
            </h3>
            <p className="font-mono text-sm text-amber-400/80 mt-0.5 uppercase tracking-wider font-semibold">
              {first.country.code}
            </p>
            <div className="mt-5 pt-4 border-t border-amber-500/20 flex justify-around">
              <div>
                <span className="block font-mono text-lg font-extrabold text-amber-300">
                  {first.upvotes.toLocaleString()}
                </span>
                <span className="text-[10px] uppercase text-amber-400/70 tracking-wider font-medium">Upvotes</span>
              </div>
              {first.downvotes > 0 && (
                <div>
                  <span className="block font-mono text-base font-semibold text-muted-foreground">
                    {first.downvotes.toLocaleString()}
                  </span>
                  <span className="text-[10px] uppercase text-muted-foreground/60 tracking-wider">Downvotes</span>
                </div>
              )}
            </div>
          </Link>
        </div>
      )}

      {/* 3rd Place */}
      {third && (
        <div className="order-3">
          <Link
            href={`/country/${third.country.slug}`}
            className="group relative block rounded-2xl border border-amber-800/20 bg-gradient-to-b from-amber-800/[0.08] to-[#0D0D11]/90 p-5 sm:p-6 backdrop-blur-md transition-all duration-200 hover:-translate-y-1 hover:border-amber-700/40 hover:shadow-xl text-center"
          >
            <div className="inline-flex h-8 px-3 items-center justify-center rounded-full bg-amber-800/20 text-amber-400 font-mono text-xs font-semibold mb-4 ring-1 ring-amber-700/30">
              🥉 #3 Bronze
            </div>
            <div className="my-3 flex justify-center">
              <CountryFlag code={third.country.code} size="xl" className="shadow-lg rounded" />
            </div>
            <h3 className="text-lg font-semibold text-foreground group-hover:text-white transition-colors truncate">
              {third.country.name}
            </h3>
            <p className="font-mono text-sm text-muted-foreground mt-0.5 uppercase tracking-wider">
              {third.country.code}
            </p>
            <div className="mt-4 pt-4 border-t border-white/[0.06] flex justify-around">
              <div>
                <span className="block font-mono text-base font-bold text-foreground">
                  {third.upvotes.toLocaleString()}
                </span>
                <span className="text-[10px] uppercase text-muted-foreground tracking-wider">Upvotes</span>
              </div>
              {third.downvotes > 0 && (
                <div>
                  <span className="block font-mono text-base font-semibold text-muted-foreground">
                    {third.downvotes.toLocaleString()}
                  </span>
                  <span className="text-[10px] uppercase text-muted-foreground/60 tracking-wider">Downvotes</span>
                </div>
              )}
            </div>
          </Link>
        </div>
      )}
    </div>
  );
};
