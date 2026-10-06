import {getTranslations} from 'next-intl/server';
import {Link} from "@/i18n/navigation";

export default async function CountryNotFound() {
  const t=await getTranslations('UI');
  return (
    <div className="min-h-screen bg-[#0A0A0B] flex flex-col items-center justify-center p-6 text-center text-foreground">
      <div className="text-5xl mb-4">🌍</div>
      <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mb-2">
        {t('countryNotFound')}
      </h1>
      <p className="text-sm text-muted-foreground max-w-md mb-6">
        {t('noResults')}
      </p>
      <div className="flex gap-4">
        <Link
          href="/countries"
          className="rounded-xl bg-white/[0.08] hover:bg-white/[0.14] px-4 py-2 text-xs font-semibold text-white transition-colors"
        >
          {t('allCountries')}
        </Link>
        <Link
          href="/"
          className="rounded-xl border border-white/[0.08] px-4 py-2 text-xs font-semibold text-muted-foreground hover:text-white transition-colors"
        >
          {t('back')}
        </Link>
      </div>
    </div>
  );
}
