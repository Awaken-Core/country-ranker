'use client';

import {useLocale} from 'next-intl';
import {useTransition} from 'react';
import {Globe} from 'lucide-react';
import {usePathname, useRouter} from '@/i18n/navigation';
import {locales} from '@/i18n/routing';

const names: Record<string, string> = {
  en: 'English', hi: 'हिन्दी', ar: 'العربية', es: 'Español', fr: 'Français', de: 'Deutsch',
  pt: 'Português', ru: 'Русский', zh: '中文', ja: '日本語', ko: '한국어', id: 'Bahasa Indonesia',
  tr: 'Türkçe', it: 'Italiano', vi: 'Tiếng Việt', th: 'ไทย'
};

export function LanguageSwitcher() {
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return (
    <label className="flex h-8 w-28 shrink-0 items-center gap-1 rounded-md border border-white/10 px-2 py-1 text-xs text-zinc-300 sm:w-36">
      <Globe aria-hidden="true" className="size-3.5 shrink-0" />
      <select
        aria-label="Language / भाषा"
        value={locale}
        disabled={pending}
        dir="auto"
        className="min-w-0 w-full bg-[#0A0A0A] text-xs outline-none focus-visible:ring-2 focus-visible:ring-blue-400 disabled:opacity-50"
        onChange={(event) => {
          const nextLocale = event.target.value;
          startTransition(() => router.replace(
            `${pathname}${window.location.search}${window.location.hash}`,
            {locale: nextLocale, scroll: false}
          ));
        }}
      >
        {locales.map((value) => <option key={value} value={value}>{names[value]}</option>)}
      </select>
    </label>
  );
}
