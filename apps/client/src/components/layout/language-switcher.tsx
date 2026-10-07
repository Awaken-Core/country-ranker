'use client';

import {useLocale} from 'next-intl';
import {useTransition} from 'react';
import {Globe} from 'lucide-react';
import {usePathname, useRouter} from '@/i18n/navigation';
import {locales} from '@/i18n/routing';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

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
    <Select
      value={locale}
      disabled={pending}
      onValueChange={(nextLocale) => {
        startTransition(() => router.replace(
          `${pathname}${window.location.search}${window.location.hash}`,
          {locale: nextLocale, scroll: false}
        ));
      }}
    >
      <SelectTrigger
        aria-label="Language / भाषा"
        className="h-8 w-28 shrink-0 gap-1 border-white/10 bg-[#0A0A0A] px-2 text-xs text-zinc-300 sm:w-36"
      >
        <Globe aria-hidden="true" className="size-3.5 shrink-0" />
        <SelectValue />
      </SelectTrigger>
      <SelectContent className="max-h-72 min-w-(--radix-select-trigger-width) bg-[#0A0A0A] text-zinc-200">
        {locales.map((value) => (
          <SelectItem key={value} value={value} dir="auto">
            {names[value]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
