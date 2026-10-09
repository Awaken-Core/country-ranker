"use client";
import { useTranslations } from "next-intl";

import Image from "next/image";
import { Megaphone } from "lucide-react";
import { motion } from "motion/react";
import { uploadthingsURI } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { AdItem, isAvailableAd } from "./ad-data";
import { env } from "@/lib/env";

interface AdCardProps {
  ad: AdItem;
  className?: string;
  onReserve?: () => void;
  compact?: boolean;
}

function getLogoUrl(logo: string) {
  return logo.startsWith("http") ? logo : `${uploadthingsURI}/f/${logo}`;
}

export function AdCard({ ad, className, onReserve, compact = false }: AdCardProps) {
  const t = useTranslations('UI');
  const domainUrl = new URL(env?.NEXT_PUBLIC_APP_BASE_URL);
  const domain = domainUrl.hostname.split(".")[0];

  if (compact) {
    if (isAvailableAd(ad)) {
      return (
        <button
          type="button"
          onClick={onReserve}
          className={cn(
            "flex h-14 w-48 shrink-0 items-center gap-3 rounded-xl border border-dashed border-white/15 bg-[#101010] px-3 text-left",
            className,
          )}
        >
          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-zinc-800 text-zinc-300">
            <Megaphone className="size-4" aria-hidden="true" />
          </span>
          <span className="min-w-0 flex flex-col items-start">
            <span className="block text-xs font-semibold text-white">{t('advertise')}</span>
            <span className="shrink-0 font-mono text-[9px] text-amber-400">{t('reserve')} →</span>
          </span>
        </button>
      );
    }

    return (
      <a
        href={`${ad.website}/?utm_source=${domain}&utm_medium=referral&utm_campaign=sponsor_card`}
        target="_blank"
        rel="noopener noreferrer sponsored"
        className={cn(
          "flex h-14 w-48 shrink-0 items-center gap-3 rounded-xl border border-white/10 px-3 text-left",
          className,
        )}
        style={{
          backgroundColor: ad.bgColor ?? "#101010",
          color: ad.textColor ?? "#f8fafc",
        }}
      >
        <span className="relative size-10 shrink-0 overflow-hidden rounded-lg bg-zinc-800">
          <Image src={getLogoUrl(ad.logo)} alt="" fill unoptimized sizes="40px" className="object-cover" />
        </span>
        <span className="min-w-0">
          <span className="block truncate text-[14px] font-medium">{ad.name}</span>
          {/* {ad.description && (
            <span className="mt-1 block truncate font-mono text-[9px] opacity-65">{ad.description}</span>
          )} */}
        </span>
      </a>
    );
  }

  if (isAvailableAd(ad)) {
    return (
      <motion.button
        type="button"
        whileHover={{ scale: 1.02 }}
        transition={{ duration: 0.12, ease: "easeOut" }}
        onClick={onReserve}
        className={cn(
          "group flex min-h-0 w-full flex-1 cursor-pointer flex-col items-center justify-between rounded-xl border border-dashed border-white/10 bg-[#101010] px-4 py-4 text-center transition-colors hover:border-white/30",
          className,
        )}
      >
        <div className="flex w-full flex-col items-center">
          <div className="mb-1.5 flex size-6 items-center justify-center rounded-md bg-zinc-800 text-zinc-300 shadow transition-transform group-hover:scale-105">
            <Megaphone className="size-3" aria-hidden="true" />
          </div>
          <div className="text-[11px] leading-none font-semibold tracking-tight text-white/95">
            {t('advertise')}
          </div>
          <p className="mt-1 line-clamp-2 font-mono text-[9px] leading-tight text-zinc-400">
            {t('adAvailability', { count: ad.available })}
          </p>
        </div>
        <span className="mt-1 font-mono text-[8px] tracking-widest text-amber-400/90 uppercase group-hover:text-amber-300">
          {t('reserve')} →
        </span>
      </motion.button>
    );
  }

  return (
    <motion.a
      href={`${ad.website}/?utm_source=${domain}&utm_medium=referral&utm_campaign=sponsor_card`}
      target="_blank"
      rel="noopener noreferrer sponsored"
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.12, ease: "easeOut" }}
      className={cn(
        "group flex min-h-0 flex-1 cursor-pointer flex-col items-center justify-between rounded-xl border-2 px-4 py-4 text-center transition-colors hover:border-white/25",
        className,
      )}
      style={{
        backgroundColor: ad.bgColor ?? "#101010",
        borderRadius: ad.bgColor ?? "#101010",
        color: ad.textColor ?? "#f8fafc",
      }}
    >
      <div className="flex w-full flex-col items-center">
        <div className="relative mb-3 size-8 overflow-hidden rounded-lg bg-zinc-800 shadow transition-transform group-hover:scale-105 mt-2">
          <Image
            src={getLogoUrl(ad.logo)}
            alt=""
            fill
            unoptimized
            sizes="32px"
            className="object-cover"
          />
        </div>
        <div className="text-sm leading-none font-semibold tracking-tight group-hover:text-white">
          {ad.name}
        </div>
        {ad.description && (
          <p className="mt-2 line-clamp-2 font-mono text-[11px] leading-relaxed text-zinc-400">
            {ad.description}
          </p>
        )}
      </div>
    </motion.a>
  );
}
