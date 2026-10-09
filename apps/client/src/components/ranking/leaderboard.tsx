"use client";
import { useTranslations, useLocale } from "next-intl";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { countryName } from '@/i18n/country-name';
import { Link } from "@/i18n/navigation";
import { motion } from "motion/react";
import { Search, X, ArrowRight } from "lucide-react";
import { RankedCountryDTO } from "@/modules/ranking/ranking.types";
import { CountryRankingRow } from "./country-ranking-row";
import { YourCountryCard } from "./your-country-card";
import { cn } from "@/lib/utils";
import { Confetti, type ConfettiRef } from "@/components/ui/confetti";
import { toast } from "sonner";
import VotePurchaseModal from "@/components/purchase/vote-purchase-modal";
import { useAnalytics } from "@/stores/analytics-store";

interface LeaderboardProps {
  initialRankings: RankedCountryDTO[];
}

const LOCAL_STORAGE_USER_COUNTRY = "country_rank_user_country_code";

export const Leaderboard: React.FC<LeaderboardProps> = ({
  initialRankings,
}) => {
  const t = useTranslations('UI');
  const locale = useLocale();
  const confettiRef = useRef<ConfettiRef>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const userCountryRowRef = useRef<HTMLDivElement>(null);

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "top20" | "top50">("all");
  const [purchaseOpen, setPurchaseOpen] = useState(false);
  const [purchaseCountryId, setPurchaseCountryId] = useState<string | null>(null);

  // Country detection state
  const [userCountryCode, setUserCountryCode] = useState<string | null>(null);
  const [isDetectingCountry, setIsDetectingCountry] = useState(true);
  const [isUserCountryVisible, setIsUserCountryVisible] = useState(false);
  const [countryPosition, setCountryPosition] = useState<"above" | "below" | "visible">("below");
  const [highlightUserCountry, setHighlightUserCountry] = useState(false);
  const highlightTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const purchasableCountries = useMemo(
    () => initialRankings.map(({ country }) => country),
    [initialRankings],
  );
  const { analytics, getAnalytics } = useAnalytics();

  // Load initial country: check localStorage preference first, then call /api/v1/countries/detect
  useEffect(() => {
    let isMounted = true;

    async function detectUserCountry() {
      try {
        const savedCode = typeof window !== "undefined"
          ? localStorage.getItem(LOCAL_STORAGE_USER_COUNTRY)
          : null;

        if (savedCode) {
          if (isMounted) {
            setUserCountryCode(savedCode.toUpperCase());
            setIsDetectingCountry(false);
          }
          return;
        }

        const res = await fetch("/api/v1/countries/detect");
        let detected: string | null = null;
        if (res.ok) {
          const data = (await res.json()) as { countryCode?: string | null };
          if (data.countryCode) {
            detected = data.countryCode.toUpperCase();
          }
        }

        // Fallback for local development or if proxy stripped geo headers:
        if (!detected) {
          try {
            const clientGeoRes = await fetch("https://ipapi.co/json/", { cache: "no-store" });
            if (clientGeoRes.ok) {
              const clientGeoData = (await clientGeoRes.json()) as { country_code?: string };
              if (clientGeoData.country_code) {
                detected = clientGeoData.country_code.toUpperCase();
              }
            }
          } catch {
            // Ignore if client-side fetch is blocked by ad-blocker
          }
        }

        // Secondary fallback: browser Intl region tag (e.g. "en-US" -> "US", "ja-JP" -> "JP")
        if (!detected && typeof navigator !== "undefined" && navigator.language) {
          const parts = navigator.language.split("-");
          if (parts.length > 1 && parts[1]?.length === 2) {
            detected = parts[1].toUpperCase();
          }
        }

        if (isMounted && detected) {
          setUserCountryCode(detected);
        }
      } catch (err) {
        console.warn("Country detection failed:", err);
      } finally {
        if (isMounted) {
          setIsDetectingCountry(false);
        }
      }
    }

    void detectUserCountry();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleSelectCountry = useCallback((code: string) => {
    const upper = code.toUpperCase();
    setUserCountryCode(upper);
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(LOCAL_STORAGE_USER_COUNTRY, upper);
      } catch {
        // Ignore localStorage quota errors
      }
    }
  }, []);

  const handleVoteSuccess = useCallback(
    (countryName: string, voteType: "UPVOTE" | "DOWNVOTE") => {
      void confettiRef.current?.fire({
        particleCount: 80,
        spread: 65,
        startVelocity: 35,
        origin: { x: 0.5, y: 0.65 },
        colors:
          voteType === "UPVOTE"
            ? ["#00df81", "#33ffaa", "#ffffff"]
            : ["#ff4d4d", "#ff8080", "#ffffff"],
      });
      toast.success(
        t(voteType === 'UPVOTE' ? 'upvoteSuccess' : 'downvoteSuccess', { country: countryName }),
      );
    },
    [t],
  );

  const filtered = useMemo(() => {
    return initialRankings.filter(
      (item) =>
        countryName(locale, item.country.code, item.country.name).toLowerCase().includes(search.toLowerCase().trim()) ||
        item.country.name.toLowerCase().includes(search.toLowerCase().trim()) ||
        item.country.code.toLowerCase().includes(search.toLowerCase().trim()),
    );
  }, [initialRankings, locale, search]);

  const displayedList = useMemo(() => {
    return filter === "top20"
      ? filtered.slice(0, 20)
      : filter === "top50"
        ? filtered.slice(0, 50)
        : filtered;
  }, [filtered, filter]);

  // Derive user's country data dynamically from ranking list
  const userCountryData = useMemo(() => {
    if (!userCountryCode) return null;
    return initialRankings.find(
      (item) => item.country.code.toUpperCase() === userCountryCode.toUpperCase(),
    ) || null;
  }, [initialRankings, userCountryCode]);

  // IntersectionObserver to detect when the actual user country row enters/leaves the scroll viewport
  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    if (!scrollContainer || !userCountryData) {
      setIsUserCountryVisible(false);
      return;
    }

    // Find the row element either via the ref or by the data attribute
    const targetCode = userCountryData.country.code.toUpperCase();
    const targetRow =
      userCountryRowRef.current ??
      (scrollContainer.querySelector(`[data-country-code="${targetCode}"]`) as HTMLElement | null);

    if (!targetRow) {
      setIsUserCountryVisible(false);
      return;
    }

    // Initial check: determine if visible, above, or below inside scroll container
    const updatePosition = () => {
      const containerRect = scrollContainer.getBoundingClientRect();
      const rowRect = targetRow.getBoundingClientRect();

      const isIntersecting =
        rowRect.top < containerRect.bottom && rowRect.bottom > containerRect.top;

      setIsUserCountryVisible(isIntersecting);

      if (isIntersecting) {
        setCountryPosition("visible");
      } else if (rowRect.bottom <= containerRect.top) {
        setCountryPosition("above");
      } else {
        setCountryPosition("below");
      }
    };

    updatePosition();

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry) {
          setIsUserCountryVisible(entry.isIntersecting);
          if (entry.isIntersecting) {
            setCountryPosition("visible");
          } else {
            // Check bounding rect relative to root container
            const containerRect = scrollContainer.getBoundingClientRect();
            const rowRect = targetRow.getBoundingClientRect();
            if (rowRect.bottom <= containerRect.top) {
              setCountryPosition("above");
            } else {
              setCountryPosition("below");
            }
          }
        }
      },
      {
        root: scrollContainer,
        threshold: 0.1, // Trigger as soon as 10% of the row enters or leaves the scroll area
      },
    );

    observer.observe(targetRow);

    return () => {
      observer.disconnect();
    };
  }, [userCountryData, displayedList, userCountryCode]);

  // Smooth scroll to user country row
  const handleScrollToCountry = useCallback(() => {
    const scrollContainer = scrollContainerRef.current;
    if (!scrollContainer || !userCountryData) return;

    const targetCode = userCountryData.country.code.toUpperCase();

    // Helper to perform the scroll and highlight on an element
    const performScroll = (el: HTMLElement) => {
      // Calculate position inside container for guaranteed reliable scrolling
      const containerRect = scrollContainer.getBoundingClientRect();
      const elRect = el.getBoundingClientRect();
      const relativeTop = elRect.top - containerRect.top + scrollContainer.scrollTop;
      const targetScrollTop = relativeTop - (scrollContainer.clientHeight / 2) + (el.clientHeight / 2);

      scrollContainer.scrollTo({
        top: Math.max(0, targetScrollTop),
        behavior: "smooth",
      });

      setHighlightUserCountry(true);
      if (highlightTimeoutRef.current) clearTimeout(highlightTimeoutRef.current);
      highlightTimeoutRef.current = setTimeout(() => {
        setHighlightUserCountry(false);
      }, 2500);
    };

    // 1. Try finding row immediately
    const targetRow =
      userCountryRowRef.current ??
      (scrollContainer.querySelector(`[data-country-code="${targetCode}"]`) as HTMLElement | null);

    // 2. If row exists in current view, scroll immediately
    if (targetRow) {
      performScroll(targetRow);
      return;
    }

    // 3. If not found in current view (e.g., active filter is "top20" or user has search input), reset filter
    if (filter !== "all" || search.trim() !== "") {
      setFilter("all");
      setSearch("");
      // Wait for React to render the full list
      setTimeout(() => {
        const freshContainer = scrollContainerRef.current;
        if (!freshContainer) return;
        const freshRow =
          userCountryRowRef.current ??
          (freshContainer.querySelector(`[data-country-code="${targetCode}"]`) as HTMLElement | null);
        if (freshRow) {
          performScroll(freshRow);
        }
      }, 100);
    }
  }, [userCountryData, filter, search]);

  function openPurchaseModal(countryId: string) {
    setPurchaseCountryId(countryId);
    setPurchaseOpen(true);
  }

  useEffect(() => {
    getAnalytics();
  }, [getAnalytics]);

  useEffect(() => {
    return () => {
      if (highlightTimeoutRef.current) clearTimeout(highlightTimeoutRef.current);
    };
  }, []);

  return (
    <div className="w-full flex-1 min-h-0 flex flex-col font-sans">
      <Confetti
        ref={confettiRef}
        manualstart
        className="pointer-events-none fixed inset-0 z-[9999] size-full"
      />
      {purchaseOpen && (
        <VotePurchaseModal
          open
          onOpenChange={setPurchaseOpen}
          countries={purchasableCountries}
          initialCountryId={purchaseCountryId}
        />
      )}

      {/* 1. Compact Editorial Header */}
      <div className="mb-2 shrink-0 rounded-xl border border-white/[0.06] bg-white/[0.025] px-3 py-2.5 sm:mb-2 sm:rounded-none sm:border-0 sm:bg-transparent sm:px-1 sm:py-0 md:block hidden ">
        <div className="mb-1 flex items-center justify-between sm:mb-0.5">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <div className="font-mono text-[9px] uppercase tracking-[0.14em] text-zinc-400 flex items-center justify-center gap-1.5 sm:text-[10px] sm:gap-2">
              <p>{t('realtime')}</p>
              {analytics.pageviews !== 0 && (
                <><p className="text-center">•</p><p>{analytics.visitors} Views</p></>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1">
          <h1 className="text-xl sm:text-2xl font-semibold tracking-[-0.025em] text-white">
            {t('leaderboard')}
          </h1>
          <Link
            href="/countries"
            className="group md:inline-flex hidden w-fit items-center gap-1 text-[11px] text-zinc-400 hover:text-white transition-colors sm:text-xs"
          >
            <span>{t('directoryLink')}</span>
            <ArrowRight className="size-3 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </div>

      {/* 2. Self-Contained Leaderboard Panel with Dedicated Internal Scroll */}
      <div className="flex-1 min-h-0 flex flex-col rounded-xl border border-white/[0.08] bg-[#0C0C0C] overflow-hidden shadow-2xl">
        {/* Panel Toolbar (Sticky top inside container) */}
        <div className="shrink-0 px-2.5 py-2.5 sm:px-4 border-b border-white/[0.06] bg-[#0E0E0E] flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-3">
          {/* Filter Pills */}
          <div className="grid w-full grid-cols-3 items-center gap-1 sm:flex sm:w-auto sm:gap-2 self-start sm:self-center">
            <button
              type="button"
              onClick={() => setFilter("all")}
              className={cn(
                "whitespace-nowrap px-2 py-1.5 sm:px-3.5 rounded-lg text-[11px] sm:text-xs font-semibold transition-all cursor-pointer",
                filter === "all"
                  ? "bg-[#1c1c1c] text-white border border-white/[0.1] shadow-sm"
                  : "text-zinc-400 hover:text-white",
              )}
            >
              {t('allRanked', { count: initialRankings.length })}
            </button>
            <button
              type="button"
              onClick={() => setFilter("top20")}
              className={cn(
                "whitespace-nowrap px-2 py-1.5 sm:px-3 rounded-lg text-[11px] sm:text-xs font-medium transition-all cursor-pointer",
                filter === "top20"
                  ? "bg-[#1c1c1c] text-white border border-white/[0.1] shadow-sm"
                  : "text-zinc-400 hover:text-white",
              )}
            >
              {t('top', { count: 20 })}
            </button>
            <button
              type="button"
              onClick={() => setFilter("top50")}
              className={cn(
                "whitespace-nowrap px-2 py-1.5 sm:px-3 rounded-lg text-[11px] sm:text-xs font-medium transition-all cursor-pointer",
                filter === "top50"
                  ? "bg-[#1c1c1c] text-white border border-white/[0.1] shadow-sm"
                  : "text-zinc-400 hover:text-white",
              )}
            >
              {t('top', { count: 50 })}
            </button>
          </div>

          {/* Search Input */}
          <div className="relative w-full sm:w-64">
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
        </div>

        {/* Table Column Headers */}
        <div className="shrink-0 grid grid-cols-[42px_minmax(0,1fr)_112px] sm:grid-cols-12 mx-1 px-2 sm:mx-0 sm:px-4 py-2 border-b border-white/[0.04] bg-[#0A0A0A] font-mono text-[9px] sm:text-[10px] uppercase tracking-wider text-zinc-500">
          <div className="sm:col-span-1 truncate" title={t('rank')}>{t('rank')}</div>
          <div className="sm:col-span-7 truncate">{t('country')}</div>
          <div className="hidden sm:block sm:col-span-1 text-end truncate" title={t('score')}>{t('score')}</div>
          <div className="sm:col-span-3 text-end sm:pr-14 truncate">{t('actions')}</div>
        </div>

        {/* 3. The Dedicated Scrolling Body */}
        <div
          ref={scrollContainerRef}
          className="flex-1 overflow-y-auto p-1.5 sm:p-2 flex flex-col gap-1.5 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent"
        >
          {displayedList.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.15 }}
              className="h-48 flex flex-col items-center justify-center text-center p-4"
            >
              <p className="text-zinc-400 text-xs font-mono">
                {t('noResults')}
              </p>
              <p className="text-zinc-600 text-[11px] mt-1">
                {t('searchHint')}
              </p>
            </motion.div>
          ) : (
            displayedList.map((item) => {
              const isUserCountry = item.country.code.toUpperCase() === userCountryCode?.toUpperCase();
              return (
                <CountryRankingRow
                  key={item.country.id}
                  ref={isUserCountry ? userCountryRowRef : undefined}
                  rankedCountry={item}
                  isUserCountry={isUserCountry}
                  isHighlighted={isUserCountry && highlightUserCountry}
                  onVoteSuccess={handleVoteSuccess}
                  onOpenPurchase={openPurchaseModal}
                />
              );
            })
          )}
        </div>

        {/* 4. Prominent Personalized "Your Country" Section near bottom */}
        <YourCountryCard
          userCountryData={userCountryData}
          allCountries={initialRankings}
          isLoading={isDetectingCountry}
          isVisibleInList={isUserCountryVisible}
          countryPosition={countryPosition}
          onScrollToCountry={handleScrollToCountry}
          onSelectCountry={handleSelectCountry}
          onVoteSuccess={handleVoteSuccess}
          onOpenPurchase={openPurchaseModal}
          totalCountriesCount={displayedList.length}
        />

        {/* 5. Panel Footer / Status bar (Always displays sovereign states count & verified ledger) */}
        <div className="shrink-0 px-3 sm:px-4 py-2 border-t border-white/[0.04] bg-[#0A0A0A] flex items-center justify-between gap-3 text-[9px] sm:text-[11px] font-mono text-zinc-500">
          <span>{t('showing', { count: displayedList.length })}</span>
          <span>{t('verifiedLedger')}</span>
        </div>
      </div>
    </div>
  );
};
