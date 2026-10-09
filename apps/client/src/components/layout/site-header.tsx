"use client";

import React from "react";
import { Link } from "@/i18n/navigation";
import { BellDot, FileText, Flag, Megaphone, Menu } from "lucide-react";
import { useTranslations } from "next-intl";
import { HeaderAuth } from "@/components/header-auth";
import { LanguageSwitcher } from "./language-switcher";
import { Button } from "../ui/button";
import Image from "next/image";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

export const SiteHeader: React.FC = () => {
  const t = useTranslations("UI");
  return (
    <header dir="ltr" className="h-14 shrink-0 z-40 border-b border-white/[0.06] font-sans sm:h-12 sm:border-0 sm:shadow-[0_16px_60px_rgba(0,0,0,0.35)]">
      <div className="h-full flex items-center justify-between px-1 sm:px-0">
        {/* Left: Wordmark with Globe icon */}
        <div className="flex min-w-0 items-center gap-1 group">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="size-7 sm:size-6 rounded-md flex items-center justify-center transition-all">
              <Image src="/image/logo.png" alt="logo" height={10} width={10} className="size-full" unoptimized />
            </div>
            <span className="text-[15px] min-[390px]:text-[17px] sm:text-[16px] font-semibold sm:font-medium tracking-[-0.25px] text-white group-hover:text-zinc-200 transition-colors">
              RankMyCountry
            </span>
          </Link>

          <div className="hidden lg:flex items-center gap-4 group px-6">
            <Link
              href="/countries"
              className="text-xs text-zinc-400 hover:text-white/80 transition-colors font-normal rounded-md hover:underline"
            >
              {t("allCountries")}
            </Link>
             <Link
              href="/sponsor"
              className="text-xs text-zinc-400 hover:text-white/80 transition-colors font-normal rounded-md hover:underline"
            >
              {t("advertise")}
            </Link>
            <Link
              href="/terms-and-conditions"
              className="text-xs text-zinc-400 hover:text-white/80 transition-colors font-normal rounded-md hover:underline"
            >
              {t("termsAndHowItWorks")}
            </Link>
          </div>
        </div>

        {/* Right: Directory Link & Auth Dialog */}
        <div className="flex shrink-0 items-center gap-1.5 sm:gap-3">
          <LanguageSwitcher />
          <Button variant="ghost" size="icon" aria-label="Notifications" className="hidden sm:inline-flex border border-white/20 rounded-full bg-zinc-900">
            <BellDot />
          </Button>
          <HeaderAuth />
          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                aria-label="Open navigation"
                className="size-9 rounded-full border-white/15 bg-white/[0.04] lg:hidden"
              >
                <Menu className="size-4" />
              </Button>
            </SheetTrigger>
            <SheetContent
              side="right"
              className="w-[min(82vw,320px)] border-white/10 bg-[#0b0b0b] text-white"
            >
              <SheetHeader className="border-b border-white/[0.07] px-5 py-5">
                <SheetTitle className="flex items-center gap-2.5 text-base text-white">
                  <Image src="/image/logo.png" alt="" height={28} width={28} className="size-7" unoptimized />
                  RankMyCountry
                </SheetTitle>
                <SheetDescription className="text-zinc-500">
                  Explore rankings and promote your brand.
                </SheetDescription>
              </SheetHeader>
              <nav className="flex flex-col gap-2 p-4" aria-label="Mobile navigation">
                <SheetClose asChild>
                  <Link
                    href="/countries"
                    className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-3.5 text-sm font-medium text-zinc-200 transition-colors hover:bg-white/[0.07] hover:text-white"
                  >
                    <Flag className="size-4 text-zinc-400" />
                    {t("allCountries")}
                  </Link>
                </SheetClose>
                <SheetClose asChild>
                  <Link
                    href="/sponsor"
                    className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-3.5 text-sm font-medium text-zinc-200 transition-colors hover:bg-white/[0.07] hover:text-white"
                  >
                    <Megaphone className="size-4 text-zinc-400" />
                    {t("advertise")}
                  </Link>
                </SheetClose>
                <SheetClose asChild>
                  <Link
                    href="/terms-and-conditions"
                    className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-3.5 text-sm font-medium text-zinc-200 transition-colors hover:bg-white/[0.07] hover:text-white"
                  >
                    <FileText className="size-4 text-zinc-400" />
                    {t("termsAndHowItWorks")}
                  </Link>
                </SheetClose>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
};
