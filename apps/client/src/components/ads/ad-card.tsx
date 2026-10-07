"use client";
import {useTranslations} from "next-intl";

import Image from "next/image";
import { Megaphone } from "lucide-react";
import { motion } from "motion/react";
import { uploadthingsURI } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { AdItem, isAvailableAd } from "./ad-data";

interface AdCardProps {
  ad: AdItem;
  className?: string;
  onReserve?: () => void;
}

function getLogoUrl(logo: string) {
  return logo.startsWith("http") ? logo : `${uploadthingsURI}/f/${logo}`;
}

export function AdCard({ ad, className, onReserve }: AdCardProps) {
  const t=useTranslations('UI');
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
            {t('adAvailability', {count: ad.available})}
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
      href={ad.website}
      target="_blank"
      rel="noopener noreferrer sponsored"
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.12, ease: "easeOut" }}
      className={cn(
        "group flex min-h-0 flex-1 cursor-pointer flex-col items-center justify-between rounded-xl border border-white/[0.1] px-4 py-4 text-center transition-colors hover:border-white/25",
        className,
      )}
      style={{
        backgroundColor: ad.bgColor ?? "#101010",
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
      <span className="mt-1 font-mono text-[8px] text-zinc-500 transition-colors group-hover:text-zinc-300">
        {t('promoted')} ↗
      </span>
    </motion.a>
  );
}
