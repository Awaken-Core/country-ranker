import React from "react";
import { Link } from "@/i18n/navigation";
import { BellDot, Globe } from "lucide-react";
import { useTranslations } from "next-intl";
import { HeaderAuth } from "@/components/header-auth";
import { LanguageSwitcher } from "./language-switcher";
import { Button } from "../ui/button";

export const SiteHeader: React.FC = () => {
  const t = useTranslations("UI");
  return (
    <header dir="ltr" className="h-12 shrink-0 z-40 font-sans shadow-[0_16px_60px_rgba(0,0,0,0.35)]">
      <div className="h-full flex items-center justify-between">
        {/* Left: Wordmark with Globe icon */}
        <div className="flex items-center gap-1 group">
          <Link href="/" className="flex items-center gap-1 group">
            <div className="w-6 h-6 rounded-md flex items-center justify-center transition-all">
              <Globe className="size-3.5" />
            </div>
            <span className="text-[16px] font-medium tracking-[-0.1px] text-white group-hover:text-zinc-200 transition-colors">
              RankMyCountry
            </span>
          </Link>

          <div className="flex items-center gap-4 group px-6">
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
          </div>
        </div>

        {/* Right: Directory Link & Auth Dialog */}
        <div className="flex items-center gap-2 sm:gap-3">
          <LanguageSwitcher />
          <Button variant="ghost" className="border border-white/20 rounded-full bg-zinc-900">
            <BellDot />
          </Button>
          <HeaderAuth />
        </div>
      </div>
    </header>
  );
};
