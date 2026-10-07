import React from "react";
import {Link} from "@/i18n/navigation";
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
        "group relative flex flex-col justify-between rounded-xl border border-white/[0.08] bg-[#0D0D11]/80 p-5 backdrop-blur-md transition-all duration-200 hover:-translate-y-1 hover:border-white/20 hover:bg-[#13131A] hover:shadow-xl hover:shadow-black/40",
        className
      )}
    >
      <div>
        <div className="flex items-center justify-between mb-4">
          <CountryFlag code={country.code} size="xl" className="shadow rounded" />
          <span className="rounded bg-white/[0.05] px-2 py-0.5 font-mono text-xs text-muted-foreground uppercase">
            {country.code}
          </span>
        </div>

        <h3 className="text-base font-semibold text-foreground group-hover:text-white transition-colors truncate">
          {country.name}
        </h3>
      </div>

      <div className="mt-5 pt-4 border-t border-white/[0.06] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div>
            <span className="block font-mono text-xs font-semibold text-foreground">
              {country.totalUpvotes.toLocaleString()}
            </span>
            <span className="text-[10px] uppercase text-muted-foreground tracking-wider">Upvotes</span>
          </div>
        </div>
        <span className="text-xs text-muted-foreground group-hover:text-foreground group-hover:translate-x-0.5 transition-all">
          View country →
        </span>
      </div>
    </Link>
  );
};
