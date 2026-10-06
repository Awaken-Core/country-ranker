"use client";
import {useTranslations, useLocale} from "next-intl";

import React from "react";
import {countryName} from '@/i18n/country-name';
import {Link} from "@/i18n/navigation";
import { motion } from "motion/react";
import { ArrowRight } from "lucide-react";
import { CountryFlag } from "@/components/country-flag";
import { CountryDTO } from "@/modules/countries/country.types";
import { cn } from "@/lib/utils";

interface CountryCardProps {
  country: CountryDTO;
  className?: string;
}

export const CountryCard: React.FC<CountryCardProps> = ({ country, className }) => {
  const t = useTranslations('UI');
  const locale = useLocale();
  return (
    <Link href={`/country/${country.slug}`} className="block h-full">
      <motion.div
        whileHover={{ y: -2 }}
        transition={{ duration: 0.12, ease: "easeOut" }}
        className={cn(
          "group flex flex-col justify-between h-full p-4 rounded-xl border border-white/[0.08] bg-[#101010]/90 hover:bg-[#151515] hover:border-white/20 transition-colors shadow-sm will-change-transform",
          className
        )}
      >
        <div>
          <div className="flex items-center justify-between mb-3">
            <CountryFlag code={country.code} size="lg" className="rounded-[2px] shadow-sm" />
            <span className="font-mono text-[10px] text-zinc-400 uppercase tracking-wider bg-white/[0.04] px-1.5 py-0.5 rounded border border-white/[0.05]">
              {country.code}
            </span>
          </div>

          <h3 className="text-sm font-semibold text-zinc-100 group-hover:text-white transition-colors truncate">
            {countryName(locale, country.code, country.name)}
          </h3>
        </div>

        <div className="mt-4 pt-3 border-t border-white/[0.05] flex items-center justify-between text-xs font-mono">
          <div className="flex items-baseline gap-1">
            <span className="text-zinc-200 font-semibold tabular-nums">
              {country.totalUpvotes.toLocaleString(locale)}
            </span>
            <span className="text-[10px] text-zinc-500">{t('votes')}</span>
          </div>
          <div className="flex items-center gap-1 text-zinc-400 group-hover:text-white transition-colors text-[11px]">
            <span>{t('view')}</span>
            <ArrowRight className="size-3 transition-transform group-hover:translate-x-0.5" />
          </div>
        </div>
      </motion.div>
    </Link>
  );
};
