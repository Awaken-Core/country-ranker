import React from "react";
import {Link} from "@/i18n/navigation";
import {useTranslations} from 'next-intl';
import {LanguageSwitcher} from './language-switcher';
import { Globe } from "lucide-react";
import { HeaderAuth } from "@/components/header-auth";

export const SiteHeader: React.FC = () => {
  const t = useTranslations('UI');
  return (
    <header dir="ltr" className="h-14 shrink-0 border-b border-white/[0.08] bg-[#0A0A0A] w-full z-40 font-sans">
      <div className="h-full max-w-[1680px] mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        {/* Left: Wordmark with Globe icon */}
        <Link href="/" className="flex shrink-0 items-center gap-2.5 group">
          <div className="w-6 h-6 rounded-md flex items-center justify-center bg-blue-500/15 text-blue-400 border border-blue-500/30 group-hover:border-blue-400 group-hover:bg-blue-500/25 transition-all">
            <Globe className="size-3.5" />
          </div>
          <span className="max-[380px]:hidden text-sm font-semibold tracking-tight text-white group-hover:text-zinc-200 transition-colors">
            CountryRank
          </span>
          <span className="hidden lg:inline-block max-w-44 truncate text-[10px] font-mono tracking-widest text-zinc-500 uppercase border-l border-white/[0.08] pl-2.5 ml-1" title={t('standing')}>
            {t('standing')}
          </span>
        </Link>

        {/* Right: Directory Link & Auth Dialog */}
        <div className="flex shrink-0 items-center gap-1 sm:gap-4">
          <LanguageSwitcher />
          <Link
            href="/countries"
            className="hidden sm:block w-28 truncate text-center text-xs text-zinc-400 hover:text-white transition-colors font-medium px-2 py-1 rounded-md hover:bg-white/[0.05]"
            title={t('allCountries')}
          >
            {t('allCountries')}
          </Link>
          <div className="flex w-24 shrink-0 justify-end [&_button]:max-w-full [&_button]:truncate sm:w-40">
            <HeaderAuth />
          </div>
        </div>
      </div>
    </header>
  );
};
