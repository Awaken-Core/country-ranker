import React from "react";
import Link from "next/link";
import { CountryFlag } from "@/components/country-flag";
import { CountryDTO } from "@/modules/countries/country.types";
import { cn } from "@/lib/utils";

interface CountryCardProps {
  country: CountryDTO;
  className?: string;
}

export const CountryCard: React.FC<CountryCardProps> = ({ country, className }) => {
  return (
    <Link
      href={`/country/${country.slug}`}
      className={cn(
        "group flex flex-col justify-between p-4 rounded-xl border border-white/[0.06] bg-[#101010] hover:bg-[#141414] hover:border-white/15 transition-all duration-150",
        className
      )}
    >
      <div>
        <div className="flex items-center justify-between mb-3">
          <CountryFlag code={country.code} size="lg" className="rounded-[2px] shadow-sm" />
          <span className="font-mono text-[10px] text-zinc-500 uppercase">
            {country.code}
          </span>
        </div>

        <h3 className="text-sm font-semibold text-zinc-100 group-hover:text-white transition-colors truncate">
          {country.name}
        </h3>
      </div>

      <div className="mt-4 pt-3 border-t border-white/[0.04] flex items-center justify-between text-xs font-mono">
        <div>
          <span className="text-zinc-200 font-semibold">{country.totalUpvotes.toLocaleString()}</span>
          <span className="text-[10px] text-zinc-500 ml-1">votes</span>
        </div>
        <span className="text-zinc-500 group-hover:text-zinc-200 transition-colors">
          View →
        </span>
      </div>
    </Link>
  );
};
