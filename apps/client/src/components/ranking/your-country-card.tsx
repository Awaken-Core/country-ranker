"use client";

import React, { useId, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import { ArrowUp, ArrowDown, Check, ChevronsUpDown, Globe } from "lucide-react";
import { RankedCountryDTO } from "@/modules/ranking/ranking.types";
import { countryName } from "@/i18n/country-name";
import { CountryFlag } from "@/components/country-flag";
import { LeaderboardVoteActions } from "@/components/voting/leaderboard-vote-actions";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

interface YourCountryCardProps {
  userCountryData: RankedCountryDTO | null;
  allCountries: RankedCountryDTO[];
  isLoading: boolean;
  isVisibleInList: boolean;
  countryPosition: "above" | "below" | "visible";
  onScrollToCountry: () => void;
  onSelectCountry: (countryCode: string) => void;
  onVoteSuccess: (countryName: string, voteType: "UPVOTE" | "DOWNVOTE") => void;
  onOpenPurchase: (countryId: string) => void;
  totalCountriesCount: number;
}

export const YourCountryCard: React.FC<YourCountryCardProps> = ({
  userCountryData,
  allCountries,
  isLoading,
  isVisibleInList,
  countryPosition,
  onScrollToCountry,
  onSelectCountry,
  onVoteSuccess,
  onOpenPurchase,
  totalCountriesCount,
}) => {
  const t = useTranslations("UI");
  const locale = useLocale();
  const reduceMotion = useReducedMotion();
  const [selectorOpen, setSelectorOpen] = useState(false);
  const headingId = useId();

  // If loading and no country detected yet, show subtle loading skeleton
  if (isLoading && !userCountryData) {
    return (
      <div className="shrink-0 border-t border-white/[0.06] bg-[#0A0A0A]/95 p-3 px-4 flex items-center justify-between animate-pulse">
        <div className="flex items-center gap-3">
          <div className="size-8 rounded bg-white/[0.05]" />
          <div className="space-y-1.5">
            <div className="h-2.5 w-16 bg-white/[0.08] rounded" />
            <div className="h-3 w-28 bg-white/[0.08] rounded" />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="size-8 rounded bg-white/[0.05]" />
          <div className="size-8 rounded bg-white/[0.05]" />
          <div className="h-8 w-12 rounded bg-white/[0.05]" />
        </div>
      </div>
    );
  }

  // If country detection failed and user hasn't selected one yet
  if (!userCountryData) {
    return (
      <>
        <div className="shrink-0 px-4 py-2 border-t border-white/[0.04] bg-[#0A0A0A] flex items-center justify-between text-[11px] font-mono text-zinc-500">
          <button
            type="button"
            onClick={() => setSelectorOpen(true)}
            className="inline-flex items-center gap-1.5 text-zinc-400 hover:text-white transition-colors cursor-pointer"
          >
            <Globe className="size-3 text-emerald-400" />
            <span className="text-zinc-300 font-sans font-medium">
              {t("selectYourCountry")}
            </span>
            <ChevronsUpDown className="size-3 text-zinc-500" />
          </button>
          <span>{t("showing", { count: totalCountriesCount })}</span>
        </div>

        <CountrySelectionModal
          open={selectorOpen}
          onOpenChange={setSelectorOpen}
          countries={allCountries}
          locale={locale}
          onSelect={onSelectCountry}
        />
      </>
    );
  }

  const { rank, country, score } = userCountryData;
  const localizedName = countryName(locale, country.code, country.name);
  const isAbove = countryPosition === "above";

  return (
    <>
      <AnimatePresence initial={false}>
        {!isVisibleInList && (
          <motion.div
            key={`your-country-${country.code}`}
            aria-labelledby={headingId}
            role="region"
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, height: 0, y: 12 }}
            animate={reduceMotion ? { opacity: 1 } : { opacity: 1, height: "auto", y: 0 }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, height: 0, y: 12 }}
            transition={{
              duration: reduceMotion ? 0.1 : 0.22,
              ease: [0.25, 1, 0.5, 1],
            }}
            className="shrink-0 border-t border-emerald-500/20 bg-[#0c120e] relative z-10 transition-colors overflow-hidden"
          >
            <div className="group mx-2 grid grid-cols-[32px_minmax(0,1fr)_28px_96px] sm:grid-cols-12 items-center px-2 py-1.5 sm:px-4 sm:py-2.5 rounded-lg border border-emerald-500/30 bg-emerald-950/15 text-xs">
              <div className="col-start-1 sm:col-span-1 flex size-7 sm:size-10 items-center justify-center font-mono text-base sm:text-xl font-medium tabular-nums text-zinc-400">
                {rank}
              </div>
              {/* Left: Clickable target that scrolls to real country row */}
              <div
                onClick={onScrollToCountry}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onScrollToCountry();
                  }
                }}
                aria-label={`${t("scrollToCountry", { country: localizedName })}, ${t("yourCountryRank", { rank })}`}
                className="col-start-2 sm:col-start-auto sm:col-span-7 flex items-center gap-1.5 sm:gap-2.5 min-w-0 pr-1 sm:pr-2 cursor-pointer select-none text-left"
              >
                <CountryFlag
                  code={country.code}
                  size="sm"
                  className="rounded-[3px] shadow-md shrink-0 ring-1 ring-white/10 group-hover:scale-105 transition-transform"
                />

                <div className="min-w-0 flex flex-col justify-center">
                  <div className="hidden sm:flex items-center gap-1.5 flex-wrap">
                    <span
                      id={headingId}
                      className="font-mono text-[9px] uppercase tracking-wider font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-1 py-0.2 rounded"
                    >
                      {t("yourCountry")}
                    </span>
                    <span className="font-mono text-[10px] text-zinc-400">
                      {t("yourCountryRank", { rank })}
                    </span>
                    <span className="text-zinc-600 hidden sm:inline">•</span>
                    <span className="font-mono text-[10px] text-zinc-400 hidden sm:inline">
                      {t("score")}:{" "}
                      <strong className="text-zinc-200">
                        {score.toLocaleString(locale)}
                      </strong>
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 sm:gap-2 mt-0.5 sm:mt-0">
                    <span className="font-semibold text-[11px] sm:text-base text-white group-hover:text-emerald-300 transition-colors truncate">
                      {localizedName}
                    </span>
                    <span className="hidden min-[360px]:inline font-mono text-[9px] sm:text-[11px] text-zinc-500 uppercase shrink-0">
                      {country.code}
                    </span>

                    {/* Navigation Direction Indicator (Non-voting navigation cue) */}
                    <AnimatePresence mode="wait" initial={false}>
                      <motion.span
                        key={isAbove ? "nav-above" : "nav-below"}
                        initial={reduceMotion ? false : { opacity: 0, scale: 0.85 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={reduceMotion ? undefined : { opacity: 0, scale: 0.85 }}
                        transition={{ duration: 0.18, ease: "easeOut" }}
                        className={cn(
                          "hidden sm:inline-flex items-center justify-center size-5 rounded border text-[11px] font-sans font-black transition-colors shrink-0",
                          isAbove
                            ? "border-emerald-500/40 bg-emerald-950/40 text-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.2)]"
                            : "border-white/[0.08] bg-zinc-900 text-zinc-400 group-hover:border-white/20 group-hover:text-zinc-300"
                        )}
                        title={isAbove ? "Country is above" : "Country is below"}
                        aria-label={isAbove ? "Country is above" : "Country is below"}
                      >
                        {isAbove ? (
                          <ArrowUp className="size-3 stroke-[2.5]" />
                        ) : (
                          <ArrowDown className="size-3 stroke-[2.5]" />
                        )}
                      </motion.span>
                    </AnimatePresence>
                  </div>
                </div>
              </div>

              <span className="col-start-3 sm:col-start-auto sm:col-span-1 text-right font-mono text-[10px] sm:text-xs font-semibold tabular-nums text-zinc-300">
                {score.toLocaleString(locale)}
              </span>

              {/* Right: Actions & Change Country */}
              <div className="col-start-4 sm:col-start-auto sm:col-span-3 flex items-center justify-end gap-1 sm:gap-3 shrink-0">
                {/* Mobile Score view */}
                <div className="hidden flex-col items-end font-mono text-[10px] text-zinc-400 pr-1">
                  <span>{t("score")}</span>
                  <span className="font-semibold text-zinc-200">
                    {score.toLocaleString(locale)}
                  </span>
                </div>

                {/* Voting Actions: reuses the exact same component & handlers */}
                <LeaderboardVoteActions
                  slug={country.slug}
                  countryName={localizedName}
                  onVoteSuccess={onVoteSuccess}
                  onOpenPurchase={() => onOpenPurchase(country.id)}
                />

                {/* Manual country switcher icon button */}
                <button
                  type="button"
                  onClick={() => setSelectorOpen(true)}
                  className="hidden sm:inline-flex text-zinc-500 hover:text-zinc-200 transition-colors p-1.5 rounded-lg hover:bg-white/[0.05] cursor-pointer"
                  title={t("changeCountry")}
                  aria-label={t("changeCountry")}
                >
                  <ChevronsUpDown className="size-3.5" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Country Selection Modal */}
      <CountrySelectionModal
        open={selectorOpen}
        onOpenChange={setSelectorOpen}
        countries={allCountries}
        locale={locale}
        currentCode={country.code}
        onSelect={onSelectCountry}
      />
    </>
  );
};

interface CountrySelectionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  countries: RankedCountryDTO[];
  locale: string;
  currentCode?: string;
  onSelect: (code: string) => void;
}

function CountrySelectionModal({
  open,
  onOpenChange,
  countries,
  locale,
  currentCode,
  onSelect,
}: CountrySelectionModalProps) {
  const t = useTranslations("UI");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-[#0C0C0C] border-white/[0.08] text-white p-0 overflow-hidden">
        <DialogHeader className="p-4 pb-2 border-b border-white/[0.06]">
          <DialogTitle className="text-base font-semibold text-white">
            {t("selectYourCountry")}
          </DialogTitle>
          <DialogDescription className="text-xs text-zinc-400">
            {t("searchHint")}
          </DialogDescription>
        </DialogHeader>

        <Command className="bg-transparent text-white">
          <CommandInput
            placeholder={t("search")}
            className="text-xs text-white border-none focus:ring-0"
          />
          <CommandList className="max-h-72 overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-800">
            <CommandEmpty className="py-6 text-center text-xs text-zinc-400 font-mono">
              {t("noResults")}
            </CommandEmpty>
            <CommandGroup>
              {countries.map((item) => {
                const name = countryName(
                  locale,
                  item.country.code,
                  item.country.name,
                );
                const isSelected = item.country.code === currentCode;
                return (
                  <CommandItem
                    key={item.country.id}
                    value={`${name} ${item.country.code} ${item.country.name}`}
                    onSelect={() => {
                      onSelect(item.country.code);
                      onOpenChange(false);
                    }}
                    className="flex items-center justify-between px-3 py-2 text-xs cursor-pointer hover:bg-white/[0.06] rounded-md transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <CountryFlag
                        code={item.country.code}
                        size="sm"
                        className="rounded-[2px] shrink-0"
                      />
                      <span className="font-medium text-zinc-200 truncate">
                        {name}
                      </span>
                      <span className="font-mono text-[10px] text-zinc-500 uppercase">
                        {item.country.code}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 font-mono text-[11px] text-zinc-400">
                      <span>#{item.rank}</span>
                      {isSelected && (
                        <Check className="size-3.5 text-emerald-400" />
                      )}
                    </div>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  );
}
